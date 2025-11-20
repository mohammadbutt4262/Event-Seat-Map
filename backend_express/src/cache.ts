import { User, CacheStats } from "./types";

type CacheEntry = {
  value: User;
  expiresAt: number;
};

export class LRUCache {
  private map = new Map<number, CacheEntry>(); // insertion order used to track LRU
  private maxEntries: number;
  private ttlMs: number;
  stats: CacheStats = { hits: 0, misses: 0, requests: 0, totalResponseTimeMs: 0 };

  constructor(opts?: { maxEntries?: number; ttlSeconds?: number }) {
    this.maxEntries = opts?.maxEntries ?? 1000;
    this.ttlMs = (opts?.ttlSeconds ?? 60) * 1000;
    // background cleaner
    setInterval(() => this.clearExpired(), 5000).unref();
  }

  private now() {
    return Date.now();
  }

  get size() {
    return this.map.size;
  }

  get(id: number): User | undefined {
    const e = this.map.get(id);
    if (!e) return undefined;
    if (e.expiresAt < this.now()) {
      this.map.delete(id);
      return undefined;
    }
    // refresh LRU: move to end
    this.map.delete(id);
    this.map.set(id, e);
    return e.value;
  }

  has(id: number) {
    const e = this.map.get(id);
    return !!e && e.expiresAt >= this.now();
  }

  set(id: number, value: User) {
    // only set if not present (per requirement: update cache only if not already cached)
    if (this.has(id)) return;
    if (this.map.size >= this.maxEntries) {
      // evict least recently used (first key)
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) this.map.delete(firstKey);
    }
    this.map.set(id, { value, expiresAt: this.now() + this.ttlMs });
  }

  delete(id: number) {
    this.map.delete(id);
  }

  clear() {
    this.map.clear();
    this.stats = { hits: 0, misses: 0, requests: 0, totalResponseTimeMs: 0 };
  }

  clearExpired() {
    const now = this.now();
    for (const [k, v] of Array.from(this.map.entries())) {
      if (v.expiresAt < now) this.map.delete(k);
    }
  }

  recordHit() {
    this.stats.hits++;
    this.stats.requests++;
  }

  recordMiss() {
    this.stats.misses++;
    this.stats.requests++;
  }

  recordResponseTime(ms: number) {
    this.stats.totalResponseTimeMs += ms;
  }

  getStats() {
    const avg = this.stats.requests === 0 ? 0 : this.stats.totalResponseTimeMs / this.stats.requests;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.size,
      requests: this.stats.requests,
      avgResponseTimeMs: avg
    };
  }
}
