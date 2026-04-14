---
description: "Task list for Phase 11 (Administration) implementation"
---

# Tasks: Administration

**Input**: Design documents from `/specs/01-ui/11-administration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: E2E tests for critical admin workflows are included in this phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web frontend**: `apps/web/src/`
- **API backend**: `packages/api/src/`
- **Database**: `packages/database/src/`
- **Components**: `apps/web/src/components/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Admin infrastructure initialization and base components

- [ ] T001 Create admin route structure under `apps/web/src/routes/admin/` with index, health, users, and audit routes
- [ ] T002 [P] Create admin-only tRPC middleware at `packages/api/src/router/middleware/admin-only.ts`
- [ ] T003 [P] Create audit log database schema at `packages/database/src/schema/audit.ts` with indexes
- [ ] T004 [P] Run database migration for audit logs table using Drizzle
- [ ] T005 [P] Create base admin layout component at `apps/web/src/components/admin/templates/AdminLayout.tsx`
- [ ] T006 Add admin navigation sidebar at `apps/web/src/components/admin/organisms/AdminSidebar.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Create admin router aggregation at `packages/api/src/router/admin/index.ts` combining health, users, and audit routers
- [ ] T008 [P] Implement audit log trigger system at `packages/database/src/triggers/audit-trigger.ts` for automatic logging
- [ ] T009 [P] Create audit service at `packages/api/src/services/audit-service.ts` for log creation with sensitive data masking
- [ ] T010 Create base admin organisms directory at `apps/web/src/components/admin/organisms/`
- [ ] T011 Create base admin molecules directory at `apps/web/src/components/admin/molecules/`
- [ ] T012 [P] Create admin hooks directory at `apps/web/src/components/admin/hooks/`
- [ ] T013 Create unauthorized access page at `apps/web/src/routes/unauthorized.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - System Health Dashboard (Priority: P1) 🎯 MVP

**Goal**: Provide administrators with real-time visibility into system health metrics and active alerts

**Independent Test**: Display mock health data on dashboard with metric cards and alert notifications

### Implementation for User Story 1

- [ ] T014 [P] [US1] Create MetricCard molecule at `apps/web/src/components/admin/molecules/MetricCard.tsx` with value, label, trend indicator
- [ ] T015 [P] [US1] Create AlertNotification molecule at `apps/web/src/components/admin/molecules/AlertNotification.tsx` with severity badge
- [ ] T016 [P] [US1] Install Recharts package for data visualizations
- [ ] T017 [P] [US1] Create MetricChart component at `apps/web/src/components/admin/molecules/MetricChart.tsx` using Recharts LineChart
- [ ] T018 [US1] Create useSystemHealth hook at `apps/web/src/components/admin/hooks/useSystemHealth.ts` with tRPC query and polling
- [ ] T019 [US1] Create useSystemAlerts hook at `apps/web/src/components/admin/hooks/useSystemAlerts.ts` with tRPC query
- [ ] T020 [US1] Create HealthDashboard organism at `apps/web/src/components/admin/organisms/HealthDashboard.tsx` with metric grid and charts
- [ ] T021 [US1] Create health route at `apps/web/src/routes/admin.health.tsx` using HealthDashboard component
- [ ] T022 [US1] Implement health tRPC router at `packages/api/src/router/admin/health.router.ts` with getMetrics and getAlerts procedures
- [ ] T023 [US1] Add metric history query to health router for chart data with time range filtering
- [ ] T024 [US1] Add real-time polling to health hooks (5-10 second intervals) for metric updates
- [ ] T025 [US1] Implement color-coded status indicators (green/yellow/red) for health metrics
- [ ] T026 [US1] Add loading and error states to health dashboard

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - User Administration Interface (Priority: P1) 🎯 MVP

**Goal**: Enable administrators to manage user accounts, roles, and permissions through a comprehensive interface

**Independent Test**: Display mock user list with search, filters, and user profile editing

### Implementation for User Story 2

- [ ] T027 [P] [US2] Create RoleBadge molecule at `apps/web/src/components/admin/molecules/RoleBadge.tsx` with color coding
- [ ] T028 [P] [US2] Create UserSearchFilter molecule at `apps/web/src/components/admin/molecules/UserSearchFilter.tsx` with text search and dropdowns
- [ ] T029 [P] [US2] Create UserBulkActions molecule at `apps/web/src/components/admin/molecules/UserBulkActions.tsx` with bulk operations
- [ ] T030 [US2] Create useUserList hook at `apps/web/src/components/admin/hooks/useUserList.ts` with pagination and filters
- [ ] T031 [US2] Create UserTable organism at `apps/web/src/components/admin/organisms/UserTable.tsx` with Mantine Table component
- [ ] T032 [US2] Create UserEditModal component at `apps/web/src/components/admin/organisms/UserEditModal.tsx` for role/status changes
- [ ] T033 [US2] Create users list route at `apps/web/src/routes/admin.users.tsx` using UserTable component
- [ ] T034 [US2] Create user detail route at `apps/web/src/routes/admin.users.$userId_.tsx` with profile and edit options
- [ ] T035 [US2] Implement users tRPC router at `packages/api/src/router/admin/users.router.ts` with list, update, bulkUpdate procedures
- [ ] T036 [US2] Add user query with pagination, search, role, status, and tenant filters to users router
- [ ] T037 [US2] Implement updateUser mutation with self-modification prevention (cannot change own admin role)
- [ ] T038 [US2] Implement bulkUpdate mutation with validation and self-modification prevention
- [ ] T039 [US2] Add resetPassword mutation with email notification option
- [ ] T040 [US2] Implement server-side pagination logic in user list query (50 users per page default)
- [ ] T041 [US2] Add user row actions menu (edit, suspend, reset password, view details)
- [ ] T042 [US2] Implement bulk selection checkboxes in user table
- [ ] T043 [US2] Add confirmation dialogs for destructive actions (suspend, delete)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Audit Log Viewer (Priority: P2)

**Goal**: Provide administrators with comprehensive audit log viewing, filtering, and export capabilities

**Independent Test**: Display mock audit log data with filters, search, and export functionality

### Implementation for User Story 3

- [ ] T044 [P] [US3] Create AuditLogFilters molecule at `apps/web/src/components/admin/molecules/AuditLogFilters.tsx` with date range, type, severity filters
- [ ] T045 [P] [US3] Create AuditLogDetail component at `apps/web/src/components/admin/organisms/AuditLogDetail.tsx` for event information
- [ ] T046 [US3] Create useAuditLogs hook at `apps/web/src/components/admin/hooks/useAuditLogs.ts` with pagination and filters
- [ ] T047 [US3] Create AuditLogViewer organism at `apps/web/src/components/admin/organisms/AuditLogViewer.tsx` with expandable table
- [ ] T048 [US3] Create audit log route at `apps/web/src/routes/admin.audit.tsx` using AuditLogViewer component
- [ ] T049 [US3] Implement audit tRPC router at `packages/api/src/router/admin/audit.router.ts` with query, getById, export procedures
- [ ] T050 [US3] Add audit log query with pagination, date range, event type, user, tenant, severity filters
- [ ] T051 [US3] Implement keyword search across audit log fields (description, user email, IP address)
- [ ] T052 [US3] Add audit log export mutation supporting CSV and JSON formats with 100,000 entry limit
- [ ] T053 [US3] Implement server-side filtering logic with database indexes for performance
- [ ] T054 [US3] Add expandable table rows for detailed event information
- [ ] T055 [US3] Create audit log detail drawer with before/after state display
- [ ] T056 [US3] Add CSV/JSON export button with file download functionality
- [ ] T057 [US3] Implement event type badges with color coding by severity

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Admin-Only Access Controls (Priority: P1) 🎯 MVP

**Goal**: Enforce admin-only access to all administrative features at both UI and API levels

**Independent Test**: Attempt to access admin routes with different user roles (admin, non-admin, unauthenticated)

### Implementation for User Story 4

- [ ] T058 [P] [US4] Create admin-auth utility at `apps/web/src/lib/admin-auth.ts` with role checking functions
- [ ] T059 [P] [US4] Add admin route protection to `apps/web/src/routes/admin.health.tsx` loader with redirect for non-admin
- [ ] T060 [P] [US4] Add admin route protection to `apps/web/src/routes/admin.users.tsx` loader with redirect for non-admin
- [ ] T061 [P] [US4] Add admin route protection to `apps/web/src/routes/admin.audit.tsx` loader with redirect for non-admin
- [ ] T062 [P] [US4] Apply admin-only middleware to health router procedures at `packages/api/src/router/admin/health.router.ts`
- [ ] T063 [P] [US4] Apply admin-only middleware to users router procedures at `packages/api/src/router/admin/users.router.ts`
- [ ] T064 [P] [US4] Apply admin-only middleware to audit router procedures at `packages/api/src/router/admin/audit.router.ts`
- [ ] T065 [US4] Test access control rejection for unauthenticated users (redirect to login)
- [ ] T066 [US4] Test access control rejection for non-admin users (redirect to unauthorized page)
- [ ] T067 [US4] Test admin user access to all admin routes and procedures
- [ ] T068 [US4] Add audit logging for all access control denials

**Checkpoint**: All user stories should now be independently functional with proper access control

---

## Phase 7: E2E Tests (Quality Assurance)

**Purpose**: Ensure critical admin workflows function correctly and can be tested automatically

- [ ] T069 [P] [E2E] Create health dashboard E2E test at `apps/web/e2e/admin/health.spec.ts` testing metric display and alerts
- [ ] T070 [P] [E2E] Create user admin E2E test at `apps/web/e2e/admin/users.spec.ts` testing search, filter, edit workflows
- [ ] T071 [P] [E2E] Create audit log E2E test at `apps/web/e2e/admin/audit.spec.ts` testing filters, search, export
- [ ] T072 [P] [E2E] Create access control E2E test at `apps/web/e2e/admin/access-control.spec.ts` testing admin/non-admin access
- [ ] T073 [P] [E2E] Create bulk user actions E2E test at `apps/web/e2e/admin/bulk-actions.spec.ts` testing multi-user operations
- [ ] T074 [P] [E2E] Create audit logging E2E test at `apps/web/e2e/admin/audit-logging.spec.ts` verifying all admin actions are logged

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T075 [P] Add comprehensive error handling to all admin tRPC procedures with user-friendly messages
- [ ] T076 [P] Implement loading skeletons for all admin tables and metric cards
- [ ] T077 [P] Add toast notifications for successful admin actions (user updated, bulk operations completed)
- [ ] T078 [P] Add RTL layout testing and fixes for all admin components
- [ ] T079 [P] Implement accessibility testing with axe-core and fix any violations
- [ ] T080 [P] Add keyboard navigation support to all admin tables and modals
- [ ] T081 [P] Optimize audit log queries with database indexes on timestamp, event type, actor, tenant
- [ ] T082 [P] Add metrics dashboard time range selector (1h, 24h, 7d, custom)
- [ ] T083 [P] Add responsive design testing for mobile and tablet viewport sizes
- [ ] T084 [P] Implement rate limiting on admin operations to prevent abuse
- [ ] T085 [P] Add comprehensive inline documentation for admin components and hooks
- [ ] T086 [P] Performance test audit log viewer with 1M+ entries using pagination and filters
- [ ] T087 [P] Performance test user list with 10,000+ users using pagination and search
- [ ] T088 [P] Add unit tests for admin route protection utilities
- [ ] T089 [P] Add unit tests for tRPC admin-only middleware
- [ ] T090 [P] Add unit tests for audit log filter builders

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - User Story 1 (Health Dashboard): Can proceed independently after Foundational
  - User Story 2 (User Admin): Can proceed independently after Foundational
  - User Story 3 (Audit Logs): Can proceed independently after Foundational
  - User Story 4 (Access Control): Can proceed independently after Foundational
- **E2E Tests (Phase 7)**: Depends on relevant user story completion
- **Polish (Phase 8)**: Depends on user stories being functionally complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- Molecules and hooks can be developed in parallel (marked with [P])
- Organisms depend on molecules and hooks
- Routes depend on organisms
- tRPC routers can be developed in parallel with frontend components
- All tasks within a story should be complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (Phase 1) can run in parallel
- All Foundational tasks (Phase 2) marked [P] can run in parallel
- After Foundational phase, ALL user stories (US1, US2, US3, US4) can be developed in parallel by different team members
- All molecules within a user story marked [P] can run in parallel
- All E2E tests (Phase 7) can run in parallel after relevant stories are complete
- All polish tasks (Phase 8) marked [P] can run in parallel

---

## Parallel Example: User Story 1 (Health Dashboard)

```bash
# Launch all molecules for User Story 1 together:
Task T014: "Create MetricCard molecule at apps/web/src/components/admin/molecules/MetricCard.tsx"
Task T015: "Create AlertNotification molecule at apps/web/src/components/admin/molecules/AlertNotification.tsx"
Task T016: "Install Recharts package for data visualizations"
Task T017: "Create MetricChart component at apps/web/src/components/admin/molecules/MetricChart.tsx"

# Launch all hooks for User Story 1 together:
Task T018: "Create useSystemHealth hook at apps/web/src/components/admin/hooks/useSystemHealth.ts"
Task T019: "Create useSystemAlerts hook at apps/web/src/components/admin/hooks/useSystemAlerts.ts"

# Launch backend and frontend in parallel:
Task T022: "Implement health tRPC router at packages/api/src/router/admin/health.router.ts"
Task T020: "Create HealthDashboard organism at apps/web/src/components/admin/organisms/HealthDashboard.tsx"
```

---

## Implementation Strategy

### MVP First (User Stories 1, 2, 4 Only - P1 Priority)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Health Dashboard)
4. Complete Phase 4: User Story 2 (User Administration)
5. Complete Phase 6: User Story 4 (Access Control)
6. **STOP and VALIDATE**: Test all P1 stories independently
7. Deploy/demo if ready

### Incremental Delivery (Recommended)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Health Dashboard) → Test independently → Deploy/Demo (MVP slice 1)
3. Add User Story 2 (User Administration) → Test independently → Deploy/Demo (MVP slice 2)
4. Add User Story 4 (Access Control) → Test independently → Deploy/Demo (MVP slice 3)
5. Add User Story 3 (Audit Logs) → Test independently → Deploy/Demo (Full feature set)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy (Maximum Velocity)

With multiple developers after Foundational phase:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Health Dashboard)
   - Developer B: User Story 2 (User Administration)
   - Developer C: User Story 4 (Access Control)
   - Developer D: User Story 3 (Audit Logs)
3. Stories complete and integrate independently
4. Team converges for E2E testing and polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Access control (US4) is critical - implement early even though it's P1 priority
- Audit log viewer (US3) is P2 but important for compliance and security
- Performance testing is critical for audit logs (millions of entries) and user lists (10,000+ users)
- All admin actions must be logged to the audit trail automatically
- Prevent self-modification of admin roles and suspension
