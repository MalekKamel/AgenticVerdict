# Tasks: Connector Management UI

**Input**: Design documents from `/specs/01-ui/03-connectors/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: E2E tests included for critical user journeys (OAuth flow, sync, configuration)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web application**: `apps/frontend/src/` (frontend), `apps/frontend/server/` (API)
- **Packages**: `packages/database/src/` (schema), `packages/api/src/` (services)
- **Tests**: `apps/frontend/tests/unit/` (unit), `apps/frontend/tests/e2e/` (E2E)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and connector-specific structure

- [ ] T001 Create connector-specific directory structure in apps/frontend/src/components/connectors/ (atoms/, molecules/, organisms/)
- [ ] T002 Create connector routes directory structure in apps/frontend/src/routes/connectors/
- [ ] T003 [P] Create connector test directories: apps/frontend/tests/unit/components/connectors/ and apps/frontend/tests/e2e/connectors/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core connector infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Define Drizzle schema for connectors table in packages/database/src/schema/connectors.ts
- [ ] T005 [P] Define TypeScript interfaces for Connector, ConnectorConfig, ConnectorHealth, OAuthState in apps/frontend/src/types/connector.ts
- [ ] T006 [P] Define Zod validation schemas for connector operations in packages/api/src/schemas/connector.schema.ts
- [ ] T007 Implement tRPC router stubs for connectors in apps/frontend/server/api/routers/connectors.ts (all procedures with placeholder implementations)
- [ ] T008 [P] Implement connector service stubs in packages/api/src/services/connector-service.ts (business logic placeholders)
- [ ] T009 Create connector store for filter state in apps/frontend/src/stores/connector-store.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View Connector Health and Status (Priority: P1) 🎯 MVP

**Goal**: Display all connectors in a card-based grid with health status indicators, filtering, and quick actions

**Independent Test**: Navigate to `/connectors`, verify connector cards display with health status (green/yellow/red), filter by domain and status, trigger manual sync

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] E2E test for connector list page load in apps/frontend/tests/e2e/connectors/connector-list.spec.ts
- [ ] T011 [P] [US1] E2E test for connector filtering by domain in apps/frontend/tests/e2e/connectors/connector-list.spec.ts
- [ ] T012 [P] [US1] E2E test for connector filtering by status in apps/frontend/tests/e2e/connectors/connector-list.spec.ts
- [ ] T013 [P] [US1] E2E test for manual sync trigger in apps/frontend/tests/e2e/connectors/connector-list.spec.ts
- [ ] T014 [P] [US1] Unit test for ConnectorCard component in apps/frontend/tests/unit/components/connectors/ConnectorCard.test.tsx

### Implementation for User Story 1

- [ ] T015 [P] [US1] Create StatusBadge atom component in apps/frontend/src/components/connectors/atoms/StatusBadge.tsx
- [ ] T016 [P] [US1] Create DomainTag atom component in apps/frontend/src/components/connectors/atoms/DomainTag.tsx
- [ ] T017 [P] [US1] Create ConnectorIcon atom component in apps/frontend/src/components/connectors/atoms/ConnectorIcon.tsx
- [ ] T018 [P] [US1] Create SyncButton atom component in apps/frontend/src/components/connectors/atoms/SyncButton.tsx
- [ ] T019 [P] [US1] Create ConnectorCard molecule component in apps/frontend/src/components/connectors/molecules/ConnectorCard.tsx (depends on T015, T016, T017, T018)
- [ ] T020 [P] [US1] Create FilterBar molecule component in apps/frontend/src/components/connectors/molecules/FilterBar.tsx
- [ ] T021 [US1] Create ConnectorGrid organism component in apps/frontend/src/components/connectors/organisms/ConnectorGrid.tsx (depends on T019)
- [ ] T022 [US1] Create connector list page route in apps/frontend/src/routes/connectors/index.tsx (depends on T020, T021)
- [ ] T023 [US1] Implement tRPC connectors.list procedure in apps/frontend/server/api/routers/connectors.ts
- [ ] T024 [US1] Implement tRPC connectors.sync procedure in apps/frontend/server/api/routers/connectors.ts
- [ ] T025 [US1] Implement connector service listConnectors method in packages/api/src/services/connector-service.ts
- [ ] T026 [US1] Implement connector service triggerSync method in packages/api/src/services/connector-service.ts
- [ ] T027 [US1] Add connector list to sidebar navigation in apps/frontend/src/routes/_layouts/dashboard.tsx
- [ ] T028 [US1] Add loading states (skeleton cards) to connector list page
- [ ] T029 [US1] Add empty state to connector list page (no connectors connected)
- [ ] T030 [US1] Add error handling and retry logic to connector list page
- [ ] T031 [US1] Implement RTL layout support for connector cards and filter bar
- [ ] T032 [US1] Add accessibility features (ARIA labels, keyboard navigation) to connector list

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Add and Authenticate New Connectors (Priority: P1) 🎯 MVP

**Goal**: Multi-step connector setup wizard with platform selection, OAuth authentication, and initial configuration

**Independent Test**: Navigate to `/connectors/add`, complete setup flow for one connector (Meta OAuth), verify successful authentication and data fetch

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T033 [P] [US2] E2E test for platform selection step in apps/frontend/tests/e2e/connectors/connector-add.spec.ts
- [ ] T034 [P] [US2] E2E test for OAuth authentication flow in apps/frontend/tests/e2e/connectors/connector-add.spec.ts
- [ ] T035 [P] [US2] E2E test for configuration step in apps/frontend/tests/e2e/connectors/connector-add.spec.ts
- [ ] T036 [P] [US2] E2E test for confirmation step in apps/frontend/tests/e2e/connectors/connector-add.spec.ts
- [ ] T037 [P] [US2] Unit test for PlatformCard component in apps/frontend/tests/unit/components/connectors/PlatformCard.test.tsx
- [ ] T038 [P] [US2] Unit test for ConnectorSetupWizard component in apps/frontend/tests/unit/components/connectors/ConnectorSetupWizard.test.tsx

### Implementation for User Story 2

- [ ] T039 [P] [US2] Create PlatformCard molecule component in apps/frontend/src/components/connectors/molecules/PlatformCard.tsx
- [ ] T040 [P] [US2] Create PlatformGrid organism component in apps/frontend/src/components/connectors/organisms/PlatformGrid.tsx (depends on T039)
- [ ] T041 [P] [US2] Create MetricCheckbox molecule component in apps/frontend/src/components/connectors/molecules/MetricCheckbox.tsx
- [ ] T042 [P] [US2] Create ConnectorConfigForm organism component in apps/frontend/src/components/connectors/organisms/ConnectorConfigForm.tsx (depends on T041)
- [ ] T043 [US2] Create ConnectorSetupWizard organism component in apps/frontend/src/components/connectors/organisms/ConnectorSetupWizard.tsx (depends on T040, T042)
- [ ] T044 [US2] Create connector add page route in apps/frontend/src/routes/connectors/add.tsx (depends on T043)
- [ ] T045 [US2] Implement OAuth popup handling hook in apps/frontend/src/hooks/useOAuthFlow.ts
- [ ] T046 [US2] Implement tRPC connectors.getAvailablePlatforms procedure in apps/frontend/server/api/routers/connectors.ts
- [ ] T047 [US2] Implement tRPC connectors.create procedure in apps/frontend/server/api/routers/connectors.ts
- [ ] T048 [US2] Implement tRPC connectors.initiateOAuth procedure in apps/frontend/server/api/routers/connectors.ts
- [ ] T049 [US2] Implement tRPC connectors.completeOAuth procedure in apps/frontend/server/api/routers/connectors.ts
- [ ] T050 [US2] Implement tRPC connectors.getAvailableMetrics procedure in apps/frontend/server/api/routers/connectors.ts
- [ ] T051 [US2] Implement connector service createConnector method in packages/api/src/services/connector-service.ts
- [ ] T052 [US2] Implement connector service initiateOAuth method in packages/api/src/services/connector-service.ts
- [ ] T053 [US2] Implement connector service completeOAuth method in packages/api/src/services/connector-service.ts
- [ ] T054 [US2] Implement connector service getAvailablePlatforms method in packages/api/src/services/connector-service.ts
- [ ] T055 [US2] Implement connector service getAvailableMetrics method in packages/api/src/services/connector-service.ts
- [ ] T056 [US2] Implement OAuth state parameter generation and validation in packages/api/src/services/oauth-service.ts
- [ ] T057 [US2] Implement OAuth callback handler in apps/frontend/src/routes/connectors/oauth/callback.tsx
- [ ] T058 [US2] Add query parameter handling (?platform=meta, ?redirect=/insights) to connector add page
- [ ] T059 [US2] Add loading states (stepper progress, spinners) to setup wizard
- [ ] T060 [US2] Add error handling for OAuth failures (denied permissions, network errors)
- [ ] T061 [US2] Implement RTL layout support for setup wizard and platform cards
- [ ] T062 [US2] Add accessibility features (step progress, form labels, error messages) to setup wizard

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Configure Connector Settings (Priority: P2)

**Goal**: Customize connector behavior (accounts, metrics, sync frequency, notifications) via configuration page

**Independent Test**: Navigate to connector configure page, modify sync frequency and enabled metrics, save changes, verify settings persist

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T063 [P] [US3] E2E test for connector configuration in apps/frontend/tests/e2e/connectors/connector-configure.spec.ts
- [ ] T064 [P] [US3] Unit test for ConnectorConfigForm component in apps/frontend/tests/unit/components/connectors/ConnectorConfigForm.test.tsx

### Implementation for User Story 3

- [ ] T065 [US3] Reuse ConnectorConfigForm organism from US2 (T042) or create enhanced version
- [ ] T066 [US3] Create connector configure page route in apps/frontend/src/routes/connectors/$connectorId.configure.tsx
- [ ] T067 [US3] Implement tRPC connectors.update procedure in apps/frontend/server/api/routers/connectors.ts
- [ ] T068 [US3] Implement tRPC connectors.testConnection procedure in apps/frontend/server/api/routers/connectors.ts
- [ ] T069 [US3] Implement tRPC connectors.getById procedure in apps/frontend/server/api/routers/connectors.ts
- [ ] T070 [US3] Implement connector service updateConnector method in packages/api/src/services/connector-service.ts
- [ ] T071 [US3] Implement connector service testConnection method in packages/api/src/services/connector-service.ts
- [ ] T072 [US3] Implement connector service getConnectorById method in packages/api/src/services/connector-service.ts
- [ ] T073 [US3] Add form validation (Zod schema) for connector configuration
- [ ] T074 [US3] Add unsaved changes detection and warning to configure page
- [ ] T075 [US3] Add loading states (save button spinner, test connection button)
- [ ] T076 [US3] Add error handling (validation errors, API failures) to configure page
- [ ] T077 [US3] Implement RTL layout support for configuration forms
- [ ] T078 [US3] Add accessibility features (form labels, error messages, required indicators) to configure page

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - View Connector Details and Troubleshoot Issues (Priority: P2)

**Goal**: Comprehensive connector detail view with health dashboard, recent data, sync history, and troubleshooting guidance

**Independent Test**: Navigate to connector detail page, verify all sections display correctly (health, recent data, sync history, troubleshooting), trigger manual sync

### Tests for User Story 4 (OPTIONAL - only if tests requested) ⚠️

- [ ] T079 [P] [US4] E2E test for connector detail page in apps/frontend/tests/e2e/connectors/connector-detail.spec.ts
- [ ] T080 [P] [US4] Unit test for ConnectorHealth organism component in apps/frontend/tests/unit/components/connectors/ConnectorHealth.test.tsx

### Implementation for User Story 4

- [ ] T081 [P] [US4] Create HealthCard molecule component in apps/frontend/src/components/connectors/molecules/HealthCard.tsx
- [ ] T082 [P] [US4] Create SyncHistoryTable molecule component in apps/frontend/src/components/connectors/molecules/SyncHistoryTable.tsx
- [ ] T083 [P] [US4] Create TroubleshootingCard molecule component in apps/frontend/src/components/connectors/molecules/TroubleshootingCard.tsx
- [ ] T084 [US4] Create ConnectorHealth organism component in apps/frontend/src/components/connectors/organisms/ConnectorHealth.tsx (depends on T081)
- [ ] T085 [US4] Create connector detail page route in apps/frontend/src/routes/connectors/$connectorId.tsx (depends on T084, T082, T083)
- [ ] T086 [US4] Implement tRPC connectors.getHealthHistory procedure in apps/frontend/server/api/routers/connectors.ts
- [ ] T087 [US4] Implement tRPC connectors.getSyncHistory procedure in apps/frontend/server/api/routers/connectors.ts
- [ ] T088 [US4] Implement connector service getHealthHistory method in packages/api/src/services/connector-service.ts
- [ ] T089 [US4] Implement connector service getSyncHistory method in packages/api/src/services/connector-service.ts
- [ ] T090 [US4] Add Recharts integration for health metrics visualization (LineChart, BarChart, AreaChart)
- [ ] T091 [US4] Add polling or subscription for real-time health updates on detail page
- [ ] T092 [US4] Add loading states (health dashboard skeleton, sync history skeleton)
- [ ] T093 [US4] Add error handling (failed syncs, health check failures) to detail page
- [ ] T094 [US4] Implement RTL layout support for detail page and charts
- [ ] T095 [US4] Add accessibility features (chart labels, table headers, status indicators) to detail page

**Checkpoint**: At this point, User Stories 1-4 should all be independently functional

---

## Phase 7: User Story 5 - Disconnect Connectors Safely (Priority: P3)

**Goal**: Safe connector removal flow with impact warnings, affected insights display, and confirmation requirement

**Independent Test**: Navigate to connector remove page, review warnings, type "REMOVE" confirmation, verify connector is disconnected

### Tests for User Story 5 (OPTIONAL - only if tests requested) ⚠️

- [ ] T096 [P] [US5] E2E test for connector removal flow in apps/frontend/tests/e2e/connectors/connector-remove.spec.ts
- [ ] T097 [P] [US5] Unit test for confirmation input validation in apps/frontend/tests/unit/components/connectors/ConfirmationInput.test.tsx

### Implementation for User Story 5

- [ ] T098 [P] [US5] Create ConfirmationInput molecule component in apps/frontend/src/components/connectors/molecules/ConfirmationInput.tsx
- [ ] T099 [US5] Create connector remove page route in apps/frontend/src/routes/connectors/$connectorId.remove.tsx (depends on T098)
- [ ] T100 [US5] Implement tRPC connectors.getAffectedInsights procedure in apps/frontend/server/api/routers/connectors.ts
- [ ] T101 [US5] Implement tRPC connectors.remove procedure in apps/frontend/server/api/routers/connectors.ts
- [ ] T102 [US5] Implement tRPC connectors.pause procedure in apps/frontend/server/api/routers/connectors.ts
- [ ] T103 [US5] Implement tRPC connectors.exportData procedure in apps/frontend/server/api/routers/connectors.ts
- [ ] T104 [US5] Implement connector service getAffectedInsights method in packages/api/src/services/connector-service.ts
- [ ] T105 [US5] Implement connector service removeConnector method in packages/api/src/services/connector-service.ts
- [ ] T106 [US5] Implement connector service pauseConnector method in packages/api/src/services/connector-service.ts
- [ ] T107 [US5] Implement connector service exportConnectorData method in packages/api/src/services/connector-service.ts
- [ ] T108 [US5] Add "Type REMOVE to confirm" validation logic
- [ ] T109 [US5] Add export functionality (CSV/Excel generation) for historical data
- [ ] T110 [US5] Add loading states (export button spinner, confirm button spinner)
- [ ] T111 [US5] Add error handling (removal failures, export failures) to remove page
- [ ] T112 [US5] Implement RTL layout support for remove page and warning cards
- [ ] T113 [US5] Add accessibility features (warning alerts, confirmation input, button labels) to remove page

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: User Story 6 - Multi-Domain Connector Discovery and Filtering (Priority: P2)

**Goal**: Filter connectors by business domain tags (Marketing, SEO, Social, Local) for efficient multi-domain workflows

**Independent Test**: Filter connector list by different domains, verify only relevant connectors display, confirm domain tags visible on cards

### Tests for User Story 6 (OPTIONAL - only if tests requested) ⚠️

- [ ] T114 [P] [US6] E2E test for domain filtering in apps/frontend/tests/e2e/connectors/connector-list.spec.ts

### Implementation for User Story 6

- [ ] T115 [US6] Enhance FilterBar molecule (T020) with domain dropdown filter
- [ ] T116 [US6] Add domain tags display to ConnectorCard molecule (T019) - already implemented via DomainTag atom (T016)
- [ ] T117 [US6] Add domain tags display to PlatformCard molecule (T039) - already implemented via DomainTag atom (T016)
- [ ] T118 [US6] Update connector list query (T023) to support domain filtering
- [ ] T119 [US6] Add domain filter query parameter handling (?domain=marketing) to connector list page
- [ ] T120 [US6] Add domain filter to connector add wizard platform grid
- [ ] T121 [US6] Add domain filter to connector detail page (show which domains connector supports)
- [ ] T122 [US6] Implement combined filtering (domain + status) logic in connector store (T009)
- [ ] T123 [US6] Add "Clear Filters" functionality to connector list page
- [ ] T124 [US6] Implement RTL layout support for domain dropdown and filter chips
- [ ] T125 [US6] Add accessibility features (filter labels, clear button) to domain filtering

**Checkpoint**: Multi-domain filtering fully functional across all connector pages

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T126 [P] Add unit tests for all connector atoms (StatusBadge, DomainTag, ConnectorIcon, SyncButton) in apps/frontend/tests/unit/components/connectors/atoms/
- [ ] T127 [P] Add unit tests for all connector molecules (ConnectorCard, PlatformCard, FilterBar, HealthCard, etc.) in apps/frontend/tests/unit/components/connectors/molecules/
- [ ] T128 [P] Add unit tests for connector hooks (useConnectorHealth, useOAuthFlow, useConnectorSync) in apps/frontend/tests/unit/hooks/
- [ ] T129 Code cleanup and refactoring (remove unused imports, consolidate duplicate logic)
- [ ] T130 Performance optimization (lazy load chart components, virtual scrolling for large connector lists)
- [ ] T131 Security hardening (CSRF protection for OAuth, credential encryption validation)
- [ ] T132 Bundle size optimization (tree-shaking check, code splitting validation)
- [ ] T133 Accessibility audit and remediation (axe-core scan, keyboard navigation testing)
- [ ] T134 RTL layout validation for all connector pages (Arabic language testing)
- [ ] T135 Documentation updates (component prop docs, API procedure docs)
- [ ] T136 Add connector list to dashboard quick actions (shortcut to add connector)
- [ ] T137 Add connector health indicators to dashboard overview (quick status view)
- [ ] T138 Implement connector search functionality (search by name, account)
- [ ] T139 Add connector usage analytics (track which connectors are most used)
- [ ] T140 Add connector health monitoring alerts (email notifications for unhealthy connectors)

---

## Phase 10: Integration & End-to-End Testing

**Purpose**: Comprehensive testing across all connector workflows

- [ ] T141 Write comprehensive E2E test suite for connector list page in apps/frontend/tests/e2e/connectors/connector-list.spec.ts
- [ ] T142 Write comprehensive E2E test suite for connector add flow in apps/frontend/tests/e2e/connectors/connector-add.spec.ts
- [ ] T143 Write comprehensive E2E test suite for connector configure in apps/frontend/tests/e2e/connectors/connector-configure.spec.ts
- [ ] T144 Write comprehensive E2E test suite for connector detail in apps/frontend/tests/e2e/connectors/connector-detail.spec.ts
- [ ] T145 Write comprehensive E2E test suite for connector removal in apps/frontend/tests/e2e/connectors/connector-remove.spec.ts
- [ ] T146 Write E2E test for multi-domain connector filtering in apps/frontend/tests/e2e/connectors/connector-list.spec.ts
- [ ] T147 Write E2E test for OAuth failure recovery in apps/frontend/tests/e2e/connectors/connector-add.spec.ts
- [ ] T148 Write E2E test for sync failure handling in apps/frontend/tests/e2e/connectors/connector-detail.spec.ts
- [ ] T149 Write E2E test for manual sync trigger in apps/frontend/tests/e2e/connectors/connector-list.spec.ts
- [ ] T150 Write E2E test for connector configuration validation in apps/frontend/tests/e2e/connectors/connector-configure.spec.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User Story 1 (Phase 3): P1 - MVP priority, implement first
  - User Story 2 (Phase 4): P1 - MVP priority, implement in parallel with US1 if staffed
  - User Story 3 (Phase 5): P2 - Implement after US1 and US2 complete
  - User Story 4 (Phase 6): P2 - Implement after US1 and US2 complete, can parallel with US3
  - User Story 5 (Phase 7): P3 - Implement after US1-US4 complete
  - User Story 6 (Phase 8): P2 - Implement after US1 complete, can integrate with any story
- **Polish (Phase 9)**: Depends on all desired user stories being complete
- **Integration (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on US1, but shares atoms/components
- **User Story 3 (P2)**: Depends on US2 for ConnectorConfigForm component (can reuse or extend)
- **User Story 4 (P2)**: No dependencies on US1-US3, but integrates with all connector pages
- **User Story 5 (P3)**: No dependencies on US1-US4, but should be implemented after detail page (US4) is complete
- **User Story 6 (P2)**: Extends US1 (filtering) and US2 (platform grid), can integrate incrementally

### Within Each User Story

- Tests MUST be written and FAIL before implementation (if tests included for that story)
- Atoms before molecules
- Molecules before organisms
- Organisms before pages
- Server procedures before client queries
- Core implementation before integration

### Parallel Opportunities

- **Setup (Phase 1)**: All tasks (T001-T003) can run in parallel
- **Foundational (Phase 2)**: T005, T006 can run in parallel; T007, T008 can run in parallel
- **User Story 1 (Phase 3)**: T015-T018 (atoms) can run in parallel; T019-T020 (molecules) can run in parallel after atoms
- **User Story 2 (Phase 4)**: T039-T040 (platform components) can run in parallel with T041-T042 (config components)
- **User Story 4 (Phase 6)**: T081-T083 (molecules) can run in parallel
- **Polish (Phase 9)**: T126-T128 (unit tests) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all atoms for User Story 1 together:
Task: T015 - Create StatusBadge atom component
Task: T016 - Create DomainTag atom component
Task: T017 - Create ConnectorIcon atom component
Task: T018 - Create SyncButton atom component

# Launch all molecules for User Story 1 together (after atoms complete):
Task: T019 - Create ConnectorCard molecule component
Task: T020 - Create FilterBar molecule component
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (View Connector Health)
4. **STOP and VALIDATE**: Test connector list page independently (filter, sync, view health)
5. Demo connector list functionality

### Incremental Delivery (Recommended)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Demo (MVP connector health monitoring!)
3. Add User Story 2 → Test independently → Demo (Connector setup works!)
4. Add User Story 3 → Test independently → Demo (Connector configuration works!)
5. Add User Story 4 → Test independently → Demo (Connector details work!)
6. Add User Story 5 → Test independently → Demo (Connector removal works!)
7. Add User Story 6 → Test independently → Demo (Multi-domain filtering works!)
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - **Developer A**: User Story 1 (Connector List + Health)
   - **Developer B**: User Story 2 (Connector Add + OAuth)
   - **Developer C**: User Story 3 (Connector Configure)
3. After US1-US3 complete:
   - **Developer A**: User Story 4 (Connector Detail)
   - **Developer B**: User Story 5 (Connector Remove)
   - **Developer C**: User Story 6 (Multi-Domain Filtering)
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing (if tests included for that story)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- OAuth flow requires special attention to security (state parameter, CSRF protection)
- RTL layout validation required for all connector pages
- Performance targets: <2s page load, <500ms filter response, <30s manual sync
