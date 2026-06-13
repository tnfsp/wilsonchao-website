import { kv } from "@vercel/kv";

type RateLimitOptions = {
  /** 視窗內允許的請求數 */
  limit: number;
  /** 視窗長度（秒） */
  windowSeconds: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
};

/**
 * Fixed-window rate limit，狀態存 @vercel/kv（incr + expire）。
 *
 * KV 出錯時 fail open（放行）——寧可短暫被濫用，
 * 也不要因為 KV 故障把真的訂閱者擋在門外。
 */
export async function rateLimit(
  key: string,
  { limit, windowSeconds }: RateLimitOptions
): Promise<RateLimitResult> {
  const kvKey = `rate-limit:${key}`;
  try {
    const count = await kv.incr(kvKey);
    if (count === 1) {
      await kv.expire(kvKey, windowSeconds);
    }
    return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
  } catch (err) {
    console.error("Rate limit check failed (fail open):", err);
    return { allowed: true, remaining: limit };
  }
}
