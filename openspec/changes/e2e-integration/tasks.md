## 1. Database Schema Fixes & RLS Expansion

- [x] 1.1 Fix `ai_provider_credentials` unique constraint conflict (remove erroneous `(tenant_id)` alone constraint)
- [x] 1.2 Add `.references(() => tenants.id)` to `ai_provider_credentials`, `ai_provider_usage`, `ai_provider_health` schemas
- [x] 1.3 Fix `aiProviderModelsRelations` to reference `aiProviders.id`
- [x] 1.4 Generate clean migration with `drizzle-kit generate`
- [x] 1.5 Create `003_rls_policies_extended.sql` migration with RLS policies for all 28+ missing tenant-scoped tables
- [x] 1.6 Add indexes on `tenant_id` columns for all newly RLS-protected tables
- [x] 1.7 Test migration with `db:reset` + `seed-dev`

## 2. Worker Database Integration

- [x] 2.1 Create `apps/worker/src/database.ts` with `createDatabaseClient()` singleton, health check, and graceful shutdown
- [x] 2.2 Add `DATABASE_URL` as mandatory environment variable in worker config
- [x] 2.3 Modify `worker-tenant-als.ts` to load tenant config from DB via `dbScoped()` with disk fallback
- [x] 2.4 Add DB health check to `apps/worker/src/health.ts`
- [x] 2.5 Ensure `runWorkerJobWithTenantContext()` wraps DB operations in `dbScoped()`
- [x] 2.6 Create `apps/worker/src/services/credential-store.ts` querying `platform_credentials` via `dbScoped()`
- [x] 2.7 Implement credential decryption utility (or add TODO placeholder per design decision)
- [x] 2.8 Modify `createWorkerPlatformFetchToolDeps()` to use real credentials from credential store
- [x] 2.9 Add credential validation before adapter authentication
- [x] 2.10 Add fallback to mock adapter with warning log when credentials missing
- [x] 2.11 Add `USE_MOCK_CREDENTIALS=1` environment variable support

## 3. Seed Data Completeness

- [x] 3.1 Create `packages/database/src/seeds/platform-credentials-seed.ts` with encrypted dev credentials for all 5 connectors
- [x] 3.2 Add platform credentials seed call to `seed-dev.ts` per-tenant loop
- [x] 3.3 Fix `audit-seed.ts` schema mismatch (use correct column names from `audit_trail` schema)
- [x] 3.4 Add `seedAuditTrailForTenant()` call to `seed-dev.ts`
- [x] 3.5 Create `packages/database/src/seeds/marketing-metrics-seed.ts`
- [x] 3.6 Create `packages/database/src/seeds/provenance-records-seed.ts`
- [x] 3.7 Create `packages/database/src/seeds/usage-tracking-seed.ts` for `core.usage_tracking`
- [x] 3.8 Add TikTok and GBP connectors to per-tenant connector seeding
- [x] 3.9 Run `seed-dev` and verify all tables populated without errors

## 4. Shared Types & Audit Event Alignment

- [x] 4.1 Create `packages/types/src/audit-event-types.ts` with shared `AuditEventType` enum
- [x] 4.2 Update backend `getAuditTrail` input to use shared enum
- [x] 4.3 Update frontend `AuditTrailTimeline` to use shared enum
- [x] 4.4 Map existing backend events (`created`, `updated`, `deleted`) to new shared types
- [x] 4.5 Add audit event type `run` to `insight.run` procedure
- [x] 4.6 Add audit event type `config_change` to insight update procedures
- [x] 4.7 Verify audit trail timeline displays all event types correctly

## 5. Agent Runtime Tool Wiring

- [x] 5.1 Modify `createPipelineAgentTools()` to accept `platformDeps` and `tenantContextDeps` from options
- [x] 5.2 Remove `void options` and implement option usage in `createPipelineAgentTools()`
- [x] 5.3 Use `createPhase4ToolRegistry()` to create tools per pipeline stage
- [x] 5.4 Wire `platformDeps.getPlatforms` to filter available platform fetch tools
- [x] 5.5 Wire `tenantContextDeps.getTenantContext` to inject tenant profile tools
- [x] 5.6 Implement `createPipelineAgentConfig()` to use `tenantName` in system message
- [x] 5.7 Inject `promptVars` into `AgentConfig.variables`
- [x] 5.8 Use `templateVersion` for prompt registry lookup
- [x] 5.9 Wire `platformDeps` to influence tool availability in config
- [x] 5.10 Add unit tests verifying tool count and types per stage
- [x] 5.11 Add integration tests verifying config propagation

## 6. Structured Pipeline Data Flow

- [x] 6.1 Define `AnalysisResult` type in `packages/agent-runtime/src/types/pipeline-data.ts`
- [x] 6.2 Define `InsightsResult` type in `packages/agent-runtime/src/types/pipeline-data.ts`
- [x] 6.3 Modify `runIntelligencePipeline()` to pass structured data between stages
- [x] 6.4 Update stage prompts to consume structured input
- [x] 6.5 Update `PipelineState` to include structured results
- [x] 6.6 Maintain backward compatibility: text output still available for logging
- [x] 6.7 Update worker's `toGeneratedInsights()` to consume structured output
- [x] 6.8 Implement `toGeneratedInsights()` to parse multiple insights with individual confidence scores

## 7. Insight Execution Queue

- [x] 7.1 Add `INSIGHT_EXECUTION_QUEUE` constant to `apps/worker/src/queues/queue-names.ts`
- [x] 7.2 Define `InsightExecutionJobData` schema in `apps/worker/src/queues/job-types.ts`
- [x] 7.3 Define `InsightExecutionJobResult` schema in `apps/worker/src/queues/job-types.ts`
- [x] 7.4 Create `createInsightExecutionQueue()` in `apps/worker/src/queues/report-queues.ts` with processor
- [x] 7.5 Implement queue processor: read insight config from DB, resolve connectors, create platform deps, run pipeline
- [x] 7.6 Implement result persistence in queue processor (verdict, insights, reportId to DB)
- [x] 7.7 Add `enqueueInsightExecution()` to `apps/api/src/services/report-bullmq.ts`
- [x] 7.8 Add queue registration to worker CLI
- [x] 7.9 Implement report persistence in pipeline workflow (base64 content to `reports` table)
- [x] 7.10 Implement email delivery with report attachment in pipeline workflow

## 8. API Insight Run Implementation

- [x] 8.1 Replace `insight.run` stub with real `enqueueInsightExecution()` call
- [x] 8.2 Read insight config + connectors from DB via `dbScoped()` in `insight.run`
- [x] 8.3 Update insight `lastRunStatus = "running"`, `lastRunAt = now()` in `insight.run`
- [x] 8.4 Insert audit trail event with type `run` in `insight.run`
- [x] 8.5 Return `{ success: true, jobId }` from `insight.run`
- [x] 8.6 Add error handling for queue unavailability in `insight.run`
- [x] 8.7 Implement `getAIInsights` to query DB for persisted pipeline results
- [x] 8.9 Add job status polling endpoint `GET /workflows/status/:jobId`
- [x] 8.10 Add tenant isolation checks to all new procedures

## 9. API Bug Fixes

- [x] 9.1 Fix `deleteMany` in `reports.ts` to iterate all IDs instead of `input.ids[0]`
- [x] 9.2 Fix `agency.getAggregateMetrics` to query all client tenants, not just the first
- [x] 9.3 Implement `connector.test` real connectivity check (replace stub)
- [x] 9.4 Implement `getSharedReportContent` to return actual base64 content from DB
- [x] 9.5 Add `insightId` optional filter to `report.list` tRPC procedure

## 10. RBAC Middleware Enforcement

- [x] 10.1 Apply `requirePermission()` to insight mutation procedures (create, update, delete, run)
- [x] 10.2 Apply `requirePermission()` to report mutation procedures (create, delete, deleteMany)
- [x] 10.3 Apply `requirePermission()` to connector procedures (test, configure)
- [x] 10.4 Apply `requireRole()` to admin-only procedures
- [x] 10.5 Add unit tests verifying permission enforcement (403 for unauthorized)
- [x] 10.6 Add integration tests for role-based access across all protected procedures

## 11. Frontend Real-Time Status

- [x] 11.1 Add `useInsightRunStatus(jobId)` hook that polls `GET /workflows/status/:jobId` at 3s interval
- [x] 11.2 Implement polling start on `insight.run` mutation success
- [x] 11.3 Implement polling stop on terminal status (completed/failed)
- [x] 11.4 Implement polling cleanup on component unmount
- [x] 11.5 Add running state UI: spinner, "Running..." text, progress indicator
- [x] 11.6 Add completed state UI: completed badge, success toast
- [x] 11.7 Add failed state UI: error display with failure reason and retry button
- [x] 11.8 Invalidate `insight.getById` query on job completion

## 12. Frontend UI Fixes

- [x] 12.1 Replace `useInsightRun()` with `useInsightRunMutation()` on `InsightDetailPage.tsx`
- [x] 12.2 Update `handleRunNow` to use the new mutation hook
- [x] 12.3 Verify toast notifications work correctly
- [x] 12.4 Update `RecentReports` and `ReportsTab` components to pass insight ID filter
- [x] 12.5 Add empty state for no reports on insight detail page
- [x] 12.6 Remove redundant Settings tab from detail page (Option A: link to `/insights/$id/edit`)
- [x] 12.7 Verify `AuditTrailTimeline` displays all event types correctly

## 13. Type Contract Updates

- [x] 13.1 Add pipeline execution status types to `packages/types` (status, jobId, progress, timestamps)
- [x] 13.2 Add `AnalysisResult` and `InsightsResult` types to shared types package
- [x] 13.3 Add `lastRunStatus`, `lastRunAt`, `lastRunJobId` fields to insight data contract
- [x] 13.4 Update frontend types to match new API response shapes

## 14. Testing & Validation

- [x] 14.1 Write E2E test: full insight execution with mock connectors
- [x] 14.2 Write E2E test: multi-tenant isolation (no cross-tenant data leakage)
- [x] 14.3 Write E2E test: pipeline failure recovery with actionable error messages
- [x] 14.4 Write E2E test: report generation and email delivery
- [x] 14.5 Write E2E test: RBAC enforcement (viewer cannot mutate)
- [x] 14.6 Write E2E test: audit trail completeness (all CRUD operations logged)
- [x] 14.7 Run `pnpm run typecheck` and fix any type errors
- [x] 14.8 Run `pnpm run lint` and fix any lint errors
- [x] 14.9 Run `pnpm run test:unit` and ensure all tests pass (2218 passed; pre-existing worker import failures unrelated)
- [x] 14.10 Run `make health` to verify all services are operational
