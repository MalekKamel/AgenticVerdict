---
description: "Task list for Phase 08 (Settings) implementation"
---

# Tasks: Settings

**Input**: Design documents from `/specs/01-ui/08-settings/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), contracts/

**Tests**: E2E tests with Playwright are required for critical user journeys (profile updates, team management, RTL switching). Unit tests with Vitest for form validation and business logic.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Each user story can be developed, tested, and deployed independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US0, US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/web/src/`
- **API**: `packages/api/src/router/`
- **Database**: `packages/database/src/schema/`
- **UI components**: `apps/web/src/components/`
- **Modules**: `apps/web/src/modules/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create settings directories per implementation plan (`apps/web/src/routes/settings_*.tsx`, `apps/web/src/components/settings/`, `apps/web/src/modules/settings/`)
- [ ] T002 [P] Install additional Mantine v9 dependencies (@mantine/dates, @mantine/dropzone if needed)
- [ ] T003 [P] Add timezone data package (date-fns-tz or luxon for IANA timezone support)
- [ ] T004 [P] Configure translation files for settings (en, ar, fr) in `apps/web/src/i18n/locales/settings.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create database schema for user_profiles in `packages/database/src/schema/user-profiles.ts`
- [ ] T006 [P] Create database schema for notification_preferences in `packages/database/src/schema/notification-preferences.ts`
- [ ] T007 [P] Create database schema for team_members in `packages/database/src/schema/team-members.ts`
- [ ] T008 [P] Create database schema for subscriptions in `packages/database/src/schema/subscriptions.ts`
- [ ] T009 Generate and apply database migrations using `drizzle-kit generate:pg` and `drizzle-kit push:pg`
- [ ] T010 Create base tRPC settings router structure in `packages/api/src/router/settings/index.ts`
- [ ] T011 Create settings layout route with tabs in `apps/web/src/routes/settings_.tsx`
- [ ] T012 Create settings store for page state (active tab, unsaved changes) in `apps/web/src/stores/settings-store.ts`
- [ ] T013 [P] Configure row-level security policies for all settings tables
- [ ] T014 [P] Create audit logging middleware for sensitive settings changes

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 0 - Settings Layout with Tabs (Priority: P0) 🎯 FOUNDATION

**Goal**: Provide tabbed navigation framework for all settings sections

**Independent Test**: Navigate to settings, click each tab, verify correct route change and layout consistency

### Tests for User Story 0 (REQUIRED) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T015 [P] [US0] E2E test for settings tab navigation in `apps/web/src/e2e/settings.spec.ts`
- [ ] T016 [P] [US0] E2E test for RTL layout in settings tabs in `apps/web/src/e2e/settings-rtl.spec.ts`
- [ ] T017 [P] [US0] Accessibility test for settings tabs (keyboard nav, ARIA) in `apps/web/src/e2e/settings-a11y.spec.ts`

### Implementation for User Story 0

- [ ] T018 [US0] Implement SettingsLayout component with tabs in `apps/web/src/components/settings/SettingsLayout.tsx`
- [ ] T019 [US0] Add tab configuration (value, label, requiredRole) in `apps/web/src/components/settings/SettingsLayout.tsx`
- [ ] T020 [US0] Implement tab change handler with unsaved changes warning in `apps/web/src/components/settings/SettingsLayout.tsx`
- [ ] T021 [US0] Add responsive behavior for mobile (horizontal tabs → dropdown) in `apps/web/src/components/settings/SettingsLayout.tsx`
- [ ] T022 [US0] Implement keyboard navigation for tabs (arrow keys, Enter/Space) in `apps/web/src/components/settings/SettingsLayout.tsx`
- [ ] T023 [US0] Add ARIA attributes for tabs accessibility in `apps/web/src/components/settings/SettingsLayout.tsx`
- [ ] T024 [US0] Create individual settings route files (`settings.profile.tsx`, `settings.notifications.tsx`, `settings.integrations.tsx`, `settings.team.tsx`, `settings.billing.tsx`) in `apps/web/src/routes/`
- [ ] T025 [US0] Add role-based access control for admin-only tabs (team, billing) in `apps/web/src/components/settings/SettingsLayout.tsx`
- [ ] T026 [US0] Implement browser back/forward navigation support in `apps/web/src/routes/settings_.tsx`
- [ ] T027 [US0] Add loading and error states for tab content in `apps/web/src/components/settings/SettingsLayout.tsx`

**Checkpoint**: At this point, User Story 0 should be fully functional and testable independently

---

## Phase 4: User Story 1 - User Profile Settings (Priority: P1) 🎯 MVP

**Goal**: Enable users to view and update their profile information (name, email, language, timezone)

**Independent Test**: Navigate to profile settings, modify fields, save, verify changes persist and reflect in UI (including RTL/LTR switch on language change)

### Tests for User Story 1 (REQUIRED) ⚠️

- [ ] T028 [P] [US1] Unit test for ProfileUpdateSchema validation in `apps/web/src/components/settings/__tests__/ProfileForm.test.tsx`
- [ ] T029 [P] [US1] E2E test for profile update and persistence in `apps/web/src/e2e/settings-profile.spec.ts`
- [ ] T030 [P] [US1] E2E test for language change triggering RTL layout in `apps/web/src/e2e/settings-rtl.spec.ts`
- [ ] T031 [P] [US1] E2E test for email verification flow in `apps/web/src/e2e/settings-profile.spec.ts`

### Implementation for User Story 1

- [ ] T032 [P] [US1] Create ProfileUpdateSchema (Zod) in `apps/web/src/modules/settings/schemas/profile.ts`
- [ ] T033 [P] [US1] Create profile tRPC router in `packages/api/src/router/settings/profile.ts`
- [ ] T034 [US1] Implement getProfile query in `packages/api/src/router/settings/profile.ts` (depends on T033)
- [ ] T035 [US1] Implement updateProfile mutation in `packages/api/src/router/settings/profile.ts` (depends on T034)
- [ ] T036 [US1] Add email verification logic when email changes in `packages/api/src/router/settings/profile.ts` (depends on T035)
- [ ] T037 [US1] Implement ProfileForm component in `apps/web/src/components/settings/ProfileForm.tsx` (depends on T032)
- [ ] T038 [US1] Add form fields (name, email, language, timezone) in `apps/web/src/components/settings/ProfileForm.tsx` (depends on T037)
- [ ] T039 [US1] Implement language selector with RTL trigger in `apps/web/src/components/settings/ProfileForm.tsx` (depends on T037)
- [ ] T040 [US1] Implement timezone selector with search in `apps/web/src/components/settings/ProfileForm.tsx` (depends on T037)
- [ ] T041 [US1] Add form validation and error handling in `apps/web/src/components/settings/ProfileForm.tsx` (depends on T037)
- [ ] T042 [US1] Implement unsaved changes warning in `apps/web/src/components/settings/ProfileForm.tsx` (depends on T037)
- [ ] T043 [US1] Create useProfileUpdate hook in `apps/web/src/modules/settings/useProfileUpdate.ts` (depends on T035)
- [ ] T044 [US1] Implement profile settings route in `apps/web/src/routes/settings.profile.tsx` (depends on T037, T043)
- [ ] T045 [US1] Add success/error notifications in `apps/web/src/routes/settings.profile.tsx` (depends on T044)
- [ ] T046 [US1] Invalidate user query on profile update to reflect changes in topbar in `apps/web/src/modules/settings/useProfileUpdate.ts` (depends on T043)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 5: User Story 2 - Notification Preferences (Priority: P1)

**Goal**: Enable users to control how and when they receive notifications (email, in-app, frequency, quiet hours)

**Independent Test**: Navigate to notification settings, modify preferences, save, verify notifications are delivered according to preferences

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T047 [P] [US2] Unit test for NotificationUpdateSchema validation in `apps/web/src/components/settings/__tests__/NotificationForm.test.tsx`
- [ ] T048 [P] [US2] E2E test for notification preferences update in `apps/web/src/e2e/settings-notifications.spec.ts`
- [ ] T049 [P] [US2] Integration test for notification delivery based on preferences in `apps/web/src/e2e/settings-notifications.spec.ts`

### Implementation for User Story 2

- [ ] T050 [P] [US2] Create NotificationUpdateSchema (Zod) in `apps/web/src/modules/settings/schemas/notifications.ts`
- [ ] T051 [P] [US2] Create notifications tRPC router in `packages/api/src/router/settings/notifications.ts`
- [ ] T052 [US2] Implement getNotificationPreferences query in `packages/api/src/router/settings/notifications.ts` (depends on T051)
- [ ] T053 [US2] Implement updateNotificationPreferences mutation in `packages/api/src/router/settings/notifications.ts` (depends on T052)
- [ ] T054 [US2] Implement NotificationForm component in `apps/web/src/components/settings/NotificationForm.tsx` (depends on T050)
- [ ] T055 [US2] Add channel toggles (email, in-app) in `apps/web/src/components/settings/NotificationForm.tsx` (depends on T054)
- [ ] T056 [US2] Implement digest frequency selector in `apps/web/src/components/settings/NotificationForm.tsx` (depends on T054)
- [ ] T057 [US2] Add quiet hours time picker in `apps/web/src/components/settings/NotificationForm.tsx` (depends on T054)
- [ ] T058 [US2] Implement per-type notification preferences in `apps/web/src/components/settings/NotificationForm.tsx` (depends on T054)
- [ ] T059 [US2] Add warning when all notifications disabled in `apps/web/src/components/settings/NotificationForm.tsx` (depends on T054)
- [ ] T060 [US2] Create useNotificationUpdate hook in `apps/web/src/modules/settings/useNotificationUpdate.ts` (depends on T053)
- [ ] T061 [US2] Implement notification settings route in `apps/web/src/routes/settings.notifications.tsx` (depends on T054, T060)
- [ ] T062 [US2] Add success/error notifications in `apps/web/src/routes/settings.notifications.tsx` (depends on T061)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 6: User Story 3 - Integration Settings (Priority: P2)

**Goal**: Enable users to view and manage their third-party integrations (connect, disconnect, view status, regenerate tokens)

**Independent Test**: Navigate to integration settings, view connected integrations, disconnect an integration, regenerate API token

### Tests for User Story 3 (REQUIRED) ⚠️

- [ ] T063 [P] [US3] E2E test for integration list display in `apps/web/src/e2e/settings-integrations.spec.ts`
- [ ] T064 [P] [US3] E2E test for integration disconnect flow in `apps/web/src/e2e/settings-integrations.spec.ts`
- [ ] T065 [P] [US3] E2E test for API token regeneration in `apps/web/src/e2e/settings-integrations.spec.ts`

### Implementation for User Story 3

- [ ] T066 [P] [US3] Create integrations tRPC router in `packages/api/src/router/settings/integrations.ts`
- [ ] T067 [US3] Implement getIntegrations query in `packages/api/src/router/settings/integrations.ts` (depends on T066, uses Phase 03 connectors)
- [ ] T068 [US3] Implement disconnectIntegration mutation in `packages/api/src/router/settings/integrations.ts` (depends on T067)
- [ ] T069 [US3] Implement regenerateApiToken mutation in `packages/api/src/router/settings/integrations.ts` (depends on T067)
- [ ] T070 [US3] Implement IntegrationList component in `apps/web/src/components/settings/IntegrationList.tsx` (depends on T067)
- [ ] T071 [US3] Add integration status indicators in `apps/web/src/components/settings/IntegrationList.tsx` (depends on T070)
- [ ] T072 [US3] Implement disconnect confirmation dialog in `apps/web/src/components/settings/IntegrationList.tsx` (depends on T070)
- [ ] T073 [US3] Add API token regeneration with confirmation in `apps/web/src/components/settings/IntegrationList.tsx` (depends on T070)
- [ ] T074 [US3] Display integration error messages with resolution steps in `apps/web/src/components/settings/IntegrationList.tsx` (depends on T070)
- [ ] T075 [US3] Implement integration settings route in `apps/web/src/routes/settings.integrations.tsx` (depends on T070)
- [ ] T076 [US3] Add "Manage Integration" link to Phase 03 connector detail pages in `apps/web/src/components/settings/IntegrationList.tsx` (depends on T070)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 7: User Story 4 - Team Management (Priority: P2)

**Goal**: Enable admins to invite team members, assign roles, manage permissions, and remove members

**Independent Test**: Admin navigates to team settings, invites a new member, assigns role, verifies member can access with appropriate permissions

### Tests for User Story 4 (REQUIRED) ⚠️

- [ ] T077 [P] [US4] Unit test for team invitation schema validation in `apps/web/src/components/settings/__tests__/TeamManagement.test.tsx`
- [ ] T078 [P] [US4] E2E test for team member invitation in `apps/web/src/e2e/settings-team.spec.ts`
- [ ] T079 [P] [US4] E2E test for role assignment and permission enforcement in `apps/web/src/e2e/settings-team.spec.ts`
- [ ] T080 [P] [US4] E2E test for team member removal in `apps/web/src/e2e/settings-team.spec.ts`
- [ ] T081 [P] [US4] E2E test for non-admin access denied to team settings in `apps/web/src/e2e/settings-team.spec.ts`

### Implementation for User Story 4

- [ ] T082 [P] [US4] Create TeamManagementSchema (Zod) in `apps/web/src/modules/settings/schemas/team.ts`
- [ ] T083 [P] [US4] Create team tRPC router in `packages/api/src/router/settings/team.ts`
- [ ] T084 [US4] Implement getTeamMembers query with admin check in `packages/api/src/router/settings/team.ts` (depends on T083)
- [ ] T085 [US4] Implement inviteTeamMember mutation with admin check in `packages/api/src/router/settings/team.ts` (depends on T084)
- [ ] T086 [US4] Implement updateTeamMemberRole mutation with admin check in `packages/api/src/router/settings/team.ts` (depends on T084)
- [ ] T087 [US4] Implement removeTeamMember mutation with admin check in `packages/api/src/router/settings/team.ts` (depends on T084)
- [ ] T088 [US4] Implement resendInvitation mutation in `packages/api/src/router/settings/team.ts` (depends on T085)
- [ ] T089 [US4] Implement TeamMemberList component in `apps/web/src/components/settings/TeamMemberList.tsx` (depends on T084)
- [ ] T090 [US4] Add role selector dropdown in `apps/web/src/components/settings/TeamMemberList.tsx` (depends on T089)
- [ ] T091 [US4] Implement remove member confirmation dialog in `apps/web/src/components/settings/TeamMemberList.tsx` (depends on T089)
- [ ] T092 [US4] Implement TeamMemberInvite dialog in `apps/web/src/components/settings/TeamMemberInvite.tsx` (depends on T082)
- [ ] T093 [US4] Add email and role fields to invite dialog in `apps/web/src/components/settings/TeamMemberInvite.tsx` (depends on T092)
- [ ] T094 [US4] Create useTeamManagement hook in `apps/web/src/modules/settings/useTeamManagement.ts` (depends on T085, T086, T087)
- [ ] T095 [US4] Implement team settings route with admin guard in `apps/web/src/routes/settings.team.tsx` (depends on T089, T094)
- [ ] T096 [US4] Add "resend invitation" button for pending members in `apps/web/src/components/settings/TeamMemberList.tsx` (depends on T089)
- [ ] T097 [US4] Implement access denied UI for non-admin users in `apps/web/src/routes/settings.team.tsx` (depends on T095)

**Checkpoint**: At this point, User Stories 1-4 should all work independently

---

## Phase 8: User Story 5 - Billing & Subscription (Priority: P3)

**Goal**: Enable admins to view billing information, update payment methods, download invoices

**Independent Test**: Admin navigates to billing settings, views subscription details, downloads invoice, updates payment method

### Tests for User Story 5 (REQUIRED) ⚠️

- [ ] T098 [P] [US5] E2E test for billing information display in `apps/web/src/e2e/settings-billing.spec.ts`
- [ ] T099 [P] [US5] E2E test for invoice download in `apps/web/src/e2e/settings-billing.spec.ts`
- [ ] T100 [P] [US5] E2E test for payment method update in `apps/web/src/e2e/settings-billing.spec.ts`
- [ ] T101 [P] [US5] E2E test for non-admin access denied to billing settings in `apps/web/src/e2e/settings-billing.spec.ts`

### Implementation for User Story 5

- [ ] T102 [P] [US5] Create billing tRPC router in `packages/api/src/router/settings/billing.ts`
- [ ] T103 [US5] Implement getBillingInfo query with admin check in `packages/api/src/router/settings/billing.ts` (depends on T102)
- [ ] T104 [US5] Implement getInvoices query with admin check in `packages/api/src/router/settings/billing.ts` (depends on T103)
- [ ] T105 [US5] Implement downloadInvoice mutation with admin check in `packages/api/src/router/settings/billing.ts` (depends on T104)
- [ ] T106 [US5] Implement updatePaymentMethod mutation with admin check in `packages/api/src/router/settings/billing.ts` (depends on T103)
- [ ] T107 [US5] Implement BillingSummary component in `apps/web/src/components/settings/BillingSummary.tsx` (depends on T103)
- [ ] T108 [US5] Add subscription details display in `apps/web/src/components/settings/BillingSummary.tsx` (depends on T107)
- [ ] T109 [US5] Implement usage statistics display in `apps/web/src/components/settings/BillingSummary.tsx` (depends on T107)
- [ ] T110 [US5] Add expired payment method warning banner in `apps/web/src/components/settings/BillingSummary.tsx` (depends on T107)
- [ ] T111 [US5] Implement InvoiceList component in `apps/web/src/components/settings/InvoiceList.tsx` (depends on T104)
- [ ] T112 [US5] Add invoice download button in `apps/web/src/components/settings/InvoiceList.tsx` (depends on T111)
- [ ] T113 [US5] Create useBillingQuery hook in `apps/web/src/modules/settings/useBillingQuery.ts` (depends on T103, T104)
- [ ] T114 [US5] Implement billing settings route with admin guard in `apps/web/src/routes/settings.billing.tsx` (depends on T107, T113)
- [ ] T115 [US5] Add "upgrade plan" button with plan comparison in `apps/web/src/components/settings/BillingSummary.tsx` (depends on T107)
- [ ] T116 [US5] Implement access denied UI for non-admin users in `apps/web/src/routes/settings.billing.tsx` (depends on T114)

**Checkpoint**: At this point, ALL user stories should now be independently functional

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T117 [P] Add comprehensive Arabic translations for all settings forms in `apps/web/src/i18n/locales/ar/settings.json`
- [ ] T118 [P] Add French translations for all settings forms in `apps/web/src/i18n/locales/fr/settings.json`
- [ ] T119 [P] Run accessibility audit on all settings pages and fix violations
- [ ] T120 [P] Add visual regression tests for all settings components using Ladle
- [ ] T121 [P] Add performance monitoring for settings page load times
- [ ] T122 [P] Add analytics tracking for settings page visits and form submissions
- [ ] T123 [P] Implement form auto-save draft for long forms (profile, notifications)
- [ ] T124 [P] Add loading skeletons for better perceived performance
- [ ] T125 [P] Add error boundaries for graceful error handling
- [ ] T126 Code cleanup and refactoring
- [ ] T127 Security hardening (input sanitization, XSS prevention)
- [ ] T128 Documentation updates in `specs/01-ui/08-settings/README.md`
- [ ] T129 Run final E2E test suite and verify all scenarios pass
- [ ] T130 Measure bundle size and verify <500KB target
- [ ] T131 Verify RTL layout works correctly across all settings pages
- [ ] T132 Verify role-based access control works correctly for all admin-only pages

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **Settings Layout (Phase 3)**: Depends on Foundational - BLOCKS all other user stories
- **User Stories (Phase 4-8)**: All depend on Settings Layout completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **Settings Layout (US0, P0)**: Can start after Foundational (Phase 2) - BLOCKS all other stories
- **User Profile (US1, P1)**: Can start after Settings Layout (US0) - No dependencies on other stories
- **Notification Preferences (US2, P1)**: Can start after Settings Layout (US0) - No dependencies on other stories
- **Integration Settings (US3, P2)**: Can start after Settings Layout (US0) - Depends on Phase 03 Connectors for integration data
- **Team Management (US4, P2)**: Can start after Settings Layout (US0) - No dependencies on other stories
- **Billing (US5, P3)**: Can start after Settings Layout (US0) - No dependencies on other stories

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Schemas before components
- API routers before hooks
- Hooks before routes
- Core implementation before integrations
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- After Settings Layout (US0) is complete, US1 and US2 can start in parallel (both P1)
- After US0 is complete, US3, US4, US5 can start in parallel (all P2/P3)
- All tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1 (Profile Settings)

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for ProfileUpdateSchema validation"
Task: "E2E test for profile update and persistence"
Task: "E2E test for language change triggering RTL layout"
Task: "E2E test for email verification flow"

# Launch schema and router together:
Task: "Create ProfileUpdateSchema (Zod)"
Task: "Create profile tRPC router"

# Launch form components in parallel:
Task: "Implement ProfileForm component"
Task: "Create useProfileUpdate hook"
```

---

## Implementation Strategy

### MVP First (User Story 0 + 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: Settings Layout (US0) - CRITICAL for all stories
4. Complete Phase 4: User Story 1 (Profile Settings)
5. **STOP and VALIDATE**: Test Profile Settings independently with RTL switching
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add Settings Layout (US0) → Test independently → Navigation framework complete
3. Add User Story 1 (Profile) → Test independently → Deploy/Demo (MVP!)
4. Add User Story 2 (Notifications) → Test independently → Deploy/Demo
5. Add User Story 3 (Integrations) → Test independently → Deploy/Demo
6. Add User Story 4 (Team) → Test independently → Deploy/Demo
7. Add User Story 5 (Billing) → Test independently → Deploy/Demo
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational + Settings Layout together
2. Once Settings Layout is done:
   - Developer A: User Story 1 (Profile) + User Story 2 (Notifications)
   - Developer B: User Story 3 (Integrations) + User Story 4 (Team)
   - Developer C: User Story 5 (Billing)
3. Stories complete and integrate independently
4. Team converges for Phase 9 (Polish)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Settings Layout (US0) is CRITICAL and must be completed before any other user story
- RTL layout switching must be tested for every form (especially US1 language change)
- Role-based access control must be tested for admin-only pages (US4, US5)
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
