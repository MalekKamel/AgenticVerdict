import type { NotificationChannel, BudgetAlertMetadata } from "@agenticverdict/types";
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  unique,
  index,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants";

/**
 * Budget Alerts Schema
 * Manages budget thresholds and alert notifications
 */

export const alertTypeEnum = pgEnum("alert_type", ["threshold", "percentage", "rate"]);
export const alertThresholdTypeEnum = pgEnum("alert_threshold_type", [
  "cost",
  "tokens",
  "requests",
]);
export const alertTimeWindowEnum = pgEnum("alert_time_window", [
  "hourly",
  "daily",
  "weekly",
  "monthly",
]);
export const alertStatusEnum = pgEnum("alert_status", ["active", "paused", "triggered"]);
export const notificationTypeEnum = pgEnum("notification_type", ["email", "webhook", "slack"]);

export const budgetAlerts = pgTable(
  "budget_alerts",
  {
    /** Unique alert identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Tenant ID - scoped for multi-tenancy */
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    /** Alert name */
    name: varchar("name", { length: 128 }).notNull(),

    /** Alert description */
    description: text("description"),

    /** Alert type */
    type: alertTypeEnum("type").notNull(),

    /** Threshold value */
    threshold: integer("threshold").notNull(),

    /** Threshold type */
    thresholdType: alertThresholdTypeEnum("threshold_type").notNull(),

    /** Time window for evaluation */
    timeWindow: alertTimeWindowEnum("time_window").notNull(),

    /** Alert status */
    status: alertStatusEnum("status").notNull().default("active"),

    /** Notification channels (JSON) */
    notifications: jsonb("notifications").$type<NotificationChannel[]>().notNull(),

    /** Last triggered timestamp */
    lastTriggeredAt: timestamp("last_triggered_at", { withTimezone: true }),

    /** Last evaluation timestamp */
    lastEvaluatedAt: timestamp("last_evaluated_at", { withTimezone: true }),

    /** Last evaluated value */
    lastEvaluatedValue: integer("last_evaluated_value"),

    /** Trigger count */
    triggerCount: integer("trigger_count").notNull().default(0),

    /** Cooldown period (minutes) - prevents alert spam */
    cooldownMinutes: integer("cooldown_minutes").notNull().default(60),

    /** Created by user ID */
    createdById: uuid("created_by_id"),

    /** Metadata */
    metadata: jsonb("metadata").$type<BudgetAlertMetadata>(),

    /** Created timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    /** Updated timestamp */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Index for tenant lookup */
    index("budget_alerts_tenant_idx").on(t.tenantId),

    /** Index for status filtering */
    index("budget_alerts_status_idx").on(t.status),

    /** Index for type filtering */
    index("budget_alerts_type_idx").on(t.type),

    /** Index for time window filtering */
    index("budget_alerts_time_window_idx").on(t.timeWindow),

    /** Composite index for active alerts */
    index("budget_alerts_active_idx").on(t.tenantId, t.status),
  ],
);

/**
 * Alert Trigger History
 * Logs all alert triggers for audit and analysis
 */
export const alertTriggerHistory = pgTable(
  "alert_trigger_history",
  {
    /** Unique trigger identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Alert ID */
    alertId: uuid("alert_id")
      .notNull()
      .references(() => budgetAlerts.id, { onDelete: "cascade" }),

    /** Tenant ID */
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    /** Triggered value */
    triggeredValue: integer("triggered_value").notNull(),

    /** Threshold value */
    thresholdValue: integer("threshold_value").notNull(),

    /** Exceeded by (difference) */
    exceededBy: integer("exceeded_by"),

    /** Trigger timestamp */
    triggeredAt: timestamp("triggered_at", { withTimezone: true }).notNull(),

    /** Notifications sent (JSON) */
    notificationsSent: jsonb("notifications_sent").$type<
      Array<{
        type: string;
        target: string;
        status: "sent" | "failed" | "pending";
        errorMessage?: string;
        sentAt?: string;
      }>
    >(),

    /** Evaluation context (JSON) */
    evaluationContext: jsonb("evaluation_context").$type<Record<string, unknown>>(),

    /** Created timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Index for alert lookup */
    index("alert_trigger_history_alert_idx").on(t.alertId),

    /** Index for tenant lookup */
    index("alert_trigger_history_tenant_idx").on(t.tenantId),

    /** Index for trigger timestamp */
    index("alert_trigger_history_triggered_at_idx").on(t.triggeredAt),

    /** Composite index for tenant alert time */
    index("alert_trigger_history_tenant_alert_time_idx").on(t.tenantId, t.alertId, t.triggeredAt),
  ],
);

/**
 * Budget Period Summaries
 * Pre-calculated budget summaries for quick dashboard queries
 */
export const budgetPeriodSummaries = pgTable(
  "budget_period_summaries",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Tenant ID */
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    /** Period type */
    periodType: alertTimeWindowEnum("period_type").notNull(),

    /** Period start */
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),

    /** Period end */
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),

    /** Total cost (cents) */
    totalCostCents: integer("total_cost_cents").notNull().default(0),

    /** Total tokens */
    totalTokens: integer("total_tokens").notNull().default(0),

    /** Total requests */
    totalRequests: integer("total_requests").notNull().default(0),

    /** Budget limit (cents) */
    budgetLimitCents: integer("budget_limit_cents"),

    /** Budget used percentage (0-10000 for basis points) */
    budgetUsedPercent: integer("budget_used_percent").notNull().default(0),

    /** Projected end-of-period cost (cents) */
    projectedCostCents: integer("projected_cost_cents"),

    /** Days remaining in period */
    daysRemaining: integer("days_remaining"),

    /** Daily average cost (cents) */
    dailyAverageCostCents: integer("daily_average_cost_cents"),

    /** Alerts triggered in period */
    alertsTriggered: integer("alerts_triggered").notNull().default(0),

    /** Created timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    /** Updated timestamp */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Unique constraint per tenant per period */
    unique("budget_period_summaries_tenant_period_unique").on(
      t.tenantId,
      t.periodType,
      t.periodStart,
    ),

    /** Index for tenant lookup */
    index("budget_period_summaries_tenant_idx").on(t.tenantId),

    /** Index for period type */
    index("budget_period_summaries_period_type_idx").on(t.periodType),

    /** Index for period start */
    index("budget_period_summaries_period_start_idx").on(t.periodStart),

    /** Composite index for tenant period queries */
    index("budget_period_summaries_tenant_period_idx").on(t.tenantId, t.periodType, t.periodStart),
  ],
);

// Relations
export const budgetAlertsRelations = relations(budgetAlerts, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [budgetAlerts.tenantId],
    references: [tenants.id],
  }),
  triggers: many(alertTriggerHistory),
}));

export const alertTriggerHistoryRelations = relations(alertTriggerHistory, ({ one }) => ({
  alert: one(budgetAlerts, {
    fields: [alertTriggerHistory.alertId],
    references: [budgetAlerts.id],
  }),
  tenant: one(tenants, {
    fields: [alertTriggerHistory.tenantId],
    references: [tenants.id],
  }),
}));

export const budgetPeriodSummariesRelations = relations(budgetPeriodSummaries, ({ one }) => ({
  tenant: one(tenants, {
    fields: [budgetPeriodSummaries.tenantId],
    references: [tenants.id],
  }),
}));

// Type exports
export type BudgetAlert = typeof budgetAlerts.$inferSelect;
export type NewBudgetAlert = typeof budgetAlerts.$inferInsert;
export type AlertTriggerHistory = typeof alertTriggerHistory.$inferSelect;
export type NewAlertTriggerHistory = typeof alertTriggerHistory.$inferInsert;
export type BudgetPeriodSummary = typeof budgetPeriodSummaries.$inferSelect;
export type NewBudgetPeriodSummary = typeof budgetPeriodSummaries.$inferInsert;
