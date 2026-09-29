/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * NOTE (honesty): on Vercel serverless each warm instance keeps its own map,
 * so limits are enforced per instance, not globally — this raises the cost of
 * naive scraping but is not a hard global quota. For strict global limits a
 * shared store (e.g. Upstash Redis) would be required.
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

// Periodically drop stale keys so the map does not grow unbounded.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (b.timestamps.length === 0) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds the caller should wait before retrying (when ok = false). */
  retryAfter: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  let b = buckets.get(key);
  if (!b) {
    b = { timestamps: [] };
    buckets.set(key, b);
  }
  const cutoff = now - windowMs;
  b.timestamps = b.timestamps.filter((t) => t > cutoff);
  if (b.timestamps.length >= limit) {
    const oldest = b.timestamps[0];
    return { ok: false, retryAfter: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
  }
  b.timestamps.push(now);
  return { ok: true, retryAfter: 0 };
}

/** Best-effort client identifier: session user id when logged in, else IP. */
export function clientKey(userId: string | null, request: Request): string {
  if (userId) return `u:${userId}`;
  const fwd = request.headers.get('x-forwarded-for');
  const ip = fwd ? fwd.split(',')[0].trim() : 'unknown';
  return `ip:${ip}`;
}
