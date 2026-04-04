import { Redis } from "@upstash/redis";

/**
 * REST-based Upstash Redis when env is configured; otherwise `null` (use {@link MemoryPlatformCache}).
 */
export function createOptionalUpstashRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }
  return new Redis({ url, token });
}
