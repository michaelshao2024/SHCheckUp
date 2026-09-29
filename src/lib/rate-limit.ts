import { prisma } from './prisma';

/**
 * Rate limiting for public data APIs (anti-scraping).
 *
 * Primary path: fixed-window counters stored in Postgres (rate_limits table),
 * which makes limits GLOBAL across all Vercel serverless instances — a scraper
 * cannot bypass the cap by landing on a fresh instance.
 *
 * Fallback: if the DB is unavailable, an in-memory per-instance sliding window
 * keeps the site functional (fail-open) with best-effort limiting.
 */

interface Bucket {
  timestamps: number[];
}
const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function memoryLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (now - lastSweep >= 60_000) {
    lastSweep = now;
    for (const [k, b] of buckets) if (b.timestamps.length === 0) buckets.delete(k);
  }
  let b = buckets.get(key);
  if (!b) {
    b = { timestamps: [] };
    buckets.set(key, b);
  }
  const cutoff = now - windowMs;
  b.timestamps = b.timestamps.filter((t) => t > cutoff);
  if (b.timestamps.length >= limit) return false;
  b.timestamps.push(now);
  return true;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number; // seconds
}

/**
 * DB-backed fixed-window rate limit.
 * Window id = `<key>:<windowStartMs>`; each hit atomically increments `count`.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const id = `${key}:${windowStart}`;
  try {
    if (!prisma) throw new Error('no db');
    const row = await prisma.rateLimit.upsert({
      where: { id },
      create: { id, count: 1 },
      update: { count: { increment: 1 } },
    });
    if (row.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((windowStart + windowMs - now) / 1000));
      return { ok: false, retryAfter };
    }
    // Cheap occasional cleanup of old windows (~1% of requests).
    if (Math.random() < 0.01) {
      const cutoff = new Date(now - 10 * windowMs);
      prisma.rateLimit.deleteMany({ where: { createdAt: { lt: cutoff } } }).catch(() => {});
    }
    return { ok: true, retryAfter: 0 };
  } catch {
    // Fail-open with per-instance limiting so the site stays usable.
    return { ok: memoryLimit(key, limit, windowMs), retryAfter: 60 };
  }
}

/** Best-effort client identifier: session user id when logged in, else IP. */
export function clientKey(userId: string | null, request: Request): string {
  if (userId) return `u:${userId}`;
  const fwd = request.headers.get('x-forwarded-for');
  const ip = fwd ? fwd.split(',')[0].trim() : 'unknown';
  return `ip:${ip}`;
}
