import type { FastifyReply, FastifyRequest } from "fastify";
import type { Redis } from "@upstash/redis";

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
  perTenant?: boolean;
}

type WindowState = { count: number; resetAt: number };

const memoryWindows = new Map<string, WindowState>();

function memoryRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  let w = memoryWindows.get(key);
  if (!w || now >= w.resetAt) {
    w = { count: 0, resetAt: now + windowMs };
    memoryWindows.set(key, w);
  }
  w.count += 1;
  if (w.count > maxRequests) {
    const retryAfterSec = Math.max(1, Math.ceil((w.resetAt - now) / 1000));
    return { ok: false, retryAfterSec };
  }
  return { ok: true };
}

async function redisRateLimit(
  redis: Redis,
  key: string,
  windowSec: number,
  maxRequests: number,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSec);
  }
  if (count > maxRequests) {
    const ttl = await redis.ttl(key);
    const retryAfterSec = ttl > 0 ? ttl : windowSec;
    return { ok: false, retryAfterSec };
  }
  return { ok: true };
}

/**
 * Per-tenant fixed-window rate limiting. Uses Upstash when `redis` is set; otherwise in-memory (single instance only).
 */
export function rateLimit(redis: Redis | null, options: RateLimitOptions) {
  const windowSec = Math.max(1, Math.ceil(options.windowMs / 1000));

  return async function rateLimitMiddleware(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const tenantId = request.auth?.tenantId ?? "anonymous";
    const keySuffix = options.perTenant === false ? "global" : tenantId;
    const key = `rl:${options.keyPrefix}:${keySuffix}`;

    const result = redis
      ? await redisRateLimit(redis, key, windowSec, options.maxRequests)
      : memoryRateLimit(key, options.windowMs, options.maxRequests);

    if (!result.ok) {
      return reply
        .header("Retry-After", String(result.retryAfterSec))
        .status(429)
        .send({
          error: {
            code: "rate_limited",
            message: "Too many requests for this tenant",
            details: { retryAfterSec: result.retryAfterSec },
          },
          requestId: request.id,
        });
    }
  };
}
