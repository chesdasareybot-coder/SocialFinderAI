/**
 * src/lib/rate-limit.ts
 *
 * Lightweight, in-memory token-bucket rate limiter.
 * Protects endpoints from burst spam without external dependencies.
 */

interface RateLimitOptions {
  key: string;
  maxRequests: number;
  windowMs: number;
  cost?: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetMs: number;
}

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const memoryStore = new Map<string, Bucket>();

function memoryConsume(
  key: string,
  maxRequests: number,
  windowMs: number,
  cost = 1,
): RateLimitResult {
  const now = Date.now();
  let bucket = memoryStore.get(key);

  if (!bucket) {
    bucket = { tokens: maxRequests, lastRefill: now };
    memoryStore.set(key, bucket);
  }

  // Refill tokens proportionally to elapsed time
  const elapsed = now - bucket.lastRefill;
  if (elapsed > 0) {
    const refillRate = maxRequests / windowMs;
    bucket.tokens = Math.min(maxRequests, bucket.tokens + elapsed * refillRate);
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= cost) {
    bucket.tokens -= cost;
    return {
      success: true,
      remaining: Math.floor(bucket.tokens),
      resetMs: 0,
    };
  }

  const needed = cost - bucket.tokens;
  const refillRate = maxRequests / windowMs;
  const resetMs = Math.ceil(needed / refillRate);

  return {
    success: false,
    remaining: 0,
    resetMs,
  };
}

/** Check and consume a rate-limit token */
export async function rateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  return memoryConsume(opts.key, opts.maxRequests, opts.windowMs, opts.cost ?? 1);
}

/** Extract caller's IP from request headers */
export function getCallerIp(req: Request): string {
  const headers = req.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "127.0.0.1"
  );
}
