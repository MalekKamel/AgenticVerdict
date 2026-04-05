import type { ReportFormat } from "@agenticverdict/report-generator";
import {
  createBullmqConnectionFromEnv,
  createReportDeliveryQueue,
  createReportScheduleQueue,
  type ReportDeliveryJobData,
  type ReportScheduleJobData,
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

function repeatKeyForSchedule(scheduleId: string): string {
  return `report-schedule:${scheduleId}`;
}

export async function enqueueReportDelivery(data: ReportDeliveryJobData): Promise<string> {
  const conn = getConnection();
  if (!conn) {
    throw new Error("queue_unavailable");
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
    throw new Error("queue_unavailable");
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
