# Audit Report: Monorepo-Wide Type & Enum Duplication

**Date:** 2026-05-12
**Scope:** All type definitions, enum constants, zod schemas, and string literal unions across the AgenticVerdict monorepo.
**Constraint:** No source files were modified during this audit.
**Builds on:** `docs/audit-report-format-types.md` (report format-specific audit)

---

## 1. Executive Summary

The monorepo contains **27 distinct duplication clusters** spanning **120+ files** across 4 packages and 3 apps. Duplication manifests in three patterns:

| Pattern                                                                     | Count | Severity | Example                                                                        |
| --------------------------------------------------------------------------- | ----- | -------- | ------------------------------------------------------------------------------ |
| **Exact duplicate** — identical values in separate files                    | 12    | CRITICAL | `REPORT_FORMATS` in `types/src/reports.ts` and `report-generator/src/types.ts` |
| **Semantic overlap** — same concept, different names/values                 | 9     | HIGH     | `excel` vs `xlsx`, `ConnectorType` vs `dataSourcePlatformSchema`               |
| **Inline repetition** — hardcoded literals instead of referencing constants | 99+   | MEDIUM   | `["pdf", "excel", "both"]` repeated 8+ times                                   |

The existing `docs/schema-type-consolidation-plan.md` covers schema-level consolidation but misses **enum constant duplication**, **inline literal repetition**, and **cross-package type divergence**. This audit fills those gaps.

---

## 2. Complete Duplication Inventory

### Cluster 1: Report Generation Formats (`REPORT_FORMATS`) — CRITICAL

| Location                                   | Definition                                   | Values                                    | Notes               |
| ------------------------------------------ | -------------------------------------------- | ----------------------------------------- | ------------------- |
| `packages/types/src/reports.ts:110`        | `export const REPORT_FORMATS`                | `["pdf", "docx", "xlsx", "html", "json"]` | Canonical           |
| `packages/report-generator/src/types.ts:1` | `export const REPORT_FORMATS`                | `["pdf", "docx", "xlsx", "html", "json"]` | **Exact duplicate** |
| `packages/types/src/queue-job-types.ts:2`  | `import { REPORT_FORMATS } from "./reports"` | Re-exported                               | Correct             |

**Risk:** Changes to one copy will not propagate to the other. The `report-generator` package does not depend on `@agenticverdict/types`.

### Cluster 2: Connector Platform Types — HIGH

| Location                                                   | Definition                 | Values                                             | Notes                      |
| ---------------------------------------------------------- | -------------------------- | -------------------------------------------------- | -------------------------- |
| `packages/types/src/connector-types.ts:11`                 | `type ConnectorType`       | `"meta" \| "ga4" \| "gsc" \| "gbp" \| "tiktok"`    | Canonical type             |
| `packages/types/src/connector-types.ts:13`                 | `connectorTypeSchema`      | `z.enum(["meta", "ga4", "gsc", "gbp", "tiktok"])`  | Canonical zod              |
| `packages/types/src/verdict.ts:94`                         | `dataSourcePlatformSchema` | `z.enum(["meta", "ga4", "gsc", "gbp", "tiktok"])`  | **Exact duplicate schema** |
| `packages/data-connectors/src/adapter-factory.ts:14`       | `connectorAdapterTypes`    | `["meta", "ga4", "gsc", "gbp", "tiktok"] as const` | **Exact duplicate const**  |
| `packages/types/src/queue-job-types.ts:69`                 | inline in schema           | `z.enum(["meta", "ga4", "gsc", "gbp", "tiktok"])`  | **Inline duplicate**       |
| `packages/types/src/analysis.ts:17`                        | inline in schema           | `z.enum(["meta", "ga4", "gsc", "gbp", "tiktok"])`  | **Inline duplicate**       |
| `packages/types/src/ai-providers.ts:157`                   | inline type                | `"meta" \| "ga4" \| "gsc" \| "gbp" \| "tiktok"`    | **Inline duplicate**       |
| `packages/agent-runtime/src/provenance/tracker.ts:63`      | inline type                | `"meta" \| "ga4" \| "gsc" \| "gbp" \| "tiktok"`    | **Inline duplicate**       |
| `packages/data-connectors/src/infrastructure-health.ts:92` | inline array               | `["meta", "ga4", "gsc", "gbp", "tiktok"]`          | **Inline duplicate**       |
| `packages/data-connectors/src/adapter-metrics.ts:122`      | inline array               | `["meta", "ga4", "gsc", "gbp", "tiktok"]`          | **Inline duplicate**       |
| `apps/api/src/services/analysis-store.ts:213,233`          | inline array               | `["meta", "ga4", "gsc", "gbp", "tiktok"]`          | **Inline duplicate**       |

**8 separate definitions** of the same 5-platform enum.

### Cluster 3: Insight Type — HIGH

| Location                                                  | Definition              | Values                                                             | Notes                   |
| --------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------ | ----------------------- |
| `packages/types/src/insight.ts:3`                         | `insightTypeSchema`     | `z.enum(["opportunity", "risk", "observation", "recommendation"])` | Canonical               |
| `packages/types/src/queue-job-types.ts:125,178,340,363`   | inline type + schema    | `"opportunity" \| "risk" \| "observation" \| "recommendation"`     | **4 inline duplicates** |
| `packages/types/src/pipeline-data.ts:64`                  | inline type             | `"opportunity" \| "risk" \| "observation" \| "recommendation"`     | **Inline duplicate**    |
| `apps/worker/src/queues/report-queues.ts:180-181,858-859` | inline type + Record    | `"opportunity" \| "risk" \| "observation" \| "recommendation"`     | **2 inline duplicates** |
| `apps/api/src/routes/v1/insights.ts:17,61`                | inline schema + OpenAPI | `z.enum([...])`, `enum: [...]`                                     | **2 inline duplicates** |

### Cluster 4: Pipeline Status — HIGH

| Location                                                | Definition           | Values                                     | Notes                   |
| ------------------------------------------------------- | -------------------- | ------------------------------------------ | ----------------------- |
| `packages/types/src/pipeline-execution.ts:42`           | `PipelineStatus`     | `"completed" \| "failed" \| "degraded"`    | Canonical               |
| `packages/types/src/queue-job-types.ts:134,190,334,355` | inline type + schema | `"completed" \| "failed" \| "degraded"`    | **4 inline duplicates** |
| `apps/worker/src/queues/report-queues.ts:1069`          | inline cast          | `as "completed" \| "failed" \| "degraded"` | **Inline duplicate**    |

### Cluster 5: Detail Level — MEDIUM

| Location                                                                     | Definition                 | Values                                               | Notes                   |
| ---------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------- | ----------------------- |
| `packages/types/src/insight.ts:77`                                           | in `insightAiConfigSchema` | `z.enum(["executive", "standard", "comprehensive"])` | Canonical               |
| `apps/api/src/trpc/routers/insights.integration.test.ts:21`                  | inline schema              | `z.enum(["executive", "standard", "comprehensive"])` | **Inline duplicate**    |
| `apps/api/src/trpc/routers/insights.provider-validation.test.ts:147,164,180` | inline schema              | `z.enum(["executive", "standard", "comprehensive"])` | **3 inline duplicates** |

### Cluster 6: Schedule Frequency — HIGH

| Location                                                                    | Definition              | Values                                                 | Notes                                      |
| --------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------ | ------------------------------------------ |
| `packages/types/src/insight-templates.ts:23,66`                             | in template schemas     | `z.enum(["daily", "weekly", "monthly", "quarterly"])`  | Canonical (2 copies within same file)      |
| `packages/types/src/connector-types.ts:237`                                 | `syncFrequencySchema`   | `z.enum(["hourly", "daily", "weekly", "monthly"])`     | **Divergent** — includes `"hourly"`        |
| `packages/types/src/budget-alerts.ts:5`                                     | `alertTimeWindowSchema` | `z.enum(["hourly", "daily", "weekly", "monthly"])`     | **Divergent** — includes `"hourly"`        |
| `packages/types/src/ai-usage.ts:114`                                        | in usage schema         | `z.enum(["hourly", "daily", "weekly", "monthly"])`     | **Divergent** — includes `"hourly"`        |
| `apps/api/src/services/insight-templates.service.ts:109`                    | local const             | `["daily", "weekly", "monthly", "quarterly"] as const` | **Inline duplicate**                       |
| `apps/api/src/trpc/routers/insight-templates.ts:85,128`                     | inline type             | `"daily" \| "weekly" \| "monthly" \| "quarterly"`      | **2 inline duplicates**                    |
| `apps/api/src/services/schedule-bullmq.ts:105`                              | inline type             | `"daily" \| "weekly" \| "monthly" \| "quarterly"`      | **Inline duplicate**                       |
| `apps/frontend/src/features/insights/tests/wizard-validation.test.ts:256`   | local const             | `["daily", "weekly", "monthly", "quarterly"] as const` | **Inline duplicate**                       |
| `apps/frontend/src/features/connectors/pages/ConnectorAddPage.tsx:73`       | local const             | `["hourly", "daily", "weekly"] as const`               | **Divergent** — subset                     |
| `apps/frontend/src/features/connectors/pages/ConnectorConfigurePage.tsx:39` | local const             | `["hourly", "daily", "weekly"] as const`               | **Divergent** — subset, duplicate of above |

**Note:** Two distinct frequency concepts conflated:

- **Insight schedule frequency**: `["daily", "weekly", "monthly", "quarterly"]` (no hourly)
- **Connector sync frequency**: `["hourly", "daily", "weekly", "monthly"]` (no quarterly)
- These should be separate named types, not the same inline enum.

### Cluster 7: AI Provider Types — MEDIUM

| Location                                                | Definition             | Values                                                                    | Notes                        |
| ------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------- | ---------------------------- |
| `packages/types/src/ai-providers.ts:13`                 | `aiProviderTypeSchema` | `z.enum(["anthropic", "openai"])`                                         | Canonical                    |
| `packages/types/src/tenant.ts:115`                      | in TenantAIConfig      | `z.enum(["anthropic", "openai"])`                                         | **Inline duplicate**         |
| `packages/agent-runtime/src/langsmith-tracing.ts:30`    | inline type            | `"anthropic" \| "openai"`                                                 | **Inline duplicate**         |
| `packages/agent-runtime/src/core/ProviderFactory.ts:35` | inline type            | `"openai" \| "anthropic" \| "google" \| "bedrock" \| "openai-compatible"` | **Divergent** — extended set |

### Cluster 8: Cost Tier — MEDIUM

| Location                                                               | Definition                 | Values                                       | Notes                        |
| ---------------------------------------------------------------------- | -------------------------- | -------------------------------------------- | ---------------------------- |
| `packages/types/src/ai-providers.ts:3`                                 | `costTierSchema`           | `z.enum(["premium", "standard", "economy"])` | Canonical                    |
| `packages/types/src/ai-providers.ts:363`                               | in schema                  | `z.enum(["premium", "standard", "economy"])` | Same file, repeated          |
| `packages/types/src/business-domains.ts:12,86`                         | in schemas                 | `z.enum(["premium", "standard", "economy"])` | **2 inline duplicates**      |
| `apps/api/src/trpc/routers/ai-providers.ts:69`                         | inline schema              | `z.enum(["premium", "standard", "economy"])` | **Inline duplicate**         |
| `apps/api/src/trpc/routers/ai-domains.ts:157,550`                      | inline cast                | `as "premium" \| "standard" \| "economy"`    | **2 inline duplicates**      |
| `apps/api/src/services/ai-domains.service.ts:294`                      | inline type                | `"premium" \| "standard" \| "economy"`       | **Inline duplicate**         |
| `packages/database/src/schema/ai-providers.ts:26`                      | `pgEnum("cost_tier", ...)` | `["premium", "standard", "economy"]`         | DB enum (correctly separate) |
| `packages/database/src/seeds/ai-providers-seed.ts:30`                  | inline type                | `"premium" \| "standard" \| "economy"`       | **Inline duplicate**         |
| `packages/agent-runtime/src/core/config-hierarchy-resolver.test.ts:19` | inline type                | `"premium" \| "standard" \| "economy"`       | **Inline duplicate**         |

### Cluster 9: Config Scope (`tenant | domain | connector`) — HIGH

| Location                                                               | Definition                      | Values                                      | Notes                                    |
| ---------------------------------------------------------------------- | ------------------------------- | ------------------------------------------- | ---------------------------------------- |
| `packages/types/src/ai-providers.ts:254`                               | `configScopeSchema`             | `z.enum(["tenant", "domain", "connector"])` | Canonical                                |
| `packages/types/src/ai-providers.ts:53,70,98,116,171,180,303,370`      | inline type/schema              | `"tenant" \| "domain" \| "connector"`       | **8 inline duplicates within same file** |
| `packages/types/src/ai-templates.ts:44`                                | in schema                       | `z.enum(["tenant", "domain", "connector"])` | **Inline duplicate**                     |
| `packages/agent-runtime/src/core/config-hierarchy-resolver.ts:31,150`  | inline type                     | `"tenant" \| "domain" \| "connector"`       | **2 inline duplicates**                  |
| `apps/api/src/trpc/routers/ai-providers.ts:21,76`                      | inline schema                   | `z.enum(["tenant", "domain", "connector"])` | **2 inline duplicates**                  |
| `apps/api/src/services/ai-provider.service.ts:354`                     | inline type                     | `"tenant" \| "domain" \| "connector"`       | **Inline duplicate**                     |
| `packages/database/src/schema/ai-providers.ts:24`                      | `pgEnum("provider_scope", ...)` | `["tenant", "domain", "connector"]`         | DB enum (correctly separate)             |
| `packages/database/src/seeds/ai-providers-seed.ts:31`                  | inline type                     | `"tenant" \| "domain" \| "connector"`       | **Inline duplicate**                     |
| `packages/database/src/repositories/ai-provider.repository.ts:73`      | inline type                     | `"tenant" \| "domain" \| "connector"`       | **Inline duplicate**                     |
| `packages/agent-runtime/src/core/config-hierarchy-resolver.test.ts:21` | inline type                     | `"tenant" \| "domain" \| "connector"`       | **Inline duplicate**                     |
| `apps/frontend/src/components/InheritanceIndicator.tsx:9`              | inline type                     | `"tenant" \| "domain" \| "connector"`       | **Inline duplicate**                     |

**16+ definitions** of the same 3-value enum.

### Cluster 10: TextDirection (`ltr | rtl`) — MEDIUM

| Location                                                              | Definition            | Values                                           | Notes                    |
| --------------------------------------------------------------------- | --------------------- | ------------------------------------------------ | ------------------------ |
| `packages/i18n/src/document-direction.ts:3`                           | `ReportTextDirection` | `"ltr" \| "rtl"`                                 | Canonical (i18n package) |
| `apps/frontend/src/i18n/locales.ts:11`                                | `TextDirection`       | `"ltr" \| "rtl"`                                 | **Duplicate type name**  |
| `packages/ui/src/providers/DirectionProvider.tsx:13`                  | `TextDirection`       | `"ltr" \| "rtl"`                                 | **Duplicate type name**  |
| `packages/types/src/queue-job-types.ts:165,215,243,278,311,328`       | inline type/schema    | `"ltr" \| "rtl"`                                 | **6 inline duplicates**  |
| `apps/api/src/services/report-bullmq.ts:74`                           | inline type           | `"ltr" \| "rtl"`                                 | **Inline duplicate**     |
| `apps/worker/src/queues/workflow-trigger-production-flow.ts:35,45,58` | inline type           | `"ltr" \| "rtl"`                                 | **3 inline duplicates**  |
| `apps/api/src/routes/v1/report-templates.ts:32,105`                   | inline schema/OpenAPI | `z.enum(["ltr", "rtl"])`, `enum: ["ltr", "rtl"]` | **2 inline duplicates**  |
| `packages/report-generator/src/templates/document-shell.ts:19`        | inline type           | `"ltr" \| "rtl"`                                 | **Inline duplicate**     |
| `packages/report-generator/src/context-direction.ts:5`                | inline return type    | `"ltr" \| "rtl"`                                 | **Inline duplicate**     |
| `packages/ui/tests/utils/test-utils.tsx:19,43`                        | inline type           | `"ltr" \| "rtl"`                                 | **2 inline duplicates**  |
| `packages/ui/tests/utils/a11y-test-utils.ts:15,39`                    | inline type           | `"ltr" \| "rtl"`                                 | **2 inline duplicates**  |
| `packages/ui/src/providers/MantineProvider.tsx:34`                    | inline param type     | `"ltr" \| "rtl"`                                 | **Inline duplicate**     |
| `packages/i18n/src/i18n-manager.ts:25`                                | inline return type    | `"rtl" \| "ltr"`                                 | **Inline duplicate**     |
| `packages/i18n/src/rtl.ts:24`                                         | inline return type    | `"rtl" \| "ltr"`                                 | **Inline duplicate**     |

**3 named types** for the same concept, plus **18+ inline repetitions**.

### Cluster 11: TenantType — MEDIUM

| Location                                               | Definition         | Values                                                            | Notes                |
| ------------------------------------------------------ | ------------------ | ----------------------------------------------------------------- | -------------------- |
| `packages/types/src/tenant.ts:4`                       | `tenantTypeSchema` | `z.enum(["direct_business", "agency_partner", "agency_managed"])` | Canonical            |
| `packages/types/src/auth.ts:134`                       | in schema          | `z.enum(["direct_business", "agency_partner", "agency_managed"])` | **Inline duplicate** |
| `packages/database/src/seeds/users-seed.ts:14`         | `type TenantType`  | `"direct_business" \| "agency_partner" \| "agency_managed"`       | **Duplicate type**   |
| `packages/database/src/seeds/tenant-config-seed.ts:15` | inline type        | `"direct_business" \| "agency_partner" \| "agency_managed"`       | **Inline duplicate** |
| `packages/database/scripts/seed-dev.ts:246`            | inline cast        | `as "direct_business" \| "agency_partner" \| "agency_managed"`    | **Inline duplicate** |
| `packages/core/src/tenant-resolution.ts:90`            | inline array       | `["direct_business", "agency_partner", "agency_managed"]`         | **Inline duplicate** |

### Cluster 12: Insight Status — MEDIUM

| Location                                               | Definition            | Values                                                         | Notes                                    |
| ------------------------------------------------------ | --------------------- | -------------------------------------------------------------- | ---------------------------------------- |
| `packages/types/src/insight.ts:82`                     | `insightStatusSchema` | `z.enum(["idle", "running", "completed", "failed"])`           | Canonical                                |
| `apps/api/src/trpc/routers/insights.ts:513`            | local const           | `["idle", "running", "completed", "failed"] as const`          | **Inline duplicate**                     |
| `apps/api/src/trpc/routers/insights.ts:622,749,879`    | inline cast           | `as "idle" \| "running" \| "completed" \| "failed"`            | **3 inline duplicates**                  |
| `packages/types/src/pipeline-execution.ts:37`          | in type               | `"idle" \| "running" \| "completed" \| "failed" \| "degraded"` | **Extended variant** (adds `"degraded"`) |
| `packages/database/src/factories/insight-factory.ts:9` | inline type           | `"idle" \| "running" \| "completed" \| "failed"`               | **Inline duplicate**                     |

### Cluster 13: Run Status (`success | failed`) — MEDIUM

| Location                                                        | Definition                 | Values                                     | Notes                                   |
| --------------------------------------------------------------- | -------------------------- | ------------------------------------------ | --------------------------------------- |
| `packages/types/src/insight.ts:83`                              | `insightDbRunStatusSchema` | `z.enum(["success", "failed"]).nullable()` | Canonical                               |
| `apps/api/src/trpc/routers/insights.ts:515`                     | local const                | `["success", "failed"] as const`           | **Inline duplicate**                    |
| `apps/api/src/trpc/routers/insights.ts:624,751,881`             | inline cast                | `as "success" \| "failed" \| null`         | **3 inline duplicates**                 |
| `packages/database/src/factories/insight-factory.ts:11`         | inline type                | `"success" \| "failed" \| null`            | **Inline duplicate**                    |
| `packages/types/src/audit.ts:55,65`                             | type + schema              | `"success" \| "failed" \| "pending"`       | **Extended variant** (adds `"pending"`) |
| `packages/database/src/seeds/connector-sync-insight-seed.ts:22` | inline type                | `"success" \| "failed" \| "partial"`       | **Divergent** (adds `"partial"`)        |
| `packages/observability/src/insights-metrics.ts:28,37`          | inline type                | `"success" \| "failed" \| "skipped"`       | **Divergent** (adds `"skipped"`)        |

### Cluster 14: AI Provider Status (`active | inactive | error`) — MEDIUM

| Location                                                               | Definition                       | Values                                    | Notes                        |
| ---------------------------------------------------------------------- | -------------------------------- | ----------------------------------------- | ---------------------------- |
| `packages/types/src/ai-providers.ts:373`                               | in schema                        | `z.enum(["active", "inactive", "error"])` | Canonical                    |
| `packages/types/src/ai-providers.ts:96`                                | inline type                      | `"active" \| "inactive" \| "error"`       | Same file                    |
| `apps/api/src/trpc/routers/ai-providers.ts:79`                         | inline schema                    | `z.enum(["active", "inactive", "error"])` | **Inline duplicate**         |
| `apps/api/src/services/ai-provider.service.ts:244`                     | inline type                      | `"active" \| "inactive" \| "error"`       | **Inline duplicate**         |
| `packages/database/src/schema/ai-providers.ts:25`                      | `pgEnum("provider_status", ...)` | `["active", "inactive", "error"]`         | DB enum (correctly separate) |
| `packages/database/src/factories/connector-factory.ts:11`              | inline type                      | `"active" \| "inactive" \| "error"`       | **Inline duplicate**         |
| `packages/database/src/repositories/ai-provider.repository.ts:144`     | inline type                      | `"active" \| "inactive" \| "error"`       | **Inline duplicate**         |
| `packages/database/src/seeds/ai-providers-seed.ts`                     | inline type                      | `"active" \| "inactive" \| "error"`       | **Inline duplicate**         |
| `packages/agent-runtime/src/core/config-hierarchy-resolver.test.ts:24` | inline type                      | `"active" \| "inactive" \| "error"`       | **Inline duplicate**         |

### Cluster 15: Sort Direction (`asc | desc`) — LOW

| Location                                                                | Definition              | Values                                    | Notes                   |
| ----------------------------------------------------------------------- | ----------------------- | ----------------------------------------- | ----------------------- |
| `packages/types/src/common.ts:44`                                       | in pagination schema    | `z.enum(["asc", "desc"]).default("asc")`  | Canonical               |
| `packages/types/src/insight.ts:118`                                     | in insight list schema  | `z.enum(["asc", "desc"]).default("desc")` | **Divergent default**   |
| `packages/types/src/ai-providers.ts:298`                                | in provider list schema | `z.enum(["asc", "desc"]).default("asc")`  | Same as common          |
| `apps/frontend/src/features/insights/pages/InsightListPage.tsx:100,215` | inline type             | `"asc" \| "desc"`                         | **2 inline duplicates** |
| `apps/frontend/src/features/insights/api/insight-api.ts:30`             | inline type             | `"asc" \| "desc"`                         | **Inline duplicate**    |
| `apps/frontend/src/features/reports/pages/ReportListPage.tsx:258,305`   | inline type             | `"asc" \| "desc"`                         | **2 inline duplicates** |
| `apps/frontend/src/components/UsageTable.tsx:53,93`                     | inline type             | `"asc" \| "desc"`                         | **2 inline duplicates** |
| `apps/api/src/trpc/routers/insights.integration.test.ts:143`            | inline schema           | `z.enum(["asc", "desc"])`                 | **Inline duplicate**    |

### Cluster 16: Workflow ID / Phase — MEDIUM

| Location                                        | Definition                  | Values                                                                                    | Notes                   |
| ----------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------- | ----------------------- |
| `packages/types/src/queue-job-types.ts:7-10`    | `WorkflowTriggerWorkflowId` | `"report-generation" \| "marketing-analysis" \| "verdict-generation"`                     | Canonical               |
| `packages/types/src/queue-job-types.ts:153,230` | inline schema               | `z.enum(["report-generation", "marketing-analysis", "verdict-generation"])`               | Same file               |
| `packages/types/src/queue-job-types.ts:36-40`   | `WorkflowTriggerPhase`      | `"foundation" \| "report-generation" \| "marketing-analysis" \| "verdict-generation"`     | Canonical (extended)    |
| `packages/types/src/queue-job-types.ts:156`     | inline schema               | `z.enum(["foundation", "report-generation", "marketing-analysis", "verdict-generation"])` | Same file               |
| `apps/api/src/routes/v1/workflows.ts:39,45,164` | OpenAPI inline              | `enum: ["report-generation", ...]`                                                        | **3 inline duplicates** |

### Cluster 17: Mock Data Scenario — LOW

| Location                                      | Definition           | Values                                                       | Notes              |
| --------------------------------------------- | -------------------- | ------------------------------------------------------------ | ------------------ |
| `packages/types/src/queue-job-types.ts:51,95` | inline type + schema | `"normal" \| "high-volume" \| "zero-conversions" \| "error"` | Canonical          |
| `tests/orchestrator/index.ts:43`              | `MockDataScenario`   | `"normal" \| "high-volume" \| "zero-conversions" \| "error"` | **Duplicate type** |

### Cluster 18: ScenarioCategory — LOW

| Location                           | Definition         | Values                                                                    | Notes               |
| ---------------------------------- | ------------------ | ------------------------------------------------------------------------- | ------------------- |
| `tests/orchestrator/index.ts:41`   | `ScenarioCategory` | `"generation" \| "integration" \| "delivery" \| "scheduling" \| "system"` | Duplicate A         |
| `tests/utils/scenario-runner.ts:6` | `ScenarioCategory` | `"generation" \| "integration" \| "delivery" \| "scheduling" \| "system"` | **Exact duplicate** |

### Cluster 19: Agent Role — MEDIUM

| Location                                             | Definition          | Values                                        | Notes                            |
| ---------------------------------------------------- | ------------------- | --------------------------------------------- | -------------------------------- |
| `packages/agent-runtime/src/agent-config.ts:11`      | `agentRoleSchema`   | `z.enum(["verdict", "insights", "analysis"])` | Canonical in agent-runtime       |
| `packages/agent-runtime/src/agent-kinds.ts:9`        | `PipelineAgentKind` | `"analysis" \| "insights" \| "verdict"`       | **Same values, different order** |
| `packages/agent-runtime/src/langsmith-tracing.ts:29` | inline type         | `"verdict" \| "insights" \| "analysis"`       | **Inline duplicate**             |

### Cluster 20: Depth (`quick | standard | deep`) — LOW

| Location                                              | Definition    | Values                                  | Notes                                |
| ----------------------------------------------------- | ------------- | --------------------------------------- | ------------------------------------ |
| `packages/types/src/queue-job-types.ts:57`            | `depthSchema` | `z.enum(["quick", "standard", "deep"])` | Canonical                            |
| `packages/types/src/queue-job-types.ts:45,46,136,137` | inline type   | `"quick" \| "standard" \| "deep"`       | **4 inline duplicates in same file** |

### Cluster 21: Email Providers — LOW

| Location                            | Definition                  | Values                                       | Notes                |
| ----------------------------------- | --------------------------- | -------------------------------------------- | -------------------- |
| `packages/types/src/reports.ts:187` | `REPORT_DELIVERY_PROVIDERS` | `["resend", "sendgrid", "unknown"] as const` | Canonical            |
| `packages/types/src/reports.ts:133` | in schema                   | `z.enum(["resend", "sendgrid", "unknown"])`  | Same file            |
| `packages/types/src/webhook.ts:53`  | in schema                   | `z.enum(["resend", "sendgrid", "unknown"])`  | **Inline duplicate** |

### Cluster 22: Delivery Events — LOW

| Location                            | Definition               | Values                                                     | Notes     |
| ----------------------------------- | ------------------------ | ---------------------------------------------------------- | --------- |
| `packages/types/src/reports.ts:184` | `REPORT_DELIVERY_EVENTS` | `["delivered", "failed", "bounced", "complaint"] as const` | Canonical |
| `packages/types/src/reports.ts:134` | in schema                | `z.enum(["delivered", "failed", "bounced", "complaint"])`  | Same file |

### Cluster 23: Report Roles — MEDIUM

| Location                                                     | Definition           | Values                                                                                | Notes                                                          |
| ------------------------------------------------------------ | -------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `packages/types/src/reports.ts:197`                          | `REPORT_READ_ROLES`  | `["analyst", "reports:read", "admin"] as const`                                       | Canonical                                                      |
| `packages/types/src/reports.ts:200`                          | `REPORT_WRITE_ROLES` | `["reports:write", "admin"] as const`                                                 | Canonical                                                      |
| `packages/types/src/reports.ts:203`                          | `REPORT_SHARE_ROLES` | `["admin", "reports:share", "reports:write"] as const`                                | Canonical                                                      |
| `apps/api/src/routes/v1/report-templates.ts:26-27`           | local consts         | `readRoles`, `writeRoles`                                                             | **Exact duplicates**                                           |
| `apps/api/src/routes/v1/translations.ts:22-23`               | local consts         | `readRoles`, `writeRoles`                                                             | **Divergent** — adds `translations:read`, `translations:write` |
| `apps/api/src/routes/v1/workflows.ts:61`                     | local const          | `adminRoles = ["admin"] as const`                                                     | **Inline duplicate**                                           |
| `apps/api/src/routes/v1/test-flow.ts:19`                     | local const          | `adminRoles = ["admin"] as const`                                                     | **Inline duplicate**                                           |
| `apps/api/src/middleware/tenant-isolation-matrix.test.ts:25` | local const          | `writeRoles = ["analyst", "reports:read", "reports:write", "reports:share"] as const` | **Divergent**                                                  |

### Cluster 24: Locales — MEDIUM

| Location                                                  | Definition                                                 | Values                                    | Notes                       |
| --------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------- | --------------------------- |
| `packages/i18n/src/formatters.ts:3`                       | `APP_LOCALES`                                              | `["en", "ar", "es", "fr", "zh"] as const` | Canonical                   |
| `packages/report-generator/src/i18n/report-strings.ts:62` | inline array                                               | `["en", "ar", "es", "fr", "zh"]`          | **Inline duplicate**        |
| `packages/types/src/queue-job-types.ts:310,327`           | inline schema                                              | `z.enum(["ar", "en", "fr", "es", "zh"])`  | **2 inline duplicates**     |
| `apps/frontend/src/i18n/locales.ts`                       | `supportedLocales`, `draftLocales`, `allConfiguredLocales` | Derived from locale files                 | Separate system (correct)   |
| `apps/frontend/e2e/auth-a11y-locale.spec.ts:12`           | local const                                                | `["en", "ar"] as const`                   | Subset for E2E (acceptable) |

### Cluster 25: Draft/Published/Archived Status — MEDIUM

| Location                                              | Definition                       | Values                                                                                            | Notes                                                                |
| ----------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `packages/database/src/schema/ai-templates.ts:25`     | `pgEnum("template_status", ...)` | `["draft", "published", "archived"]`                                                              | DB enum (canonical)                                                  |
| `apps/api/src/trpc/routers/ai-templates.ts:18,56`     | inline schemas                   | `z.enum(["draft", "published", "archived", "all"])`, `z.enum(["draft", "published", "archived"])` | **2 inline duplicates**                                              |
| `apps/api/src/services/ai-templates.service.ts:37`    | inline type                      | `"draft" \| "published" \| "archived"`                                                            | **Inline duplicate**                                                 |
| `packages/database/src/seeds/ai-templates-seed.ts:26` | inline type                      | `"draft" \| "published" \| "archived"`                                                            | **Inline duplicate**                                                 |
| `apps/frontend/src/hooks/useAiTemplates.ts:34`        | inline type                      | `"draft" \| "published" \| "archived" \| "all"`                                                   | **Inline duplicate**                                                 |
| `packages/database/src/seeds/reports-seed.ts:41`      | inline type                      | `"draft" \| "published" \| "archived"`                                                            | **Inline duplicate** (wrong domain — reports don't have this status) |

### Cluster 26: Impact/Effort Severity — LOW

| Location                                                   | Definition                       | Values                                          | Notes                                    |
| ---------------------------------------------------------- | -------------------------------- | ----------------------------------------------- | ---------------------------------------- |
| `packages/types/src/verdict.ts:31`                         | in `verdictInsightSchema`        | `z.enum(["high", "medium", "low"])`             | Impact                                   |
| `packages/types/src/verdict.ts:52`                         | in `verdictRecommendationSchema` | `z.enum(["low", "medium", "high"])`             | Effort (same values, different order)    |
| `packages/types/src/validation.ts:33`                      | `validationErrorSeveritySchema`  | `z.enum(["critical", "high", "medium", "low"])` | **Extended variant**                     |
| `packages/agent-runtime/src/validation/data-quality.ts:16` | inline type                      | `"critical" \| "high" \| "medium" \| "low"`     | **Inline duplicate** of extended variant |

### Cluster 27: Connector/Provider Health — LOW

| Location                                                      | Definition              | Values                                                           | Notes                          |
| ------------------------------------------------------------- | ----------------------- | ---------------------------------------------------------------- | ------------------------------ |
| `packages/types/src/connector-types.ts:16`                    | `connectorStatusSchema` | `z.enum(["healthy", "warning", "error", "inactive", "syncing"])` | Connector health               |
| `packages/types/src/ai-providers.ts:248`                      | in schema               | `z.enum(["healthy", "unhealthy", "unknown"])`                    | Provider health                |
| `packages/types/src/ai-providers.ts:97,114`                   | inline type             | `"healthy" \| "unhealthy" \| "unknown"`                          | Same file                      |
| `packages/ui/src/atoms/StatusIndicator/StatusIndicator.tsx:3` | `StatusVariant`         | `"healthy" \| "warning" \| "error" \| "inactive"`                | **Divergent** — UI variant set |

---

## 3. Cross-Cutting Analysis

### 3.1 Files With Most Inline Duplications

| File                                        | Inline Duplications | Dominant Pattern                                                          |
| ------------------------------------------- | ------------------- | ------------------------------------------------------------------------- |
| `packages/types/src/ai-providers.ts`        | 14                  | Config scope, provider status, cost tier, health, platform                |
| `packages/types/src/queue-job-types.ts`     | 12                  | Platform, insight type, pipeline status, workflow, locale, text direction |
| `apps/api/src/trpc/routers/insights.ts`     | 7                   | Status enums, casts, local constants                                      |
| `apps/api/src/trpc/routers/ai-providers.ts` | 5                   | Scope, status, cost tier schemas                                          |
| `apps/api/src/routes/v1/*.ts`               | 8+                  | Role arrays, workflow enums, OpenAPI inline enums                         |

### 3.2 Packages Not Depending on `@agenticverdict/types`

| Package                     | Overlapping Types                                                       | Should Import From Types                                |
| --------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| `packages/agent-runtime`    | `PipelineAgentKind`, `agentRoleSchema`, `TextDirection`, provider types | `connector-types`, `ai-providers`, `pipeline-execution` |
| `packages/data-connectors`  | `connectorAdapterTypes`, platform arrays, frequency enums               | `connector-types`                                       |
| `packages/config`           | Runtime env constants, provider schemas                                 | `ai-providers`, `common`                                |
| `packages/report-generator` | `REPORT_FORMATS`, `ReportFormat`, `TextDirection`                       | `reports`, `i18n`                                       |
| `packages/i18n`             | `APP_LOCALES`, `TextDirection`                                          | Should be the source for locale/direction types         |

### 3.3 DB pgEnum vs Zod Schema Divergence

| DB Enum (Drizzle)                                       | Zod Schema                                                          | Divergence                   |
| ------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------- |
| `cost_tier`: `["premium", "standard", "economy"]`       | `costTierSchema`: same                                              | None                         |
| `provider_status`: `["active", "inactive", "error"]`    | in `ai-providers.ts`: same                                          | None                         |
| `provider_scope`: `["tenant", "domain", "connector"]`   | `configScopeSchema`: same                                           | None                         |
| `template_status`: `["draft", "published", "archived"]` | inline in routers: same                                             | None                         |
| (no DB enum)                                            | `insightStatusSchema`: `["idle", "running", "completed", "failed"]` | Stored as varchar, no pgEnum |

DB enums are correctly separated from Zod schemas. The issue is Zod schema duplication, not DB divergence.

---

## 4. Recommended Consolidation Architecture

### 4.1 Type Ownership Map

Each concept should have exactly **one canonical definition** in `packages/types/src/`:

| Concept                    | Canonical File                     | Type Name                                              | Const Name                  | Zod Schema Name                    |
| -------------------------- | ---------------------------------- | ------------------------------------------------------ | --------------------------- | ---------------------------------- |
| Report generation formats  | `reports.ts`                       | `ReportFormat`                                         | `REPORT_FORMATS`            | —                                  |
| Insight delivery formats   | `reports.ts` (new)                 | `DeliveryFormat`                                       | `DELIVERY_FORMATS`          | —                                  |
| Viewer formats             | `reports.ts` (new)                 | `ViewerFormat`                                         | `VIEWER_FORMATS`            | —                                  |
| Connector platforms        | `connector-types.ts`               | `ConnectorType`                                        | `CONNECTOR_PLATFORMS`       | `connectorTypeSchema`              |
| Data source platforms      | `verdict.ts`                       | → use `ConnectorType`                                  | → alias                     | `dataSourcePlatformSchema` → alias |
| Insight types              | `insight.ts`                       | `InsightType`                                          | `INSIGHT_TYPES`             | `insightTypeSchema`                |
| Pipeline status            | `pipeline-execution.ts`            | `PipelineStatus`                                       | `PIPELINE_STATUSES`         | `pipelineStatusSchema`             |
| Insight status             | `insight.ts`                       | `InsightStatus`                                        | `INSIGHT_STATUSES`          | `insightStatusSchema`              |
| DB run status              | `insight.ts`                       | `InsightDbRunStatus`                                   | `DB_RUN_STATUSES`           | `insightDbRunStatusSchema`         |
| Detail level               | `insight.ts` (new)                 | `DetailLevel`                                          | `DETAIL_LEVELS`             | `detailLevelSchema`                |
| Schedule frequency         | `schedule.ts` (new)                | `ScheduleFrequency`                                    | `SCHEDULE_FREQUENCIES`      | `scheduleFrequencySchema`          |
| Sync frequency             | `connector-types.ts`               | `SyncFrequency`                                        | `SYNC_FREQUENCIES`          | `syncFrequencySchema`              |
| AI provider type           | `ai-providers.ts`                  | `AiProviderType`                                       | `AI_PROVIDER_TYPES`         | `aiProviderTypeSchema`             |
| Cost tier                  | `ai-providers.ts`                  | `CostTier`                                             | `COST_TIERS`                | `costTierSchema`                   |
| Config scope               | `ai-providers.ts`                  | `ConfigScope`                                          | `CONFIG_SCOPES`             | `configScopeSchema`                |
| AI provider status         | `ai-providers.ts`                  | `AiProviderStatus`                                     | `AI_PROVIDER_STATUSES`      | `aiProviderStatusSchema`           |
| Text direction             | `i18n` (re-export)                 | `TextDirection`                                        | —                           | —                                  |
| Tenant type                | `tenant.ts`                        | `TenantType`                                           | `TENANT_TYPES`              | `tenantTypeSchema`                 |
| Sort direction             | `common.ts` (new)                  | `SortDirection`                                        | `SORT_DIRECTIONS`           | `sortDirectionSchema`              |
| Workflow ID                | `queue-job-types.ts`               | `WorkflowTriggerWorkflowId`                            | `WORKFLOW_IDS`              | `workflowIdSchema`                 |
| Workflow phase             | `queue-job-types.ts`               | `WorkflowTriggerPhase`                                 | `WORKFLOW_PHASES`           | `workflowPhaseSchema`              |
| Mock data scenario         | `queue-job-types.ts`               | `MockDataScenario`                                     | `MOCK_SCENARIOS`            | `mockScenarioSchema`               |
| Agent role                 | `agent-runtime` → move to `types`  | `AgentRole`                                            | `AGENT_ROLES`               | `agentRoleSchema`                  |
| Depth                      | `queue-job-types.ts`               | `DepthLevel`                                           | `DEPTH_LEVELS`              | `depthSchema`                      |
| Email providers            | `reports.ts`                       | `EmailProvider`                                        | `EMAIL_PROVIDERS`           | `emailProviderSchema`              |
| Delivery events            | `reports.ts`                       | `ReportDeliveryEvent`                                  | `REPORT_DELIVERY_EVENTS`    | `deliveryEventSchema`              |
| Report roles               | `reports.ts`                       | `ReportReadRole`, `ReportWriteRole`, `ReportShareRole` | `REPORT_READ_ROLES`, etc.   | —                                  |
| Locales                    | `i18n` (re-export)                 | `AppLocale`                                            | `APP_LOCALES`               | —                                  |
| Template status            | `ai-templates.ts` (new)            | `TemplateStatus`                                       | `TEMPLATE_STATUSES`         | `templateStatusSchema`             |
| Severity/impact            | `validation.ts` (new)              | `SeverityLevel`                                        | `SEVERITY_LEVELS`           | `severityLevelSchema`              |
| Mock data scenario (tests) | → use from `@agenticverdict/types` | —                                                      | —                           | —                                  |
| ScenarioCategory (tests)   | `testing` (new) or `types`         | `ScenarioCategory`                                     | `SCENARIO_CATEGORIES`       | —                                  |
| Webhook delivery statuses  | `webhook.ts`                       | `WebhookDeliveryStatus`                                | `WEBHOOK_DELIVERY_STATUSES` | `webhookDeliveryStatusSchema`      |
| Webhook payload depth      | `webhook.ts` (new)                 | `WebhookPayloadDepth`                                  | `WEBHOOK_PAYLOAD_DEPTHS`    | `webhookPayloadDepthSchema`        |
| Verdict sentiment          | `verdict.ts` (new)                 | `VerdictSentiment`                                     | `VERDICT_SENTIMENTS`        | `verdictSentimentSchema`           |
| Verdict visualization type | `verdict.ts` (new)                 | `VisualizationType`                                    | `VISUALIZATION_TYPES`       | `visualizationTypeSchema`          |
| Verdict evidence source    | `verdict.ts`                       | `VerdictEvidenceSource`                                | `VERDICT_EVIDENCE_SOURCES`  | `verdictEvidenceSourceSchema`      |
| Verdict type               | `verdict.ts` (new)                 | `VerdictType`                                          | `VERDICT_TYPES`             | `verdictTypeSchema`                |
| Alert types                | `budget-alerts.ts`                 | `AlertType`                                            | `ALERT_TYPES`               | `alertTypeSchema`                  |
| Alert time window          | `budget-alerts.ts`                 | `AlertTimeWindow`                                      | `ALERT_TIME_WINDOWS`        | `alertTimeWindowSchema`            |
| Notification type          | `budget-alerts.ts` (new)           | `NotificationType`                                     | `NOTIFICATION_TYPES`        | `notificationTypeSchema`           |
| Schedule entity type       | `schedule.ts` (new)                | `ScheduleEntityType`                                   | `SCHEDULE_ENTITY_TYPES`     | `scheduleEntityTypeSchema`         |
| Validation severity        | `validation.ts`                    | `ValidationSeverity`                                   | `VALIDATION_SEVERITIES`     | `validationSeveritySchema`         |
| Delivery event type        | `delivery.ts`                      | `DeliveryEventType`                                    | `DELIVERY_EVENT_TYPES`      | `deliveryEventTypeSchema`          |
| Prompt template type       | `agent-protocol.ts` (new)          | `PromptTemplateType`                                   | `PROMPT_TEMPLATE_TYPES`     | `promptTemplateTypeSchema`         |
| Agent runtime mode         | `agent-protocol.ts` (new)          | `AgentRuntimeMode`                                     | `AGENT_RUNTIME_MODES`       | `agentRuntimeModeSchema`           |

### 4.2 New Constants to Add

Every enum should have a matching `const` array for runtime use:

```typescript
// Example pattern for each enum:
export const INSIGHT_TYPES = ["opportunity", "risk", "observation", "recommendation"] as const;
export type InsightType = (typeof INSIGHT_TYPES)[number];
export const insightTypeSchema = z.enum(INSIGHT_TYPES);
```

### 4.3 Import Discipline Rules

1. **Never** define `z.enum(["a", "b", "c"])` inline — always reference a named const
2. **Never** define `type X = "a" | "b" | "c"` inline — always reference a named type
3. **Never** define `const X = ["a", "b", "c"] as const` in app code — import from `@agenticverdict/types`
4. **DB pgEnum** definitions stay in `packages/database/src/schema/` (correct separation)
5. **Test-only** enums may live in `packages/testing/src/` if not used in production code
6. **UI-only** variants (e.g., `StatusVariant`) stay in `packages/ui/` if semantically different from domain types

---

## 5. Consolidation Priority Matrix

| Priority | Cluster                                | Files Affected | Effort | Risk if Deferred                          |
| -------- | -------------------------------------- | -------------- | ------ | ----------------------------------------- |
| **P0**   | 1: REPORT_FORMATS duplicate            | 2              | Low    | Schema divergence on next format addition |
| **P0**   | 2: Connector platforms (8 copies)      | 12             | Medium | New platform added to one location only   |
| **P0**   | 9: Config scope (16+ copies)           | 12             | Medium | Scope values drift between packages       |
| **P1**   | 3: Insight type (7 copies)             | 8              | Medium | New insight type missed in some paths     |
| **P1**   | 4: Pipeline status (5 copies)          | 5              | Low    | Status handling inconsistency             |
| **P1**   | 7: AI provider type divergence         | 4              | Low    | ProviderFactory supports more than types  |
| **P1**   | 10: TextDirection (3 named types)      | 15             | Medium | i18n/direction bugs in reports            |
| **P1**   | 14: AI provider status (8 copies)      | 9              | Medium | Status drift between API and DB           |
| **P2**   | 6: Schedule frequency (divergent sets) | 10             | Medium | "hourly" vs "quarterly" confusion         |
| **P2**   | 8: Cost tier (9 copies)                | 10             | Medium | Tier changes not propagated               |
| **P2**   | 11: TenantType (6 copies)              | 6              | Low    | New tenant type missed                    |
| **P2**   | 12: Insight status (5 copies)          | 5              | Low    | Status enum drift                         |
| **P2**   | 13: Run status (divergent sets)        | 8              | Medium | "partial" vs "skipped" vs "pending"       |
| **P2**   | 16: Workflow ID/Phase                  | 5              | Low    | New workflow missed in OpenAPI            |
| **P2**   | 19: Agent role (3 copies)              | 3              | Low    | Role order inconsistency                  |
| **P2**   | 23: Report roles (divergent)           | 7              | Medium | Role check bypass in some endpoints       |
| **P2**   | 24: Locales (4 copies)                 | 5              | Low    | New locale missed in report generator     |
| **P2**   | 25: Template status (6 copies)         | 6              | Medium | Status used for reports incorrectly       |
| **P3**   | 5: Detail level (4 copies)             | 4              | Low    | Minor                                     |
| **P3**   | 15: Sort direction (8 copies)          | 8              | Low    | Default value inconsistency               |
| **P3**   | 17: Mock scenario (2 copies)           | 2              | Low    | Test-only                                 |
| **P3**   | 18: ScenarioCategory (2 copies)        | 2              | Low    | Test-only                                 |
| **P3**   | 20: Depth (5 copies)                   | 1              | Low    | All in same file                          |
| **P3**   | 21: Email providers (3 copies)         | 2              | Low    | Same file or re-export                    |
| **P3**   | 22: Delivery events (2 copies)         | 1              | Low    | Same file                                 |
| **P3**   | 26: Impact/Effort severity (4 copies)  | 4              | Low    | Semantic difference acceptable            |
| **P3**   | 27: Health status variants (4 copies)  | 4              | Low    | Domain-specific variants acceptable       |

---

## 6. Total Impact Summary

| Metric                                                           | Count |
| ---------------------------------------------------------------- | ----- |
| **Duplication clusters**                                         | 27    |
| **Total files with duplications**                                | 120+  |
| **Exact duplicate const/type pairs**                             | 12    |
| **Semantic overlap (different values, same concept)**            | 9     |
| **Inline literal repetitions**                                   | 99+   |
| **Files in `packages/types/src/` that need new constants**       | 15+   |
| **Files in `packages/types/src/` with inline duplicates to fix** | 6     |
| **App files needing import migration**                           | 40+   |
| **Package files needing import migration**                       | 25+   |
| **Test files needing import migration**                          | 15+   |

---

## 7. Recommended Execution Order

### Wave 1: Eliminate Exact Duplicates (P0)

1. Remove `REPORT_FORMATS` from `report-generator/src/types.ts`, import from `@agenticverdict/types`
2. Consolidate `CONNECTOR_PLATFORMS` / `ConnectorType` / `connectorTypeSchema` / `dataSourcePlatformSchema` / `connectorAdapterTypes` into single source
3. Consolidate `CONFIG_SCOPES` / `ConfigScope` / `configScopeSchema` — replace all 16+ inline references

### Wave 2: Consolidate Inline Enum Repetitions (P1)

4. Add named constants to `packages/types/src/` for every `z.enum([...])` that appears 3+ times
5. Replace all inline `z.enum([...])` with references to named constants
6. Replace all inline `"a" | "b" | "c"` type unions with references to named types

### Wave 3: Resolve Divergent Sets (P2)

7. Separate `ScheduleFrequency` from `SyncFrequency` with clear naming
8. Separate `InsightStatus` from `PipelineStatus` (one has `"degraded"`)
9. Standardize run status variants — decide on canonical set
10. Resolve `TextDirection` triple definition (i18n, frontend, ui)
11. Resolve AI provider type divergence (types has 2, ProviderFactory has 5)

### Wave 4: Test-Only and Low-Risk (P3)

12. Consolidate test-only `ScenarioCategory` and `MockDataScenario`
13. Fix sort direction default inconsistency
14. Clean up same-file inline repetitions

### Wave 5: Enforcement

15. Add ESLint rule banning inline `z.enum([...])` with 3+ values
16. Add ESLint rule banning inline `"a" | "b" | "c"` types with 3+ values
17. Document type ownership map in `AGENTS.md` or new `TYPES.md`
