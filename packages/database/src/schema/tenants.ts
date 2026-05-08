import {
  pgEnum,
  uuid,
  varchar,
  timestamp,
  boolean,
  integer,
  text,
  pgTable,
  type AnyPgColumn,
  jsonb,
} from "drizzle-orm/pg-core";

import { agencyPartners } from "./core/tenants";
import type { TenantAIConfig } from "@agenticverdict/core/tenant/config-schema";

export const tenantTypeEnum = pgEnum("tenant_type", [
  "direct_business",
  "agency_partner",
  "agency_managed",
]);

export const tenantStatusEnum = pgEnum("tenant_status", [
  "onboarding",
  "active",
  "suspended",
  "restricted",
  "archived",
  "deleted",
]);

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),

  type: tenantTypeEnum("type").notNull().default("direct_business"),
  status: tenantStatusEnum("status").notNull().default("onboarding"),

  parentTenantId: uuid("parent_tenant_id").references((): AnyPgColumn => tenants.id, {
    onDelete: "set null",
  }),
  agencyPartnerId: uuid("agency_partner_id").references(() => agencyPartners.id, {
    onDelete: "set null",
  }),

  language: varchar("language", { length: 2 }).notNull().default("en"),
  region: varchar("region", { length: 2 }).notNull().default("US"),
  timezone: varchar("timezone", { length: 64 }).notNull().default("UTC"),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),

  enableInsights: boolean("enable_insights").notNull().default(true),
  enableVerdict: boolean("enable_verdict").notNull().default(true),
  enableReports: boolean("enable_reports").notNull().default(true),
  maxInsights: integer("max_insights").notNull().default(10),
  maxUsers: integer("max_users").notNull().default(5),
  whiteLabelEnabled: boolean("white_label_enabled").default(false),

  aiProvider: varchar("ai_provider", { length: 32 }).notNull().default("anthropic"),
  aiModel: varchar("ai_model", { length: 64 }).notNull().default("claude-3-5-sonnet-20241022"),
  aiQualityLevel: varchar("ai_quality_level", { length: 16 }).notNull().default("standard"),
  aiCustomizationLevel: varchar("ai_customization_level", { length: 16 })
    .notNull()
    .default("balanced"),

  // Comprehensive AI configuration (JSONB for flexibility)
  aiConfig: jsonb("ai_config").$type<TenantAIConfig>(),

  // AI Provider Management Settings (new)
  /** Default cost tier for AI providers */
  aiDefaultCostTier: varchar("ai_default_cost_tier", { length: 16 }).notNull().default("standard"),

  /** Monthly AI budget limit in USD cents */
  aiMonthlyBudgetCents: integer("ai_monthly_budget_cents"),

  /** Budget alert threshold percentage (0-100) */
  aiBudgetAlertThreshold: integer("ai_budget_alert_threshold").notNull().default(80),

  /** Enable AI usage tracking */
  aiEnableUsageTracking: boolean("ai_enable_usage_tracking").notNull().default(true),

  /** Enable budget alerts */
  aiEnableBudgetAlerts: boolean("ai_enable_budget_alerts").notNull().default(true),

  /** Enable automatic failover */
  aiEnableFailover: boolean("ai_enable_failover").notNull().default(true),

  /** Failover providers (ordered list) */
  aiFailoverProviders: jsonb("ai_failover_providers").$type<string[]>(),

  /** Usage data retention days */
  aiUsageRetentionDays: integer("ai_usage_retention_days").notNull().default(90),

  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  suspendedReason: text("suspended_reason"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
