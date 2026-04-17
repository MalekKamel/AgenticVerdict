# Tasks: UI Insights

**Input**: Design documents from `/specs/01-ui/04-insights/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)
**Priority**: ⭐ HIGHEST PRIORITY - Primary Value Feature

**Tests**: E2E tests included for critical user journeys (insight creation, editing, feed viewing)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/frontend/src/` for routes and components, `packages/ui/src/` for shared components
- **API**: `packages/api/src/router/` for tRPC routers
- **Tests**: `apps/frontend/tests/` for E2E tests, `packages/ui/tests/` for component tests

---

## Phase 1: Setup & Shared Infrastructure

**Purpose**: Project initialization and basic structure for insights feature

- [ ] T001 Create insight routes directory structure in apps/frontend/src/routes/insights/
- [ ] T002 [P] Create tRPC insights router at packages/api/src/router/insights/router.ts
- [ ] T003 [P] Create TanStack Store for wizard state at apps/frontend/src/stores/insight-wizard-store.ts
- [ ] T004 [P] Add insight-related i18n strings to apps/frontend/src/i18n/locales/en.json and ar.json
- [ ] T005 [P] Install Recharts dependency for data visualization

---

## Phase 2: Foundational Components (Blocking Prerequisites)

**Purpose**: Core components that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Data Layer (tRPC)

- [ ] T006 Define Zod schemas for Insight entities in packages/api/src/router/insights/schemas.ts
- [ ] T007 [P] Implement insights.list query in packages/api/src/router/insights/queries.ts
- [ ] T008 [P] Implement insights.detail query in packages/api/src/router/insights/queries.ts
- [ ] T009 [P] Implement insights.feed query in packages/api/src/router/insights/queries.ts
- [ ] T010 [P] Implement insights.create mutation in packages/api/src/router/insights/mutations.ts
- [ ] T011 [P] Implement insights.update mutation in packages/api/src/router/insights/mutations.ts
- [ ] T012 [P] Implement insights.delete mutation in packages/api/src/router/insights/mutations.ts
- [ ] T013 [P] Implement insights.clone mutation in packages/api/src/router/insights/mutations.ts
- [ ] T014 [P] Implement insights.activate and insights.deactivate mutations in packages/api/src/router/insights/mutations.ts

### Shared UI Components

- [ ] T015 [P] Create StatusBadge molecule in packages/ui/src/molecules/StatusBadge/ for insight status indicators
- [ ] T016 [P] Create DataTable organism in packages/ui/src/organisms/DataTable/ for insight list
- [ ] T017 [P] Create FilterBar molecule in packages/ui/src/molecules/FilterBar/ for search and filters
- [ ] T018 [P] Create ChartCard organism in packages/ui/src/organisms/ChartCard/ for metric charts
- [ ] T019 Create MetricChart component in apps/frontend/src/routes/insights/components/MetricChart.tsx wrapping Recharts

### Wizard Infrastructure

- [ ] T020 Initialize TanStack Store with wizard state schema in apps/frontend/src/stores/insight-wizard-store.ts
- [ ] T021 [P] Create InsightWizard shell component in apps/frontend/src/routes/insights/components/InsightWizard.tsx using Mantine Stepper

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Configure and Activate Insight (Priority: P1) ⭐ MVP

**Goal**: Deliver the PRIMARY VALUE FEATURE - insight creation wizard with template/connector/metric selection, AI config, scheduling, and activation

**Independent Test**: Create a complete insight through the wizard: select template → choose connectors → pick metrics → configure AI → set schedule → activate. Verify insight appears in list with "Active" status.

### E2E Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T022 [P] [US1] E2E test for insight creation wizard in apps/frontend/tests/e2e/insights/create-insight.spec.ts
- [ ] T023 [P] [US1] E2E test for insight cloning in apps/frontend/tests/e2e/insights/clone-insight.spec.ts

### Implementation for User Story 1

#### Template Selection Step

- [ ] T024 [P] [US1] Create TemplateSelector component in apps/frontend/src/routes/insights/components/TemplateSelector.tsx
- [ ] T025 [US1] Implement template card grid with name, description, and preview
- [ ] T026 [US1] Implement template selection state management in TanStack Store
- [ ] T027 [US1] Implement template recommendation logic based on business domain

#### Connector Selection Step

- [ ] T028 [P] [US1] Create ConnectorSelector component in apps/frontend/src/routes/insights/components/ConnectorSelector.tsx
- [ ] T029 [US1] Implement connector multi-select with health status indicators
- [ ] T030 [US1] Implement connector filtering by business domain
- [ ] T031 [US1] Implement "Connect" action for disconnected connectors

#### Metric Selection Step

- [ ] T032 [P] [US1] Create MetricSelector component in apps/frontend/src/routes/insights/components/MetricSelector.tsx
- [ ] T033 [US1] Implement metric grouping by connector with expand/collapse
- [ ] T034 [US1] Implement metric multi-select with search and filtering
- [ ] T035 [US1] Implement metric recommendation based on template selection
- [ ] T036 [US1] Implement validation requiring at least one metric

#### AI Configuration Step

- [ ] T037 [P] [US1] Create AIConfigPanel component in apps/frontend/src/routes/insights/components/AIConfigPanel.tsx
- [ ] T038 [US1] Implement model selection dropdown (Claude 3.5 Sonnet, GPT-4o)
- [ ] T039 [US1] Implement quality level selection (Fast, Balanced, Thorough)
- [ ] T040 [US1] Implement detail level selection (Concise, Standard, Comprehensive)
- [ ] T041 [US1] Implement estimated cost and processing time display
- [ ] T042 [US1] Implement custom prompt input with validation

#### Schedule & Delivery Step

- [ ] T043 [P] [US1] Create ScheduleConfig component in apps/frontend/src/routes/insights/components/ScheduleConfig.tsx
- [ ] T044 [US1] Implement schedule frequency selection (On-demand, Daily, Weekly, Monthly)
- [ ] T045 [US1] Implement time zone picker with tenant default
- [ ] T046 [US1] Implement next run time calculation and display
- [ ] T047 [US1] Implement delivery channel selection (Email, In-App Feed)
- [ ] T048 [US1] Implement email recipient input with validation
- [ ] T049 [US1] Implement delivery format selection (PDF, HTML, Excel)

#### Review & Activation

- [ ] T050 [P] [US1] Create review step component displaying all wizard selections
- [ ] T051 [US1] Implement wizard validation before activation
- [ ] T052 [US1] Implement insight creation via tRPC insights.create mutation
- [ ] T053 [US1] Implement activation via tRPC insights.activate mutation
- [ ] T054 [US1] Implement success/error handling with user feedback

#### Clone Functionality

- [ ] T055 [P] [US1] Implement insight clone in apps/frontend/src/routes/insights/components/InsightActions.tsx
- [ ] T056 [US1] Implement tRPC insights.clone mutation call
- [ ] T057 [US1] Implement navigation to edit interface after clone
- [ ] T058 [US1] Implement "(Copy)" suffix on cloned insight name

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 3 - Manage and Monitor Insights (Priority: P1)

**Goal**: Provide comprehensive insight management interface with list view, search, filtering, and status monitoring

**Independent Test**: Create multiple insights with different statuses, use insight list to search, filter, sort, and manage them. Verify list updates correctly and actions work.

### E2E Tests for User Story 3 ⚠️

- [ ] T059 [P] [US3] E2E test for insight list search and filter in apps/frontend/tests/e2e/insights/insight-list.spec.ts
- [ ] T060 [P] [US3] E2E test for insight management actions in apps/frontend/tests/e2e/insights/insight-actions.spec.ts

### Implementation for User Story 3

#### Insight List Page

- [ ] T061 [P] [US3] Create insight list page route at apps/frontend/src/routes/insights/index.tsx
- [ ] T062 [US3] Implement InsightList component using DataTable organism
- [ ] T063 [US3] Implement insight table columns: name, status, last run, next run, actions
- [ ] T064 [US3] Implement status badge indicators (active, inactive, error, pending)
- [ ] T065 [US3] Implement quick action buttons: view, edit, clone, activate/deactivate, delete

#### Search and Filtering

- [ ] T066 [P] [US3] Implement search input for insight name/description filtering
- [ ] T067 [US3] Implement FilterBar component with status, connector, date range filters
- [ ] T068 [US3] Implement filter state management and persistence
- [ ] T069 [US3] Implement insight count summary by status

#### Sorting and Pagination

- [ ] T070 [P] [US3] Implement sorting by name, status, last run, next run, creation date
- [ ] T071 [US3] Implement pagination or virtual scrolling for large lists
- [ ] T072 [US3] Implement loading states for list data fetching

#### Error Handling

- [ ] T073 [P] [US3] Implement error display for insights with error status
- [ ] T074 [US3] Implement error details view with remediation suggestions
- [ ] T075 [US3] Implement retry functionality for failed insights

**Checkpoint**: At this point, User Stories 1 AND 3 should both work independently

---

## Phase 5: User Story 4 - Analyze Insight Details with Data Visualization (Priority: P2)

**Goal**: Provide detailed analysis interface with interactive charts, metrics, drill-downs, and comprehensive AI analysis

**Independent Test**: Open an insight detail view, interact with charts (hover, toggle metrics), adjust date range, drill down to data tables. Verify all visualizations render correctly.

### E2E Tests for User Story 4 ⚠️

- [ ] T076 [P] [US4] E2E test for insight detail view in apps/frontend/tests/e2e/insights/insight-detail.spec.ts
- [ ] T077 [P] [US4] E2E test for chart interactions in apps/frontend/tests/e2e/insights/chart-interactions.spec.ts

### Implementation for User Story 4

#### Insight Detail Page

- [ ] T078 [P] [US4] Create insight detail page route at apps/frontend/src/routes/insights/$insightId.tsx
- [ ] T079 [US4] Implement InsightDetail component with header, metrics, charts, analysis sections
- [ ] T080 [US4] Implement key metrics summary cards at top of detail view
- [ ] T081 [US4] Implement insight configuration summary section

#### Data Visualization

- [ ] T082 [P] [US4] Implement MetricChart component with Recharts LineChart/AreaChart/BarChart
- [ ] T083 [US4] Implement multi-metric chart rendering with legend
- [ ] T084 [US4] Implement chart tooltip with exact values and timestamps
- [ ] T085 [US4] Implement metric toggle in chart legend to show/hide metrics
- [ ] T086 [US4] Implement date range picker with presets (7 days, 30 days, custom)

#### Analysis and Recommendations

- [ ] T087 [P] [US4] Implement AI-generated summary display section
- [ ] T088 [US4] Implement actionable recommendations display
- [ ] T089 [US4] Implement "View Full Report" action to open PDF/HTML
- [ ] T090 [US4] Implement data quality indicators (completeness, freshness, anomalies)

#### Drill-Down and Export

- [ ] T091 [P] [US4] Implement metric drill-down to underlying data tables
- [ ] T092 [US4] Implement chart export functionality (PNG, CSV)
- [ ] T093 [US4] Implement responsive chart resizing

**Checkpoint**: At this point, User Stories 1, 3, AND 4 should all work independently

---

## Phase 6: User Story 2 - View Insight Feed and Take Action (Priority: P2) ⭐

**Goal**: Deliver the consumption side of the PRIMARY VALUE FEATURE - scrollable feed of generated insights with cards, charts, and actions

**Independent Test**: Generate insights for active configurations, view them in feed interface, scroll, filter, mark as read/important, take actions on recommendations. Verify feed updates correctly.

### E2E Tests for User Story 2 ⚠️

- [ ] T094 [P] [US2] E2E test for insight feed in apps/frontend/tests/e2e/insights/insight-feed.spec.ts
- [ ] T095 [P] [US2] E2E test for feed actions (mark read, important, take action) in apps/frontend/tests/e2e/insights/feed-actions.spec.ts

### Implementation for User Story 2

#### Insight Feed Page

- [ ] T096 [P] [US2] Create insight feed page route at apps/frontend/src/routes/insights/feed.tsx
- [ ] T097 [US2] Implement InsightFeed component with infinite scroll
- [ ] T098 [US2] Implement insight cards with key metrics, sparkline charts, summary
- [ ] T099 [US2] Implement reverse chronological ordering (newest first)

#### Feed Interactions

- [ ] T100 [P] [US2] Implement "Mark as Read" / "Mark as Important" actions
- [ ] T101 [US2] Implement "View Details" action to navigate to detail page
- [ ] T102 [US2] Implement "Take Action" on recommendations with context-aware actions
- [ ] T103 [US2] Implement unread count badge on feed navigation

#### Feed Filtering and Refresh

- [ ] T104 [P] [US2] Implement feed filters (date range, connectors, insight type, status)
- [ ] T105 [US2] Implement pull-to-refresh or refresh button
- [ ] T106 [US2] Implement real-time feed updates (polling or WebSocket)
- [ ] T107 [US2] Implement "Load More" button at feed bottom

**Checkpoint**: At this point, User Stories 1, 2, 3, AND 4 should all work independently

---

## Phase 7: User Story 5 - Modify Existing Insight Configuration (Priority: P2)

**Goal**: Enable insight editing through the same wizard flow, preserving activation status and configuration history

**Independent Test**: Edit an active insight: change connectors, add/remove metrics, adjust AI settings, save changes. Verify insight updates and continues running.

### E2E Tests for User Story 5 ⚠️

- [ ] T108 [P] [US5] E2E test for insight editing in apps/frontend/tests/e2e/insights/edit-insight.spec.ts

### Implementation for User Story 5

#### Edit Interface

- [ ] T109 [P] [US5] Create insight edit page route at apps/frontend/src/routes/insights/$insightId/edit.tsx
- [ ] T110 [US5] Implement edit wizard reusing InsightWizard component
- [ ] T111 [US5] Implement pre-loading of existing configurations into wizard steps
- [ ] T112 [US5] Implement configuration display showing current settings per step

#### Edit Validation and Saving

- [ ] T113 [P] [US5] Implement validation warnings for significant changes
- [ ] T114 [US5] Implement tRPC insights.update mutation call
- [ ] T115 [US5] Implement preservation of activation status across edits
- [ ] T116 [US5] Implement "Save Changes" and "Cancel" actions
- [ ] T117 [US5] Implement version history display

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Accessibility

- [ ] T118 [P] Run axe-core accessibility audit on all insight pages
- [ ] T119 [P] Implement keyboard navigation for wizard steps
- [ ] T120 [P] Add ARIA labels to all interactive elements
- [ ] T121 [P] Ensure all charts have alternative text and data table representations
- [ ] T122 [P] Implement focus trapping for modals and overlays

### Internationalization

- [ ] T123 [P] Add Arabic translations for all insight UI strings
- [ ] T124 [P] Test RTL layout on all insight pages
- [ ] T125 [P] Implement locale-aware date/time formatting
- [ ] T126 [P] Verify logical properties for spacing in RTL mode

### Performance

- [ ] T127 [P] Implement route-based code splitting for insight pages
- [ ] T128 [P] Add virtual scrolling for insight list and feed
- [ ] T129 [P] Optimize chart rendering with memoization
- [ ] T130 [P] Implement data caching for connector and metric lookups
- [ ] T131 [P] Add loading skeletons for better perceived performance

### Testing

- [ ] T132 [P] Add unit tests for InsightWizard state management
- [ ] T133 [P] Add unit tests for MetricChart component
- [ ] T134 [P] Add unit tests for FilterBar and search logic
- [ ] T135 [P] Add visual regression tests for insight cards and charts

### Documentation

- [ ] T136 [P] Document insight creation workflow in quickstart.md
- [ ] T137 [P] Add component documentation for InsightWizard
- [ ] T138 [P] Document tRPC API contracts in contracts/insights-api.md
- [ ] T139 [P] Create data model documentation in data-model.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational phase completion
  - US1 (P1): Can start after Foundational - No dependencies on other stories
  - US3 (P1): Can start after Foundational - No dependencies on other stories
  - US4 (P2): Can start after Foundational - May integrate with US1/US3 but independently testable
  - US2 (P2): Can start after Foundational - Depends on insights being created (US1) for full testing
  - US5 (P2): Can start after Foundational - Depends on US1 for insights to edit
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Configure/Activate**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P1) - Manage/Monitor**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P2) - Analyze Details**: Can start after Foundational (Phase 2) - Requires insights from US1 for full testing but core UI independent
- **User Story 2 (P2) - View Feed**: Can start after Foundational (Phase 2) - Requires generated insights from US1 for full testing
- **User Story 5 (P2) - Modify Config**: Can start after Foundational (Phase 2) - Requires insights from US1 to edit

### Within Each User Story

- E2E tests MUST be written and FAIL before implementation
- UI components before integration
- State management before wizard implementation
- Core implementation before actions and polish
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational data layer tasks marked [P] can run in parallel
- Once Foundational phase completes, US1 and US3 can start in parallel (both P1)
- US2, US4, and US5 can run in parallel after US1 is complete (all P2)
- All E2E tests for a user story marked [P] can run in parallel
- Different UI components marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1 (Wizard Steps)

```bash
# Launch all wizard step components together:
Task: "Create TemplateSelector component"
Task: "Create ConnectorSelector component"
Task: "Create MetricSelector component"
Task: "Create AIConfigPanel component"
Task: "Create ScheduleConfig component"

# These can all be built in parallel by different developers
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 3 Only - P1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Insight Creation Wizard)
4. Complete Phase 4: User Story 3 (Insight Management)
5. **STOP and VALIDATE**: Test US1 and US3 independently
6. Deploy/demo P1 MVP (core insight creation and management)

### Incremental Delivery (Recommended)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (P1) → Test independently → Deploy/Demo (MVP Part 1!)
3. Add User Story 3 (P1) → Test independently → Deploy/Demo (MVP Complete!)
4. Add User Story 4 (P2) → Test independently → Deploy/Demo (Enhanced Analytics)
5. Add User Story 2 (P2) → Test independently → Deploy/Demo (Feed Consumption)
6. Add User Story 5 (P2) → Test independently → Deploy/Demo (Full Editing)
7. Complete Polish phase → Production-ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (P1) - Insight Creation Wizard
   - Developer B: User Story 3 (P1) - Insight Management
3. After US1 and US3 complete:
   - Developer A: User Story 4 (P2) - Detail View with Charts
   - Developer B: User Story 2 (P2) - Insight Feed
   - Developer C: User Story 5 (P2) - Edit Interface
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- E2E tests must fail before implementation (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- This is the HIGHEST PRIORITY phase - the PRIMARY VALUE FEATURE of the platform
- Focus on delivering US1 and US3 first (P1) for MVP, then add P2 features
- All components must support RTL/LTR and WCAG 2.1 AA accessibility
- Use existing atoms and molecules from Phase 00 (Foundation) wherever possible
- Reuse components from Phase 03 (Connectors) for connector selection
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
