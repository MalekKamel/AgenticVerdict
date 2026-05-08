# AI Provider UI Implementation Plan (Business-Aligned)

**Based on:** Gap Analysis (`gap-analysis.md`), Refined Analysis (`implementation-plan-refined-analysis.md`)  
**Duration:** 5.5 weeks (revised from 3 weeks)  
**Effort:** 38 person-days (revised from 22 person-days)  
**Phase:** Phase 2 - Provider Expansion with Business Alignment  
**Approach:** Greenfield (Destructive Updates, No Backward Compatibility)

---

## Overview

This implementation plan extends the AI provider UI to support **hierarchical configuration** (Tenant → Domain → Insight) aligned with business architecture requirements. The plan retains Lobe Chat's production-grade patterns while adding insight-level configuration, template inheritance, usage tracking, and multi-domain intelligence.

### Greenfield Approach

**This is a pre-production greenfield implementation:**

- **Destructive updates:** Schema changes are applied directly without migrations
- **No backward compatibility:** Existing tables can be dropped/recreated
- **No data preservation:** Test/staging data can be wiped during schema updates
- **Fast iteration:** Schema evolves rapidly without migration overhead

### Key Changes from Original Plan

| Aspect                   | Original Plan              | Revised Plan                              |
| ------------------------ | -------------------------- | ----------------------------------------- |
| **Configuration Scope**  | Tenant-only                | Tenant → Domain → Insight hierarchy       |
| **Duration**             | 3 weeks                    | 5 weeks                                   |
| **Effort**               | 22 person-days             | 35 person-days                            |
| **New Features**         | None                       | Templates, usage tracking, domains, tiers |
| **Business Alignment**   | 14%                        | 100%                                      |
| **Migration Complexity** | High (backward-compatible) | None (greenfield)                         |

---

## Architecture Hierarchy

### Configuration Inheritance Model

```
┌─────────────────────────────────────────────────────────────┐
│                    Tenant Level (Root)                       │
│  - Default providers for entire tenant                       │
│  - Global budget limits                                      │
│  - System-wide failover configuration                        │
│  - Inherited by: All domains and insights                    │
└─────────────────────────────────────────────────────────────┘
                            ↓ inherits
┌─────────────────────────────────────────────────────────────┐
│                    Domain Level (Optional)                   │
│  - Marketing, Finance, Operations, SEO, Social, Local        │
│  - Domain-specific provider preferences                      │
│  - Domain budget allocation                                  │
│  - Inherited by: All insights in domain                      │
└─────────────────────────────────────────────────────────────┘
                            ↓ inherits
┌─────────────────────────────────────────────────────────────┐
│                    Insight Level (Override)                  │
│  - Insight-specific provider selection                       │
│  - Custom model overrides                                    │
│  - Insight budget limits                                     │
│  - Full customization of all properties                      │
└─────────────────────────────────────────────────────────────┘
```

### Resolution Algorithm

**CRITICAL:** Tenant validation must be explicit at each level to prevent tenant isolation bypass.

```typescript
async function resolveAiConfig(insightId: string, tenantId: string) {
  // 1. Check insight-level config with explicit tenant validation
  const insightConfig = await db.query.aiProviders.findFirst({
    where: and(
      eq(aiProviders.scope, "insight"),
      eq(aiProviders.insightId, insightId),
      eq(aiProviders.tenantId, tenantId), // ✅ CRITICAL: Explicit tenant check
    ),
  });
  if (insightConfig && !insightConfig.useParentDefaults) {
    return insightConfig;
  }

  // 2. Get insight's domain with tenant validation
  const insight = await db.query.insights.findFirst({
    where: and(
      eq(insights.id, insightId),
      eq(insights.tenantId, tenantId), // ✅ CRITICAL: Explicit tenant check
    ),
    with: { domain: true },
  });

  if (!insight) {
    throw new UnauthorizedError("Insight not found in tenant");
  }

  // 3. Check domain-level config with tenant validation
  if (insight.domainId) {
    const domainConfig = await db.query.aiProviders.findFirst({
      where: and(
        eq(aiProviders.scope, "domain"),
        eq(aiProviders.domainId, insight.domainId),
        eq(aiProviders.tenantId, tenantId), // ✅ CRITICAL: Explicit tenant check
      ),
    });
    if (domainConfig && !domainConfig.useParentDefaults) {
      return mergeConfigs(domainConfig, insightConfig);
    }
  }

  // 4. Fall back to tenant-level config
  const tenantConfig = await db.query.aiProviders.findFirst({
    where: and(eq(aiProviders.scope, "tenant"), eq(aiProviders.tenantId, tenantId)),
  });

  return mergeConfigs(tenantConfig, domainConfig, insightConfig);
}
```

**Caching Strategy (L1 + L2):**

```typescript
class ConfigHierarchyResolver {
  private static l1Cache = new NodeCache({ stdTTL: 300 }); // 5 min TTL
  private static l2CacheKey = (tenantId: string, insightId: string) =>
    `tenant:${tenantId}:insight:${insightId}:aiConfig`;

  static async resolve(tenantId: string, insightId: string): Promise<ResolvedAiConfig> {
    // L1 cache check
    const l1Key = `${tenantId}:${insightId}`;
    const cached = this.l1Cache.get(l1Key);
    if (cached) return cached as ResolvedAiConfig;

    // L2 cache check (Redis)
    const l2Cached = await redis.get(this.l2CacheKey(tenantId, insightId));
    if (l2Cached) {
      this.l1Cache.set(l1Key, l2Cached);
      return JSON.parse(l2Cached);
    }

    // Resolve from database
    const config = await this.resolveFromDB(tenantId, insightId);

    // Populate caches
    this.l1Cache.set(l1Key, config);
    await redis.setex(this.l2CacheKey(tenantId, insightId), 300, JSON.stringify(config));

    return config;
  }

  static async invalidateCache(tenantId: string, insightId: string): Promise<void> {
    this.l1Cache.del(`${tenantId}:${insightId}`);
    await redis.del(this.l2CacheKey(tenantId, insightId));
  }
}
```

**Performance Target:** <10ms p95 latency (with caching enabled)

---

## Implementation Tasks

### Task 2.1: Extended Type System & Schemas

**Duration:** 2 days
**Files:** `packages/core/src/types/ai-models.ts`, `packages/core/src/schemas/ai-provider.ts`, `packages/core/src/types/business-domains.ts` (NEW)

**Deliverables:**

- [ ] Extend `AiProviderDetailItem` with:
  - `scope: 'tenant' | 'domain' | 'insight'`
  - `insightId?: string`
  - `domainId?: string`
  - `templateId?: string`
  - `tier: 'premium' | 'standard' | 'economy'`
  - `parentConfigId?: string`
  - `connectorIds?: string[]`
- [ ] Define `CostTier` enum:
  - `premium` (highest quality, highest cost)
  - `standard` (balanced quality/cost)
  - `economy` (cost-optimized)
- [ ] Define `BusinessDomain` interface (NOT enum - domain agnostic):
  - `id: string`
  - `tenantId: string`
  - `name: string` (user-defined, e.g., "Marketing", "Finance", "Custom Domain")
  - `description?: string`
  - `config?: Record<string, unknown>` (domain-specific settings)
- [ ] Define `AiUsageReport` interface:
  - `insightId`, `providerId`, `modelId`
  - `inputTokens`, `outputTokens`, `totalTokens`
  - `costUsd`, `requestCount`
  - `dateRange`
- [ ] Create Zod schemas:
  - `CreateAiProviderSchema` (extended with scope, tier, domain)
  - `UpdateAiProviderSchema`
  - `CreateAiProviderTemplateSchema` (NEW)
  - `ApplyTemplateSchema` (NEW)
  - `SetCostTierSchema` (NEW)
  - `CreateBusinessDomainSchema` (NEW)
  - `TrackUsageSchema` (NEW)

**Business Requirements Mapping:**

- AI-INSIGHT-001, AI-INSIGHT-003, AI-COST-001, AI-DOMAIN-001

**Note:** Domains are NOT hardcoded. Tenants can create custom domains (e.g., "Fleet Management", "Healthcare Analytics") to match their business needs.

---

### Task 2.2: Database Schema (Consolidated, Greenfield)

**Duration:** 3 days (+1 for RLS policies, template versioning)  
**Files:** `packages/database/src/schema/ai-providers.ts`, `packages/database/src/schema/business-domains.ts`, `packages/database/src/schema/ai-provider-usage.ts` (update), `packages/database/src/schema/ai-templates.ts`, `packages/database/src/schema/core/insights.ts` (update), `packages/database/src/schema/tenants.ts` (update), `packages/database/src/schema/budget-alerts.ts` (NEW)

**Approach:** Destructive schema updates with consolidation. See `/docs/plans/ai-provider/consolidated-schema.md` for full schema.

**Key Consolidations:**

1. **Merge usage tables:** Extend `ai_provider_usage` with `insightId` (no separate `ai_usage_logs`)
2. **Unify domains:** Single `business_domains` table with FKs (replace varchar domains)
3. **Simplify templates:** Merged `config` JSONB (remove `providerConfig` + `modelConfig`)
4. **Remove denormalization:** Remove `tenants.aiProvider/aiModel/aiQualityLevel/aiCustomizationLevel`

**Critical Additions from Gap Analysis:**

1. **Complete RLS policies** for all tables with explicit tenant isolation
2. **Template versioning** support (version, parentVersionId, versionNotes)
3. **Budget alerts table** for threshold notifications
4. **Atomic upsert support** for usage tracking (unique constraints)
5. **Materialized views** for usage aggregation performance

**Deliverables:**

See consolidated schema: `/docs/plans/ai-provider/consolidated-schema.md`

**Table Count Reduction:**
| Category | Before | After | Change |
|----------|--------|-------|--------|
| AI Provider tables | 5 | 4 | -1 |
| Domain representations | 3 | 1 | -2 |
| Tenant AI config columns | 5 | 1 | -4 |
| Template config fields | 2 | 1 | -1 |
| **Total** | | | **-8 elements** |

**Note:** In greenfield mode, run `drizzle-kit push` to apply schema changes directly.

**CRITICAL: RLS Policies must be complete before implementation proceeds.**

**NEW `businessDomains` Table (Domain Agnostic):**

```typescript
export const businessDomains = pgTable("business_domains", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // User-defined, NOT enum
  description: text("description"),
  config: jsonb("config").$type<Record<string, unknown>>().default({}),
  budgetLimit: decimal("budget_limit", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RLS Policy: Tenant isolation (CRITICAL)
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

**Domain Name Validation (Zod Schema):**

```typescript
const reservedDomainNames = [
  "marketing",
  "finance",
  "operations",
  "seo",
  "social",
  "local",
  "executive",
];

export const CreateBusinessDomainSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(100)
    .refine((name) => !reservedDomainNames.includes(name.toLowerCase()), {
      message: "Domain name is reserved. Please choose another name.",
    })
    .refine((name) => /^[a-zA-Z0-9\\s-]+$/.test(name), {
      message: "Domain name can only contain letters, numbers, spaces, and hyphens.",
    }),
  description: z.string().optional(),
  config: z.record(z.unknown()).optional(),
  budgetLimit: z.number().positive().optional(),
});
```

**NEW `aiProviderUsage` Table (Extended with Atomic Upsert):**

```typescript
export const aiProviderUsage = pgTable("ai_provider_usage", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),

  // Nullable for tenant-level usage (was: separate ai_usage_logs table)
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

  // NEW fields for atomic upsert (Gap 1.3)
  failoverFromProvider: varchar("failover_from_provider", { length: 64 }),
  durationMs: integer("duration_ms"),
});

// RLS Policy: Tenant isolation (CRITICAL)
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

// Unique constraint for atomic upsert (Gap 1.3 - Race Condition Prevention)
export const aiProviderUsageUpsertIndex = index("ai_provider_usage_upsert_idx").on(
  aiProviderUsage.tenantId,
  aiProviderUsage.insightId,
  aiProviderUsage.providerId,
  aiProviderUsage.modelId,
  sql`date_trunc('hour', timestamp)`,
);
```

**Atomic Usage Tracking (Gap 1.3):**

```typescript
// Use database-level upsert with atomic increments to prevent race conditions
async function trackUsage(params: UsageParams): Promise<void> {
  const cost = calculateCost(params);
  const hour = truncateToHour(new Date());

  await db.execute(sql`
    INSERT INTO ai_provider_usage (
      tenant_id, insight_id, provider_id, model_id,
      input_tokens, output_tokens, cost_cents,
      was_failover, failover_from_provider, duration_ms
    )
    VALUES (
      ${params.tenantId}, ${params.insightId}, ${params.providerId}, ${params.modelId},
      ${params.inputTokens}, ${params.outputTokens}, ${cost},
      ${params.wasFailover || false}, ${params.failoverFromProvider || null}, ${params.durationMs || null}
    )
    ON CONFLICT (tenant_id, insight_id, provider_id, model_id, date_trunc('hour', timestamp))
    DO UPDATE SET
      input_tokens = ai_provider_usage.input_tokens + EXCLUDED.input_tokens,
      output_tokens = ai_provider_usage.output_tokens + EXCLUDED.output_tokens,
      cost_cents = ai_provider_usage.cost_cents + EXCLUDED.cost_cents,
      was_failover = ai_provider_usage.was_failover OR EXCLUDED.was_failover,
      duration_ms = (ai_provider_usage.duration_ms + EXCLUDED.duration_ms) / 2
  `);

  // Check budget alerts after tracking
  await checkBudgetAlerts(params.tenantId, params.insightId);
}
```

**Budget Alerts Table (Gap 2.1):**

```typescript
export const budgetAlerts = pgTable("budget_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull(),
  insightId: uuid("insight_id"), // null for tenant-wide
  domainId: uuid("domain_id"), // null for tenant-wide
  thresholdPercent: integer("threshold_percent").notNull(), // 0-100
  alertType: varchar("alert_type", {
    enum: ["email", "webhook", "both"],
  }).notNull(),
  webhookUrl: text("webhook_url"),
  recipientEmails: text("recipient_emails").array(),
  isActive: boolean("is_active").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// RLS Policy
export const budgetAlertsRLS = pgPolicy("tenant_isolation", {
  on: budgetAlerts,
  for: "all",
  using: sql`tenant_id = current_setting('app.current_tenant')::uuid`,
});

// Budget alert check implementation
async function checkBudgetAlerts(tenantId: string, insightId: string): Promise<void> {
  const usage = await getCurrentMonthUsage(tenantId, insightId);
  const budget = await getBudget(tenantId, insightId);
  const usagePercent = (usage / budget) * 100;

  const alerts = await db.query.budgetAlerts.findMany({
    where: and(
      eq(budgetAlerts.tenantId, tenantId),
      eq(budgetAlerts.insightId, insightId),
      eq(budgetAlerts.isActive, true),
    ),
  });

  for (const alert of alerts) {
    if (usagePercent >= alert.thresholdPercent && !alert.lastTriggeredAt) {
      await sendAlert(alert, usagePercent);
      await db
        .update(budgetAlerts)
        .set({ lastTriggeredAt: new Date() })
        .where(eq(budgetAlerts.id, alert.id));
    }
  }
}
```

**Materialized Views for Performance (Gap 2.8):**

```typescript
// Materialized view for usage aggregation (dashboard loads in <2s)
export const usageByInsightDaily = pgMaterializedView("usage_by_insight_daily").as(
  sql`
    SELECT 
      tenant_id,
      insight_id,
      provider_id,
      model_id,
      date_trunc('day', timestamp) as day,
      sum(input_tokens) as total_input_tokens,
      sum(output_tokens) as total_output_tokens,
      sum(cost_cents) as total_cost_cents,
      count(*) as request_count
    FROM ai_provider_usage
    GROUP BY tenant_id, insight_id, provider_id, model_id, date_trunc('day', timestamp)
  `,
);

// Refresh materialized view hourly
async function refreshUsageMaterializedViews() {
  await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY usage_by_insight_daily`);
}
```

**NEW `aiProviderTemplates` Table (with Versioning):**

```typescript
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

  // Template versioning (NEW - Gap 1.4)
  version: integer("version").notNull().default(1),
  parentVersionId: uuid("parent_version_id").references(() => aiProviderTemplates.id, {
    onDelete: "set null",
  }),
  versionNotes: text("version_notes"),

  // REMOVED: usageCount (compute from ai_providers.template_id)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RLS Policy (system templates visible to all) - CRITICAL
export const aiProviderTemplatesRLS = pgPolicy("tenant_isolation", {
  on: aiProviderTemplates,
  for: "all",
  using: sql`
    tenant_id IS NULL  -- System templates
    OR tenant_id = current_setting('app.current_tenant')::uuid
  `,
});

// Index for template lookups
export const aiProviderTemplatesDomainIndex = index("ai_provider_templates_domain_idx").on(
  aiProviderTemplates.domainId,
  aiProviderTemplates.isSystem,
);
```

**Template Versioning Implementation:**

```typescript
async function createTemplateVersion(templateId: string, updates: UpdateTemplateParams) {
  const existing = await db.query.aiProviderTemplates.findFirst({
    where: eq(aiProviderTemplates.id, templateId),
  });

  if (!existing) {
    throw new NotFoundError("Template not found");
  }

  // Validate no circular inheritance
  await validateTemplateInheritance(templateId, updates.parentVersionId);

  return db.insert(aiProviderTemplates).values({
    ...existing,
    ...updates,
    version: existing.version + 1,
    parentVersionId: templateId,
  });
}

async function validateTemplateInheritance(templateId: string, parentTemplateId?: string) {
  if (!parentTemplateId) return;

  const visited = new Set<string>();
  let current = parentTemplateId;

  while (current) {
    if (visited.has(current)) {
      throw new Error("Circular template inheritance detected");
    }
    visited.add(current);

    const template = await db.query.aiProviderTemplates.findFirst({
      where: eq(aiProviderTemplates.id, current),
    });
    current = template?.parentVersionId;
  }
}
```

**Note:** Templates can be associated with specific domains (via `domainId`), but domains are tenant-defined, not hardcoded.

**Models & Repositories:**

- [ ] `AiProviderModel` (extended with hierarchy methods)
- [ ] `AiModelRepository` (extended)
- [ ] `BusinessDomainModel` (NEW)
- [ ] `AiUsageRepository` (NEW)
- [ ] `AiProviderTemplateModel` (NEW)
- [ ] `ConfigHierarchyResolver` (NEW) - Cascading resolution logic

**Business Requirements Mapping:**

- AI-INSIGHT-001, AI-INSIGHT-003, AI-DOMAIN-001, AI-TEMPLATE-001, AI-COST-001, AI-INSIGHT-005

---

### Task 2.3: Extended tRPC Router Implementation

**Duration:** 4 days (+1 for budget alerts, validation, template compatibility)  
**Files:** `apps/api/src/trpc/routers/ai-providers.ts`, `apps/api/src/trpc/routers/ai-domains.ts` (NEW), `apps/api/src/trpc/routers/ai-templates.ts` (NEW), `apps/api/src/trpc/routers/ai-usage.ts` (NEW), `apps/api/src/trpc/routers/budget-alerts.ts` (NEW)

**Deliverables:**

**AI Provider Router (Extended):**

```typescript
export const aiProvidersRouter = router({
  // Existing procedures (extended)
  createAiProvider: protectedProcedure
    .input(CreateAiProviderSchema)
    .mutation(async ({ ctx, input }) => {
      // Support insightId, domainId, tier, connectorIds
    }),

  getAiProviderById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // Returns full config with hierarchy info
    }),

  // NEW: Hierarchy resolution with tenant validation
  getAiProviderForInsight: protectedProcedure
    .input(z.object({ insightId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Resolves hierarchy: insight → domain → tenant
      const config = await ConfigHierarchyResolver.resolve(
        ctx.tenantId,
        input.insightId
      );
      return config;
    }),

  getAiProviderHierarchy: protectedProcedure
    .input(z.object({ tenantId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Returns full hierarchy tree
    }),

  // NEW: Template operations with validation
  createFromTemplate: protectedProcedure
    .input(z.object({
      templateId: z.string(),
      insightId: z.string().optional(),
      domainId: z.string().optional(),
      validateOnly: z.boolean().optional(), // Dry-run mode (Gap 2.7)
    }))
    .mutation(async ({ ctx, input }) => {
      // Validate template compatibility before deployment
      if (input.validateOnly) {
        return validateTemplateCompatibility(input.templateId, input.insightId!, 'insight');
      }
      // Deploy template with customization
    }),

  // NEW: Template compatibility validation (Gap 2.7)
  validateTemplateCompatibility: protectedProcedure
    .input(z.object({
      templateId: z.string(),
      targetId: z.string(),
      scope: z.enum(['tenant', 'domain', 'insight']),
    }))
    .query(async ({ ctx, input }) => {
      return validateTemplateCompatibility(input.templateId, input.targetId, input.scope);
    }),

  // NEW: Tier management
  setProviderTier: protectedProcedure
    .input(z.object({
      id: z.string(),
      tier: z.enum(['premium', 'standard', 'economy']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Update cost tier
    }),

  // NEW: Optimistic locking for concurrent updates (Gap 3.5)
  updateAiProviderOptimistic: protectedProcedure
    .input(z.object({
      id: z.string(),
      updates: UpdateAiProviderSchema,
      expectedVersion: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db
        .update(aiProviders)
        .set({ ...input.updates, version: input.expectedVersion + 1 })
        .where(and(
          eq(aiProviders.id, input.id),
          eq(aiProviders.version, input.expectedVersion)
        ));

      if (result.rowCount === 0) {
        throw new ConflictError('Config was modified by another user. Please refresh and try again.');
      }
    }),

  // Existing procedures...
  getAiProviderList: protectedProcedure.query(...),
  toggleProviderEnabled: protectedProcedure.mutation(...),
  updateAiProvider: protectedProcedure.mutation(...),
  updateAiProviderConfig: protectedProcedure.mutation(...),
  removeAiProvider: protectedProcedure.mutation(...),
  checkProviderConnectivity: protectedProcedure.mutation(...),
});
```

**NEW AI Domains Router (Domain Agnostic):**

```typescript
export const aiDomainsRouter = router({
  listDomains: protectedProcedure.query(async ({ ctx }) => {
    return BusinessDomainModel.list(ctx.tenantId);
  }),

  createDomain: protectedProcedure
    .input(CreateBusinessDomainSchema) // name: string (user-defined)
    .mutation(async ({ ctx, input }) => {
      return BusinessDomainModel.create(ctx.tenantId, input);
    }),

  updateDomain: protectedProcedure
    .input(
      z.object({
        domainId: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        config: z.record(z.unknown()).optional(),
        budgetLimit: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return BusinessDomainModel.update(input.domainId, input);
    }),

  deleteDomain: protectedProcedure
    .input(z.object({ domainId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return BusinessDomainModel.delete(input.domainId);
    }),

  getDomainProviders: protectedProcedure
    .input(z.object({ domainId: z.string() }))
    .query(async ({ ctx, input }) => {
      return BusinessDomainModel.getProviders(input.domainId);
    }),

  setDomainBudget: protectedProcedure
    .input(
      z.object({
        domainId: z.string(),
        budgetLimit: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return BusinessDomainModel.setBudget(input.domainId, input.budgetLimit);
    }),

  assignProviderToDomain: protectedProcedure
    .input(
      z.object({
        domainId: z.string(),
        providerId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return BusinessDomainModel.assignProvider(input.domainId, input.providerId);
    }),
});
```

**Example Usage:**

```typescript
// Tenant creates custom domains
await aiDomainsService.createDomain({
  name: "Fleet Management", // Custom domain name
  description: "GPS tracking and vehicle analytics",
  budgetLimit: 500,
});

await aiDomainsService.createDomain({
  name: "Customer Success",
  description: "Churn analysis and customer health",
});
```

**NEW AI Templates Router:**

```typescript
export const aiTemplatesRouter = router({
  listTemplates: protectedProcedure
    .input(
      z.object({
        domain: z.enum(["marketing", "finance", "operations", "seo", "social", "local"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return AiProviderTemplateModel.list(ctx.tenantId, input.domain);
    }),

  getTemplateById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return AiProviderTemplateModel.getById(input.id);
    }),

  createCustomTemplate: protectedProcedure
    .input(CreateAiProviderTemplateSchema)
    .mutation(async ({ ctx, input }) => {
      return AiProviderTemplateModel.create(ctx.tenantId, input);
    }),

  applyTemplate: protectedProcedure.input(ApplyTemplateSchema).mutation(async ({ ctx, input }) => {
    return AiProviderTemplateModel.apply(input.templateId, input.targetId, input.scope);
  }),
});
```

**NEW AI Usage Router:**

```typescript
export const aiUsageRouter = router({
  getUsageByInsight: protectedProcedure
    .input(
      z.object({
        insightId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return AiUsageRepository.getByInsight(
        ctx.tenantId,
        input.insightId,
        input.startDate,
        input.endDate,
      );
    }),

  getUsageByDomain: protectedProcedure
    .input(
      z.object({
        domainId: z.string(),
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return AiUsageRepository.getByDomain(
        ctx.tenantId,
        input.domainId,
        input.startDate,
        input.endDate,
      );
    }),

  getTenantUsage: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
      }),
    )
    .query(async ({ ctx, input }) => {
      return AiUsageRepository.getByTenant(ctx.tenantId, input.startDate, input.endDate);
    }),

  getCostProjection: protectedProcedure
    .input(
      z.object({
        insightId: z.string(),
        period: z.enum(["week", "month", "quarter"]),
      }),
    )
    .query(async ({ ctx, input }) => {
      return AiUsageRepository.projectCost(input.insightId, input.period);
    }),

  setBudgetAlert: protectedProcedure
    .input(
      z.object({
        insightId: z.string(),
        threshold: z.number(), // percentage 0-100
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Create/update budget alert
    }),
});
```

**Business Requirements Mapping:**

- AI-INSIGHT-001, AI-INSIGHT-002, AI-INSIGHT-005, AI-DOMAIN-001, AI-TEMPLATE-001, AI-COST-001, AI-COST-004

---

### Task 2.4: Frontend Service Layer

**Duration:** 2 days (was 1 day)  
**Files:** `apps/frontend/src/services/aiProvider.ts`, `apps/frontend/src/services/aiDomains.ts` (NEW), `apps/frontend/src/services/aiTemplates.ts` (NEW), `apps/frontend/src/services/aiUsage.ts` (NEW)

**Deliverables:**

**AiProviderService (Extended):**

```typescript
export class AiProviderService {
  // Existing methods...
  createAiProvider: (params: CreateAiProviderParams) => Promise<string>;
  getAiProviderList: () => Promise<AiProviderListItem[]>;
  getAiProviderById: (id: string) => Promise<AiProviderDetailItem>;

  // NEW: Hierarchy methods
  getAiProviderForInsight: (insightId: string) => Promise<AiProviderConfig>;
  getAiProviderHierarchy: (tenantId: string) => Promise<HierarchyTree>;
  createFromTemplate: (params: CreateFromTemplateParams) => Promise<string>;
  setProviderTier: (id: string, tier: CostTier) => Promise<void>;

  // Existing methods...
  toggleProviderEnabled: (id: string, enabled: boolean) => Promise<void>;
  updateAiProvider: (id: string, value: UpdateAiProviderParams) => Promise<void>;
  updateAiProviderConfig: (id: string, value: UpdateAiProviderConfigParams) => Promise<void>;
  removeAiProvider: (id: string) => Promise<void>;
  checkProviderConnectivity: (
    id: string,
    model?: string,
  ) => Promise<{ ok: boolean; error?: string }>;
}
```

**NEW AiDomainsService:**

```typescript
export class AiDomainsService {
  listDomains: () => Promise<BusinessDomain[]>;
  createDomain: (params: CreateDomainParams) => Promise<string>;
  getDomainProviders: (domainId: string) => Promise<ProviderList>;
  setDomainBudget: (domainId: string, budgetLimit: number) => Promise<void>;
  assignProviderToDomain: (domainId: string, providerId: string) => Promise<void>;
}
```

**NEW AiTemplatesService:**

```typescript
export class AiTemplatesService {
  listTemplates: (domain?: BusinessDomain) => Promise<AiProviderTemplate[]>;
  getTemplateById: (id: string) => Promise<AiProviderTemplateDetail>;
  createCustomTemplate: (params: CreateTemplateParams) => Promise<string>;
  applyTemplate: (templateId: string, targetId: string, scope: ConfigScope) => Promise<void>;
}
```

**NEW AiUsageService:**

```typescript
export class AiUsageService {
  getUsageByInsight: (insightId: string, dateRange: DateRange) => Promise<UsageReport>;
  getUsageByDomain: (domainId: string, dateRange: DateRange) => Promise<UsageReport>;
  getTenantUsage: (dateRange: DateRange) => Promise<UsageReport>;
  getCostProjection: (
    insightId: string,
    period: "week" | "month" | "quarter",
  ) => Promise<CostProjection>;
  setBudgetAlert: (insightId: string, threshold: number) => Promise<void>;
}
```

**Business Requirements Mapping:**

- AI-INSIGHT-001, AI-DOMAIN-001, AI-TEMPLATE-001, AI-INSIGHT-005

---

### Task 2.5: State Management (TanStack Query)

**Duration:** 2 days (was 2 days)  
**Files:** `apps/frontend/src/hooks/useAiProviders.ts`, `apps/frontend/src/hooks/useAiDomains.ts` (NEW), `apps/frontend/src/hooks/useAiTemplates.ts` (NEW), `apps/frontend/src/hooks/useAiUsage.ts` (NEW)

**Deliverables:**

**Provider Hooks (Extended):**

```typescript
// useAiProviderForInsight (NEW)
export const useAiProviderForInsight = (insightId: string) => {
  return useQuery({
    queryKey: ['aiProviders', 'insight', insightId],
    queryFn: () => aiProviderService.getAiProviderForInsight(insightId),
  });
};

// useAiProviderHierarchy (NEW)
export const useAiProviderHierarchy = (tenantId: string) => {
  return useQuery({
    queryKey: ['aiProviders', 'hierarchy', tenantId],
    queryFn: () => aiProviderService.getAiProviderHierarchy(tenantId),
  });
};

// useCreateFromTemplate (NEW)
export const useCreateFromTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateFromTemplateParams) =>
      aiProviderService.createFromTemplate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiProviders'] });
    },
  });
};

// useSetProviderTier (NEW)
export const useSetProviderTier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, tier }: { id: string; tier: CostTier }) =>
      aiProviderService.setProviderTier(id, tier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiProviders'] });
    },
  });
};

// Existing hooks...
export const useAiProviderList = () => { ... };
export const useToggleProviderEnabled = () => { ... };
```

**NEW Domain Hooks:**

```typescript
export const useBusinessDomains = () => {
  return useQuery({
    queryKey: ["aiDomains", "list"],
    queryFn: () => aiDomainsService.listDomains(),
  });
};

export const useDomainProviders = (domainId: string) => {
  return useQuery({
    queryKey: ["aiDomains", "providers", domainId],
    queryFn: () => aiDomainsService.getDomainProviders(domainId),
    enabled: !!domainId,
  });
};

export const useCreateDomain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateDomainParams) => aiDomainsService.createDomain(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiDomains"] });
    },
  });
};
```

**NEW Template Hooks:**

```typescript
export const useAiTemplates = (domain?: BusinessDomain) => {
  return useQuery({
    queryKey: ["aiTemplates", "list", domain],
    queryFn: () => aiTemplatesService.listTemplates(domain),
  });
};

export const useApplyTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ApplyTemplateParams) =>
      aiTemplatesService.applyTemplate(params.templateId, params.targetId, params.scope),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aiProviders"] });
    },
  });
};
```

**NEW Usage Hooks:**

```typescript
export const useInsightUsage = (insightId: string, dateRange: DateRange) => {
  return useQuery({
    queryKey: ["aiUsage", "insight", insightId, dateRange],
    queryFn: () => aiUsageService.getUsageByInsight(insightId, dateRange),
    enabled: !!insightId,
  });
};

export const useCostProjection = (insightId: string, period: "week" | "month" | "quarter") => {
  return useQuery({
    queryKey: ["aiUsage", "projection", insightId, period],
    queryFn: () => aiUsageService.getCostProjection(insightId, period),
  });
};
```

**Business Requirements Mapping:**

- AI-INSIGHT-001, AI-DOMAIN-001, AI-TEMPLATE-001, AI-INSIGHT-005

---

### Task 2.6: Tenant Providers Page (Existing Plan)

**Duration:** 2 days  
**Files:** `apps/frontend/src/features/settings/providers/TenantProvidersPage.tsx`

**Deliverables:**

- [ ] ProviderGrid component (tenant-level)
- [ ] ProviderCard with tier indicator
- [ ] Provider enable/disable toggle
- [ ] Provider configuration modal
- [ ] Connection testing UI

**Note:** This is the original Phase 2 scope, now scoped specifically to tenant-level configuration.

---

### Task 2.12: Domain Management UI (Domain Agnostic)

**Duration:** 2 days  
**Files:** `apps/frontend/src/features/settings/domains/DomainsManagementPage.tsx`

**Deliverables:**

- [ ] Domain list (tenant-defined domains)
- [ ] Create custom domain
- [ ] Edit domain (name, description, config)
- [ ] Delete domain (with cascade handling)
- [ ] Domain budget configuration
- [ ] Provider assignment per domain
- [ ] Usage summary per domain

**Domain Management Component:**

```typescript
export const DomainsManagementPage = () => {
  const { data: domains } = useBusinessDomains();
  const { mutate: createDomain } = useCreateDomain();

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Business Domains</Title>
        <Button onClick={() => openCreateModal()}>
          Create Custom Domain
        </Button>
      </Group>

      <Text c="dimmed">
        Define custom business domains to organize your insights.
        Examples: "Marketing", "Finance", "Fleet Management", "Customer Success"
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
        {domains?.map((domain) => (
          <DomainCard
            key={domain.id}
            domain={domain}
            onEdit={() => openEditModal(domain)}
            onDelete={() => openDeleteModal(domain)}
          />
        ))}
      </SimpleGrid>
    </Stack>
  );
};
```

**Business Requirements Mapping:**

- AI-DOMAIN-001 (domain agnostic), AI-DOMAIN-002, AI-DOMAIN-004

---

### Task 2.8: Template Library (Domain Agnostic)

**Duration:** 3 days  
**Files:** `apps/frontend/src/features/settings/templates/ProviderTemplatesLibrary.tsx`

**Deliverables:**

- [ ] Template browser with domain filter (tenant-defined domains)
- [ ] Template preview (providers, models, tiers)
- [ ] One-click template deployment
- [ ] Custom template creation
- [ ] Template usage statistics
- [ ] System templates (optional starter templates)

**Template System Design:**

- Templates can be associated with tenant-defined domains
- System provides optional starter templates (no hardcoded domain requirements)
- Tenants can create custom templates for their custom domains

**Example Templates:**

```typescript
// System template (available to all tenants, no domain association)
{
  id: 'starter-premium',
  name: 'Premium AI Configuration',
  domainId: null,  // Not associated with specific domain
  tier: 'premium',
  providers: ['anthropic', 'openai'],
  models: { chat: 'claude-3-opus', analysis: 'gpt-4o' },
  description: 'Highest quality models for critical analysis',
  isSystem: true,
}

// Tenant custom template (associated with tenant's custom domain)
{
  id: 'fleet-analytics-standard',
  name: 'Fleet Analytics Template',
  domainId: 'uuid-of-fleet-management-domain',
  tier: 'standard',
  providers: ['openai'],
  models: { analysis: 'gpt-4o' },
  description: 'Optimized for GPS and vehicle data analysis',
  isSystem: false,
}
```

**Business Requirements Mapping:**

- AI-TEMPLATE-001, AI-TEMPLATE-002, AI-TEMPLATE-003

---

### Task 2.9: Insight AI Configuration Section (NEW)

**Duration:** 3 days  
**Files:** `apps/frontend/src/features/insights/AIConfigSection.tsx`

**Deliverables:**

- [ ] AI provider selector for insight
- [ ] Inheritance indicator (showing parent config)
- [ ] Override toggle (use custom vs inherit)
- [ ] Model selection per insight
- [ ] Budget limit configuration
- [ ] Usage display (current month spend)
- [ ] Cost projection

**Component Structure:**

```typescript
export const AIConfigSection = ({ insightId }) => {
  const { data: hierarchy } = useAiProviderHierarchy(tenantId);
  const { data: usage } = useInsightUsage(insightId, currentMonth);

  return (
    <Stack>
      <InheritanceIndicator hierarchy={hierarchy} insightId={insightId} />

      <Switch
        label="Use custom AI configuration"
        checked={useCustomConfig}
        onChange={setUseCustomConfig}
      />

      {useCustomConfig ? (
        <CustomAiConfigForm insightId={insightId} />
      ) : (
        <InheritedConfigPreview config={hierarchy.resolvedConfig} />
      )}

      <UsageDisplay usage={usage} />
      <CostProjectionChart insightId={insightId} />
    </Stack>
  );
};
```

**Business Requirements Mapping:**

- AI-INSIGHT-001, AI-INSIGHT-002, AI-INSIGHT-005, AI-COST-004

---

### Task 2.10: Usage Dashboard (NEW)

**Duration:** 3 days  
**Files:** `apps/frontend/src/features/settings/usage/UsageDashboard.tsx`

**Deliverables:**

- [ ] Tenant-wide usage overview
- [ ] Usage breakdown by insight
- [ ] Usage breakdown by domain
- [ ] Usage breakdown by provider
- [ ] Cost trend charts
- [ ] Budget alerts configuration
- [ ] Export functionality (CSV, PDF)

**Dashboard Sections:**

```typescript
export const UsageDashboard = () => {
  return (
    <Stack>
      <UsageSummaryCards />  {/* Total spend, tokens, requests */}

      <Tabs defaultValue="by-insight">
        <Tabs.List>
          <Tabs.Tab value="by-insight">By Insight</Tabs.Tab>
          <Tabs.Tab value="by-domain">By Domain</Tabs.Tab>
          <Tabs.Tab value="by-provider">By Provider</Tabs.Tab>
          <Tabs.Tab value="trends">Trends</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="by-insight">
          <InsightUsageTable />
        </Tabs.Panel>

        <Tabs.Panel value="by-domain">
          <DomainUsageTable />
        </Tabs.Panel>

        <Tabs.Panel value="by-provider">
          <ProviderUsageTable />
        </Tabs.Panel>

        <Tabs.Panel value="trends">
          <CostTrendChart />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};
```

**Business Requirements Mapping:**

- AI-INSIGHT-005, AI-COST-002, AI-COST-004, AI-DOMAIN-004

---

### Task 2.11: Cost Tier Selector (NEW)

**Duration:** 1 day  
**Files:** `apps/frontend/src/components/CostTierSelector.tsx`

**Deliverables:**

- [ ] Tier selection UI (Premium/Standard/Economy)
- [ ] Tier description and pricing info
- [ ] Model recommendations per tier
- [ ] Cost impact estimator

**Component:**

```typescript
export const CostTierSelector = ({ value, onChange }) => {
  const tiers: CostTierInfo[] = [
    {
      id: 'premium',
      label: 'Premium',
      description: 'Highest quality models (Claude 3 Opus, GPT-4o)',
      estimatedCost: '$0.03-0.06 / 1K tokens',
      recommended: 'Financial reports, executive summaries',
    },
    {
      id: 'standard',
      label: 'Standard',
      description: 'Balanced quality/cost (Claude 3.5 Sonnet, GPT-4o-mini)',
      estimatedCost: '$0.01-0.03 / 1K tokens',
      recommended: 'Marketing analysis, regular reports',
    },
    {
      id: 'economy',
      label: 'Economy',
      description: 'Cost-optimized (GPT-3.5 Turbo, Gemini Flash)',
      estimatedCost: '$0.001-0.01 / 1K tokens',
      recommended: 'High-volume analysis, drafts',
    },
  ];

  return (
    <Radio.Group value={value} onChange={onChange}>
      <Stack>
        {tiers.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            selected={value === tier.id}
          />
        ))}
      </Stack>
    </Radio.Group>
  );
};
```

**Business Requirements Mapping:**

- AI-COST-001, AI-COST-003

---

### Task 2.7: Domain Providers Page

**Duration:** 2 days  
**Files:** `apps/frontend/src/features/settings/domains/DomainProvidersPage.tsx`

**Deliverables:**

- [ ] Domain providers list
- [ ] Provider assignment UI
- [ ] Domain-specific AI settings
- [ ] Usage summary per domain

**Business Requirements Mapping:**

- AI-DOMAIN-001, AI-DOMAIN-002, AI-DOMAIN-004

### Task 2.12: Connector-Domain Mapper (Domain Agnostic)

**Duration:** 2 days  
**Files:** `apps/frontend/src/features/settings/connectors/DomainMapper.tsx`

**Deliverables:**

- [ ] Connector list with domain assignment
- [ ] Suggested domains based on connector type (not enforced)
- [ ] Manual domain selection from tenant's custom domains
- [ ] Multi-connector insight preview

**Domain Suggestions (Not Enforced):**

```typescript
// Connector type to suggested domain (guidance only, not enforced)
const connectorDomainSuggestions: Record<ConnectorType, string> = {
  ga4: "Marketing", // Suggestion, tenant can choose any domain
  meta: "Marketing",
  tiktok: "Social Media",
  gsc: "SEO",
  gbp: "Local Business",
  quickbooks: "Finance",
  stripe: "Finance",
};
```

**Key Design:** Suggestions are hints only. Tenants can assign any connector to any custom domain:

- GA4 could be assigned to "E-commerce Analytics" domain
- Stripe could be assigned to "Revenue Operations" domain
- Connectors can span multiple domains

**Business Requirements Mapping:**

- AI-CONN-001, AI-CONN-002, AI-DOMAIN-005

---

### Task 2.13: Runtime Integration (Extended)

**Duration:** 3 days (+1 for caching, atomic upserts, cost calculation)  
**Files:** `apps/api/src/modules/model-runtime/`, `packages/agent-runtime/src/core/ConfigHierarchyResolver.ts` (NEW), `packages/agent-runtime/src/utils/cost-calculation.ts` (NEW)

**Deliverables:**

- [ ] `ConfigHierarchyResolver` class (NEW) with L1+L2 caching
- [ ] Extended `initModelRuntimeFromDB` with hierarchy support
- [ ] Usage tracking instrumentation with atomic upserts
- [ ] Cost calculation integration with configurable pricing
- [ ] Budget alerts integration

**Implementation:**

```typescript
export class ConfigHierarchyResolver {
  // L1 cache (in-memory)
  private static l1Cache = new NodeCache({ stdTTL: 300 }); // 5 min TTL

  // L2 cache key generator
  private static l2CacheKey = (tenantId: string, insightId: string) =>
    `tenant:${tenantId}:insight:${insightId}:aiConfig`;

  static async resolve(tenantId: string, insightId: string): Promise<ResolvedAiConfig> {
    // L1 cache check
    const l1Key = `${tenantId}:${insightId}`;
    const cached = this.l1Cache.get(l1Key);
    if (cached) return cached as ResolvedAiConfig;

    // L2 cache check (Redis)
    const l2Cached = await redis.get(this.l2CacheKey(tenantId, insightId));
    if (l2Cached) {
      this.l1Cache.set(l1Key, l2Cached);
      return JSON.parse(l2Cached);
    }

    // Resolve from database with explicit tenant validation
    const config = await this.resolveFromDB(tenantId, insightId);

    // Populate caches
    this.l1Cache.set(l1Key, config);
    await redis.setex(this.l2CacheKey(tenantId, insightId), 300, JSON.stringify(config));

    return config;
  }

  private static async resolveFromDB(
    tenantId: string,
    insightId: string,
  ): Promise<ResolvedAiConfig> {
    // 1. Check insight-level config with explicit tenant validation
    const insightConfig = await db.query.aiProviders.findFirst({
      where: and(
        eq(aiProviders.scope, "insight"),
        eq(aiProviders.insightId, insightId),
        eq(aiProviders.tenantId, tenantId),
      ),
    });
    if (insightConfig && !insightConfig.useParentDefaults) {
      return this.resolveConfig(insightConfig);
    }

    // 2. Get insight's domain with tenant validation
    const insight = await db.query.insights.findFirst({
      where: and(eq(insights.id, insightId), eq(insights.tenantId, tenantId)),
      with: { domain: true },
    });

    if (!insight) {
      throw new UnauthorizedError("Insight not found in tenant");
    }

    // 3. Check domain-level config
    if (insight.domainId) {
      const domainConfig = await db.query.aiProviders.findFirst({
        where: and(
          eq(aiProviders.scope, "domain"),
          eq(aiProviders.domainId, insight.domainId),
          eq(aiProviders.tenantId, tenantId),
        ),
      });
      if (domainConfig && !domainConfig.useParentDefaults) {
        return this.mergeConfigs(domainConfig, insightConfig);
      }
    }

    // 4. Fall back to tenant config
    const tenantConfig = await db.query.aiProviders.findFirst({
      where: and(eq(aiProviders.scope, "tenant"), eq(aiProviders.tenantId, tenantId)),
    });

    return this.mergeConfigs(tenantConfig, null, insightConfig);
  }

  static async trackUsage(params: UsageParams): Promise<void> {
    const cost = calculateCost(params); // Uses configurable pricing table
    const hour = truncateToHour(new Date());

    // Atomic upsert to prevent race conditions (Gap 1.3)
    await db.execute(sql`
      INSERT INTO ai_provider_usage (
        tenant_id, insight_id, provider_id, model_id,
        input_tokens, output_tokens, cost_cents,
        was_failover, failover_from_provider, duration_ms
      )
      VALUES (
        ${params.tenantId}, ${params.insightId}, ${params.providerId}, ${params.modelId},
        ${params.inputTokens}, ${params.outputTokens}, ${cost},
        ${params.wasFailover || false}, ${params.failoverFromProvider || null}, ${params.durationMs || null}
      )
      ON CONFLICT (tenant_id, insight_id, provider_id, model_id, date_trunc('hour', timestamp))
      DO UPDATE SET
        input_tokens = ai_provider_usage.input_tokens + EXCLUDED.input_tokens,
        output_tokens = ai_provider_usage.output_tokens + EXCLUDED.output_tokens,
        cost_cents = ai_provider_usage.cost_cents + EXCLUDED.cost_cents
    `);

    // Check budget alerts after tracking
    await this.checkBudgetAlerts(params.tenantId, params.insightId);
  }

  static async invalidateCache(tenantId: string, insightId: string): Promise<void> {
    this.l1Cache.del(`${tenantId}:${insightId}`);
    await redis.del(this.l2CacheKey(tenantId, insightId));
  }

  static async checkBudgetAlerts(tenantId: string, insightId: string): Promise<void> {
    const usage = await getCurrentMonthUsage(tenantId, insightId);
    const budget = await getBudget(tenantId, insightId);
    const usagePercent = (usage / budget) * 100;

    const alerts = await db.query.budgetAlerts.findMany({
      where: and(
        eq(budgetAlerts.tenantId, tenantId),
        or(
          eq(budgetAlerts.insightId, insightId),
          isNull(budgetAlerts.insightId), // Tenant-wide alerts
        ),
        eq(budgetAlerts.isActive, true),
      ),
    });

    for (const alert of alerts) {
      if (usagePercent >= alert.thresholdPercent && !alert.lastTriggeredAt) {
        await sendAlert(alert, usagePercent);
        await db
          .update(budgetAlerts)
          .set({ lastTriggeredAt: new Date() })
          .where(eq(budgetAlerts.id, alert.id));
      }
    }
  }
}
```

**Configurable Pricing Table (Gap 2.2):**

```typescript
// Cost calculation with configurable pricing
async function calculateCost(params: UsageParams): Promise<number> {
  const pricing = await getPricing(params.providerId, params.modelId);
  const inputCost = (params.inputTokens / 1000) * pricing.inputPricePer1k;
  const outputCost = (params.outputTokens / 1000) * pricing.outputPricePer1k;
  return inputCost + outputCost;
}

async function getPricing(providerId: string, modelId: string): Promise<ModelPricing> {
  // Check cache first
  const cached = await redis.get(`pricing:${providerId}:${modelId}`);
  if (cached) return JSON.parse(cached);

  // Get from pricing table
  const pricing = await db.query.modelPricing.findFirst({
    where: and(
      eq(modelPricing.providerId, providerId),
      eq(modelPricing.modelId, modelId),
      or(isNull(modelPricing.expiresAt), gte(modelPricing.expiresAt, new Date())),
    ),
    orderBy: desc(modelPricing.effectiveDate),
  });

  if (!pricing) {
    throw new NotFoundError(`Pricing not found for ${providerId}/${modelId}`);
  }

  // Cache for 24 hours
  await redis.setex(`pricing:${providerId}:${modelId}`, 86400, JSON.stringify(pricing));

  return pricing;
}
```

**Business Requirements Mapping:**

- AI-INSIGHT-001, AI-INSIGHT-003, AI-INSIGHT-005, AI-COST-002, AI-COST-004

---

### Task 2.14: Testing

**Duration:** 4 days (+1 for edge cases, race conditions, cascading deletes)  
**Files:** `apps/api/src/trpc/routers/__tests__/`, `apps/frontend/src/features/__tests__/`

**Deliverables:**

**API Tests:**

- [ ] Hierarchy resolution tests (insight → domain → tenant)
- [ ] Template deployment tests
- [ ] Usage tracking tests
- [ ] Budget alert tests
- [ ] Domain assignment tests
- [ ] Tier selection tests
- [ ] **NEW:** Race condition tests (concurrent usage tracking)
- [ ] **NEW:** Template versioning tests (circular inheritance detection)
- [ ] **NEW:** RLS policy tests (tenant isolation)
- [ ] **NEW:** Optimistic locking tests (concurrent updates)
- [ ] **NEW:** Cascade delete tests (domain deletion with insights)

**Component Tests:**

- [ ] Template library render and filter
- [ ] Usage dashboard charts
- [ ] Tier selector
- [ ] Insight AI config section
- [ ] Domain mapper
- [ ] **NEW:** Template compatibility validation UI
- [ ] **NEW:** Budget alert configuration

**E2E Tests:**

- [ ] Create insight from template flow
- [ ] Configure insight-level AI
- [ ] Override inherited config
- [ ] View usage dashboard
- [ ] Set budget alerts
- [ ] **NEW:** Multi-connector insight domain assignment
- [ ] **NEW:** Template versioning and rollback
- [ ] Create insight from template flow
- [ ] Configure insight-level AI
- [ ] Override inherited config
- [ ] View usage dashboard
- [ ] Set budget alerts

**Business Requirements Mapping:**

- All requirements (verification)

---

## Phase 2 Deliverables Checklist

### Database Layer

- [ ] `packages/database/src/schema/ai-providers.ts` - Extended schema
- [ ] `packages/database/src/schema/business-domains.ts` - NEW
- [ ] `packages/database/src/schema/ai-usage.ts` - NEW
- [ ] `packages/database/src/schema/ai-templates.ts` - NEW
- [ ] `packages/database/src/models/ai-provider-model.ts` - Extended
- [ ] `packages/database/src/models/business-domain-model.ts` - NEW
- [ ] `packages/database/src/models/ai-provider-template-model.ts` - NEW
- [ ] `packages/database/src/repositories/ai-usage-repository.ts` - NEW

### Type System

- [ ] `packages/core/src/types/ai-models.ts` - Extended with hierarchy
- [ ] `packages/core/src/types/business-domains.ts` - NEW
- [ ] `packages/core/src/schemas/ai-provider.ts` - Extended schemas

### API Layer

- [ ] `apps/api/src/trpc/routers/ai-providers.ts` - Extended
- [ ] `apps/api/src/trpc/routers/ai-domains.ts` - NEW
- [ ] `apps/api/src/trpc/routers/ai-templates.ts` - NEW
- [ ] `apps/api/src/trpc/routers/ai-usage.ts` - NEW
- [ ] `apps/api/src/modules/model-runtime/config-hierarchy-resolver.ts` - NEW

### Frontend Services

- [ ] `apps/frontend/src/services/aiProvider.ts` - Extended
- [ ] `apps/frontend/src/services/aiDomains.ts` - NEW
- [ ] `apps/frontend/src/services/aiTemplates.ts` - NEW
- [ ] `apps/frontend/src/services/aiUsage.ts` - NEW

### State Management

- [ ] `apps/frontend/src/hooks/useAiProviders.ts` - Extended
- [ ] `apps/frontend/src/hooks/useAiDomains.ts` - NEW
- [ ] `apps/frontend/src/hooks/useAiTemplates.ts` - NEW
- [ ] `apps/frontend/src/hooks/useAiUsage.ts` - NEW

### UI Components

- [ ] `apps/frontend/src/features/settings/providers/TenantProvidersPage.tsx` - Existing scope
- [ ] `apps/frontend/src/features/settings/domains/DomainProvidersPage.tsx` - NEW
- [ ] `apps/frontend/src/features/settings/templates/ProviderTemplatesLibrary.tsx` - NEW
- [ ] `apps/frontend/src/features/insights/AIConfigSection.tsx` - NEW
- [ ] `apps/frontend/src/features/settings/usage/UsageDashboard.tsx` - NEW
- [ ] `apps/frontend/src/components/CostTierSelector.tsx` - NEW
- [ ] `apps/frontend/src/features/settings/connectors/DomainMapper.tsx` - NEW

### Tests

- [ ] API integration tests (hierarchy, templates, usage)
- [ ] Component unit tests
- [ ] E2E flow tests

---

## Exit Criteria

### Business Alignment

- [ ] 100% insight-level configuration support
- [ ] 6 business domains supported (Marketing, Finance, Ops, SEO, Social, Local)
- [ ] Template library with 10+ system templates
- [ ] 3 cost tiers available (Premium, Standard, Economy)
- [ ] Usage tracking per insight operational
- [ ] Budget alerts functional

### Technical Requirements

- [ ] Hierarchy resolution <10ms p95 latency
- [ ] Usage tracking overhead <5ms
- [ ] Zero breaking changes to Phase 1
- [ ] All CRUD operations functional
- [ ] Tenant isolation verified
- [ ] Coverage thresholds met (70% overall, 85% business logic, 90% critical)

### User Experience

- [ ] Template adoption rate target: 70%+
- [ ] Insight creation time: <5 minutes
- [ ] Usage dashboard loads in <2s
- [ ] Zero high-priority bugs

---

## Timeline & Effort

| Task                      | Duration    | Effort             | Dependencies | Notes                                 |
| ------------------------- | ----------- | ------------------ | ------------ | ------------------------------------- |
| 2.1: Extended Types       | 2 days      | 2 days             | None         |                                       |
| 2.2: Extended Schema      | 3 days      | 3 days             | 2.1          | +1 for RLS, versioning, budget alerts |
| 2.3: tRPC Routers         | 4 days      | 4 days             | 2.2          | +1 for budget alerts, validation      |
| 2.4: Services             | 2 days      | 2 days             | 2.3          |                                       |
| 2.5: State Management     | 2 days      | 2 days             | 2.4          |                                       |
| 2.6: Tenant Providers     | 2 days      | 2 days             | 2.5          |                                       |
| 2.7: Domain Providers     | 2 days      | 2 days             | 2.5          |                                       |
| 2.8: Template Library     | 4 days      | 4 days             | 2.5          | +1 for versioning, validation         |
| 2.9: Insight AI Config    | 3 days      | 3 days             | 2.5          |                                       |
| 2.10: Usage Dashboard     | 4 days      | 4 days             | 2.3, 2.5     | +1 for materialized views             |
| 2.11: Cost Tier Selector  | 1 day       | 1 day              | 2.5          |                                       |
| 2.12: Domain Mapper       | 2 days      | 2 days             | 2.5          |                                       |
| 2.13: Runtime Integration | 3 days      | 3 days             | 2.2, 2.3     | +1 for caching, atomic upserts        |
| 2.14: Testing             | 4 days      | 4 days             | All tasks    | +1 for edge cases                     |
| **Total**                 | **38 days** | **38 person-days** |              | **+3 days from gap analysis**         |

**Revised Duration:** 5.5 weeks (was 5 weeks)

---

## Risk Mitigation

| Risk                           | Likelihood | Impact | Mitigation                                       | Status       |
| ------------------------------ | ---------- | ------ | ------------------------------------------------ | ------------ |
| Schema complexity              | Medium     | High   | Incremental migration, backward-compatible       | ✅ Addressed |
| UI complexity                  | High       | Medium | Progressive disclosure, collapsible sections     | ✅ Addressed |
| Performance impact             | Medium     | Medium | L1+L2 caching with 5-min TTL, materialized views | ✅ Addressed |
| Timeline overrun               | Medium     | High   | +3 day buffer (35→38 days)                       | ✅ Addressed |
| User confusion                 | Low        | Medium | Tooltips, guided setup, template recommendations | ✅ Addressed |
| **Race conditions** (NEW)      | Medium     | High   | Atomic upserts for usage tracking                | ✅ Addressed |
| **Data loss** (NEW)            | Low        | High   | Document cascade delete behavior, warnings       | ✅ Addressed |
| **Cost inaccuracy** (NEW)      | Medium     | Medium | Configurable pricing table with caching          | ✅ Addressed |
| **Circular inheritance** (NEW) | Low        | High   | Validation in template versioning                | ✅ Addressed |
| **Concurrent updates** (NEW)   | Medium     | Medium | Optimistic locking with version field            | ✅ Addressed |

---

## Dependencies

**Before Phase 2:**

- Phase 1 complete ✅
- Database schema approved
- Business requirements finalized

**During Phase 2:**

- None (independent implementation)

**After Phase 2:**

- Phase 3: Agent Integration (with hierarchy support)
- Phase 4: Advanced Features
- Phase 5: Advanced Analytics (proposed)

---

## Next Steps

### Before Implementation (Critical)

1. **Add tenant validation** to hierarchy resolution algorithm
2. **Complete RLS policies** for all new tables
3. **Implement usage tracking** with atomic upserts
4. **Add template versioning** to schema

### During Implementation (High Priority)

5. **Implement budget alerts** with email/webhook delivery
6. **Add pricing source** (configurable pricing table)
7. **Add domain name validation** (reserved names, format)
8. **Document cascade delete** behavior
9. **Implement caching** for hierarchy resolution (L1+L2)
10. **Add connector-domain mapping** validation
11. **Add template compatibility** validation
12. **Implement materialized views** for usage aggregation

### Post-Implementation (Nice to Have)

13. Configuration diff viewer
14. Cost optimization recommendations
15. Provider health dashboard
16. Template marketplace
17. Usage forecasting

---

**Related Documents:**

- Gap Analysis: `/docs/plans/ai-provider/gap-analysis.md`
- Refined Analysis: `/docs/plans/ai-provider/implementation-plan-refined-analysis.md`
- Consolidated Schema: `/docs/plans/ai-provider/consolidated-schema.md`
- Lobe Chat Analysis: `/docs/plans/ai-provider/lobe-chat-analysis.md`
- Business Architecture: `/docs/architecture/business/business-architecture.md`

---

**Last Updated:** 2026-05-06  
**Status:** Refined with gap analysis findings
