import { randomUUID } from "node:crypto";

import type { Queue } from "bullmq";

import type { ReportGenerationJobData, ReportScheduleJobData } from "./job-types";

/** Minimal queue surface for schedule ticks (avoids import cycles in production-flow scenarios). */
export type ReportGenerationQueueAdd = Pick<Queue<ReportGenerationJobData>, "add">;

export async function enqueueScheduledReportGeneration(
  generationQueue: ReportGenerationQueueAdd,
  data: ReportScheduleJobData,
): Promise<{ reportId: string }> {
  const reportId = randomUUID();
  await generationQueue.add(
    `scheduled-${data.scheduleId}`,
    {
      tenantId: data.tenantId,
      reportId,
      format: data.format,
      templateId: data.templateId,
      locale: data.locale,
      textDirection: data.textDirection,
    },
    { removeOnComplete: 1000 },
  );
  return { reportId };
}
