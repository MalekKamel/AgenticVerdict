# Type Consolidation Implementation Plan

**Objective:** Establish `/packages/types` as the single source of truth for all shared types and Zod schemas across the AgenticVerdict monorepo, eliminating all duplicates and misplaced definitions.

---

## Executive Summary

The codebase has three categories of violations:

| Category                                                  | Count   | Severity |
| --------------------------------------------------------- | ------- | -------- |
| **Critical Conflicts** (same name, different shape)       | 8 pairs | BLOCKER  |
| **Confirmed Duplicates** (identical or near-identical)    | 25+     | HIGH     |
| **Misplaced Types** (domain types in core/other packages) | 50+     | MEDIUM   |

---

## Phase 0: Resolve Critical Conflicts (BLOCKER)

These types share the same name but have different shapes. Must be resolved before any other work.

### 0.1 `tenantAIConfigSchema` / `TenantAIConfig`

| Location                                       | Shape                                                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `packages/types/src/tenant.ts:43`              | Simple: `{ provider, model, qualityLevel, customizationLevel }`                                                     |
| `packages/core/src/tenant/config-schema.ts:71` | Rich: `{ primaryProvider, defaultModel, roleBasedModels, budget, failover, circuitBreaker, providerSettings, ... }` |

**Resolution:** The rich schema in `core` is the correct runtime configuration. The simple schema in `types` is an outdated stub.

- **Action:** Replace `packages/types/src/tenant.ts` `tenantAIConfigSchema` with the rich version from `core`.
- **Action:** Move sub-schemas (`providerModelConfigSchema`, `roleBasedModelConfigSchema`, `budgetConfigSchema`, `failoverConfigSchema`, `circuitBreakerConfigSchema`) to `packages/types/src/tenant.ts`.
- **Action:** Keep `validateTenantAIConfig()` and `mergeTenantAIConfig()` functions in `core` (they are runtime logic).
- **Action:** Import schemas from `@agenticverdict/types` in `core`.

### 0.2 `failoverConfigSchema` / `FailoverConfig`

| Location                                       | Shape                                                                              |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| `packages/types/src/ai-providers.ts:148`       | `{ primaryProviderId, fallbackProviders, isEnabled, providerTimeout, maxRetries }` |
| `packages/core/src/tenant/config-schema.ts:45` | `{ fallbackProviders, enabled, providerTimeout, maxRetriesPerProvider }`           |

**Resolution:** Merge into the richer `types` version. The `core` version is a subset.

- **Action:** Keep `packages/types/src/ai-providers.ts` version as canonical.
- **Action:** Update `core` to import from `@agenticverdict/types`.

### 0.3 `CostTier`

| Location                                  | Kind                                           |
| ----------------------------------------- | ---------------------------------------------- |
| `packages/types/src/ai-providers.ts:6`    | `z.enum(["premium", "standard", "economy"])`   |
| `packages/core/src/types/ai-models.ts:11` | `enum CostTier { PREMIUM, STANDARD, ECONOMY }` |

**Resolution:** The `z.enum` in `types` is canonical (provides both schema and inferred type).

- **Action:** Delete the TypeScript enum in `core`. Import `costTierSchema` from `@agenticverdict/types`.

### 0.4 `BusinessDomain`

| Location                                               | Fields                                                          |
| ------------------------------------------------------ | --------------------------------------------------------------- |
| `packages/types/src/ai-providers.ts:20`                | Rich interface with `providerConfig`, `usesTenantDefault`, etc. |
| `packages/core/src/types/ai-models.ts:115`             | Similar but with `AiProviderConfig` type for providerConfig     |
| `packages/database/src/schema/business-domains.ts:221` | Drizzle `$inferSelect` type                                     |

**Resolution:** The `types` version is the canonical DTO. Database type should be suffixed `BusinessDomainDb`.

- **Action:** Keep `packages/types/src/ai-providers.ts` version.
- **Action:** Delete interface in `core`, import from `@agenticverdict/types`.

### 0.5 `AiTemplate`

| Location                                           | Fields                                               |
| -------------------------------------------------- | ---------------------------------------------------- |
| `packages/types/src/ai-providers.ts:94`            | Rich interface with `status`, `lastDeployedAt`, etc. |
| `packages/core/src/types/ai-models.ts:352`         | Simpler, missing `status`, `lastDeployedAt`          |
| `packages/database/src/schema/ai-templates.ts:289` | Drizzle `$inferSelect` type                          |

**Resolution:** The `types` version is canonical.

- **Action:** Delete interface in `core`, import from `@agenticverdict/types`.

### 0.6 `TemplateVariable`

| Location                                   | Constraints     |
| ------------------------------------------ | --------------- |
| `packages/types/src/ai-templates.ts:3`     | With Zod schema |
| `packages/core/src/types/ai-models.ts:405` | Plain interface |

**Resolution:** The `types` version with schema is canonical.

- **Action:** Delete interface in `core`, import from `@agenticverdict/types`.

### 0.7 `AlertNotification` vs `NotificationChannel`

| Location                                   | Name                  |
| ------------------------------------------ | --------------------- |
| `packages/types/src/budget-alerts.ts:9`    | `NotificationChannel` |
| `packages/core/src/types/ai-models.ts:478` | `AlertNotification`   |

**Resolution:** Same shape, different names. Use `NotificationChannel` from `types`.

- **Action:** Delete `AlertNotification` in `core`, import `NotificationChannel` from `@agenticverdict/types`.

### 0.8 `providerIdSchema` (within core)

| Location                                       |
| ---------------------------------------------- |
| `packages/core/src/tenant/config-schema.ts:15` |
| `packages/core/src/schemas/ai-provider.ts:31`  |

**Resolution:** Duplicate within the same package.

- **Action:** Define once in `packages/types/src/`, import in both places.

---

## Phase 1: Move Domain Types from `/packages/core` to `/packages/types`

### 1.1 Move `packages/core/src/types/ai-models.ts` (534 lines)

All 15 types in this file are pure domain DTOs. Move to `packages/types/src/ai-providers.ts`:

| Type                     | Destination File                                  |
| ------------------------ | ------------------------------------------------- |
| `AiProviderDetailItem`   | Merge with existing `AiProviderDetail` in `types` |
| `AiModel`                | Add to `types/src/ai-providers.ts`                |
| `AiUsageReport`          | New file `types/src/ai-usage.ts`                  |
| `AiUsageSummary`         | `types/src/ai-usage.ts`                           |
| `ProviderUsageBreakdown` | `types/src/ai-usage.ts`                           |
| `DomainUsageBreakdown`   | `types/src/ai-usage.ts`                           |
| `ModelUsageBreakdown`    | `types/src/ai-usage.ts`                           |
| `BudgetAlert`            | `types/src/budget-alerts.ts`                      |
| `ResolvedConfig`         | `types/src/ai-providers.ts`                       |

### 1.2 Move `packages/core/src/schemas/ai-provider.ts` (462 lines)

All Zod schemas in this file are input/output validation schemas. Move to `packages/types/src/`:

| Schema                                                                                              | Destination File                |
| --------------------------------------------------------------------------------------------------- | ------------------------------- |
| `providerIdSchema`, `modelIdSchema`                                                                 | `types/src/ai-providers.ts`     |
| `aiModelConfigSchema`                                                                               | `types/src/ai-providers.ts`     |
| `createProviderConfigSchema`, `updateProviderConfigSchema`                                          | `types/src/ai-providers.ts`     |
| `providerCredentialsSchema`                                                                         | `types/src/ai-providers.ts`     |
| `providerHealthSchema`                                                                              | `types/src/ai-providers.ts`     |
| `domainIdSchema`, `createDomainSchema`, `updateDomainSchema`                                        | `types/src/business-domains.ts` |
| `assignConnectorToDomainSchema`                                                                     | `types/src/business-domains.ts` |
| `domainHierarchyNodeSchema`, `DomainHierarchyNode`                                                  | `types/src/business-domains.ts` |
| `templateTypeSchema`, `createTemplateSchema`, `updateTemplateSchema`, `deployTemplateSchema`        | `types/src/ai-templates.ts`     |
| `usageReportSchema`, `usageQueryFiltersSchema`, `usageSummarySchema`                                | `types/src/ai-usage.ts`         |
| `createBudgetAlertSchema`, `updateBudgetAlertSchema`, `alertTriggerSchema`                          | `types/src/budget-alerts.ts`    |
| `configScopeSchema`, `resolvedConfigSchema`, `resolveConfigInputSchema`                             | `types/src/ai-providers.ts`     |
| `paginationSchema`, `paginatedResponseSchema<T>`, `successResponseSchema<T>`, `errorResponseSchema` | `types/src/common.ts`           |

### 1.3 Move tenant config sub-schemas from `core/src/tenant/config-schema.ts`

| Schema                       | Destination           |
| ---------------------------- | --------------------- |
| `providerModelConfigSchema`  | `types/src/tenant.ts` |
| `roleBasedModelConfigSchema` | `types/src/tenant.ts` |
| `budgetConfigSchema`         | `types/src/tenant.ts` |
| `circuitBreakerConfigSchema` | `types/src/tenant.ts` |
| All inferred types           | `types/src/tenant.ts` |

Keep in `core`: `validateTenantAIConfig()`, `mergeTenantAIConfig()`, `defaultTenantAIConfig` (runtime logic).

---

## Phase 2: Add Missing Types to `/packages/types`

### 2.1 Insight CRUD Schemas (from `apps/api/src/trpc/routers/insights.ts`)

| Schema                     | Current Location                   | Destination                  |
| -------------------------- | ---------------------------------- | ---------------------------- |
| `insightCreateSchema`      | `api/trpc/routers/insights.ts:38`  | `types/src/insight.ts`       |
| `insightUpdateSchema`      | `api/trpc/routers/insights.ts:56`  | `types/src/insight.ts`       |
| `insightListInputSchema`   | `api/trpc/routers/insights.ts:156` | `types/src/insight.ts`       |
| `insightOutputSchema`      | `api/trpc/routers/insights.ts:166` | `types/src/insight.ts`       |
| `insightListOutputSchema`  | `api/trpc/routers/insights.ts:192` | `types/src/insight.ts`       |
| `tenantConfigOutputSchema` | `api/trpc/routers/insights.ts:231` | `types/src/tenant-public.ts` |

### 2.2 Report Schemas (from `apps/api/src/trpc/routers/reports.ts`)

| Schema                   | Current Location                 | Destination            |
| ------------------------ | -------------------------------- | ---------------------- |
| `reportListInputSchema`  | `api/trpc/routers/reports.ts:33` | `types/src/reports.ts` |
| `reportOutputSchema`     | `api/trpc/routers/reports.ts:44` | `types/src/reports.ts` |
| `reportListOutputSchema` | `api/trpc/routers/reports.ts:54` | `types/src/reports.ts` |

### 2.3 Budget Alert Output Schema

| Schema              | Current Location                       | Destination                  |
| ------------------- | -------------------------------------- | ---------------------------- |
| `alertOutputSchema` | `api/trpc/routers/budget-alerts.ts:35` | `types/src/budget-alerts.ts` |

### 2.4 AI Provider Router Schemas (from `apps/api/src/trpc/routers/ai-providers.ts`)

| Schema                           | Current Location                       | Destination                 |
| -------------------------------- | -------------------------------------- | --------------------------- |
| `listProvidersInputSchema`       | `api/trpc/routers/ai-providers.ts:20`  | `types/src/ai-providers.ts` |
| `getProviderInputSchema`         | `api/trpc/routers/ai-providers.ts:26`  | `types/src/ai-providers.ts` |
| `updateProviderInputSchema`      | `api/trpc/routers/ai-providers.ts:31`  | `types/src/ai-providers.ts` |
| `toggleProviderInputSchema`      | `api/trpc/routers/ai-providers.ts:35`  | `types/src/ai-providers.ts` |
| `testConnectivityInputSchema`    | `api/trpc/routers/ai-providers.ts:42`  | `types/src/ai-providers.ts` |
| `configureFailoverInputSchema`   | `api/trpc/routers/ai-providers.ts:46`  | `types/src/ai-providers.ts` |
| `getFailoverInputSchema`         | `api/trpc/routers/ai-providers.ts:54`  | `types/src/ai-providers.ts` |
| `providerOutputSchema`           | `api/trpc/routers/ai-providers.ts:62`  | `types/src/ai-providers.ts` |
| `failoverConfigOutputSchema`     | `api/trpc/routers/ai-providers.ts:96`  | `types/src/ai-providers.ts` |
| `paginatedProvidersOutputSchema` | `api/trpc/routers/ai-providers.ts:106` | `types/src/ai-providers.ts` |

### 2.5 AI Domain Router Schemas (from `apps/api/src/trpc/routers/ai-domains.ts`)

| Schema                            | Current Location                    | Destination                     |
| --------------------------------- | ----------------------------------- | ------------------------------- |
| `listDomainsInputSchema`          | `api/trpc/routers/ai-domains.ts:20` | `types/src/business-domains.ts` |
| `getDomainInputSchema`            | `api/trpc/routers/ai-domains.ts:24` | `types/src/business-domains.ts` |
| `updateDomainInputSchema`         | `api/trpc/routers/ai-domains.ts:30` | `types/src/business-domains.ts` |
| `deleteDomainInputSchema`         | `api/trpc/routers/ai-domains.ts:34` | `types/src/business-domains.ts` |
| `removeConnectorInputSchema`      | `api/trpc/routers/ai-domains.ts:40` | `types/src/business-domains.ts` |
| `getDomainTreeInputSchema`        | `api/trpc/routers/ai-domains.ts:44` | `types/src/business-domains.ts` |
| `updateProviderConfigInputSchema` | `api/trpc/routers/ai-domains.ts:48` | `types/src/business-domains.ts` |
| `domainOutputSchema`              | `api/trpc/routers/ai-domains.ts:57` | `types/src/business-domains.ts` |
| `domainHierarchyOutputSchema`     | `api/trpc/routers/ai-domains.ts:82` | `types/src/business-domains.ts` |

### 2.6 AI Template Router Schemas (from `apps/api/src/trpc/routers/ai-templates.ts`)

| Schema                       | Current Location                      | Destination                 |
| ---------------------------- | ------------------------------------- | --------------------------- |
| `listTemplatesInputSchema`   | `api/trpc/routers/ai-templates.ts:17` | `types/src/ai-templates.ts` |
| `getTemplateInputSchema`     | `api/trpc/routers/ai-templates.ts:23` | `types/src/ai-templates.ts` |
| `updateTemplateInputSchema`  | `api/trpc/routers/ai-templates.ts:27` | `types/src/ai-templates.ts` |
| `deleteTemplateInputSchema`  | `api/trpc/routers/ai-templates.ts:31` | `types/src/ai-templates.ts` |
| `publishTemplateInputSchema` | `api/trpc/routers/ai-templates.ts:33` | `types/src/ai-templates.ts` |
| `getUsageInputSchema`        | `api/trpc/routers/ai-templates.ts:37` | `types/src/ai-templates.ts` |
| `templateOutputSchema`       | `api/trpc/routers/ai-templates.ts:44` | `types/src/ai-templates.ts` |

### 2.7 AI Usage Router Schemas (from `apps/api/src/trpc/routers/ai-usage.ts`)

| Schema                     | Current Location                  | Destination             |
| -------------------------- | --------------------------------- | ----------------------- |
| `usageQueryInputSchema`    | `api/trpc/routers/ai-usage.ts:9`  | `types/src/ai-usage.ts` |
| `recordUsageInputSchema`   | `api/trpc/routers/ai-usage.ts:17` | `types/src/ai-usage.ts` |
| `usageSummaryOutputSchema` | `api/trpc/routers/ai-usage.ts:35` | `types/src/ai-usage.ts` |

### 2.8 Auth Middleware Types

| Type          | Current Location                | Destination         |
| ------------- | ------------------------------- | ------------------- |
| `AuthPayload` | `api/src/middleware/auth.ts:64` | `types/src/auth.ts` |

---

## Phase 3: Eliminate Frontend Duplicates

### 3.1 Insight Schemas (HIGH - exact duplicates)

| Frontend Schema         | Location                                   | Canonical Equivalent                                 |
| ----------------------- | ------------------------------------------ | ---------------------------------------------------- |
| `InsightAIConfigSchema` | `frontend/features/insights/schemas.ts:9`  | `insightAiConfigSchema` in `types/src/insight.ts:78` |
| `InsightScheduleSchema` | `frontend/features/insights/schemas.ts:20` | `insightScheduleSchema` in `types/src/insight.ts:64` |
| `InsightDeliverySchema` | `frontend/features/insights/schemas.ts:27` | `insightDeliverySchema` in `types/src/insight.ts:70` |
| `InsightListItemSchema` | `frontend/features/insights/schemas.ts:46` | Should use `insightOutputSchema` from `types`        |

**Action:** Delete all four from frontend, import from `@agenticverdict/types`.

### 3.2 Auth Types

| Frontend Type             | Location                                              | Canonical Equivalent                           |
| ------------------------- | ----------------------------------------------------- | ---------------------------------------------- |
| `UserInfo`                | `frontend/features/auth/model/state/auth-store.ts:22` | `AuthUserData` in `types/src/auth.ts:268`      |
| `AuthApiError`            | `frontend/features/auth/api/auth-api.ts:127`          | `AuthErrorResponse` in `types/src/auth.ts:302` |
| `SessionData`             | `frontend/features/auth/api/auth-api.ts:177`          | `GetSessionOutput` in `types/src/auth.ts:124`  |
| `AuthUserData` (frontend) | `frontend/features/auth/api/auth-api.ts:161`          | Extend `AuthUserData` from `types`             |

**Action:** Replace with imports from `@agenticverdict/types`. Where frontend adds extra fields, create extended interfaces that `extend` the base type.

### 3.3 Report Types

| Frontend Type             | Location                                | Action                        |
| ------------------------- | --------------------------------------- | ----------------------------- |
| `ReportListItem`          | `frontend/features/reports/types.ts:5`  | Add to `types/src/reports.ts` |
| `ReportListResponse`      | `frontend/features/reports/types.ts:15` | Add to `types/src/reports.ts` |
| `ReportDetail`            | `frontend/features/reports/types.ts:22` | Add to `types/src/reports.ts` |
| `ShareLink`               | `frontend/features/reports/types.ts:54` | Add to `types/src/reports.ts` |
| `CreateShareLinkResponse` | `frontend/features/reports/types.ts:64` | Add to `types/src/reports.ts` |

**Action:** Move to `types/src/reports.ts`, then import in frontend.

### 3.4 Router Search Params

| Frontend Type         | Location                                       | Canonical Equivalent                                      |
| --------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| `ConnectorListSearch` | `frontend/src/router/types/search-params.ts:1` | `ConnectorListInput` in `types/src/connector-types.ts:40` |

**Action:** Replace with `ConnectorListInput` from `@agenticverdict/types`.

---

## Phase 4: Eliminate Database Package Duplicates

### 4.1 Enum Type Duplicates

The database package defines TypeScript enum types that duplicate the types in `packages/types`:

| Database Type        | Location                                    | Types Equivalent                                        |
| -------------------- | ------------------------------------------- | ------------------------------------------------------- |
| `AlertType`          | `database/src/schema/budget-alerts.ts:38`   | `AlertType` in `types/src/budget-alerts.ts:18`          |
| `AlertThresholdType` | `database/src/schema/budget-alerts.ts:39`   | `AlertThresholdType` in `types/src/budget-alerts.ts:19` |
| `AlertTimeWindow`    | `database/src/schema/budget-alerts.ts:40`   | `AlertTimeWindow` in `types/src/budget-alerts.ts:20`    |
| `AlertStatus`        | `database/src/schema/budget-alerts.ts:41`   | `AlertStatus` in `types/src/budget-alerts.ts:21`        |
| `NotificationType`   | `database/src/schema/budget-alerts.ts:42`   | `NotificationType` in `types/src/budget-alerts.ts:22`   |
| `TenantType`         | `database/src/factories/user-factory.ts:27` | `TenantType` in `types/src/tenant.ts:5`                 |

**Action:** Delete enum type declarations in `database`, import from `@agenticverdict/types`. Keep `pgEnum` definitions (they are Drizzle-specific).

### 4.2 Drizzle Inferred Type Overlaps

| Database Type                     | Location                                       | Types Equivalent                                   | Action                                 |
| --------------------------------- | ---------------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| `GeneratedInsight` ($inferSelect) | `database/src/schema/generated-insights.ts:42` | `GeneratedInsight` in `types/src/insight.ts:30`    | Rename DB type to `GeneratedInsightDb` |
| `BusinessDomain` ($inferSelect)   | `database/src/schema/business-domains.ts:221`  | `BusinessDomain` in `types/src/ai-providers.ts:20` | Rename DB type to `BusinessDomainDb`   |
| `AiTemplate` ($inferSelect)       | `database/src/schema/ai-templates.ts:289`      | `AiTemplate` in `types/src/ai-providers.ts:94`     | Rename DB type to `AiTemplateDb`       |

**Action:** Rename all `$inferSelect` types with `Db` suffix to avoid collision with domain DTOs.

---

## Phase 5: Eliminate Cross-Package Duplicates

### 5.1 BrandTokens (3 packages)

| Location                                      | Name                |
| --------------------------------------------- | ------------------- |
| `packages/ui/src/tokens/types.ts:164`         | `BrandTokens`       |
| `packages/config/src/schemas/tenant-ui.ts:32` | `TenantBrandTokens` |
| `packages/ui/src/tokens/brand.ts:80`          | `brandTokensSchema` |

**Action:** Unify into a single `BrandTokens` type + schema in `types/src/`. Create a new file `types/src/branding.ts`.

### 5.2 ConnectorType Schema Duplicates

| Location                                                 | Name                         |
| -------------------------------------------------------- | ---------------------------- |
| `packages/types/src/`                                    | Canonical `ConnectorType`    |
| `packages/data-connectors/src/normalization/schema.ts:5` | `connectorTypeSchema`        |
| `packages/config/src/schemas/platform.ts:5`              | `connectorTypeSchema`        |
| `packages/config/src/schemas/runtime-config.ts:4`        | `mockAdapterConnectorSchema` |

**Action:** Delete local copies, import from `@agenticverdict/types`.

### 5.3 Template Types Split

| Location                                                         | Types                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------------- |
| `packages/config/src/schemas/template.ts`                        | `TemplateConfig`, `TemplateSection`, `TemplateVariable`, etc. |
| `packages/report-generator/src/templates/template-definition.ts` | `TemplateDefinition`, `TemplateKind`                          |

**Action:** Consolidate all template/template-related types into `types/src/templates.ts`.

### 5.4 Validation Types

| Location                                                | Types                                                      |
| ------------------------------------------------------- | ---------------------------------------------------------- |
| `packages/data-connectors/src/validation/types.ts`      | `ValidationIssue`, `ValidationSeverity`, `OutlierFlag`     |
| `packages/agent-runtime/src/validation/data-quality.ts` | `ValidationError`, `ValidationResult`, `ValidationWarning` |

**Action:** Create unified `types/src/validation.ts` with common validation types.

### 5.5 Retry/Backoff Types

| Location                                     | Types                              |
| -------------------------------------------- | ---------------------------------- |
| `packages/agent-runtime/src/resilience.ts`   | `RetryOptions`, `RetryAttemptInfo` |
| `packages/data-connectors/src/rate-limit.ts` | `ExponentialBackoffOptions`        |

**Action:** Create `types/src/resilience.ts` with unified retry/backoff types.

---

## Phase 6: New Files to Create in `/packages/types/src/`

| New File        | Contents                                                                                                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai-usage.ts`   | `AiUsageReport`, `AiUsageSummary`, `UsageReport`, `UsageQueryFilters`, `UsageSummary`, `ProviderUsageBreakdown`, `DomainUsageBreakdown`, `ModelUsageBreakdown` + all Zod schemas                     |
| `branding.ts`   | `BrandTokens`, `DesignTokens` + Zod schemas                                                                                                                                                          |
| `templates.ts`  | `TemplateConfig`, `TemplateSection`, `TemplateDefinition`, `TemplateKind`, `TemplateStyling`, `TemplateComponentSpec`, `TemplateBranding`, `TemplateValidation`, `TemplateInheritance` + Zod schemas |
| `validation.ts` | `ValidationIssue`, `ValidationSeverity`, `ValidationError`, `ValidationResult`, `ValidationWarning`, `OutlierFlag` + Zod schemas                                                                     |
| `resilience.ts` | `RetryOptions`, `RetryAttemptInfo`, `ExponentialBackoffOptions` + Zod schemas                                                                                                                        |

---

## Phase 7: Expand Existing Files in `/packages/types/src/`

| File                  | Add                                                                                                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tenant.ts`           | `tenantAIConfigSchema` (rich version), `providerModelConfigSchema`, `roleBasedModelConfigSchema`, `budgetConfigSchema`, `circuitBreakerConfigSchema`, `TenantConfigOutput` types |
| `insight.ts`          | `insightCreateSchema`, `insightUpdateSchema`, `insightListInputSchema`, `insightOutputSchema`, `insightListOutputSchema`, `InsightConnector`                                     |
| `reports.ts`          | `reportListInputSchema`, `reportOutputSchema`, `reportListOutputSchema`, `ReportListItem`, `ReportListResponse`, `ReportDetail`, `ShareLink`, `CreateShareLinkResponse`          |
| `budget-alerts.ts`    | `alertOutputSchema`, `createBudgetAlertSchema`, `updateBudgetAlertSchema`, `alertTriggerSchema`, `BudgetAlert` interface                                                         |
| `ai-providers.ts`     | All provider/domain/template schemas from `core/schemas/ai-provider.ts`, `AiModel`, `ResolvedConfig`, provider input/output schemas                                              |
| `business-domains.ts` | All domain CRUD schemas from `core/schemas/ai-provider.ts` and `api/trpc/routers/ai-domains.ts`                                                                                  |
| `ai-templates.ts`     | All template CRUD schemas from `core/schemas/ai-provider.ts` and `api/trpc/routers/ai-templates.ts`                                                                              |
| `auth.ts`             | `AuthPayload` interface                                                                                                                                                          |
| `common.ts`           | `paginationSchema`, `paginatedResponseSchema<T>`, `successResponseSchema<T>`, `errorResponseSchema`                                                                              |
| `tenant-public.ts`    | `tenantConfigOutputSchema`                                                                                                                                                       |

---

## Dependency Order for Execution

```
Phase 0 (Critical Conflicts) — MUST be done first
    ↓
Phase 1 (Move from core to types) — Unblocks all consumers
    ↓
Phase 6 (Create new type files) — Independent additions
    ↓
Phase 7 (Expand existing type files) — Depends on Phase 1
    ↓
Phase 2 (Add API router schemas to types) — Depends on Phase 7
    ↓
Phase 3 (Eliminate frontend duplicates) — Depends on Phase 2 + 7
    ↓
Phase 4 (Eliminate database duplicates) — Can be done in parallel with Phase 3
    ↓
Phase 5 (Cross-package duplicates) — Can be done in parallel with Phase 3-4
```

---

## Migration Strategy Per Phase

For each phase, follow this pattern:

1. **Add** the type/schema to `packages/types/src/` (new or expanded file)
2. **Export** from `packages/types/src/index.ts`
3. **Update** all importers to use `@agenticverdict/types`
4. **Delete** the duplicate from the original location
5. **Run** `pnpm run typecheck` to verify no breakage
6. **Run** `pnpm run lint` to verify code quality

---

## Files to Delete After Migration

| File                                             | Reason                                         |
| ------------------------------------------------ | ---------------------------------------------- |
| `packages/core/src/types/ai-models.ts`           | All types moved to `packages/types/`           |
| `packages/core/src/schemas/ai-provider.ts`       | All schemas moved to `packages/types/`         |
| `apps/frontend/src/features/insights/schemas.ts` | Exact duplicates of types in `packages/types/` |
| `apps/frontend/src/features/reports/types.ts`    | Types moved to `packages/types/`               |

---

## Files to Modify (Import Updates)

### Core Package

- `packages/core/src/tenant/config-schema.ts` — Import schemas from `@agenticverdict/types`
- `packages/core/src/index.ts` — Remove `export * from "./schemas/ai-provider"` and `export * from "./types/ai-models"`

### API App

- `apps/api/src/trpc/routers/insights.ts` — Import from `@agenticverdict/types`
- `apps/api/src/trpc/routers/reports.ts` — Import from `@agenticverdict/types`
- `apps/api/src/trpc/routers/budget-alerts.ts` — Import from `@agenticverdict/types`
- `apps/api/src/trpc/routers/ai-providers.ts` — Import from `@agenticverdict/types`
- `apps/api/src/trpc/routers/ai-domains.ts` — Import from `@agenticverdict/types`
- `apps/api/src/trpc/routers/ai-templates.ts` — Import from `@agenticverdict/types`
- `apps/api/src/trpc/routers/ai-usage.ts` — Import from `@agenticverdict/types`
- `apps/api/src/middleware/auth.ts` — Import from `@agenticverdict/types`

### Frontend App

- `apps/frontend/src/features/insights/` — All files importing local schemas
- `apps/frontend/src/features/reports/` — All files importing local types
- `apps/frontend/src/features/auth/` — All files importing local auth types
- `apps/frontend/src/router/types/search-params.ts` — Import from `@agenticverdict/types`
- `apps/frontend/src/hooks/useAiProviders.ts` — Import from `@agenticverdict/types`
- `apps/frontend/src/hooks/useAiTemplates.ts` — Import from `@agenticverdict/types`
- `apps/frontend/src/hooks/useAiDomains.ts` — Import from `@agenticverdict/types`

### Database Package

- `packages/database/src/schema/budget-alerts.ts` — Import enum types from `@agenticverdict/types`
- `packages/database/src/factories/user-factory.ts` — Import `TenantType` from `@agenticverdict/types`

### Other Packages

- `packages/data-connectors/src/normalization/schema.ts` — Import `connectorTypeSchema` from `@agenticverdict/types`
- `packages/config/src/schemas/platform.ts` — Import `connectorTypeSchema` from `@agenticverdict/types`
- `packages/config/src/schemas/runtime-config.ts` — Import from `@agenticverdict/types`
- `packages/config/src/schemas/template.ts` — Import from `@agenticverdict/types`
- `packages/ui/src/tokens/types.ts` — Import `BrandTokens` from `@agenticverdict/types`

---

## Risk Assessment

| Risk                                                 | Mitigation                                                             |
| ---------------------------------------------------- | ---------------------------------------------------------------------- |
| Breaking changes to `tenantAIConfigSchema` shape     | Audit all consumers before replacing; add deprecation period           |
| Circular dependencies between `types` and `core`     | `types` must never import from `core`; move logic functions to `core`  |
| Schema shape mismatches between frontend and backend | Align schemas first, then migrate consumers                            |
| Large PRs difficult to review                        | Execute one phase per PR; each phase should be independently mergeable |
