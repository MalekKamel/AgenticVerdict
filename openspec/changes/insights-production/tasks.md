## 1. Backend API Updates

- [x] 1.1 Add `status`, `lastRunAt`, `lastRunStatus`, and `domain` fields to insight response schema
- [x] 1.2 Implement `connector.getMetrics` tRPC endpoint returning available metrics per connector
- [x] 1.3 Update insight list query to populate execution status from recent job executions
- [x] 1.4 Add domain field to insight database schema and backfill existing records
- [x] 1.5 Implement worker trigger for AI insights auto-generation on report completion

## 2. Connector Metrics Integration

- [x] 2.1 Create `useConnectorMetrics` hook in `features/connectors/api/connector-api.ts`
- [x] 2.2 Update `InsightCreateWizard` to fetch metrics when connectors are selected
- [x] 2.3 Update `MetricConfigurationStep` to display dynamic metrics with loading/error states
- [x] 2.4 Add validation requiring at least one metric per connector
- [x] 2.5 Update `InsightEditPage` to load and display connector metrics

## 3. Execution State Implementation

- [x] 3.1 Update `InsightListItem` type with `status`, `lastRunAt`, `lastRunStatus` fields
- [x] 3.2 Update `InsightListPage` to display running indicator and disable "Run Now" during execution
- [x] 3.3 Add status badge component with variants (idle/running/completed/failed)
- [x] 3.4 Implement React Query polling (5s interval) for running insights
- [x] 3.5 Update `InsightDetailPage` PageHeader with running status and last run timestamp
- [x] 3.6 Add "Never run" state for insights without execution history

## 4. Type Safety for JSONB Fields

- [x] 4.1 Define `InsightAIConfig` interface and Zod schema
- [x] 4.2 Define `InsightSchedule` interface and Zod schema
- [x] 4.3 Define `InsightDelivery` interface and Zod schema
- [x] 4.4 Define `InsightConnector` interface and Zod schema
- [x] 4.5 Create runtime type guards for API responses
- [x] 4.6 Replace all `as` type assertions in `InsightListPage.tsx`
- [x] 4.7 Replace all `as` type assertions in `InsightDetailPage.tsx`
- [x] 4.8 Replace all `as` type assertions in `InsightEditPage.tsx`
- [x] 4.9 Replace all `as` type assertions in `ReportListPage.tsx`
- [x] 4.10 Verify TypeScript strict mode passes with zero errors

## 5. Toast Notifications

- [x] 5.1 Import notification utilities in all insight pages
- [x] 5.2 Add success/error toasts to `useInsightCreate` mutation
- [x] 5.3 Add success/error toasts to `useInsightUpdate` mutation
- [x] 5.4 Add success/error toasts to `useInsightDelete` mutation
- [x] 5.5 Add success/error toasts to `useInsightRun` mutation
- [x] 5.6 Add success/error toasts to `useReportDelete` mutation
- [x] 5.7 Add success/error toasts to `useReportDeleteMany` mutation
- [x] 5.8 Verify toast auto-dismiss after 5 seconds
- [x] 5.9 Verify Arabic localization for toasts

## 6. Report Actions Wiring

- [x] 6.1 Implement `handleViewReport` navigation handler in `InsightDetailPage.tsx`
- [x] 6.2 Implement `handleDownloadReport` download handler with blob creation
- [x] 6.3 Implement `handleShareReport` modal opener in `InsightDetailPage.tsx`
- [x] 6.4 Wire View button in `ReportListPage.tsx` to navigate to report viewer
- [x] 6.5 Wire Download button in `ReportListPage.tsx` to trigger download
- [x] 6.6 Wire Share button in `ReportListPage.tsx` to open share modal
- [x] 6.7 Verify actions work from both insight detail overview and reports tab

## 7. Bulk Download Implementation

- [x] 7.1 Install JSZip library (`pnpm add jszip`)
- [x] 7.2 Implement `handleBulkDownload` function with ZIP folder creation
- [x] 7.3 Add parallel report fetching with progress tracking
- [x] 7.4 Implement ZIP file generation and download trigger
- [x] 7.5 Add loading state for large downloads (3+ reports)
- [x] 7.6 Add 10-report limit enforcement with warning message
- [x] 7.7 Add error handling for failed report downloads
- [x] 7.8 Test bulk download with various report counts

## 8. Error Handling Improvements

- [x] 8.1 Import error translator in all insight pages
- [x] 8.2 Update error states to display translated error messages with error codes
- [x] 8.3 Add error boundaries around `InsightListPage` component
- [x] 8.4 Add error boundaries around `InsightDetailPage` component
- [x] 8.5 Add error boundaries around `InsightEditPage` component
- [x] 8.6 Verify error messages are user-friendly and actionable
- [x] 8.7 Verify error codes are displayed for support tickets
- [x] 8.8 Verify errors are logged with tenant context

## 9. Domain Extraction and Display

- [x] 9.1 Remove hardcoded domain from `InsightEditPage.tsx`
- [x] 9.2 Update insight cards to display domain from backend
- [x] 9.3 Add domain filter to list page (if filtering exists)
- [x] 9.4 Verify domain displays correctly in all insight views

## 10. AI Insights Auto-Generation

- [x] 10.1 Verify worker triggers AI generation on report completion
- [x] 10.2 Add React Query invalidation for AI insights card on report completion
- [x] 10.3 Add loading state during AI insights generation
- [x] 10.4 Verify manual trigger button still functional
- [x] 10.5 Test end-to-end: run report → auto-generate insights → display

## 11. Testing

- [x] 11.1 Write unit tests for `useConnectorMetrics` hook
- [x] 11.2 Write unit tests for status badge component
- [x] 11.3 Write unit tests for Zod schema validation
- [x] 11.4 Write unit tests for error translator
- [x] 11.5 Write integration tests for wizard flow with API data
- [x] 11.6 Write integration tests for report actions (view/download/share)
- [x] 11.7 Write integration tests for bulk operations
- [x] 11.8 Write E2E test: create insight end-to-end
- [x] 11.9 Write E2E test: edit insight and save
- [x] 11.10 Write E2E test: run insight and view report
- [x] 11.11 Write E2E test: share report and access via token
- [x] 11.12 Write E2E test: delete insight and verify removal
- [x] 11.13 Run accessibility tests (keyboard navigation, screen reader)
- [x] 11.14 Verify 70%+ coverage overall, 85%+ business logic

## 12. Code Quality and Deployment

- [x] 12.1 Run `pnpm run lint` and fix all violations
- [x] 12.2 Run `pnpm run typecheck` and resolve all errors
- [x] 12.3 Run `pnpm run test:unit` and ensure all tests pass
- [x] 12.4 Code review with team (2-4 hours)
- [x] 12.5 Security review for tenant isolation and data access
- [x] 12.6 Deploy to staging behind `ENABLE_INSIGHTS_UI` feature flag
- [x] 12.7 Manual QA pass in staging environment
- [x] 12.8 Deploy to production with feature flag off initially
- [x] 12.9 Enable feature flag for beta users
- [x] 12.10 Monitor error logs and performance metrics
- [x] 12.11 Full rollout after validation
