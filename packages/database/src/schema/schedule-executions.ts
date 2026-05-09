import { pgTable, uuid, varchar, timestamp, index, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { schedules, scheduleEntityTypeEnum } from "./schedules";

/**
 * Schedule Executions Audit Schema
 * Tracks all schedule ticks with status, timing, and error information.
 */

export const scheduleExecutionStatusEnum = pgEnum("schedule_execution_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "skipped",
]);

export const scheduleExecutions = pgTable(
  "schedule_executions",
  {
    /** Unique execution identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** The schedule that fired */
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => schedules.id, { onDelete: "cascade" }),

    /** Tenant ID - denormalized for tenant-scoped queries */
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    /** Entity type of the schedule (denormalized) */
    entityType: scheduleEntityTypeEnum("entity_type").notNull(),

    /** Entity ID of the schedule (denormalized) */
    entityId: uuid("entity_id").notNull(),

    /** When the schedule was supposed to fire */
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),

    /** When execution actually started */
    startedAt: timestamp("started_at", { withTimezone: true }),

    /** When execution completed/failed */
    completedAt: timestamp("completed_at", { withTimezone: true }),

    /** Execution status */
    status: scheduleExecutionStatusEnum("status").notNull().default("pending"),

    /** Error message if failed */
    errorMessage: varchar("error_message", { length: 1024 }),

    /** Created timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Index for execution history by schedule */
    index("schedule_executions_schedule_idx").on(t.scheduleId),

    /** Index for tenant-scoped history queries */
    index("schedule_executions_tenant_schedule_idx").on(t.tenantId, t.scheduleId),

    /** Index for entity type filtering */
    index("schedule_executions_tenant_entity_type_idx").on(t.tenantId, t.entityType),
  ],
);

export const scheduleExecutionsRelations = relations(scheduleExecutions, ({ one }) => ({
  schedule: one(schedules, {
    fields: [scheduleExecutions.scheduleId],
    references: [schedules.id],
  }),
  tenant: one(tenants, {
    fields: [scheduleExecutions.tenantId],
    references: [tenants.id],
  }),
}));

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [schedules.tenantId],
    references: [tenants.id],
  }),
  executions: many(scheduleExecutions),
}));

// Type exports
export type ScheduleExecutionDb = typeof scheduleExecutions.$inferSelect;
export type NewScheduleExecutionDb = typeof scheduleExecutions.$inferInsert;
