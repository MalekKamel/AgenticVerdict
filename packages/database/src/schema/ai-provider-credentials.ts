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
} from "drizzle-orm/pg-core";

/**
 * AI Provider Credentials Schema (Task 1.14, 3.46)
 * Encrypted storage for tenant AI provider API keys
 */

export const aiProviderCredentials = pgTable(
  "ai_provider_credentials",
  {
    /** Unique identifier for this credential record */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Tenant ID - scoped for multi-tenancy */
    tenantId: uuid("tenant_id").notNull(),

    /** Provider identifier (openai, anthropic, google, etc.) */
    providerId: varchar("provider_id", { length: 64 }).notNull(),

    /** Encrypted API key (using crypto utilities) */
    encryptedApiKey: text("encrypted_api_key").notNull(),

    /** IV (initialization vector) for decryption */
    encryptionIv: text("encryption_iv").notNull(),

    /** Optional custom base URL for OpenAI-compatible providers */
    baseUrl: text("base_url"),

    /** AWS-specific fields for Bedrock */
    awsAccessKeyId: text("aws_access_key_id"),
    awsSecretAccessKey: text("aws_secret_access_key"),
    awsRegion: varchar("aws_region", { length: 32 }),

    /** Whether this credential is active */
    isActive: boolean("is_active").notNull().default(true),

    /** Priority for failover ordering */
    priority: integer("priority").notNull().default(0),

    /** Optional rate limit override (requests per minute) */
    rateLimitOverride: integer("rate_limit_override"),

    /** Optional timeout override (milliseconds) */
    timeoutOverride: integer("timeout_override"),

    /** Last successful usage timestamp */
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),

    /** Last rotation timestamp */
    lastRotatedAt: timestamp("last_rotated_at", { withTimezone: true }),

    /** Next scheduled rotation timestamp */
    nextRotationAt: timestamp("next_rotation_at", { withTimezone: true }),

    /** Created timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    /** Updated timestamp */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Unique constraint: one active credential per tenant per provider */
    unique("ai_provider_credentials_tenant_provider_unique").on(t.tenantId, t.providerId),

    /** Index for fast tenant lookup */
    unique("ai_provider_credentials_tenant_idx").on(t.tenantId),
  ],
);

/**
 * AI Provider Usage Tracking Schema
 * Tracks usage metrics per tenant per provider for billing and cost optimization
 */
export const aiProviderUsage = pgTable(
  "ai_provider_usage",
  {
    /** Unique identifier for this usage record */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Tenant ID */
    tenantId: uuid("tenant_id").notNull(),

    /** Provider ID */
    providerId: varchar("provider_id", { length: 64 }).notNull(),

    /** Model ID used */
    modelId: varchar("model_id", { length: 128 }).notNull(),

    /** Number of input tokens */
    inputTokens: integer("input_tokens").notNull().default(0),

    /** Number of output tokens */
    outputTokens: integer("output_tokens").notNull().default(0),

    /** Total cost in USD cents */
    costCents: integer("cost_cents").notNull().default(0),

    /** Request timestamp */
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),

    /** Request ID for tracing */
    requestId: uuid("request_id"),

    /** Whether this request used failover */
    wasFailover: boolean("was_failover").notNull().default(false),

    /** Response latency in milliseconds */
    latencyMs: integer("latency_ms"),

    /** Whether request succeeded */
    success: boolean("success").notNull().default(true),

    /** Error code if failed */
    errorCode: varchar("error_code", { length: 64 }),
  },
  (t) => [
    /** Index for tenant usage queries */
    index("ai_provider_usage_tenant_idx").on(t.tenantId),

    /** Index for time-based queries */
    index("ai_provider_usage_timestamp_idx").on(t.timestamp),

    /** Composite index for billing queries */
    index("ai_provider_usage_tenant_provider_month_idx").on(t.tenantId, t.providerId, t.timestamp),
  ],
);

/**
 * AI Provider Health Metrics Schema
 * Tracks provider health for circuit breaker and failover decisions
 */
export const aiProviderHealth = pgTable(
  "ai_provider_health",
  {
    /** Unique identifier */
    id: uuid("id").primaryKey().defaultRandom(),

    /** Provider ID */
    providerId: varchar("provider_id", { length: 64 }).notNull(),

    /** Tenant ID (null for global health) */
    tenantId: uuid("tenant_id"),

    /** Error rate (0.0 - 1.0) */
    errorRate: integer("error_rate").notNull().default(0), // stored as basis points (0-10000)

    /** Average latency in milliseconds */
    avgLatencyMs: integer("avg_latency_ms").notNull().default(0),

    /** P95 latency in milliseconds */
    p95LatencyMs: integer("p95_latency_ms").notNull().default(0),

    /** Requests per minute */
    requestsPerMinute: integer("requests_per_minute").notNull().default(0),

    /** Circuit breaker state: closed, open, half-open */
    circuitState: varchar("circuit_state", { length: 16 }).notNull().default("closed"),

    /** Consecutive failures count */
    consecutiveFailures: integer("consecutive_failures").notNull().default(0),

    /** Last health check timestamp */
    lastHealthCheck: timestamp("last_health_check", { withTimezone: true }).notNull().defaultNow(),

    /** Last failure timestamp */
    lastFailure: timestamp("last_failure", { withTimezone: true }),

    /** Created timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),

    /** Updated timestamp */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    /** Unique constraint per provider per tenant */
    unique("ai_provider_health_provider_tenant_unique").on(t.providerId, t.tenantId),
  ],
);

// Type exports
export type AiProviderCredential = typeof aiProviderCredentials.$inferSelect;
export type NewAiProviderCredential = typeof aiProviderCredentials.$inferInsert;
export type AiProviderUsage = typeof aiProviderUsage.$inferSelect;
export type NewAiProviderUsage = typeof aiProviderUsage.$inferInsert;
export type AiProviderHealth = typeof aiProviderHealth.$inferSelect;
export type NewAiProviderHealth = typeof aiProviderHealth.$inferInsert;
