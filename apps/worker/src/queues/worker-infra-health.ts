import type IORedis from "ioredis";
import type { Queue } from "bullmq";

export interface BullmqRedisHealth {
  redisConfigured: boolean;
  pingMs: number | null;
  error: string | null;
}

export async function checkBullmqRedisHealth(
  connection: IORedis | null,
): Promise<BullmqRedisHealth> {
  if (!connection) {
    return { redisConfigured: false, pingMs: null, error: "REDIS_URL is not set" };
  }
  const started = Date.now();
  try {
    await connection.ping();
    return { redisConfigured: true, pingMs: Date.now() - started, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { redisConfigured: true, pingMs: null, error: message };
  }
}

export interface QueueCountSnapshot {
  name: string;
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
}

export async function snapshotQueueCounts(queue: Queue): Promise<QueueCountSnapshot> {
  const counts = await queue.getJobCounts("waiting", "active", "delayed", "failed");
  return {
    name: queue.name,
    waiting: counts.waiting ?? 0,
    active: counts.active ?? 0,
    delayed: counts.delayed ?? 0,
    failed: counts.failed ?? 0,
  };
}
