import { randomUUID } from "node:crypto";
import { Queue } from "bullmq";
import type IORedis from "ioredis";
import { INSIGHT_EXECUTION_QUEUE, INSIGHT_SCHEDULE_QUEUE } from "./queue-names";
import type { InsightExecutionJobData, InsightScheduleTickJobData } from "@agenticverdict/types";
import { createBullmqConnectionFromEnv } from "./redis-connection";

/**
 * Process an insight schedule tick.
 * Enqueues an insight execution job to the INSIGHT_EXECUTION_QUEUE.
 */
export async function defaultInsightScheduleProcessor(
  data: InsightScheduleTickJobData,
): Promise<void> {
  const conn = createBullmqConnectionFromEnv();
  if (!conn) {
    throw new Error("Redis connection not available");
  }

  const queue = new Queue<InsightExecutionJobData>(INSIGHT_EXECUTION_QUEUE, { connection: conn });

  const jobData: InsightExecutionJobData = {
    tenantId: data.tenantId,
    insightId: data.insightId,
    requestId: `schedule:${data.scheduleId}:${randomUUID()}`,
  };

  try {
    await queue.add("insight-execution", jobData, { removeOnComplete: 1000 });
  } finally {
    await queue.close();
  }
}

/**
 * Create an insight schedule queue for use in worker registration.
 */
export function createInsightScheduleQueue(connection: IORedis): Queue<InsightScheduleTickJobData> {
  return new Queue<InsightScheduleTickJobData>(INSIGHT_SCHEDULE_QUEUE, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  });
}
