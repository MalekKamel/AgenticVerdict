import type { Database } from "../client";
import { dbScoped } from "../db-scoped";
import { dbLogger } from "../logger";
import { schedules } from "../schema/schedules";
import { sql } from "drizzle-orm";

export interface SeedSchedule {
  entityType: "report" | "insight";
  entityId: string;
  cronExpression: string;
  timezone?: string;
  enabled?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Seed test schedules with entity_type polymorphism.
 * Creates fixture schedules for both reports and insights.
 */
export async function seedSchedules(
  db: Database,
  tenantId: string,
  scheduleConfigs: SeedSchedule[],
): Promise<void> {
  dbLogger.info("  → Seeding schedules...");

  await dbScoped(db, async (tx) => {
    // Clear existing schedules for this tenant
    await tx.delete(schedules).where(sql`${schedules.tenantId} = ${tenantId}`);

    const now = new Date();

    for (const config of scheduleConfigs) {
      const cronParts = config.cronExpression.split(" ");
      const hour = parseInt(cronParts[1], 10);
      const minute = parseInt(cronParts[0], 10);
      const nextRun = new Date(now);
      nextRun.setHours(hour, minute, 0, 0);
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }

      await tx.insert(schedules).values({
        tenantId,
        entityType: config.entityType,
        entityId: config.entityId,
        cronExpression: config.cronExpression,
        timezone: config.timezone ?? "UTC",
        enabled: config.enabled ?? true,
        metadata: config.metadata ?? {},
        nextRunAt: nextRun,
        lastRunAt: null,
      });

      dbLogger.info(
        `    ✓ Created ${config.entityType} schedule: ${config.cronExpression} (${config.timezone ?? "UTC"})`,
      );
    }
  });

  dbLogger.info(`  → Seeded ${scheduleConfigs.length} schedules`);
}

/**
 * Default fixture schedules for development/testing.
 * Requires entity IDs to be passed from calling code.
 */
export function getDefaultScheduleFixtures(entityIds: {
  reportIds: string[];
  insightIds: string[];
}): SeedSchedule[] {
  const fixtures: SeedSchedule[] = [];

  // Daily schedules for insights
  for (let i = 0; i < Math.min(entityIds.insightIds.length, 3); i++) {
    fixtures.push({
      entityType: "insight",
      entityId: entityIds.insightIds[i],
      cronExpression: `0 ${9 + i} * * *`,
      timezone: "UTC",
      enabled: i % 2 === 0,
      metadata: { frequency: "daily", time: 9 + i },
    });
  }

  // Weekly schedule for reports
  for (let i = 0; i < Math.min(entityIds.reportIds.length, 2); i++) {
    fixtures.push({
      entityType: "report",
      entityId: entityIds.reportIds[i],
      cronExpression: `0 10 * * ${1 + i}`,
      timezone: "America/New_York",
      enabled: true,
      metadata: { frequency: "weekly", time: 10, dayOfWeek: 1 + i },
    });
  }

  return fixtures;
}
