// Rate limiter with two backends:
//
//  1. Upstash Redis (REST) — used automatically when UPSTASH_REDIS_REST_URL and
//     UPSTASH_REDIS_REST_TOKEN are set. The count is shared by every serverless instance,
//     so the limit really holds on Vercel under heavy traffic. Free tier is plenty.
//  2. In-memory Map — fallback for local dev / a single long-running server. On serverless
//     each instance has its own Map, so this is only a best-effort speed bump there.
//
// If Redis is configured but unreachable we fail OPEN (allow the request): a rate-limit
// outage must never stop customers from ordering.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export type RateLimitResult = { allowed: boolean; retryAfterMs: number };

function memoryLimit(key: string, maxAttempts: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= maxAttempts) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

async function redisLimit(key: string, maxAttempts: number, windowMs: number): Promise<RateLimitResult> {
  // Fixed window: INCR the counter; the first hit also sets the expiry.
  const redisKey = `rl:${key}`;
  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["PEXPIRE", redisKey, String(windowMs), "NX"],
      ["PTTL", redisKey],
    ]),
    // Never let a slow Redis hold up checkout.
    signal: AbortSignal.timeout(800),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Redis rate-limit HTTP ${res.status}`);
  const out = (await res.json()) as { result?: number }[];
  const count = Number(out[0]?.result ?? 0);
  const ttl = Number(out[2]?.result ?? windowMs);
  if (count > maxAttempts) return { allowed: false, retryAfterMs: ttl > 0 ? ttl : windowMs };
  return { allowed: true, retryAfterMs: 0 };
}

export async function rateLimit(key: string, maxAttempts: number, windowMs: number): Promise<RateLimitResult> {
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      return await redisLimit(key, maxAttempts, windowMs);
    } catch (err) {
      console.error("[rate-limit] Redis unavailable, failing open:", err);
      return { allowed: true, retryAfterMs: 0 };
    }
  }
  return memoryLimit(key, maxAttempts, windowMs);
}

// Periodically clear stale entries so this Map doesn't grow forever on a long-running server.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}, 5 * 60_000).unref?.();

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
