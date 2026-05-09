import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  timestamp,
  index,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tenants } from "./tenants";
import { businessDomains } from "./business-domains";
import { aiTemplates } from "./ai-templates";
import { dataConnectors } from "./core/connectors";

/**
 * Insight Templates Schema
 * Stores pre-configured domain-specific templates for creating insights.
 * Templates define connector-to-metric mappings, schedule, and delivery config.
 * Linked to AI templates via ai_template_id FK (separate concern).
 */

export const insightTemplates = pgTable(
  "insight_templates",
  {
    /** Unique template identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Tenant ID - null = platform-shared template */
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),

    /** Template name translations (JSONB dictionary) */
    nameTranslations: jsonb("name_translations")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),

    /** Template description translations (JSONB dictionary) */
    descriptionTranslations: jsonb("description_translations")
      .$type<Record<string, string>>()
      .notNull()
      .default({}),

    /** Icon identifier (emoji or icon name) */
    icon: varchar("icon", { length: 32 }),

    /** Linked AI template for prompt/workflow config */
    aiTemplateId: uuid("ai_template_id").references(() => aiTemplates.id, { onDelete: "set null" }),

    /** Schedule configuration (frequency + hour) */
    schedule: jsonb("schedule").$type<{ frequency: string; time: number }>().notNull().default({
      frequency: "weekly",
      time: 9,
    }),

    /** Delivery configuration (format + channels) */
    delivery: jsonb("delivery")
      .$type<{
        format: string;
        emailRecipients: string[];
        enableWebhook: boolean;
        webhookUrl: string | null;
      }>()
      .notNull()
      .default({
        format: "pdf",
        emailRecipients: [],
        enableWebhook: false,
        webhookUrl: null,
      }),

    /** Whether template is active */
    isActive: boolean("is_active").notNull().default(true),

    /** Template version */
    version: integer("version").notNull().default(1),

    /** Created timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    /** Updated timestamp */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Index for tenant lookup */
    index("insight_templates_tenant_idx").on(t.tenantId),

    /** Index for active filtering */
    index("insight_templates_active_idx").on(t.isActive),

    /** Index for AI template lookup */
    index("insight_templates_ai_template_idx").on(t.aiTemplateId),
  ],
);

/**
 * Insight Template Domains Junction Table (many-to-many)
 * Links templates to business domains
 */
export const insightTemplateDomains = pgTable(
  "insight_template_domains",
  {
    /** Template ID */
    templateId: uuid("template_id")
      .notNull()
      .references(() => insightTemplates.id, { onDelete: "cascade" }),

    /** Domain ID */
    domainId: uuid("domain_id")
      .notNull()
      .references(() => businessDomains.id, { onDelete: "cascade" }),
  },
  (t) => [
    /** Composite primary key */
    primaryKey({ columns: [t.templateId, t.domainId] }),

    /** Index for domain lookup */
    index("insight_template_domains_domain_idx").on(t.domainId),
  ],
);

/**
 * Insight Template Connectors Junction Table (many-to-many)
 * Links templates to connectors with metric mappings
 */
export const insightTemplateConnectors = pgTable(
  "insight_template_connectors",
  {
    /** Template ID */
    templateId: uuid("template_id")
      .notNull()
      .references(() => insightTemplates.id, { onDelete: "cascade" }),

    /** Connector ID (from data_connectors) */
    connectorId: varchar("connector_id", { length: 64 })
      .notNull()
      .references(() => dataConnectors.id, { onDelete: "cascade" }),

    /** Available metrics from this connector (JSONB array) */
    metrics: jsonb("metrics").$type<string[]>().notNull().default([]),
  },
  (t) => [
    /** Composite primary key */
    primaryKey({ columns: [t.templateId, t.connectorId] }),

    /** Index for connector lookup */
    index("insight_template_connectors_connector_idx").on(t.connectorId),
  ],
);

// Relations
export const insightTemplatesRelations = relations(insightTemplates, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [insightTemplates.tenantId],
    references: [tenants.id],
  }),
  aiTemplate: one(aiTemplates, {
    fields: [insightTemplates.aiTemplateId],
    references: [aiTemplates.id],
  }),
  domains: many(insightTemplateDomains),
  connectors: many(insightTemplateConnectors),
}));

export const insightTemplateDomainsRelations = relations(insightTemplateDomains, ({ one }) => ({
  template: one(insightTemplates, {
    fields: [insightTemplateDomains.templateId],
    references: [insightTemplates.id],
  }),
  domain: one(businessDomains, {
    fields: [insightTemplateDomains.domainId],
    references: [businessDomains.id],
  }),
}));

export const insightTemplateConnectorsRelations = relations(
  insightTemplateConnectors,
  ({ one }) => ({
    template: one(insightTemplates, {
      fields: [insightTemplateConnectors.templateId],
      references: [insightTemplates.id],
    }),
    connector: one(dataConnectors, {
      fields: [insightTemplateConnectors.connectorId],
      references: [dataConnectors.id],
    }),
  }),
);

// Type exports
export type InsightTemplateDb = typeof insightTemplates.$inferSelect;
export type NewInsightTemplate = typeof insightTemplates.$inferInsert;
export type InsightTemplateDomain = typeof insightTemplateDomains.$inferSelect;
export type NewInsightTemplateDomain = typeof insightTemplateDomains.$inferInsert;
export type InsightTemplateConnector = typeof insightTemplateConnectors.$inferSelect;
export type NewInsightTemplateConnector = typeof insightTemplateConnectors.$inferInsert;
