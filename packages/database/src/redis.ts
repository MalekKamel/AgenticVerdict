import { Redis } from "@upstash/redis";

/**
 * REST-based Upstash Redis client when `UPSTASH_REDIS_REST_URL` and
 * `UPSTASH_REDIS_REST_TOKEN` are set; otherwise `null` (caller uses L1 cache only).
 */
export function createUpstashRedisFromEnv(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }
  return new Redis({ url, token });
}
