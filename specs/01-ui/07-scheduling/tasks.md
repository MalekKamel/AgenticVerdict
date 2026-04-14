# Tasks: Scheduling & Delivery Configuration

**Input**: Design documents from `/specs/01-ui/07-scheduling/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: E2E tests are included for critical user journeys (scheduling configuration, delivery channels, recipient management).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/web/src/` for frontend components
- **API**: `packages/api/src/` for backend services
- **Database**: `packages/database/src/` for schema and migrations

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema, tRPC router foundation, and testing setup

- [ ] T001 Create scheduling feature directory structure in `apps/web/src/components/scheduling/` and `apps/web/src/routes/schedules/`
- [ ] T002 [P] Create database migration file in `packages/database/src/migrations/[timestamp]_create_scheduling_tables.sql`
- [ ] T003 [P] Define Drizzle schema for schedules, delivery channels, recipients, and executions in `packages/database/src/schema/`
- [ ] T004 [P] Create base tRPC router structure in `packages/api/src/routers/schedules.ts`
- [ ] T005 [P] Setup test environment for E2E tests in `apps/web/e2e/scheduling/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend services and UI infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Implement schedule CRUD service with tenant isolation in `packages/api/src/services/schedule.service.ts`
- [ ] T007 [P] Implement cron parsing and validation service in `packages/api/src/services/cron.service.ts`
- [ ] T008 [P] Implement next run time calculation utility in `packages/api/src/services/cron.service.ts`
- [ ] T009 [P] Setup BullMQ job executor for scheduled reports in `packages/api/src/jobs/schedule-executor.job.ts`
- [ ] T010 Create Zod validation schemas for schedule forms in `apps/web/src/components/forms/scheduleSchema.ts`
- [ ] T011 Create base tRPC procedures (list, getById, create, update, delete) in `packages/api/src/routers/schedules.ts`
- [ ] T012 Create schedule form state management with TanStack Store in `apps/web/src/stores/schedule-store.ts`
- [ ] T013 Add translation files for scheduling (en, ar, fr) in `apps/web/src/i18n/locales/{en,ar,fr}/scheduling.json`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Scheduling Configuration (Priority: P1) 🎯 MVP

**Goal**: Enable users to create and manage schedules with cron expressions, timezone selection, and visual cron builder

**Independent Test**: Users can create a schedule, verify it appears in the schedule list, and confirm the next run time is calculated correctly

### E2E Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T014 [P] [US1] E2E test for schedule creation workflow in `apps/web/e2e/scheduling/schedule-creation.spec.ts`
- [ ] T015 [P] [US1] E2E test for cron builder interaction in `apps/web/e2e/scheduling/cron-builder.spec.ts`
- [ ] T016 [P] [US1] E2E test for timezone selection and next run time calculation in `apps/web/e2e/scheduling/timezone-selector.spec.ts`
- [ ] T017 [P] [US1] E2E test for schedule list display and filtering in `apps/web/e2e/scheduling/schedule-list.spec.ts`
- [ ] T018 [P] [US1] E2E test for pause/resume/delete schedule actions in `apps/web/e2e/scheduling/schedule-actions.spec.ts`

### Implementation for User Story 1

- [ ] T019 [P] [US1] Create ScheduleList component in `apps/web/src/components/scheduling/ScheduleList.tsx`
- [ ] T020 [P] [US1] Create ScheduleListItem component in `apps/web/src/components/scheduling/ScheduleListItem.tsx`
- [ ] T021 [P] [US1] Create ScheduleStatusBadge component in `apps/web/src/components/scheduling/ScheduleStatusBadge.tsx`
- [ ] T022 [P] [US1] Create ScheduleForm component in `apps/web/src/components/scheduling/ScheduleForm.tsx`
- [ ] T023 [P] [US1] Create CronBuilder component in `apps/web/src/components/scheduling/CronBuilder.tsx`
- [ ] T024 [P] [US1] Create TimezoneSelector component in `apps/web/src/components/scheduling/TimezoneSelector.tsx`
- [ ] T025 [US1] Implement useSchedules hook in `apps/web/src/hooks/useSchedules.ts` (depends on T019)
- [ ] T026 [US1] Implement useSchedule hook in `apps/web/src/hooks/useSchedule.ts`
- [ ] T027 [US1] Implement useCreateSchedule mutation in `apps/web/src/hooks/useCreateSchedule.ts` (depends on T022, T023, T024)
- [ ] T028 [US1] Implement useUpdateSchedule mutation in `apps/web/src/hooks/useUpdateSchedule.ts`
- [ ] T029 [US1] Implement useDeleteSchedule mutation in `apps/web/src/hooks/useDeleteSchedule.ts`
- [ ] T030 [US1] Implement usePauseSchedule mutation in `apps/web/src/hooks/usePauseSchedule.ts`
- [ ] T031 [US1] Implement useResumeSchedule mutation in `apps/web/src/hooks/useResumeSchedule.ts`
- [ ] T032 [US1] Implement useNextRunTime hook in `apps/web/src/hooks/useNextRunTime.ts` (depends on T007, T008)
- [ ] T033 [US1] Create schedule list page route in `apps/web/src/routes/insights/schedules.tsx`
- [ ] T034 [US1] Create schedule configuration page route in `apps/web/src/routes/insights/$insightId/schedule.tsx`
- [ ] T035 [US1] Add schedule navigation links to insight detail view
- [ ] T036 [US1] Implement multi-language description fields in ScheduleForm (depends on T013)

**Checkpoint**: At this point, User Story 1 should be fully functional - users can create, view, edit, pause, resume, and delete schedules

---

## Phase 4: User Story 2 - Delivery Channel Configuration (Priority: P2)

**Goal**: Enable users to configure multiple delivery channels (email, in-app, webhook) with channel-specific settings

**Independent Test**: Users can select delivery channels, configure channel-specific settings, and verify test delivery succeeds

### E2E Tests for User Story 2 ⚠️

- [ ] T037 [P] [US2] E2E test for delivery channel selection in `apps/web/e2e/scheduling/delivery-channels.spec.ts`
- [ ] T038 [P] [US2] E2E test for email channel configuration in `apps/web/e2e/scheduling/email-channel.spec.ts`
- [ ] T039 [P] [US2] E2E test for webhook channel configuration and test delivery in `apps/web/e2e/scheduling/webhook-channel.spec.ts`
- [ ] T040 [P] [US2] E2E test for in-app channel configuration in `apps/web/e2e/scheduling/inapp-channel.spec.ts`

### Implementation for User Story 2

- [ ] T041 [P] [US2] Create delivery service with channel dispatch logic in `packages/api/src/services/delivery.service.ts`
- [ ] T042 [P] [US2] Create email delivery handler in `packages/api/src/services/channels/email.handler.ts`
- [ ] T043 [P] [US2] Create webhook delivery handler in `packages/api/src/services/channels/webhook.handler.ts`
- [ ] T044 [P] [US2] Create in-app delivery handler in `packages/api/src/services/channels/inapp.handler.ts`
- [ ] T045 [P] [US2] Create DeliveryChannelSelector component in `apps/web/src/components/scheduling/DeliveryChannelSelector.tsx`
- [ ] T046 [P] [US2] Create EmailChannelConfig component in `apps/web/src/components/scheduling/EmailChannelConfig.tsx`
- [ ] T047 [P] [US2] Create WebhookChannelConfig component in `apps/web/src/components/scheduling/WebhookChannelConfig.tsx`
- [ ] T048 [P] [US2] Create InAppChannelConfig component in `apps/web/src/components/scheduling/InAppChannelConfig.tsx`
- [ ] T049 [US2] Implement useTestDelivery mutation in `apps/web/src/hooks/useTestDelivery.ts` (depends on T041-T044)
- [ ] T050 [US2] Create tRPC mutation for test delivery in `packages/api/src/routers/schedules.ts`
- [ ] T051 [US2] Integrate DeliveryChannelSelector into ScheduleForm component
- [ ] T052 [US2] Add delivery channel configuration to Zod schema in `apps/web/src/components/forms/scheduleSchema.ts`
- [ ] T053 [US2] Implement delivery dispatcher job in `packages/api/src/jobs/delivery-dispatcher.job.ts`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - users can create schedules with multiple delivery channels

---

## Phase 5: User Story 3 - Recipient Management (Priority: P3)

**Goal**: Enable users to manage recipients with role-based access control and invitations

**Independent Test**: Users can add recipients, assign roles, and verify recipients receive reports

### E2E Tests for User Story 3 ⚠️

- [ ] T054 [P] [US3] E2E test for adding recipients to schedule in `apps/web/e2e/scheduling/recipients.spec.ts`
- [ ] T055 [P] [US3] E2E test for role-based permissions (admin vs viewer) in `apps/web/e2e/scheduling/recipient-roles.spec.ts`
- [ ] T056 [P] [US3] E2E test for removing recipients from schedule in `apps/web/e2e/scheduling/remove-recipient.spec.ts`
- [ ] T057 [P] [US3] E2E test for recipient invitation workflow in `apps/web/e2e/scheduling/recipient-invitation.spec.ts`

### Implementation for User Story 3

- [ ] T058 [P] [US3] Create recipient service with role-based access in `packages/api/src/services/recipient.service.ts`
- [ ] T059 [P] [US3] Create invitation workflow for new users in `packages/api/src/services/recipient.service.ts`
- [ ] T060 [P] [US3] Create RecipientManager component in `apps/web/src/components/scheduling/RecipientManager.tsx`
- [ ] T061 [P] [US3] Create RecipientListItem component in `apps/web/src/components/scheduling/RecipientListItem.tsx`
- [ ] T062 [US3] Implement recipient CRUD tRPC procedures in `packages/api/src/routers/schedules.ts`
- [ ] T063 [US3] Implement useAddRecipient mutation in `apps/web/src/hooks/useAddRecipient.ts`
- [ ] T064 [US3] Implement useRemoveRecipient mutation in `apps/web/src/hooks/useRemoveRecipient.ts`
- [ ] T065 [US3] Implement useUpdateRecipientRole mutation in `apps/web/src/hooks/useUpdateRecipientRole.ts`
- [ ] T066 [US3] Integrate RecipientManager into ScheduleForm component
- [ ] T067 [US3] Add recipient validation to Zod schema in `apps/web/src/components/forms/scheduleSchema.ts`
- [ ] T068 [US3] Implement recipient list display in ScheduleListItem component

**Checkpoint**: All user stories should now be independently functional - users can create schedules with delivery channels and recipients

---

## Phase 6: User Story 4 - Multi-Language Schedule Descriptions (Priority: P4)

**Goal**: Enable users to create schedule descriptions in multiple languages with RTL support for Arabic

**Independent Test**: Users can create descriptions in Arabic and English, switch UI language, and verify correct display

### E2E Tests for User Story 4 ⚠️

- [ ] T069 [P] [US4] E2E test for Arabic schedule description creation in `apps/web/e2e/scheduling/arabic-descriptions.spec.ts`
- [ ] T070 [P] [US4] E2E test for language switching in schedule form in `apps/web/e2e/scheduling/language-switching.spec.ts`
- [ ] T071 [P] [US4] E2E test for RTL layout validation in schedule form in `apps/web/e2e/scheduling/rtl-layout.spec.ts`

### Implementation for User Story 4

- [ ] T072 [P] [US4] Add multi-language description fields to ScheduleForm component (depends on T013)
- [ ] T073 [US4] Implement language-aware description display in ScheduleListItem component
- [ ] T074 [US4] Add RTL layout support to CronBuilder component
- [ ] T075 [US4] Add RTL layout support to DeliveryChannelSelector component
- [ ] T076 [US4] Add RTL layout support to RecipientManager component
- [ ] T077 [US4] Update Zod schema to support multi-language descriptions in `apps/web/src/components/forms/scheduleSchema.ts`
- [ ] T078 [US4] Implement language fallback logic in schedule display components

**Checkpoint**: All user stories now include full multi-language support with RTL layouts

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

- [ ] T079 [P] Add loading states to all scheduling components (ScheduleList, ScheduleForm, CronBuilder)
- [ ] T080 [P] Add error states and error handling to all scheduling components
- [ ] T081 [P] Add empty states to ScheduleList with CTA to create schedule
- [ ] T082 [P] Implement optimistic updates for schedule mutations (create, update, delete)
- [ ] T083 [P] Add toast notifications for schedule actions (created, updated, deleted, paused, resumed)
- [ ] T084 [P] Add confirmation dialogs for destructive actions (delete, remove recipient)
- [ ] T085 [P] Implement schedule clone functionality in `apps/web/src/hooks/useCloneSchedule.ts`
- [ ] T086 [P] Add keyboard navigation support to all scheduling components
- [ ] T087 [P] Add ARIA labels and roles to all scheduling components
- [ ] T088 [P] Add focus management to ScheduleForm (focus first error on validation failure)
- [ ] T089 [P] Implement virtual scrolling for ScheduleList (for 100+ schedules)
- [ ] T090 [P] Add pagination to ScheduleList component
- [ ] T091 [P] Add search and filter functionality to ScheduleList
- [ ] T092 [P] Add schedule execution history display to schedule detail view
- [ ] T093 [P] Implement delivery status tracking (pending, sent, failed)
- [ ] T094 [P] Add audit logging for schedule modifications in `packages/api/src/services/audit.service.ts`
- [ ] T095 [P] Add webhook delivery retry logic with exponential backoff
- [ ] T096 [P] Add rate limiting for test delivery endpoint
- [ ] T097 [P] Add webhook URL validation (HTTPS required, format validation)
- [ ] T098 [P] Add cron expression sanitization to prevent injection attacks
- [ ] T099 [P] Add email invitation workflow for new recipients
- [ ] T100 [P] Add recipient status tracking (pending, active, removed)
- [ ] T101 [P] Add timezone-aware next run time calculation with DST support
- [ ] T102 [P] Add schedule execution logs with error messages
- [ ] T103 [P] Implement conditional delivery logic (send if metrics exceed threshold)
- [ ] T104 [P] Add schedule limits per tenant (enforce maximum number of schedules)
- [ ] T105 [P] Add execution log retention policy (90 days default)
- [ ] T106 [P] Run accessibility audit with axe-core and fix violations
- [ ] T107 [P] Run performance audit with Lighthouse and optimize bundle
- [ ] T108 [P] Add visual regression tests for all scheduling components
- [ ] T109 [P] Add unit tests for cron parsing and validation logic
- [ ] T110 [P] Add unit tests for timezone conversion logic
- [ ] T111 [P] Add unit tests for delivery channel handlers
- [ ] T112 [P] Add unit tests for recipient role permissions
- [ ] T113 [P] Add integration tests for schedule CRUD operations
- [ ] T114 [P] Add integration tests for delivery dispatch logic
- [ ] T115 [P] Update documentation in `docs/architecture/ui/00-overview.md` with scheduling components
- [ ] T116 [P] Update component documentation with scheduling examples
- [ ] T117 [P] Verify RTL layout for all scheduling components in Arabic
- [ ] T118 [P] Verify LTR layout for all scheduling components in English
- [ ] T119 [P] Run all E2E tests and fix failures
- [ ] T120 [P] Run quickstart.md validation for scheduling feature

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User Story 1 (Scheduling Configuration): P1 - MVP priority
  - User Story 2 (Delivery Channels): P2 - depends on US1 for integration
  - User Story 3 (Recipient Management): P3 - depends on US1 for integration
  - User Story 4 (Multi-Language): P4 - enhances US1, US2, US3
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Integrates with US1 but independently testable
- **User Story 4 (P4)**: Depends on US1, US2, US3 completion - Enhances all stories with multi-language support

### Within Each User Story

- E2E tests MUST be written and FAIL before implementation
- Backend services before UI components
- Base components before composite components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (Phase 1) marked [P] can run in parallel
- All Foundational tasks (Phase 2) marked [P] can run in parallel
- All E2E tests for a user story marked [P] can run in parallel
- All backend services (Phase 4, US2) marked [P] can run in parallel
- All UI components (Phase 4, US2) marked [P] can run in parallel
- All backend services (Phase 5, US3) marked [P] can run in parallel
- All UI components (Phase 5, US3) marked [P] can run in parallel
- User Stories 1, 2, 3 can be worked on in parallel by different team members (after Foundational phase)
- All Polish tasks (Phase 7) marked [P] can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all E2E tests for User Story 1 together:
Task T014: "E2E test for schedule creation workflow"
Task T015: "E2E test for cron builder interaction"
Task T016: "E2E test for timezone selection"
Task T017: "E2E test for schedule list display"
Task T018: "E2E test for schedule actions"

# Launch all base UI components for User Story 1 together:
Task T019: "Create ScheduleList component"
Task T020: "Create ScheduleListItem component"
Task T021: "Create ScheduleStatusBadge component"
Task T022: "Create ScheduleForm component"
Task T023: "Create CronBuilder component"
Task T024: "Create TimezoneSelector component"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Scheduling Configuration)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (P1) - Scheduling Configuration
   - Developer B: User Story 2 (P2) - Delivery Channels (after US1 foundation)
   - Developer C: User Story 3 (P3) - Recipient Management (after US1 foundation)
3. Stories complete and integrate independently
4. Developer D: User Story 4 (P4) - Multi-Language (after US1, US2, US3)
5. Team: Polish and cross-cutting concerns

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify E2E tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- RTL validation is critical for Arabic support - test with both LTR and RTL layouts
- Timezone handling is complex - test with multiple timezones (UTC, Asia/Riyadh, America/New_York)
- Cron expressions are error-prone - provide extensive validation and examples
- Webhook delivery requires robust error handling and retry logic
- Recipient invitations require email service integration (from core platform)
- Multi-language descriptions require translation infrastructure (from Phase 00: Foundation)
