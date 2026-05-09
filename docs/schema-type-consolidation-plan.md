# Schema and Type Consolidation Remediation Plan

**Date:** 2026-05-11
**Status:** Draft
**Scope:** Monorepo-wide schema and type consolidation into `@agenticverdict/types`

---

## Executive Summary

The AgenticVerdict monorepo contains schemas and types scattered across 12+ locations in apps and packages, with significant duplication between `packages/types`, `apps/api`, `apps/worker`, `apps/frontend`, `packages/agent-runtime`, `packages/data-connectors`, and `packages/config`. This plan provides a step-by-step remediation strategy to consolidate all shared schemas and types into the `@agenticverdict/types` package, with complete deletion of legacy duplicates.

**Key findings:**

- **29 files** already exist in `packages/types/src/` (548-line barrel export)
- **60+ duplicate or overlapping schemas/types** identified across the codebase
- **3 packages** (`agent-runtime`, `data-connectors`, `config`) do not depend on `@agenticverdict/types` despite having overlapping types
- **Zod version incompatibility** (v3 vs v4) is the primary technical blocker

---

## 1. Current State Audit

### 1.1 packages/types (Current Central Location)

**Location:** `packages/types/src/`
**Files:** 29 TypeScript files
**Exports:** 548-line barrel export (`index.ts`)

| File                     | Contents                                                                       |
| ------------------------ | ------------------------------------------------------------------------------ |
| `auth.ts`                | Login/Register/PasswordReset I/O schemas, AuthPayload, AuthErrorCode           |
| `common.ts`              | Pagination, DateRange, MetricReference, success/error response schemas         |
| `connector-types.ts`     | Connector CRUD I/O schemas, SyncStatus, PlatformInfo                           |
| `tenant.ts`              | Tenant, TenantType, TenantStatus, AIConfig, BudgetConfig, CircuitBreakerConfig |
| `tenant-public.ts`       | Public-facing tenant branding I/O schemas                                      |
| `insight.ts`             | Insight CRUD schemas, InsightDelivery, InsightAiConfig, InsightConnector       |
| `insight-templates.ts`   | InsightTemplate, AppliedTemplateConfig, validation schemas                     |
| `verdict.ts`             | Verdict, VerdictEvidence, VerdictRecommendation, DataSourceInfo                |
| `dashboard.ts`           | DashboardKpiMetric, DashboardHomeSummary, DashboardLayoutState                 |
| `rbac.ts`                | Permission, Role, UserRole, RolePermission, Db variants                        |
| `ai-providers.ts`        | AiProvider, AiModel, ResolvedConfig, ProviderCredentials, ProviderHealth       |
| `ai-templates.ts`        | TemplateVariable, CreateTemplate, DeployTemplate                               |
| `ai-usage.ts`            | AiUsageReport, UsageQueryFilters, UsageSummary                                 |
| `budget-alerts.ts`       | BudgetAlert, AlertType, AlertThresholdType, NotificationChannel                |
| `business-domains.ts`    | CreateDomain, UpdateDomain, DomainHierarchyNode                                |
| `reports.ts`             | ReportMetadata, ReportListItem, ShareLink                                      |
| `schedule.ts`            | ScheduleRecord, ScheduleExecutionRecord, ScheduleCreateInput                   |
| `analysis.ts`            | AnalysisResultResponse, DataSourceProvenance, Transformation                   |
| `audit-event-types.ts`   | AUDIT_EVENT_TYPE_VALUES, AuditEventType enum                                   |
| `branding.ts`            | BrandTokens                                                                    |
| `templates.ts`           | TemplateConfig, TemplateDefinition, TemplateKind                               |
| `validation.ts`          | ValidationIssue, OutlierFlag, ValidationResult                                 |
| `resilience.ts`          | RetryOptions, ExponentialBackoffOptions                                        |
| `pipeline-execution.ts`  | PipelineExecutionStatus, JobStatusPayload                                      |
| `pipeline-data.ts`       | MetricDataPoint, PlatformSummary, AnalysisResult                               |
| `telemetry.ts`           | TelemetryEnvelope                                                              |
| `admin-feature-flags.ts` | FeatureFlagAdminRow                                                            |

### 1.2 Duplication Hotspots

#### A. apps/api/src/ — HIGH DUPLICATION

| File                                         | Duplicate Schemas/Types                                                                                                                                                                                         | Already In types?                                                 |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `trpc/routers/insights.ts:37-256`            | `insightCreateSchema`, `insightListInputSchema`, `insightOutputSchema`, `insightListOutputSchema`, `aiModelsOutputSchema`, `aiDefaultsOutputSchema`, `connectorDomainsOutputSchema`, `tenantConfigOutputSchema` | YES — `packages/types/src/insight.ts`                             |
| `trpc/routers/schedules.ts:11-26`            | `scheduleOutputSchema`, `executionOutputSchema`                                                                                                                                                                 | YES — `packages/types/src/schedule.ts`                            |
| `trpc/routers/ai-providers.ts:25-106`        | `getProviderInputSchema`, `providerOutputSchema`, `failoverConfigOutputSchema`, `paginatedProvidersOutputSchema`                                                                                                | YES — `packages/types/src/ai-providers.ts`                        |
| `trpc/routers/ai-templates.ts:23-44`         | `getTemplateInputSchema`, `templateOutputSchema`, `deleteTemplateInputSchema`                                                                                                                                   | YES — `packages/types/src/ai-templates.ts`                        |
| `trpc/routers/ai-domains.ts:25-83`           | `getDomainInputSchema`, `domainOutputSchema`, `domainHierarchyOutputSchema`                                                                                                                                     | YES — `packages/types/src/business-domains.ts`                    |
| `trpc/routers/budget-alerts.ts:14-35`        | `createAlertInputSchema`, `alertOutputSchema`                                                                                                                                                                   | YES — `packages/types/src/budget-alerts.ts`                       |
| `trpc/routers/reports.ts:33-54`              | `reportListInputSchema`, `reportOutputSchema`, `reportListOutputSchema`                                                                                                                                         | YES — `packages/types/src/reports.ts`                             |
| `trpc/routers/ai-usage.ts:9-35`              | `usageQueryInputSchema`, `usageSummaryOutputSchema`                                                                                                                                                             | YES — `packages/types/src/ai-usage.ts`                            |
| `middleware/auth.ts:64-73`                   | `AuthPayload`, `AuthMiddlewareOptions`                                                                                                                                                                          | YES — `AuthPayload` in `packages/types/src/auth.ts`               |
| `services/report-bullmq.ts:156,272`          | `WorkflowTriggerStatusPayload`, `InsightExecutionStatusPayload`                                                                                                                                                 | Partial — overlaps with worker types                              |
| `services/share-store.ts:3`                  | `ShareGrant`                                                                                                                                                                                                    | Partial — overlaps with `packages/types/src/reports.ts` ShareLink |
| `services/delivery-analytics-store.ts:13-49` | `DeliveryEvent`, `DeliveryMetricsSummary`, `DeliveryEventType`                                                                                                                                                  | No — new shared candidate                                         |
| `services/report-audit-store.ts:14`          | `ReportAuditEvent`                                                                                                                                                                                              | No — new shared candidate                                         |
| `services/schedule-bullmq.ts:168`            | `InsightScheduleTickJobData`                                                                                                                                                                                    | Partial — overlaps with worker types                              |
| `services/insight-templates.service.ts:11`   | `AppliedTemplateConfig`                                                                                                                                                                                         | YES — `packages/types/src/insight-templates.ts`                   |

#### B. apps/worker/src/ — HIGH DUPLICATION

| File                                | Duplicate Schemas/Types                                                                                                                                                                                                             | Already In types?           |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| `queues/job-types.ts:41-380`        | `WorkflowTriggerJobConfig`, `WorkflowTriggerJobResult`, `WorkflowTriggerJobData`, `ReportGenerationJobData`, `ReportDeliveryJobData`, `ReportScheduleJobData`, `InsightExecutionJobData`, `InsightExecutionJobResult` + Zod schemas | Partial — needs new file    |
| `queues/schedule-tick-insight.ts:8` | `InsightScheduleTickJobData`                                                                                                                                                                                                        | Partial — overlaps with API |

#### C. apps/frontend/src/ — MEDIUM DUPLICATION

| File                                                         | Duplicate Schemas/Types                                                                                                                                          | Already In types?                                                                                                            |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `features/insights/ui/wizard/validation.ts:3-39`             | `basicInfoSchema`, `connectorSelectionSchema`, `metricConfigurationSchema`, `aiSettingsSchema`, `scheduleDeliverySchema`, `createInsightWizardSchema`            | Partial — `scheduleDeliverySchema` duplicates `insightDeliverySchema`; `aiSettingsSchema` duplicates `insightAiConfigSchema` |
| `features/auth/model/validations/auth.ts:27-245`             | `loginSchema`, `registerSchema`, `forgotPasswordSchema`, `resetPasswordSchema`, `verifyEmailSchema`, `registerStepAccountTypeSchema`, `registerStepTenantSchema` | Partial — overlaps with `packages/types/src/auth.ts` but uses i18n error keys                                                |
| `features/schedules/services/schedule-service.ts:13-37`      | `ScheduleHistoryOptions`, `ScheduleHistoryResult`, `ScheduleValidationResult`, `ScheduleConflictResult`                                                          | Partial — overlaps with `packages/types/src/schedule.ts`                                                                     |
| `features/insights/ui/audit-trail/AuditTrailTimeline.tsx:32` | `AuditTrailEvent`                                                                                                                                                | No — new shared candidate                                                                                                    |
| `routes/api.health.platforms.$platform.ts:7`                 | `platformSchema`                                                                                                                                                 | YES — duplicates platform enum from types                                                                                    |

#### D. packages/agent-runtime/src/ — HIGH DUPLICATION

| File                                 | Duplicate Schemas/Types                                                                                                                         | Already In types?                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `types/pipeline-data.ts:7-94`        | `MetricDataPoint`, `PlatformSummary`, `CrossPlatformComparison`, `AnalysisResult`, `InsightItem`, `InsightsResult`, `StructuredPipelineResults` | YES — `packages/types/src/pipeline-data.ts`                              |
| `verdict-schema.ts`                  | Verdict Zod schema                                                                                                                              | YES — `packages/types/src/verdict.ts`                                    |
| `intelligence-pipeline.ts:40-82`     | `PipelineStageRecord`, `PipelineStatus`, `PipelineState`, `WorkflowProgressEvent`, `RunPipelineOptions`                                         | Partial — `PipelineStatus` in `packages/types/src/pipeline-execution.ts` |
| `agent-config.ts:6-183`              | `agentRuntimeModeSchema`, `agentRoleSchema`, `agentConfigSchema`, `AgentConfig`, `AgentRuntimeMode`, `AgentRole`, `AgentMemoryMode`             | Partial — `AgentRole` overlaps with types                                |
| `agent-protocol.ts:7-49`             | `agentMessageTypeSchema`, `agentExecutionContextSchema`, `agentMessageSchema`, `AgentMessageType`, `AgentMessage`, `CreateAgentMessageInput`    | Partial — could be shared                                                |
| `services/usage-tracker.ts:3-18`     | `UsageTrackOptions`, `UsageMetrics`                                                                                                             | Partial — overlaps with `packages/types/src/ai-usage.ts`                 |
| `services/budget-alerts.ts:19-45`    | `BudgetAlertConfig`, `AlertCheckResult`, `AlertNotification`                                                                                    | Partial — overlaps with `packages/types/src/budget-alerts.ts`            |
| `validation/data-quality.ts:11-60`   | `ValidationError`, `ValidationWarning`, `ValidationResult`, `ValidationConfig`, `DataQualityValidator`                                          | Partial — overlaps with `packages/types/src/validation.ts`               |
| `resilience/failoverHandler.ts:3-27` | `ProviderHealth`, `FailoverChainConfig`, `FailoverEvent`, `FailoverHandlerOptions`                                                              | Partial — `ProviderHealth` in `packages/types/src/ai-providers.ts`       |
| `utils/compliance.ts:4-27`           | `ComplianceConfig`, `AuditLogEntry`, `PIIPattern`                                                                                               | Partial — `AuditLogEntry` could be shared                                |
| `hooks/billing.ts:7-56`              | `ModelPricing`, `TenantBudget`, `CostCalculation`, `BillingHookConfig`                                                                          | Partial — overlaps with tenant types                                     |
| `core/failover.ts:68-76`             | `FailoverCircuitBreakerOptions`, `FailoverEvent`                                                                                                | Partial — overlaps with tenant types                                     |
| `prompts/types.ts:3-15`              | `promptTemplateTypeSchema`, `promptTemplateMetadataSchema`, `promptTemplateRecordSchema`                                                        | Partial — could be shared                                                |

#### E. packages/data-connectors/src/ — MEDIUM DUPLICATION

| File                            | Duplicate Schemas/Types                                                      | Already In types?                                                           |
| ------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `validation/types.ts:1-11`      | `ValidationSeverity`, `ValidationIssue`, `OutlierFlag`                       | YES — `packages/types/src/validation.ts`                                    |
| `date-range.ts:4`               | `DateRangeIso`                                                               | Partial — overlaps with `packages/types/src/common.ts` DateRange            |
| `rate-limit.ts:5-34`            | `ExponentialBackoffOptions`, `ExponentialBackoffTelemetry`                   | YES — `packages/types/src/resilience.ts`                                    |
| `circuit-breaker.ts:7-18`       | `CircuitState`, `CircuitBreakerOptions`, `CircuitBreakerObservabilityLabels` | Partial — overlaps with `packages/types/src/tenant.ts` CircuitBreakerConfig |
| `infrastructure-health.ts:8-20` | `InfrastructureHealthOptions`, `ComponentHealth`, `ConnectorHealthReport`    | No — new shared candidate                                                   |

#### F. packages/config/src/ — MEDIUM DUPLICATION

| File                               | Duplicate Schemas/Types                                                                                | Already In types?                                                     |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `schemas/tenant.ts:100`            | `TenantConfig`                                                                                         | Partial — overlaps with `packages/types/src/tenant.ts`                |
| `schemas/ai.ts:11`                 | `AiConfig`                                                                                             | Partial — overlaps with `packages/types/src/tenant.ts` TenantAIConfig |
| `schemas/provider-config.ts:22-98` | `ProviderType`, `ProviderCredential`, `ProviderConfig`, `TenantProviderConfig`, `AgencyProviderConfig` | Partial — overlaps with `packages/types/src/ai-providers.ts`          |
| `schemas/branding.ts:85`           | `DesignTokens`                                                                                         | Partial — overlaps with `packages/types/src/branding.ts`              |
| `schemas/template.ts`              | Template config schema                                                                                 | Partial — overlaps with `packages/types/src/templates.ts`             |

#### G. packages/report-generator/src/ — LOW DUPLICATION

| File            | Duplicate Schemas/Types                                                                                                                        | Already In types?                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `types.ts:2-35` | `ReportFormat`, `REPORT_FORMATS`, `ReportGenerationContext`, `FormatGeneratorInput`, `IFormatGenerator`, `IReportGenerator`, `ITemplateEngine` | Partial — `ReportFormat` could be shared |

---

## 2. Consumer Dependency Map

### Current Dependencies on @agenticverdict/types

```
@agenticverdict/types (Zod v3, no internal deps)
    ↑ consumed by:
    ├── apps/api (direct import)
    ├── apps/worker (direct import)
    ├── apps/frontend (direct import)
    │
    NOT consuming (but should):
    ├── packages/agent-runtime (has duplicate pipeline-data.ts, verdict-schema.ts)
    ├── packages/data-connectors (has duplicate validation/types.ts)
    ├── packages/config (has duplicate tenant/ai/provider schemas)
    ├── packages/report-generator (has duplicate ReportFormat)
    ├── packages/database (uses Drizzle types — correct separation)
    ├── packages/observability (minimal overlap)
    └── packages/testing (test-specific types)
```

### Cross-Package Type Dependencies

```
apps/api ──→ apps/worker (via BullMQ job types)
apps/api ──→ apps/frontend (via tRPC router contracts)
apps/worker ──→ apps/api (via service payloads)
packages/agent-runtime ──→ packages/types (missing — has duplicates)
packages/data-connectors ──→ packages/types (missing — has duplicates)
packages/config ──→ packages/types (missing — has duplicates)
packages/report-generator ──→ packages/types (missing — partial overlap)
```

---

## 3. Type Layering Strategy

Define clear boundaries for where types should live:

| Layer                      | Location                    | Purpose                                                    | Examples                                            |
| -------------------------- | --------------------------- | ---------------------------------------------------------- | --------------------------------------------------- |
| **API Contract Types**     | `packages/types/`           | Zod schemas + TS types for cross-package/app communication | CRUD schemas, DTOs, job payloads, event types       |
| **Database Types**         | `packages/database/schema/` | Drizzle ORM `$inferSelect`/`$inferInsert`                  | `ScheduleDb`, `AiProvider` (Drizzle)                |
| **App-Specific Types**     | `apps/*/src/`               | React props, hook returns, local validation with i18n      | `LoginFormProps`, `UseRolesResult`                  |
| **Package-Internal Types** | `packages/*/src/`           | Infrastructure contracts, platform-specific models         | `MetaCampaign`, `ObjectStorage`, `ConnectorAdapter` |
| **Configuration Types**    | `packages/config/src/`      | Environment and runtime configuration schemas              | `RuntimeConfig`, `ObservabilityEnv`                 |

---

## 4. Consolidation Plan

### Phase 0: Prerequisites (Blocking)

**Task 0.1: Resolve Zod Version Incompatibility**

The worker uses Zod v4 features (`.superRefine()`) while `packages/types` uses Zod v3.

**Options:**

- **Option A (Recommended):** Upgrade `packages/types` to Zod v4 — single version across monorepo
- **Option B:** Create `@agenticverdict/types-v4` package — temporary bridge
- **Option C:** Refactor worker schemas to Zod v3 compatible patterns

**Action:** Choose Option A. Update `packages/types/package.json`:

```json
{
  "dependencies": {
    "zod": "^4.0.0"
  }
}
```

Then run `pnpm install` and fix any breaking changes in existing types.

**Task 0.2: Add Missing Package Dependencies**

Add `@agenticverdict/types` as a dependency to packages that need it:

```bash
# In each package's package.json:
"dependencies": {
  "@agenticverdict/types": "workspace:*"
}
```

Packages to update:

- `packages/agent-runtime/package.json`
- `packages/data-connectors/package.json`
- `packages/config/package.json`
- `packages/report-generator/package.json`

---

### Phase 1: New Shared Type Files (Create First)

Create these new files in `packages/types/src/` before deleting anything:

| New File              | Contents                                                                                                                                                                                                                                                                                                                                         | Source Location(s)                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `queue-job-types.ts`  | `WorkflowTriggerJobConfig`, `WorkflowTriggerJobResult`, `WorkflowTriggerJobData`, `ReportGenerationJobData`, `ReportDeliveryJobData`, `ReportScheduleJobData`, `InsightExecutionJobData`, `InsightExecutionJobResult` + Zod schemas                                                                                                              | `apps/worker/src/queues/job-types.ts`                                                                                      |
| `delivery.ts`         | `DeliveryEvent`, `DeliveryMetricsSummary`, `DeliveryEventType`                                                                                                                                                                                                                                                                                   | `apps/api/src/services/delivery-analytics-store.ts`                                                                        |
| `audit.ts`            | `ReportAuditEvent`, `AuditTrailEvent`                                                                                                                                                                                                                                                                                                            | `apps/api/src/services/report-audit-store.ts`, `apps/frontend/src/features/insights/ui/audit-trail/AuditTrailTimeline.tsx` |
| `api-contracts.ts`    | API router output schemas: `providerOutputSchema`, `domainOutputSchema`, `alertOutputSchema`, `templateOutputSchema`, `scheduleOutputSchema`, `executionOutputSchema`, `reportOutputSchema`, `reportListOutputSchema`, `usageSummaryOutputSchema`, `failoverConfigOutputSchema`, `paginatedProvidersOutputSchema`, `domainHierarchyOutputSchema` | `apps/api/src/trpc/routers/*.ts`                                                                                           |
| `agent-protocol.ts`   | `agentMessageTypeSchema`, `agentExecutionContextSchema`, `agentMessageSchema`, `AgentMessageType`, `AgentMessage`, `CreateAgentMessageInput`                                                                                                                                                                                                     | `packages/agent-runtime/src/agent-protocol.ts`                                                                             |
| `connector-health.ts` | `InfrastructureHealthOptions`, `ComponentHealth`, `ConnectorHealthReport`                                                                                                                                                                                                                                                                        | `packages/data-connectors/src/infrastructure-health.ts`                                                                    |

**Actions:**

1. Create each file with the schemas/types from source locations
2. Add exports to `packages/types/src/index.ts`
3. Run `pnpm run typecheck` to verify no errors

---

### Phase 2: Update Existing Type Files (Enhance)

Update these existing files in `packages/types/src/` with missing types:

| File                    | Add From                                                                                                      | Types to Add                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `auth.ts`               | `apps/frontend/src/features/auth/model/validations/auth.ts`                                                   | Base schemas (without i18n keys) — keep frontend-specific validation separate                                        |
| `insight.ts`            | `apps/frontend/src/features/insights/ui/wizard/validation.ts`                                                 | `scheduleDeliverySchema` (rename to `insightDeliverySchema`), `aiSettingsSchema` (rename to `insightAiConfigSchema`) |
| `validation.ts`         | `packages/data-connectors/src/validation/types.ts`, `packages/agent-runtime/src/validation/data-quality.ts`   | `ValidationSeverity`, `ValidationError`, `ValidationWarning`, `ValidationConfig`                                     |
| `resilience.ts`         | `packages/data-connectors/src/rate-limit.ts`                                                                  | `ExponentialBackoffTelemetry`                                                                                        |
| `tenant.ts`             | `packages/data-connectors/src/circuit-breaker.ts`, `packages/agent-runtime/src/resilience/failoverHandler.ts` | `CircuitBreakerOptions`, `FailoverChainConfig`, `FailoverEvent`, `FailoverCircuitBreakerOptions`                     |
| `ai-providers.ts`       | `packages/agent-runtime/src/resilience/failoverHandler.ts`                                                    | `ProviderHealth` (ensure alignment)                                                                                  |
| `budget-alerts.ts`      | `packages/agent-runtime/src/services/budget-alerts.ts`                                                        | `BudgetAlertConfig`, `AlertCheckResult`, `AlertNotification`                                                         |
| `ai-usage.ts`           | `packages/agent-runtime/src/services/usage-tracker.ts`                                                        | `UsageTrackOptions`, `UsageMetrics`                                                                                  |
| `pipeline-execution.ts` | `packages/agent-runtime/src/intelligence-pipeline.ts`                                                         | `PipelineStatus`, `PipelineState`                                                                                    |
| `branding.ts`           | `packages/config/src/schemas/branding.ts`                                                                     | `DesignTokens` (merge with `BrandTokens`)                                                                            |
| `templates.ts`          | `packages/config/src/schemas/template.ts`                                                                     | Template config schema (align with `TemplateConfig`)                                                                 |
| `reports.ts`            | `packages/report-generator/src/types.ts`                                                                      | `ReportFormat`, `REPORT_FORMATS`                                                                                     |
| `common.ts`             | `packages/data-connectors/src/date-range.ts`                                                                  | `DateRangeIso` (or alias to `DateRange`)                                                                             |
| `schedule.ts`           | `apps/api/src/services/schedule-bullmq.ts`, `apps/worker/src/queues/schedule-tick-insight.ts`                 | `InsightScheduleTickJobData`                                                                                         |
| `business-domains.ts`   | `apps/api/src/trpc/routers/ai-domains.ts`                                                                     | Ensure all domain schemas are present                                                                                |
| `ai-templates.ts`       | `apps/api/src/trpc/routers/ai-templates.ts`                                                                   | Ensure all template schemas are present                                                                              |
| `ai-providers.ts`       | `apps/api/src/trpc/routers/ai-providers.ts`                                                                   | Ensure all provider schemas are present                                                                              |
| `budget-alerts.ts`      | `apps/api/src/trpc/routers/budget-alerts.ts`                                                                  | Ensure all alert schemas are present                                                                                 |
| `reports.ts`            | `apps/api/src/trpc/routers/reports.ts`                                                                        | Ensure all report schemas are present                                                                                |
| `ai-usage.ts`           | `apps/api/src/trpc/routers/ai-usage.ts`                                                                       | Ensure all usage schemas are present                                                                                 |
| `insight-templates.ts`  | `apps/api/src/services/insight-templates.service.ts`                                                          | `AppliedTemplateConfig` (ensure present)                                                                             |
| `rbac.ts`               | `apps/api/src/trpc/middleware/rbac-guard.ts`                                                                  | `RbacContext` (if shared)                                                                                            |

---

### Phase 3: Update Import Statements (Migration)

For each consumer, update imports to use `@agenticverdict/types` instead of local definitions.

#### 3.1 apps/api

| File                                    | Action                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `trpc/routers/insights.ts`              | Remove local schema definitions; import from `@agenticverdict/types`     |
| `trpc/routers/schedules.ts`             | Remove local schema definitions; import from `@agenticverdict/types`     |
| `trpc/routers/ai-providers.ts`          | Remove local schema definitions; import from `@agenticverdict/types`     |
| `trpc/routers/ai-templates.ts`          | Remove local schema definitions; import from `@agenticverdict/types`     |
| `trpc/routers/ai-domains.ts`            | Remove local schema definitions; import from `@agenticverdict/types`     |
| `trpc/routers/budget-alerts.ts`         | Remove local schema definitions; import from `@agenticverdict/types`     |
| `trpc/routers/reports.ts`               | Remove local schema definitions; import from `@agenticverdict/types`     |
| `trpc/routers/ai-usage.ts`              | Remove local schema definitions; import from `@agenticverdict/types`     |
| `middleware/auth.ts`                    | Remove `AuthPayload` definition; import from `@agenticverdict/types`     |
| `services/report-bullmq.ts`             | Update payload types to use `@agenticverdict/types`                      |
| `services/share-store.ts`               | Update `ShareGrant` to use `@agenticverdict/types`                       |
| `services/delivery-analytics-store.ts`  | Remove type definitions; import from `@agenticverdict/types`             |
| `services/report-audit-store.ts`        | Remove type definitions; import from `@agenticverdict/types`             |
| `services/schedule-bullmq.ts`           | Remove `InsightScheduleTickJobData`; import from `@agenticverdict/types` |
| `services/insight-templates.service.ts` | Remove `AppliedTemplateConfig`; import from `@agenticverdict/types`      |

#### 3.2 apps/worker

| File                              | Action                                                                   |
| --------------------------------- | ------------------------------------------------------------------------ |
| `queues/job-types.ts`             | Remove duplicated schemas/types; import from `@agenticverdict/types`     |
| `queues/schedule-tick-insight.ts` | Remove `InsightScheduleTickJobData`; import from `@agenticverdict/types` |

#### 3.3 apps/frontend

| File                                                      | Action                                                                                   |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `features/insights/ui/wizard/validation.ts`               | Remove `scheduleDeliverySchema`, `aiSettingsSchema`; import from `@agenticverdict/types` |
| `features/auth/model/validations/auth.ts`                 | Import base schemas from `@agenticverdict/types`; extend with i18n keys locally          |
| `features/schedules/services/schedule-service.ts`         | Update overlapping types to use `@agenticverdict/types`                                  |
| `features/insights/ui/audit-trail/AuditTrailTimeline.tsx` | Remove `AuditTrailEvent`; import from `@agenticverdict/types`                            |
| `routes/api.health.platforms.$platform.ts`                | Remove `platformSchema`; import from `@agenticverdict/types`                             |

#### 3.4 packages/agent-runtime

| File                            | Action                                                                  |
| ------------------------------- | ----------------------------------------------------------------------- |
| `types/pipeline-data.ts`        | **DELETE FILE** — import from `@agenticverdict/types`                   |
| `verdict-schema.ts`             | **DELETE FILE** — import from `@agenticverdict/types`                   |
| `intelligence-pipeline.ts`      | Update `PipelineStatus`, `PipelineState` to use `@agenticverdict/types` |
| `agent-config.ts`               | Update `AgentRole` to use `@agenticverdict/types`                       |
| `agent-protocol.ts`             | **DELETE FILE** — import from `@agenticverdict/types`                   |
| `services/usage-tracker.ts`     | Update usage types to use `@agenticverdict/types`                       |
| `services/budget-alerts.ts`     | Update budget alert types to use `@agenticverdict/types`                |
| `validation/data-quality.ts`    | Update validation types to use `@agenticverdict/types`                  |
| `resilience/failoverHandler.ts` | Update `ProviderHealth`, failover types to use `@agenticverdict/types`  |
| `utils/compliance.ts`           | Update `AuditLogEntry` to use `@agenticverdict/types`                   |
| `hooks/billing.ts`              | Update billing types to use `@agenticverdict/types`                     |
| `core/failover.ts`              | Update failover types to use `@agenticverdict/types`                    |
| `prompts/types.ts`              | Update prompt types to use `@agenticverdict/types`                      |

#### 3.5 packages/data-connectors

| File                       | Action                                                                        |
| -------------------------- | ----------------------------------------------------------------------------- |
| `validation/types.ts`      | **DELETE FILE** — import from `@agenticverdict/types`                         |
| `date-range.ts`            | Update `DateRangeIso` to use `@agenticverdict/types`                          |
| `rate-limit.ts`            | Update `ExponentialBackoffOptions` to use `@agenticverdict/types`             |
| `circuit-breaker.ts`       | Update `CircuitState`, `CircuitBreakerOptions` to use `@agenticverdict/types` |
| `infrastructure-health.ts` | Update health types to use `@agenticverdict/types`                            |

#### 3.6 packages/config

| File                         | Action                                                |
| ---------------------------- | ----------------------------------------------------- |
| `schemas/tenant.ts`          | Update `TenantConfig` to use `@agenticverdict/types`  |
| `schemas/ai.ts`              | Update `AiConfig` to use `@agenticverdict/types`      |
| `schemas/provider-config.ts` | Update provider types to use `@agenticverdict/types`  |
| `schemas/branding.ts`        | Update `DesignTokens` to use `@agenticverdict/types`  |
| `schemas/template.ts`        | Update template schema to use `@agenticverdict/types` |

#### 3.7 packages/report-generator

| File       | Action                                                                 |
| ---------- | ---------------------------------------------------------------------- |
| `types.ts` | Update `ReportFormat`, `REPORT_FORMATS` to use `@agenticverdict/types` |

---

### Phase 4: Delete Legacy Code (Destructive)

Since this is a greenfield pre-production environment with no backward compatibility requirements, delete all legacy code immediately after Phase 3 completes.

#### 4.1 Files to Delete Entirely

| File                                                | Reason                                              |
| --------------------------------------------------- | --------------------------------------------------- |
| `packages/agent-runtime/src/types/pipeline-data.ts` | Duplicated in `packages/types/src/pipeline-data.ts` |
| `packages/agent-runtime/src/verdict-schema.ts`      | Duplicated in `packages/types/src/verdict.ts`       |
| `packages/agent-runtime/src/agent-protocol.ts`      | Moved to `packages/types/src/agent-protocol.ts`     |
| `packages/data-connectors/src/validation/types.ts`  | Duplicated in `packages/types/src/validation.ts`    |

#### 4.2 Code Blocks to Delete (Within Files)

| File                                                                        | Lines/Block                                                  | What to Delete                                                |
| --------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| `apps/api/src/trpc/routers/insights.ts`                                     | Schema definitions (approx lines 37-256)                     | All local Zod schema definitions                              |
| `apps/api/src/trpc/routers/schedules.ts`                                    | Schema definitions (approx lines 11-26)                      | All local Zod schema definitions                              |
| `apps/api/src/trpc/routers/ai-providers.ts`                                 | Schema definitions (approx lines 25-106)                     | All local Zod schema definitions                              |
| `apps/api/src/trpc/routers/ai-templates.ts`                                 | Schema definitions (approx lines 23-44)                      | All local Zod schema definitions                              |
| `apps/api/src/trpc/routers/ai-domains.ts`                                   | Schema definitions (approx lines 25-83)                      | All local Zod schema definitions                              |
| `apps/api/src/trpc/routers/budget-alerts.ts`                                | Schema definitions (approx lines 14-35)                      | All local Zod schema definitions                              |
| `apps/api/src/trpc/routers/reports.ts`                                      | Schema definitions (approx lines 33-54)                      | All local Zod schema definitions                              |
| `apps/api/src/trpc/routers/ai-usage.ts`                                     | Schema definitions (approx lines 9-35)                       | All local Zod schema definitions                              |
| `apps/api/src/middleware/auth.ts`                                           | `AuthPayload` definition (approx lines 64-73)                | Duplicate type definition                                     |
| `apps/api/src/services/delivery-analytics-store.ts`                         | Type definitions (approx lines 13-49)                        | Moved to `packages/types/src/delivery.ts`                     |
| `apps/api/src/services/report-audit-store.ts`                               | Type definitions (approx line 14)                            | Moved to `packages/types/src/audit.ts`                        |
| `apps/api/src/services/schedule-bullmq.ts`                                  | `InsightScheduleTickJobData` (approx line 168)               | Moved to `packages/types/src/schedule.ts`                     |
| `apps/api/src/services/insight-templates.service.ts`                        | `AppliedTemplateConfig` (approx line 11)                     | Already in types package                                      |
| `apps/worker/src/queues/job-types.ts`                                       | Duplicated schemas/types (approx lines 41-380)               | Moved to `packages/types/src/queue-job-types.ts`              |
| `apps/worker/src/queues/schedule-tick-insight.ts`                           | `InsightScheduleTickJobData` (approx line 8)                 | Moved to `packages/types/src/schedule.ts`                     |
| `apps/frontend/src/features/insights/ui/wizard/validation.ts`               | `scheduleDeliverySchema`, `aiSettingsSchema`                 | Moved to `packages/types/src/insight.ts`                      |
| `apps/frontend/src/features/insights/ui/audit-trail/AuditTrailTimeline.tsx` | `AuditTrailEvent` (approx line 32)                           | Moved to `packages/types/src/audit.ts`                        |
| `apps/frontend/src/routes/api.health.platforms.$platform.ts`                | `platformSchema` (approx line 7)                             | Already in types package                                      |
| `packages/agent-runtime/src/intelligence-pipeline.ts`                       | `PipelineStatus`, `PipelineState` definitions                | Moved to `packages/types/src/pipeline-execution.ts`           |
| `packages/agent-runtime/src/services/usage-tracker.ts`                      | `UsageTrackOptions`, `UsageMetrics`                          | Moved to `packages/types/src/ai-usage.ts`                     |
| `packages/agent-runtime/src/services/budget-alerts.ts`                      | `BudgetAlertConfig`, `AlertCheckResult`, `AlertNotification` | Moved to `packages/types/src/budget-alerts.ts`                |
| `packages/agent-runtime/src/validation/data-quality.ts`                     | `ValidationError`, `ValidationWarning`, `ValidationResult`   | Moved to `packages/types/src/validation.ts`                   |
| `packages/agent-runtime/src/resilience/failoverHandler.ts`                  | `ProviderHealth`, `FailoverEvent`                            | Moved to `packages/types/src/ai-providers.ts` and `tenant.ts` |
| `packages/agent-runtime/src/utils/compliance.ts`                            | `AuditLogEntry`                                              | Moved to `packages/types/src/audit.ts`                        |
| `packages/agent-runtime/src/hooks/billing.ts`                               | `ModelPricing`, `TenantBudget`                               | Moved to `packages/types/src/tenant.ts`                       |
| `packages/agent-runtime/src/core/failover.ts`                               | `FailoverCircuitBreakerOptions`, `FailoverEvent`             | Moved to `packages/types/src/tenant.ts`                       |
| `packages/agent-runtime/src/prompts/types.ts`                               | Prompt template schemas                                      | Moved to `packages/types/src/agent-protocol.ts`               |
| `packages/data-connectors/src/date-range.ts`                                | `DateRangeIso`                                               | Moved to `packages/types/src/common.ts`                       |
| `packages/data-connectors/src/rate-limit.ts`                                | `ExponentialBackoffOptions`                                  | Moved to `packages/types/src/resilience.ts`                   |
| `packages/data-connectors/src/circuit-breaker.ts`                           | `CircuitState`, `CircuitBreakerOptions`                      | Moved to `packages/types/src/tenant.ts`                       |
| `packages/data-connectors/src/infrastructure-health.ts`                     | Health types                                                 | Moved to `packages/types/src/connector-health.ts`             |
| `packages/config/src/schemas/tenant.ts`                                     | `TenantConfig`                                               | Moved to `packages/types/src/tenant.ts`                       |
| `packages/config/src/schemas/ai.ts`                                         | `AiConfig`                                                   | Moved to `packages/types/src/tenant.ts`                       |
| `packages/config/src/schemas/provider-config.ts`                            | Provider types                                               | Moved to `packages/types/src/ai-providers.ts`                 |
| `packages/config/src/schemas/branding.ts`                                   | `DesignTokens`                                               | Moved to `packages/types/src/branding.ts`                     |
| `packages/config/src/schemas/template.ts`                                   | Template schema                                              | Moved to `packages/types/src/templates.ts`                    |
| `packages/report-generator/src/types.ts`                                    | `ReportFormat`, `REPORT_FORMATS`                             | Moved to `packages/types/src/reports.ts`                      |

#### 4.3 Cleanup Unused Imports

After deleting code blocks, run:

```bash
pnpm run lint --fix
```

This will remove unused imports automatically where possible. Manually review and remove any remaining unused imports.

---

### Phase 5: Update Barrel Exports

Update `packages/types/src/index.ts` to export all new files:

```typescript
// Add these exports to the barrel file:
export * from "./queue-job-types";
export * from "./delivery";
export * from "./audit";
export * from "./api-contracts";
export * from "./agent-protocol";
export * from "./connector-health";
```

---

### Phase 6: Verification

#### 6.1 Type Checking

```bash
pnpm run typecheck
```

Fix any type errors resulting from the migration.

#### 6.2 Linting

```bash
pnpm run lint
```

Fix any linting errors.

#### 6.3 Unit Tests

```bash
pnpm run test:unit
```

Ensure all tests pass after the migration.

#### 6.4 Build

```bash
pnpm run build
```

Ensure all packages build successfully.

#### 6.5 Integration Verification

```bash
make dev
make health
```

Verify the full stack starts and all services are healthy.

---

## 5. Deletion Strategy

### Principles

1. **Greenfield approach** — No backward compatibility, no deprecation warnings, no re-exports
2. **Atomic deletion** — Delete legacy code immediately after import migration in the same PR
3. **No dead code** — Run lint and typecheck after each deletion to catch orphaned references
4. **Verify before delete** — Ensure all consumers have been updated before deleting source

### Execution Order

1. **Phase 0** → Resolve Zod version, add dependencies (prerequisites)
2. **Phase 1** → Create new shared type files (safe, additive)
3. **Phase 2** → Update existing type files (safe, additive)
4. **Phase 3** → Update imports in consumers (safe, no deletion yet)
5. **Phase 4** → Delete legacy code (destructive, requires Phases 1-3 complete)
6. **Phase 5** → Update barrel exports (safe)
7. **Phase 6** → Verify everything works (validation)

### Rollback Plan

Since this is pre-production with no backward compatibility requirements, rollback is simple:

- Revert the git commit containing the migration
- All legacy code will be restored

---

## 6. Risk Assessment

| Risk                       | Likelihood | Impact | Mitigation                                           |
| -------------------------- | ---------- | ------ | ---------------------------------------------------- |
| Zod v4 breaking changes    | Medium     | High   | Test thoroughly in Phase 0; fix before proceeding    |
| Missed consumer references | Low        | Medium | Run typecheck after each phase; grep for old imports |
| Naming conflicts           | Low        | Low    | Use consistent naming; rename during migration       |
| Circular dependencies      | Low        | High   | Review package.json dependencies before adding       |
| Build failures             | Medium     | Medium | Run build after each phase; fix incrementally        |

---

## 7. Success Criteria

- [ ] All shared schemas and types exist only in `packages/types/src/`
- [ ] No duplicate schema/type definitions exist in apps or other packages
- [ ] All packages that need `@agenticverdict/types` have it as a dependency
- [ ] `pnpm run typecheck` passes with zero errors
- [ ] `pnpm run lint` passes with zero errors
- [ ] `pnpm run test:unit` passes with zero failures
- [ ] `pnpm run build` succeeds for all packages
- [ ] `make health` shows all services healthy
- [ ] No unused imports remain in migrated files
- [ ] Barrel export (`index.ts`) exports all shared types

---

## 8. Estimated Effort

| Phase                          | Estimated Time  | Complexity                            |
| ------------------------------ | --------------- | ------------------------------------- |
| Phase 0: Prerequisites         | 2-4 hours       | Medium (Zod upgrade)                  |
| Phase 1: New files             | 2-3 hours       | Low                                   |
| Phase 2: Update existing files | 3-4 hours       | Medium                                |
| Phase 3: Update imports        | 4-6 hours       | Medium-High                           |
| Phase 4: Delete legacy         | 2-3 hours       | Low (destructive but straightforward) |
| Phase 5: Barrel exports        | 30 minutes      | Low                                   |
| Phase 6: Verification          | 2-4 hours       | Medium (debugging issues)             |
| **Total**                      | **15-24 hours** |                                       |

---

## Appendix A: Types to Keep Local (Not for Consolidation)

These types should remain in their current locations as they are app/package-specific:

| Category                 | Examples                                                          | Location                    | Reason                      |
| ------------------------ | ----------------------------------------------------------------- | --------------------------- | --------------------------- |
| Drizzle DB types         | `GeneratedInsightDb`, `ScheduleDb`, `AiProvider` (Drizzle)        | `packages/database/schema/` | Database-layer specific     |
| React hooks/interfaces   | `UseRolesResult`, `UseInsightRunMutationReturn`, `LoginFormProps` | `apps/frontend/`            | Frontend component-specific |
| Platform-specific models | `MetaCampaign`, `Ga4RunReportResponse`, `GscSearchAnalyticsRow`   | `packages/data-connectors/` | Connector-internal          |
| Infrastructure contracts | `ReportBlobStorage`, `EmailDeliveryService`, `ObjectStorage`      | Various                     | Implementation-specific     |
| Runtime/context types    | `TenantContext`, `AgentExecutionContext`, `TrpcContext`           | Various                     | Runtime-specific            |
| Error classes            | `AppFault`, `AgentRuntimeError`, `PlatformError`                  | Various                     | Core error system           |
| Testing types            | `TestTenant`, `MockLlmLibraryEntry`                               | `packages/testing/`         | Test-only                   |
| Config schemas           | `RuntimeConfig`, `ObservabilityEnv`, `BuildConfig`                | `packages/config/`          | Configuration layer         |
| Agent runtime internals  | `AgentRunContext`, `ITool`, `IMemory`, `IAgent`                   | `packages/agent-runtime/`   | Runtime contracts           |
| Connector adapter types  | `ConnectorAdapter`, `AdapterFactory`, `ConnectorAdapterRegistry`  | `packages/data-connectors/` | Adapter contracts           |

---

## Appendix B: Quick Reference — Import Mapping

| Old Import                                                             | New Import                                                      |
| ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| `apps/api/src/trpc/routers/insights.ts` local schemas                  | `@agenticverdict/types` (insight.ts)                            |
| `apps/api/src/trpc/routers/schedules.ts` local schemas                 | `@agenticverdict/types` (schedule.ts, api-contracts.ts)         |
| `apps/api/src/trpc/routers/ai-providers.ts` local schemas              | `@agenticverdict/types` (ai-providers.ts, api-contracts.ts)     |
| `apps/api/src/trpc/routers/ai-templates.ts` local schemas              | `@agenticverdict/types` (ai-templates.ts, api-contracts.ts)     |
| `apps/api/src/trpc/routers/ai-domains.ts` local schemas                | `@agenticverdict/types` (business-domains.ts, api-contracts.ts) |
| `apps/api/src/trpc/routers/budget-alerts.ts` local schemas             | `@agenticverdict/types` (budget-alerts.ts, api-contracts.ts)    |
| `apps/api/src/trpc/routers/reports.ts` local schemas                   | `@agenticverdict/types` (reports.ts, api-contracts.ts)          |
| `apps/api/src/trpc/routers/ai-usage.ts` local schemas                  | `@agenticverdict/types` (ai-usage.ts, api-contracts.ts)         |
| `apps/api/src/middleware/auth.ts` AuthPayload                          | `@agenticverdict/types` (auth.ts)                               |
| `apps/worker/src/queues/job-types.ts` job types                        | `@agenticverdict/types` (queue-job-types.ts)                    |
| `packages/agent-runtime/src/types/pipeline-data.ts`                    | `@agenticverdict/types` (pipeline-data.ts)                      |
| `packages/agent-runtime/src/verdict-schema.ts`                         | `@agenticverdict/types` (verdict.ts)                            |
| `packages/agent-runtime/src/agent-protocol.ts`                         | `@agenticverdict/types` (agent-protocol.ts)                     |
| `packages/data-connectors/src/validation/types.ts`                     | `@agenticverdict/types` (validation.ts)                         |
| `packages/data-connectors/src/rate-limit.ts` ExponentialBackoffOptions | `@agenticverdict/types` (resilience.ts)                         |
| `packages/data-connectors/src/circuit-breaker.ts` CircuitState         | `@agenticverdict/types` (tenant.ts)                             |
| `packages/config/src/schemas/tenant.ts` TenantConfig                   | `@agenticverdict/types` (tenant.ts)                             |
| `packages/config/src/schemas/ai.ts` AiConfig                           | `@agenticverdict/types` (tenant.ts)                             |
| `packages/config/src/schemas/provider-config.ts` provider types        | `@agenticverdict/types` (ai-providers.ts)                       |
| `packages/config/src/schemas/branding.ts` DesignTokens                 | `@agenticverdict/types` (branding.ts)                           |
| `packages/report-generator/src/types.ts` ReportFormat                  | `@agenticverdict/types` (reports.ts)                            |
