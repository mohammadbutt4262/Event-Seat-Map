type Bucket = {
  capacity: number;
  tokens: number;
  lastRefill: number;
  refillRatePerMs: number; // tokens per ms
};

const now = () => Date.now();

function refillBucket(b: Bucket) {
  const t = now();
  const elapsed = t - b.lastRefill;
  const add = elapsed * b.refillRatePerMs;
  if (add > 0) {
    b.tokens = Math.min(b.capacity, b.tokens + add);
    b.lastRefill = t;
  }
}

const ipBuckets = new Map<string, { minute: Bucket; tenSec: Bucket }>();

export function rateLimiterMiddleware(req: any, res: any, next: any) {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress || "unknown";

  let entry = ipBuckets.get(ip);
  if (!entry) {
    entry = {
      minute: {
        capacity: 10,
        tokens: 10,
        lastRefill: now(),
        refillRatePerMs: 10 / (60 * 1000) // 10 tokens per 60s
      },
      tenSec: {
        capacity: 5,
        tokens: 5,
        lastRefill: now(),
        refillRatePerMs: 5 / (10 * 1000) // 5 tokens per 10s
      }
    };
    ipBuckets.set(ip, entry);
  }

  refillBucket(entry.minute);
  refillBucket(entry.tenSec);

  if (entry.minute.tokens >= 1 && entry.tenSec.tokens >= 1) {
    entry.minute.tokens -= 1;
    entry.tenSec.tokens -= 1;
    next();
  } else {
    res.status(429).json({ error: "Rate limit exceeded. Max 10 requests per minute and burst 5 per 10s." });
  }

  // periodic cleanup (very simple)
  if (ipBuckets.size > 5000) {
    // remove entries whose minute.tokens are full (idle)
    for (const [k, v] of ipBuckets) {
      if (v.minute.tokens >= v.minute.capacity && v.tenSec.tokens >= v.tenSec.capacity) {
        ipBuckets.delete(k);
      }
    }
  }
}
