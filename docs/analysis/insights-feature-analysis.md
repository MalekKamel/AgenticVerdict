# Insights Feature Analysis Report

**Generated:** 2026-05-04  
**Feature Path:** `apps/frontend/src/features/insights/`  
**Related Features:** `apps/frontend/src/features/reports/`  
**Reference Spec:** `/docs/architecture/ui/04-pages/insights-reports.md`

---

## Executive Summary

The Insights & Reports feature implementation is **substantially complete** with all major pages and components implemented. However, several critical gaps exist that prevent production readiness:

- **Mocked/Stubbed Data:** Metric configuration step receives empty `connectorMetrics` array
- **Missing Toast Notifications:** Multiple mutation success/error handlers have TODO comments
- **Incomplete Action Handlers:** Download, share, view buttons lack wired implementations
- **Missing Running State:** Insight execution status not tracked or displayed
- **Hardcoded Values:** Domain extraction, time formatting, and status indicators use hardcoded logic
- **Limited Error Handling:** Generic error messages without canonical error system integration

**Overall Assessment:** 75% complete. Requires 2-3 days of focused remediation for production readiness.

---

## 1. Missing Functionality

### 1.1 Metric Configuration (CRITICAL)

**Location:** `InsightCreateWizard.tsx:185`, `InsightEditPage.tsx:309`

**Issue:** `MetricConfigurationStep` receives empty `connectorMetrics` array:

```typescript
<MetricConfigurationStep connectorMetrics={[]} />
```

**Impact:** Users cannot select metrics for connectors, blocking insight creation.

**Root Cause:** No API hook exists to fetch available metrics per connector type. The spec requires dynamic metric loading based on selected connectors.

**Required Fix:**

- Create `useConnectorMetrics` hook in `features/connectors/api/`
- Fetch metrics based on selected connector IDs
- Pass populated `connectorMetrics` to step component

---

### 1.2 Running State Tracking (HIGH)

**Location:** `InsightListPage.tsx:48`, `InsightDetailPage.tsx:585`

**Issue:** Running state is hardcoded to `false`:

```typescript
const isRunning = false; // API doesn't provide running state yet
```

**Impact:** Users cannot see if an insight is currently executing. Multiple "Run Now" clicks may occur.

**Required Fix:**

- Add `status` or `isRunning` field to `InsightListItem` type
- Update tRPC router to include execution state
- Display spinner indicator during execution
- Disable "Run Now" button while running

---

### 1.3 Last Run Timestamp (MEDIUM)

**Location:** `InsightListPage.tsx:49`

**Issue:** Last run timestamp commented out:

```typescript
const _lastRunAt = null; // API doesn't provide last run yet
```

**Impact:** Users cannot see when insights last executed.

**Required Fix:**

- Add `lastRunAt` field to insight schema
- Populate from report generation timestamps
- Display in insight cards

---

### 1.4 Bulk Download Implementation (MEDIUM)

**Location:** `ReportListPage.tsx:288`

**Issue:** Bulk download is stubbed:

```typescript
const handleBulkDownload = () => {
  // TODO: Implement bulk download with zip creation
  console.log("Bulk download:", Array.from(selectedReports));
};
```

**Impact:** Users cannot download multiple reports simultaneously.

**Required Fix:**

- Implement JSZip integration
- Fetch all selected report contents
- Create and download zip file
- Add progress indicator for large downloads

---

### 1.5 Report Actions Not Wired (HIGH)

**Location:** `InsightDetailPage.tsx:262-267`, `ReportListPage.tsx:434-445`

**Issue:** View/Download/Share buttons lack handlers:

```typescript
<Button variant="outline" size="sm">
  {t("detail.overview.view")}
</Button>
<Button variant="outline" size="sm">
  {t("detail.overview.download")}
</Button>
```

**Impact:** Core report functionality inaccessible from overview tab.

**Required Fix:**

- Wire `onClick` handlers to navigate to report viewer
- Implement download with `useReportContent` hook
- Open share modal on share click

---

### 1.6 Manage Connectors Modal (LOW)

**Location:** `InsightCreateWizard.tsx:184`, `ConnectorSelectionStep.tsx:26`

**Issue:** `onManageConnectors` is no-op:

```typescript
onManageConnectors={() => {}}
```

**Impact:** Users cannot add new connectors from within wizard flow.

**Required Fix:**

- Open connector creation modal
- Refresh connector list after creation
- Auto-select newly created connector

---

## 2. Stubbed Code

### 2.1 Toast Notifications (HIGH)

**Locations:**

- `InsightDetailPage.tsx:598-599`, `604-605`
- `InsightDetailPage.tsx:486-487`, `491-492`
- `InsightEditPage.tsx:272-273`

**Issue:** TODO comments for toast notifications:

```typescript
onSuccess: () => {
  // TODO: Show success toast
},
onError: () => {
  // TODO: Show error toast
};
```

**Impact:** Users receive no feedback for successful/failed operations.

**Required Fix:**

- Import `showSuccessNotification` and `showErrorNotification` from `@/lib/notifications`
- Add toast calls in all mutation handlers
- Include error messages from canonical error system

---

### 2.2 Domain Extraction (MEDIUM)

**Location:** `InsightEditPage.tsx:173`

**Issue:** Domain hardcoded with TODO:

```typescript
domain: "analytics", // TODO: Get from insight
```

**Impact:** Domain may not reflect actual insight configuration.

**Required Fix:**

- Add `domain` field to insight schema
- Extract from connector metadata or insight configuration
- Update type definitions

---

### 2.3 Report Format Display (LOW)

**Location:** `ReportListPage.tsx:409`

**Issue:** Format fallback hardcoded:

```typescript
{
  (report.metadata as { format?: string })?.format || "PDF";
}
```

**Impact:** Incorrect format display if metadata missing.

**Required Fix:**

- Ensure format always populated in backend
- Add validation to report creation
- Display "Unknown" instead of silent fallback

---

## 3. Mocked/Placeholder Logic

### 3.1 Connector Metrics (CRITICAL)

**Location:** `InsightCreateWizard.tsx:185`

**Issue:** Empty array passed to metric configuration:

```typescript
<MetricConfigurationStep connectorMetrics={[]} />
```

**See:** Section 1.1 for remediation.

---

### 3.2 Version Selector (LOW)

**Location:** `ReportViewerPage.tsx:98-99`

**Issue:** Version options always empty:

```typescript
const versionOptions: { value: string; label: string }[] = [];
```

**Impact:** Version selector never displays even if report has multiple versions.

**Required Fix:**

- Extract versions from `report.metadata.versions`
- Populate dropdown with version hashes and timestamps
- Handle version switching in viewer

---

## 4. Error Handling Gaps

### 4.1 Generic Error Messages (HIGH)

**Locations:**

- `InsightListPage.tsx:198-203`
- `InsightDetailPage.tsx:637-642`
- `ReportListPage.tsx:235-240`

**Issue:** Generic error messages without error codes:

```typescript
<Text c="red">{t("list.errorMessage")}</Text>
```

**Impact:** Users cannot understand specific failure reasons. Support tickets lack diagnostic info.

**Required Fix:**

- Integrate canonical error system
- Map error codes to user-friendly messages
- Include error context (request ID, timestamp)
- Log errors with tenant context

---

### 4.2 Missing Error Boundaries (MEDIUM)

**Location:** All page components

**Issue:** No React Error Boundaries wrapping pages.

**Impact:** Single component error crashes entire page.

**Required Fix:**

- Wrap each page with ErrorBoundary component
- Add fallback UI for error states
- Log errors to observability system

---

### 4.3 No Retry Logic (LOW)

**Location:** All API hooks

**Issue:** `retry: false` configured universally:

```typescript
return trpc.insight.list.useQuery(..., { retry: false });
```

**Impact:** Transient network failures fail immediately without retry.

**Required Fix:**

- Implement exponential backoff retry logic
- Retry only idempotent queries (not mutations)
- Show retry button on persistent failures

---

## 5. Validation Gaps

### 5.1 Wizard Validation Incomplete (MEDIUM)

**Location:** `validation.ts:1-44`

**Issue:** Schema validation exists but step-level validation may not block progression.

**Impact:** Users may reach review step with invalid data.

**Required Fix:**

- Verify `trigger()` calls in `onNext` handlers
- Add visual validation indicators per step
- Prevent step advancement with invalid fields

---

### 5.2 Email Validation (LOW)

**Location:** `ScheduleDeliveryStep.tsx:42`

**Issue:** Custom regex validation instead of Zod:

```typescript
/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newRecipient);
```

**Impact:** Inconsistent validation logic.

**Required Fix:**

- Use Zod email validation
- Extract to shared validation utility
- Display inline validation errors

---

## 6. Integration Point Gaps

### 6.1 AI Insights Generation (MEDIUM)

**Location:** `InsightDetailPage.tsx:302-308`

**Issue:** Manual trigger required for AI insights:

```typescript
<Button onClick={() => generateMutation.mutate(...)}>
  {t("detail.overview.generateAIInsights")}
</Button>
```

**Impact:** AI insights not generated automatically after report completion.

**Required Fix:**

- Trigger AI insights generation in backend after report completion
- Add webhook/event listener for report completion
- Auto-refresh AI insights card

---

### 6.2 Audit Trail Integration (LOW)

**Location:** `AuditTrailTimeline.tsx:48-56`

**Issue:** Audit trail uses direct tRPC call without error handling.

**Impact:** Audit trail failures silent.

**Required Fix:**

- Add error boundary around timeline
- Show fallback message on load failure
- Add retry button

---

## 7. Quality Gaps

### 7.1 Missing Accessibility Attributes (MEDIUM)

**Locations:** Multiple components

**Issues:**

- Action icons lack `aria-label` (some exceptions in ReportViewerPage)
- Form inputs missing associated labels
- Loading states not announced to screen readers

**Required Fix:**

- Add `aria-label` to all icon buttons
- Ensure form inputs have visible or `aria-label` labels
- Add `aria-live` regions for dynamic content

---

### 7.2 Inconsistent Loading States (LOW)

**Locations:** All pages

**Issue:** Mixed skeleton vs spinner usage.

**Impact:** Inconsistent UX.

**Required Fix:**

- Standardize on skeleton loaders for initial page load
- Use spinners for action-specific loading
- Add loading progress for long operations

---

### 7.3 No Performance Optimization (LOW)

**Locations:** All list pages

**Issue:** No virtualization for long lists.

**Impact:** Performance degradation with 100+ items.

**Required Fix:**

- Implement Mantine virtualization or react-window
- Add infinite scroll pagination
- Cache list data with React Query

---

## 8. Type Safety Issues

### 8.1 Unsafe Type Assertions (HIGH)

**Locations:**

- `InsightDetailPage.tsx:159`, `474`
- `ReportListPage.tsx:409`
- `InsightEditPage.tsx:148-157`

**Issue:** Frequent `as` assertions:

```typescript
(insight.aiConfig as { model?: string })?.model(report.metadata as { format?: string })?.format;
```

**Impact:** Runtime errors if schema changes.

**Required Fix:**

- Define proper TypeScript interfaces for all JSONB fields
- Use type guards for runtime validation
- Add Zod schemas for API responses

---

### 8.2 Missing Null Checks (MEDIUM)

**Locations:** Multiple

**Issue:** Optional chaining not consistently used.

**Required Fix:**

- Enable TypeScript strict null checks
- Add null guards for all optional properties
- Use nullish coalescing for defaults

---

## 9. Security Considerations

### 9.1 Tenant Context Usage (CRITICAL)

**Status:** ✅ **CORRECTLY IMPLEMENTED**

**Location:** `AuditTrailTimeline.tsx:48`, `SharedReportPage.tsx:36`

**Verification:** Tenant ID extracted from context, not client input.

---

### 9.2 Share Token Validation (MEDIUM)

**Location:** `SharedReportPage.tsx:24-25`

**Issue:** Token passed via URL query params.

**Risk:** Tokens may be logged in server logs, browser history.

**Mitigation:**

- Use short token expiration (already implemented)
- Implement token rotation
- Add rate limiting on shared report access

---

## 10. Summary by Severity

### Critical (Block Production)

1. Metric configuration receives empty array - blocks insight creation
2. Type safety issues with JSONB fields - runtime error risk

### High (Should Fix Before Launch)

1. Running state not tracked - UX confusion
2. Toast notifications missing - no user feedback
3. Report actions not wired - core features inaccessible
4. Generic error messages - poor UX, support burden

### Medium (Fix in First Sprint)

1. Last run timestamp missing
2. Bulk download stubbed
3. Domain hardcoded
4. AI insights manual trigger
5. Unsafe type assertions

### Low (Polish)

1. Manage connectors no-op
2. Version selector empty
3. Retry logic missing
4. Email validation inconsistency
5. Accessibility attributes
6. Loading state inconsistency
7. Performance optimization

---

## Appendix A: Files Analyzed

### Insights Feature

- `api/insight-api.ts` (140 lines)
- `pages/InsightListPage.tsx` (290 lines)
- `pages/InsightCreateWizard.tsx` (242 lines)
- `pages/InsightDetailPage.tsx` (686 lines)
- `pages/InsightEditPage.tsx` (415 lines)
- `types.ts` (30 lines)
- `ui/wizard/validation.ts` (44 lines)
- `ui/wizard/steps/*.tsx` (6 steps, ~600 lines)
- `ui/WizardLayout.tsx` (62 lines)
- `ui/audit-trail/AuditTrailTimeline.tsx` (243 lines)

### Reports Feature

- `api/report-api.ts` (93 lines)
- `pages/ReportListPage.tsx` (506 lines)
- `pages/ReportViewerPage.tsx` (214 lines)
- `pages/SharedReportPage.tsx` (161 lines)
- `types.ts` (68 lines)
- `ui/ReportViewer.tsx` (97 lines)
- `ui/ExcelViewer.tsx` (105 lines)
- `ui/ShareReportModal.tsx` (205 lines)

**Total Lines Analyzed:** ~3,800 lines

---

## Appendix B: Reference Architecture Spec

Key requirements from `/docs/architecture/ui/04-pages/insights-reports.md`:

- ✅ Multi-step wizard with 6 steps
- ✅ Tabbed detail page (Overview, Reports, Settings, History)
- ✅ Report list with filtering and bulk actions
- ✅ PDF/Excel viewer integration
- ✅ Share link generation with expiration
- ✅ Audit trail timeline
- ❌ Connector metrics dynamic loading
- ❌ Running state indicators
- ❌ Toast notifications for mutations
- ❌ AI insights auto-generation
