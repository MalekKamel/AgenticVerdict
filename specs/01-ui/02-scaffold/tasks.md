---
description: "Task list for UI Scaffold (Phase 02) implementation"
---

# Tasks: UI Scaffold (Phase 02)

**Input**: Design documents from `/specs/01-ui/02-scaffold/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Unit tests (Vitest) and E2E tests (Playwright) are REQUIRED for layout components to ensure accessibility, responsiveness, and RTL/LTR behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each layout.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/frontend/src/` for all implementation
- **Tests**: `apps/frontend/src/components/__tests__/` for unit tests, `apps/frontend/e2e/` for E2E tests
- **Paths shown below** use the web app structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initial setup for layout components and navigation system

- [ ] T001 Create layout components directory structure at `apps/frontend/src/components/layout/`
- [ ] T002 Create navigation components directory structure at `apps/frontend/src/components/navigation/`
- [ ] T003 Create report components directory structure at `apps/frontend/src/components/report/`
- [ ] T004 [P] Create hooks directory structure at `apps/frontend/src/hooks/`
- [ ] T005 [P] Create lib utilities directory structure at `apps/frontend/src/lib/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY layout can be implemented

**⚠️ CRITICAL**: No layout work can begin until this phase is complete

- [ ] T006 Add navigation translation keys to `packages/i18n/src/locales/en/common.json` (nav, layout, settings sections)
- [ ] T007 [P] Add navigation translation keys to `packages/i18n/src/locales/ar/common.json` (nav, layout, settings sections in Arabic)
- [ ] T008 Create tRPC router for layout data at `apps/frontend/src/server/routers/layout.ts` (getNavigationMenu, getUserProfile)
- [ ] T009 [P] Create navigation type definitions at `apps/frontend/src/types/navigation.ts` (NavigationItem, BreadcrumbItem, UserMenuItem, SettingsSection, TOCItem)
- [ ] T010 Create navigation configuration at `apps/frontend/src/lib/navigation.ts` (navigation items structure, helpers)
- [ ] T011 Create breadcrumb utilities at `apps/frontend/src/lib/breadcrumbs.ts` (generateBreadcrumbs, findNavigationItem)
- [ ] T012 [P] Create useLayout hook at `apps/frontend/src/hooks/useLayout.ts` (layout state, sidebar state)
- [ ] T013 [P] Create useSidebar hook at `apps/frontend/src/hooks/useSidebar.ts` (collapse/expand state with localStorage persistence)

**Checkpoint**: Foundation ready - layout implementation can now begin in parallel

---

## Phase 3: User Story 2 - Auth Layout (Priority: P1) 🎯 MVP

**Goal**: Implement authentication layout for sign-in, sign-up, and forgot-password pages

**Independent Test**: Navigate to `/en/signin`, `/en/signup`, `/en/forgot-password` and verify centered card layout with appropriate form and no navigation elements

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T014 [P] [US2] Unit test for AuthLayout component in `apps/frontend/src/components/__tests__/AuthLayout.test.tsx`
- [ ] T015 [P] [US2] E2E test for signin page layout in `apps/frontend/e2e/auth-layout.spec.ts`
- [ ] T016 [P] [US2] E2E test for RTL auth layout in `apps/frontend/e2e/auth-layout-rtl.spec.ts`
- [ ] T017 [P] [US2] E2E test for mobile auth layout in `apps/frontend/e2e/auth-layout-mobile.spec.ts`
- [ ] T018 [P] [US2] Accessibility test for auth layout with axe-core in `apps/frontend/e2e/auth-layout-a11y.spec.ts`

### Implementation for User Story 2

- [ ] T019 [US2] Create AuthLayout component in `apps/frontend/src/components/layout/AuthLayout.tsx`
- [ ] T020 [US2] Implement AuthLayout size variants (sm: 400px, md: 480px, lg: 560px)
- [ ] T021 [US2] Implement AuthLayout responsive behavior (centered card, mobile padding)
- [ ] T022 [US2] Add AuthLayout accessibility features (semantic HTML, ARIA labels, focus management)
- [ ] T023 [US2] Implement RTL layout mirroring for AuthLayout (automatic via Mantine + next-intl)
- [ ] T024 [US2] Update signin route to use AuthLayout at `apps/frontend/src/routes/[locale]/signin.tsx`
- [ ] T025 [US2] Create signup route with AuthLayout at `apps/frontend/src/routes/[locale]/signup.tsx`
- [ ] T026 [US2] Create forgot-password route with AuthLayout at `apps/frontend/src/routes/[locale]/forgot-password.tsx`

**Checkpoint**: At this point, User Story 2 should be fully functional and testable independently

---

## Phase 4: User Story 1 - Dashboard Layout (Priority: P1) 🎯 MVP

**Goal**: Implement main dashboard layout with sidebar, topbar, breadcrumbs, and user menu

**Independent Test**: Navigate to any authenticated route and verify sidebar navigation, topbar with user menu, and breadcrumb trail display correctly

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T027 [P] [US1] Unit test for DashboardLayout component in `apps/frontend/src/components/__tests__/DashboardLayout.test.tsx`
- [ ] T028 [P] [US1] Unit test for Sidebar component in `apps/frontend/src/components/__tests__/Sidebar.test.tsx`
- [ ] T029 [P] [US1] Unit test for Topbar component in `apps/frontend/src/components/__tests__/Topbar.test.tsx`
- [ ] T030 [P] [US1] Unit test for Breadcrumb component in `apps/frontend/src/components/__tests__/Breadcrumb.test.tsx`
- [ ] T031 [P] [US1] E2E test for desktop dashboard layout in `apps/frontend/e2e/dashboard-layout.spec.ts`
- [ ] T032 [P] [US1] E2E test for mobile dashboard layout in `apps/frontend/e2e/dashboard-layout-mobile.spec.ts`
- [ ] T033 [P] [US1] E2E test for RTL dashboard layout in `apps/frontend/e2e/dashboard-layout-rtl.spec.ts`
- [ ] T034 [P] [US1] E2E test for sidebar collapse/expand in `apps/frontend/e2e/dashboard-layout-sidebar.spec.ts`
- [ ] T035 [P] [US1] Accessibility test for dashboard layout with axe-core in `apps/frontend/e2e/dashboard-layout-a11y.spec.ts`

### Implementation for User Story 1

- [ ] T036 [P] [US1] Create Sidebar component in `apps/frontend/src/components/navigation/Sidebar.tsx`
- [ ] T037 [P] [US1] Implement Sidebar collapse/expand functionality with icon-only mode
- [ ] T038 [US1] Implement Sidebar responsive behavior (desktop panel, mobile overlay)
- [ ] T039 [US1] Add Sidebar accessibility features (ARIA landmarks, keyboard navigation, focus trap)
- [ ] T040 [US1] Implement RTL layout mirroring for Sidebar (automatic via Mantine + next-intl)
- [ ] T041 [P] [US1] Create Topbar component in `apps/frontend/src/components/navigation/Topbar.tsx`
- [ ] T042 [P] [US1] Create UserMenu component in `apps/frontend/src/components/navigation/UserMenu.tsx`
- [ ] T043 [US1] Implement Topbar with logo, language switcher, theme toggle, and user menu
- [ ] T044 [US1] Create Breadcrumb component in `apps/frontend/src/components/navigation/Breadcrumb.tsx`
- [ ] T045 [US1] Implement breadcrumb auto-generation from route hierarchy
- [ ] T046 [US1] Create NavigationItems component in `apps/frontend/src/components/navigation/NavigationItems.tsx`
- [ ] T047 [US1] Implement nested navigation with collapsible sections
- [ ] T048 [US1] Create TenantSwitcher component in `apps/frontend/src/components/navigation/TenantSwitcher.tsx` (UI only, tRPC integration in Phase 09)
- [ ] T049 [US1] Create DashboardLayout component in `apps/frontend/src/components/layout/DashboardLayout.tsx`
- [ ] T050 [US1] Integrate Sidebar, Topbar, and Breadcrumb into DashboardLayout
- [ ] T051 [US1] Implement DashboardLayout responsive behavior (desktop sidebar, mobile overlay)
- [ ] T052 [US1] Add DashboardLayout accessibility features (skip-to-content link, landmarks, keyboard nav)
- [ ] T053 [US1] Update root layout to use DashboardLayout for authenticated routes at `apps/frontend/src/routes/[locale]/layout.tsx`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 5: User Story 4 - Settings Layout (Priority: P2)

**Goal**: Implement settings layout with section navigation and form area

**Independent Test**: Navigate to any settings page and verify section sidebar and form content area display correctly

### Tests for User Story 4 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T054 [P] [US4] Unit test for SettingsLayout component in `apps/frontend/src/components/__tests__/SettingsLayout.test.tsx`
- [ ] T055 [P] [US4] E2E test for settings layout in `apps/frontend/e2e/settings-layout.spec.ts`
- [ ] T056 [P] [US4] E2E test for mobile settings layout in `apps/frontend/e2e/settings-layout-mobile.spec.ts`
- [ ] T057 [P] [US4] E2E test for RTL settings layout in `apps/frontend/e2e/settings-layout-rtl.spec.ts`
- [ ] T058 [P] [US4] Accessibility test for settings layout with axe-core in `apps/frontend/e2e/settings-layout-a11y.spec.ts`

### Implementation for User Story 4

- [ ] T059 [P] [US4] Create SettingsLayout component in `apps/frontend/src/components/layout/SettingsLayout.tsx`
- [ ] T060 [US4] Implement SettingsLayout section navigation with active state highlighting
- [ ] T061 [US4] Implement SettingsLayout responsive behavior (desktop sidebar, mobile tabs/drawer)
- [ ] T062 [US4] Add SettingsLayout form state handling (loading, saving, error, success)
- [ ] T063 [US4] Add SettingsLayout accessibility features (form structure, ARIA alerts, focus management)
- [ ] T064 [US4] Implement RTL layout mirroring for SettingsLayout (automatic via Mantine + next-intl)
- [ ] T065 [US4] Create settings routes structure at `apps/frontend/src/routes/[locale]/settings/`
- [ ] T066 [US4] Create account settings route at `apps/frontend/src/routes/[locale]/settings/account.tsx`
- [ ] T067 [US4] Create company settings route at `apps/frontend/src/routes/[locale]/settings/company.tsx`
- [ ] T068 [US4] Create connectors settings route at `apps/frontend/src/routes/[locale]/settings/connectors.tsx`

**Checkpoint**: At this point, User Stories 1, 2, AND 4 should all work independently

---

## Phase 6: User Story 3 - Report Layout (Priority: P2)

**Goal**: Implement report viewing layout with document viewer, TOC, and export controls

**Independent Test**: Navigate to a report detail page and verify document viewer, TOC sidebar, and export controls display correctly

### Tests for User Story 3 ⚠️

> **NOTE: Write these tests FIRST, ensure them FAIL before implementation**

- [ ] T069 [P] [US3] Unit test for ReportLayout component in `apps/frontend/src/components/__tests__/ReportLayout.test.tsx`
- [ ] T070 [P] [US3] Unit test for ReportViewer component in `apps/frontend/src/components/__tests__/ReportViewer.test.tsx`
- [ ] T071 [P] [US3] Unit test for ReportActions component in `apps/frontend/src/components/__tests__/ReportActions.test.tsx`
- [ ] T072 [P] [US3] Unit test for TableOfContents component in `apps/frontend/src/components/__tests__/TableOfContents.test.tsx`
- [ ] T073 [P] [US3] E2E test for report layout in `apps/frontend/e2e/report-layout.spec.ts`
- [ ] T074 [P] [US3] E2E test for mobile report layout in `apps/frontend/e2e/report-layout-mobile.spec.ts`
- [ ] T075 [P] [US3] E2E test for RTL report layout in `apps/frontend/e2e/report-layout-rtl.spec.ts`
- [ ] T076 [P] [US3] E2E test for fullscreen mode in `apps/frontend/e2e/report-layout-fullscreen.spec.ts`
- [ ] T077 [P] [US3] Accessibility test for report layout with axe-core in `apps/frontend/e2e/report-layout-a11y.spec.ts`

### Implementation for User Story 3

- [ ] T078 [P] [US3] Create ReportViewer component in `apps/frontend/src/components/report/ReportViewer.tsx`
- [ ] T079 [US3] Implement PDF viewer using browser native PDF viewer
- [ ] T080 [US3] Implement Excel viewer using HTML table renderer
- [ ] T081 [P] [US3] Create ReportActions component in `apps/frontend/src/components/report/ReportActions.tsx`
- [ ] T082 [US3] Implement export, print, share, and fullscreen controls
- [ ] T083 [P] [US3] Create TableOfContents component in `apps/frontend/src/components/report/TableOfContents.tsx`
- [ ] T084 [US3] Implement TOC navigation with scroll-to-section
- [ ] T085 [US3] Create ReportLayout component in `apps/frontend/src/components/layout/ReportLayout.tsx`
- [ ] T086 [US3] Integrate ReportViewer, TableOfContents, and ReportActions into ReportLayout
- [ ] T087 [US3] Implement ReportLayout responsive behavior (desktop TOC sidebar, mobile drawer)
- [ ] T088 [US3] Implement fullscreen mode for ReportLayout
- [ ] T089 [US3] Add ReportLayout accessibility features (document landmarks, keyboard navigation, ARIA labels)
- [ ] T090 [US3] Implement RTL layout mirroring for ReportLayout (automatic via Mantine + next-intl)
- [ ] T091 [US3] Create report detail route at `apps/frontend/src/routes/[locale]/reports/$reportId.tsx`

**Checkpoint**: At this point, all user stories should now be independently functional

---

## Phase 7: User Story 5 - Multi-Language Navigation Labels (Priority: P3)

**Goal**: Ensure all navigation labels and interface text are translatable with English and Arabic support

**Independent Test**: Switch between English and Arabic using language switcher and verify all navigation labels, breadcrumbs, and interface text update correctly

### Tests for User Story 5 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T092 [P] [US5] E2E test for language switching in `apps/frontend/e2e/language-switching.spec.ts`
- [ ] T093 [P] [US5] E2E test for RTL layout preservation after language switch in `apps/frontend/e2e/rtl-preservation.spec.ts`
- [ ] T094 [P] [US5] E2E test for missing translation fallbacks in `apps/frontend/e2e/translation-fallbacks.spec.ts`

### Implementation for User Story 5

- [ ] T095 [US5] Audit all navigation labels for translation keys in all layout components
- [ ] T096 [US5] Ensure all navigation labels use `useTranslations` hook from next-intl
- [ ] T097 [US5] Add missing translation keys to `packages/i18n/src/locales/en/common.json`
- [ ] T098 [US5] Add missing translation keys to `packages/i18n/src/locales/ar/common.json`
- [ ] T099 [US5] Test language switching in all layout components (DashboardLayout, AuthLayout, ReportLayout, SettingsLayout)
- [ ] T100 [US5] Verify RTL layout mirroring works correctly after language switch
- [ ] T101 [US5] Add translation fallback warnings in development mode

**Checkpoint**: At this point, all user stories should support multi-language navigation labels

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T102 [P] Update existing AppShellLayout to use new DashboardLayout at `apps/frontend/src/components/layout/AppShellLayout.tsx` (refactor)
- [ ] T103 [P] Create layout component documentation in `apps/frontend/src/components/layout/README.md`
- [ ] T104 [P] Create navigation component documentation in `apps/frontend/src/components/navigation/README.md`
- [ ] T105 Code cleanup and refactoring across all layout components
- [ ] T106 Performance optimization (bundle analysis, lazy loading for heavy components)
- [ ] T107 [P] Add visual regression tests for all layout components
- [ ] T108 Security hardening (CSP headers, XSS prevention)
- [ ] T109 Run all E2E tests and ensure 100% pass rate
- [ ] T110 Run accessibility audits with axe-core and ensure zero violations
- [ ] T111 Verify all layouts meet performance targets (<1.5s FCP on mobile 4G, <200ms animations)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (US2 → US1 → US4 → US3 → US5)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 2 (AuthLayout)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 1 (DashboardLayout)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (SettingsLayout)**: Can start after Foundational (Phase 2) - Can reuse patterns from DashboardLayout but should be independently testable
- **User Story 3 (ReportLayout)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 5 (Multi-Language)**: Can start after all layout components are implemented - Depends on US1, US2, US3, US4 for layout components to translate

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Component creation before integration
- Individual component implementation before layout integration
- Layout implementation before route updates
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, US2 and US1 can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Components within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1 (DashboardLayout)

```bash
# Launch all tests for User Story 1 together:
Task: T027 - Unit test for DashboardLayout component
Task: T028 - Unit test for Sidebar component
Task: T029 - Unit test for Topbar component
Task: T030 - Unit test for Breadcrumb component
Task: T031 - E2E test for desktop dashboard layout
Task: T032 - E2E test for mobile dashboard layout
Task: T033 - E2E test for RTL dashboard layout
Task: T034 - E2E test for sidebar collapse/expand
Task: T035 - Accessibility test for dashboard layout

# Launch all components for User Story 1 together:
Task: T036 - Create Sidebar component
Task: T041 - Create Topbar component
Task: T042 - Create UserMenu component
Task: T044 - Create Breadcrumb component
Task: T046 - Create NavigationItems component
Task: T048 - Create TenantSwitcher component
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 2 (AuthLayout) - Lowest risk, isolated pages
4. Complete Phase 4: User Story 1 (DashboardLayout) - Core layout for most pages
5. **STOP and VALIDATE**: Test User Stories 1 and 2 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 2 → Test independently → Deploy/Demo (Auth MVP!)
3. Add User Story 1 → Test independently → Deploy/Demo (Dashboard MVP!)
4. Add User Story 4 → Test independently → Deploy/Demo
5. Add User Story 3 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 2 (AuthLayout)
   - Developer B: User Story 1 (DashboardLayout)
   - Developer C: User Story 4 (SettingsLayout)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- **IMPORTANT**: All layout components must support RTL/LTR with automatic mirroring - no manual RTL adjustments
- **IMPORTANT**: All layout components must achieve WCAG 2.1 AA compliance - zero axe-core violations
- **IMPORTANT**: Performance targets are strict - <1.5s FCP on mobile 4G, <200ms animations
