import IORedis from "ioredis";

/**
 * TCP Redis connection for BullMQ (`REDIS_URL`). Upstash REST clients are not compatible with BullMQ.
 */
export function createBullmqConnectionFromEnv(): IORedis | null {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    return null;
  }
  return new IORedis(url, { maxRetriesPerRequest: null });
}
