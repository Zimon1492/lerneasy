// Simple in-memory rate limiter
// Resets on server restart — sufficient for basic protection on a single-instance deployment.
// For multi-instance (e.g. Vercel with many functions), use Redis-based rate limiting instead.

const store = new Map<string, { count: number; resetAt: number }>();

/**
 * Returns true if the request should be allowed, false if rate limit exceeded.
 * @param key      Unique key (e.g. IP address + route)
 * @param limit    Max requests allowed in the window
 * @param windowMs Window size in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}
