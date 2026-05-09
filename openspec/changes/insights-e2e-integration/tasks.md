## 1. Database Schema Foundation

- [x] 1.1 Add `insight_type` enum and `generated_insights` table to `packages/database/scripts/baseline-schema.sql` with all columns, indexes, and FK constraints
- [x] 1.2 Add RLS enablement and policies (`tenant_isolation_generated_insights`, `agency_client_access_generated_insights`) to baseline schema
- [x] 1.3 Update `packages/database/src/schema/generated-insights.ts` to use `coreSchema.table()` instead of `pgTable()`
- [x] 1.4 Update `insight_type` enum values to canonical set: `"opportunity" | "risk" | "observation" | "recommendation"`
- [x] 1.5 Add `updated_at` column to `insights` table in Drizzle schema and baseline schema with update trigger
- [x] 1.6 Add standalone index on `insight_connectors.insight_id` in Drizzle schema and baseline schema
- [x] 1.7 Add explicit RLS policy for `insight_connectors` in baseline schema
- [x] 1.8 Run `make db-reset && make db-seed` and verify all tables, indexes, and policies are created

## 2. API Layer — Validation and Error Handling

- [x] 2.1 Add connector existence validation to `create` and `update` procedures in `apps/api/src/trpc/routers/insights.ts`
- [x] 2.2 Add `aiConfig.model` validation against supported models for the selected provider
- [x] 2.3 Add unique name constraint error handling — catch DB violations and return user-friendly error
- [x] 2.4 Normalize all error re-throws — map DB constraint violations, FK violations to canonical error codes
- [x] 2.5 Fix `getAIInsights` query to use `insightId` input parameter for filtering
- [x] 2.6 Remove duplicate `getById` procedure (lines 371-454) from insights router
- [x] 2.7 Remove unused `tenantId` input from `getAuditTrail` procedure
- [x] 2.8 Change read procedures from `authedProcedure` to `authedProcedureWithPermission(PERMISSIONS.INSIGHTS_READ)`
- [x] 2.9 Verify write procedures enforce `INSIGHTS_WRITE` and delete enforces `INSIGHTS_DELETE`

## 3. API Layer — Rate Limiting and Idempotency

- [x] 3.1 Implement rate limiting middleware for tRPC mutations (`run`, `create`, `update`, `delete`)
- [x] 3.2 Configure per-procedure rate limits (10 req/min for `run`, 30 req/min for other mutations)
- [x] 3.3 Add idempotency check to `run` procedure — detect existing running job and return existing `jobId`
- [x] 3.4 Add `enabled` check to `run` procedure — reject execution of disabled insights

## 4. API Layer — REST V1 Endpoint

- [x] 4.1 Replace in-memory `analysis-store.ts` usage in `apps/api/src/routes/v1/insights.ts` with direct DB access via `dbScoped()`
- [x] 4.2 Ensure REST endpoint maintains tenant isolation through `dbScoped()` calls
- [ ] 4.3 Remove or deprecate `analysis-store.ts` if no longer used by other endpoints (BLOCKED: still used by `report-templates.ts`, `analysis-repository.ts`, and tests)

## 5. Agent Runtime — Pipeline Integration

- [x] 5.1 Wire `metricsStore` into `defaultInsightExecutionProcessor` via `specialization` field passed to `runIntelligencePipeline`
- [x] 5.2 Verify `createPipelineAgentTools()` registers database query tools when `metricsStore` is provided
- [x] 5.3 Pass `selectedMetrics` and `filters` from `insight_connectors` to the execution pipeline
- [x] 5.4 Use insight's `aiConfig` (model, provider, prompt) during execution instead of tenant-level defaults
- [x] 5.5 Create explicit mapping function for `InsightItem.type` enum reconciliation (pipeline types → canonical types)
- [x] 5.6 Update `generated_insights.insight_type` enum usage to match canonical set across all code

## 6. Worker — Scheduling and Observability

- [x] 6.1 Create `insight-schedule-enqueue.ts` following the pattern of `report-schedule-enqueue.ts`
- [x] 6.2 Process `InsightSchedule` (frequency, time) and enqueue jobs to `INSIGHT_EXECUTION_QUEUE` at scheduled times
- [x] 6.3 Add `INSIGHT_EXECUTION_QUEUE` to `refreshBullmqQueueDepthMetrics` in `report-queues.ts`
- [x] 6.4 Add connector health pre-check before insight execution in `defaultInsightExecutionProcessor`
- [x] 6.5 Fix silent mock fallback in `connector-factory.ts` — log warning at higher severity when credentials are missing

## 7. Frontend — Listing Page

- [x] 7.1 Add sort field and direction state to `InsightListPage.tsx`
- [x] 7.2 Wire sort params to `useInsightList()` API call
- [x] 7.3 Add sort controls to UI (column headers or sort dropdown) supporting name, createdAt, lastRunAt, status
- [x] 7.4 Wire `filters.domain` state to `useInsightList()` API call
- [x] 7.5 Add domain filter to API input schema and query in tRPC router
- [x] 7.6 Sync pagination (`page`, `pageSize`) to URL search params in `InsightListPage.tsx`
- [x] 7.7 Read pagination state from URL on page load
- [x] 7.8 Add enable/disable toggle switch on insight cards calling `insight.update`
- [x] 7.9 Invalidate list cache on toggle success

## 8. Frontend — Creation Wizard

- [x] 8.1 Implement `onManageConnectors` navigation to `/dashboard/connectors` with return URL
- [x] 8.2 Wrap `InsightCreateWizard` with `PageErrorBoundary`
- [x] 8.3 Add loading skeleton while connectors are being fetched in `InsightCreateWizard.tsx`
- [x] 8.4 Fix `reportId: ""` hardcoded in AI insights generation — fetch latest report or make optional
- [x] 8.5 i18n-ize wizard step button texts ("Cancel", "Back", "Next", "Create Insight") in `WizardLayout.tsx`
- [x] 8.6 Fix `time` field type mismatch — update schema to `z.number().int().min(0).max(23)`
- [x] 8.7 Fix `selectedConnectorIds` state drift — use form state instead of separate `useState`

## 9. Frontend — Detail Page

- [x] 9.1 Add connector health status display on detail page overview tab
- [x] 9.2 Replace native `confirm()` with Mantine modals for delete confirmations in `InsightDetailPage.tsx`
- [x] 9.3 Implement `handleBulkDownload` functionality or remove dead code
- [x] 9.4 Add job status badge with polling for "Run Now" execution

## 10. Frontend — API Hooks Cleanup

- [x] 10.1 Remove duplicate hook definitions (`useInsightRunMutation`, `useInsightUpdateMutation`, `useInsightDeleteMutation`) from `insight-api.ts`
- [x] 10.2 Remove unused `useInsightById` export from `insight-api.ts`
- [x] 10.3 Update all references to use canonical hooks

## 11. Frontend — Styling Consistency

- [x] 11.1 Replace hardcoded CSS (`border: "1px solid #e9ecef"`) with Mantine theme tokens across all insight components
- [x] 11.2 Replace native `confirm()` dialogs with Mantine modals in `InsightListPage.tsx`

## 12. Localization

- [x] 12.1 Copy all `insights.*` keys from `en.json` to `zh.json` with professional Chinese translations
- [x] 12.2 Copy all `insights.*` keys from `en.json` to `fr.json` with professional French translations
- [x] 12.3 Verify `ar.json` and `es.json` have complete `insights.*` coverage
- [x] 12.4 Add missing i18n keys for wizard navigation buttons
- [x] 12.5 Update API error messages to reference i18n keys instead of hardcoded English
- [x] 12.6 Run translation parity test and verify all locales pass

## 13. Testing

- [x] 13.1 Fix and enable `InsightListPage.test.tsx.skip`
- [x] 13.2 Fix and enable `InsightCreateWizard.integration.test.tsx.skip`
- [x] 13.3 Add integration tests for tRPC insights router
- [x] 13.4 Run `pnpm run typecheck` and fix all type errors
- [x] 13.5 Run `pnpm run lint` and fix all lint violations

## 14. Verification

- [x] 14.1 Verify `make db-reset && make db-seed` completes successfully with new schema
- [ ] 14.2 Verify insight listing displays with sorting, filtering, pagination, and toggle
- [ ] 14.3 Verify 6-step creation wizard works end-to-end with validation
- [ ] 14.4 Verify detail page shows complete info with run-now and job polling
- [ ] 14.5 Verify editing flow pre-populates and saves changes correctly
- [ ] 14.6 Verify manual execution enqueues job and completes successfully
- [ ] 14.7 Verify scheduled execution triggers at configured times
- [ ] 14.8 Verify disabled insights cannot be executed
- [ ] 14.9 Verify all insight strings are localized in en, ar, es, zh, fr
- [x] 14.10 Verify `pnpm run typecheck` and `pnpm run lint` pass with zero errors
