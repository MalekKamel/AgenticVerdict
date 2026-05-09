# Insights Feature - Comprehensive Remediation Plan

## Executive Summary

The `dashboard/insights/` routes have been implemented across listing, creation, detail, editing, and execution flows. However, a thorough analysis reveals **42 gaps** spanning frontend, API, database, and integration layers. This plan provides a prioritized, dependency-ordered remediation strategy to deliver a fully functional, production-ready insights feature.

---

## 1. Gap Inventory

### 1.1 Frontend Gaps (18 items)

| ID  | Route/Area  | Gap                                                                                                                                    | Severity | File(s)                                                                        |
| --- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| F01 | Listing     | No sorting implementation (no sort field, direction, or UI controls)                                                                   | High     | `InsightListPage.tsx`                                                          |
| F02 | Listing     | Domain filter is dead code — state exists but never wired to API or URL                                                                | Medium   | `InsightListPage.tsx`                                                          |
| F03 | Listing     | Pagination not synced to URL — refresh loses position                                                                                  | Medium   | `InsightListPage.tsx`                                                          |
| F04 | Create/Edit | `onManageConnectors` is a no-op (`() => {}`) — clicking "Manage Connectors" does nothing                                               | High     | `ConnectorSelectionStep.tsx`, `InsightCreateWizard.tsx`, `InsightEditPage.tsx` |
| F05 | Detail      | `handleBulkDownload` is dead code — defined but never called                                                                           | Low      | `InsightDetailPage.tsx`                                                        |
| F06 | Detail      | `reportId: ""` hardcoded in AI insights generation — may cause backend issues                                                          | High     | `InsightDetailPage.tsx`                                                        |
| F07 | Wizard      | Step button texts ("Cancel", "Back", "Next", "Create Insight") not i18n-ized                                                           | Medium   | `WizardLayout.tsx`                                                             |
| F08 | Create      | No error boundary wrapper on `InsightCreateWizard` (edit page has one)                                                                 | Medium   | `InsightCreateWizard.tsx`                                                      |
| F09 | Create      | No loading skeleton shown during async connector fetch                                                                                 | Low      | `InsightCreateWizard.tsx`                                                      |
| F10 | Wizard      | `time` field type mismatch — schema uses `z.string()` but edit page does `parseInt()`                                                  | Medium   | `wizard/validation.ts`, `InsightEditPage.tsx`                                  |
| F11 | Wizard      | `selectedConnectorIds` state may drift from form `connectorIds` — separate state sync issue                                            | Medium   | `ConnectorSelectionStep.tsx`, `MetricConfigurationStep.tsx`                    |
| F12 | Listing     | No enable/disable toggle — insights have `enabled` field but no UI to toggle without editing                                           | Medium   | `InsightListPage.tsx`                                                          |
| F13 | Detail      | No connector health status shown on detail page                                                                                        | Low      | `InsightDetailPage.tsx`                                                        |
| F14 | All         | Hardcoded CSS (`border: "1px solid #e9ecef"`) instead of Mantine theme tokens                                                          | Low      | Multiple                                                                       |
| F15 | All         | `confirm()` native dialogs instead of Mantine modals for delete confirmations                                                          | Low      | `InsightListPage.tsx`, `InsightDetailPage.tsx`                                 |
| F16 | API Hooks   | Duplicate hook definitions: `useInsightRun()` vs `useInsightRunMutation()`, `useInsightUpdateMutation()`, `useInsightDeleteMutation()` | Medium   | `insight-api.ts`                                                               |
| F17 | API Hooks   | `useInsightById` exported but never imported anywhere                                                                                  | Low      | `insight-api.ts`                                                               |
| F18 | Tests       | `InsightListPage.test.tsx.skip` and `InsightCreateWizard.integration.test.tsx.skip` — incomplete test coverage                         | Medium   | Test files                                                                     |

### 1.2 API & Backend Gaps (14 items)

| ID  | Area           | Gap                                                                                                     | Severity | File(s)                               |
| --- | -------------- | ------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------- |
| A01 | Router         | `getById` is a duplicate of `detail` — identical implementation, dead code bloat                        | Medium   | `insights.ts:371-454`                 |
| A02 | Router         | No dedicated insight service layer — all CRUD inline in router (other entities have `.service.ts`)      | Medium   | `insights.ts`                         |
| A03 | Router         | `getAuditTrail` input `tenantId` is dead code — query always uses `ctx.tenant.tenantId`                 | Low      | `insights.ts`                         |
| A04 | Auth           | No `INSIGHTS_READ` permission enforcement — all read ops require auth only, not permission              | Medium   | `insights.ts`                         |
| A05 | REST           | REST v1 `/insights` endpoint uses in-memory store, completely disconnected from tRPC/PostgreSQL         | High     | `v1/insights.ts`, `analysis-store.ts` |
| A06 | Validation     | No connector existence validation — `connectorId` not verified against existing connectors              | High     | `insights.ts`                         |
| A07 | Validation     | No unique name constraint handling — DB has unique constraint but API doesn't catch conflict gracefully | Medium   | `insights.ts`                         |
| A08 | Validation     | `aiConfig.model` has no validation — any string accepted, no check that model is supported              | Medium   | `insights.ts`                         |
| A09 | Execution      | `run` doesn't validate insight is enabled — disabled insights can still be manually triggered           | Medium   | `insights.ts`                         |
| A10 | Execution      | No idempotency on `run` — rapid double-clicks enqueue duplicate jobs                                    | High     | `insights.ts`                         |
| A11 | AI Insights    | `getAIInsights` queries `reports` table, `insightId` input parameter is never used in the query         | High     | `insights.ts:996-1007`                |
| A12 | Error Handling | Generic error re-throw — DB constraint violations leak raw error messages to clients                    | Medium   | `insights.ts`                         |
| A13 | Rate Limiting  | No rate limiting on tRPC mutations (REST endpoint has it, tRPC doesn't)                                 | Medium   | `insights.ts`                         |
| A14 | Testing        | No integration tests for tRPC router — only provider validation unit tests exist                        | Medium   | Test files                            |

### 1.3 Database & Schema Gaps (6 items)

| ID  | Area   | Gap                                                                                       | Severity | File(s)                 |
| --- | ------ | ----------------------------------------------------------------------------------------- | -------- | ----------------------- |
| D01 | Schema | `generated_insights` table and `insight_type` enum **NOT in baseline-schema.sql**         | Critical | `baseline-schema.sql`   |
| D02 | Schema | No RLS policy for `generated_insights` — has `tenant_id` but no RLS enablement            | High     | `baseline-schema.sql`   |
| D03 | Schema | No `updated_at` column on `insights` table (other tables have it)                         | Low      | `core/insights.ts`      |
| D04 | Schema | `generated_insights` uses `pgTable` (public schema) while related tables use `coreSchema` | Medium   | `generated-insights.ts` |
| D05 | Schema | No standalone index on `insight_connectors.insight_id` (only composite unique constraint) | Low      | `core/insights.ts`      |
| D06 | Schema | `insight_connectors` RLS enabled but no explicit policy defined                           | Medium   | `baseline-schema.sql`   |

### 1.4 Integration Gaps (12 items)

| ID  | Area          | Gap                                                                                                                        | Severity | File(s)                              |
| --- | ------------- | -------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------ | -------------------------------------------- | ------- | ------------- | ---------- | ---- | ---------------------------------- |
| I01 | Agent Runtime | `metricsStore` never provided to pipeline — database query tools never registered for insight execution                    | Critical | `agent-kinds.ts`, `report-queues.ts` |
| I02 | Agent Runtime | Insight-specific AI config (model/provider/prompt) ignored — pipeline always uses tenant-level provider                    | High     | `report-queues.ts`                   |
| I03 | Agent Runtime | `InsightItem.type` enum mismatch: pipeline uses `"opportunity"                                                             | "risk"   | "observation"                        | "recommendation"`but job types use`"anomaly" | "trend" | "opportunity" | "warning"` | High | `pipeline-data.ts`, `job-types.ts` |
| I04 | Connectors    | No connector health pre-check before insight execution                                                                     | Medium   | `connector-factory.ts`               |
| I05 | Connectors    | `selectedMetrics` and `filters` on insight-connectors stored but never consumed by execution pipeline                      | High     | `report-queues.ts`                   |
| I06 | Connectors    | No per-connector credential refresh logic — OAuth tokens not refreshed automatically                                       | Medium   | `credential-store.ts`                |
| I07 | Connectors    | Mock fallback is silent — missing credentials fall back to `"worker-mock-token"` producing misleading results              | High     | `connector-factory.ts`               |
| I08 | Scheduling    | No scheduled insight execution — `report-schedule` queue exists but no `insight-schedule` despite `InsightSchedule` schema | High     | Queue files                          |
| I09 | Queues        | No job deduplication — multiple `insight.run` calls create separate jobs                                                   | Medium   | `report-queues.ts`                   |
| I10 | Queues        | Queue depth metrics omit `insight-execution` queue — no observability for backlog                                          | Low      | `report-queues.ts`                   |
| I11 | i18n          | `zh.json` and `fr.json` missing entire `insights.*` namespace (~40+ keys)                                                  | Critical | Locale files                         |
| I12 | i18n          | API error messages hardcoded in English, never reference i18n keys                                                         | Medium   | `insights.ts`                        |

---

## 2. Remediation Tasks

### Priority 0 — Critical Blockers

#### P0-1: Fix `generated_insights` missing from baseline schema

- Add `generated_insights` table definition to `packages/database/scripts/baseline-schema.sql`
- Add `insight_type` enum definition
- Add indexes: `generated_insights_tenant_id_created_at_idx`, `generated_insights_report_id_idx`, `generated_insights_analysis_id_idx`
- Add FK constraints for `tenant_id` and `report_id`

#### P0-2: Add RLS policy for `generated_insights`

- Enable RLS on `generated_insights` table in baseline schema
- Add `tenant_isolation_generated_insights` policy
- Add `agency_client_access_generated_insights` policy for agency partners

#### P0-3: Fix `metricsStore` not provided to pipeline

- Wire `metricsStore` into `createPipelineAgentTools()` for insight execution
- Ensure database query tools (`fetch_*_metrics`, `calculate_metrics`, `compute_b2b_kpis_from_snapshots`) are registered
- Verify tools are accessible during `analysis`, `insights`, and `verdict` stages

#### P0-4: Fix `zh.json` and `fr.json` missing insight keys

- Copy all `insights.*` keys from `en.json` to `zh.json` and `fr.json`
- Provide professional translations for all keys
- Verify translation parity test passes

#### P0-5: Fix `getAIInsights` broken query

- Use `insightId` input parameter in the query instead of ignoring it
- Query should filter by `insight_id` from reports or generated_insights table
- Fix the `and()` clause that returns ALL completed reports when `reportId` is not provided

#### P0-6: Fix connector existence validation

- Validate `connectorId` references an existing connector for the tenant before insert
- Return user-friendly error for invalid connector IDs
- Add validation to both `create` and `update` procedures

### Priority 1 — High Priority Features

#### P1-1: Implement insight sorting on list page

- Add sort field and direction state to `InsightListPage`
- Wire sort params to `useInsightList()` API call
- Add sort controls to UI (column headers or sort dropdown)
- Support sorting by: name, createdAt, lastRunAt, status

#### P1-2: Fix `onManageConnectors` no-op

- Implement actual navigation to connector management page
- Use route navigation to `/dashboard/connectors` or open connector management modal
- Pass return URL to allow users to return to insight wizard after managing connectors

#### P1-3: Fix `reportId: ""` hardcoded in AI insights generation

- Determine correct `reportId` from insight's associated reports
- Either fetch latest report for the insight or remove the requirement if not needed
- Update backend to handle `reportId` being optional if appropriate

#### P1-4: Fix `InsightItem.type` enum mismatch

- Reconcile pipeline types (`"opportunity"|"risk"|"observation"|"recommendation"`) with job types (`"anomaly"|"trend"|"opportunity"|"warning"`)
- Create explicit mapping function instead of blind `as` cast
- Update `generated_insights.insight_type` enum to match canonical set

#### P1-5: Implement scheduled insight execution

- Create `insight-schedule` queue or reuse existing scheduling infrastructure
- Process `InsightSchedule` (frequency, time) from insight configuration
- Enqueue insight execution jobs at scheduled times
- Add schedule management UI (enable/disable schedule)

#### P1-6: Fix `selectedMetrics` and `filters` not consumed

- Pass `selectedMetrics` and `filters` from `insight_connectors` to execution pipeline
- Filter metrics fetched by connector adapter based on `selectedMetrics`
- Apply `filters` to data fetching queries

#### P1-7: Add `INSIGHTS_READ` permission enforcement

- Change read procedures from `authedProcedure` to `authedProcedureWithPermission(PERMISSIONS.INSIGHTS_READ)`
- Verify RBAC checks are properly configured for all roles

#### P1-8: Fix mock fallback being silent

- Log warning at higher severity when credentials are missing
- Optionally fail insight execution when running in production mode
- Add configuration flag to control mock fallback behavior

#### P1-9: Add connector health pre-check

- Before executing insight, verify all associated connectors are healthy/connected
- Return early with error if any connector is disconnected
- Display connector health status in UI before allowing execution

#### P1-10: Add idempotency on `run`

- Prevent duplicate job enqueue for the same insight within a time window
- Check if insight already has a running job before enqueueing
- Return existing `jobId` if a job is already in progress

#### P1-11: Fix `aiConfig.model` validation

- Validate model against supported models for the selected provider
- Return user-friendly error for unsupported model/provider combinations
- Use `ProviderFactory` or similar to validate model availability

#### P1-12: Fix unique name constraint handling

- Catch database unique constraint violations on create/update
- Return user-friendly error message ("An insight with this name already exists")
- Map to canonical error code for frontend display

#### P1-13: Fix generic error re-throw

- Normalize database errors to canonical error codes
- Map constraint violations, FK violations, etc. to appropriate error types
- Use error translation utility for user-facing messages

### Priority 2 — Medium Priority Improvements

#### P2-1: Remove duplicate `getById` procedure

- Delete the duplicate `getById` procedure (lines 371-454)
- Update any frontend references to use `detail` instead
- Remove `useInsightById` unused hook from frontend

#### P2-2: Fix domain filter dead code

- Wire `filters.domain` state to `useInsightList()` API call
- Add domain filter to API input schema and query
- Sync domain filter to URL params

#### P2-3: Sync pagination to URL

- Add `page` and `pageSize` to URL search params
- Read pagination state from URL on page load
- Update URL on page change

#### P2-4: i18n-ize wizard step button texts

- Replace hardcoded "Cancel", "Back", "Next", "Create Insight" with `t()` calls
- Add missing i18n keys for wizard navigation
- Verify all locales have translations

#### P2-5: Fix `time` field type mismatch

- Align schema type with actual usage (should be number, not string)
- Update validation schema to use `z.number().int().min(0).max(23)`
- Fix form data transformation in create and edit flows

#### P2-6: Fix `selectedConnectorIds` state drift

- Use form state (`connectorIds`) instead of separate `useState` for connector selection
- Remove duplicate state management
- Ensure metric step reads from form state

#### P2-7: Add error boundary to `InsightCreateWizard`

- Wrap `InsightCreateWizard` with `PageErrorBoundary`
- Consistent error handling with edit page

#### P2-8: Add loading skeleton for connector fetch

- Show skeleton/loading state while connectors are being fetched
- Use Mantine Skeleton component
- Improve perceived performance

#### P2-9: Clean up duplicate API hooks

- Remove `useInsightRunMutation()`, `useInsightUpdateMutation()`, `useInsightDeleteMutation()` duplicates
- Keep single versions of each hook
- Update all references to use canonical hooks

#### P2-10: Add enable/disable toggle to list page

- Add quick toggle switch on insight cards
- Call `insight.update` with `enabled` field
- Invalidate list cache on toggle

#### P2-11: Add connector health status to detail page

- Fetch and display connector health on detail overview tab
- Show health badge per connector
- Link to connector management

#### P2-12: Replace native `confirm()` with Mantine modals

- Use `@mantine/modals` for delete confirmations
- Consistent UI with rest of application
- Add proper styling and localization

#### P2-13: Fix `getAuditTrail` dead `tenantId` input

- Remove unused `tenantId` from input schema
- Query always uses `ctx.tenant.tenantId` — input parameter is misleading

#### P2-14: Add job deduplication

- Check for existing running job before enqueueing
- Use Redis key or database flag for deduplication
- Return existing job status if duplicate detected

#### P2-15: Add rate limiting on tRPC mutations

- Implement rate limiting middleware for tRPC
- Configure appropriate limits for `run`, `create`, `update`
- Return 429 with retry-after header when exceeded

#### P2-16: Add `insight-execution` queue to depth metrics

- Include `INSIGHT_EXECUTION_QUEUE` in `refreshBullmqQueueDepthMetrics`
- Enable observability for insight queue backlog

#### P2-17: Add loading state for create wizard initial data

- Show loading indicator while connector data is being fetched
- Prevent form interaction until data is loaded

#### P2-18: Add connector status on detail page

- Display connector health status in detail view
- Show last sync time and status

### Priority 3 — Low Priority Polish

#### P3-1: Replace hardcoded CSS with Mantine theme tokens

- Replace `border: "1px solid #e9ecef"` with Mantine theme values
- Use `theme.colors.gray` or similar
- Consistent styling across components

#### P3-2: Add `updated_at` column to insights table

- Add `updated_at` timestamptz column with default `now()`
- Update on every modification via trigger or application logic

#### P3-3: Move `generated_insights` to `core` schema

- Change from `pgTable` to `coreSchema` for consistency
- Update all references in codebase
- Update baseline schema

#### P3-4: Add standalone index on `insight_connectors.insight_id`

- Add index for common query pattern "find all connectors for an insight"
- Improve query performance

#### P3-5: Define explicit RLS policy for `insight_connectors`

- Add `tenant_isolation_insight_connectors` policy
- Match pattern used by other core tables

#### P3-6: Add connector health display in wizard

- Show health badge per connector in selection step
- Link to connector detail page

#### P3-7: Add insight templates support

- Implement template selection in wizard (step 1)
- Pre-populate form fields from template
- Template resolution and validation in API

#### P3-8: Add error boundary on all insight pages

- Consistent error handling across all routes
- User-friendly error messages with retry option

#### P3-9: Enable skipped tests

- Fix and enable `InsightListPage.test.tsx.skip`
- Fix and enable `InsightCreateWizard.integration.test.tsx.skip`
- Add integration tests for tRPC router

#### P3-10: Add bulk operations

- Bulk enable/disable insights
- Bulk delete insights
- Bulk run insights

---

## 3. Implementation Order

### Phase 1: Foundation (P0 — Critical Blockers)

**Dependencies: None — can start immediately**

1. **P0-1**: Fix `generated_insights` missing from baseline schema
2. **P0-2**: Add RLS policy for `generated_insights`
3. **P0-3**: Fix `metricsStore` not provided to pipeline
4. **P0-4**: Fix `zh.json` and `fr.json` missing insight keys
5. **P0-5**: Fix `getAIInsights` broken query
6. **P0-6**: Fix connector existence validation

**Verification**: `make db-reset && make db-seed` succeeds, insight execution pipeline has access to metrics tools, all locales have insight keys, AI insights query returns correct data.

### Phase 2: Core Flow Fixes (P1 — High Priority)

**Dependencies: Phase 1 complete**

7. **P1-1**: Implement insight sorting on list page
8. **P1-2**: Fix `onManageConnectors` no-op
9. **P1-3**: Fix `reportId: ""` hardcoded
10. **P1-4**: Fix `InsightItem.type` enum mismatch
11. **P1-5**: Implement scheduled insight execution
12. **P1-6**: Fix `selectedMetrics` and `filters` not consumed
13. **P1-7**: Add `INSIGHTS_READ` permission enforcement
14. **P1-8**: Fix mock fallback being silent
15. **P1-9**: Add connector health pre-check
16. **P1-10**: Add idempotency on `run`
17. **P1-11**: Fix `aiConfig.model` validation
18. **P1-12**: Fix unique name constraint handling
19. **P1-13**: Fix generic error re-throw

**Verification**: All insight routes functional end-to-end, connector integration works, sorting/filtering operational, scheduled execution triggers jobs, error handling robust.

### Phase 3: UX & Cleanup (P2 — Medium Priority)

**Dependencies: Phase 2 complete**

20. **P2-1**: Remove duplicate `getById` procedure
21. **P2-2**: Fix domain filter dead code
22. **P2-3**: Sync pagination to URL
23. **P2-4**: i18n-ize wizard step button texts
24. **P2-5**: Fix `time` field type mismatch
25. **P2-6**: Fix `selectedConnectorIds` state drift
26. **P2-7**: Add error boundary to `InsightCreateWizard`
27. **P2-8**: Add loading skeleton for connector fetch
28. **P2-9**: Clean up duplicate API hooks
29. **P2-10**: Add enable/disable toggle to list page
30. **P2-11**: Add connector health status to detail page
31. **P2-12**: Replace native `confirm()` with Mantine modals
32. **P2-13**: Fix `getAuditTrail` dead `tenantId` input
33. **P2-14**: Add job deduplication
34. **P2-15**: Add rate limiting on tRPC mutations
35. **P2-16**: Add `insight-execution` queue to depth metrics
36. **P2-17**: Add loading state for create wizard
37. **P2-18**: Add connector status on detail page

**Verification**: Clean codebase with no dead code, consistent UI patterns, proper i18n coverage, URL-synced state.

### Phase 4: Polish & Testing (P3 — Low Priority)

**Dependencies: Phase 3 complete**

38. **P3-1**: Replace hardcoded CSS with Mantine theme tokens
39. **P3-2**: Add `updated_at` column to insights table
40. **P3-3**: Move `generated_insights` to `core` schema
41. **P3-4**: Add standalone index on `insight_connectors.insight_id`
42. **P3-5**: Define explicit RLS policy for `insight_connectors`
43. **P3-6**: Add connector health display in wizard
44. **P3-7**: Add insight templates support
45. **P3-8**: Add error boundary on all insight pages
46. **P3-9**: Enable skipped tests
47. **P3-10**: Add bulk operations

**Verification**: `pnpm run typecheck` passes, `pnpm run lint` passes, all tests pass, UI consistent with design system.

---

## 4. Verification Steps

### 4.1 Listing Page

- [ ] Displays insights with correct data (name, status, last run, connectors)
- [ ] Search filters insights by name
- [ ] Status filter works (all, enabled, disabled)
- [ ] Domain filter works and syncs to URL
- [ ] Sorting works (name, createdAt, lastRunAt, status)
- [ ] Pagination works and syncs to URL
- [ ] Enable/disable toggle works without navigating to edit
- [ ] Empty state displays when no insights exist
- [ ] Auto-refresh triggers when any insight is running

### 4.2 Creation Flow

- [ ] 6-step wizard navigates correctly (forward and back)
- [ ] Per-step validation prevents advancing with invalid data
- [ ] Connector selection fetches and displays healthy connectors
- [ ] "Manage Connectors" navigates to connector management
- [ ] Metric configuration shows metrics for selected connectors
- [ ] AI settings validates model against provider
- [ ] Schedule and delivery form validates correctly
- [ ] Review step shows accurate summary
- [ ] Submit creates insight with all data (connectors, aiConfig, schedule, delivery)
- [ ] Success notification displays with correct i18n key
- [ ] Redirects to detail page on success

### 4.3 Detail Page

- [ ] Overview tab shows complete configuration summary
- [ ] Reports tab lists associated reports with pagination
- [ ] History tab shows audit trail timeline
- [ ] "Run Now" triggers execution and shows job status badge
- [ ] Job status polling works (progress updates, stops on terminal status)
- [ ] Edit button navigates to edit page
- [ ] Delete button shows confirmation modal and deletes insight
- [ ] AI insights section shows cached findings and generate button
- [ ] Share modal generates and copies share link
- [ ] Connector health status displayed

### 4.4 Editing Flow

- [ ] Form pre-populates with existing insight data
- [ ] All 6 steps display correct existing values
- [ ] Validation works same as creation
- [ ] Dirty tracking shows "Unsaved changes" badge
- [ ] Reset-to-default works per step
- [ ] Save updates insight with all changes
- [ ] Cancel navigates back with dirty check
- [ ] Success notification displays

### 4.5 Execution & Integration

- [ ] Manual execution (`Run Now`) enqueues job and completes successfully
- [ ] Scheduled execution triggers at configured times
- [ ] Connector metrics and filters are applied during execution
- [ ] AI config (model, provider, prompt) is used during execution
- [ ] Generated insights are persisted to `generated_insights` table
- [ ] PDF report is generated and stored
- [ ] Email delivery works when configured
- [ ] Job status polling returns accurate progress
- [ ] Disabled insights cannot be executed
- [ ] Duplicate execution attempts are deduplicated

### 4.6 API & Backend

- [ ] `insight.list` returns paginated results with correct data
- [ ] `insight.detail` returns single insight with connectors
- [ ] `insight.create` validates input and creates insight
- [ ] `insight.update` validates input and updates insight
- [ ] `insight.delete` soft-deletes with audit trail
- [ ] `insight.run` enqueues job with idempotency
- [ ] `insight.getJobStatus` returns accurate job status
- [ ] `insight.getAIInsights` returns correct insights for insightId
- [ ] `insight.getAuditTrail` returns filtered events
- [ ] All procedures enforce tenant isolation
- [ ] Read procedures enforce `INSIGHTS_READ` permission
- [ ] Write procedures enforce `INSIGHTS_WRITE` permission
- [ ] Delete procedure enforces `INSIGHTS_DELETE` permission
- [ ] Rate limiting prevents abuse
- [ ] Error messages are normalized and user-friendly

### 4.7 Database

- [ ] `generated_insights` table exists in baseline schema
- [ ] RLS policies active on all insight-related tables
- [ ] Unique constraint on `(tenant_id, name)` enforced
- [ ] FK constraints prevent orphaned records
- [ ] Indexes support common query patterns
- [ ] `make db-reset && make db-seed` completes successfully
- [ ] Seed data includes complete insights with connectors

### 4.8 Localization

- [ ] All insight strings localized in en, ar, es, zh, fr
- [ ] No missing keys in any locale
- [ ] Error messages use i18n keys
- [ ] Wizard navigation texts localized
- [ ] Translation parity test passes

### 4.9 Code Quality

- [ ] `pnpm run typecheck` passes with zero errors
- [ ] `pnpm run lint` passes with zero errors
- [ ] No duplicate hook definitions
- [ ] No dead code (unused exports, unreachable code)
- [ ] No hardcoded CSS (uses Mantine theme tokens)
- [ ] No native `confirm()` dialogs
- [ ] All tests enabled and passing

---

## 5. Files to Modify

| File                                                                             | Change Type                                                      | Priority |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------- |
| `packages/database/scripts/baseline-schema.sql`                                  | Add generated_insights table, RLS policies                       | P0       |
| `packages/database/src/schema/generated-insights.ts`                             | Move to core schema                                              | P3       |
| `packages/database/src/schema/core/insights.ts`                                  | Add updated_at, index on insight_connectors                      | P2, P3   |
| `apps/api/src/trpc/routers/insights.ts`                                          | Fix queries, add validation, remove duplicates, normalize errors | P0-P2    |
| `apps/api/src/routes/v1/insights.ts`                                             | Replace in-memory store with tRPC/DB calls                       | P1       |
| `apps/worker/src/queues/report-queues.ts`                                        | Wire metricsStore, consume filters, add scheduling               | P0-P1    |
| `packages/agent-runtime/src/agent-kinds.ts`                                      | Provide metricsStore to pipeline                                 | P0       |
| `packages/agent-runtime/src/intelligence-pipeline.ts`                            | Fix type mismatch                                                | P1       |
| `apps/frontend/src/features/insights/pages/InsightListPage.tsx`                  | Add sorting, domain filter, pagination sync, toggle              | P1-P2    |
| `apps/frontend/src/features/insights/pages/InsightCreateWizard.tsx`              | Add error boundary, loading state, fix Manage Connectors         | P1-P2    |
| `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx`                | Fix reportId, add connector health, bulk download                | P1-P2    |
| `apps/frontend/src/features/insights/pages/InsightEditPage.tsx`                  | Fix time type, state drift, connector health                     | P2       |
| `apps/frontend/src/features/insights/ui/WizardLayout.tsx`                        | i18n-ize button texts                                            | P2       |
| `apps/frontend/src/features/insights/ui/wizard/steps/ConnectorSelectionStep.tsx` | Fix Manage Connectors, state drift                               | P1-P2    |
| `apps/frontend/src/features/insights/api/insight-api.ts`                         | Remove duplicate hooks, clean up exports                         | P2       |
| `apps/frontend/src/features/insights/schemas.ts`                                 | Fix time field type                                              | P2       |
| `apps/i18n/locales/zh.json`                                                      | Add missing insights.\* keys                                     | P0       |
| `apps/i18n/locales/fr.json`                                                      | Add missing insights.\* keys                                     | P0       |
| `apps/worker/src/connector-factory.ts`                                           | Fix mock fallback, add health check                              | P1       |
| `apps/worker/src/services/credential-store.ts`                                   | Add credential refresh logic                                     | P1       |
| `packages/types/src/insight.ts`                                                  | Add validation schemas if missing                                | P1       |

---

## 6. Risk Assessment

| Risk                                                      | Impact            | Mitigation                                              |
| --------------------------------------------------------- | ----------------- | ------------------------------------------------------- |
| `metricsStore` wiring breaks existing pipeline            | Medium            | Test pipeline with and without metricsStore             |
| Schema changes require db-reset                           | None (greenfield) | No production data exists                               |
| Scheduling infrastructure conflicts with report-schedule  | Low               | Use separate queue or consolidate scheduling logic      |
| Type mismatch fix breaks existing generated_insights data | Low               | Greenfield — data will be regenerated                   |
| Rate limiting blocks legitimate usage                     | Medium            | Configure generous limits, monitor usage                |
| i18n translations inaccurate                              | Low               | Use professional translation, review by native speakers |

---

## 7. Success Criteria

- [ ] All insight routes fully functional end-to-end (listing, creation, detail, editing, execution)
- [ ] Connector integration works correctly throughout all flows
- [ ] Insight listing displays correctly with filtering, sorting, and pagination
- [ ] Insight detail page shows complete information with actionable controls
- [ ] Insight editing pre-populates and saves changes correctly
- [ ] Insight execution/run functionality works from all entry points
- [ ] Scheduled execution triggers at configured times
- [ ] Zero type errors, lint violations, or runtime failures
- [ ] Complete tenant isolation and authorization enforcement
- [ ] Full localization coverage (en, ar, es, zh, fr)
- [ ] All tests enabled and passing
- [ ] No dead code, duplicate definitions, or unused exports
- [ ] Consistent UI patterns (Mantine modals, theme tokens, error boundaries)
