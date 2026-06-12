/**
 * Rate limiter with Vercel KV (distributed) + in-memory fallback.
 *
 * - If KV_REST_API_URL + KV_REST_API_TOKEN are set, uses @vercel/kv with a
 *   fixed-window counter, so limits hold across multiple serverless instances.
 * - Otherwise falls back to the previous in-memory Map behavior (per-instance),
 *   logging a console.warn once at initialization.
 *
 * Usage (per route, preserving each route's own parameters):
 *
 *   const { allowed } = await rateLimit(`chat:${ip}`, {
 *     limit: 20,
 *     windowMs: 10 * 60 * 1000,
 *   });
 *   if (!allowed) return new Response("Too Many Requests", { status: 429 });
 */

import { kv } from "@vercel/kv";

export interface RateLimitOptions {
  /** Max number of requests allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Requests remaining in the current window (0 when blocked). */
  remaining: number;
}

const hasKV = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
);

let warnedAboutMemoryFallback = false;
function warnMemoryFallbackOnce() {
  if (warnedAboutMemoryFallback) return;
  warnedAboutMemoryFallback = true;
  console.warn(
    "[rate-limit] KV_REST_API_URL / KV_REST_API_TOKEN not set — falling back " +
      "to in-memory rate limiting. Limits will not be shared across serverless instances.",
  );
}

// ── In-memory fallback (same semantics as the previous per-route Maps) ──────

const memoryStore = new Map<string, { count: number; windowStart: number }>();

function rateLimitInMemory(
  identifier: string,
  { limit, windowMs }: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(identifier);

  if (!entry || now - entry.windowStart > windowMs) {
    memoryStore.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}

// ── Distributed fixed-window via Vercel KV ──────────────────────────────────

async function rateLimitWithKV(
  identifier: string,
  { limit, windowMs }: RateLimitOptions,
): Promise<RateLimitResult> {
  // Fixed window: bucket the clock into windows of `windowMs`.
  const bucket = Math.floor(Date.now() / windowMs);
  const key = `rate-limit:${identifier}:${bucket}`;

  const count = await kv.incr(key);
  if (count === 1) {
    // First hit in this window — set the key to expire when the window ends
    // (plus a small buffer so in-flight requests still see it).
    await kv.pexpire(key, windowMs + 1000);
  }

  if (count > limit) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: limit - count };
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  if (!hasKV) {
    warnMemoryFallbackOnce();
    return rateLimitInMemory(identifier, options);
  }

  try {
    return await rateLimitWithKV(identifier, options);
  } catch (err) {
    // KV outage shouldn't take the route down — degrade to in-memory.
    console.error("[rate-limit] KV error, falling back to in-memory:", err);
    return rateLimitInMemory(identifier, options);
  }
}
