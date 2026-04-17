# Tasks: Production Hardening

**Input**: Design documents from `/specs/01-ui/13-production-hardening/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create Phase 13 directory structure at `/specs/01-ui/13-production-hardening/`
- [ ] T002 Initialize monitoring and accessibility package dependencies in `apps/frontend/package.json`
- [ ] T003 [P] [US1] Configure GitHub Actions workflow for accessibility CI at `.github/workflows/accessibility-ci.yml`
- [ ] T004 [P] [US2] Configure GitHub Actions workflow for Lighthouse CI at `.github/workflows/lighthouse-ci.yml`
- [ ] T005 [P] [US3] Create monitoring library directory structure at `apps/frontend/src/lib/monitoring/`
- [ ] T006 [P] [US1] Create accessibility utilities directory at `apps/frontend/src/lib/utils/accessibility.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Install and configure `@axe-core/react` for accessibility testing
- [ ] T008 [P] Install and configure `web-vitals` library for Core Web Vitals tracking
- [ ] T009 [P] Install and configure `@sentry/react` for error tracking
- [ ] T010 [P] Install and configure analytics provider (Plausible or PostHog)
- [ ] T011 Install and configure `webpack-bundle-analyzer` for bundle analysis
- [ ] T012 Install and configure `@lhci/cli` for Lighthouse CI integration
- [ ] T013 Create base monitoring configuration in `apps/frontend/src/lib/monitoring/`
- [ ] T014 Create base accessibility utilities in `apps/frontend/src/lib/utils/accessibility.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Accessibility Compliance (Priority: P1) 🎯 MVP

**Goal**: WCAG 2.1 AA compliance across all application routes with automated testing and manual validation

**Independent Test**: Navigate the application using only keyboard (Tab, Enter, Arrow keys) and a screen reader (NVDA/JAWS/VoiceOver) through 5 critical user paths. All interactive elements are announced correctly and keyboard navigation works end-to-end.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T015 [P] [US1] Automated axe-core test for dashboard route in `apps/frontend/src/__tests__/a11y/dashboard.test.ts`
- [ ] T016 [P] [US1] Automated axe-core test for insight creation flow in `apps/frontend/src/__tests__/a11y/insight-creation.test.ts`
- [ ] T017 [P] [US1] Automated axe-core test for connector management in `apps/frontend/src/__tests__/a11y/connectors.test.ts`
- [ ] T018 [P] [US1] Playwright keyboard navigation test for critical user paths in `apps/frontend/src/__tests__/e2e/keyboard-nav.spec.ts`
- [ ] T019 [P] [US1] Playwright screen reader test for RTL layout (Arabic) in `apps/frontend/src/__tests__/e2e/screen-reader-rtl.spec.ts`

### Implementation for User Story 1

- [ ] T020 [P] [US1] Create `A11yAnnouncer` component for screen reader live regions in `apps/frontend/src/components/monitoring/A11yLiveRegion.tsx`
- [ ] T021 [P] [US1] Create `useFocusManagement` hook for focus trapping in `apps/frontend/src/lib/utils/accessibility.ts`
- [ ] T022 [P] [US1] Create `SkipLink` component for keyboard navigation in `apps/frontend/src/components/atoms/SkipLink.tsx`
- [ ] T023 [P] [US1] Create `FocusTrap` component for modals/dropdowns in `apps/frontend/src/components/atoms/FocusTrap.tsx`
- [ ] T024 [P] [US1] Implement `announceToScreenReader` utility function in `apps/frontend/src/lib/utils/accessibility.ts`
- [ ] T025 [US1] Audit existing Mantine components for accessibility gaps (missing ARIA labels, roles, states)
- [ ] T026 [US1] Add missing ARIA attributes to interactive components in `apps/frontend/src/components/`
- [ ] T027 [US1] Implement visible focus indicators in `apps/frontend/src/styles/accessibility.css`
- [ ] T028 [US1] Ensure all icons have `aria-label` or `aria-hidden` attributes in `apps/frontend/src/components/`
- [ ] T029 [US1] Validate color contrast ratios for all UI elements meet WCAG AA standards (4.5:1 for text, 3:1 for UI components)
- [ ] T030 [US1] Test and fix keyboard navigation for all interactive elements (logical tab order, no keyboard traps)
- [ ] T031 [US1] Test and fix screen reader compatibility for dynamic content updates (live regions)
- [ ] T032 [US1] Validate RTL accessibility (Arabic) with screen readers and fix issues
- [ ] T033 [US1] Configure axe-core to run in CI and fail on violations in `apps/frontend/playwright.config.ts`
- [ ] T034 [US1] Create accessibility patterns documentation in `docs/06-reference/accessibility-guide.md`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. All routes pass axe-core tests with zero violations, keyboard navigation works end-to-end, and screen reader testing passes for English and Arabic.

---

## Phase 4: User Story 2 - Performance Monitoring (Priority: P1)

**Goal**: Core Web Vitals tracking in production, Lighthouse CI with performance budgets, and bundle optimization

**Independent Test**: Navigate all major application routes and view Lighthouse scores in CI reports. Core Web Vitals are tracked in production with p75 and p95 percentiles visible in the internal performance dashboard. Bundle analysis confirms initial bundle <500KB and route chunks <200KB.

### Tests for User Story 2 ⚠️

- [ ] T035 [P] [US2] Core Web Vitals tracking test in `apps/frontend/src/__tests__/unit/performance.test.ts`
- [ ] T036 [P] [US2] Lighthouse CI configuration test in `apps/frontend/src/__tests__/integration/lighthouse.test.ts`
- [ ] T037 [P] [US2] Bundle analysis test to verify size budgets in `apps/frontend/src/__tests__/integration/bundle-size.test.ts`

### Implementation for User Story 2

- [ ] T038 [P] [US2] Create `performance.ts` monitoring module in `apps/frontend/src/lib/monitoring/performance.ts`
- [ ] T039 [P] [US2] Integrate `web-vitals` library for LCP, FID, CLS measurement
- [ ] T040 [P] [US2] Implement performance tracking with tenant context in `apps/frontend/src/lib/monitoring/performance.ts`
- [ ] T041 [US2] Send Core Web Vitals metrics to analytics backend in `apps/frontend/src/lib/monitoring/performance.ts`
- [ ] T042 [P] [US2] Create `.lighthouserc.json` configuration with performance budgets (score ≥90, route budgets)
- [ ] T043 [P] [US2] Configure Lighthouse CI GitHub Actions workflow in `.github/workflows/lighthouse-ci.yml`
- [ ] T044 [US2] Integrate webpack-bundle-analyzer with TanStack Start build in `apps/frontend/package.json`
- [ ] T045 [US2] Analyze current bundle and identify optimization opportunities in `apps/frontend/`
- [ ] T046 [US2] Verify route-based code splitting is enabled for all routes in `apps/frontend/src/routes/`
- [ ] T047 [US2] Lazy load heavy components (charts, rich text editors) via `React.lazy()` in `apps/frontend/src/components/`
- [ ] T048 [US2] Remove duplicate dependencies across packages in `apps/frontend/package.json` and root `package.json`
- [ ] T049 [US2] Create internal performance dashboard route at `apps/frontend/src/routes/admin/performance.tsx`
- [ ] T050 [US2] Display aggregate Core Web Vitals (p75, p95) with trend lines in dashboard
- [ ] T051 [US2] Add page-level performance breakdowns to dashboard
- [ ] T052 [US2] Link to Lighthouse reports for detailed audits in dashboard
- [ ] T053 [US2] Configure Turborepo to cache bundle analysis results in `turbo.json`
- [ ] T054 [US2] Create performance optimization guide in `docs/06-reference/performance-guide.md`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Lighthouse CI runs on all PRs and fails on budget regression, Core Web Vitals are tracked in production, and bundle sizes are optimized within budgets.

---

## Phase 5: User Story 3 - Error Tracking and Analytics (Priority: P2)

**Goal**: Error tracking with Sentry and analytics integration for data-driven product development

**Independent Test**: Trigger intentional errors (invalid API calls, network failures) and verify they appear in the Sentry dashboard with full context (tenant ID, user role, feature flags). Analytics events fire for page views and critical user actions, appearing in the analytics dashboard.

### Tests for User Story 3 ⚠️

- [ ] T055 [P] [US3] PII scrubbing test for error tracking in `apps/frontend/src/__tests__/unit/error-scrubbing.test.ts`
- [ ] T056 [P] [US3] Error context attachment test in `apps/frontend/src/__tests__/integration/error-tracking.test.ts`
- [ ] T057 [P] [US3] Analytics event tracking test in `apps/frontend/src/__tests__/unit/analytics.test.ts`

### Implementation for User Story 3

- [ ] T058 [P] [US3] Create `error-tracking.ts` module in `apps/frontend/src/lib/monitoring/error-tracking.ts`
- [ ] T059 [P] [US3] Install and configure `@sentry/react` for TanStack Start SSR in `apps/frontend/src/lib/monitoring/error-tracking.ts`
- [ ] T060 [US3] Implement PII scrubbing (URLs, query params, error context) in `apps/frontend/src/lib/monitoring/error-tracking.ts`
- [ ] T061 [US3] Attach tenant context (tenant ID, user role, feature flags) to all errors in `apps/frontend/src/lib/monitoring/error-tracking.ts`
- [ ] T062 [US3] Integrate with tRPC error handling for backend error correlation in `apps/frontend/src/lib/monitoring/error-tracking.ts`
- [ ] T063 [P] [US3] Create `ErrorBoundary` component with Sentry integration in `apps/frontend/src/components/monitoring/ErrorBoundary.tsx`
- [ ] T064 [P] [US3] Create `analytics.ts` module in `apps/frontend/src/lib/monitoring/analytics.ts`
- [ ] T065 [US3] Initialize analytics provider (Plausible or PostHog) in `apps/frontend/src/lib/monitoring/analytics.ts`
- [ ] T066 [US3] Implement `trackPageView` for route changes in `apps/frontend/src/lib/monitoring/analytics.ts`
- [ ] T067 [US3] Implement `trackEvent` for feature usage tracking in `apps/frontend/src/lib/monitoring/analytics.ts`
- [ ] T068 [US3] Add funnel tracking for critical user paths in `apps/frontend/src/lib/monitoring/analytics.ts`
- [ ] T069 [US3] Configure analytics to respect tenant data isolation in `apps/frontend/src/lib/monitoring/analytics.ts`
- [ ] T070 [US3] Configure Sentry dashboards for error monitoring in Sentry UI
- [ ] T071 [US3] Configure analytics dashboards for product metrics in analytics provider UI
- [ ] T072 [US3] Set up alerts for critical error spikes (>50 errors/min) in Sentry
- [ ] T073 [US3] Implement consent banner for analytics (GDPR/CCPA compliance) in `apps/frontend/src/components/monitoring/ConsentBanner.tsx`
- [ ] T074 [US3] Configure analytics to anonymize IP addresses in `apps/frontend/src/lib/monitoring/analytics.ts`
- [ ] T075 [US3] Add tenant-level analytics opt-out for enterprise customers in `apps/frontend/src/lib/monitoring/analytics.ts`
- [ ] T076 [US3] Create incident response runbooks in `docs/06-reference/incident-runbooks.md`

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. Error tracking captures errors with full context and scrubs PII, analytics events fire for page views and user actions, and dashboards provide visibility into system health and user behavior.

---

## Phase 6: User Story 4 - Bundle Optimization (Priority: P2)

**Goal**: Optimize bundle sizes through code splitting, tree shaking, and dependency analysis

**Independent Test**: Run bundle analysis and verify that route-based chunks load on-demand. Initial bundle is <500KB gzipped and route chunks are <200KB gzipped. Bundle analyzer report shows no duplicate dependencies and tree-shaking has removed unused code.

### Tests for User Story 4 ⚠️

- [ ] T077 [P] [US4] Bundle size budget test in CI (fail if >500KB initial, >200KB per route) in `apps/frontend/src/__tests__/integration/bundle-budget.test.ts`

### Implementation for User Story 4

- [ ] T078 [P] [US4] Generate baseline bundle report using webpack-bundle-analyzer in `apps/frontend/`
- [ ] T079 [US4] Identify large dependencies (>50KB) for optimization in bundle report
- [ ] T080 [US4] Check for duplicate dependencies and run dedupe in `apps/frontend/package.json` and root `package.json`
- [ ] T081 [US4] Verify route-based code splitting is enabled for all routes in `apps/frontend/src/routes/`
- [ ] T082 [US4] Lazy load chart libraries (Recharts) only on insight/report pages in `apps/frontend/src/components/`
- [ ] T083 [US4] Lazy load rich text editors only on template editing pages in `apps/frontend/src/components/`
- [ ] T084 [US4] Lazy load date pickers only when needed in `apps/frontend/src/components/`
- [ ] T085 [US4] Split vendor chunks for better caching (React, ReactDOM, Mantine separate) in Turborepo config
- [ ] T086 [US4] Replace moment.js with date-fns or luxon (smaller, tree-shakeable) in `apps/frontend/package.json`
- [ ] T087 [US4] Replace lodash with individual functions or es-toolkit in `apps/frontend/package.json`
- [ ] T088 [US4] Audit for unused Mantine modules and remove unused imports in `apps/frontend/src/components/`
- [ ] T089 [US4] Optimize font files (subset fonts, use WOFF2) in `apps/frontend/src/styles/`
- [ ] T090 [US4] Add bundle size check to CI (fail if bundle grows >5% without approval) in `.github/workflows/bundle-check.yml`
- [ ] T091 [US4] Generate bundle diff in PR comments using size-limit or bundlesize in CI workflow
- [ ] T092 [US4] Configure Turborepo to cache bundle analysis reports in `turbo.json`

**Checkpoint**: At this point, User Stories 1, 2, 3, AND 4 should all work independently. Bundle sizes are optimized within budgets, CI fails on bundle regression, and bundle analysis provides actionable insights for future optimization.

---

## Phase 7: User Story 5 - Ongoing Maintenance Processes (Priority: P3)

**Goal**: Document and automate maintenance processes for sustainability

**Independent Test**: Execute the documented maintenance processes (accessibility audit, Lighthouse scan, error log review) and verify that all steps are reproducible and produce actionable reports. A new developer can follow the documentation to run audits and interpret metrics without requiring tribal knowledge.

### Tests for User Story 5 ⚠️

- [ ] T093 [P] [US5] Validate accessibility checklist completeness by running all steps in `apps/frontend/`
- [ ] T094 [P] [US5] Validate performance audit produces actionable reports in CI
- [ ] T095 [P] [US5] Validate incident runbooks provide clear steps for triage in `docs/06-reference/incident-runbooks.md`

### Implementation for User Story 5

- [ ] T096 [P] [US5] Create accessibility checklist for developers in `docs/06-reference/accessibility-guide.md`
- [ ] T097 [US5] Document accessibility patterns (keyboard nav, screen reader, focus management) in `docs/06-reference/accessibility-guide.md`
- [ ] T098 [US5] Set up quarterly accessibility audit schedule in GitHub Issues or project management tool
- [ ] T099 [US5] Configure axe-core to run in CI for every PR (zero violations) in `.github/workflows/accessibility-ci.yml`
- [ ] T100 [P] [US5] Document performance optimization strategies in `docs/06-reference/performance-guide.md`
- [ ] T101 [US5] Set up monthly Lighthouse audits via GitHub Actions cron in `.github/workflows/monthly-lighthouse.yml`
- [ ] T102 [US5] Create performance regression runbook in `docs/06-reference/incident-runbooks.md`
- [ ] T103 [US5] Configure alerts for Core Web Vitals degradation in production monitoring dashboard
- [ ] T104 [US5] Document incident response steps for performance degradation in `docs/06-reference/incident-runbooks.md`
- [ ] T105 [US5] Document incident response steps for error spikes in `docs/06-reference/incident-runbooks.md`
- [ ] T106 [US5] Document incident response steps for accessibility issues in `docs/06-reference/incident-runbooks.md`
- [ ] T107 [US5] Document incident response steps for bundle regression in `docs/06-reference/incident-runbooks.md`
- [ ] T108 [US5] Update `CLAUDE.md` with monitoring and accessibility requirements in repository root
- [ ] T109 [US5] Create quickstart guide for running audits locally in `docs/06-reference/`
- [ ] T110 [US5] Document how to interpret metrics and dashboards in `docs/06-reference/`
- [ ] T111 [US5] Add onboarding section for new developers in `docs/01-getting-started/`

**Checkpoint**: At this point, ALL user stories should be independently functional and the platform has comprehensive production hardening with documented maintenance processes.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T112 [P] [US1, US2] Integrate accessibility and performance checks into pull request template in `.github/PULL_REQUEST_TEMPLATE.md`
- [ ] T113 [P] [US3, US4] Add monitoring and analytics to phase completion checklist in `/specs/01-ui/PHASES.md`
- [ ] T114 [US1, US2, US3, US4, US5] Cross-browser testing for accessibility and performance (Chrome, Firefox, Safari, Edge)
- [ ] T115 [US1, US2, US3, US4, US5] Cross-device testing (desktop, mobile, tablet) for accessibility and performance
- [ ] T116 [US1, US2, US3, US4, US5] Security audit for PII handling in error tracking and analytics
- [ ] T117 [P] [US1, US2, US3, US4, US5] Final documentation review and updates in `/docs/06-reference/`
- [ ] T118 [US1, US2, US3, US4, US5] Run full accessibility audit (automated + manual) and fix remaining issues
- [ ] T119 [US1, US2, US3, US4, US5] Run full performance audit (Lighthouse all routes) and optimize remaining issues
- [ ] T120 [US1, US2, US3, US4, US5] Validate all monitoring dashboards are configured and receiving data
- [ ] T121 [US1, US2, US3, US4, US5] Validate all runbooks are tested and actionable

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User Story 1 (Accessibility - P1): Can start after Foundational
  - User Story 2 (Performance - P1): Can start after Foundational (parallel with US1)
  - User Story 3 (Error/Analytics - P2): Can start after Foundational (parallel with US1, US2)
  - User Story 4 (Bundle Optimization - P2): Can start after Foundational (parallel with US1, US2, US3)
  - User Story 5 (Maintenance - P3): Depends on US1, US2, US3, US4 completion
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Accessibility)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1 - Performance)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2 - Error/Analytics)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P2 - Bundle Optimization)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 5 (P3 - Maintenance)**: Depends on US1, US2, US3, US4 - Documents processes from all previous stories

### Within Each User Story

- Tests MUST be written and FAIL before implementation (Test-Driven Development)
- Configuration before implementation (e.g., Sentry config before error boundary)
- Core utilities before components (e.g., accessibility utilities before SkipLink component)
- Automated testing before manual testing
- Implementation before documentation
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (Phase 1) marked [P] can run in parallel
- All Foundational tasks (Phase 2) marked [P] can run in parallel
- **HIGHLY PARALLEL**: Once Foundational completes, User Stories 1, 2, 3, 4 can all proceed in parallel by different team members
- All tests for a user story marked [P] can run in parallel
- All utilities/modules within a story marked [P] can run in parallel
- Documentation tasks (Phase 8) marked [P] can run in parallel

---

## Parallel Example: User Stories 1-4 After Foundational

```bash
# After Foundational (Phase 2) completes, launch all four user stories in parallel:

# Team Member A: User Story 1 (Accessibility)
Task: "Automated axe-core test for dashboard route"
Task: "Automated axe-core test for insight creation flow"
Task: "Automated axe-core test for connector management"
Task: "Create A11yAnnouncer component"
Task: "Create useFocusManagement hook"
Task: "Create SkipLink component"

# Team Member B: User Story 2 (Performance)
Task: "Core Web Vitals tracking test"
Task: "Create performance.ts monitoring module"
Task: "Integrate web-vitals library"
Task: "Create .lighthouserc.json configuration"
Task: "Configure Lighthouse CI GitHub Actions workflow"

# Team Member C: User Story 3 (Error/Analytics)
Task: "PII scrubbing test for error tracking"
Task: "Create error-tracking.ts module"
Task: "Install and configure @sentry/react"
Task: "Create analytics.ts module"
Task: "Initialize analytics provider"

# Team Member D: User Story 4 (Bundle Optimization)
Task: "Bundle size budget test in CI"
Task: "Generate baseline bundle report"
Task: "Identify large dependencies for optimization"
Task: "Verify route-based code splitting"
Task: "Lazy load chart libraries"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Accessibility - P1)
4. Complete Phase 4: User Story 2 (Performance - P1)
5. **STOP and VALIDATE**: Test accessibility and performance independently
6. Deploy/demo if ready

**MVP Value**: WCAG 2.1 AA compliance and Core Web Vitals monitoring establish the foundation for production quality. Error tracking, analytics, and bundle optimization can be added incrementally.

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Accessibility) → Test independently → Deploy/Demo (WCAG compliant!)
3. Add User Story 2 (Performance) → Test independently → Deploy/Demo (Performance monitored!)
4. Add User Story 3 (Error/Analytics) → Test independently → Deploy/Demo (Observability added!)
5. Add User Story 4 (Bundle Optimization) → Test independently → Deploy/Demo (Bundles optimized!)
6. Add User Story 5 (Maintenance) → Test independently → Deploy/Demo (Sustainable processes!)
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers after Foundational (Phase 2) completes:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Accessibility - 1 week)
   - Developer B: User Story 2 (Performance - 1 week)
   - Developer C: User Story 3 (Error/Analytics - 1 week)
   - Developer D: User Story 4 (Bundle Optimization - 3-5 days)
3. Stories complete and integrate independently
4. Developer E (or any from above): User Story 5 (Maintenance - 3-5 days) after US1-4 complete

**Total timeline**: 2 weeks setup + foundational + 1 week parallel US1-4 + 3-5 days US5 + 3-5 days polish = **3.5-4 weeks total**

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD**: Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- **HIGHLY RECOMMENDED**: Execute User Stories 1-4 in parallel after Foundational completes for optimal timeline
- Accessibility and Performance (US1, US2) are both P1 priority - both should be completed before US3, US4, US5
