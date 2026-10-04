/** Bounded, per-process defence; shared limits remain a deployment requirement. */
export function createRateLimitStore({ windowMs = 600_000, limit = 5, maxKeys = 10_000 } = {}) {
  const buckets = new Map<string, { count: number; expires: number }>();
  let nextSweep = 0;
  return {
    allow(key: string, now = Date.now()) {
      if (now >= nextSweep) {
        for (const [id, bucket] of buckets) if (bucket.expires <= now) buckets.delete(id);
        nextSweep = now + Math.min(windowMs, 60_000);
      }
      const existing = buckets.get(key);
      if (existing && existing.expires > now) {
        if (existing.count >= limit) return false;
        existing.count++;
        return true;
      }
      if (!existing && buckets.size >= maxKeys) return false;
      buckets.set(key, { count: 1, expires: now + windowMs });
      return true;
    },
    clear() {
      buckets.clear();
      nextSweep = 0;
    },
    get size() {
      return buckets.size;
    },
  };
}
