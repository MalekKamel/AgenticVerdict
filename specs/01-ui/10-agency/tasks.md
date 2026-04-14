# Tasks: Agency Partner Dashboard

**Input**: Design documents from `/specs/01-ui/10-agency/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: This specification includes test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/web/src/` for frontend components, `packages/api/src/` for backend procedures
- Frontend routes: `apps/web/src/routes/agency/`
- Frontend components: `apps/web/src/components/agency/`
- Backend router: `packages/api/src/router/agency.ts`
- Tests: `apps/web/src/tests/` for E2E, `apps/web/src/__tests__/` for unit

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Agency-specific project initialization and structure

- [ ] T001 Create agency route structure in apps/web/src/routes/agency/
- [ ] T002 Create agency components directory in apps/web/src/components/agency/
- [ ] T003 [P] Create agency tRPC router in packages/api/src/router/agency.ts
- [ ] T004 [P] Create TanStack Store for agency dashboard state in apps/web/src/stores/agency-store.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Define agency data model schemas in packages/database/src/schema/agency_partners.ts
- [ ] T006 [P] Define branding configuration schema in packages/database/src/schema/branding.ts
- [ ] T007 [P] Implement AsyncLocalStorage context propagation for agency tenant queries
- [ ] T008 [P] Create base agency hooks in apps/web/src/hooks/ (useAgencyMetrics.ts, useClientPerformance.ts)
- [ ] T009 Install @tanstack/react-virtual dependency for virtual scrolling
- [ ] T010 Set up agency-specific error handling and logging

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Agency Dashboard Overview (Priority: P1) 🎯 MVP

**Goal**: Agency partners can view aggregated metrics across all clients from a single dashboard

**Independent Test**: Login as agency partner, navigate to agency dashboard, verify aggregated metrics display and client cards show accurate performance data

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T011 [P] [US1] E2E test for agency dashboard load in apps/web/src/tests/agency/agency-dashboard.spec.ts
- [ ] T012 [P] [US1] Unit test for ClientCard component in apps/web/src/__tests__/components/agency/ClientCard.test.tsx

### Implementation for User Story 1

- [ ] T013 [P] [US1] Implement tRPC procedure getAggregatedMetrics in packages/api/src/router/agency.ts
- [ ] T014 [P] [US1] Implement tRPC procedure getClientList in packages/api/src/router/agency.ts
- [ ] T015 [P] [US1] Create AggregatedMetrics component in apps/web/src/components/agency/AggregatedMetrics.tsx
- [ ] T016 [P] [US1] Create ClientCard component in apps/web/src/components/agency/ClientCard.tsx
- [ ] T017 [US1] Create ClientCardGrid component with virtual scrolling in apps/web/src/components/agency/ClientCardGrid.tsx (depends on T016)
- [ ] T018 [US1] Create ClientFilters component in apps/web/src/components/agency/ClientFilters.tsx
- [ ] T019 [US1] Create AgencyDashboard route in apps/web/src/routes/agency/index.tsx (depends on T015, T017, T018)
- [ ] T020 [US1] Implement useAgencyMetrics hook in apps/web/src/hooks/useAgencyMetrics.ts
- [ ] T021 [US1] Implement hover preview functionality on ClientCard component
- [ ] T022 [US1] Add warning indicators for degraded performance clients in ClientCard
- [ ] T023 [US1] Add responsive grid layout for ClientCardGrid (mobile/tablet/desktop)
- [ ] T024 [US1] Add accessibility attributes to AgencyDashboard components (ARIA labels, keyboard navigation)
- [ ] T025 [US1] Add RTL layout validation for AgencyDashboard

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Client Performance Deep Dive (Priority: P2)

**Goal**: Agency partners can drill down into detailed performance data for specific clients

**Independent Test**: From agency dashboard, click on a client card and verify detailed performance view loads with domain-specific metrics

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T026 [P] [US2] E2E test for client detail navigation in apps/web/src/tests/agency/client-detail.spec.ts
- [ ] T027 [P] [US2] Unit test for ClientPerformanceView component in apps/web/src/__tests__/components/agency/ClientPerformanceView.test.tsx

### Implementation for User Story 2

- [ ] T028 [P] [US2] Implement tRPC procedure getClientPerformance in packages/api/src/router/agency.ts
- [ ] T029 [P] [US2] Implement useClientPerformance hook in apps/web/src/hooks/useClientPerformance.ts
- [ ] T030 [US2] Create ClientPerformanceView component in apps/web/src/components/agency/ClientPerformanceView.tsx (depends on T029)
- [ ] T031 [US2] Create domain-specific metric display components (MarketingMetrics, FinanceMetrics, etc.)
- [ ] T032 [US2] Create ConnectorHealthSection component in apps/web/src/components/agency/ConnectorHealthSection.tsx
- [ ] T033 [US2] Create client detail route in apps/web/src/routes/agency/clients.$clientId.tsx (depends on T030)
- [ ] T034 [US2] Implement navigation with scroll position preservation between dashboard and detail views
- [ ] T035 [US2] Add "Back to Agency Dashboard" navigation button
- [ ] T036 [US2] Add accessibility attributes to ClientPerformanceView components
- [ ] T037 [US2] Add RTL layout validation for ClientPerformanceView

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Client Comparison and Benchmarking (Priority: P3)

**Goal**: Agency partners can compare performance across multiple clients side-by-side

**Independent Test**: From agency dashboard, select 2-4 clients and view comparison to verify normalized metrics and ranking indicators

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T038 [P] [US3] E2E test for client comparison in apps/web/src/tests/agency/client-comparison.spec.ts
- [ ] T039 [P] [US3] Unit test for ClientComparisonView component in apps/web/src/__tests__/components/agency/ClientComparisonView.test.tsx

### Implementation for User Story 3

- [ ] T040 [P] [US3] Implement tRPC procedure compareClients in packages/api/src/router/agency.ts
- [ ] T041 [P] [US3] Implement useClientComparison hook in apps/web/src/hooks/useClientComparison.ts
- [ ] T042 [US3] Create ClientComparisonView component in apps/web/src/components/agency/ClientComparisonView.tsx (depends on T041)
- [ ] T043 [US3] Create ComparisonColumn component for individual client metrics
- [ ] T044 [US3] Create MetricComparison component with ranking indicators
- [ ] T045 [US3] Create client selection UI with checkboxes (2-4 client limit)
- [ ] T046 [US3] Create comparison route in apps/web/src/routes/agency/compare.tsx (depends on T042)
- [ ] T047 [US3] Implement tooltip component for metric definitions
- [ ] T048 [US3] Add visual indicators for best-performing clients (badges, colors)
- [ ] T049 [US3] Add accessibility attributes to ClientComparisonView components
- [ ] T050 [US3] Add RTL layout validation for ClientComparisonView

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: User Story 4 - White-Label Branding (Priority: P2)

**Goal**: Agency partners can customize branding elements for white-label client-facing views

**Independent Test**: Agency partner uploads logo, selects colors, and verifies branding appears in dashboard and reports

### Tests for User Story 4 (OPTIONAL - only if tests requested) ⚠️

- [ ] T051 [P] [US4] E2E test for branding customization in apps/web/src/tests/agency/branding.spec.ts
- [ ] T052 [P] [US4] Unit test for BrandingSettings component in apps/web/src/__tests__/components/agency/BrandingSettings.test.tsx

### Implementation for User Story 4

- [ ] T053 [P] [US4] Implement tRPC mutation updateBranding in packages/api/src/router/agency.ts
- [ ] T054 [P] [US4] Implement useBrandingConfig hook in apps/web/src/hooks/useBrandingConfig.ts
- [ ] T055 [US4] Create BrandingSettings form component in apps/web/src/components/agency/BrandingSettings.tsx
- [ ] T056 [US4] Create BrandingPreview component in apps/web/src/components/agency/BrandingPreview.tsx
- [ ] T057 [US4] Implement logo upload with validation (size limits, format checking)
- [ ] T058 [US4] Implement color picker for brand colors (primary, secondary, accent)
- [ ] T059 [US4] Implement live preview updates using CSS custom properties
- [ ] T060 [US4] Create branding settings route in apps/web/src/routes/agency/settings.branding.tsx
- [ ] T061 [US4] Apply agency branding to dashboard header and reports
- [ ] T062 [US4] Add branding scope option (dashboard/reports/both)
- [ ] T063 [US4] Add accessibility attributes to BrandingSettings components
- [ ] T064 [US4] Add RTL layout validation for BrandingSettings

**Checkpoint**: User Story 4 should now be functional and testable independently

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T065 [P] Add loading states and skeletons for all agency components
- [ ] T066 [P] Add error boundaries and error handling for agency routes
- [ ] T067 [P] Add analytics tracking for agency dashboard interactions
- [ ] T068 [P] Add unit tests for agency tRPC procedures in packages/api/src/__tests__/router/agency.test.ts
- [ ] T069 [P] Add visual regression tests for agency components
- [ ] T070 [P] Performance optimization: bundle analysis and code splitting for agency routes
- [ ] T071 [P] Performance optimization: lazy load agency components >50KB
- [ ] T072 [P] Accessibility audit with axe-core for all agency pages
- [ ] T073 [P] Accessibility: keyboard navigation for client selection and comparison
- [ ] T074 [P] Documentation: add agency dashboard usage guide in docs/
- [ ] T075 [P] Code cleanup and refactoring
- [ ] T076 Run quickstart.md validation
- [ ] T077 Final RTL layout validation for all agency pages
- [ ] T078 Final E2E test suite validation for agency workflows

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (Dashboard Overview): Can start after Foundational
  - User Story 2 (Client Detail): Can start after Foundational - depends on US1 for navigation flow
  - User Story 3 (Comparison): Can start after Foundational - depends on US1 for client selection
  - User Story 4 (Branding): Can start after Foundational - independent of other stories
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - Integrates with US1 for navigation but independently testable
- **User Story 3 (P3)**: Can start after Foundational - Integrates with US1 for client selection but independently testable
- **User Story 4 (P2)**: Can start after Foundational - Completely independent, can run in parallel with US2 and US3

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- tRPC procedures before hooks
- Hooks before components
- Base components before composite components
- Routes after components
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes:
  - **User Story 1** and **User Story 4** can run in parallel (both P1/P2 priority)
  - **User Story 2** and **User Story 3** can run in parallel (both P2/P3 priority)
- All tests for a user story marked [P] can run in parallel
- Components within a story marked [P] can run in parallel
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1 + User Story 4

```bash
# Launch User Story 1 and User Story 4 in parallel (both high priority):

# User Story 1 tasks (parallel):
T011: "E2E test for agency dashboard load"
T012: "Unit test for ClientCard component"
T013: "Implement tRPC procedure getAggregatedMetrics"
T014: "Implement tRPC procedure getClientList"

# User Story 4 tasks (parallel):
T051: "E2E test for branding customization"
T052: "Unit test for BrandingSettings component"
T053: "Implement tRPC mutation updateBranding"
T054: "Implement useBrandingConfig hook"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Dashboard Overview)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo agency dashboard overview if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 4 → Test independently → Deploy/Demo
5. Add User Story 3 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Dashboard Overview)
   - Developer B: User Story 4 (Branding) - runs in parallel with US1
   - Developer C: User Story 2 (Client Detail) - starts after US1 completes
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Virtual scrolling (T017) is critical for performance - don't skip
- Branding updates should use CSS custom properties for instant preview
- RTL validation is required for all agency pages
- Agency dashboard is high-value feature - prioritize quality over speed
