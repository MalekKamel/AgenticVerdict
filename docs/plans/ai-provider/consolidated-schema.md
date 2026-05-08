# Consolidated AI Provider Schema

**Document Version:** 1.0  
**Date:** 2026-05-06  
**Status:** Active  
**Approach:** Greenfield with Schema Consolidation

---

## Overview

This document defines the **consolidated** database schema for AI provider functionality. The design eliminates fragmentation by:

1. **Merging usage tables** - `ai_provider_usage` extended (no separate `ai_usage_logs`)
2. **Unifying domain representation** - Single `business_domains` table with FKs everywhere
3. **Simplifying templates** - Merged config fields, removed denormalized columns
4. **Removing denormalized tenant AI columns** - Single `aiConfig` JSONB as source of truth

### Table Count Reduction

| Category                 | Before                                               | After            | Change          |
| ------------------------ | ---------------------------------------------------- | ---------------- | --------------- |
| AI Provider tables       | 5 (credentials, usage, health, providers, templates) | 4 (merged usage) | **-1**          |
| Domain representations   | 3 (inconsistent varchar)                             | 1 (unified FK)   | **-2**          |
| Tenant AI config columns | 5 (denormalized)                                     | 1 (JSONB)        | **-4**          |
| Template config fields   | 2 (split)                                            | 1 (merged)       | **-1**          |
| **Total reduction**      |                                                      |                  | **-8 elements** |

---

## Consolidated Schema

### 1. `tenants` (Updated - Remove Denormalized AI Columns)

```typescript
// packages/database/src/schema/tenants.ts
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  type: varchar("type", {
    enum: ["direct_business", "agency_partner"],
  })
    .notNull()
    .default("direct_business"),
  status: varchar("status", {
    enum: ["onboarding", "active", "suspended", "churned"],
  })
    .notNull()
    .default("onboarding"),

  // REMOVED: aiProvider, aiModel, aiQualityLevel, aiCustomizationLevel (denormalized)

  // Single source of truth for AI configuration
  aiConfig: jsonb("ai_config").$type<TenantAIConfig>(),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

**Rationale:** Denormalized columns (`aiProvider`, `aiModel`, etc.) are copies of data in `aiConfig`. Removing them eliminates inconsistency risk.

---

### 2. `business_domains` (NEW - Unified Domain Representation)

```typescript
// packages/database/src/schema/business-domains.ts
import {
  pgTable,
  uuid,
  varchar,
  decimal,
  timestamp,
  text,
  jsonb,
  pgPolicy,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Tenant-defined business domains.
 * NOT hardcoded - tenants can create custom domains like "Fleet Management", "Healthcare", etc.
 * Replaces fragmented domain representations (insights.domain, tenant_connectors.domain).
 */
export const businessDomains = pgTable("business_domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // User-defined domain name
  description: text("description"),
  config: jsonb("config").$type<Record<string, unknown>>().default({}), // Domain-specific settings
  budgetLimit: decimal("budget_limit", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RLS Policy: Tenant isolation
export const businessDomainsRLS = pgPolicy("tenant_isolation", {
  on: businessDomains,
  for: "all",
  using: sql`tenant_id = current_setting('app.current_tenant')::uuid`,
});

// Index for tenant lookups
export const businessDomainsTenantIndex = index("business_domains_tenant_idx").on(
  businessDomains.tenantId,
);
```

**Rationale:** Single source of truth for domains. All domain references use FK to this table.

---

### 3. `insights` (Updated - Domain FK)

```typescript
// packages/database/src/schema/core/insights.ts
import { sql } from "drizzle-orm";
import { boolean, index, jsonb, text, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { tenants } from "../tenants";
import { dataConnectors } from "./connectors";
import { businessDomains } from "../business-domains"; // NEW import
import { coreSchema } from "./schema";

export const insights = coreSchema.table("insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  templateId: varchar("template_id", { length: 100 }),
  enabled: boolean("enabled").notNull().default(true),

  // CHANGED: from varchar(255) to FK
  domainId: uuid("domain_id").references(() => businessDomains.id, { onDelete: "set null" }),

  status: varchar("status", { length: 50 }).notNull().default("idle"),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastRunStatus: varchar("last_run_status", { length: 50 }),
  schedule: jsonb("schedule")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  delivery: jsonb("delivery")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  aiConfig: jsonb("ai_config")
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Index for domain lookups
export const insightsDomainIndex = index("insights_domain_id_idx").on(insights.domainId);

export const insightsTenantIndex = index("insights_tenant_id_idx").on(insights.tenantId);

export const insightsTenantNameUnique = unique("insights_tenant_name_unique").on(
  insights.tenantId,
  insights.name,
);
```

**Rationale:** FK ensures domain integrity. Cannot assign insight to non-existent domain.

---

### 4. `tenant_connectors` (Updated - Domain FK)

```typescript
// packages/database/src/schema/core/connectors.ts (UPDATED)
export const tenantConnectors = pgTable("tenant_connectors", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  platform: varchar("platform", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("inactive"),

  // CHANGED: from varchar(255) to FK
  domainId: uuid("domain_id").references(() => businessDomains.id, { onDelete: "set null" }),

  // ... rest of fields ...
});
```

**Rationale:** Consistent domain representation across all tables.

---

### 5. `ai_provider_credentials` (KEEP SEPARATE - Security)

```typescript
// packages/database/src/schema/ai-provider-credentials.ts
export const aiProviderCredentials = pgTable("ai_provider_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  providerId: varchar("provider_id", { length: 64 }).notNull(),
  encryptedApiKey: text("encrypted_api_key").notNull(),
  encryptionIv: text("encryption_iv").notNull(),
  baseUrl: text("base_url"),
  awsAccessKeyId: text("aws_access_key_id"),
  awsSecretAccessKey: text("aws_secret_access_key"),
  awsRegion: varchar("aws_region", { length: 32 }),
  isActive: boolean("is_active").notNull().default(true),
  priority: integer("priority").notNull().default(0),
  rateLimitOverride: integer("rate_limit_override"),
  timeoutOverride: integer("timeout_override"),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  lastRotatedAt: timestamp("last_rotated_at", { withTimezone: true }),
  nextRotationAt: timestamp("next_rotation_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// RLS Policy
export const aiProviderCredentialsRLS = pgPolicy("tenant_isolation", {
  on: aiProviderCredentials,
  for: "all",
  using: sql`tenant_id = current_setting('app.current_tenant')::uuid`,
});
```

**Rationale for separation:**

- **Security:** Credentials have different access patterns and encryption requirements
- **Rotation:** Credentials rotate independently of provider config
- **Audit:** Credential access needs separate audit trail
- **Failover:** Multiple credentials per provider (primary + backup)

---

### 6. `ai_providers` (NEW - Hierarchical Config, NO config field)

```typescript
// packages/database/src/schema/ai-providers.ts
import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  timestamp,
  text,
  pgPolicy,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { businessDomains } from "./business-domains";
import { aiProviderTemplates } from "./ai-templates";
import { insights } from "./core/insights";

export const aiProviders = pgTable("ai_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),

  // Hierarchy support
  scope: varchar("scope", {
    enum: ["tenant", "domain", "insight"],
  })
    .default("tenant")
    .notNull(),

  insightId: uuid("insight_id").notNull(),
  domainId: uuid("domain_id").references(() => businessDomains.id, { onDelete: "cascade" }),
  templateId: uuid("template_id").references(() => aiProviderTemplates.id, {
    onDelete: "set null",
  }),
  parentConfigId: uuid("parent_config_id").references(() => aiProviders.id, {
    onDelete: "cascade",
  }),

  // Cost tier
  tier: varchar("tier", {
    enum: ["premium", "standard", "economy"],
  })
    .default("standard")
    .notNull(),

  // Connector linkage
  connectorIds: uuid("connector_ids").array().default([]),

  // Provider metadata
  name: varchar("name", { length: 255 }).notNull(),
  source: varchar("source", {
    enum: ["builtin", "custom", "remote"],
  }).notNull(),
  enabled: boolean("enabled").default(true),

  // REMOVED: config field (use aiProviderCredentials for secrets)

  fetchOnClient: boolean("fetch_on_client"),
  sort: integer("sort").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RLS Policy
export const aiProvidersRLS = pgPolicy("tenant_isolation", {
  on: aiProviders,
  for: "all",
  using: sql`tenant_id = current_setting('app.current_tenant')::uuid`,
});

// Indexes for hierarchy resolution
export const aiProvidersScopeIndex = index("ai_providers_scope_idx").on(
  aiProviders.tenantId,
  aiProviders.scope,
  aiProviders.insightId,
  aiProviders.domainId,
);
```

**Rationale:** Provider config is metadata + references to credentials. Secrets stored separately.

---

### 7. `ai_provider_templates` (Simplified - Merged Config)

```typescript
// packages/database/src/schema/ai-templates.ts
import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  timestamp,
  text,
  jsonb,
  pgPolicy,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { businessDomains } from "./business-domains";

export const aiProviderTemplates = pgTable("ai_provider_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id"), // NULL for system templates
  name: varchar("name", { length: 255 }).notNull(),
  domainId: uuid("domain_id").references(() => businessDomains.id, { onDelete: "set null" }),
  description: text("description"),

  // MERGED: Single config object (was: providerConfig + modelConfig)
  config: jsonb("config")
    .$type<{
      providers: string[];
      models: Record<string, string>;
      failover?: boolean;
    }>()
    .notNull(),

  tier: varchar("tier", {
    enum: ["premium", "standard", "economy"],
  })
    .default("standard")
    .notNull(),
  isSystem: boolean("is_system").default(false).notNull(),

  // REMOVED: usageCount (compute from ai_providers.template_id)

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RLS Policy (system templates visible to all)
export const aiProviderTemplatesRLS = pgPolicy("tenant_isolation", {
  on: aiProviderTemplates,
  for: "all",
  using: sql`
    is_system = true 
    OR tenant_id = current_setting('app.current_tenant')::uuid
  `,
});

// Index for template lookups
export const aiProviderTemplatesDomainIndex = index("ai_provider_templates_domain_idx").on(
  aiProviderTemplates.domainId,
  aiProviderTemplates.isSystem,
);
```

**Rationale:**

- `providerConfig` + `modelConfig` are logically one configuration
- `usageCount` is denormalized; compute via `SELECT COUNT(*) FROM ai_providers WHERE template_id = ?`

---

### 8. `ai_provider_usage` (Extended - Merged with ai_usage_logs)

```typescript
// packages/database/src/schema/ai-provider-usage.ts
import {
  pgTable,
  uuid,
  varchar,
  integer,
  decimal,
  timestamp,
  boolean,
  pgPolicy,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Consolidated usage tracking (merged ai_provider_usage + ai_usage_logs).
 * Tracks per-request usage with optional insight_id for insight-level attribution.
 */
export const aiProviderUsage = pgTable("ai_provider_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),

  // NEW: nullable for tenant-level usage (was: separate ai_usage_logs table)
  insightId: uuid("insight_id"),

  providerId: varchar("provider_id", { length: 64 }).notNull(),
  modelId: varchar("model_id", { length: 128 }).notNull(),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  costCents: integer("cost_cents").notNull().default(0),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  requestId: uuid("request_id"),
  wasFailover: boolean("was_failover").notNull().default(false),
  latencyMs: integer("latency_ms"),
  success: boolean("success").notNull().default(true),
  errorCode: varchar("error_code", { length: 64 }),

  // NEW fields from ai_usage_logs
  durationMs: integer("duration_ms"),

  // RLS Policy
  using: sql`tenant_id = current_setting('app.current_tenant')::uuid`,
});

// RLS Policy
export const aiProviderUsageRLS = pgPolicy("tenant_isolation", {
  on: aiProviderUsage,
  for: "all",
  using: sql`tenant_id = current_setting('app.current_tenant')::uuid`,
});

// Indexes for aggregation
export const aiProviderUsageInsightIndex = index("ai_provider_usage_insight_idx").on(
  aiProviderUsage.insightId,
  aiProviderUsage.timestamp,
);

export const aiProviderUsageTenantIndex = index("ai_provider_usage_tenant_idx").on(
  aiProviderUsage.tenantId,
  aiProviderUsage.timestamp,
);
```

**Rationale:**

- Same data domain (usage metrics)
- `insightId` nullable allows both tenant-level and insight-level tracking
- Reduces table count by 1
- Preserves existing data and queries

---

### 9. `ai_provider_health` (KEEP - Circuit Breaker)

```typescript
// packages/database/src/schema/ai-provider-health.ts
export const aiProviderHealth = pgTable("ai_provider_health", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerId: varchar("provider_id", { length: 64 }).notNull(),
  tenantId: uuid("tenant_id"), // null for global health
  errorRate: integer("error_rate").notNull().default(0),
  avgLatencyMs: integer("avg_latency_ms").notNull().default(0),
  p95LatencyMs: integer("p95_latency_ms").notNull().default(0),
  requestsPerMinute: integer("requests_per_minute").notNull().default(0),
  circuitState: varchar("circuit_state", { length: 16 }).notNull().default("closed"),
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  lastHealthCheck: timestamp("last_health_check", { withTimezone: true }).notNull().defaultNow(),
  lastFailure: timestamp("last_failure", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

**Rationale:** Circuit breaker state has different query patterns (health checks vs config). Keep separate.

---

## Schema Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                         tenants                              │
│  id (PK)                                                     │
│  aiConfig (JSONB - single source of truth)                   │
└─────────────────────────────────────────────────────────────┘
         │
         ├──────────────────────────────────────────┐
         │                                          │
         ↓                                          ↓
┌─────────────────────────┐              ┌─────────────────────────┐
│    business_domains     │              │   ai_provider_credentials│
│  id (PK)                │              │  id (PK)                │
│  tenant_id (FK)         │              │  tenant_id (FK)         │
│  name (user-defined)    │              │  provider_id            │
└─────────────────────────┘              │  encrypted_api_key      │
         │                               └─────────────────────────┘
         │
         ├────────────┬────────────┬────────────┐
         │            │            │            │
         ↓            ↓            ↓            ↓
┌─────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│  insights   │ │tenant_   │ │ai_       │ │ai_provider_  │
│  domain_id  │ │connectors│ │providers │ │templates     │
│  (FK)       │ │domain_id │ │domain_id │ │domain_id     │
│             │ │(FK)      │ │(FK)      │ │(FK)          │
└─────────────┘ └──────────┘ └──────────┘ └──────────────┘
                      │            │
                      │            ├──────────────┐
                      │            │              │
                      ↓            ↓              ↓
               ┌──────────┐ ┌──────────┐ ┌──────────────┐
               │insight_  │ │ai_       │ │ai_provider_  │
               │connectors│ │provider_ │ │usage         │
               │          │ │usage     │ │insight_id    │
               └──────────┘ └──────────┘ └──────────────┘
```

---

## Consolidation Summary

### Tables Merged

| Original Tables                                                              | Consolidated Table             | Savings            |
| ---------------------------------------------------------------------------- | ------------------------------ | ------------------ |
| `ai_provider_usage` + `ai_usage_logs`                                        | `ai_provider_usage` (extended) | -1 table           |
| `providerConfig` + `modelConfig`                                             | `config` (JSONB)               | -1 field           |
| `insights.domain` + `tenant_connectors.domain` + `business_domains`          | `business_domains` (FK)        | -2 varchar columns |
| `tenants.aiProvider` + `aiModel` + `aiQualityLevel` + `aiCustomizationLevel` | `tenants.aiConfig`             | -4 columns         |
| `ai_provider_templates.usageCount`                                           | Computed from `ai_providers`   | -1 column          |

**Total reduction:** 1 table + 8 columns

### Tables Kept Separate

| Table                     | Justification                                          |
| ------------------------- | ------------------------------------------------------ |
| `ai_provider_credentials` | Security isolation, encryption requirements, rotation  |
| `ai_provider_health`      | Circuit breaker state, different query patterns        |
| `business_domains`        | Core business entity, enables domain-level aggregation |
| `ai_provider_templates`   | Template pattern distinct from runtime config          |
| `insight_connectors`      | Proper many-to-many junction                           |

---

## Query Pattern Examples

### Get Provider Config for Insight (with credentials)

```typescript
const config = await db
  .select({
    provider: aiProviders,
    credentials: aiProviderCredentials,
  })
  .from(aiProviders)
  .leftJoin(
    aiProviderCredentials,
    and(
      eq(aiProviders.tenantId, aiProviderCredentials.tenantId),
      eq(aiProviders.name, aiProviderCredentials.providerId),
      eq(aiProviderCredentials.isActive, true),
    ),
  )
  .where(
    and(
      eq(aiProviders.tenantId, tenantId),
      eq(aiProviders.scope, "insight"),
      eq(aiProviders.insightId, insightId),
    ),
  )
  .limit(1);
```

### Get Usage by Insight

```typescript
const usage = await db
  .select({
    providerId: aiProviderUsage.providerId,
    modelId: aiProviderUsage.modelId,
    inputTokens: sum(aiProviderUsage.inputTokens),
    outputTokens: sum(aiProviderUsage.outputTokens),
    costCents: sum(aiProviderUsage.costCents),
  })
  .from(aiProviderUsage)
  .where(
    and(
      eq(aiProviderUsage.tenantId, tenantId),
      eq(aiProviderUsage.insightId, insightId),
      gte(aiProviderUsage.timestamp, startDate),
      lte(aiProviderUsage.timestamp, endDate),
    ),
  )
  .groupBy(aiProviderUsage.providerId, aiProviderUsage.modelId);
```

### Get Template Usage Count (computed)

```typescript
const result = await db
  .select({
    templateId: aiProviders.templateId,
    count: count(),
  })
  .from(aiProviders)
  .where(eq(aiProviders.templateId, templateId))
  .groupBy(aiProviders.templateId);
```

---

## Next Steps

1. **Update schema files** in `packages/database/src/schema/`
2. **Run `drizzle-kit push`** to apply consolidated schema
3. **Update type definitions** in `packages/core/src/types/`
4. **Update API layer** to use consolidated schema
5. **Test queries** for performance regression

---

**Related Documents:**

- Gap Analysis: `/docs/plans/ai-provider/gap-analysis.md`
- Implementation Plan: `/docs/plans/ai-provider/implementation-plan-refined.md`
- Greenfield Schema: `/docs/plans/ai-provider/greenfield-schema.md`

---

**Document Status:** ✅ Active  
**Approach:** Consolidated (Reduced fragmentation)  
**Production Ready:** No (migration files needed before production)
