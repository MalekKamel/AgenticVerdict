import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  unique,
  index,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { businessDomains } from "./business-domains";

/**
 * AI Usage Reports Schema
 * Tracks detailed AI usage metrics for billing and analytics
 */

export const aiUsageReports = pgTable(
  "ai_usage_reports",
  {
    /** Unique report identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Tenant ID - scoped for multi-tenancy */
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    /** Provider ID */
    providerId: varchar("provider_id", { length: 64 }).notNull(),

    /** Model ID */
    modelId: varchar("model_id", { length: 128 }).notNull(),

    /** Domain ID (optional) */
    domainId: uuid("domain_id").references(() => businessDomains.id, { onDelete: "set null" }),

    /** Connector ID (optional) */
    connectorId: uuid("connector_id"),

    /** Request ID for tracing */
    requestId: varchar("request_id", { length: 128 }).notNull(),

    /** Prompt/input tokens */
    promptTokens: integer("prompt_tokens").notNull().default(0),

    /** Completion/output tokens */
    completionTokens: integer("completion_tokens").notNull().default(0),

    /** Total tokens */
    totalTokens: integer("total_tokens").notNull().default(0),

    /** Cost in USD cents */
    costCents: integer("cost_cents").notNull().default(0),

    /** Request timestamp */
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),

    /** Response latency in milliseconds */
    latencyMs: integer("latency_ms").notNull().default(0),

    /** Whether request succeeded */
    success: boolean("success").notNull().default(true),

    /** Error code if failed */
    errorCode: varchar("error_code", { length: 64 }),

    /** Error message if failed */
    errorMessage: text("error_message"),

    /** Whether this used failover provider */
    wasFailover: boolean("was_failover").notNull().default(false),

    /** Failover attempt number */
    failoverAttempt: integer("failover_attempt").default(0),

    /** Request metadata */
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    /** Created timestamp (auto) */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Unique constraint for idempotency */
    unique("ai_usage_reports_request_unique").on(t.requestId),

    /** Index for tenant lookup */
    index("ai_usage_reports_tenant_idx").on(t.tenantId),

    /** Index for provider lookup */
    index("ai_usage_reports_provider_idx").on(t.providerId),

    /** Index for domain lookup */
    index("ai_usage_reports_domain_idx").on(t.domainId),

    /** Index for timestamp queries */
    index("ai_usage_reports_timestamp_idx").on(t.timestamp),

    /** Index for connector lookup */
    index("ai_usage_reports_connector_idx").on(t.connectorId),

    /** Composite index for tenant time range queries */
    index("ai_usage_reports_tenant_timestamp_idx").on(t.tenantId, t.timestamp),

    /** Composite index for tenant provider time queries */
    index("ai_usage_reports_tenant_provider_timestamp_idx").on(
      t.tenantId,
      t.providerId,
      t.timestamp,
    ),

    /** Composite index for tenant domain time queries */
    index("ai_usage_reports_tenant_domain_timestamp_idx").on(t.tenantId, t.domainId, t.timestamp),
  ],
);

/**
 * Usage Aggregation (Daily)
 * Pre-aggregated daily usage for faster dashboard queries
 */
export const aiUsageAggregationDaily = pgTable(
  "ai_usage_aggregation_daily",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Tenant ID */
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    /** Usage date */
    usageDate: timestamp("usage_date", { withTimezone: true }).notNull(),

    /** Provider ID */
    providerId: varchar("provider_id", { length: 64 }).notNull(),

    /** Model ID */
    modelId: varchar("model_id", { length: 128 }).notNull(),

    /** Domain ID (optional) */
    domainId: uuid("domain_id"),

    /** Total prompt tokens */
    totalPromptTokens: integer("total_prompt_tokens").notNull().default(0),

    /** Total completion tokens */
    totalCompletionTokens: integer("total_completion_tokens").notNull().default(0),

    /** Total tokens */
    totalTokens: integer("total_tokens").notNull().default(0),

    /** Total cost in USD cents */
    totalCostCents: integer("total_cost_cents").notNull().default(0),

    /** Total requests */
    totalRequests: integer("total_requests").notNull().default(0),

    /** Successful requests */
    successfulRequests: integer("successful_requests").notNull().default(0),

    /** Failed requests */
    failedRequests: integer("failed_requests").notNull().default(0),

    /** Average latency in milliseconds */
    avgLatencyMs: integer("avg_latency_ms").notNull().default(0),

    /** Failover requests count */
    failoverRequests: integer("failover_requests").notNull().default(0),

    /** Last aggregation timestamp */
    lastAggregatedAt: timestamp("last_aggregated_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    /** Unique constraint per tenant per date per provider per model */
    unique("ai_usage_aggregation_daily_unique").on(
      t.tenantId,
      t.usageDate,
      t.providerId,
      t.modelId,
    ),

    /** Index for tenant date lookup */
    index("ai_usage_aggregation_daily_tenant_date_idx").on(t.tenantId, t.usageDate),

    /** Index for provider date lookup */
    index("ai_usage_aggregation_daily_provider_date_idx").on(t.providerId, t.usageDate),

    /** Composite index for tenant provider date */
    index("ai_usage_aggregation_daily_tenant_provider_date_idx").on(
      t.tenantId,
      t.providerId,
      t.usageDate,
    ),
  ],
);

/**
 * Usage Aggregation (Monthly)
 * Pre-aggregated monthly usage for billing and reporting
 */
export const aiUsageAggregationMonthly = pgTable(
  "ai_usage_aggregation_monthly",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Tenant ID */
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    /** Year */
    year: integer("year").notNull(),

    /** Month (1-12) */
    month: integer("month").notNull(),

    /** Provider ID */
    providerId: varchar("provider_id", { length: 64 }).notNull(),

    /** Model ID */
    modelId: varchar("model_id", { length: 128 }).notNull(),

    /** Domain ID (optional) */
    domainId: uuid("domain_id"),

    /** Total prompt tokens */
    totalPromptTokens: integer("total_prompt_tokens").notNull().default(0),

    /** Total completion tokens */
    totalCompletionTokens: integer("total_completion_tokens").notNull().default(0),

    /** Total tokens */
    totalTokens: integer("total_tokens").notNull().default(0),

    /** Total cost in USD cents */
    totalCostCents: integer("total_cost_cents").notNull().default(0),

    /** Total requests */
    totalRequests: integer("total_requests").notNull().default(0),

    /** Successful requests */
    successfulRequests: integer("successful_requests").notNull().default(0),

    /** Failed requests */
    failedRequests: integer("failed_requests").notNull().default(0),

    /** Average latency in milliseconds */
    avgLatencyMs: integer("avg_latency_ms").notNull().default(0),

    /** Peak daily cost (cents) */
    peakDailyCostCents: integer("peak_daily_cost_cents").notNull().default(0),

    /** Last aggregation timestamp */
    lastAggregatedAt: timestamp("last_aggregated_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    /** Unique constraint per tenant per month per provider per model */
    unique("ai_usage_aggregation_monthly_unique").on(
      t.tenantId,
      t.year,
      t.month,
      t.providerId,
      t.modelId,
    ),

    /** Index for tenant month lookup */
    index("ai_usage_aggregation_monthly_tenant_month_idx").on(t.tenantId, t.year, t.month),

    /** Index for provider month lookup */
    index("ai_usage_aggregation_monthly_provider_month_idx").on(t.providerId, t.year, t.month),
  ],
);

// Relations
export const aiUsageReportsRelations = relations(aiUsageReports, ({ one }) => ({
  tenant: one(tenants, {
    fields: [aiUsageReports.tenantId],
    references: [tenants.id],
  }),
  domain: one(businessDomains, {
    fields: [aiUsageReports.domainId],
    references: [businessDomains.id],
  }),
}));

export const aiUsageAggregationDailyRelations = relations(aiUsageAggregationDaily, ({ one }) => ({
  tenant: one(tenants, {
    fields: [aiUsageAggregationDaily.tenantId],
    references: [tenants.id],
  }),
  domain: one(businessDomains, {
    fields: [aiUsageAggregationDaily.domainId],
    references: [businessDomains.id],
  }),
}));

export const aiUsageAggregationMonthlyRelations = relations(
  aiUsageAggregationMonthly,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [aiUsageAggregationMonthly.tenantId],
      references: [tenants.id],
    }),
    domain: one(businessDomains, {
      fields: [aiUsageAggregationMonthly.domainId],
      references: [businessDomains.id],
    }),
  }),
);

// Type exports
export type AiUsageReport = typeof aiUsageReports.$inferSelect;
export type NewAiUsageReport = typeof aiUsageReports.$inferInsert;
export type AiUsageAggregationDaily = typeof aiUsageAggregationDaily.$inferSelect;
export type NewAiUsageAggregationDaily = typeof aiUsageAggregationDaily.$inferInsert;
export type AiUsageAggregationMonthly = typeof aiUsageAggregationMonthly.$inferSelect;
export type NewAiUsageAggregationMonthly = typeof aiUsageAggregationMonthly.$inferInsert;
