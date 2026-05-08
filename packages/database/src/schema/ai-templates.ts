import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  unique,
  index,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { businessDomains } from "./business-domains";

/**
 * AI Templates Schema
 * Stores reusable AI configuration and prompt templates
 */

export const templateTypeEnum = pgEnum("template_type", ["prompt", "configuration", "workflow"]);
export const templateStatusEnum = pgEnum("template_status", ["draft", "published", "archived"]);

// @ts-expect-error Drizzle ORM circular reference - type inferred via $inferSelect
export const aiTemplates = pgTable(
  "ai_templates",
  {
    /** Unique template identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Tenant ID - scoped for multi-tenancy */
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    /** Template name */
    name: varchar("name", { length: 128 }).notNull(),

    /** Template description */
    description: text("description"),

    /** Template type */
    type: templateTypeEnum("type").notNull(),

    /** Template version (semver) */
    version: varchar("version", { length: 32 }).notNull().default("1.0.0"),

    /** Template content */
    content: text("content").notNull(),

    /** Variable definitions (JSON) */
    variables: jsonb("variables")
      .$type<
        Array<{
          name: string;
          type: string;
          required: boolean;
          defaultValue?: unknown;
          description?: string;
          pattern?: string;
        }>
      >()
      .default([]),

    /** Associated provider ID */
    providerId: varchar("provider_id", { length: 64 }),

    /** Associated model ID */
    modelId: varchar("model_id", { length: 128 }),

    /** Domain ID if domain-specific */
    domainId: uuid("domain_id").references(() => businessDomains.id, { onDelete: "set null" }),

    /** Template status */
    status: templateStatusEnum("status").notNull().default("draft"),

    /** Parent version ID for versioning */
    // @ts-expect-error Drizzle ORM circular reference
    parentVersionId: uuid("parent_version_id").references(() => aiTemplates.id, {
      onDelete: "set null",
    }),

    /** Whether this is the latest version */
    isLatestVersion: boolean("is_latest_version").notNull().default(false),

    /** Version number (auto-increment) */
    versionNumber: integer("version_number").notNull().default(1),

    /** Created by user ID */
    createdById: uuid("created_by_id"),

    /** Deployment count */
    deploymentCount: integer("deployment_count").notNull().default(0),

    /** Last deployed timestamp */
    lastDeployedAt: timestamp("last_deployed_at", { withTimezone: true }),

    /** Metadata for additional configuration */
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    /** Created timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    /** Updated timestamp */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Unique constraint: template name per tenant per domain */
    unique("ai_templates_tenant_name_domain_unique").on(t.tenantId, t.name, t.domainId),

    /** Index for tenant lookup */
    index("ai_templates_tenant_idx").on(t.tenantId),

    /** Index for domain lookup */
    index("ai_templates_domain_idx").on(t.domainId),

    /** Index for status filtering */
    index("ai_templates_status_idx").on(t.status),

    /** Index for type filtering */
    index("ai_templates_type_idx").on(t.type),

    /** Index for version lookup */
    index("ai_templates_parent_version_idx").on(t.parentVersionId),

    /** Composite index for latest versions */
    index("ai_templates_latest_idx").on(t.tenantId, t.isLatestVersion),
  ],
);

/**
 * Template Deployments
 * Tracks where templates have been deployed
 */
export const templateDeployments = pgTable(
  "template_deployments",
  {
    /** Unique deployment identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Template ID */
    templateId: uuid("template_id")
      .notNull()
      .references(() => aiTemplates.id, { onDelete: "cascade" }),

    /** Tenant ID */
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    /** Deployment scope */
    scope: varchar("scope", { length: 16 }).notNull(),

    /** Target ID (domain or connector) */
    targetId: uuid("target_id"),

    /** Deployed variables (JSON) */
    deployedVariables: jsonb("deployed_variables").$type<Record<string, unknown>>(),

    /** Deployed by user ID */
    deployedBy: uuid("deployed_by"),

    /** Deployment status */
    deploymentStatus: varchar("deployment_status", { length: 32 }).notNull().default("active"),

    /** Deployment notes */
    notes: text("notes"),

    /** Created timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    /** Updated timestamp */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Index for template lookup */
    index("template_deployments_template_idx").on(t.templateId),

    /** Index for tenant lookup */
    index("template_deployments_tenant_idx").on(t.tenantId),

    /** Index for target lookup */
    index("template_deployments_target_idx").on(t.targetId),

    /** Composite index for active deployments */
    index("template_deployments_active_idx").on(t.tenantId, t.scope, t.deploymentStatus),
  ],
);

/**
 * Template Usage Analytics
 * Tracks template usage metrics
 */
export const templateUsageAnalytics = pgTable(
  "template_usage_analytics",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Template ID */
    templateId: uuid("template_id")
      .notNull()
      .references(() => aiTemplates.id, { onDelete: "cascade" }),

    /** Tenant ID */
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    /** Usage date (partition key) */
    usageDate: timestamp("usage_date", { withTimezone: true }).notNull(),

    /** Execution count */
    executionCount: integer("execution_count").notNull().default(0),

    /** Successful executions */
    successCount: integer("success_count").notNull().default(0),

    /** Failed executions */
    failureCount: integer("failure_count").notNull().default(0),

    /** Average execution time (ms) */
    avgExecutionTimeMs: integer("avg_execution_time_ms").notNull().default(0),

    /** Total tokens used */
    totalTokens: integer("total_tokens").notNull().default(0),

    /** Total cost (cents) */
    totalCostCents: integer("total_cost_cents").notNull().default(0),

    /** Created timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    /** Updated timestamp */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Unique constraint per template per date */
    unique("template_usage_analytics_template_date_unique").on(t.templateId, t.usageDate),

    /** Index for template lookup */
    index("template_usage_analytics_template_idx").on(t.templateId),

    /** Index for date range queries */
    index("template_usage_analytics_date_idx").on(t.usageDate),

    /** Composite index for tenant date queries */
    index("template_usage_analytics_tenant_date_idx").on(t.tenantId, t.usageDate),
  ],
);

// Relations
export const aiTemplatesRelations = relations(aiTemplates, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [aiTemplates.tenantId],
    references: [tenants.id],
  }),
  domain: one(businessDomains, {
    fields: [aiTemplates.domainId],
    references: [businessDomains.id],
  }),
  parentVersion: one(aiTemplates, {
    fields: [aiTemplates.parentVersionId],
    references: [aiTemplates.id],
    relationName: "templateVersions",
  }),
  childVersions: many(aiTemplates, {
    relationName: "templateVersions",
  }),
  deployments: many(templateDeployments),
  usageAnalytics: many(templateUsageAnalytics),
}));

export const templateDeploymentsRelations = relations(templateDeployments, ({ one }) => ({
  template: one(aiTemplates, {
    fields: [templateDeployments.templateId],
    references: [aiTemplates.id],
  }),
  tenant: one(tenants, {
    fields: [templateDeployments.tenantId],
    references: [tenants.id],
  }),
}));

export const templateUsageAnalyticsRelations = relations(templateUsageAnalytics, ({ one }) => ({
  template: one(aiTemplates, {
    fields: [templateUsageAnalytics.templateId],
    references: [aiTemplates.id],
  }),
  tenant: one(tenants, {
    fields: [templateUsageAnalytics.tenantId],
    references: [tenants.id],
  }),
}));

// Type exports
export type AiTemplate = typeof aiTemplates.$inferSelect;
export type NewAiTemplate = typeof aiTemplates.$inferInsert;
export type TemplateDeployment = typeof templateDeployments.$inferSelect;
export type NewTemplateDeployment = typeof templateDeployments.$inferInsert;
export type TemplateUsageAnalytics = typeof templateUsageAnalytics.$inferSelect;
export type NewTemplateUsageAnalytics = typeof templateUsageAnalytics.$inferInsert;
export type AiTemplateStatus = (typeof templateStatusEnum.enumValues)[number];
