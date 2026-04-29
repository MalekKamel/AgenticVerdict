import type { ReportFormat } from "@agenticverdict/report-generator";
import { AppFault } from "@agenticverdict/core";
import {
  createBullmqConnectionFromEnv,
  createReportDeliveryQueue,
  createReportScheduleQueue,
  createWorkflowTriggerQueue,
  type ReportDeliveryJobData,
  type ReportScheduleJobData,
  type WorkflowTriggerJobData,
  type WorkflowTriggerJobResult,
} from "@agenticverdict/worker";

let cachedConnection: ReturnType<typeof createBullmqConnectionFromEnv> | undefined;

export function resetBullmqConnectionForTests(): void {
  void cachedConnection?.quit().catch(() => undefined);
  cachedConnection = undefined;
}

function getConnection() {
  if (cachedConnection === undefined) {
    cachedConnection = createBullmqConnectionFromEnv();
  }
  return cachedConnection;
}

export function isBullmqConfigured(): boolean {
  return Boolean(process.env.REDIS_URL?.trim());
}

/** Shared TCP Redis client for BullMQ and delivery suppression (null when `REDIS_URL` unset). */
export function getBullmqRedisConnection(): ReturnType<typeof createBullmqConnectionFromEnv> {
  return getConnection();
}

function repeatKeyForSchedule(scheduleId: string): string {
  return `report-schedule:${scheduleId}`;
}

export async function enqueueReportDelivery(data: ReportDeliveryJobData): Promise<string> {
  const conn = getConnection();
  if (!conn) {
    throw new AppFault({
      code: "QUEUE_UNAVAILABLE",
      category: "dependency",
      httpStatus: 503,
      retryable: true,
      safeMessage: "Queue infrastructure is unavailable.",
      surface: "queue",
    });
  }
  const q = createReportDeliveryQueue(conn);
  try {
    const job = await q.add("email", data, { removeOnComplete: 1000 });
    return typeof job.id === "string" ? job.id : String(job.id);
  } finally {
    await q.close();
  }
}

export async function registerScheduleRepeatableJob(record: {
  id: string;
  tenantId: string;
  cronExpression: string;
  templateId: string;
  format: ReportFormat;
  locale?: string | undefined;
  textDirection?: "ltr" | "rtl" | undefined;
}): Promise<void> {
  const conn = getConnection();
  if (!conn) {
    throw new AppFault({
      code: "QUEUE_UNAVAILABLE",
      category: "dependency",
      httpStatus: 503,
      retryable: true,
      safeMessage: "Queue infrastructure is unavailable.",
      surface: "queue",
    });
  }
  const q = createReportScheduleQueue(conn);
  const payload: ReportScheduleJobData = {
    tenantId: record.tenantId,
    scheduleId: record.id,
    cronExpression: record.cronExpression,
    templateId: record.templateId,
    format: record.format,
    locale: record.locale,
    textDirection: record.textDirection,
  };
  try {
    await q.add("scheduled-run", payload, {
      repeat: { pattern: record.cronExpression, key: repeatKeyForSchedule(record.id) },
    });
  } finally {
    await q.close();
  }
}

export async function unregisterScheduleRepeatableJob(scheduleId: string): Promise<void> {
  const conn = getConnection();
  if (!conn) {
    return;
  }
  const q = createReportScheduleQueue(conn);
  try {
    await q.removeRepeatableByKey(repeatKeyForSchedule(scheduleId));
  } catch {
    /* idempotent */
  } finally {
    await q.close();
  }
}

export async function enqueueWorkflowTrigger(
  data: WorkflowTriggerJobData,
  jobId?: string,
): Promise<string> {
  const conn = getConnection();
  if (!conn) {
    throw new AppFault({
      code: "QUEUE_UNAVAILABLE",
      category: "dependency",
      httpStatus: 503,
      retryable: true,
      safeMessage: "Queue infrastructure is unavailable.",
      surface: "queue",
    });
  }
  const q = createWorkflowTriggerQueue(conn);
  try {
    const job = await q.add(
      "workflow-trigger",
      data,
      jobId ? { jobId, removeOnComplete: 1000 } : { removeOnComplete: 1000 },
    );
    return typeof job.id === "string" ? job.id : String(job.id);
  } finally {
    await q.close();
  }
}

export type WorkflowTriggerJobState =
  | "completed"
  | "failed"
  | "active"
  | "waiting"
  | "delayed"
  | "paused"
  | "unknown";

export interface WorkflowTriggerStatusPayload {
  executionId: string;
  tenantId?: string;
  status: WorkflowTriggerJobState;
  bullmqState: string;
  /** BullMQ `job.timestamp` (ms) when the job was created */
  queuedAtMs?: number;
  /** BullMQ `job.processedOn` (ms) when processing started */
  startedAtMs?: number;
  /** BullMQ `job.finishedOn` (ms) when the job finished */
  finishedAtMs?: number;
  /** `finishedOn - processedOn` when both are set */
  durationMs?: number;
  result?: WorkflowTriggerJobResult;
  error?: string;
}

export async function getWorkflowTriggerJobStatus(
  executionId: string,
): Promise<WorkflowTriggerStatusPayload | null> {
  const conn = getConnection();
  if (!conn) {
    return null;
  }
  const q = createWorkflowTriggerQueue(conn);
  try {
    // BullMQ may not return the job from `getJob` for a few milliseconds right after `add`
    // (observed as 404 on the first status poll). Brief retries avoid flaky manual/automation polls.
    let job = await q.getJob(executionId);
    for (let attempt = 0; attempt < 5 && !job; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      job = await q.getJob(executionId);
    }
    if (!job) {
      return null;
    }
    const state = await job.getState();
    const stateStr = state as string;
    const failedReason = typeof job.failedReason === "string" ? job.failedReason : undefined;
    const returnvalue = job.returnvalue as WorkflowTriggerJobResult | undefined;
    const status: WorkflowTriggerJobState =
      stateStr === "completed"
        ? "completed"
        : stateStr === "failed"
          ? "failed"
          : stateStr === "active"
            ? "active"
            : stateStr === "waiting"
              ? "waiting"
              : stateStr === "delayed"
                ? "delayed"
                : stateStr === "paused"
                  ? "paused"
                  : "unknown";
    const queuedAtMs = typeof job.timestamp === "number" ? job.timestamp : undefined;
    const startedAtMs = typeof job.processedOn === "number" ? job.processedOn : undefined;
    const finishedAtMs = typeof job.finishedOn === "number" ? job.finishedOn : undefined;
    const durationMs =
      startedAtMs !== undefined && finishedAtMs !== undefined
        ? finishedAtMs - startedAtMs
        : undefined;
    const tenantId = typeof job.data?.tenantId === "string" ? job.data.tenantId : undefined;
    return {
      executionId,
      tenantId,
      status,
      bullmqState: stateStr,
      queuedAtMs,
      startedAtMs,
      finishedAtMs,
      durationMs,
      result: returnvalue,
      error: failedReason,
    };
  } finally {
    await q.close();
  }
}
