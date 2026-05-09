# E2E Integration — Review Findings

**Date:** 2026-05-09
**Review Scope:** All 14 phases of `/openspec/changes/e2e-integration/tasks.md` (153 tasks)
**Reference:** `/prompts/e2e-integration-remediation-plan.md`

---

## Executive Summary

**Overall Readiness: CONDITIONAL GO**

All 153 tasks across 14 phases are implemented. The typecheck, lint, and unit test gates pass cleanly (16/16 typecheck, 17/17 lint, 2384 tests passed). However, **4 critical issues** and **8 medium-severity issues** must be resolved before full production deployment. The core intelligence pipeline (insight.run → BullMQ → worker → pipeline → DB → frontend) is functionally wired end-to-end, but several production-hardening gaps remain.

**Go / Conditional Go / No Go: Conditional Go** — The system is functional for development and staging. Production deployment requires remediation of the 4 critical items listed below.

### Critical Blockers (Must Fix Before Production)

| #    | Issue                                                                | Location                                                                          | Severity |
| ---- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------- |
| C-01 | Credential decryption returns mock tokens                            | `apps/worker/src/services/credential-store.ts:45-60`                              | Critical |
| C-02 | AI insights auto-generation is a no-op stub                          | `apps/worker/src/queues/report-queues.ts:562-574`                                 | Critical |
| C-03 | `insight.run` bypasses `dbScoped()` tenant scoping                   | `apps/api/src/trpc/routers/insights.ts:888`                                       | Critical |
| C-04 | Frontend report download/share uses placeholder files, bypasses tRPC | `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx:600,646,783-815` | Critical |

---

## Phase-by-Phase Verification

### Phase 1: Database Schema Fixes & RLS Expansion (1.1–1.7)

**Status:** ALL TASKS COMPLETE | **Production Readiness: PASS** | **Integration Health: HEALTHY**

- `ai_provider_credentials` unique constraint fixed — only `(tenant_id, provider_id)` remains
- All three AI provider tables have `.references(() => tenants.id, { onDelete: "cascade" })`
- `aiProviderModelsRelations` correctly references `aiProviders.id`
- Migration `003_rls_policies_extended.sql` covers 26 tables with 27 tenant_id indexes
- **Zero TODOs/stubs** in touched files

### Phase 2: Worker Database Integration (2.1–2.11)

**Status:** ALL TASKS COMPLETE | **Production Readiness: PASS (caveats)** | **Integration Health: DEGRADED**

- `database.ts` singleton with health check and graceful shutdown implemented
- `DATABASE_URL` mandatory, `USE_MOCK_CREDENTIALS=1` supported
- Tenant config loads from DB via `dbScoped()` with disk fallback
- Credential store queries `platform_credentials` via `dbScoped()`
- Connector factory fetches real credentials with mock fallback

**Findings:**

- `credential-store.ts:29` — Missing explicit `tenantId` WHERE clause; relies solely on RLS (defense-in-depth gap)
- `connector-factory.ts:124` — `createWorkerPlatformFetchToolDeps()` hardcodes `"ga4"` platform instead of deriving from adapter
- `connector-factory.ts:79,84,133` — Uses `console.warn` instead of structured logger
- `database.ts:43-44` — `closeDatabase()` nulls singleton without closing connection pool

### Phase 3: Seed Data Completeness (3.1–3.9)

**Status:** ALL TASKS COMPLETE | **Production Readiness: PASS** | **Integration Health: HEALTHY**

- Platform credentials seeded for all 5 connectors per tenant
- Audit trail seed uses correct schema columns (`tenantId`, `insightId`, `eventType`, `eventData`)
- Marketing metrics, provenance records, and usage tracking seeds created
- TikTok and GBP included in per-tenant connector seeding
- Production safety: `seed-dev.ts` blocks execution in production
- **All placeholders are dev-only data, not production concerns**

### Phase 4: Shared Types & Audit Event Alignment (4.1–4.7)

**Status:** ALL TASKS COMPLETE | **Production Readiness: FAIL** | **Integration Health: HEALTHY**

- `AuditEventType` enum shared between backend and frontend
- Backend `getAuditTrail` uses Zod enum validation
- Frontend `AuditTrailTimeline` consumes shared enum
- All audit events written with proper `tenantId` scoping

**Findings:**

- Credential decryption stub (see C-01) is a security-critical path that must be hardened

### Phase 5: Agent Runtime Tool Wiring (5.1–5.11)

**Status:** ALL TASKS COMPLETE | **Production Readiness: PASS** | **Integration Health: HEALTHY**

- `createPipelineAgentTools()` accepts `platformDeps` and `tenantContextDeps`
- 6 tool categories implemented (platform-fetch, database-query, report-prep, analysis, b2b-kpi, tenant-context)
- `createPipelineAgentConfig()` uses tenant name, prompt vars, template version
- `Phase4AgentToolingDeps` interface enforces required deps at type level
- **Zero TODOs/stubs** in touched files

**Findings:**

- `agent-kinds.ts:86-88,104-106` — Returns empty `[]` silently if deps missing; no logging

### Phase 6: Structured Pipeline Data Flow (6.1–6.8)

**Status:** ALL TASKS COMPLETE | **Production Readiness: FAIL** | **Integration Health: DEGRADED**

- `AnalysisResult` and `InsightsResult` types defined in `pipeline-data.ts`
- `runIntelligencePipeline()` passes structured data between stages
- `toGeneratedInsights()` consumes structured output with text fallback
- Backward compatibility maintained for text output logging

**Findings:**

- `report-queues.ts:566-574` — `triggerAIInsightsGeneration` is a no-op stub (see C-02)
- `report-queues.ts:290-292` — `void platformDeps; void tenantContextDeps;` dead code in `runPipelineWorkflow` — tools not wired in workflow trigger path
- `intelligence-pipeline.ts:230,274` — Fragile regex JSON extraction (`match(/\{[\s\S]*"platformSummaries"[\s\S]*\}/)`)
- `report-queues.ts:387-398` — `platformFailures` loses actual error details from `pipelineState.error`

### Phase 7: Insight Execution Queue (7.1–7.10)

**Status:** ALL TASKS COMPLETE | **Production Readiness: FAIL** | **Integration Health: HEALTHY**

- `INSIGHT_EXECUTION_QUEUE` constant, job types, and queue factory implemented
- `defaultInsightExecutionProcessor()` reads insight config, runs pipeline, persists results
- Report persistence via DB insert + object storage upload
- Email delivery with report attachment via `sendReportEmail()`
- Tenant context wrapper via `runWorkerJobWithTenantContext()`

**Findings:**

- `triggerAIInsightsGeneration` stub (see C-02) called on every successful report delivery
- `report-queues.ts:769` — `getDatabase()` called directly instead of through tenant-scoped pattern
- `report-queues.ts:796` — Redundant `Buffer.from(pdfBuffer)` copy

### Phase 8: API Insight Run Implementation (8.1–8.10)

**Status:** ALL TASKS COMPLETE | **Production Readiness: FAIL** | **Integration Health: DEGRADED**

- `insight.run` enqueues BullMQ job, updates status, creates audit trail
- `getAIInsights` queries DB with BullMQ fallback
- `generateAIInsights` enqueues generation job with audit trail
- `getJobStatus` with tenant isolation check
- RBAC via `authedProcedureWithPermission(INSIGHTS_WRITE)`

**Findings:**

- `insights.ts:888-892` — `insight.run` uses `db.select()` directly instead of `dbScoped()` (see C-03)
- `insights.ts:19` — `const logger = console` — unstructured logging throughout 1344-line file
- `insights.ts:1098-1103` — Passing `undefined` to Drizzle's `and()` is fragile
- `insights.ts:1123,1288` — Unnecessary dynamic `import()` for same-package modules
- `insights.ts:1319` — Progress heuristic hardcoded at 50% for all in-progress states

### Phase 9: API Bug Fixes (9.1–9.5)

**Status:** ALL TASKS COMPLETE | **Production Readiness: PASS (caveats)** | **Integration Health: HEALTHY**

- `deleteMany` iterates all IDs with tenant scoping and audit trail
- `getSharedReportContent` validates share token, fetches from storage
- `getAggregateMetrics` correctly scopes to `agencyPartnerId`
- `connector.test` performs real connectivity test with platform-specific URLs
- Workflow status enforces tenant ownership and sanitizes control characters

**Findings:**

- `agency.ts:97-100` — `dateRange` input accepted but never used in query
- `reports.ts:587-650` — `deleteMany` has no upper bound on `input.ids.length`
- `reports.ts:1012-1092` — Shared endpoint has no rate limiting
- `connector.ts:306-307` — `setTimeout` not cleared on error path (potential memory leak)
- `workflows.ts:140` — `toSafeWorkflowFailureMessage` always returns `"errors.common.unknownError"`

### Phase 10: RBAC Middleware Enforcement (10.1–10.6)

**Status:** ALL TASKS COMPLETE | **Production Readiness: PASS** | **Integration Health: HEALTHY**

- `requirePermission()` and `requireRole()` middleware fully implemented
- All insight mutations protected with `INSIGHTS_WRITE` / `INSIGHTS_DELETE`
- All report mutations protected with `REPORTS_DELETE`
- All connector mutations protected with `CONNECTORS_WRITE` / `CONNECTORS_DELETE`
- Audit logging via `recordTenantSecurityEvent` on every RBAC decision
- **Zero TODOs/stubs** in touched files

### Phase 11: Frontend Real-Time Status (11.1–11.8)

**Status:** ALL TASKS COMPLETE | **Production Readiness: PASS** | **Integration Health: HEALTHY**

- `useInsightRunStatus` hook with 3s polling, terminal status detection, cleanup on unmount
- `useInsightRunMutation` composition hook auto-starts polling on run success
- `JobStatusBadge` component with all status states, progress display, retry link
- Cache invalidation on mutation success
- Auto-refetch on list page when any insight is running
- **Zero TODOs/stubs** in touched files

### Phase 12: Frontend UI Fixes (12.1–12.7)

**Status:** PARTIAL | **Production Readiness: FAIL** | **Integration Health: DEGRADED**

- Settings tab removed (3 tabs: overview, reports, history)
- Report filtering by `insightId` implemented in backend and frontend
- `useInsightRunMutation` replaces `useInsightRun` on detail page
- `AuditTrailTimeline` displays all event types correctly

**Findings:**

- `InsightDetailPage.tsx:600` — Download uses placeholder `.txt` files (see C-04)
- `InsightDetailPage.tsx:646` — Report fetching not implemented (see C-04)
- `InsightDetailPage.tsx:783-815` — Share modal bypasses `report.createShareLink` mutation
- `InsightDetailPage.tsx:619` — `handleBulkDownload` defined but never called
- `ReportListPage.tsx:363,409` — Same TODOs duplicated

### Phase 13: Type Contract Updates (13.1–13.4)

**Status:** ALL TASKS COMPLETE | **Production Readiness: PASS** | **Integration Health: HEALTHY**

- `PipelineExecutionStatus` (7 status values), `JobStatusPayload`, `InsightRunStatus` defined
- `AnalysisResult`, `InsightsResult`, `InsightItem` types exported
- Types consumed correctly across api, frontend, and worker
- **Zero TODOs/stubs** in `packages/types/src/`

### Phase 14: Testing & Validation (14.1–14.10)

**Status:** ALL TASKS COMPLETE (caveats) | **Production Readiness: FAIL** | **Integration Health: DEGRADED**

- **typecheck: PASS** — 16/16 packages, 0 errors
- **lint: PASS** — 17/17 packages, 0 errors
- **test:unit: PASS** — 315 files, 2384 tests passed, 8 skipped
- E2E adapter tests cover all 5 connectors
- Tenant isolation and pipeline failure recovery tests pass
- Report delivery scenario tested

**Findings:**

- Task 14.5 (RBAC E2E) — No dedicated E2E test; only unit-level middleware tests exist
- Task 14.6 (Audit trail E2E) — No dedicated E2E test; events inserted but not end-to-end verified

---

## Integration Point Health

| Service Boundary                          | Status       | Evidence                                                                |
| ----------------------------------------- | ------------ | ----------------------------------------------------------------------- |
| Frontend → API (tRPC)                     | **HEALTHY**  | Full tRPC client with tenant header, retry policy, SuperJSON            |
| Frontend → API (REST)                     | **HEALTHY**  | Workflow status endpoint with tenant isolation                          |
| API → Worker (BullMQ)                     | **HEALTHY**  | `insight-execution` queue wired end-to-end                              |
| Worker → Agent Runtime                    | **HEALTHY**  | `runIntelligencePipeline()` called with tools in insight execution path |
| Worker → Agent Runtime (workflow trigger) | **DEGRADED** | `platformDeps` dead code in `runPipelineWorkflow`                       |
| Worker → Data Connectors                  | **DEGRADED** | Credential decryption is a stub (C-01)                                  |
| Worker → Database                         | **HEALTHY**  | `dbScoped()` used consistently in worker                                |
| Worker → Report Generator                 | **HEALTHY**  | PDF generation + object storage upload working                          |
| Worker → Email Delivery                   | **HEALTHY**  | `sendReportEmail()` with attachment                                     |
| API → Database                            | **DEGRADED** | `insight.run` bypasses `dbScoped()` (C-03)                              |
| Agent Runtime → LLM Providers             | **HEALTHY**  | 5 providers with failover, circuit breaker                              |
| Frontend → Real-time Updates              | **HEALTHY**  | 3s polling hook with terminal status detection                          |
| Frontend → Report Downloads               | **BROKEN**   | Placeholder files instead of tRPC calls (C-04)                          |
| Frontend → Share Links                    | **BROKEN**   | Share modal bypasses token generation                                   |

---

## Gap Inventory

### Critical

| ID    | Gap                                                         | Location                                | Impact                                                    |
| ----- | ----------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------- |
| G-C01 | Credential decryption returns mock `"decrypted-mock-token"` | `credential-store.ts:45-60`             | All 5 connectors fail with real credentials in production |
| G-C02 | `triggerAIInsightsGeneration` is a no-op stub               | `report-queues.ts:562-574`              | AI insights never auto-generated after report delivery    |
| G-C03 | `insight.run` uses `db.select()` instead of `dbScoped()`    | `insights.ts:888`                       | Bypasses tenant-scoping pattern, potential RLS bypass     |
| G-C04 | Report download/share uses placeholder files, bypasses tRPC | `InsightDetailPage.tsx:600,646,783-815` | Users cannot download or share reports                    |

### High

| ID    | Gap                                               | Location                           | Impact                                                           |
| ----- | ------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| G-H01 | `platformDeps` dead code in `runPipelineWorkflow` | `report-queues.ts:290-292`         | Tools not wired in workflow trigger path                         |
| G-H02 | Fragile regex JSON extraction in pipeline         | `intelligence-pipeline.ts:230,274` | Structured results may be `undefined` for non-trivial LLM output |
| G-H03 | `insights.ts` uses `const logger = console`       | `insights.ts:19`                   | No structured logging, missing tenant correlation IDs            |
| G-H04 | `reports.ts` uses `const logger = console`        | `reports.ts:30`                    | Same unstructured logging pattern                                |

### Medium

| ID    | Gap                                                        | Location                         | Impact                                                  |
| ----- | ---------------------------------------------------------- | -------------------------------- | ------------------------------------------------------- |
| G-M01 | `credential-store.ts:29` missing explicit `tenantId` WHERE | `credential-store.ts:29`         | Defense-in-depth gap; relies solely on RLS              |
| G-M02 | `connector-factory.ts:124` hardcodes `"ga4"`               | `connector-factory.ts:124`       | Non-per-platform factory always fetches GA4 credentials |
| G-M03 | `connector-factory.ts` uses `console.warn`                 | `connector-factory.ts:79,84,133` | Inconsistent with structured logging conventions        |
| G-M04 | `agency.ts:97-100` `dateRange` unused                      | `agency.ts:97-100`               | Date filter accepted but ignored in query               |
| G-M05 | `deleteMany` no upper bound on IDs                         | `reports.ts:587-650`             | Potential for massive `IN (...)` query                  |
| G-M06 | `connector.ts:306-307` timeout not cleared on error        | `connector.ts:306-307`           | Potential memory leak                                   |
| G-M07 | `workflows.ts:140` failure message always unknown          | `workflows.ts:140`               | Loses actual error details                              |
| G-M08 | No RBAC E2E test                                           | `tests/`                         | Task 14.5 marked complete but no dedicated test         |

### Low

| ID    | Gap                                                  | Location                       | Impact                                          |
| ----- | ---------------------------------------------------- | ------------------------------ | ----------------------------------------------- |
| G-L01 | `database.ts:43-44` closeDatabase doesn't close pool | `database.ts:43-44`            | Incomplete graceful shutdown                    |
| G-L02 | `agent-kinds.ts` silent empty `[]` return            | `agent-kinds.ts:86-88,104-106` | No logging when tools unavailable               |
| G-L03 | `insights.ts:1319` progress hardcoded at 50%         | `insights.ts:1319`             | Inaccurate progress for in-progress states      |
| G-L04 | `report-queues.ts:796` redundant Buffer copy         | `report-queues.ts:796`         | Minor performance waste                         |
| G-L05 | No audit trail E2E test                              | `tests/`                       | Task 14.6 marked complete but no dedicated test |

---

## TODO/Stub Inventory

| File                                                              | Line            | Content                                                                                        | Category                 |
| ----------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------- | ------------------------ |
| `apps/worker/src/services/credential-store.ts`                    | 9               | `TODO: Implement AES-256 decryption (deferred per design decision D5)`                         | Deferred by design       |
| `apps/worker/src/services/credential-store.ts`                    | 10              | `Currently returns the raw encrypted payload as a placeholder.`                                | Design doc note          |
| `apps/worker/src/services/credential-store.ts`                    | 41              | `TODO: Implement AES-256-GCM decryption using a master key from environment.`                  | Deferred by design       |
| `apps/worker/src/services/credential-store.ts`                    | 48              | `// TODO: Implement real decryption:`                                                          | Deferred by design       |
| `apps/worker/src/services/credential-store.ts`                    | 58              | `metadata: { decrypted: true, placeholder: true }`                                             | Mock data                |
| `apps/worker/src/queues/report-queues.ts`                         | 568             | `event: "ai_insights_trigger_placeholder"`                                                     | Functional stub          |
| `apps/worker/src/queues/report-queues.ts`                         | 572             | `"AI insights auto-generation triggered (placeholder - to be implemented with agent-runtime)"` | Functional stub          |
| `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx` | 600             | `// TODO: Implement actual download logic with tRPC endpoint`                                  | Incomplete feature       |
| `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx` | 646             | `// TODO: Implement actual report fetching`                                                    | Incomplete feature       |
| `apps/frontend/src/features/reports/pages/ReportListPage.tsx`     | 363             | `// TODO: Implement actual report fetching`                                                    | Incomplete feature       |
| `apps/frontend/src/features/reports/pages/ReportListPage.tsx`     | 409             | `// TODO: Implement actual download logic with tRPC endpoint`                                  | Incomplete feature       |
| `packages/ui/src/providers/ThemeProvider.tsx`                     | 112             | `// TODO: Implement actual API call`                                                           | Unrelated to e2e         |
| `packages/database/scripts/seed-dev.ts`                           | 358-359         | `encrypted_dev_key_placeholder_anthropic_sk-ant-xxxxx`                                         | Dev-only data            |
| `packages/database/src/seeds/platform-credentials-seed.ts`        | 58-59           | `Creates dev placeholder encrypted payloads...`                                                | Dev-only data            |
| `packages/database/src/seeds/platform-credentials-seed.ts`        | 70,78,91,99,112 | `DEV_PLACEHOLDER_*` tokens                                                                     | Dev-only data            |
| `packages/agent-runtime/src/services/budget-alerts.ts`            | 114,141,177     | `"tenant-id-placeholder"`                                                                      | Test fixture             |
| `packages/report-generator/src/template-engine.ts`                | 5               | `Minimal template engine: returns a stable placeholder`                                        | Intentional minimal impl |

---

## Production Readiness Checklist

| Check               | Status   | Notes                                                                                |
| ------------------- | -------- | ------------------------------------------------------------------------------------ |
| Type safety         | **PASS** | 16/16 packages, 0 errors                                                             |
| Error handling      | **PASS** | Try/catch patterns, TRPCError, AppFault used consistently                            |
| Logging             | **FAIL** | `insights.ts` and `reports.ts` use `console` instead of structured logger            |
| Tenant isolation    | **FAIL** | `insight.run` bypasses `dbScoped()`; credential store missing explicit tenant filter |
| RBAC enforcement    | **PASS** | All mutations protected with `requirePermission()`                                   |
| Seed data           | **PASS** | All tables populated, production-safe                                                |
| Migration safety    | **PASS** | Clean migrations, no conflicts                                                       |
| Test coverage       | **PASS** | 2384 tests passing; gaps in RBAC and audit trail E2E                                 |
| Credential security | **FAIL** | Decryption is a stub; credentials stored unencrypted                                 |
| Real-time updates   | **PASS** | Polling hook with terminal status detection                                          |
| Report downloads    | **FAIL** | Frontend uses placeholder files                                                      |

---

## Risk Assessment

| Risk                                                                   | Probability | Impact   | Mitigation                                                 |
| ---------------------------------------------------------------------- | ----------- | -------- | ---------------------------------------------------------- |
| Credential decryption stub causes connector failures in production     | High        | Critical | Implement AES-256-GCM decryption before production deploy  |
| AI insights auto-generation stub causes missing downstream insights    | High        | High     | Implement `triggerAIInsightsGeneration` or remove the call |
| `insight.run` tenant isolation bypass enables cross-tenant data access | Medium      | Critical | Replace `db.select()` with `dbScoped()`                    |
| Fragile regex JSON parsing causes structured results to be undefined   | Medium      | High     | Replace with robust JSON block extraction                  |
| Unbounded `deleteMany` causes database performance issues              | Low         | Medium   | Cap at 100 IDs per request                                 |
| Shared report endpoint without rate limiting enables abuse             | Medium      | Medium   | Add rate limiting middleware                               |
| `dateRange` parameter silently ignored in agency metrics               | Low         | Low      | Either implement or remove parameter                       |
| No RBAC E2E test means permission gaps may go undetected               | Medium      | High     | Add dedicated RBAC E2E test suite                          |
