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
 * AI Provider Configuration Schema
 * Stores tenant and domain-level AI provider configurations
 */

export const providerScopeEnum = pgEnum("provider_scope", ["tenant", "domain", "connector"]);
export const providerStatusEnum = pgEnum("provider_status", ["active", "inactive", "error"]);
export const costTierEnum = pgEnum("cost_tier", ["premium", "standard", "economy"]);

export const aiProviders = pgTable(
  "ai_providers",
  {
    /** Unique identifier for this provider configuration */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Tenant ID - scoped for multi-tenancy */
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    /** Provider identifier (anthropic, openai, google, etc.) */
    providerId: varchar("provider_id", { length: 64 }).notNull(),

    /** Provider display name */
    providerName: varchar("provider_name", { length: 128 }).notNull(),

    /** Model identifier */
    modelId: varchar("model_id", { length: 128 }).notNull(),

    /** Model display name */
    modelName: varchar("model_name", { length: 128 }),

    /** Cost tier for pricing */
    costTier: costTierEnum("cost_tier").notNull().default("standard"),

    /** Custom pricing override (JSONB) */
    customPricing: jsonb("custom_pricing").$type<{
      inputCostPer1k: number;
      outputCostPer1k: number;
    }>(),

    /** Configuration scope */
    scope: providerScopeEnum("scope").notNull(),

    /** Parent ID (domain or connector if scoped) */
    parentId: uuid("parent_id"),

    /** Whether this provider is enabled */
    isEnabled: boolean("is_enabled").notNull().default(true),

    /** Provider status */
    status: providerStatusEnum("status").notNull().default("active"),

    /** Priority for failover ordering (lower = higher priority) */
    priority: integer("priority").notNull().default(0),

    /** Rate limit override (requests per minute) */
    rateLimitOverride: integer("rate_limit_override"),

    /** Timeout override (milliseconds) */
    timeoutOverride: integer("timeout_override"),

    /** Custom base URL for OpenAI-compatible providers */
    baseUrl: text("base_url"),

    /** Whether this is an override of parent configuration */
    isOverride: boolean("is_override").notNull().default(false),

    /** Last health check timestamp */
    lastHealthCheckAt: timestamp("last_health_check_at", { withTimezone: true }),

    /** Health check error message */
    healthErrorMessage: text("health_error_message"),

    /** Credentials reference ID */
    credentialsId: uuid("credentials_id"),

    /** Metadata for additional configuration */
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    /** Created timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    /** Updated timestamp */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Unique constraint: one configuration per tenant per scope per parent */
    unique("ai_providers_tenant_scope_parent_unique").on(
      t.tenantId,
      t.scope,
      t.parentId,
      t.providerId,
    ),

    /** Index for tenant lookup */
    index("ai_providers_tenant_idx").on(t.tenantId),

    /** Index for scope lookup */
    index("ai_providers_scope_idx").on(t.scope),

    /** Index for parent lookup */
    index("ai_providers_parent_idx").on(t.parentId),

    /** Composite index for active providers */
    index("ai_providers_active_idx").on(t.tenantId, t.scope, t.isEnabled),
  ],
);

/**
 * Provider Model Definitions
 * Stores available models per provider
 */
export const aiProviderModels = pgTable(
  "ai_provider_models",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Provider ID */
    providerId: varchar("provider_id", { length: 64 }).notNull(),

    /** Model identifier */
    modelId: varchar("model_id", { length: 128 }).notNull(),

    /** Model display name */
    modelName: varchar("model_name", { length: 128 }).notNull(),

    /** Model version */
    version: varchar("version", { length: 32 }).notNull(),

    /** Context window size (tokens) */
    contextWindow: integer("context_window").notNull(),

    /** Input cost per 1K tokens (USD cents) */
    inputCostPer1k: integer("input_cost_per_1k").notNull().default(0),

    /** Output cost per 1K tokens (USD cents) */
    outputCostPer1k: integer("output_cost_per_1k").notNull().default(0),

    /** Whether model supports streaming */
    supportsStreaming: boolean("supports_streaming").notNull().default(false),

    /** Whether model supports function calling */
    supportsFunctionCalling: boolean("supports_function_calling").notNull().default(false),

    /** Whether model is multimodal */
    isMultimodal: boolean("is_multimodal").notNull().default(false),

    /** Model capabilities (JSON array) */
    capabilities: jsonb("capabilities").$type<string[]>(),

    /** Whether model is available */
    isAvailable: boolean("is_available").notNull().default(true),

    /** Created timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    /** Updated timestamp */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Unique constraint per provider per model */
    unique("ai_provider_models_provider_model_unique").on(t.providerId, t.modelId),

    /** Index for provider lookup */
    index("ai_provider_models_provider_idx").on(t.providerId),

    /** Index for availability */
    index("ai_provider_models_available_idx").on(t.isAvailable),
  ],
);

/**
 * Provider Failover Configuration
 * Defines failover chains for providers
 */
export const aiProviderFailover = pgTable(
  "ai_provider_failover",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Tenant ID */
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    /** Primary provider ID */
    primaryProviderId: varchar("primary_provider_id", { length: 64 }).notNull(),

    /** Fallback provider IDs (ordered) */
    fallbackProviders: jsonb("fallback_providers").$type<string[]>().notNull(),

    /** Whether failover is enabled */
    isEnabled: boolean("is_enabled").notNull().default(true),

    /** Provider timeout (milliseconds) */
    providerTimeout: integer("provider_timeout").notNull().default(10000),

    /** Max retries per provider */
    maxRetries: integer("max_retries").notNull().default(1),

    /** Created timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    /** Updated timestamp */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Unique constraint per tenant per primary provider */
    unique("ai_provider_failover_tenant_primary_unique").on(t.tenantId, t.primaryProviderId),

    /** Index for tenant lookup */
    index("ai_provider_failover_tenant_idx").on(t.tenantId),
  ],
);

// Relations
export const aiProvidersRelations = relations(aiProviders, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [aiProviders.tenantId],
    references: [tenants.id],
  }),
  domain: one(businessDomains, {
    fields: [aiProviders.parentId],
    references: [businessDomains.id],
    relationName: "domainProviders",
  }),
  models: many(aiProviderModels),
}));

export const aiProviderModelsRelations = relations(aiProviderModels, ({ one }) => ({
  provider: one(aiProviders, {
    fields: [aiProviderModels.providerId],
    references: [aiProviders.providerId],
  }),
}));

export const aiProviderFailoverRelations = relations(aiProviderFailover, ({ one }) => ({
  tenant: one(tenants, {
    fields: [aiProviderFailover.tenantId],
    references: [tenants.id],
  }),
}));

// Type exports
export type AiProvider = typeof aiProviders.$inferSelect;
export type NewAiProvider = typeof aiProviders.$inferInsert;
export type AiProviderModel = typeof aiProviderModels.$inferSelect;
export type NewAiProviderModel = typeof aiProviderModels.$inferInsert;
export type AiProviderFailover = typeof aiProviderFailover.$inferSelect;
export type NewAiProviderFailover = typeof aiProviderFailover.$inferInsert;
