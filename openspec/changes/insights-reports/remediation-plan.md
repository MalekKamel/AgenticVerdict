# Insights & Reports Pages - Blank Screen Remediation Plan

**Date:** 2026-05-04  
**Status:** Ready for Implementation  
**Severity:** Critical (Pages completely non-functional)

---

## Executive Summary

The `/en/dashboard/reports` and `/en/dashboard/insights` routes are rendering blank pages due to **incorrect component export patterns**. Both pages use **named exports** instead of **default exports**, which causes `lazyRouteComponent` to fail silently during dynamic imports.

---

## Root Cause Analysis

### Primary Issue: Export Mismatch

**Affected Files:**

1. `apps/frontend/src/features/reports/pages/ReportListPage.tsx` (line 200)
2. `apps/frontend/src/features/insights/pages/InsightListPage.tsx` (line 174)

**Current Code:**

```typescript
// ❌ Named export (BROKEN)
export function ReportListPage() { ... }
export function InsightListPage() { ... }
```

**Expected Code:**

```typescript
// ✅ Default export (REQUIRED)
export default function ReportListPage() { ... }
export default function InsightListPage() { ... }
```

**Why This Causes Blank Screens:**

The TanStack Router's `lazyRouteComponent` helper expects a default export from the dynamic import:

```typescript
// Route definition (reports/index.tsx)
component: lazyRouteComponent(() => import("@/features/reports/pages/ReportListPage"));

// Under the hood, this does:
const module = await import("@/features/reports/pages/ReportListPage");
return module.default; // ← Returns undefined with named export!
```

When the default export is missing:

- React receives `undefined` as the component
- No error boundary is triggered (import succeeds, but exports wrong value)
- Result: **Blank page with no console errors**

### Secondary Issue: Inconsistent Router Hook Usage

**Affected File:** `apps/frontend/src/features/insights/pages/InsightListPage.tsx`

**Current Code:**

```typescript
import { useRouter } from "@/i18n/navigation";
const router = useRouter();
router.push("/path");
```

**Inconsistency:** The working `ConnectorListPage` uses the same pattern, but `ReportListPage` uses:

```typescript
import { useNavigate } from "@/router/hooks";
const navigate = useNavigate();
navigate.push("/path");
```

**Impact:** Both patterns work, but consistency improves maintainability. Not blocking.

---

## Evidence

### 1. Route Definitions (All Identical Structure)

**Reports Route** (`apps/frontend/src/routes/$locale/dashboard/reports/index.tsx`):

```typescript
export const Route = createFileRoute("/$locale/dashboard/reports/")({
  beforeLoad: createDashboardParentBeforeLoad(),
  component: lazyRouteComponent(() => import("@/features/reports/pages/ReportListPage")),
});
```

**Insights Route** (`apps/frontend/src/routes/$locale/dashboard/insights/index.tsx`):

```typescript
export const Route = createFileRoute("/$locale/dashboard/insights/")({
  beforeLoad: createDashboardParentBeforeLoad(),
  component: lazyRouteComponent(() => import("@/features/insights/pages/InsightListPage")),
});
```

**Connectors Route** (WORKING - for comparison):

```typescript
export const Route = createFileRoute("/$locale/dashboard/connectors/")({
  beforeLoad: createDashboardParentBeforeLoad(),
  component: lazyRouteComponent(() => import("@/features/connectors/pages/ConnectorListPage")),
});
```

### 2. Component Exports (The Problem)

| Component           | Export Type               | Status   |
| ------------------- | ------------------------- | -------- |
| `ConnectorListPage` | `export default function` | ✅ Works |
| `ReportListPage`    | `export function`         | ❌ Blank |
| `InsightListPage`   | `export function`         | ❌ Blank |

### 3. tRPC Backend Verification

**Status:** ✅ All backend endpoints are properly registered and functional:

- `apps/api/src/trpc/root.ts` (lines 18-19):

  ```typescript
  export const appRouter = t.router({
    // ...
    insight: insightRouter,
    report: reportRouter,
  });
  ```

- Both routers have properly defined `list` procedures with correct input/output schemas
- No backend issues detected

### 4. API Client Hooks

**Status:** ✅ All API hooks are correctly implemented:

- `useReportList` - Properly calls `trpc.report.list.useQuery`
- `useInsightList` - Properly calls `trpc.insight.list.useQuery`
- Both include error handling and loading states

---

## Fix Recommendations

### Fix #1: Convert ReportListPage to Default Export

**File:** `apps/frontend/src/features/reports/pages/ReportListPage.tsx`  
**Line:** 200

**Change:**

```diff
- export function ReportListPage() {
+ export default function ReportListPage() {
```

**Additional Action:** Check for any files importing this as a named import and update them:

```diff
- import { ReportListPage } from "@/features/reports/pages/ReportListPage";
+ import ReportListPage from "@/features/reports/pages/ReportListPage";
```

### Fix #2: Convert InsightListPage to Default Export

**File:** `apps/frontend/src/features/insights/pages/InsightListPage.tsx`  
**Line:** 174

**Change:**

```diff
- export function InsightListPage() {
+ export default function InsightListPage() {
```

### Fix #3: Verify All Related Page Components

Check and fix export patterns for all pages in these directories:

**Reports Pages:**

- [x] `ReportListPage.tsx` - **NEEDS FIX**
- [ ] `ReportViewerPage.tsx` - Verify export
- [ ] `SharedReportPage.tsx` - Verify export

**Insights Pages:**

- [x] `InsightListPage.tsx` - **NEEDS FIX**
- [ ] `InsightDetailPage.tsx` - Verify export
- [ ] `InsightEditPage.tsx` - Verify export
- [ ] `InsightCreateWizard.tsx` - Verify export (used by `/insights/new`)

**Recommended Command:**

```bash
# Find all named exports in pages directories
grep -n "^export function" apps/frontend/src/features/reports/pages/*.tsx
grep -n "^export function" apps/frontend/src/features/insights/pages/*.tsx
```

### Fix #4: Regenerate Route Tree

After fixing exports, regenerate TanStack Router types:

```bash
cd apps/frontend
pnpm generate-routes
```

This ensures `routeTree.gen.ts` is up to date.

---

## Implementation Priority

| Priority | Task                         | Impact   | Effort |
| -------- | ---------------------------- | -------- | ------ |
| **P0**   | Fix `ReportListPage` export  | Critical | 2 min  |
| **P0**   | Fix `InsightListPage` export | Critical | 2 min  |
| **P1**   | Verify other page exports    | High     | 5 min  |
| **P2**   | Regenerate route tree        | Medium   | 1 min  |
| **P3**   | Standardize router hooks     | Low      | 10 min |

---

## Verification Steps

### Step 1: Apply Fixes

```bash
# Fix ReportListPage
sed -i '' 's/^export function ReportListPage()/export default function ReportListPage()/' \
  apps/frontend/src/features/reports/pages/ReportListPage.tsx

# Fix InsightListPage
sed -i '' 's/^export function InsightListPage()/export default function InsightListPage()/' \
  apps/frontend/src/features/insights/pages/InsightListPage.tsx
```

### Step 2: Regenerate Routes

```bash
cd apps/frontend
pnpm generate-routes
cd ../..
```

### Step 3: Restart Development Server

```bash
# Stop current dev server (Ctrl+C)
# Then restart
pnpm --filter @agenticverdict/frontend dev
```

### Step 4: Test Pages

**Manual Testing:**

1. **Reports Page:**

   ```bash
   open http://localhost:3000/en/dashboard/reports
   ```

   - ✅ Should render report list table
   - ✅ Should show filters (date, format, status)
   - ✅ Should load data via tRPC query
   - ✅ No blank screen

2. **Insights Page:**
   ```bash
   open http://localhost:3000/en/dashboard/insights
   ```

   - ✅ Should render insight cards grid
   - ✅ Should show search and status filters
   - ✅ Should load data via tRPC query
   - ✅ No blank screen

**Browser Console Check:**

- Open DevTools → Console
- Navigate to pages
- ✅ No errors related to lazy loading or component imports
- ✅ tRPC queries should show successful responses

**Network Tab Check:**

- Open DevTools → Network
- Filter: `trpc`
- ✅ `report.list` request should return 200
- ✅ `insight.list` request should return 200

### Step 5: Automated Testing

```bash
# Run frontend tests
pnpm --filter @agenticverdict/frontend test

# Run E2E tests (if available)
pnpm run test:e2e:frontend:smoke
```

---

## Additional Findings

### Other Page Components to Verify

**Recommendation:** Audit all page components for consistent export patterns:

```bash
# Find all page components with named exports
find apps/frontend/src/features -name "*Page.tsx" -exec grep -l "^export function" {} \;

# Find all page components with default exports
find apps/frontend/src/features -name "*Page.tsx" -exec grep -l "^export default function" {} \;
```

**Standardize on:** `export default function ComponentName()`

### Router Hook Inconsistency

**Finding:** Mixed usage of navigation hooks:

- `useRouter()` from `@/i18n/navigation` (Insights, Connectors)
- `useNavigate()` from `@/router/hooks` (Reports)

**Recommendation:** Standardize on one pattern across all pages. Both work, but consistency reduces cognitive load.

---

## Risk Assessment

| Risk                           | Likelihood | Impact | Mitigation                               |
| ------------------------------ | ---------- | ------ | ---------------------------------------- |
| Breaking existing imports      | Low        | Medium | Search for named imports before changing |
| Route tree regeneration issues | Low        | Low    | Re-run `pnpm generate-routes`            |
| Other pages have same issue    | Medium     | Medium | Audit all page exports proactively       |

---

## Success Criteria

- [ ] `/en/dashboard/reports` renders without blank screen
- [ ] `/en/dashboard/insights` renders without blank screen
- [ ] Both pages successfully fetch data from tRPC endpoints
- [ ] No console errors related to component loading
- [ ] All existing tests pass
- [ ] Route tree regenerates without errors

---

## Appendix: Working vs Broken Comparison

### ConnectorListPage (WORKING)

```typescript
// apps/frontend/src/features/connectors/pages/ConnectorListPage.tsx:135
export default function ConnectorListPage() {
  // ... component code
}
```

### ReportListPage (BROKEN)

```typescript
// apps/frontend/src/features/reports/pages/ReportListPage.tsx:200
export function ReportListPage() {
  // ❌ Missing 'default'
  // ... component code
}
```

### InsightListPage (BROKEN)

```typescript
// apps/frontend/src/features/insights/pages/InsightListPage.tsx:174
export function InsightListPage() {
  // ❌ Missing 'default'
  // ... component code
}
```

---

**Next Steps:** Implement fixes in priority order, then verify pages render correctly.
