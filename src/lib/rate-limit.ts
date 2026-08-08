/**
 * Minimal fixed-window rate limiter (BUILD-SPEC §13, checklist "Rate limit login / reset").
 *
 * In-memory by design: it needs no infra and is enough for a single instance and
 * local dev. For multi-instance production, swap the store for Upstash Redis
 * (env vars `UPSTASH_REDIS_REST_*` are already reserved) without changing callers.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  /** Epoch ms when the current window resets. */
  reset: number;
};

export type RateLimitOptions = {
  /** Max attempts allowed within the window. Default 5. */
  limit?: number;
  /** Window length in ms. Default 60_000. */
  windowMs?: number;
};

export async function rateLimit(
  key: string,
  { limit = 5, windowMs = 60_000 }: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, reset: resetAt };
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, reset: existing.resetAt };
  }

  existing.count += 1;
  return { success: true, remaining: limit - existing.count, reset: existing.resetAt };
}
