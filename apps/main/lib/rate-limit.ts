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
    // 每次都嘗試設 TTL，但用 "NX"（只在 key 還沒有 TTL 時才設）：
    // - 保留 fixed-window 語義（不會每次刷新延長視窗）
    // - 即使某次 incr 後的 expire 漏掉/失敗，後續請求會補上 TTL，
    //   避免 key 永久存在、count 一路累加把該 IP 永久封鎖
    await kv.expire(kvKey, windowSeconds, "NX");
    return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
  } catch (err) {
    console.error("Rate limit check failed (fail open):", err);
    return { allowed: true, remaining: limit };
  }
}
