# End-to-End System Integration Analysis & Remediation Plan

**Generated:** 2026-05-08
**Analysis Scope:** Full-stack integration across all components (apps + packages)
**Reference:** `/docs/architecture/business/business-architecture.md`
**Status:** Complete Analysis

---

## Part 1: Current State Analysis

### 1.1 Component-by-Component Implementation Status Matrix

| Component                     | Layer                       | Status       | Completeness | Notes                                                                                                                                                                                                                                                                                                        |
| ----------------------------- | --------------------------- | ------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **apps/api**                  | REST + tRPC server          | Partial      | ~65%         | Full tRPC router coverage but critical stubs in insight.run, getAIInsights, generateAIInsights. REST layer is read-only for insights/verdicts. BullMQ integration exists for report delivery/schedules/workflows but not for insight execution.                                                              |
| **apps/worker**               | Background processor        | Partial      | ~60%         | BullMQ queue infrastructure complete (4 queues). Intelligence pipeline handler exists but agents run with NO tools. Connector auth uses hardcoded mock token. No DB access in operational flow. Report generation works but results not persisted.                                                           |
| **apps/frontend**             | TanStack Start web app      | Partial      | ~70%         | Full CRUD UI for insights (list, detail, create wizard, edit). "Run Now" button exists but triggers stub backend. No real-time status updates. Audit trail event types mismatch with backend. Report list not insight-scoped.                                                                                |
| **apps/desktop**              | Electron client             | Not analyzed | Unknown      | Not in scope of current analysis.                                                                                                                                                                                                                                                                            |
| **packages/agent-runtime**    | AI pipeline orchestration   | Partial      | ~55%         | 3-stage pipeline structure complete (analysis -> insights -> verdict). Provider infrastructure robust (5 providers, failover, circuit breaker). BUT: `createPipelineAgentTools()` returns empty array, `createPipelineAgentConfig()` ignores all options, no structured data between stages (raw text only). |
| **packages/data-connectors**  | Platform connectors         | Complete     | ~90%         | 5 production connectors fully implemented (GA4, Meta, GSC, GBP, TikTok) with auth, fetch, normalization, circuit breaker, rate limiting, caching, DLQ. Mock adapter with 5 scenarios. Gaps: no incremental sync, no credential encryption, GBP reviews no pagination.                                        |
| **packages/database**         | Schema + migrations + seeds | Partial      | ~75%         | 34+ tables across public/core schemas. Drizzle ORM with `dbScoped()` tenant scoping. Dev seed covers 8 tenants with comprehensive data. Gaps: RLS on only 6 of 34+ tables, schema inconsistencies (FK missing, unique constraint conflicts), several tables not seeded.                                      |
| **packages/report-generator** | Report generation           | Complete     | ~85%         | 5 output formats (PDF/HTML/DOCX/XLSX/JSON). 3 built-in templates. Phase 2 verdict/insight integration complete. Email delivery via Resend/SendGrid. Gaps: AI insights auto-generation placeholder, XLSX minimal, no download endpoint, no status tracking during generation.                                 |
| **packages/core**             | Shared business logic       | Complete     | ~85%         | Tenant context, AsyncLocalStorage, error system, AppFault pattern. Well-structured.                                                                                                                                                                                                                          |
| **packages/config**           | Runtime configuration       | Complete     | ~80%         | Tenant config loading, mock policies. Disk-based config (not DB).                                                                                                                                                                                                                                            |
| **packages/observability**    | Logging + metrics           | Complete     | ~80%         | Pino logger, Prometheus metrics. Integrated across packages.                                                                                                                                                                                                                                                 |
| **packages/types**            | Shared TypeScript types     | Complete     | ~90%         | Verdict schema, generated insight schema, permissions, roles.                                                                                                                                                                                                                                                |
| **packages/i18n**             | Internationalization        | Complete     | ~80%         | Tenant translation overrides, locale routing.                                                                                                                                                                                                                                                                |
| **packages/ui**               | Design system               | Complete     | ~85%         | Mantine-based components.                                                                                                                                                                                                                                                                                    |

### 1.2 Business Capability Coverage Analysis

Mapped from `/docs/architecture/business/business-architecture.md`:

| Business Capability                                                   | Status  | Implementation Coverage | Gap Summary                                                                                                                                                                                                       |
| --------------------------------------------------------------------- | ------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Unified Data Integration**                                          | Partial | 70%                     | 5 connectors implemented and functional. BUT: no real credential management in worker, no incremental sync, mock-only in pipeline execution.                                                                      |
| **AI-Powered Analysis**                                               | Broken  | 30%                     | Pipeline structure exists but agents run with NO tools (`createPipelineAgentTools` returns `[]`). System messages are hardcoded generics. No structured data flow between stages.                                 |
| **Automated Delivery**                                                | Partial | 60%                     | Email delivery works (Resend/SendGrid). Schedule-based triggers work. BUT: no report persistence after generation, AI insights auto-generation is a placeholder, download links point to unimplemented endpoints. |
| **Multi-Tenant Architecture**                                         | Partial | 65%                     | JWT auth + ALS context propagation works. `dbScoped()` provides app-level isolation. BUT: RLS on only 6 of 34+ tables, no tenant switcher UI, worker loads config from disk not DB.                               |
| **Self-Service Insight Creation**                                     | Partial | 75%                     | 6-step wizard implemented with validation. CRUD via tRPC works. BUT: "Run Now" is a stub, no actual pipeline execution from UI.                                                                                   |
| **Template-Based Initialization**                                     | Partial | 60%                     | AI templates CRUD + deployment complete. Report templates with 3 built-in variants. BUT: insight templates (business architecture Appendix A) not implemented as a distinct feature.                              |
| **Agency Partner Workflow**                                           | Partial | 55%                     | Agency tRPC router with client management exists. BUT: `getAggregateMetrics` only queries first client, no tenant switcher UI, no white-label reporting (Phase 2).                                                |
| **Intelligence Pipeline (COLLECT -> ANALYZE -> GENERATE -> DELIVER)** | Broken  | 35%                     | Each stage exists in isolation but the end-to-end chain is broken at multiple points: insight.run doesn't enqueue, agents have no tools, results not persisted, delivery doesn't include generated reports.       |
| **Insight Creation Workflow (8 steps)**                               | Partial | 70%                     | UI wizard covers all 8 steps. Backend CRUD works. BUT: connector selection doesn't validate credentials, metric selection doesn't verify data availability, schedule doesn't create BullMQ jobs.                  |
| **Role-Based Access Control**                                         | Partial | 60%                     | RBAC schema complete (roles, permissions, user_roles, role_permissions). Seed data exists. BUT: RBAC middleware defined but not used in any routers, navigation filtering exists but not enforced at API level.   |

### 1.3 Integration Point Health Assessment

| Service Boundary                   | Direction           | Status  | Health   | Details                                                                                                                                    |
| ---------------------------------- | ------------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Frontend -> API (tRPC)             | Client -> Server    | Healthy | Good     | Full tRPC client with tenant header, retry policy, SuperJSON serialization.                                                                |
| Frontend -> API (REST)             | Client -> Server    | Partial | Fair     | REST routes exist but limited coverage. Insights/verdicts are read-only.                                                                   |
| API -> Worker (BullMQ)             | Server -> Queue     | Partial | Fair     | 3 queue types wired (delivery, schedule, workflow-trigger). BUT: no insight execution queue, workflow-trigger restricted to testMode only. |
| Worker -> Agent Runtime            | Queue -> Package    | Broken  | Critical | Worker calls `runIntelligencePipeline()` but agents have NO tools. Pipeline produces text output but no structured data.                   |
| Worker -> Data Connectors          | Package -> Package  | Partial | Fair     | Connector factory creates adapters but uses hardcoded mock token. No real credential fetching from DB.                                     |
| Worker -> Report Generator         | Package -> Package  | Partial | Fair     | Report generation works but results not persisted. No DB storage in pipeline flow.                                                         |
| Worker -> Database                 | Queue -> DB         | Broken  | Critical | Worker does NOT use `dbScoped()`. No operational DB access. Tenant config loaded from disk, not DB.                                        |
| API -> Database                    | Server -> DB        | Healthy | Good     | `dbScoped()` with RLS. Drizzle ORM. Proper tenant scoping.                                                                                 |
| Agent Runtime -> LLM Providers     | Package -> External | Healthy | Good     | 5 providers registered with failover, circuit breaker, billing hooks.                                                                      |
| Frontend -> Real-time Updates      | Client <- Server    | Missing | Critical | No WebSocket, SSE, or server-push. Polling only (5s interval on list page).                                                                |
| Report Generator -> Email Delivery | Package -> External | Healthy | Good     | Resend + SendGrid with suppression lists.                                                                                                  |

---

## Part 2: Gap Analysis

### 2.1 Detailed Gap Inventory

#### CRITICAL GAPS (Block End-to-End Functionality)

| ID       | Gap                                                | Location                                          | Severity | Root Cause                                                                                                                | Impact                                                                                                                           |
| -------- | -------------------------------------------------- | ------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **G-01** | `insight.run` is a no-op stub                      | `apps/api/src/trpc/routers/insights.ts:861-916`   | Critical | Validates insight exists but returns `{ success: true }` without enqueuing any job, updating status, or triggering worker | User clicks "Run Now" and nothing happens. Core feature completely non-functional.                                               |
| **G-02** | Pipeline agents run with NO tools                  | `packages/agent-runtime/src/agent-kinds.ts:61-64` | Critical | `createPipelineAgentTools()` returns `[]` -- all 10+ defined tools per role are never wired into the pipeline             | Agents cannot fetch data, calculate metrics, or access tenant context. Pipeline produces generic text, not data-driven analysis. |
| **G-03** | Pipeline agent config ignores all options          | `packages/agent-runtime/src/agent-kinds.ts:28`    | Critical | `void options` -- tenant name, prompt vars, template version, platform deps, tenant context deps all ignored              | System messages are hardcoded generics. No tenant-specific prompting, no platform-specific tool injection.                       |
| **G-04** | Connector authentication uses hardcoded mock token | `apps/worker/src/connector-factory.ts:68-72`      | Critical | `accessToken: "worker-mock-token"` -- no real OAuth credential fetching from database                                     | Real connector API calls will fail. Pipeline only works with mock adapters.                                                      |
| **G-05** | Worker has no operational database access          | `apps/worker/src/` (entire codebase)              | Critical | Worker loads tenant config from disk via `ConfigManager`, never calls `dbScoped()`. No DB queries in pipeline flow.       | Cannot fetch connector credentials, insight configurations, or persist results.                                                  |
| **G-06** | Pipeline results not persisted to database         | `apps/worker/src/queues/report-queues.ts`         | Critical | Insights, verdicts, and analysis results returned as job return values but never written to DB                            | Results are lost after job completion. No history, no retrieval, no audit trail.                                                 |
| **G-07** | Generated reports not persisted in pipeline flow   | `apps/worker/src/queues/report-queues.ts`         | Critical | `defaultReportGenerationProcessor` produces PDF/DOCX but doesn't store via `drizzle-reports.ts` or blob storage           | Generated reports are lost. Email delivery has no attachment source.                                                             |
| **G-08** | `getAIInsights` returns empty data                 | `apps/api/src/trpc/routers/insights.ts:1031-1048` | Critical | Hardcoded empty response: `{ performanceSummary: null, keyFindings: [], recommendations: [], generatedAt: null }`         | AI insights tab on detail page always shows empty state.                                                                         |
| **G-09** | `generateAIInsights` returns fake jobId            | `apps/api/src/trpc/routers/insights.ts`           | Critical | Creates audit trail record but returns `crypto.randomUUID()` without enqueuing any job                                    | Frontend believes a job started but nothing executes.                                                                            |
| **G-10** | No real-time status updates for pipeline execution | `apps/frontend/src/`                              | Critical | No WebSocket, SSE, or server-push mechanism. Only 5s polling on list page                                                 | Users cannot track pipeline progress. Detail page shows stale status after "Run Now".                                            |

#### HIGH GAPS (Significant Functional Deficiencies)

| ID       | Gap                                                    | Location                                                          | Severity | Root Cause                                                                                                          | Impact                                                                                                       |
| -------- | ------------------------------------------------------ | ----------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **G-11** | Audit trail event type mismatch                        | Backend: `insights.ts` vs Frontend: `AuditTrailTimeline.tsx`      | High     | Backend stores `created/updated/deleted/ai_generated`; frontend filters by `run/config_change/delivery/error`       | Timeline shows "No events found" for most real events.                                                       |
| **G-12** | Report list on detail page not insight-scoped          | `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx` | High     | `useReportList()` called without insight ID filter                                                                  | Shows ALL tenant reports, not just reports for the current insight.                                          |
| **G-13** | Detail page uses weaker run hook                       | `InsightDetailPage.tsx:675`                                       | High     | Uses `useInsightRun()` instead of `useInsightRunMutation()`                                                         | No cache invalidation after run. Detail page shows stale data.                                               |
| **G-14** | RLS on only 6 of 34+ tables                            | `packages/database/migrations/001_rls_policies.sql`               | High     | Migration only covers users, tenant_connectors, insights, reports, report_templates                                 | 28+ tenant-scoped tables rely solely on application-level enforcement. Direct SQL access bypasses isolation. |
| **G-15** | `deleteMany` only deletes first ID                     | `apps/api/src/trpc/routers/reports.ts`                            | High     | `input.ids[0]` used instead of iterating all IDs                                                                    | Bulk delete silently fails for all but first item.                                                           |
| **G-16** | `agency.getAggregateMetrics` only queries first client | `apps/api/src/trpc/routers/agency.ts`                             | High     | Only queries first client tenant, ignores rest                                                                      | Agency dashboard shows incomplete data.                                                                      |
| **G-17** | `audit_trail` not seeded                               | `packages/database/scripts/seed-dev.ts`                           | High     | `seedAuditTrailForTenant()` exists in `audit-seed.ts` but never called                                              | No audit trail events in dev environment.                                                                    |
| **G-18** | `audit-seed.ts` schema mismatch                        | `packages/database/src/seeds/audit-seed.ts`                       | High     | References columns (`entityType`, `entityId`, `description`, `occurredAt`) that don't exist in `audit_trail` schema | Seed function would fail if called.                                                                          |
| **G-19** | Workflow trigger restricted to testMode only           | `apps/api/src/routes/v1/workflows.ts`                             | High     | Production workflows blocked by design                                                                              | Cannot trigger real pipeline execution via REST API.                                                         |
| **G-20** | No insight execution queue                             | `apps/api/src/services/report-bullmq.ts`                          | High     | Only 3 queue types exist (delivery, schedule, workflow-trigger). No dedicated insight execution queue.              | No way to enqueue insight runs from API.                                                                     |
| **G-21** | Pipeline stages communicate via raw text only          | `packages/agent-runtime/src/intelligence-pipeline.ts`             | High     | Text truncation (12k-20k chars) between stages. No typed intermediate representation.                               | Data loss, no structured analysis results, no per-metric insights.                                           |
| **G-22** | RBAC middleware defined but unused                     | `apps/api/src/trpc/middleware/rbac-guard.ts`                      | High     | `requirePermission()` and `requireRole()` exist but no router uses them                                             | API-level permission enforcement missing.                                                                    |

#### MEDIUM GAPS (Quality & Completeness Issues)

| ID       | Gap                                                                           | Location                                                  | Severity | Root Cause                                                                                                                   | Impact                                                           |
| -------- | ----------------------------------------------------------------------------- | --------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **G-23** | Insights REST only has GET                                                    | `apps/api/src/routes/v1/insights.ts`                      | Medium   | No POST/PUT/DELETE endpoints                                                                                                 | REST API incomplete for insights.                                |
| **G-24** | `connector.test` always returns success                                       | `apps/api/src/trpc/routers/connector.ts`                  | Medium   | Stub implementation                                                                                                          | Cannot verify connector connectivity.                            |
| **G-25** | `getSharedReportContent` returns placeholder                                  | `apps/api/src/trpc/routers/reports.ts`                    | Medium   | Returns `"base64-encoded-content-placeholder"` string                                                                        | Shared report download doesn't work.                             |
| **G-26** | No seed for `marketing_metrics`, `platform_credentials`, `provenance_records` | `packages/database/src/seeds/`                            | Medium   | No seed functions exist                                                                                                      | These tables are empty in dev environment.                       |
| **G-27** | Schema: `ai_provider_credentials` unique constraint conflict                  | `packages/database/src/schema/ai-provider-credentials.ts` | Medium   | Two unique constraints: `(tenant_id, provider_id)` and `(tenant_id)` alone                                                   | Tenant can only have ONE credential total, not one per provider. |
| **G-28** | Schema: missing FK references                                                 | `packages/database/src/schema/`                           | Medium   | `ai_provider_credentials`, `ai_provider_usage`, `ai_provider_health` have `tenantId` without `.references(() => tenants.id)` | Referential integrity not enforced at DB level.                  |
| **G-29** | No incremental/delta fetch for connectors                                     | `packages/data-connectors/src/`                           | Medium   | All adapters fetch full date range each time                                                                                 | Inefficient for large date ranges, redundant API calls.          |
| **G-30** | No credential encryption/decryption                                           | `packages/data-connectors/src/credentials.ts`             | Medium   | `ConnectorCredentials = Readonly<Record<string, string>>` (plain text)                                                       | Credentials stored/retrieved without encryption.                 |
| **G-31** | GBP reviews only fetch first page                                             | `packages/data-connectors/src/gbp/api-client.ts`          | Medium   | No `nextPageToken` loop                                                                                                      | Only 50 reviews fetched per location.                            |
| **G-32** | XLSX generator is minimal                                                     | `packages/report-generator/src/xlsx-format-generator.ts`  | Medium   | Only extracts HTML `<table>` elements                                                                                        | No charts, narrative text, or structured data in XLSX output.    |
| **G-33** | No streaming support in pipeline                                              | `packages/agent-runtime/src/`                             | Medium   | Pipeline only supports synchronous `agent.run()`                                                                             | No progressive result delivery.                                  |
| **G-34** | `toGeneratedInsights()` creates single hardcoded insight                      | `apps/worker/src/queues/report-queues.ts`                 | Medium   | Fixed confidence (0.7), relevance (0.7), type ("trend")                                                                      | No per-insight intelligence from pipeline output.                |
| **G-35** | Email delivery in pipeline workflow has no attachments                        | `apps/worker/src/queues/report-queues.ts`                 | Medium   | Sends simple text email without generated report                                                                             | Users receive notification but no actual report.                 |
| **G-36** | Settings tab on detail page is redundant                                      | `InsightDetailPage.tsx` Settings tab                      | Medium   | Duplicates `/insights/$id/edit` route with limited fields                                                                    | Confusing UX, inconsistent editing experience.                   |

#### LOW GAPS (Minor Issues)

| ID       | Gap                                        | Location                                                 | Severity | Root Cause                                                       | Impact                                                |
| -------- | ------------------------------------------ | -------------------------------------------------------- | -------- | ---------------------------------------------------------------- | ----------------------------------------------------- |
| **G-37** | No LinkedIn, Twitter/X, YouTube connectors | `packages/data-connectors/src/`                          | Low      | Only 5 platforms implemented                                     | Limited connector ecosystem.                          |
| **G-38** | Charts are static SVG without labels       | `packages/report-generator/src/components/charts.ts`     | Low      | Simple SVG generation                                            | Reports lack professional chart quality.              |
| **G-39** | No multi-template composition              | `packages/report-generator/src/`                         | Low      | Single template per report                                       | Cannot combine executive summary + detailed analysis. |
| **G-40** | No caching layer in report generator       | `packages/report-generator/src/base-report-generator.ts` | Low      | Hook interface exists but no implementation                      | Repeated generation re-renders from scratch.          |
| **G-41** | GSC `capturedAt` uses `new Date()`         | `packages/data-connectors/src/gsc/transformers.ts:51`    | Low      | Inconsistent with other transformers using `raw.fetchedAt`       | Minor timestamp inconsistency.                        |
| **G-42** | TikTok adapter reuses GA4 date range split | `packages/data-connectors/src/tiktok/tiktok-adapter.ts`  | Low      | Imports from `../ga4/date-range-split` instead of shared utility | Cross-module dependency fragility.                    |

### 2.2 Dependency Mapping Between Gaps

```
G-01 (insight.run stub)
  └── depends on: G-20 (no insight execution queue)
  └── depends on: G-05 (worker no DB access)
  └── depends on: G-04 (connector auth mock token)

G-02 (agents no tools)
  └── depends on: G-03 (config ignores options)
  └── blocks: G-21 (raw text only between stages)
  └── blocks: G-34 (hardcoded single insight)

G-04 (connector auth mock token)
  └── depends on: G-05 (worker no DB access)
  └── depends on: G-26 (no platform_credentials seed)
  └── depends on: G-30 (no credential encryption)

G-05 (worker no DB access)
  └── blocks: G-04, G-06, G-07, G-17
  └── depends on: packages/database integration

G-06 (results not persisted)
  └── depends on: G-05 (worker no DB access)
  └── blocks: G-08 (getAIInsights empty)

G-07 (reports not persisted)
  └── depends on: G-05 (worker no DB access)
  └── blocks: G-25 (shared report placeholder)
  └── blocks: G-35 (email no attachments)

G-10 (no real-time updates)
  └── depends on: G-01 (insight.run stub)
  └── depends on: G-06 (results not persisted)

G-11 (audit trail mismatch)
  └── depends on: G-17 (audit_trail not seeded)
  └── depends on: G-18 (seed schema mismatch)

G-14 (RLS coverage)
  └── independent (schema migration only)

G-22 (RBAC unused)
  └── independent (middleware wiring)
```

### 2.3 Gap Severity Distribution

| Severity  | Count  | Percentage |
| --------- | ------ | ---------- |
| Critical  | 10     | 24%        |
| High      | 12     | 29%        |
| Medium    | 14     | 33%        |
| Low       | 6      | 14%        |
| **Total** | **42** | **100%**   |

---

## Part 3: Remediation Plan

### Phase 1: Foundation -- Worker Database Integration & Credential Management

**Goal:** Enable the worker to access the database for credential fetching and result persistence. This is the foundational dependency for most other fixes.

#### R-01: Add Database Access to Worker

| Field                   | Value                                                                                                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Integrate `dbScoped()` and database client into the worker's operational flow                                                                                                                                                                                       |
| **Where**               | `apps/worker/src/tenant/worker-tenant-als.ts`, `apps/worker/src/queues/report-queues.ts`                                                                                                                                                                            |
| **Dependencies**        | None (foundational)                                                                                                                                                                                                                                                 |
| **Acceptance Criteria** | 1. Worker can execute `dbScoped()` queries within job handlers. 2. Tenant context from ALS propagates to `dbScoped()`. 3. RLS policies are enforced for worker DB queries. 4. Database connection is properly managed (singleton, health check, graceful shutdown). |
| **Effort**              | M                                                                                                                                                                                                                                                                   |

**Steps:**

1. Create `apps/worker/src/database.ts` -- database singleton with `createDatabaseClient()` from `@agenticverdict/database`
2. Modify `worker-tenant-als.ts` to load tenant config from DB (via `dbScoped()`) with disk fallback
3. Add `DATABASE_URL` to worker environment requirements (currently optional)
4. Add DB health check to `apps/worker/src/health.ts`
5. Ensure `runWorkerJobWithTenantContext()` wraps DB operations in `dbScoped()`

#### R-02: Implement Real Connector Credential Fetching

| Field                   | Value                                                                                                                                                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Replace hardcoded mock token with real credential fetching from `platform_credentials` table                                                                                                                                                                            |
| **Where**               | `apps/worker/src/connector-factory.ts`, `packages/database/src/schema/platform-credentials.ts`                                                                                                                                                                          |
| **Dependencies**        | R-01 (worker DB access)                                                                                                                                                                                                                                                 |
| **Acceptance Criteria** | 1. Worker fetches credentials from `platform_credentials` table by `tenantId` + `connectorType`. 2. Credentials are decrypted before use. 3. Missing credentials fall back to mock adapter with clear logging. 4. Credential fetch errors are surfaced as job failures. |
| **Effort**              | M                                                                                                                                                                                                                                                                       |

**Steps:**

1. Create `apps/worker/src/services/credential-store.ts` -- queries `platform_credentials` via `dbScoped()`
2. Implement credential decryption (using existing encryption utility or add one)
3. Modify `createWorkerPlatformFetchToolDeps()` to use real credentials
4. Add credential validation before adapter authentication
5. Add fallback to mock adapter with warning log when credentials missing

#### R-03: Seed Platform Credentials for Development

| Field                   | Value                                                                                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Add seed data for `platform_credentials` table with development credentials                                                                                                                  |
| **Where**               | `packages/database/src/seeds/` (new file), `packages/database/scripts/seed-dev.ts`                                                                                                           |
| **Dependencies**        | R-02 (credential store)                                                                                                                                                                      |
| **Acceptance Criteria** | 1. Dev seed includes platform credentials for all 5 connectors for each tenant. 2. Credentials are encrypted before storage. 3. Mock scenario flag allows bypassing real credentials in dev. |
| **Effort**              | S                                                                                                                                                                                            |

**Steps:**

1. Create `packages/database/src/seeds/platform-credentials-seed.ts`
2. Generate encrypted dev credentials for GA4, Meta, GSC, GBP, TikTok
3. Add seed call to `seed-dev.ts` per-tenant loop
4. Add environment variable `USE_MOCK_CREDENTIALS=1` to bypass real credentials in dev

### Phase 2: Agent Runtime -- Tool Wiring & Configuration

**Goal:** Wire tools into pipeline agents and make configuration options functional.

#### R-04: Implement `createPipelineAgentTools()`

| Field                   | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Return actual tool instances instead of empty array                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Where**               | `packages/agent-runtime/src/agent-kinds.ts`, `packages/agent-runtime/src/agent-tools/phase4-tool-registry.ts`                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Dependencies**        | None                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Acceptance Criteria** | 1. Analysis agent receives: `get_tenant_profile`, `get_business_rules`, `get_config`, `fetch_meta_metrics`, `fetch_ga4_metrics`, `fetch_gsc_metrics`, `fetch_gbp_metrics`, `fetch_tiktok_metrics`, `calculate_metrics`, `compute_b2b_kpis_from_snapshots`. 2. Insights agent receives: `get_config`, `analyze_trends`, `statistical_analysis`. 3. Verdict agent receives: `get_tenant_profile`, `get_business_rules`, `generate_summary`, `format_report`. 4. All tools are functional and return correct data. |
| **Effort**              | L                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

**Steps:**

1. Modify `createPipelineAgentTools()` to accept `platformDeps` and `tenantContextDeps` from options
2. Use `createPhase4ToolRegistry()` to create tools per stage
3. Wire `platformDeps.getPlatforms` to filter available platform fetch tools
4. Wire `tenantContextDeps.getTenantContext` to inject tenant profile tools
5. Add unit tests verifying tool count and types per stage

#### R-05: Implement `createPipelineAgentConfig()` Options Usage

| Field                   | Value                                                                                                                                                                                                                                                                      |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Use all options (tenantName, promptVars, templateVersion, platformDeps, tenantContextDeps) instead of ignoring them                                                                                                                                                        |
| **Where**               | `packages/agent-runtime/src/agent-kinds.ts`                                                                                                                                                                                                                                |
| **Dependencies**        | None                                                                                                                                                                                                                                                                       |
| **Acceptance Criteria** | 1. `tenantName` appears in system message. 2. `promptVars` are injected into agent variables. 3. `templateVersion` is used for prompt template selection. 4. `platformDeps` influences tool availability. 5. `tenantContextDeps` influences tenant-specific configuration. |
| **Effort**              | M                                                                                                                                                                                                                                                                          |

**Steps:**

1. Remove `void options` from `createPipelineAgentConfig()`
2. Enhance system messages to include tenant name and context
3. Inject `promptVars` into `AgentConfig.variables`
4. Use `templateVersion` for prompt registry lookup
5. Add integration tests verifying config propagation

#### R-06: Add Structured Data Flow Between Pipeline Stages

| Field                   | Value                                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Replace raw text truncation with typed intermediate representations                                                                                                                                                                                                                                                                                                     |
| **Where**               | `packages/agent-runtime/src/intelligence-pipeline.ts`, new types in `packages/agent-runtime/src/types/`                                                                                                                                                                                                                                                                 |
| **Dependencies**        | R-04 (tools wired)                                                                                                                                                                                                                                                                                                                                                      |
| **Acceptance Criteria** | 1. Analysis stage outputs `AnalysisResult` (typed metrics, trends, correlations). 2. Insights stage outputs `InsightsResult` (structured findings with confidence scores). 3. Verdict stage receives both as structured input. 4. No data truncation -- full structured data passes between stages. 5. Backward compatibility: text output still available for logging. |
| **Effort**              | L                                                                                                                                                                                                                                                                                                                                                                       |

**Steps:**

1. Define `AnalysisResult`, `InsightsResult` types in `packages/agent-runtime/src/types/pipeline-data.ts`
2. Modify `runIntelligencePipeline()` to pass structured data between stages
3. Update stage prompts to consume structured input
4. Update `PipelineState` to include structured results
5. Update worker's `toGeneratedInsights()` to consume structured output

### Phase 3: API -- Insight Execution Queue & Real Pipeline Trigger

**Goal:** Make "Run Now" actually execute the intelligence pipeline.

#### R-07: Create Insight Execution Queue

| Field                   | Value                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Add a dedicated BullMQ queue for insight execution jobs                                                                                                                                                                                                                                                                                                           |
| **Where**               | `apps/api/src/services/report-bullmq.ts`, `apps/worker/src/queues/report-queues.ts`, `apps/worker/src/queues/job-types.ts`                                                                                                                                                                                                                                        |
| **Dependencies**        | R-01 (worker DB access)                                                                                                                                                                                                                                                                                                                                           |
| **Acceptance Criteria** | 1. New queue `insight-execution` registered in worker. 2. API can enqueue jobs via `enqueueInsightExecution()`. 3. Job data includes: `tenantId`, `insightId`, `connectorIds`, `metrics`, `aiConfig`, `requestId`. 4. Job result includes: `verdict`, `insights`, `reportId`, `status`, `error`. 5. Worker processes jobs by calling `runIntelligencePipeline()`. |
| **Effort**              | L                                                                                                                                                                                                                                                                                                                                                                 |

**Steps:**

1. Add `INSIGHT_EXECUTION_QUEUE` constant to `apps/worker/src/queues/queue-names.ts`
2. Define `InsightExecutionJobData` and `InsightExecutionJobResult` schemas in `job-types.ts`
3. Create `createInsightExecutionQueue()` in `report-queues.ts` with processor
4. Processor reads insight config from DB, resolves connectors, creates platform deps, runs pipeline
5. Add `enqueueInsightExecution()` to `apps/api/src/services/report-bullmq.ts`
6. Add queue registration to worker CLI

#### R-08: Implement `insight.run` tRPC Procedure

| Field                   | Value                                                                                                                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Replace stub with real queue enqueue and status update                                                                                                                                                                                                    |
| **Where**               | `apps/api/src/trpc/routers/insights.ts` (lines 861-916)                                                                                                                                                                                                   |
| **Dependencies**        | R-07 (insight execution queue)                                                                                                                                                                                                                            |
| **Acceptance Criteria** | 1. `insight.run` enqueues job to `insight-execution` queue. 2. Returns `{ success: true, jobId: string }`. 3. Updates insight `lastRunStatus` to "running". 4. Creates audit trail event with type "run". 5. Handles queue unavailable errors gracefully. |
| **Effort**              | M                                                                                                                                                                                                                                                         |

**Steps:**

1. Import `enqueueInsightExecution()` from BullMQ service
2. Read insight config + connectors from DB via `dbScoped()`
3. Enqueue job with full context
4. Update insight `lastRunStatus = "running"`, `lastRunAt = now()`
5. Insert audit trail event
6. Return `{ success: true, jobId }`
7. Add error handling for queue unavailability

#### R-09: Implement `getAIInsights` and `generateAIInsights`

| Field                   | Value                                                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **What**                | Return real AI insights from pipeline results and trigger actual generation                                                                                                                                  |
| **Where**               | `apps/api/src/trpc/routers/insights.ts`                                                                                                                                                                      |
| **Dependencies**        | R-06 (structured pipeline data), R-08 (insight.run enqueues)                                                                                                                                                 |
| **Acceptance Criteria** | 1. `getAIInsights` queries DB for pipeline results and returns structured insights. 2. `generateAIInsights` enqueues a generation job and returns real `jobId`. 3. Both procedures respect tenant isolation. |
| **Effort**              | M                                                                                                                                                                                                            |

**Steps:**

1. Create `insights-store.ts` service for querying persisted pipeline results
2. Modify `getAIInsights` to query from DB instead of returning empty
3. Modify `generateAIInsights` to enqueue actual job (reuse R-07 queue)
4. Add job status polling endpoint for generation progress

### Phase 4: Frontend -- Real-Time Status & UI Fixes

**Goal:** Fix frontend gaps and add real-time pipeline status tracking.

#### R-10: Implement Real-Time Pipeline Status Updates

| Field                   | Value                                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Add polling or SSE for pipeline execution status on insight detail page                                                                                                                                                                                                                                                                 |
| **Where**               | `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx`, `apps/frontend/src/features/insights/api/insight-api.ts`                                                                                                                                                                                                             |
| **Dependencies**        | R-08 (insight.run returns jobId)                                                                                                                                                                                                                                                                                                        |
| **Acceptance Criteria** | 1. After clicking "Run Now", detail page polls for job status every 3 seconds. 2. Status transitions: idle -> running -> completed/failed. 3. UI updates: button state, status badge, progress indicator. 4. On completion, invalidates detail query and shows success toast. 5. Polling stops when job is terminal (completed/failed). |
| **Effort**              | M                                                                                                                                                                                                                                                                                                                                       |

**Steps:**

1. Add `useInsightRunStatus()` hook that polls `GET /workflows/status/:jobId` or new endpoint
2. Modify `InsightDetailPage` to start polling on run mutation success
3. Add status-aware UI: running spinner, completed badge, failed error display
4. Stop polling on terminal status
5. Invalidate `insight.getById` on completion

#### R-11: Fix Detail Page Run Hook and Cache Invalidation

| Field                   | Value                                                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Replace `useInsightRun()` with `useInsightRunMutation()` on detail page                                                                                    |
| **Where**               | `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx:675`                                                                                      |
| **Dependencies**        | None                                                                                                                                                       |
| **Acceptance Criteria** | 1. Detail page uses `useInsightRunMutation()`. 2. `insight.getById` query invalidated after successful run. 3. Success and error toasts display correctly. |
| **Effort**              | S                                                                                                                                                          |

**Steps:**

1. Change import from `useInsightRun` to `useInsightRunMutation`
2. Update `handleRunNow` to use the new hook
3. Verify toast notifications work

#### R-12: Fix Audit Trail Event Type Mismatch

| Field                   | Value                                                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Align backend event types with frontend filter types                                                                                                                                                                            |
| **Where**               | `apps/api/src/trpc/routers/insights.ts` (getAuditTrail), `apps/frontend/src/features/insights/ui/audit-trail/AuditTrailTimeline.tsx`                                                                                            |
| **Dependencies**        | R-17 (seed audit_trail)                                                                                                                                                                                                         |
| **Acceptance Criteria** | 1. Backend stores events with types matching frontend filters: `run`, `config_change`, `delivery`, `error`. 2. Frontend timeline displays all event types correctly. 3. Event type enum is shared between frontend and backend. |
| **Effort**              | S                                                                                                                                                                                                                               |

**Steps:**

1. Create shared event type enum in `packages/types/src/audit-event-types.ts`
2. Update backend `getAuditTrail` input to use shared enum
3. Update frontend `AuditTrailTimeline` to use shared enum
4. Map existing backend events (`created`, `updated`, `deleted`) to new types

#### R-13: Fix Report List Scoping on Detail Page

| Field                   | Value                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Filter report list by insight ID on detail page                                                                                                                                 |
| **Where**               | `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx`, `apps/api/src/trpc/routers/reports.ts`                                                                       |
| **Dependencies**        | None                                                                                                                                                                            |
| **Acceptance Criteria** | 1. Report list on detail page shows only reports for the current insight. 2. API supports `insightId` filter parameter. 3. Empty state shows when no reports exist for insight. |
| **Effort**              | S                                                                                                                                                                               |

**Steps:**

1. Add `insightId` optional filter to `report.list` tRPC procedure
2. Update `RecentReports` and `ReportsTab` components to pass insight ID
3. Add empty state for no reports

#### R-14: Remove Redundant Settings Tab or Enhance It

| Field                   | Value                                                                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Either remove Settings tab from detail page or make it a quick-edit that redirects to full wizard for advanced settings                         |
| **Where**               | `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx`                                                                               |
| **Dependencies**        | None                                                                                                                                            |
| **Acceptance Criteria** | 1. No duplicate editing experience. 2. Quick-edit (if kept) clearly indicates limited scope. 3. Full edit always available via dedicated route. |
| **Effort**              | S                                                                                                                                               |

**Steps:**

1. Option A: Remove Settings tab, add "Edit Settings" button linking to `/insights/$id/edit`
2. Option B: Keep Settings tab but add "Advanced Settings" link to full wizard
3. Recommend Option A for cleaner UX

### Phase 5: Database -- Schema Fixes, RLS, and Seed Completeness

**Goal:** Fix schema issues, expand RLS coverage, and complete seed data.

#### R-15: Expand RLS Policy Coverage

| Field                   | Value                                                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Add RLS policies to all 28+ tenant-scoped tables missing them                                                                                                                                                       |
| **Where**               | `packages/database/migrations/003_rls_policies_extended.sql` (new migration)                                                                                                                                        |
| **Dependencies**        | None                                                                                                                                                                                                                |
| **Acceptance Criteria** | 1. RLS enabled on all tenant-scoped tables. 2. Each table has `tenant_isolation_{table}` policy. 3. Agency partner access policy applied where needed. 4. Migration runs successfully in dev and test environments. |
| **Effort**              | M                                                                                                                                                                                                                   |

**Steps:**

1. Create migration `003_rls_policies_extended.sql`
2. Add RLS policies for: audit_logs, audit_trail, provenance_records, feature_flags, tenant_feature_flags, i18n_strings, marketing_metrics, platform_credentials, report_shares, business_domains, domain_connector_assignments, domain_hierarchy_cache, ai_providers, ai_provider_failover, ai_provider_credentials, ai_provider_usage, ai_provider_health, ai_templates, template_deployments, template_usage_analytics, ai_usage_reports, ai_usage_aggregation_daily, ai_usage_aggregation_monthly, budget_alerts, alert_trigger_history, budget_period_summaries, roles, user_roles, role_permissions
3. Add indexes for tenant_id columns
4. Test with `db:reset` + `seed-dev`

#### R-16: Fix Schema Inconsistencies

| Field                   | Value                                                                                                                                                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Fix FK references, unique constraint conflicts, and relation mismatches                                                                                                                                                                                               |
| **Where**               | `packages/database/src/schema/ai-provider-credentials.ts`, `packages/database/src/schema/ai-providers.ts`                                                                                                                                                             |
| **Dependencies**        | None                                                                                                                                                                                                                                                                  |
| **Acceptance Criteria** | 1. `ai_provider_credentials` unique constraint only on `(tenant_id, provider_id)`. 2. All `tenantId` columns have `.references(() => tenants.id)`. 3. `aiProviderModelsRelations` references correct primary key. 4. `drizzle-kit generate` produces clean migration. |
| **Effort**              | M                                                                                                                                                                                                                                                                     |

**Steps:**

1. Remove erroneous unique constraint `ai_provider_credentials_tenant_idx`
2. Add `.references(() => tenants.id)` to `ai_provider_credentials`, `ai_provider_usage`, `ai_provider_health`
3. Fix `aiProviderModelsRelations` to reference `aiProviders.id`
4. Generate and test migration

#### R-17: Complete Seed Data

| Field                   | Value                                                                                                                                                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Add missing seed functions and fix existing ones                                                                                                                                                                                                                                                                                            |
| **Where**               | `packages/database/src/seeds/audit-seed.ts`, `packages/database/scripts/seed-dev.ts`, new seed files                                                                                                                                                                                                                                        |
| **Dependencies**        | R-16 (schema fixes)                                                                                                                                                                                                                                                                                                                         |
| **Acceptance Criteria** | 1. `audit_trail` seeded with realistic events per tenant. 2. `marketing_metrics` seeded with sample data. 3. `platform_credentials` seeded (from R-03). 4. `provenance_records` seeded. 5. `core.usage_tracking` seeded. 6. TikTok and GBP connectors seeded as tenant instances (not just registry). 7. `seed-dev.ts` runs without errors. |
| **Effort**              | M                                                                                                                                                                                                                                                                                                                                           |

**Steps:**

1. Fix `audit-seed.ts` schema mismatch (use correct column names)
2. Add `seedAuditTrailForTenant()` call to `seed-dev.ts`
3. Create `packages/database/src/seeds/marketing-metrics-seed.ts`
4. Create `packages/database/src/seeds/provenance-records-seed.ts`
5. Create `packages/database/src/seeds/usage-tracking-seed.ts`
6. Add TikTok and GBP to per-tenant connector seeding
7. Run `seed-dev` and verify all tables populated

### Phase 6: Bug Fixes & Quality Improvements

**Goal:** Fix all remaining bugs and quality issues.

#### R-18: Fix `deleteMany` Bug

| Field                   | Value                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| **What**                | Fix `deleteMany` to delete all IDs, not just the first                                                  |
| **Where**               | `apps/api/src/trpc/routers/reports.ts`                                                                  |
| **Dependencies**        | None                                                                                                    |
| **Acceptance Criteria** | 1. All IDs in `input.ids` are deleted. 2. Returns count of deleted items. 3. Test verifies bulk delete. |
| **Effort**              | S                                                                                                       |

#### R-19: Fix `agency.getAggregateMetrics`

| Field                   | Value                                                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Query all client tenants, not just the first                                                                                     |
| **Where**               | `apps/api/src/trpc/routers/agency.ts`                                                                                            |
| **Dependencies**        | None                                                                                                                             |
| **Acceptance Criteria** | 1. Aggregates metrics across all permitted client tenants. 2. Returns correct totals. 3. Performance acceptable for 20+ clients. |
| **Effort**              | S                                                                                                                                |

#### R-20: Wire RBAC Middleware to Routers

| Field                   | Value                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Apply `requirePermission()` and `requireRole()` to tRPC routers                                                                                                                 |
| **Where**               | `apps/api/src/trpc/routers/*.ts`                                                                                                                                                |
| **Dependencies**        | None                                                                                                                                                                            |
| **Acceptance Criteria** | 1. All mutation procedures require appropriate permissions. 2. Admin procedures require admin role. 3. Unauthorized access returns 403. 4. Tests verify permission enforcement. |
| **Effort**              | M                                                                                                                                                                               |

#### R-21: Implement `connector.test` Real Connectivity Check

| Field                   | Value                                                                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Replace stub with actual API connectivity test                                                                                                     |
| **Where**               | `apps/api/src/trpc/routers/connector.ts`                                                                                                           |
| **Dependencies**        | R-02 (credential fetching)                                                                                                                         |
| **Acceptance Criteria** | 1. Tests actual API connectivity using stored credentials. 2. Returns success/failure with details. 3. Handles auth errors, rate limits, timeouts. |
| **Effort**              | M                                                                                                                                                  |

#### R-22: Implement `getSharedReportContent` Real Download

| Field                   | Value                                                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Return actual report content instead of placeholder                                                                                    |
| **Where**               | `apps/api/src/trpc/routers/reports.ts`                                                                                                 |
| **Dependencies**        | R-07 (report persistence)                                                                                                              |
| **Acceptance Criteria** | 1. Returns base64-encoded report content from blob storage. 2. Content type matches requested format. 3. Share token validation works. |
| **Effort**              | S                                                                                                                                      |

#### R-23: Fix Email Delivery to Include Generated Report

| Field                   | Value                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **What**                | Attach generated report to email in pipeline workflow                                                                                |
| **Where**               | `apps/worker/src/queues/report-queues.ts`                                                                                            |
| **Dependencies**        | R-07 (report persistence)                                                                                                            |
| **Acceptance Criteria** | 1. Pipeline workflow generates report before sending email. 2. Email includes report as attachment. 3. Download link in email works. |
| **Effort**              | M                                                                                                                                    |

#### R-24: Fix `toGeneratedInsights()` to Produce Structured Insights

| Field                   | Value                                                                                                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | Parse pipeline output into multiple structured insights instead of single hardcoded entry                                                                                                            |
| **Where**               | `apps/worker/src/queues/report-queues.ts`                                                                                                                                                            |
| **Dependencies**        | R-06 (structured pipeline data)                                                                                                                                                                      |
| **Acceptance Criteria** | 1. Parses insights from pipeline output with individual confidence scores. 2. Each insight has type, relevance, domain, and actionable text. 3. Minimum 3 insights generated when pipeline succeeds. |
| **Effort**              | M                                                                                                                                                                                                    |

---

## Part 4: Integration Test Strategy

### 4.1 End-to-End Test Scenarios

| ID         | Scenario                                 | Steps                                                                                                                                                                 | Expected Result                                                                                                    | Priority |
| ---------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------- |
| **E2E-01** | Full Insight Execution (Mock)            | 1. Login as tenant admin. 2. Navigate to insight detail page. 3. Click "Run Now". 4. Wait for completion. 5. View results.                                            | Pipeline executes with mock connectors. Verdict generated. Insights displayed. Report available for download.      | P0       |
| **E2E-02** | Full Insight Execution (Real Connectors) | 1. Configure real connector credentials. 2. Create insight with real connectors. 3. Run insight. 4. Verify data fetched from APIs. 5. Verify analysis uses real data. | Real data fetched from all configured platforms. Cross-platform analysis correct. Verdict reflects actual metrics. | P0       |
| **E2E-03** | Scheduled Insight Execution              | 1. Create insight with cron schedule. 2. Wait for scheduled trigger. 3. Verify automatic execution.                                                                   | Insight runs automatically at scheduled time. Results persisted. Email delivered.                                  | P0       |
| **E2E-04** | Multi-Tenant Isolation                   | 1. Create insights in Tenant A. 2. Login as Tenant B user. 3. Verify Tenant A insights not visible. 4. Run insight in Tenant B. 5. Verify results isolated.           | No cross-tenant data leakage. RLS enforced. Queue jobs tenant-scoped.                                              | P0       |
| **E2E-05** | Agency Partner Multi-Client              | 1. Login as agency partner. 2. Switch between client tenants. 3. Run insights for each client. 4. View aggregate dashboard.                                           | Can access all client tenants. Data isolated per client. Aggregate metrics correct.                                | P1       |
| **E2E-06** | Pipeline Failure Recovery                | 1. Configure insight with invalid connector. 2. Run insight. 3. Verify graceful failure. 4. Check error message. 5. Retry after fixing connector.                     | Failure detected early. User sees actionable error. Retry succeeds after fix.                                      | P1       |
| **E2E-07** | Report Generation & Delivery             | 1. Run insight with delivery enabled. 2. Verify report generated in PDF. 3. Verify email received. 4. Download report from email link.                                | PDF generated correctly. Email delivered with attachment. Download link works.                                     | P1       |
| **E2E-08** | AI Insights Display                      | 1. Run insight. 2. Navigate to AI Insights tab. 3. Verify insights displayed with confidence scores.                                                                  | Structured insights visible. Confidence scores shown. Recommendations actionable.                                  | P1       |
| **E2E-09** | Audit Trail Completeness                 | 1. Create insight. 2. Run insight. 3. Edit insight. 4. Delete insight. 5. Verify all events in audit trail.                                                           | All CRUD operations logged. Event types correct. Timeline displays all events.                                     | P2       |
| **E2E-10** | RBAC Enforcement                         | 1. Login as viewer. 2. Attempt to run insight. 3. Attempt to edit insight. 4. Attempt to delete insight. 5. Verify all blocked.                                       | Viewer cannot mutate. Only read operations allowed. 403 returned for mutations.                                    | P2       |

### 4.2 Key User Journeys

| Journey                            | Path                                                                                                                                                     | Status                           |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| **Insight Creation to Execution**  | Login -> Admin Dashboard -> Create Insight -> Select Connectors -> Choose Metrics -> Configure AI -> Set Schedule -> Activate -> Run Now -> View Results | Broken (G-01, G-02, G-04)        |
| **Scheduled Report Delivery**      | Create Insight -> Set Schedule -> Wait -> Auto-Run -> Generate Report -> Email Delivery -> Download                                                      | Partial (G-07, G-23, G-35)       |
| **Agency Multi-Client Management** | Login as Agency -> Switch Client -> View Dashboard -> Run Insight -> View Results -> Switch to Next Client                                               | Partial (G-16)                   |
| **Insight Monitoring**             | Login -> Insight List -> Click Detail -> View Overview -> View Reports -> View AI Insights -> View History                                               | Partial (G-08, G-11, G-12, G-13) |

### 4.3 Automated Test Coverage Gaps

| Area                        | Current Coverage                       | Gap                                        | Recommendation                                        |
| --------------------------- | -------------------------------------- | ------------------------------------------ | ----------------------------------------------------- |
| **API tRPC routers**        | Unit tests for individual procedures   | No integration tests for full request flow | Add integration tests with real DB + Redis            |
| **Worker queue processors** | Unit tests for job handlers            | No E2E tests for full pipeline execution   | Add E2E tests with mock LLM + mock connectors         |
| **Agent runtime**           | Unit tests for individual components   | No integration tests for full pipeline     | Add pipeline integration tests with structured data   |
| **Frontend**                | Skipped test files (`*.test.tsx.skip`) | No active frontend tests                   | Unskip and fix tests, add Playwright E2E              |
| **Database**                | Unit tests for repositories            | No migration tests                         | Add migration up/down tests                           |
| **Data connectors**         | Unit tests for individual adapters     | No integration tests with real APIs        | Add integration tests with sandbox APIs               |
| **Report generator**        | Unit tests for format generators       | No E2E tests for full generation flow      | Add E2E tests with real templates + Phase 2 data      |
| **Multi-tenancy**           | No dedicated tests                     | No tenant isolation tests                  | Add RLS enforcement tests, cross-tenant leakage tests |

### 4.4 Recommended Test Additions

1. **E2E Pipeline Test**: Full flow from `insight.run` -> BullMQ -> `runIntelligencePipeline` -> result persistence -> `getAIInsights` retrieval
2. **Tenant Isolation Test Suite**: Verify RLS policies, `dbScoped()` enforcement, Redis key scoping, queue tenant scoping
3. **Connector Integration Tests**: Test each connector with sandbox/mock APIs, verify normalization pipeline
4. **Frontend Playwright Tests**: Unskip existing tests, add E2E tests for insight creation, execution, and result viewing
5. **RBAC Test Suite**: Test all permission combinations across roles and procedures
6. **Failure Mode Tests**: Test pipeline behavior with invalid credentials, API failures, LLM timeouts, queue unavailability

---

## Part 5: Execution Priority & Timeline

### Critical Path (Must Complete First)

```
R-01 (Worker DB Access) ──> R-02 (Credential Fetching) ──> R-07 (Insight Queue) ──> R-08 (insight.run)
         │                        │                              │
         v                        v                              v
    R-03 (Seed Creds)        R-04 (Agent Tools)            R-10 (Real-time Status)
                              R-05 (Agent Config)
                              R-06 (Structured Data)
```

### Phase Execution Order

| Phase                        | Items                        | Effort        | Blocks                       |
| ---------------------------- | ---------------------------- | ------------- | ---------------------------- |
| **Phase 1: Foundation**      | R-01, R-02, R-03             | 2.5 dev-weeks | All pipeline execution       |
| **Phase 2: Agent Runtime**   | R-04, R-05, R-06             | 3 dev-weeks   | Data-driven analysis         |
| **Phase 3: API Integration** | R-07, R-08, R-09             | 2.5 dev-weeks | "Run Now" functionality      |
| **Phase 4: Frontend Fixes**  | R-10, R-11, R-12, R-13, R-14 | 1.5 dev-weeks | User experience              |
| **Phase 5: Database**        | R-15, R-16, R-17             | 2 dev-weeks   | Security & data completeness |
| **Phase 6: Bug Fixes**       | R-18 through R-24            | 2 dev-weeks   | Quality & completeness       |

**Total Estimated Effort:** ~13.5 dev-weeks

### Risk Assessment

| Risk                                  | Probability | Impact | Mitigation                                                   |
| ------------------------------------- | ----------- | ------ | ------------------------------------------------------------ |
| LLM API costs during testing          | High        | Medium | Use mock LLM for all tests, real LLM only for E2E validation |
| Connector API rate limits             | Medium      | Medium | Use mock adapters for development, sandbox for testing       |
| RLS migration breaks existing queries | Low         | High   | Test in dev first, add rollback script                       |
| Schema changes break seed data        | Medium      | Medium | Run seed after each schema change, add validation            |
| BullMQ queue complexity               | Medium      | Medium | Start with single queue, add complexity incrementally        |

---

## Appendix A: File Path Reference

### Critical Files Requiring Changes

| File                                                                        | Changes Needed         |
| --------------------------------------------------------------------------- | ---------------------- |
| `apps/api/src/trpc/routers/insights.ts`                                     | R-08, R-09             |
| `apps/api/src/services/report-bullmq.ts`                                    | R-07                   |
| `apps/worker/src/connector-factory.ts`                                      | R-02                   |
| `apps/worker/src/queues/report-queues.ts`                                   | R-07, R-23, R-24       |
| `apps/worker/src/queues/job-types.ts`                                       | R-07                   |
| `apps/worker/src/queues/queue-names.ts`                                     | R-07                   |
| `apps/worker/src/tenant/worker-tenant-als.ts`                               | R-01                   |
| `apps/worker/src/database.ts`                                               | R-01 (new file)        |
| `apps/worker/src/services/credential-store.ts`                              | R-02 (new file)        |
| `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx`           | R-10, R-11, R-13, R-14 |
| `apps/frontend/src/features/insights/api/insight-api.ts`                    | R-10                   |
| `apps/frontend/src/features/insights/ui/audit-trail/AuditTrailTimeline.tsx` | R-12                   |
| `packages/agent-runtime/src/agent-kinds.ts`                                 | R-04, R-05             |
| `packages/agent-runtime/src/intelligence-pipeline.ts`                       | R-06                   |
| `packages/agent-runtime/src/types/pipeline-data.ts`                         | R-06 (new file)        |
| `packages/database/migrations/003_rls_policies_extended.sql`                | R-15 (new file)        |
| `packages/database/src/schema/ai-provider-credentials.ts`                   | R-16                   |
| `packages/database/src/schema/ai-providers.ts`                              | R-16                   |
| `packages/database/src/seeds/audit-seed.ts`                                 | R-17                   |
| `packages/database/src/seeds/platform-credentials-seed.ts`                  | R-03, R-17 (new file)  |
| `packages/database/src/seeds/marketing-metrics-seed.ts`                     | R-17 (new file)        |
| `packages/database/src/seeds/provenance-records-seed.ts`                    | R-17 (new file)        |
| `packages/database/scripts/seed-dev.ts`                                     | R-03, R-17             |
| `packages/types/src/audit-event-types.ts`                                   | R-12 (new file)        |

---

## Appendix B: Business Architecture Alignment Summary

| Business Architecture Section              | Implementation Status | Gaps                                                                      |
| ------------------------------------------ | --------------------- | ------------------------------------------------------------------------- |
| **Section 1: Business Domain**             | Partial               | Value proposition partially delivered due to broken pipeline              |
| **Section 2.1: Tenant Model**              | Partial               | Both tenant types supported but agency features incomplete                |
| **Section 2.2: Entity Relationships**      | Partial               | All entities exist in schema but not all relationships enforced           |
| **Section 2.3: Data Connectors**           | Complete              | 5 connectors implemented, all metrics defined                             |
| **Section 2.4: Insight Configuration**     | Partial               | CRUD works but execution doesn't                                          |
| **Section 3.1: Intelligence Pipeline**     | Broken                | COLLECT -> ANALYZE -> GENERATE -> DELIVER chain broken at multiple points |
| **Section 3.2: Insight Creation Workflow** | Partial               | UI complete, backend partial, execution broken                            |
| **Section 3.3: Agency Partner Workflow**   | Partial               | Multi-tenant management exists but aggregate features broken              |
| **Section 4: Stakeholder Requirements**    | Partial               | All roles defined, RBAC not enforced at API level                         |
| **Section 5: Business Metrics Framework**  | Complete              | All metric categories defined in connectors                               |
| **Section 6: Multi-Tenancy Model**         | Partial               | Isolation at app level, RLS incomplete                                    |
| **Section 7: Business Benefits**           | Partial               | Self-service works, automated delivery partial                            |
| **Section 8: Deployment Flexibility**      | Partial               | Docker compose works, desktop not analyzed                                |
| **Section 9: Success Criteria**            | Not measurable        | Cannot measure without working pipeline                                   |
| **Appendix A: Insight Templates**          | Partial               | AI templates exist but business insight templates not implemented         |

---

**Document End**
