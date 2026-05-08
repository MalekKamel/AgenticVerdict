# Greenfield Database Schema Guide

**Document Version:** 1.0  
**Date:** 2026-05-06  
**Status:** Active  
**Approach:** Destructive Updates, No Migrations

---

## Overview

This is a **pre-production greenfield implementation**. Database schema changes are applied destructively without backward compatibility or data migration.

### Key Principles

1. **Destructive updates:** Drop and recreate tables as needed
2. **No migrations:** Use `drizzle-kit push` for direct schema application
3. **No data preservation:** Test/dev data can be wiped during schema updates
4. **Fast iteration:** Schema evolves rapidly without migration overhead
5. **Production readiness:** Final schema will be migration-ready before production launch

---

## Schema Commands

### Push Schema Changes

```bash
# Push schema directly to database (destructive)
pnpm --filter @agenticverdict/database db:push

# Generate migration files (for documentation only)
pnpm --filter @agenticverdict/database db:generate

# Reset database and push schema (full reset)
pnpm --filter @agenticverdict/database db:reset
pnpm --filter @agenticverdict/database db:push
```

### Drizzle Kit Configuration

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Greenfield mode: no safety checks
  strict: false,
});
```

---

## Complete Schema Definition

### AI Providers Schema

```typescript
// packages/database/src/schema/ai-providers.ts
import {
  pgTable,
  uuid,
  varchar,
  boolean,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { insights } from "./insights";
import { businessDomains } from "./business-domains";
import { aiProviderTemplates } from "./ai-templates";

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

  // Provider config
  name: varchar("name", { length: 255 }).notNull(),
  source: varchar("source", {
    enum: ["builtin", "custom", "remote"],
  }).notNull(),
  enabled: boolean("enabled").default(true),
  config: text("config").$type<EncryptedConfig>(),
  fetchOnClient: boolean("fetch_on_client"),
  sort: integer("sort").default(0),

  // Audit
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Indexes
export const aiProvidersScopeIndex = index("ai_providers_scope_idx").on(
  aiProviders.tenantId,
  aiProviders.scope,
  aiProviders.insightId,
  aiProviders.domainId,
);

export const aiProvidersTenantIndex = index("ai_providers_tenant_idx").on(aiProviders.tenantId);
```

### Business Domains Schema (Domain Agnostic)

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

**Key Design Decision:** Domains are NOT hardcoded enums. Each tenant can create custom domains:

- Tenant A (Logistics): "Fleet Management", "Supply Chain", "Driver Performance"
- Tenant B (Healthcare): "Clinical Operations", "Patient Outcomes", "Billing"
- Tenant C (E-commerce): "Marketing", "Sales", "Customer Success"

### AI Usage Logs Schema

```typescript
// packages/database/src/schema/core/insights.ts (UPDATED)
import { sql } from "drizzle-orm";
import { boolean, index, jsonb, text, timestamp, unique, uuid, varchar } from "drizzle-orm/pg-core";
import { tenants } from "../tenants";
import { dataConnectors } from "./connectors";
import { coreSchema } from "./schema";
import { businessDomains } from "../business-domains';  // NEW import

/**
 * Business-facing insight configuration.
 * Scoped to a tenant; links to connectors via {@link insightConnectors}.
 */
export const insights = coreSchema.table('insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  templateId: varchar('template_id', { length: 100 }),
  enabled: boolean('enabled').notNull().default(true),

  // UPDATED: Foreign key to business_domains (was: varchar domain)
  domainId: uuid('domain_id')
    .references(() => businessDomains.id, { onDelete: 'set null' }),

  status: varchar('status', { length: 50 }).notNull().default('idle'),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  lastRunStatus: varchar('last_run_status', { length: 50 }),
  schedule: jsonb('schedule')
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  delivery: jsonb('delivery')
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  aiConfig: jsonb('ai_config')
    .$type<Record<string, unknown>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Index for domain lookups
export const insightsDomainIndex = index('insights_domain_id_idx')
  .on(insights.domainId);

export const insightsTenantIndex = index('insights_tenant_id_idx')
  .on(insights.tenantId);

export const insightsTenantNameUnique = unique('insights_tenant_name_unique')
  .on(insights.tenantId, insights.name);
```

**Key Change:** `domain` varchar field replaced with `domainId` foreign key to `businessDomains.id`.

### AI Usage Logs Schema

```typescript
// packages/database/src/schema/ai-usage.ts
import {
  pgTable,
  uuid,
  integer,
  decimal,
  timestamp,
  text,
  pgPolicy,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const aiUsageLogs = pgTable("ai_usage_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  insightId: uuid("insight_id").notNull(),
  providerId: uuid("provider_id").notNull(),
  modelId: uuid("model_id").notNull(),
  inputTokens: integer("input_tokens").notNull(),
  outputTokens: integer("output_tokens").notNull(),
  costUsd: decimal("cost_usd", { precision: 10, scale: 6 }).notNull(),
  requestId: uuid("request_id").notNull(),
  duration: integer("duration"), // ms
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// RLS Policy
export const aiUsageLogsRLS = pgPolicy("tenant_isolation", {
  on: aiUsageLogs,
  for: "all",
  using: sql`tenant_id = current_setting('app.current_tenant')::uuid`,
});

// Indexes for aggregation
export const aiUsageLogsInsightIndex = index("ai_usage_logs_insight_idx").on(
  aiUsageLogs.insightId,
  aiUsageLogs.createdAt,
);

export const aiUsageLogsTenantIndex = index("ai_usage_logs_tenant_idx").on(
  aiUsageLogs.tenantId,
  aiUsageLogs.createdAt,
);
```

### AI Provider Templates Schema (Domain Agnostic)

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
  domainId: uuid("domain_id").references(() => businessDomains.id, { onDelete: "set null" }), // FK to business_domains
  description: text("description"),
  providerConfig: jsonb("provider_config").notNull(),
  modelConfig: jsonb("model_config").notNull(),
  tier: varchar("tier", {
    enum: ["premium", "standard", "economy"],
  })
    .default("standard")
    .notNull(),
  isSystem: boolean("is_system").default(false).notNull(),
  usageCount: integer("usage_count").default(0),
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

**Note:** Templates can be associated with tenant-defined domains via `domainId` foreign key.

---

## Schema Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    aiProviders                               │
├─────────────────────────────────────────────────────────────┤
│ id (PK)                                                      │
│ tenant_id (FK → tenants)                                     │
│ insight_id (FK → insights)                                   │
│ domain_id (FK → businessDomains)                             │
│ template_id (FK → aiProviderTemplates)                       │
│ parent_config_id (FK → aiProviders self-reference)           │
└─────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   insights      │  │ businessDomains │  │aiProviderTemplat│
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ id (PK)         │  │ id (PK)         │  │ id (PK)         │
│ tenant_id (FK)  │  │ tenant_id (FK)  │  │ domain          │
│ name            │  │ name            │  │ provider_config │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Seeding

### Seed Script

```typescript
// packages/database/src/seed/ai-templates.ts
import { db } from "../index";
import { aiProviderTemplates } from "../schema";

export async function seedAiTemplates() {
  console.log("Seeding AI provider templates...");

  // System templates (available to all tenants, no domain association)
  await db
    .insert(aiProviderTemplates)
    .values([
      {
        name: "Premium AI Configuration",
        domainId: null, // Not associated with specific domain
        description: "Highest quality models for critical analysis",
        providerConfig: {
          providers: ["anthropic", "openai"],
          failover: true,
        },
        modelConfig: {
          chat: "claude-3-opus",
          analysis: "gpt-4o",
        },
        tier: "premium",
        isSystem: true,
      },
      {
        name: "Standard AI Configuration",
        domainId: null,
        description: "Balanced cost/quality for regular analysis",
        providerConfig: {
          providers: ["openai", "anthropic"],
          failover: true,
        },
        modelConfig: {
          chat: "gpt-4o",
          analysis: "claude-3-5-sonnet",
        },
        tier: "standard",
        isSystem: true,
      },
      {
        name: "Economy AI Configuration",
        domainId: null,
        description: "Cost-optimized for high-volume analysis",
        providerConfig: {
          providers: ["openai"],
          failover: false,
        },
        modelConfig: {
          chat: "gpt-3.5-turbo",
          analysis: "gpt-4o-mini",
        },
        tier: "economy",
        isSystem: true,
      },
    ])
    .onConflictDoNothing();

  console.log("✓ AI provider templates seeded");
}
```

**Note:** System templates are NOT associated with specific domains. Tenants can:

1. Use system templates as-is
2. Create custom templates for their custom domains
3. Copy and modify system templates

### Run Seeding

```bash
# Seed all data
pnpm db:seed:dev-full

# Seed specific module
pnpm --filter @agenticverdict/database seed:ai-providers
```

---

## Development Workflow

### Daily Development

```bash
# 1. Make schema changes
edit packages/database/src/schema/ai-providers.ts

# 2. Push changes to local database
pnpm --filter @agenticverdict/database db:push

# 3. Seed test data
pnpm db:seed:test

# 4. Run tests
pnpm run test:unit -- ai-provider
```

### Reset Everything

```bash
# Full database reset
pnpm --filter @agenticverdict/database db:reset

# This will:
# 1. Drop all tables
# 2. Recreate from schema
# 3. Run all seed scripts
```

---

## Production Preparation

### Before Production Launch

When ready for production:

1. **Create migration files:**

   ```bash
   pnpm --filter @agenticverdict/database db:generate
   ```

2. **Review migration SQL:**

   ```bash
   cat packages/database/drizzle/*.sql
   ```

3. **Test migration on staging:**

   ```bash
   # Staging environment
   DATABASE_URL=postgres://... pnpm --filter @agenticverdict/database db:migrate
   ```

4. **Verify data integrity:**

   ```bash
   # Run integrity checks
   pnpm --filter @agenticverdict/database db:verify
   ```

5. **Deploy to production:**
   ```bash
   # Production migration
   DATABASE_URL=postgres://... pnpm --filter @agenticverdict/database db:migrate
   ```

---

## Related Documents

- Implementation Plan: `/docs/plans/ai-provider/implementation-plan-refined.md`
- Gap Analysis: `/docs/plans/ai-provider/gap-analysis.md`
- Drizzle ORM Docs: `packages/database/README.md`

---

**Document Status:** ✅ Active  
**Approach:** Greenfield (Destructive)  
**Production Ready:** No (migration files needed before production)
