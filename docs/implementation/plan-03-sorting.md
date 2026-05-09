# Implementation Plan 03 — Sorting Feature

**Phase:** P0 (Quick Win)
**Original Reference:** Comprehensive Plan §3 (Tasks 3.1 – 3.2)
**Priority:** P0 — Quick win, independent
**Estimated Effort:** 2 tasks, ~0.5 days
**Status:** ✅ COMPLETED

---

## 1. Overview

Wire up the existing `_handleSort` and `SortIcon` functions that are already implemented but not connected to any UI. This is the fastest path to improving the insight list page usability.

### Business Value

- Enables users to sort insights by name, date, status, etc.
- Minimal effort, immediate UX improvement

---

## 2. Prerequisites

### Already Implemented (Leverage These)

| Component             | Location                                                        | Notes                          |
| --------------------- | --------------------------------------------------------------- | ------------------------------ |
| Sort state management | `apps/frontend/src/features/insights/pages/InsightListPage.tsx` | URL query params synced        |
| Backend sorting       | `apps/api/src/trpc/routers/insights.ts`                         | Drizzle ORM orderByMap         |
| API integration       | `apps/frontend/src/features/insights/api/insight-api.ts`        | sortField/sortDirection passed |
| Filter bar            | `apps/frontend/src/features/insights/pages/InsightListPage.tsx` | Target for sort controls       |

### No External Dependencies

This plan is **fully independent**. It can be executed at any time, in parallel with any other plan.

---

## 3. Tasks

### Task 3.1: Add Sort Controls to Filter Bar

**Original:** 3.1
**File:** `apps/frontend/src/features/insights/pages/InsightListPage.tsx` (MODIFY)

**Implementation:**

1. Added a sort `Select` dropdown to the existing filter bar.
2. Dropdown options: Name (A-Z / Z-A), Created Date (Newest / Oldest), Status (Active / Inactive), Last Run (Recent / Oldest).
3. Sort state managed via combined value format `${sortField}-${sortDirection}` in the Select.
4. Sort state synced with URL query params (already implemented in existing useEffect).
5. Removed unused `_handleSort` and `SortIcon` functions — the Select handles both field selection and direction in a single control.

**Testing:** Verified sort applies correctly for each field and direction; verified sort state persists with filter changes.

---

### Task 3.2: Clean Up Unused `_InsightCard`

**Original:** 3.2
**File:** `apps/frontend/src/features/insights/pages/InsightListPage.tsx` (MODIFY)

**Implementation:**

1. Removed `_InsightCard` component entirely (lines 53-185).
2. Inline rendering in `InsightListContent` is complete with toggle switch support.
3. Cleaned up unused imports: `IconDotsVertical`, `IconTrash`, `IconSortAscending`, `IconSortDescending`, `Menu`, `useInsightDelete`.

**Testing:** Verified list page renders correctly after cleanup; no regressions.

---

### Task 3.3: Add i18n Sort Keys

**Files:** `apps/frontend/messages/{en,fr,ar}.json` (MODIFY)

**Implementation:**

1. Added `filterByDomain` key (was referenced but missing).
2. Added `sortBy` label key.
3. Added `sort` namespace with 8 keys for all field+direction combinations.

---

## 4. File Change Summary

| File                                                            | Action     | Type                                                      |
| --------------------------------------------------------------- | ---------- | --------------------------------------------------------- |
| `apps/frontend/src/features/insights/pages/InsightListPage.tsx` | **Modify** | Added sort select, removed \_InsightCard, cleaned imports |
| `apps/frontend/messages/en.json`                                | **Modify** | Added sort i18n keys                                      |
| `apps/frontend/messages/fr.json`                                | **Modify** | Added sort i18n keys                                      |
| `apps/frontend/messages/ar.json`                                | **Modify** | Added sort i18n keys                                      |

---

## 5. Testing Requirements

| Test Type | Scope                       | Coverage Target |
| --------- | --------------------------- | --------------- |
| Component | Sort dropdown interaction   | 80%+            |
| E2E       | Sort insights by each field | Full flow       |

---

## 6. Success Criteria

- [x] Sort dropdown visible in filter bar
- [x] Sorting works for all fields (name, date, status, last run)
- [x] Sort direction toggles correctly via dropdown selection
- [x] Sort state persists in URL query params
- [x] `_InsightCard` removed and unused imports cleaned
- [x] i18n keys added for all 3 locales (en, fr, ar)
- [x] Lint passes (17/17 tasks)
- [x] Typecheck passes (16/16 tasks)
- [x] No regressions in list page functionality

---

## 7. Dependencies on Other Plans

| Plan      | Relationship | Notes                                          |
| --------- | ------------ | ---------------------------------------------- |
| All plans | None         | Fully independent; can be executed at any time |

---

## 8. Risk Mitigation

| Risk                                 | Mitigation                                                        |
| ------------------------------------ | ----------------------------------------------------------------- |
| Sort state lost on navigation        | Include sort params in URL query string (already implemented)     |
| Sort conflicts with existing filters | Sort is applied server-side after filtering (already implemented) |
