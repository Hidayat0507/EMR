// Simple in-memory rate limiter (best-effort). For serverless, use an external store.
const WINDOW_MS = 60_000; // 1 minute
const MAX_PER_WINDOW = 30; // 30 requests per minute per key

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function isRateLimited(key: string, max = MAX_PER_WINDOW, windowMs = WINDOW_MS): boolean {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (existing.count >= max) return true;
  existing.count += 1;
  return false;
}


