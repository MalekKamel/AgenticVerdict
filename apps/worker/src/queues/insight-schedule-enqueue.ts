import { randomUUID } from "node:crypto";

import type { Queue } from "bullmq";

import type { InsightExecutionJobData } from "@agenticverdict/types";

/** Minimal queue surface for schedule ticks (avoids import cycles). */
export type InsightExecutionQueueAdd = Pick<Queue<InsightExecutionJobData>, "add">;

export async function enqueueScheduledInsightExecution(
  executionQueue: InsightExecutionQueueAdd,
  data: { tenantId: string; insightId: string; scheduleId: string },
): Promise<{ jobId: string }> {
  const jobId = randomUUID();
  await executionQueue.add(
    `scheduled-insight-${data.scheduleId}`,
    {
      tenantId: data.tenantId,
      insightId: data.insightId,
      requestId: `scheduled-${jobId}`,
    },
    { removeOnComplete: 1000 },
  );
  return { jobId };
}
