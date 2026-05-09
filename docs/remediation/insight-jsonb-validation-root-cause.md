# Remediation Plan: JSONB Enum Validation — Root Cause & Systemic Fix

## Executive Summary

The `insight.list` 500 errors are symptoms of a **systemic architecture issue**: the "triple definition problem" where independent, incompatible definitions of entity schemas exist across the codebase with zero type sharing. This pattern affects **7 entities** across the monorepo. This document provides a comprehensive remediation plan to eliminate all instances at compile time.

---

## Root Cause Analysis

### The Triple Definition Problem (Systemic Pattern)

| Layer               | Typical File                           | Problem                                          |
| ------------------- | -------------------------------------- | ------------------------------------------------ |
| **DB Factory/Seed** | `packages/database/src/factories/*.ts` | Own interfaces, never shared                     |
| **DB Schema**       | `packages/database/src/schema/*.ts`    | `$type<Record<string, unknown>>()` — zero safety |
| **API tRPC**        | `apps/api/src/trpc/routers/*.ts`       | Inline Zod schemas, manual normalization         |
| **Types Package**   | `packages/types/src/*.ts`              | Missing schema definitions or interfaces only    |

**Result**: Zero compile-time guarantees that data flowing DB → API → Client is consistent.

---

## Affected Entities (7 Total)

### P0 — Insights (Original Target)

| Layer             | File                                                 | Status                                         |
| ----------------- | ---------------------------------------------------- | ---------------------------------------------- |
| **DB Factory**    | `packages/database/src/factories/insight-factory.ts` | ❌ Own interfaces                              |
| **DB Schema**     | `packages/database/src/schema/core/insights.ts`      | ❌ `$type<Record<string, unknown>>()`          |
| **API tRPC**      | `apps/api/src/trpc/routers/insights.ts`              | ❌ Inline Zod + 60-line normalization band-aid |
| **Types Package** | `packages/types/src/insight.ts`                      | ❌ Missing schedule/delivery/aiConfig schemas  |

**Exact Mismatches**:

- `schedule.frequency`: Factory has `"hourly"`, API has `"quarterly"` — zero overlap on edges
- `delivery.format`: Factory has `"csv"/"json"`, API has `"excel"/"both"` — zero overlap
- `aiConfig` keys: Factory uses `providerId/modelId/temperature`, API uses `provider/model/qualityLevel/detailLevel` — **zero key overlap**
- `lastRunStatus`: Factory has `"partial"`, API does not

**Affected tRPC Endpoints**:

| Endpoint          | File Lines | Issue                                                                     |
| ----------------- | ---------- | ------------------------------------------------------------------------- |
| `insight.list`    | 247-308    | 60-line normalization band-aid (`validFrequencies`, `validFormats`, etc.) |
| `insight.detail`  | 382-416    | Unsafe `as` casts on JSONB fields                                         |
| `insight.getById` | 481-515    | Unsafe `as` casts on JSONB fields                                         |
| `insight.create`  | 616-650    | Unsafe `as` casts on JSONB fields                                         |
| `insight.update`  | 751-785    | Unsafe `as` casts on JSONB fields                                         |

### P0 — Connectors

| Layer             | File                                                   | Status                                                                        |
| ----------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------- | ----- | ------------------------------ | ---- |
| **DB Schema**     | `packages/database/src/schema/core/connectors.ts`      | ❌ 4 JSONB cols with `$type<Record<string, unknown>>()` + `'{}'::jsonb`       |
| **DB Factory**    | `packages/database/src/factories/connector-factory.ts` | ❌ `SeedTenantConnector` missing `config`, `notifications`, `advancedOptions` |
| **API tRPC**      | `apps/api/src/trpc/routers/connector.ts`               | ❌ Unsafe `as` casts: `row.platform as "meta"                                 | "ga4" | ...`, `row.status as "healthy" | ...` |
| **Types Package** | `packages/types/src/connector-types.ts`                | ⚠️ Has input/output schemas but missing JSONB field schemas                   |

**JSONB columns without typed defaults**:

- `config: jsonb("config").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`)`
- `notifications: jsonb("notifications").$type<Record<string, boolean>>().default(sql`'{}'::jsonb`)`
- `advancedOptions: jsonb("advanced_options").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`)`
- `credentialSchema: jsonb("credential_schema").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`)`

### P1 — Budget Alerts

| Layer             | File                                            | Status                                                                                    |
| ----------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **DB Schema**     | `packages/database/src/schema/budget-alerts.ts` | ❌ Inline JSONB types for `notifications`, `metadata`                                     |
| **API tRPC**      | `apps/api/src/trpc/routers/budget-alerts.ts`    | ❌ Inline Zod schemas (lines 7-62) duplicating DB enums                                   |
| **Core Schemas**  | `packages/core/src/schemas/ai-provider.ts`      | ⚠️ Has `notificationChannelSchema`, `createBudgetAlertSchema` — **unused by API router!** |
| **Types Package** | N/A                                             | ❌ Missing entirely                                                                       |

**Duplication**: API router redefines `z.enum(["threshold", "percentage", "rate"])`, `z.enum(["cost", "tokens", "requests"])`, `z.enum(["hourly", "daily", "weekly", "monthly"])` — all already exist in core schemas.

### P1 — Business Domains

| Layer             | File                                               | Status                                                                      |
| ----------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| **DB Schema**     | `packages/database/src/schema/business-domains.ts` | ❌ `providerConfig` inline type, `metadata` as unknown                      |
| **API tRPC**      | `apps/api/src/trpc/routers/ai-domains.ts`          | ❌ Inline `providerConfig` schema in 3 places (lines 49-54, 67-73, 100-106) |
| **Core Schemas**  | `packages/core/src/schemas/ai-provider.ts`         | ⚠️ Has `DomainHierarchyNode` interface with `providerConfig`                |
| **Types Package** | `packages/types/src/ai-providers.ts`               | ⚠️ Has `BusinessDomain` interface but no Zod schemas                        |

### P2 — AI Templates

| Layer             | File                                           | Status                                                                       |
| ----------------- | ---------------------------------------------- | ---------------------------------------------------------------------------- |
| **DB Schema**     | `packages/database/src/schema/ai-templates.ts` | ❌ `variables` inline type with `pattern` field                              |
| **API tRPC**      | `apps/api/src/trpc/routers/ai-templates.ts`    | ⚠️ Imports from core, but output schema missing `pattern` field (line 51-61) |
| **Core Schemas**  | `packages/core/src/schemas/ai-provider.ts`     | ✅ Has complete `templateVariableSchema` with `pattern`                      |
| **Types Package** | `packages/types/src/ai-providers.ts`           | ⚠️ Has `AiTemplate` interface but no Zod schemas                             |

### P2 — AI Providers

| Layer             | File                                           | Status                                                                    |
| ----------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| **DB Schema**     | `packages/database/src/schema/ai-providers.ts` | ❌ `customPricing`, `metadata`, `capabilities`, `fallbackProviders` JSONB |
| **API tRPC**      | `apps/api/src/trpc/routers/ai-providers.ts`    | ✅ Imports from core schemas                                              |
| **Core Schemas**  | `packages/core/src/schemas/ai-provider.ts`     | ✅ Comprehensive                                                          |
| **Types Package** | `packages/types/src/ai-providers.ts`           | ⚠️ Has interfaces but no Zod schemas                                      |

### P2 — Reports

| Layer             | File                                      | Status                                                            |
| ----------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| **DB Schema**     | `packages/database/src/schema/reports.ts` | ❌ `metadata: jsonb("metadata").$type<Record<string, unknown>>()` |
| **API tRPC**      | `apps/api/src/trpc/routers/reports.ts`    | ❌ Inline `metadata: z.record(z.unknown()).nullable()`            |
| **Types Package** | N/A                                       | ❌ Missing entirely                                               |

---

## Remediation Strategy

### Phase 1: Define Canonical Types (Compile-Time Foundation)

**Goal**: Single source of truth in `packages/types/` for ALL affected entities

#### 1.1 Insights — Add to `packages/types/src/insight.ts`

```typescript
import { z } from "zod";

// Schedule
export const insightScheduleSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly", "quarterly"]),
  time: z.number().int().min(0).max(23),
});
export type InsightSchedule = z.infer<typeof insightScheduleSchema>;

// Delivery
export const insightDeliverySchema = z.object({
  format: z.enum(["pdf", "excel", "both"]),
  emailRecipients: z.array(z.string().email()).optional(),
  enableWebhook: z.boolean().optional(),
  webhookUrl: z.string().url().optional().or(z.literal("")).optional(),
});
export type InsightDelivery = z.infer<typeof insightDeliverySchema>;

// AI Config
export const insightAiConfigSchema = z.object({
  model: z.string(),
  provider: z.string().min(1).max(64).optional(),
  qualityLevel: z.enum(["standard", "premium"]).optional(),
  quality: z.number().optional(),
  detailLevel: z.enum(["executive", "standard", "comprehensive"]),
  customPrompt: z.string().optional(),
});
export type InsightAiConfig = z.infer<typeof insightAiConfigSchema>;

// Status enums
export const insightStatusSchema = z.enum(["idle", "running", "completed", "failed"]);
export const insightRunStatusSchema = z.enum(["success", "failed"]).nullable();
export type InsightStatus = z.infer<typeof insightStatusSchema>;
export type InsightRunStatus = z.infer<typeof insightRunStatusSchema>;
```

#### 1.2 Connectors — Add to `packages/types/src/connector-types.ts`

```typescript
// JSONB field schemas
export const connectorConfigSchema = z.record(z.unknown()).default({});
export type ConnectorConfig = z.infer<typeof connectorConfigSchema>;

export const connectorNotificationsSchema = z.record(z.boolean()).default({});
export type ConnectorNotifications = z.infer<typeof connectorNotificationsSchema>;

export const connectorAdvancedOptionsSchema = z.record(z.unknown()).default({});
export type ConnectorAdvancedOptions = z.infer<typeof connectorAdvancedOptionsSchema>;

// Sync frequency enum
export const syncFrequencySchema = z.enum(["hourly", "daily", "weekly", "monthly"]);
export type SyncFrequency = z.infer<typeof syncFrequencySchema>;
```

#### 1.3 Budget Alerts — Add to `packages/types/src/budget-alerts.ts` (NEW FILE)

```typescript
import { z } from "zod";

export const alertTypeSchema = z.enum(["threshold", "percentage", "rate"]);
export const alertThresholdTypeSchema = z.enum(["cost", "tokens", "requests"]);
export const alertTimeWindowSchema = z.enum(["hourly", "daily", "weekly", "monthly"]);
export const alertStatusSchema = z.enum(["active", "paused", "triggered"]);
export const notificationTypeSchema = z.enum(["email", "webhook", "slack"]);

export const notificationChannelSchema = z.object({
  id: z.string().uuid().optional(),
  type: notificationTypeSchema,
  target: z.string(),
  isEnabled: z.boolean().default(true),
});

export const budgetAlertMetadataSchema = z.record(z.unknown()).optional();

export type AlertType = z.infer<typeof alertTypeSchema>;
export type AlertThresholdType = z.infer<typeof alertThresholdTypeSchema>;
export type AlertTimeWindow = z.infer<typeof alertTimeWindowSchema>;
export type AlertStatus = z.infer<typeof alertStatusSchema>;
export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;
export type BudgetAlertMetadata = z.infer<typeof budgetAlertMetadataSchema>;
```

#### 1.4 Business Domains — Add to `packages/types/src/business-domains.ts` (NEW FILE)

```typescript
import { z } from "zod";

export const domainProviderConfigSchema = z.object({
  providerId: z.string(),
  modelId: z.string(),
  costTier: z.string(),
});
export type DomainProviderConfig = z.infer<typeof domainProviderConfigSchema>;

export const domainMetadataSchema = z.record(z.unknown()).optional();
export type DomainMetadata = z.infer<typeof domainMetadataSchema>;
```

#### 1.5 AI Templates — Add to `packages/types/src/ai-templates.ts` (NEW FILE)

```typescript
import { z } from "zod";

export const templateVariableSchema = z.object({
  name: z.string().min(1).max(64),
  type: z.enum(["string", "number", "boolean", "object", "array"]),
  required: z.boolean().default(false),
  defaultValue: z.unknown().optional(),
  description: z.string().max(256).optional(),
  pattern: z.string().optional(),
});
export type TemplateVariable = z.infer<typeof templateVariableSchema>;

export const templateMetadataSchema = z.record(z.unknown()).optional();
export type TemplateMetadata = z.infer<typeof templateMetadataSchema>;
```

#### 1.6 AI Providers — Add to `packages/types/src/ai-providers.ts` (extend existing)

```typescript
// Add Zod schemas to existing file
export const customPricingSchema = z.object({
  inputCostPer1k: z.number(),
  outputCostPer1k: z.number(),
});
export type CustomPricing = z.infer<typeof customPricingSchema>;

export const providerMetadataSchema = z.record(z.unknown()).optional();
export type ProviderMetadata = z.infer<typeof providerMetadataSchema>;

export const providerCapabilitiesSchema = z.array(z.string()).optional();
export type ProviderCapabilities = z.infer<typeof providerCapabilitiesSchema>;

export const failoverConfigSchema = z.object({
  primaryProviderId: z.string(),
  fallbackProviders: z.array(z.string()),
  isEnabled: z.boolean().default(true),
  providerTimeout: z.number().int().positive(),
  maxRetries: z.number().int().min(0).max(5),
});
export type FailoverConfig = z.infer<typeof failoverConfigSchema>;
```

#### 1.7 Reports — Add to `packages/types/src/reports.ts` (NEW FILE)

```typescript
import { z } from "zod";

export const reportMetadataSchema = z.record(z.unknown()).nullable();
export type ReportMetadata = z.infer<typeof reportMetadataSchema>;
```

#### 1.8 Export All from `packages/types/src/index.ts`

```typescript
// Insights
export {
  insightScheduleSchema,
  insightDeliverySchema,
  insightAiConfigSchema,
  insightStatusSchema,
  insightRunStatusSchema,
  type InsightSchedule,
  type InsightDelivery,
  type InsightAiConfig,
  type InsightStatus,
  type InsightRunStatus,
} from "./insight";

// Connectors (extend existing exports)
export {
  syncFrequencySchema,
  connectorConfigSchema,
  connectorNotificationsSchema,
  connectorAdvancedOptionsSchema,
  type SyncFrequency,
  type ConnectorConfig,
  type ConnectorNotifications,
  type ConnectorAdvancedOptions,
} from "./connector-types";

// Budget Alerts
export {
  alertTypeSchema,
  alertThresholdTypeSchema,
  alertTimeWindowSchema,
  alertStatusSchema,
  notificationTypeSchema,
  notificationChannelSchema,
  budgetAlertMetadataSchema,
  type AlertType,
  type AlertThresholdType,
  type AlertTimeWindow,
  type AlertStatus,
  type NotificationType,
  type NotificationChannel,
  type BudgetAlertMetadata,
} from "./budget-alerts";

// Business Domains
export {
  domainProviderConfigSchema,
  domainMetadataSchema,
  type DomainProviderConfig,
  type DomainMetadata,
} from "./business-domains";

// AI Templates
export {
  templateVariableSchema,
  templateMetadataSchema,
  type TemplateVariable,
  type TemplateMetadata,
} from "./ai-templates";

// AI Providers (extend existing exports)
export {
  customPricingSchema,
  providerMetadataSchema,
  providerCapabilitiesSchema,
  failoverConfigSchema,
  type CustomPricing,
  type ProviderMetadata,
  type ProviderCapabilities,
  type FailoverConfig,
} from "./ai-providers";

// Reports
export { reportMetadataSchema, type ReportMetadata } from "./reports";
```

---

### Phase 2: Update Database Schemas

**Goal**: Typed JSONB columns with valid defaults across ALL affected entities

#### 2.1 Insights — `packages/database/src/schema/core/insights.ts`

```typescript
import type { InsightSchedule, InsightDelivery, InsightAiConfig } from "@agenticverdict/types";

schedule: jsonb("schedule")
  .$type<InsightSchedule>()
  .notNull()
  .default(sql`'{"frequency":"weekly","time":9}'::jsonb`),

delivery: jsonb("delivery")
  .$type<InsightDelivery>()
  .notNull()
  .default(sql`'{"format":"pdf"}'::jsonb`),

aiConfig: jsonb("ai_config")
  .$type<InsightAiConfig>()
  .notNull()
  .default(sql`'{"model":"claude-3.5-sonnet","detailLevel":"standard"}'::jsonb`),
```

#### 2.2 Connectors — `packages/database/src/schema/core/connectors.ts`

```typescript
import type { ConnectorConfig, ConnectorNotifications, ConnectorAdvancedOptions } from "@agenticverdict/types";

config: jsonb("config")
  .$type<ConnectorConfig>()
  .notNull()
  .default(sql`'{}'::jsonb`),

notifications: jsonb("notifications")
  .$type<ConnectorNotifications>()
  .notNull()
  .default(sql`'{}'::jsonb`),

advancedOptions: jsonb("advanced_options")
  .$type<ConnectorAdvancedOptions>()
  .notNull()
  .default(sql`'{}'::jsonb`),
```

#### 2.3 Budget Alerts — `packages/database/src/schema/budget-alerts.ts`

```typescript
import type { NotificationChannel, BudgetAlertMetadata } from "@agenticverdict/types";

notifications: jsonb("notifications")
  .$type<NotificationChannel[]>()
  .notNull(),

metadata: jsonb("metadata")
  .$type<BudgetAlertMetadata>(),
```

#### 2.4 Business Domains — `packages/database/src/schema/business-domains.ts`

```typescript
import type { DomainProviderConfig, DomainMetadata } from "@agenticverdict/types";

providerConfig: jsonb("provider_config")
  .$type<DomainProviderConfig>(),

metadata: jsonb("metadata")
  .$type<DomainMetadata>(),
```

#### 2.5 AI Templates — `packages/database/src/schema/ai-templates.ts`

```typescript
import type { TemplateVariable, TemplateMetadata } from "@agenticverdict/types";

variables: jsonb("variables")
  .$type<TemplateVariable[]>()
  .default([]),

metadata: jsonb("metadata")
  .$type<TemplateMetadata>(),
```

#### 2.6 AI Providers — `packages/database/src/schema/ai-providers.ts`

```typescript
import type { CustomPricing, ProviderMetadata, ProviderCapabilities } from "@agenticverdict/types";

customPricing: jsonb("custom_pricing")
  .$type<CustomPricing>(),

metadata: jsonb("metadata")
  .$type<ProviderMetadata>(),

capabilities: jsonb("capabilities")
  .$type<ProviderCapabilities>(),
```

#### 2.7 Reports — `packages/database/src/schema/reports.ts`

```typescript
import type { ReportMetadata } from "@agenticverdict/types";

metadata: jsonb("metadata").$type<ReportMetadata>(),
```

#### 2.8 Add PostgreSQL CHECK Constraints (Insights Only — Has Enum JSONB)

```sql
ALTER TABLE core.insights
  ADD CONSTRAINT schedule_frequency_check
  CHECK (schedule->>'frequency' IN ('daily', 'weekly', 'monthly', 'quarterly'));

ALTER TABLE core.insights
  ADD CONSTRAINT delivery_format_check
  CHECK (delivery->>'format' IN ('pdf', 'excel', 'both'));

ALTER TABLE core.insights
  ADD CONSTRAINT ai_config_detail_level_check
  CHECK (ai_config->>'detailLevel' IN ('executive', 'standard', 'comprehensive'));

ALTER TABLE core.insights
  ADD CONSTRAINT ai_config_quality_level_check
  CHECK (ai_config->>'qualityLevel' IN ('standard', 'premium') OR ai_config->>'qualityLevel' IS NULL);
```

---

### Phase 3: Fix Seed Data (Destructive)

**Goal**: All factories produce only valid data

#### 3.1 Update `packages/database/src/factories/insight-factory.ts`

```typescript
import type { InsightSchedule, InsightDelivery, InsightAiConfig } from "@agenticverdict/types";

// Replace factory interfaces with imported types
// Fix all seed data:
// - Remove "hourly" frequency → use "daily"
// - Remove "csv"/"json" formats → use "pdf"/"excel"/"both"
// - Rename aiConfig keys: providerId→provider, modelId→model, etc.
// - Remove "partial" from lastRunStatus
// - Remove extra keys: enabled, cronExpression, timezone, channels, includeRawData
```

#### 3.2 Update `packages/database/src/factories/connector-factory.ts`

```typescript
import type {
  ConnectorConfig,
  ConnectorNotifications,
  ConnectorAdvancedOptions,
} from "@agenticverdict/types";

// Add missing fields to SeedTenantConnector:
// config?: ConnectorConfig
// notifications?: ConnectorNotifications
// advancedOptions?: ConnectorAdvancedOptions
```

#### 3.3 Destructive Database Reset

```bash
make db-reset
make db-seed
```

---

### Phase 4: Update API Layer

**Goal**: Import shared schemas, remove inline definitions, eliminate normalization band-aids

#### 4.1 Insights — `apps/api/src/trpc/routers/insights.ts`

- Import schemas from `@agenticverdict/types`
- Replace inline `insightCreateSchema`, `insightOutputSchema` with schema compositions
- **Delete lines 247-308** (the entire normalization block with `validFrequencies`, `validFormats`, `validDetailLevels`, `validStatuses`, `validRunStatuses`)
- Replace all `as` casts with schema-parsed values

#### 4.2 Connectors — `apps/api/src/trpc/routers/connector.ts`

- Remove unsafe `as` casts for `platform`, `status`, `lastSyncStatus`
- Use `connectorTypeSchema.parse(row.platform)`, `connectorStatusSchema.parse(row.status)` instead
- Import JSONB schemas from `@agenticverdict/types`

#### 4.3 Budget Alerts — `apps/api/src/trpc/routers/budget-alerts.ts`

- Replace inline schemas (lines 7-62) with imports from `@agenticverdict/types`
- Remove duplicate enum definitions — use shared `alertTypeSchema`, `alertThresholdTypeSchema`, etc.

#### 4.4 Business Domains — `apps/api/src/trpc/routers/ai-domains.ts`

- Replace 3 inline `providerConfig` schema definitions with imported `domainProviderConfigSchema`
- Use shared `domainMetadataSchema` for metadata fields

#### 4.5 AI Templates — `apps/api/src/trpc/routers/ai-templates.ts`

- Fix output schema `variables` to include `pattern` field from `templateVariableSchema`
- Import `templateMetadataSchema` for metadata

#### 4.6 Reports — `apps/api/src/trpc/routers/reports.ts`

- Replace inline `metadata: z.record(z.unknown()).nullable()` with imported `reportMetadataSchema`

---

### Phase 5: Reconcile Core Schemas with Types Package

**Goal**: Eliminate the `packages/core/schemas/` → `packages/types/` split for shared domain types

#### 5.1 Move Budget Alert Schemas from Core to Types

The following schemas in `packages/core/src/schemas/ai-provider.ts` should be replaced with imports from `@agenticverdict/types`:

- `alertTypeSchema` → use from types
- `alertThresholdTypeSchema` → use from types
- `alertTimeWindowSchema` → use from types
- `alertStatusSchema` → use from types
- `notificationTypeSchema` → use from types
- `notificationChannelSchema` → use from types
- `createBudgetAlertSchema` → use from types
- `updateBudgetAlertSchema` → use from types

#### 5.2 Move Template/Domain Schemas from Core to Types

- `templateTypeSchema`, `templateVariableSchema`, `createTemplateSchema`, `updateTemplateSchema`, `deployTemplateSchema` → use from types
- `createDomainSchema`, `updateDomainSchema`, `assignConnectorToDomainSchema`, `domainHierarchyNodeSchema` → use from types

#### 5.3 Keep in Core (Operation-Specific)

The following should remain in `packages/core/` as they are operation-specific, not domain types:

- `providerHealthSchema` (runtime health check)
- `usageReportSchema`, `usageQueryFiltersSchema`, `usageSummarySchema` (operation payloads)
- `resolvedConfigSchema`, `resolveConfigInputSchema` (runtime config resolution)
- `paginationSchema`, `paginatedResponseSchema`, `successResponseSchema`, `errorResponseSchema` (generic utilities)

---

## Implementation Order

1. **Phase 1** → Add all canonical types to `packages/types/` (7 entities)
2. **Phase 2** → Update all DB schema files to use typed JSONB (7 files)
3. **Phase 3** → Fix all factories, run `make db-reset && make db-seed` (destructive)
4. **Phase 4** → Update all API routers (6 files), remove normalization band-aids
5. **Phase 5** → Reconcile core schemas with types package

---

## Verification Checklist

### Insights (Original)

- [ ] `pnpm run typecheck` passes with no errors
- [ ] `pnpm run lint` passes
- [ ] `make db-reset && make db-seed` completes successfully
- [ ] `insight.list` returns 200 with valid data
- [ ] `insight.detail` returns 200 with valid data
- [ ] `insight.create` rejects invalid enum values at input validation
- [ ] `insight.update` rejects invalid enum values at input validation
- [ ] PostgreSQL CHECK constraints are active
- [ ] No manual enum validation guards remain in tRPC handlers
- [ ] No normalization functions exist for insight data
- [ ] All insight-related types flow from `packages/types/`

### Connectors

- [ ] No `as` casts for `platform`, `status`, `lastSyncStatus` in connector router
- [ ] `connector.list` returns 200 with properly typed data
- [ ] `connector.detail` returns 200 with properly typed data
- [ ] Factory includes `config`, `notifications`, `advancedOptions` fields

### Budget Alerts

- [ ] API router imports from `@agenticverdict/types` instead of inline schemas
- [ ] No duplicate enum definitions in budget-alerts router
- [ ] `budgetAlerts.list` returns 200 with properly typed data

### Business Domains

- [ ] Single `domainProviderConfigSchema` used across all 3 API locations
- [ ] `aiDomains.list` returns 200 with properly typed data

### AI Templates

- [ ] Output schema `variables` includes `pattern` field
- [ ] `aiTemplates.list` returns 200 with properly typed data

### AI Providers

- [ ] DB schema uses typed JSONB for `customPricing`, `capabilities`
- [ ] `aiProviders.list` returns 200 with properly typed data

### Reports

- [ ] `report.list` returns 200 with properly typed metadata
- [ ] `report.detail` returns 200 with properly typed metadata

---

## Preventive Measures

### Rule 1: Types Package is Single Source of Truth

All shared domain types (especially enums and JSONB shapes) MUST be defined in `packages/types/` and imported by:

- Database schemas
- API routers
- Seed factories
- Frontend adapters

### Rule 2: JSONB Columns Require Typed Defaults

Never use `'{}'::jsonb` as default for JSONB columns that have required fields. Defaults must be valid instances of the target type.

### Rule 3: Database CHECK Constraints for Enums

Add PostgreSQL CHECK constraints for JSONB fields containing enum values as defense-in-depth. Apply directly during schema setup — no migration workflow needed.

### Rule 4: No Inline Enum Definitions

Prohibit inline `z.enum([...])` definitions for shared domain concepts. Use imported schemas from `packages/types/`.

### Rule 5: No Unsafe `as` Casts for Enum Values

Prohibit `row.field as "enum1" | "enum2"` patterns. Use `schema.parse(row.field)` or `schema.safeParse()` for runtime validation.

### Rule 6: No Normalization Band-Aids

When data from DB doesn't match API schema expectations, fix the data at the source (factory/seed), don't add normalization code in the API layer.

### Rule 7: Destructive Reset for Data Corruption

When seed data or existing data becomes inconsistent with schemas, use `make db-reset && make db-seed` to destroy and regenerate. No data migration scripts needed in greenfield.

---

## Files to Modify

| File                                                   | Change Type                          | Priority |
| ------------------------------------------------------ | ------------------------------------ | -------- |
| `packages/types/src/insight.ts`                        | Add schemas                          | P0       |
| `packages/types/src/connector-types.ts`                | Add JSONB schemas                    | P0       |
| `packages/types/src/budget-alerts.ts`                  | **NEW FILE**                         | P1       |
| `packages/types/src/business-domains.ts`               | **NEW FILE**                         | P1       |
| `packages/types/src/ai-templates.ts`                   | **NEW FILE**                         | P2       |
| `packages/types/src/ai-providers.ts`                   | Extend with schemas                  | P2       |
| `packages/types/src/reports.ts`                        | **NEW FILE**                         | P2       |
| `packages/types/src/index.ts`                          | Export all schemas                   | P0       |
| `packages/database/src/schema/core/insights.ts`        | Update types, CHECK constraints      | P0       |
| `packages/database/src/schema/core/connectors.ts`      | Update JSONB types                   | P0       |
| `packages/database/src/schema/budget-alerts.ts`        | Update JSONB types                   | P1       |
| `packages/database/src/schema/business-domains.ts`     | Update JSONB types                   | P1       |
| `packages/database/src/schema/ai-templates.ts`         | Update JSONB types                   | P2       |
| `packages/database/src/schema/ai-providers.ts`         | Update JSONB types                   | P2       |
| `packages/database/src/schema/reports.ts`              | Update JSONB types                   | P2       |
| `packages/database/src/factories/insight-factory.ts`   | Fix seed data                        | P0       |
| `packages/database/src/factories/connector-factory.ts` | Add missing fields                   | P0       |
| `apps/api/src/trpc/routers/insights.ts`                | Import schemas, delete normalization | P0       |
| `apps/api/src/trpc/routers/connector.ts`               | Remove unsafe casts                  | P0       |
| `apps/api/src/trpc/routers/budget-alerts.ts`           | Import schemas                       | P1       |
| `apps/api/src/trpc/routers/ai-domains.ts`              | Import schemas                       | P1       |
| `apps/api/src/trpc/routers/ai-templates.ts`            | Fix pattern field                    | P2       |
| `apps/api/src/trpc/routers/reports.ts`                 | Import schemas                       | P2       |
| `packages/core/src/schemas/ai-provider.ts`             | Reconcile with types                 | P2       |

---

## Risk Assessment

| Risk                                         | Impact            | Mitigation                                                             |
| -------------------------------------------- | ----------------- | ---------------------------------------------------------------------- |
| Data loss during db-reset                    | None (greenfield) | No production data exists                                              |
| Factory changes break tests                  | Low               | Update test fixtures alongside factory                                 |
| CHECK constraints block valid inserts        | Low               | Test constraints thoroughly before applying                            |
| Circular dependency between types and core   | Medium            | Keep operation-specific schemas in core, domain types in types package |
| Breaking API contract for existing consumers | Low               | Greenfield project, no external consumers yet                          |
