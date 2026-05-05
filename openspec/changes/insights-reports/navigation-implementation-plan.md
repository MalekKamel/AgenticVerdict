# Insights & Reports Navigation Implementation Plan

**Change Reference:** `/openspec/changes/insights-reports/`  
**Status:** Ready for Implementation  
**Created:** 2026-05-04  
**Priority:** High

---

## Executive Summary

All Insights & Reports feature development is complete. This plan addresses the final gap: **navigation integration** to enable user access through the app shell. The implementation requires minimal code changes across 4 files with zero breaking changes.

---

## 1. Current State Analysis

### 1.1 Completed Features

| Component             | Status      | Location                                                                |
| --------------------- | ----------- | ----------------------------------------------------------------------- |
| Insight List Page     | ✅ Complete | `apps/frontend/src/features/insights/list/ui/InsightListPage.tsx`       |
| Insight Create Wizard | ✅ Complete | `apps/frontend/src/features/insights/create/ui/InsightCreateWizard.tsx` |
| Insight Detail Page   | ✅ Complete | `apps/frontend/src/features/insights/detail/ui/InsightDetailPage.tsx`   |
| Insight Edit Page     | ✅ Complete | `apps/frontend/src/features/insights/edit/ui/InsightEditPage.tsx`       |
| Report List Page      | ✅ Complete | `apps/frontend/src/features/reports/list/ui/ReportListPage.tsx`         |
| Report Viewer Page    | ✅ Complete | `apps/frontend/src/features/reports/viewer/ui/ReportViewerPage.tsx`     |
| Shared Report Page    | ✅ Complete | `apps/frontend/src/features/reports/share/ui/SharedReportPage.tsx`      |
| Route Constants       | ✅ Complete | `apps/frontend/src/lib/routing/route-paths.ts`                          |
| i18n Translations     | ✅ Complete | `packages/i18n/src/locales/{en,ar}.json` (~120 keys)                    |
| API Hooks             | ✅ Complete | `apps/frontend/src/features/insights/api/insight-api.ts`                |

### 1.2 Navigation Gap

**File:** `apps/frontend/src/features/shell/ui/app-shell-navigation.ts`

**Current State:**

```typescript
export type AppShellNavKey =
  | "home"
  | "dashboard"
  | "onboarding"
  | "featureFlags"
  | "connectors"
  | "agency";
// ❌ Missing: "insights", "reports"
```

**Impact:** Users cannot access Insights & Reports features through the navigation menu. Features are only accessible via direct URL entry.

---

## 2. Implementation Requirements

### 2.1 Permission Constants (Missing)

**File:** `packages/types/src/rbac.ts`

**Required Additions:**

```typescript
export const PERMISSIONS = {
  // ... existing permissions

  // Insights
  INSIGHTS_READ: "insights:read" as const,
  INSIGHTS_WRITE: "insights:write" as const,
  INSIGHTS_DELETE: "insights:delete" as const,

  // Reports (already exists but verify)
  REPORTS_READ: "reports:read" as const,
  REPORTS_WRITE: "reports:write" as const,
  REPORTS_DELETE: "reports:delete" as const,
  REPORTS_SHARE: "reports:share" as const,
} as const;
```

**Access Control Matrix:**

| Nav Item      | Required Permission | Rationale        |
| ------------- | ------------------- | ---------------- |
| Insights List | `INSIGHTS_READ`     | View-only access |
| Reports List  | `REPORTS_READ`      | View-only access |

### 2.2 Navigation Items Configuration

**File:** `apps/frontend/src/features/shell/ui/app-shell-navigation.ts`

**Required Changes:**

#### 2.2.1 Type Extensions

```typescript
export type AppShellNavKey =
  | "home"
  | "dashboard"
  | "onboarding"
  | "featureFlags"
  | "connectors"
  | "agency"
  | "insights" // ADD
  | "reports"; // ADD

export type AppShellNavItem = {
  id: AppShellNavKey;
  href: string;
  labelKey:
    | "home"
    | "dashboard"
    | "onboarding"
    | "featureFlags"
    | "connectors"
    | "agency"
    | "navigation.insights" // ADD
    | "navigation.reports"; // ADD
  matchMode?: "exact" | "prefix";
  prefetchPriority?: "high" | "normal";
  requiredRoles?: readonly AppShellNavRole[];
  requiredPermissions?: readonly Permission[];
  featureFlag?: AppShellNavFeatureFlag;
  requiresAgencyPartner?: boolean;
};
```

#### 2.2.2 Navigation Items Array

**Placement:** After "connectors" item, before "agency" item (logical grouping: data sources → insights → reports)

```typescript
export const APP_SHELL_NAV_ITEMS: readonly AppShellNavItem[] = [
  { id: "home", href: "/", labelKey: "home", matchMode: "exact", prefetchPriority: "normal" },
  {
    id: "dashboard",
    href: "/dashboard",
    labelKey: "dashboard",
    matchMode: "prefix",
    prefetchPriority: "high",
  },
  {
    id: "connectors",
    href: "/dashboard/connectors",
    labelKey: "connectors",
    matchMode: "prefix",
    prefetchPriority: "high",
    requiredPermissions: [PERMISSIONS.CONNECTORS_READ],
  },
  // ADD THESE TWO ITEMS:
  {
    id: "insights",
    href: "/dashboard/insights",
    labelKey: "navigation.insights",
    matchMode: "prefix", // Highlight for all /dashboard/insights/* routes
    prefetchPriority: "high", // Pre-fetch on hover (primary feature)
    requiredPermissions: [PERMISSIONS.INSIGHTS_READ],
  },
  {
    id: "reports",
    href: "/dashboard/reports",
    labelKey: "navigation.reports",
    matchMode: "prefix", // Highlight for all /dashboard/reports/* routes
    prefetchPriority: "normal", // Standard prefetch (secondary feature)
    requiredPermissions: [PERMISSIONS.REPORTS_READ],
  },
  {
    id: "agency",
    href: "/dashboard/agency",
    labelKey: "agency",
    matchMode: "prefix",
    prefetchPriority: "high",
    requiresAgencyPartner: true,
  },
  // ... rest of items
];
```

**Design Rationale:**

| Property                   | Value         | Reasoning                                                                       |
| -------------------------- | ------------- | ------------------------------------------------------------------------------- |
| `matchMode: "prefix"`      | Both items    | Ensures nav item stays highlighted on sub-pages (detail, create, edit)          |
| `prefetchPriority: "high"` | Insights only | Insights is primary feature; reports is secondary                               |
| `requiredPermissions`      | READ only     | Navigation visibility ≠ write access; page-level guards handle write operations |

### 2.3 Internationalization Keys (Missing)

**Files:**

- `packages/i18n/src/locales/en.json`
- `packages/i18n/src/locales/ar.json`

**Required Additions:**

#### English (`en.json`)

```json
{
  "navigation.insights": "Insights",
  "navigation.reports": "Reports"
}
```

#### Arabic (`ar.json`)

```json
{
  "navigation.insights": "الرؤى",
  "navigation.reports": "التقارير"
}
```

**Placement:** Add near existing navigation keys (after `"home"`, before `"common"` section)

**Note:** Existing `insights.title` and `reports.title` keys are for page titles, not navigation labels. Separate keys allow for different phrasing if needed (e.g., nav: "Insights" vs page: "Business Insights").

### 2.4 Route Path Verification

**File:** `apps/frontend/src/lib/routing/route-paths.ts`

**Current State (Verified ✅):**

```typescript
// Insights Routes
DASHBOARD_INSIGHTS: "/$locale/dashboard/insights";
DASHBOARD_INSIGHTS_NEW: "/$locale/dashboard/insights/new";
DASHBOARD_INSIGHTS_DETAIL: "/$locale/dashboard/insights/$id";
DASHBOARD_INSIGHTS_EDIT: "/$locale/dashboard/insights/$id/edit";

// Reports Routes
DASHBOARD_REPORTS: "/$locale/dashboard/reports";
DASHBOARD_REPORTS_DETAIL: "/$locale/dashboard/reports/$id";
SHARED_REPORTS: "/$locale/shared/reports/$id";
```

**Action:** No changes required. Routes are already defined and use `/$locale/` prefix for i18n routing.

---

## 3. Implementation Steps

### Phase 1: Permission Constants (5 minutes)

**File:** `packages/types/src/rbac.ts`

**Steps:**

1. Add `INSIGHTS_READ`, `INSIGHTS_WRITE`, `INSIGHTS_DELETE` to `PERMISSIONS` constant
2. Verify `REPORTS_*` permissions exist (they do)
3. Rebuild types package: `pnpm --filter @agenticverdict/types build`

**Validation:**

```bash
pnpm --filter @agenticverdict/types build
# Verify no TypeScript errors
```

---

### Phase 2: Navigation Configuration (10 minutes)

**File:** `apps/frontend/src/features/shell/ui/app-shell-navigation.ts`

**Steps:**

1. Add `"insights" | "reports"` to `AppShellNavKey` type
2. Add `"navigation.insights" | "navigation.reports"` to `labelKey` union
3. Insert two new nav items in `APP_SHELL_NAV_ITEMS` array (after connectors)
4. Import `PERMISSIONS` if not already imported (already imported)

**Validation:**

```bash
pnpm --filter @agenticverdict/frontend typecheck
# Verify no TypeScript errors in app-shell-navigation.ts
```

---

### Phase 3: Internationalization (5 minutes)

**Files:**

- `packages/i18n/src/locales/en.json`
- `packages/i18n/src/locales/ar.json`

**Steps:**

1. Add `"navigation.insights": "Insights"` to `en.json`
2. Add `"navigation.reports": "Reports"` to `en.json`
3. Add `"navigation.insights": "الرؤى"` to `ar.json`
4. Add `"navigation.reports": "التقارير"` to `ar.json`
5. Rebuild i18n package: `pnpm --filter @agenticverdict/i18n build`

**Validation:**

```bash
pnpm --filter @agenticverdict/i18n build
# Verify JSON is valid
```

---

### Phase 4: Integration Testing (15 minutes)

**Manual Testing Checklist:**

#### 4.1 Navigation Visibility

- [ ] Start dev server: `make dev` or `pnpm --filter @agenticverdict/frontend dev`
- [ ] Log in as admin user
- [ ] Verify "Insights" nav item appears in sidebar
- [ ] Verify "Reports" nav item appears in sidebar
- [ ] Verify both items appear after "Connectors" and before "Agency"

#### 4.2 Permission-Based Visibility

- [ ] Test with user having `INSIGHTS_READ` permission → Insights visible
- [ ] Test with user WITHOUT `INSIGHTS_READ` permission → Insights hidden
- [ ] Test with user having `REPORTS_READ` permission → Reports visible
- [ ] Test with user WITHOUT `REPORTS_READ` permission → Reports hidden

#### 4.3 Route Matching

- [ ] Click "Insights" → Navigate to `/dashboard/insights`
- [ ] Verify nav item highlighted on list page
- [ ] Navigate to `/dashboard/insights/new` → Verify nav item still highlighted
- [ ] Navigate to `/dashboard/insights/{id}` → Verify nav item still highlighted
- [ ] Repeat for Reports

#### 4.4 Localization

- [ ] Switch to Arabic locale
- [ ] Verify nav item shows "الرؤى" and "التقارير"
- [ ] Verify RTL layout correct
- [ ] Switch back to English → Verify "Insights" and "Reports"

#### 4.5 Prefetch Behavior

- [ ] Open Network tab in DevTools
- [ ] Hover over "Insights" nav item
- [ ] Verify prefetch request for `/dashboard/insights`
- [ ] Verify prefetch priority is "high" (immediate)

---

### Phase 5: Automated Testing (20 minutes)

**File:** `apps/frontend/src/features/shell/ui/app-shell-navigation.test.ts` (CREATE)

**Test Cases:**

```typescript
import { describe, it, expect } from "vitest";
import {
  filterAppShellNavItems,
  getHighPriorityPrefetchPaths,
  APP_SHELL_NAV_ITEMS,
} from "./app-shell-navigation";
import { PERMISSIONS } from "@agenticverdict/types";

describe("app-shell-navigation", () => {
  describe("APP_SHELL_NAV_ITEMS", () => {
    it("should include insights nav item", () => {
      const insightsItem = APP_SHELL_NAV_ITEMS.find((item) => item.id === "insights");
      expect(insightsItem).toBeDefined();
      expect(insightsItem?.href).toBe("/dashboard/insights");
      expect(insightsItem?.requiredPermissions).toEqual([PERMISSIONS.INSIGHTS_READ]);
    });

    it("should include reports nav item", () => {
      const reportsItem = APP_SHELL_NAV_ITEMS.find((item) => item.id === "reports");
      expect(reportsItem).toBeDefined();
      expect(reportsItem?.href).toBe("/dashboard/reports");
      expect(reportsItem?.requiredPermissions).toEqual([PERMISSIONS.REPORTS_READ]);
    });

    it("should order insights after connectors and before agency", () => {
      const ids = APP_SHELL_NAV_ITEMS.map((item) => item.id);
      const connectorsIndex = ids.indexOf("connectors");
      const insightsIndex = ids.indexOf("insights");
      const agencyIndex = ids.indexOf("agency");

      expect(insightsIndex).toBeGreaterThan(connectorsIndex);
      expect(agencyIndex).toBeGreaterThan(insightsIndex);
    });
  });

  describe("filterAppShellNavItems", () => {
    it("should filter insights when user lacks INSIGHTS_READ permission", () => {
      const context = {
        roles: ["member"] as const,
        permissions: [], // No permissions
        isAgencyPartner: false,
      };

      const filtered = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, context);
      const insightsVisible = filtered.some((item) => item.id === "insights");

      expect(insightsVisible).toBe(false);
    });

    it("should show insights when user has INSIGHTS_READ permission", () => {
      const context = {
        roles: ["member"] as const,
        permissions: [PERMISSIONS.INSIGHTS_READ],
        isAgencyPartner: false,
      };

      const filtered = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, context);
      const insightsVisible = filtered.some((item) => item.id === "insights");

      expect(insightsVisible).toBe(true);
    });

    it("should filter reports when user lacks REPORTS_READ permission", () => {
      const context = {
        roles: ["member"] as const,
        permissions: [],
        isAgencyPartner: false,
      };

      const filtered = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, context);
      const reportsVisible = filtered.some((item) => item.id === "reports");

      expect(reportsVisible).toBe(false);
    });
  });

  describe("getHighPriorityPrefetchPaths", () => {
    it("should include insights path in high priority prefetch", () => {
      const paths = getHighPriorityPrefetchPaths(APP_SHELL_NAV_ITEMS);
      expect(paths).toContain("/dashboard/insights");
    });

    it("should NOT include reports path in high priority prefetch", () => {
      const paths = getHighPriorityPrefetchPaths(APP_SHELL_NAV_ITEMS);
      expect(paths).not.toContain("/dashboard/reports");
    });
  });
});
```

**Run Tests:**

```bash
pnpm --filter @agenticverdict/frontend test app-shell-navigation.test.ts
```

---

## 4. Accessibility Compliance

### 4.1 Keyboard Navigation

**Already Handled By:** Mantine AppShell component

**Verification:**

- [ ] Tab to navigation sidebar
- [ ] Arrow keys navigate between nav items
- [ ] Enter activates nav item
- [ ] Focus visible on active item

### 4.2 Screen Reader Support

**Already Handled By:**

- `labelKey` uses i18n translations → screen readers announce localized text
- Mantine components include ARIA attributes by default

**Verification:**

- [ ] Test with VoiceOver (macOS) or NVDA (Windows)
- [ ] Verify nav item announces "Insights, link" or "الرؤى, رابط"

### 4.3 Visual Indicators

**Already Handled By:**

- Active nav item highlighted with brand color
- Hover state with background color change
- Icon support (optional, can be added later)

---

## 5. Multi-Tenant Safety

### 5.1 Tenant Scoping

**Navigation is tenant-agnostic:** Routes use `/$locale/dashboard/...` pattern

**Tenant context is enforced at:**

1. **Middleware level:** JWT extraction → `AsyncLocalStorage`
2. **API level:** All tRPC procedures require tenant context
3. **Database level:** Row-level security (RLS) policies

**No changes required:** Navigation integration does not affect tenant isolation.

### 5.2 Permission Scoping

**Permissions are tenant-scoped by design:**

```typescript
// User permissions are loaded per-tenant
const permissions = await getTenantPermissions(tenantId, userId);
```

**Navigation filtering uses tenant-scoped permissions:**

```typescript
const filteredItems = filterAppShellNavItems(APP_SHELL_NAV_ITEMS, {
  roles: user.roles, // Tenant-specific roles
  permissions: user.permissions, // Tenant-specific permissions
  isAgencyPartner: user.isAgencyPartner, // Tenant-specific flag
});
```

---

## 6. Rollback Plan

If issues arise post-deployment:

### 6.1 Immediate Rollback (5 minutes)

**Option A: Comment Out Nav Items**

```typescript
// Temporarily disable insights/reports nav items
// {
//   id: "insights",
//   href: "/dashboard/insights",
//   ...
// },
// {
//   id: "reports",
//   href: "/dashboard/reports",
//   ...
// },
```

**Option B: Revert Git Commit**

```bash
git revert HEAD~3..HEAD  # Revert last 3 commits (permissions, nav, i18n)
git push origin main
```

### 6.2 Feature Flag (Optional Safety Net)

If feature flags are preferred:

```typescript
{
  id: "insights",
  href: "/dashboard/insights",
  labelKey: "navigation.insights",
  featureFlag: "insightsNavigation",  // ADD THIS
  requiredPermissions: [PERMISSIONS.INSIGHTS_READ],
}
```

**Control via:** `apps/frontend/src/features/feature-flags/` (existing feature flag system)

**Recommendation:** Skip feature flag for this change. Risk is minimal (nav visibility only), and pages are already accessible via direct URL.

---

## 7. Success Criteria

### 7.1 Functional Criteria

- [ ] Insights nav item visible to users with `INSIGHTS_READ` permission
- [ ] Reports nav item visible to users with `REPORTS_READ` permission
- [ ] Nav items hidden from users without required permissions
- [ ] Nav items highlighted correctly on all sub-pages
- [ ] Arabic translations display correctly in RTL layout
- [ ] Prefetch works for insights (high priority)

### 7.2 Quality Criteria

- [ ] TypeScript type-check passes
- [ ] Unit tests pass (100% coverage for new code)
- [ ] Manual testing checklist complete
- [ ] No console errors in browser
- [ ] No accessibility violations (axe DevTools)

### 7.3 Performance Criteria

- [ ] Nav rendering time < 50ms (no regression)
- [ ] Prefetch does not block initial page load
- [ ] No unnecessary re-renders (React DevTools profiler)

---

## 8. Files to Modify

| File                                                               | Change Type      | Lines Changed | Priority |
| ------------------------------------------------------------------ | ---------------- | ------------- | -------- |
| `packages/types/src/rbac.ts`                                       | Add permissions  | +4            | High     |
| `apps/frontend/src/features/shell/ui/app-shell-navigation.ts`      | Add nav items    | +15           | High     |
| `packages/i18n/src/locales/en.json`                                | Add translations | +2            | High     |
| `packages/i18n/src/locales/ar.json`                                | Add translations | +2            | High     |
| `apps/frontend/src/features/shell/ui/app-shell-navigation.test.ts` | Create test file | +80           | Medium   |

**Total:** 5 files, ~103 lines of code

---

## 9. Dependencies

### 9.1 Upstream Dependencies (None)

- No external API changes required
- No database schema changes required
- No backend changes required

### 9.2 Downstream Impact

**Affected Components:**

- `AppShell.tsx` → Consumes `APP_SHELL_NAV_ITEMS`
- `NavigationSidebar.tsx` → Renders filtered nav items
- `i18n provider` → Resolves `labelKey` translations

**Risk:** Low. Changes are additive (no breaking changes).

---

## 10. Post-Implementation Tasks

### 10.1 Documentation Updates

- [ ] Update `docs/architecture/ui/04-pages/insights-reports.md` → Add navigation section
- [ ] Update `docs/05-reference/router-navigation-guide.md` → Add insights/reports examples
- [ ] Update `CHANGELOG.md` → Document new navigation items

### 10.2 Monitoring

**Metrics to Track:**

- Nav item click-through rate (analytics)
- 404 errors on insights/reports routes (should be zero)
- Permission denied errors (should be zero if permissions configured correctly)

**Alerts:**

- None required (low-risk change)

### 10.3 Future Enhancements (Out of Scope)

- Add icons to nav items (Tabler icons: `IconChartInfographic`, `IconFileAnalytics`)
- Implement nested navigation (Reports under Insights)
- Add notification badges (e.g., "3 new reports")
- Implement recent items / quick access

---

## 11. Implementation Checklist

```markdown
### Pre-Implementation

- [ ] Read this implementation plan
- [ ] Verify all referenced files exist
- [ ] Ensure local dev environment is running

### Phase 1: Permission Constants

- [ ] Add INSIGHTS_READ, INSIGHTS_WRITE, INSIGHTS_DELETE to rbac.ts
- [ ] Verify REPORTS\_\* permissions exist
- [ ] Build types package
- [ ] Run typecheck

### Phase 2: Navigation Configuration

- [ ] Update AppShellNavKey type
- [ ] Update labelKey union type
- [ ] Add insights nav item to APP_SHELL_NAV_ITEMS
- [ ] Add reports nav item to APP_SHELL_NAV_ITEMS
- [ ] Run typecheck

### Phase 3: Internationalization

- [ ] Add English translations
- [ ] Add Arabic translations
- [ ] Build i18n package
- [ ] Verify JSON syntax

### Phase 4: Testing

- [ ] Create unit test file
- [ ] Run unit tests
- [ ] Start dev server
- [ ] Complete manual testing checklist
- [ ] Test with different permission sets
- [ ] Test Arabic locale

### Phase 5: Deployment

- [ ] Create PR with all changes
- [ ] Request code review
- [ ] Verify CI passes (lint, typecheck, tests)
- [ ] Merge to main
- [ ] Deploy to staging
- [ ] Verify in staging environment
- [ ] Deploy to production
- [ ] Monitor for errors

### Post-Deployment

- [ ] Update documentation
- [ ] Mark tasks.md navigation task as complete
- [ ] Close this implementation plan
```

---

## Appendix A: Navigation Item Order Reference

**Current Order:**

1. Home
2. Dashboard
3. Connectors ← Data sources
4. **Insights** ← NEW (after connectors)
5. **Reports** ← NEW (after insights)
6. Agency
7. Onboarding (feature flag)
8. Feature Flags (admin only)

**Rationale:** Logical flow from data ingestion (connectors) → analysis (insights) → output (reports) → agency management.

---

## Appendix B: Permission Matrix

| Role        | INSIGHTS_READ | INSIGHTS_WRITE | REPORTS_READ | REPORTS_SHARE | Nav Visible                   |
| ----------- | ------------- | -------------- | ------------ | ------------- | ----------------------------- |
| **Viewer**  | ✅            | ❌             | ✅           | ❌            | Insights, Reports             |
| **Analyst** | ✅            | ✅             | ✅           | ✅            | Insights, Reports             |
| **Admin**   | ✅            | ✅             | ✅           | ✅            | Insights, Reports + Admin nav |

**Note:** Nav visibility requires READ permission only. Write operations are guarded at page/action level.

---

**End of Implementation Plan**
