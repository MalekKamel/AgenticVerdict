import { SchedulesRepository, type ScheduleDb } from "@agenticverdict/database";
import {
  createBullmqConnectionFromEnv,
  REPORT_SCHEDULE_QUEUE,
  INSIGHT_SCHEDULE_QUEUE,
} from "@agenticverdict/worker";
import { Queue } from "bullmq";
import { createPinoLogger } from "@agenticverdict/observability";

const logger = createPinoLogger("worker");

/**
 * Recover all enabled schedules on startup.
 * Re-registers BullMQ repeatable jobs for all enabled schedules.
 *
 * Called after DB health check on API server startup and before worker registration.
 */
export async function recoverSchedules(): Promise<void> {
  const repository = new SchedulesRepository();
  const enabledSchedules = await repository.findAllEnabled();

  let registered = 0;
  let failed = 0;

  for (const schedule of enabledSchedules) {
    try {
      await registerScheduleForEntity(schedule);
      registered++;
    } catch (error) {
      failed++;
      logger.error(
        { err: error, scheduleId: schedule.id, tenantId: schedule.tenantId },
        "[schedule-recovery] Failed to register schedule",
      );
    }
  }

  logger.info({ registered, failed }, "[schedule-recovery] Recovery complete");
}

async function registerScheduleForEntity(schedule: ScheduleDb): Promise<void> {
  const conn = createBullmqConnectionFromEnv();
  if (!conn) {
    return;
  }

  switch (schedule.entityType) {
    case "report": {
      const queue = new Queue(REPORT_SCHEDULE_QUEUE, { connection: conn });
      try {
        await queue.add(
          "scheduled-tick",
          {
            tenantId: schedule.tenantId,
            scheduleId: schedule.id,
            cronExpression: schedule.cronExpression,
          },
          {
            repeat: { pattern: schedule.cronExpression, key: `report-schedule:${schedule.id}` },
          },
        );
      } finally {
        await queue.close();
      }
      break;
    }
    case "insight": {
      const queue = new Queue(INSIGHT_SCHEDULE_QUEUE, { connection: conn });
      try {
        await queue.add(
          "scheduled-tick",
          {
            tenantId: schedule.tenantId,
            scheduleId: schedule.id,
            insightId: schedule.entityId,
            cronExpression: schedule.cronExpression,
          },
          {
            repeat: { pattern: schedule.cronExpression, key: `insight-schedule:${schedule.id}` },
          },
        );
      } finally {
        await queue.close();
      }
      break;
    }
  }
}
