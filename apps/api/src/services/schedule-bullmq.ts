import type { InsightScheduleTickJobData, ScheduleFrequency } from "@agenticverdict/types";
import cronParser from "cron-parser";
import { AppFault } from "@agenticverdict/core";
import { createBullmqConnectionFromEnv, INSIGHT_SCHEDULE_QUEUE } from "@agenticverdict/worker";
import { Queue } from "bullmq";
import type IORedis from "ioredis";

let cachedConnection: ReturnType<typeof createBullmqConnectionFromEnv> | undefined;

export function resetBullmqConnectionForTests(): void {
  void cachedConnection?.quit().catch(() => undefined);
  cachedConnection = undefined;
}

function getConnection(): IORedis | null {
  if (cachedConnection === undefined) {
    cachedConnection = createBullmqConnectionFromEnv();
  }
  return cachedConnection;
}

export function isBullmqConfigured(): boolean {
  return Boolean(process.env.REDIS_URL?.trim());
}

// ==========================================================================
// Shared BullMQ Schedule Utilities
// ==========================================================================

/**
 * Register a repeatable schedule job on a specific queue
 */
export async function registerScheduleRepeatableJob(
  queueName: string,
  repeatKey: string,
  cronExpression: string,
  payload: Record<string, unknown>,
): Promise<void> {
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

  const queue = new Queue(queueName, { connection: conn });

  try {
    await queue.add("scheduled-tick", payload, {
      repeat: { pattern: cronExpression, key: repeatKey },
    });
  } finally {
    await queue.close();
  }
}

/**
 * Unregister a repeatable schedule job by its repeat key
 */
export async function unregisterScheduleRepeatableJob(
  queueName: string,
  repeatKey: string,
): Promise<void> {
  const conn = getConnection();
  if (!conn) {
    return;
  }

  const queue = new Queue(queueName, { connection: conn });

  try {
    await queue.removeRepeatableByKey(repeatKey);
  } catch {
    /* idempotent */
  } finally {
    await queue.close();
  }
}

// ==========================================================================
// Cron Parsing Utilities
// ==========================================================================

/**
 * Validate a cron expression using cron-parser
 */
export function isValidCronExpression(expr: string): boolean {
  try {
    cronParser.parseExpression(expr);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert frequency/time to cron expression
 */
export function frequencyToCron(frequency: ScheduleFrequency, time: number): string {
  const hour = Math.max(0, Math.min(23, Math.floor(time)));
  const minute = 0;

  switch (frequency) {
    case "daily":
      return `${minute} ${hour} * * *`;
    case "weekly":
      return `${minute} ${hour} * * 1`; // Monday
    case "monthly":
      return `${minute} ${hour} 1 * *`; // 1st of month
    case "quarterly":
      return `${minute} ${hour} 1 1,4,7,10 *`; // Jan, Apr, Jul, Oct
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }
}

/**
 * Compute next run time from cron expression and timezone
 */
export function computeNextRun(cronExpression: string, timezone = "UTC"): Date | null {
  try {
    const interval = cronParser.parseExpression(cronExpression, { tz: timezone });
    const next = interval.next();
    return next.toDate();
  } catch {
    return null;
  }
}

/**
 * Compute next N run times from cron expression and timezone
 */
export function computeNextRuns(cronExpression: string, timezone = "UTC", count = 3): Date[] {
  const results: Date[] = [];
  try {
    const interval = cronParser.parseExpression(cronExpression, { tz: timezone });
    for (let i = 0; i < count; i++) {
      results.push(interval.next().toDate());
    }
  } catch {
    // return whatever we have
  }
  return results;
}

// ==========================================================================
// Insight Schedule Job Helpers
// ==========================================================================

function insightScheduleRepeatKey(scheduleId: string): string {
  return `insight-schedule:${scheduleId}`;
}

export async function registerInsightScheduleRepeatableJob(
  scheduleId: string,
  entityId: string,
  cronExpression: string,
  tenantId: string,
): Promise<void> {
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

  const queue = new Queue<InsightScheduleTickJobData>(INSIGHT_SCHEDULE_QUEUE, { connection: conn });

  const payload: InsightScheduleTickJobData = {
    tenantId,
    scheduleId,
    insightId: entityId,
    cronExpression,
  };

  try {
    await queue.add("scheduled-tick", payload, {
      repeat: { pattern: cronExpression, key: insightScheduleRepeatKey(scheduleId) },
    });
  } finally {
    await queue.close();
  }
}

export async function unregisterInsightScheduleRepeatableJob(scheduleId: string): Promise<void> {
  const conn = getConnection();
  if (!conn) {
    return;
  }

  const queue = new Queue<InsightScheduleTickJobData>(INSIGHT_SCHEDULE_QUEUE, { connection: conn });

  try {
    await queue.removeRepeatableByKey(insightScheduleRepeatKey(scheduleId));
  } catch {
    /* idempotent */
  } finally {
    await queue.close();
  }
}

export { INSIGHT_SCHEDULE_QUEUE };
