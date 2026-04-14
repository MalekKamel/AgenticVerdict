---
description: "Task list for Phase 09 - Tenant Management implementation"
---

# Tasks: Tenant Management

**Input**: Design documents from `/specs/01-ui/09-tenant-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: E2E tests with Playwright are included for critical user journeys (tenant switching, settings persistence, client onboarding). Unit tests with Vitest are included for tenant store and utilities.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

Web application structure:
- **Frontend routes**: `apps/web/src/routes/`
- **Components**: `apps/web/src/components/`
- **Stores**: `apps/web/src/stores/`
- **Hooks**: `apps/web/src/hooks/`
- **Utilities**: `apps/web/src/lib/`
- **Tests**: `apps/web/src/tests/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Tenant store and utility setup

- [ ] T001 Create tenant store with TanStack Store in `apps/web/src/stores/tenant-store.ts`
- [ ] T002 [P] Create tenant context utilities in `apps/web/src/lib/tenant-context.ts`
- [ ] T003 [P] Create tenant switch utilities in `apps/web/src/lib/tenant-utils.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core tenant management hooks and components that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create `useTenantSwitch` hook in `apps/web/src/hooks/useTenantSwitch.ts` (depends on T001, T003)
- [ ] T005 [P] Create `useTenantConfig` hook in `apps/web/src/hooks/useTenantConfig.ts`
- [ ] T006 [P] Create `useCompanyBranding` hook in `apps/web/src/hooks/useCompanyBranding.ts`
- [ ] T007 [P] Create `useTenantList` hook in `apps/web/src/hooks/useTenantList.ts`
- [ ] T008 Create base form components in `apps/web/src/components/forms/` (BrandingSection, DomainSection, LocalizationSection)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Tenant Switcher Component (Priority: P1) 🎯 MVP

**Goal**: Enable users to quickly switch between multiple tenants via topbar component

**Independent Test**: Create user with access to 2+ tenants, access topbar, switch between tenants, verify data context updates

### E2E Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T009 [P] [US1] E2E test for tenant switcher display in `apps/web/src/tests/e2e/tenant-switcher.spec.ts`
- [ ] T010 [P] [US1] E2E test for tenant switch flow in `apps/web/src/tests/e2e/tenant-switcher.spec.ts`
- [ ] T011 [P] [US1] E2E test for cache invalidation on tenant switch in `apps/web/src/tests/e2e/tenant-switcher.spec.ts`
- [ ] T012 [P] [US1] E2E test for single-tenant display (no dropdown) in `apps/web/src/tests/e2e/tenant-switcher.spec.ts`
- [ ] T013 [P] [US1] E2E test for RTL layout validation in `apps/web/src/tests/e2e/tenant-switcher.spec.ts`

### Unit Tests for User Story 1

- [ ] T014 [P] [US1] Unit test for tenant store state management in `apps/web/src/tests/unit/tenant-store.test.ts`
- [ ] T015 [P] [US1] Unit test for tenant switch utilities in `apps/web/src/tests/unit/tenant-utils.test.ts`

### Implementation for User Story 1

- [ ] T016 [US1] Create TenantSwitcher component in `apps/web/src/components/tenant/TenantSwitcher.tsx` (depends on T007, T004)
- [ ] T017 [US1] Create TenantAvatar component in `apps/web/src/components/tenant/TenantAvatar.tsx`
- [ ] T018 [US1] Create TenantMenuItem component in `apps/web/src/components/tenant/TenantMenuItem.tsx`
- [ ] T019 [US1] Integrate TenantSwitcher into topbar in `apps/web/src/routes/_components/topbar.tsx`
- [ ] T020 [US1] Implement tenant switch animation and loading states
- [ ] T021 [US1] Add keyboard navigation support for tenant switcher dropdown
- [ ] T022 [US1] Add screen reader announcements for tenant switch events

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Company Settings Page (Priority: P1)

**Goal**: Company administrators can manage branding, domain, and localization settings

**Independent Test**: Access `/settings/company` as admin, modify branding, save changes, verify UI updates

### E2E Tests for User Story 2 ⚠️

- [ ] T023 [P] [US2] E2E test for company settings page load in `apps/web/src/tests/e2e/company-settings.spec.ts`
- [ ] T024 [P] [US2] E2E test for branding upload and save in `apps/web/src/tests/e2e/company-settings.spec.ts`
- [ ] T025 [P] [US2] E2E test for brand color customization in `apps/web/src/tests/e2e/company-settings.spec.ts`
- [ ] T026 [P] [US2] E2E test for custom domain configuration in `apps/web/src/tests/e2e/company-settings.spec.ts`
- [ ] T027 [P] [US2] E2E test for localization settings in `apps/web/src/tests/e2e/company-settings.spec.ts`

### Unit Tests for User Story 2

- [ ] T028 [P] [US2] Unit test for branding form validation in `apps/web/src/tests/unit/branding-form.test.ts`
- [ ] T029 [P] [US2] Unit test for domain validation logic in `apps/web/src/tests/unit/domain-validation.test.ts`

### Implementation for User Story 2

- [ ] T030 [US2] Create company settings route in `apps/web/src/routes/settings/company.tsx`
- [ ] T031 [US2] Create CompanySettingsForm component in `apps/web/src/components/tenant/CompanySettingsForm.tsx` (depends on T008)
- [ ] T032 [US2] Create BrandingSection form component in `apps/web/src/components/forms/BrandingSection.tsx`
- [ ] T033 [US2] Create DomainSection form component in `apps/web/src/components/forms/DomainSection.tsx`
- [ ] T034 [US2] Create LocalizationSection form component in `apps/web/src/components/forms/LocalizationSection.tsx`
- [ ] T035 [US2] Implement logo upload with image preview in BrandingSection
- [ ] T036 [US2] Implement brand color picker with live preview in BrandingSection
- [ ] T037 [US2] Implement domain configuration with DNS verification in DomainSection
- [ ] T038 [US2] Implement localization settings (language, timezone, currency) in LocalizationSection
- [ ] T039 [US2] Add form validation and error handling
- [ ] T040 [US2] Add success/error notifications for settings updates

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Tenant Settings Page (Priority: P2)

**Goal**: Tenant administrators can configure AI models, feature flags, and business domains

**Independent Test**: Access `/settings/tenant` as admin, modify configuration, save changes, verify behavior updates

### E2E Tests for User Story 3 ⚠️

- [ ] T041 [P] [US3] E2E test for tenant settings page load in `apps/web/src/tests/e2e/tenant-settings.spec.ts`
- [ ] T042 [P] [US3] E2E test for AI model selection and save in `apps/web/src/tests/e2e/tenant-settings.spec.ts`
- [ ] T043 [P] [US3] E2E test for feature flag toggling in `apps/web/src/tests/e2e/tenant-settings.spec.ts`
- [ ] T044 [P] [US3] E2E test for business domain selection in `apps/web/src/tests/e2e/tenant-settings.spec.ts`

### Unit Tests for User Story 3

- [ ] T045 [P] [US3] Unit test for tenant configuration form validation in `apps/web/src/tests/unit/tenant-config-form.test.ts`

### Implementation for User Story 3

- [ ] T046 [US3] Create tenant settings route in `apps/web/src/routes/settings/tenant.tsx`
- [ ] T047 [US3] Create TenantSettingsForm component in `apps/web/src/components/tenant/TenantSettingsForm.tsx`
- [ ] T048 [US3] Create AI configuration section in TenantSettingsForm
- [ ] T049 [US3] Create feature flags section with toggle switches in TenantSettingsForm
- [ ] T050 [US3] Create business domain selection with checkboxes in TenantSettingsForm
- [ ] T051 [US3] Add form validation for tenant configuration
- [ ] T052 [US3] Add real-time preview for feature flag changes
- [ ] T053 [US3] Add success/error notifications for configuration updates

**Checkpoint**: All user stories 1-3 should now be independently functional

---

## Phase 6: User Story 4 - Client Management for Agency Partners (Priority: P2)

**Goal**: Agency partners can manage client portfolio, view client metrics, and switch client contexts

**Independent Test**: Access `/agency/clients` as agency partner, view client list, add new client, switch to client context

### E2E Tests for User Story 4 ⚠️

- [ ] T054 [P] [US4] E2E test for client list page load in `apps/web/src/tests/e2e/client-management.spec.ts`
- [ ] T055 [P] [US4] E2E test for client onboarding flow in `apps/web/src/tests/e2e/client-management.spec.ts`
- [ ] T056 [P] [US4] E2E test for client context switching in `apps/web/src/tests/e2e/client-management.spec.ts`
- [ ] T057 [P] [US4] E2E test for client card interactions in `apps/web/src/tests/e2e/client-management.spec.ts`

### Unit Tests for User Story 4

- [ ] T058 [P] [US4] Unit test for client list virtualization in `apps/web/src/tests/unit/client-list.test.ts`

### Implementation for User Story 4

- [ ] T059 [US4] Create agency clients route in `apps/web/src/routes/agency/clients.tsx`
- [ ] T060 [US4] Create ClientList component with virtualization in `apps/web/src/components/tenant/ClientList.tsx`
- [ ] T061 [US4] Create ClientCard component in `apps/web/src/components/tenant/ClientCard.tsx`
- [ ] T062 [US4] Create ClientOnboardingModal component in `apps/web/src/components/tenant/ClientOnboardingModal.tsx`
- [ ] T063 [US4] Implement client search/filter functionality in ClientList
- [ ] T064 [US4] Implement client status indicators (active, suspended, pending)
- [ ] T065 [US4] Implement client metrics display in ClientCard
- [ ] T066 [US4] Add "View Dashboard" action in ClientCard for context switching
- [ ] T067 [US4] Add keyboard navigation for client list
- [ ] T068 [US4] Add screen reader support for client list

**Checkpoint**: All user stories 1-4 should now be independently functional

---

## Phase 7: User Story 5 - Tenant Onboarding Workflow (Priority: P3)

**Goal**: New tenant setup with guided onboarding flow for essential configuration

**Independent Test**: Create new tenant, access onboarding wizard, complete all steps, verify tenant is configured correctly

### E2E Tests for User Story 5 ⚠️

- [ ] T069 [P] [US5] E2E test for onboarding wizard initiation in `apps/web/src/tests/e2e/onboarding.spec.ts`
- [ ] T070 [P] [US5] E2E test for complete onboarding flow in `apps/web/src/tests/e2e/onboarding.spec.ts`
- [ ] T071 [P] [US5] E2E test for onboarding step validation in `apps/web/src/tests/e2e/onboarding.spec.ts`
- [ ] T072 [P] [US5] E2E test for onboarding completion and redirect in `apps/web/src/tests/e2e/onboarding.spec.ts`

### Unit Tests for User Story 5

- [ ] T073 [P] [US5] Unit test for onboarding state management in `apps/web/src/tests/unit/onboarding.test.ts`

### Implementation for User Story 5

- [ ] T074 [US5] Create onboarding route in `apps/web/src/routes/agency/onboarding.tsx`
- [ ] T075 [US5] Create OnboardingWizard component in `apps/web/src/components/tenant/OnboardingWizard.tsx`
- [ ] T076 [US5] Create OnboardingStep1 (Company Info) component
- [ ] T077 [US5] Create OnboardingStep2 (Branding) component
- [ ] T078 [US5] Create OnboardingStep3 (Business Domains) component
- [ ] T079 [US5] Create OnboardingStep4 (Connectors) component
- [ ] T080 [US5] Implement progress indicator in OnboardingWizard
- [ ] T081 [US5] Implement step navigation (next, back, skip) in OnboardingWizard
- [ ] T082 [US5] Implement form validation for each onboarding step
- [ ] T083 [US5] Implement draft saving (allow users to complete onboarding later)
- [ ] T084 [US5] Add completion celebration and dashboard redirect
- [ ] T085 [US5] Add first-time tour prompt after onboarding completion

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T086 [P] Add comprehensive error boundaries for tenant management errors
- [ ] T087 [P] Implement loading skeletons for all tenant management pages
- [ ] T088 [P] Add transition animations for tenant switches
- [ ] T089 [P] Optimize tenant switch performance (parallel data fetching)
- [ ] T090 [P] Add RTL validation tests for all tenant management components
- [ ] T091 [P] Add accessibility audits for all tenant management pages
- [ ] T092 [P] Add comprehensive keyboard navigation support
- [ ] T093 [P] Add screen reader announcements for all state changes
- [ ] T094 [P] Performance optimization for client list (improve virtualization)
- [ ] T095 [P] Add analytics tracking for tenant management actions
- [ ] T096 [P] Add comprehensive logging for tenant switch operations
- [ ] T097 [P] Documentation updates in `docs/architecture/ui/`
- [ ] T098 [P] Component documentation for all tenant management components
- [ ] T099 Run full E2E test suite and fix any failures
- [ ] T100 Run accessibility audit and fix any violations

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Tenant Switcher**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1) - Company Settings**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P2) - Tenant Settings**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 4 (P2) - Client Management**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 5 (P3) - Onboarding**: Can start after Foundational (Phase 2) - No dependencies on other stories

### Within Each User Story

- E2E tests MUST be written and FAIL before implementation
- Unit tests (if included) should be written before or alongside implementation
- Component implementation before integration
- Core implementation before polish
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (Phase 1) marked [P] can run in parallel
- All Foundational tasks (Phase 2) marked [P] can run in parallel
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All E2E tests for a user story marked [P] can run in parallel
- All unit tests for a user story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all E2E tests for User Story 1 together:
Task T009: E2E test for tenant switcher display
Task T010: E2E test for tenant switch flow
Task T011: E2E test for cache invalidation on tenant switch
Task T012: E2E test for single-tenant display
Task T013: E2E test for RTL layout validation

# Launch all unit tests for User Story 1 together:
Task T014: Unit test for tenant store state management
Task T015: Unit test for tenant switch utilities
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Tenant Switcher)
4. Complete Phase 4: User Story 2 (Company Settings)
5. **STOP and VALIDATE**: Test User Stories 1 & 2 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Tenant Switcher)
   - Developer B: User Story 2 (Company Settings)
   - Developer C: User Story 3 (Tenant Settings)
3. Stories complete and integrate independently
4. Developers D & E: User Stories 4 & 5 (can start after US1-2 foundation established)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify E2E tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
