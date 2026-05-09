import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  index,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

/**
 * Unified Schedules Schema
 * Polymorphic schedule storage for reports, insights, and future entity types.
 * Replaces in-memory schedule-store.ts and insight JSONB schedule column.
 */

export const scheduleEntityTypeEnum = pgEnum("schedule_entity_type", ["report", "insight"]);

export const schedules = pgTable(
  "schedules",
  {
    /** Unique schedule identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Tenant ID - all schedules are tenant-scoped */
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    /** Polymorphic entity type: 'report' | 'insight' */
    entityType: scheduleEntityTypeEnum("entity_type").notNull(),

    /** ID of the associated entity (report or insight) */
    entityId: uuid("entity_id").notNull(),

    /** Cron expression for schedule timing */
    cronExpression: varchar("cron_expression", { length: 128 }).notNull(),

    /** IANA timezone string, defaults to 'UTC' */
    timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),

    /** Whether the schedule is active */
    enabled: boolean("enabled").notNull().default(true),

    /** Additional metadata (entity-specific config) */
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),

    /** Last time the schedule fired */
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),

    /** Next scheduled fire time (computed from cron-parser) */
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),

    /** Created timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    /** Updated timestamp */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Unique constraint: one schedule per tenant per entity */
    index("schedules_tenant_entity_type_entity_idx").on(t.tenantId, t.entityType, t.entityId),

    /** Index for finding enabled schedules by cron (conflict detection) */
    index("schedules_tenant_enabled_cron_idx").on(t.tenantId, t.enabled, t.cronExpression),

    /** Index for recovery: find enabled schedules ordered by next run */
    index("schedules_tenant_next_run_idx").on(t.tenantId, t.nextRunAt),

    /** Index for entity type filtering */
    index("schedules_tenant_entity_type_idx").on(t.tenantId, t.entityType),
  ],
);

// Type exports
export type ScheduleDb = typeof schedules.$inferSelect;
export type NewScheduleDb = typeof schedules.$inferInsert;

// Relations (defined here, imported by schedule-executions.ts)
// Note: relations are defined in schedule-executions.ts to avoid circular imports
