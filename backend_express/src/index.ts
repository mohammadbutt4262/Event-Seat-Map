import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { LRUCache } from "./cache";
import { rateLimiterMiddleware } from "./rateLimiter";
import { SimpleQueue } from "./queue";
import { mockUsers, createUser } from "./mockData";
import { User } from "./types";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// components
const cache = new LRUCache({ maxEntries: 1000, ttlSeconds: 60 });
const queue = new SimpleQueue(8); // worker concurrency 8

// pending map to dedupe concurrent fetches
const pendingFetches = new Map<number, Promise<User | null>>();

// Helper to fetch user via queue with dedupe
function fetchUserDedup(id: number): Promise<User | null> {
  // if in cache, return immediately (caller should check cache first ideally)
  // if already pending, return same promise
  const existing = pendingFetches.get(id);
  if (existing) return existing;

  const p = new Promise<User | null>((resolve, reject) => {
    queue.push({
      id,
      resolve,
      reject
    });
  }).finally(() => {
    // clear pending after completion
    pendingFetches.delete(id);
  });

  pendingFetches.set(id, p);
  return p;
}

// response time measurement middleware to collect avg time in cache.stats
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    cache.recordResponseTime(ms);
  });
  next();
});

// rate limiter applied to relevant endpoints
app.use(rateLimiterMiddleware);

// GET /users/:id
app.get("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  // check cache
  const cached = cache.get(id);
  if (cached) {
    cache.recordHit();
    return res.json({ source: "cache", user: cached });
  }
  cache.recordMiss();

  try {
    const user = await fetchUserDedup(id);
    if (!user) return res.status(404).json({ error: `User ${id} not found` });

    // only set cache if not already cached (LRUCache.set already does that check)
    cache.set(id, user);

    return res.json({ source: "db", user });
  } catch (err) {
    return res.status(500).json({ error: "Internal error", details: String(err) });
  }
});

// POST /users -> create & cache
app.post("/users", (req, res) => {
  const body = req.body;
  if (!body?.name || !body?.email) return res.status(400).json({ error: "name and email required" });

  const created = createUser({ name: body.name, email: body.email });
  // cache new user immediately
  cache.set(created.id, created);
  return res.status(201).json({ user: created });
});

// DELETE /cache -> clear cache
app.delete("/cache", (req, res) => {
  cache.clear();
  return res.status(200).json({ ok: true });
});

// GET /cache-status
app.get("/cache-status", (req, res) => {
  const st = cache.getStats();
  return res.json(st);
});

// health
app.get("/health", (req, res) => res.send({ status: "ok" }));

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening ${PORT}`);
});
