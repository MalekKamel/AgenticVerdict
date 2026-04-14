# Tasks: Authentication

**Input**: Design documents from `/specs/01-ui/01-authentication/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), 00-foundation phase completion

**Tests**: E2E tests (Playwright) for critical auth flows, unit tests (Vitest) for components and hooks, accessibility tests (axe-core) for WCAG 2.1 AA compliance.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US0, US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/web/src/`
- **Routes**: `apps/web/src/routes/`
- **Components**: `apps/web/src/components/`
- **Hooks**: `apps/web/src/hooks/`
- **Stores**: `apps/web/src/stores/`
- **Tests**: `tests/e2e/`, `tests/unit/`

## Design system & `.pen` sources (mandatory)

**Workflow**: design (`*.pen`) → tokens (`design-system/design-tokens.pen`) → `@agenticverdict/ui` → auth feature code in `apps/web`. See `docs/architecture/business/design-system/generation/ui-generation-quick-reference.md`.

- **Authoritative visuals**: Atoms and molecules live under `design-system/atoms/*.pen` and `design-system/molecules/*.pen` (e.g. `button.pen`, `input.pen`, `card.pen`, `alert.pen`, `form-field.pen`). **Do not** hand-roll one-off styles for auth; compose from the shared library.
- **Implementation imports**: Auth UI MUST import reusable components from `@agenticverdict/ui` (`Button`, `Input`, `FormField`, `Card`, `Alert`, `Checkbox`, `Typography`, providers). App shell MUST wrap routes with `ThemeProvider`, `DirectionProvider`, and `MantineProvider` from `@agenticverdict/ui` (see `apps/web/src/components/Providers.tsx`).
- **Pencil MCP**: Edits to `.pen` source files MUST go through the Pencil MCP server (`get_variables`, `batch_get`, `get_screenshot`, …), not raw filesystem reads, per project governance.
- **New primitives**: If a pattern repeats across features, add it to `packages/ui` (typed, tested) and export from the package index—never duplicate in `apps/web/src/components/auth/` long-term.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for authentication features

- [ ] T001 Create auth route directory structure at `apps/web/src/routes/auth/`
- [ ] T002 Create auth components directory structure at `apps/web/src/components/auth/`
- [ ] T003 [P] Create auth hooks directory structure at `apps/web/src/hooks/`
- [ ] T004 [P] Create auth store file at `apps/web/src/stores/auth-store.ts`
- [ ] T005 [P] Create validation schemas directory at `apps/web/src/lib/validations/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Implement auth store with TanStack Store in `apps/web/src/stores/auth-store.ts` (isAuthenticated, user, tenantId, isLoading, error states)
- [ ] T007 [P] Implement useAuth hook in `apps/web/src/hooks/useAuth.ts` (auth store integration)
- [ ] T008 [P] Create auth validation schemas in `apps/web/src/lib/validations/auth.ts` (loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema using Zod)
- [ ] T009 [P] Create password validation utilities in `apps/web/src/lib/validations/password.ts` (password strength checker, requirement validation)
- [ ] T010 Create useRequireAuth hook in `apps/web/src/hooks/useRequireAuth.ts` (protected route guard)
- [ ] T011 [P] Create accessibility utilities in `apps/web/src/lib/utils/accessibility.ts` (ARIA attributes, focus management helpers)
- [ ] T012 [P] Add auth-related translation keys to `apps/web/src/i18n/locales/en.json` (login, register, password reset keys)
- [ ] T013 [P] Add auth-related translation keys to `apps/web/src/i18n/locales/ar.json` (Arabic translations for auth)
- [ ] T014 [P] Add auth-related translation keys to `apps/web/src/i18n/locales/fr.json` (French translations for auth)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 0 - Auth Layout Wrapper (Priority: P0) 🎯 FOUNDATION

**Goal**: Consistent, branded layout for all authentication pages with RTL/LTR support

**Independent Test**: Navigate to any auth page and verify consistent layout, branding, responsiveness, and proper RTL/LTR rendering

### Implementation for User Story 0

- [ ] T015 [P] [US0] Create AuthLayout component in `apps/web/src/components/auth/AuthLayout.tsx` using `Card` + `Typography` from `@agenticverdict/ui` (structure per `design-system/molecules/card.pen` + typography tokens)
- [ ] T016 [US0] Implement auth layout wrapper route in `apps/web/src/routes/auth/__root.tsx` (file-based routing with AuthLayout component)
- [ ] T017 [US0] Add auth layout styling via `@agenticverdict/ui` / design tokens (brand colors, spacing, shadows—no ad-hoc hex except documented token gaps)
- [ ] T018 [US0] Implement responsive design for auth layout (mobile, tablet, desktop breakpoints)
- [ ] T019 [US0] Add navigation links between auth pages (login ↔ register, forgot password links)
- [ ] T020 [US0] Add proper ARIA landmarks and heading hierarchy to auth layout (main, h1, landmarks)
- [ ] T021 [US0] Implement RTL layout support with DirectionProvider integration

**Checkpoint**: Auth layout ready - all auth pages can now use this consistent layout

---

## Phase 4: User Story 1 - Login with Email/Password (Priority: P1) 🎯 MVP

**Goal**: Enable users to securely log in with email and password

**Independent Test**: Register a test user, then log in with those credentials and verify successful redirect to dashboard

### Tests for User Story 1 (REQUIRED) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T022 [P] [US1] E2E test for successful login flow in `tests/e2e/auth/login.spec.ts`
- [ ] T023 [P] [US1] E2E test for invalid credentials error handling in `tests/e2e/auth/login.spec.ts`
- [ ] T024 [P] [US1] E2E test for form validation errors in `tests/e2e/auth/login.spec.ts`
- [ ] T025 [P] [US1] E2E test for redirect of authenticated users in `tests/e2e/auth/login.spec.ts`
- [ ] T026 [P] [US1] Accessibility test for login page in `tests/e2e/auth/accessibility.spec.ts` (axe-core)
- [ ] T027 [P] [US1] Unit test for LoginForm component in `tests/unit/components/LoginForm.test.tsx`
- [ ] T028 [P] [US1] Unit test for useLoginMutation hook in `tests/unit/hooks/useLoginMutation.test.ts`

### Implementation for User Story 1

- [ ] T029 [P] [US1] Create PasswordInput component in `apps/web/src/components/auth/PasswordInput.tsx` using `Input` + `FormFieldLabel` from `@agenticverdict/ui` (see `design-system/atoms/input.pen`; visibility toggle, ARIA)
- [ ] T030 [P] [US1] Create AuthError component in `apps/web/src/components/auth/AuthError.tsx` using `Alert` from `@agenticverdict/ui` (`design-system/molecules/alert.pen`; ARIA alerts)
- [ ] T031 [P] [US1] Create AuthSuccess component in `apps/web/src/components/auth/AuthSuccess.tsx` using `Alert` variant success from `@agenticverdict/ui`
- [ ] T032 [US1] Create useLoginMutation hook in `apps/web/src/hooks/useLoginMutation.ts` (tRPC mutation wrapper, error handling)
- [ ] T033 [US1] Create LoginForm component in `apps/web/src/components/auth/LoginForm.tsx` (compose `FormField`, `Input`, `Checkbox`, `Button`, `Alert` from `@agenticverdict/ui`; validation unchanged)
- [ ] T034 [US1] Implement login route in `apps/web/src/routes/auth/login.tsx` (file-based route with LoginForm)
- [ ] T035 [US1] Add login form validation with Zod schema (email format, required fields)
- [ ] T036 [US1] Implement "remember me" checkbox functionality (extended session duration)
- [ ] T037 [US1] Add loading states to login form during mutation (button spinner, disabled state)
- [ ] T038 [US1] Add keyboard navigation support (Enter to submit, Tab navigation)
- [ ] T039 [US1] Add focus management (first input on mount, error focus on validation failure)
- [ ] T040 [US1] Implement generic error messages (prevent email enumeration)
- [ ] T041 [US1] Add login route to TanStack Router with proper route config

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 5: User Story 2 - Registration with Email Verification (Priority: P1) 🎯 MVP

**Goal**: Enable new users to create accounts with email verification

**Independent Test**: Create a new account, receive verification email, click link, and verify ability to log in

### Tests for User Story 2 (REQUIRED) ⚠️

- [ ] T042 [P] [US2] E2E test for successful registration flow in `tests/e2e/auth/register.spec.ts`
- [ ] T043 [P] [US2] E2E test for email validation errors in `tests/e2e/auth/register.spec.ts`
- [ ] T044 [P] [US2] E2E test for password strength validation in `tests/e2e/auth/register.spec.ts`
- [ ] T045 [P] [US2] E2E test for email already exists error in `tests/e2e/auth/register.spec.ts`
- [ ] T046 [P] [US2] E2E test for email verification flow in `tests/e2e/auth/verify-email.spec.ts`
- [ ] T047 [P] [US2] Accessibility test for registration page in `tests/e2e/auth/accessibility.spec.ts` (axe-core)
- [ ] T048 [P] [US2] Unit test for RegisterForm component in `tests/unit/components/RegisterForm.test.tsx`
- [ ] T049 [P] [US2] Unit test for useRegisterMutation hook in `tests/unit/hooks/useRegisterMutation.test.ts`

### Implementation for User Story 2

- [ ] T050 [P] [US2] Create useRegisterMutation hook in `apps/web/src/hooks/useRegisterMutation.ts` (tRPC mutation wrapper, success handling)
- [ ] T051 [US2] Create RegisterForm component in `apps/web/src/components/auth/RegisterForm.tsx` (email, password, confirm password, first name, last name)
- [ ] T052 [US2] Implement register route in `apps/web/src/routes/auth/register.tsx` (file-based route with RegisterForm)
- [ ] T053 [US2] Add registration form validation with Zod schema (all fields, password matching, email format)
- [ ] T054 [US2] Implement password strength indicator (real-time feedback as user types)
- [ ] T055 [US2] Add password confirmation validation (inline error when passwords don't match)
- [ ] T056 [US2] Implement email verification success page in `apps/web/src/routes/auth/verify-email.tsx` (success message, login link)
- [ ] T057 [US2] Handle email verification link with token parameter (query param parsing)
- [ ] T058 [US2] Implement expired verification link error handling (error page with resend option)
- [ ] T059 [US2] Add loading states to registration form during mutation
- [ ] T060 [US2] Implement "resend verification email" functionality (rate limited)
- [ ] T061 [US2] Add keyboard navigation and focus management to registration form
- [ ] T062 [US2] Implement RTL layout support for registration form (Arabic text alignment)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 6: User Story 3 - Password Reset (Request) (Priority: P2)

**Goal**: Enable users to request password resets via email

**Independent Test**: Request password reset for a test account, receive email, and verify reset link works

### Tests for User Story 3 (REQUIRED) ⚠️

- [ ] T063 [P] [US3] E2E test for successful password reset request in `tests/e2e/auth/password-reset.spec.ts`
- [ ] T064 [P] [US3] E2E test for password reset email delivery in `tests/e2e/auth/password-reset.spec.ts`
- [ ] T065 [P] [US3] E2E test for non-existent email (security - same success message) in `tests/e2e/auth/password-reset.spec.ts`
- [ ] T066 [P] [US3] Accessibility test for forgot password page in `tests/e2e/auth/accessibility.spec.ts` (axe-core)
- [ ] T067 [P] [US3] Unit test for ForgotPasswordForm component in `tests/unit/components/ForgotPasswordForm.test.tsx`

### Implementation for User Story 3

- [ ] T068 [P] [US3] Create useRequestPasswordReset hook in `apps/web/src/hooks/usePasswordReset.ts` (tRPC mutation wrapper)
- [ ] T069 [US3] Create ForgotPasswordForm component in `apps/web/src/components/auth/ForgotPasswordForm.tsx` (email input, submit button)
- [ ] T070 [US3] Implement forgot password route in `apps/web/src/routes/auth/forgot-password.tsx` (file-based route)
- [ ] T071 [US3] Add forgot password form validation with Zod schema (email format, required field)
- [ ] T072 [US3] Implement generic success message (same for existing and non-existing emails - security)
- [ ] T073 [US3] Add loading states to forgot password form during mutation
- [ ] T074 [US3] Add navigation back to login page (login link)
- [ ] T075 [US3] Implement keyboard navigation and focus management

**Checkpoint**: User Stories 1, 2, AND 3 should all work independently

---

## Phase 7: User Story 4 - Password Reset (Confirm) (Priority: P2)

**Goal**: Enable users to set new passwords via reset links

**Independent Test**: Use valid reset link to set new password, verify new password works for login

### Tests for User Story 4 (REQUIRED) ⚠️

- [ ] T076 [P] [US4] E2E test for successful password reset in `tests/e2e/auth/password-reset.spec.ts`
- [ ] T077 [P] [US4] E2E test for expired reset link error in `tests/e2e/auth/password-reset.spec.ts`
- [ ] T078 [P] [US4] E2E test for already-used reset link error in `tests/e2e/auth/password-reset.spec.ts`
- [ ] T079 [P] [US4] E2E test for password validation on reset form in `tests/e2e/auth/password-reset.spec.ts`
- [ ] T080 [P] [US4] Accessibility test for reset password page in `tests/e2e/auth/accessibility.spec.ts` (axe-core)
- [ ] T081 [P] [US4] Unit test for ResetPasswordForm component in `tests/unit/components/ResetPasswordForm.test.tsx`

### Implementation for User Story 4

- [ ] T082 [P] [US4] Create useConfirmPasswordReset hook in `apps/web/src/hooks/usePasswordReset.ts` (tRPC mutation wrapper)
- [ ] T083 [US4] Create ResetPasswordForm component in `apps/web/src/components/auth/ResetPasswordForm.tsx` (new password, confirm password, submit)
- [ ] T084 [US4] Implement reset password route in `apps/web/src/routes/auth/reset-password.tsx` (file-based route with token query param)
- [ ] T085 [US4] Add reset password form validation with Zod schema (password requirements, matching passwords)
- [ ] T086 [US4] Implement password strength indicator on reset form
- [ ] T087 [US4] Handle expired reset link error (error message with request new link option)
- [ ] T088 [US4] Handle already-used reset link error (error message with request new link option)
- [ ] T089 [US4] Add loading states to reset password form during mutation
- [ ] T090 [US4] Redirect to login page after successful password reset
- [ ] T091 [US4] Implement keyboard navigation and focus management

**Checkpoint**: User Stories 1, 2, 3, AND 4 should all work independently

---

## Phase 8: User Story 5 - Error Handling and User Feedback (Priority: P1)

**Goal**: Provide clear, actionable feedback for all authentication errors

**Independent Test**: Trigger various error scenarios (network errors, invalid credentials, server errors) and verify appropriate user feedback

### Tests for User Story 5 (REQUIRED) ⚠️

- [ ] T092 [P] [US5] E2E test for network error handling in `tests/e2e/auth/error-handling.spec.ts`
- [ ] T093 [P] [US5] E2E test for server error (500) handling in `tests/e2e/auth/error-handling.spec.ts`
- [ ] T094 [P] [US5] E2E test for session expiry redirect in `tests/e2e/auth/error-handling.spec.ts`
- [ ] T095 [P] [US5] E2E test for rate limiting error message in `tests/e2e/auth/error-handling.spec.ts`
- [ ] T096 [P] [US5] Unit test for error component ARIA announcements in `tests/unit/components/AuthError.test.tsx`

### Implementation for User Story 5

- [ ] T097 [P] [US5] Create error type definitions in `apps/web/src/lib/types/errors.ts` (network error, validation error, auth error types)
- [ ] T098 [US5] Implement network error detection and user-friendly messages (offline detection, retry options)
- [ ] T099 [US5] Implement server error handling (generic error message with support contact)
- [ ] T100 [US5] Implement session expiry detection and redirect (401 handling, redirect to login with message)
- [ ] T101 [US5] Implement rate limiting error message (user-friendly "try again later" message)
- [ ] T102 [US5] Add ARIA live regions for error announcements (role="alert", aria-live="assertive")
- [ ] T103 [US5] Implement error focus management (move focus to error container on error)
- [ ] T104 [US5] Add error logging for debugging (console logging with appropriate error details)
- [ ] T105 [US5] Implement RTL layout support for error messages (Arabic error text, proper positioning)
- [ ] T106 [US5] Add error message translations (all error messages in en, ar, fr)

**Checkpoint**: All user stories should now have comprehensive error handling

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Documentation

- [ ] T107 [P] Document auth flow in `apps/web/README.md` (setup, usage, testing)
- [ ] T108 [P] Document auth component API (props, usage examples)
- [ ] T109 [P] Document auth hooks API (parameters, return values, examples)

### Testing & Quality

- [ ] T110 [P] Run full E2E test suite for auth flows and fix any failures
- [ ] T111 [P] Run full accessibility audit with axe-core and fix any violations
- [ ] T112 [P] Run unit test suite and ensure 70%+ coverage (80%+ for auth logic)
- [ ] T113 [P] Manual testing with screen readers (NVDA, JAWS, VoiceOver)
- [ ] T114 [P] Manual testing of RTL layouts (Arabic language)
- [ ] T115 [P] Manual keyboard navigation testing (no mouse required)

### Performance & Optimization

- [ ] T116 [P] Run bundle analysis and ensure <300KB initial bundle
- [ ] T117 [P] Run Lighthouse audit and ensure <1.5s load time on 3G
- [ ] T118 [P] Implement image optimization for company logo (if not already optimized)
- [ ] T119 [P] Verify route-based code splitting is working (check network tab)

### Security Hardening

- [ ] T120 [P] Verify all auth forms use POST requests
- [ ] T121 [P] Verify CSRF protection is enabled on all mutations
- [ ] T122 [P] Verify passwords are never logged or exposed in error messages
- [ ] T123 [P] Verify generic error messages prevent email enumeration
- [ ] T124 [P] Verify autocomplete attributes are set correctly (current-password, new-password)
- [ ] T125 [P] Verify session tokens are stored in HTTP-only cookies (not localStorage)

### Final Validation

- [ ] T126 Run pre-flight checklist from `checklists/pre-flight.md`
- [ ] T127 Run completion checklist from `checklists/completion.md`
- [ ] T128 Validate all acceptance criteria from spec.md are met
- [ ] T129 Smoke test: Complete full auth flow (register → verify email → login → logout → password reset → login)
- [ ] T130 Smoke test: Multi-language auth flow (test all languages: en, ar, fr)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 0 (Phase 3)**: Depends on Foundational - BLOCKS all other user stories (auth layout prerequisite)
- **User Story 1 (Phase 4)**: Depends on Foundational + US0 - No dependencies on other stories
- **User Story 2 (Phase 5)**: Depends on Foundational + US0 - May integrate with US1 but should be independently testable
- **User Story 3 (Phase 6)**: Depends on Foundational + US0 - No dependencies on US1/US2
- **User Story 4 (Phase 7)**: Depends on Foundational + US0 + US3 - Extends password reset flow from US3
- **User Story 5 (Phase 8)**: Depends on Foundational + US0 + US1 + US2 + US3 + US4 - Cross-cutting error handling
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 0 (P0)**: Can start after Foundational (Phase 2) - No dependencies on other stories - MUST be completed first (auth layout prerequisite)
- **User Story 1 (P1)**: Can start after Foundational (Phase 2) + US0 - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) + US0 - No dependencies on other stories
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) + US0 - No dependencies on other stories
- **User Story 4 (P2)**: Can start after Foundational (Phase 2) + US0 + US3 - Depends on US3 (password reset request flow)
- **User Story 5 (P1)**: Can start after Foundational (Phase 2) + US0 - Applies to all other stories

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Components before routes
- Hooks before components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

#### Setup Phase (Phase 1)
```bash
# Can run in parallel:
T003: Create auth hooks directory
T004: Create auth store file
T005: Create validation schemas directory
```

#### Foundational Phase (Phase 2)
```bash
# Can run in parallel:
T007: Implement useAuth hook
T008: Create auth validation schemas
T009: Create password validation utilities
T011: Create accessibility utilities
T012-T014: Add translation keys (en, ar, fr)
```

#### User Story 0 (Phase 3)
```bash
# Can run in parallel:
None - all tasks build on each other (AuthLayout → route wrapper)
```

#### User Story 1 (Phase 4)
```bash
# Can run tests in parallel:
T022-T028: All tests (E2E, accessibility, unit)

# Can run components in parallel:
T029: PasswordInput component
T030: AuthError component
T031: AuthSuccess component
```

#### User Story 2 (Phase 5)
```bash
# Can run tests in parallel:
T042-T049: All tests (E2E, accessibility, unit)

# Can run components in parallel:
T050: useRegisterMutation hook (can start in parallel with T051 but T051 depends on it)
```

#### User Story 3 (Phase 6)
```bash
# Can run tests in parallel:
T063-T067: All tests (E2E, accessibility, unit)
```

#### User Story 4 (Phase 7)
```bash
# Can run tests in parallel:
T076-T081: All tests (E2E, accessibility, unit)
```

#### User Story 5 (Phase 8)
```bash
# Can run in parallel:
T097: Create error type definitions
T102: Add ARIA live regions
T104: Add error logging
T106: Add error message translations
```

#### Polish Phase (Phase 9)
```bash
# Can run documentation in parallel:
T107-T109: All documentation tasks

# Can run testing in parallel:
T110-T115: All testing tasks

# Can run performance in parallel:
T116-T119: All performance tasks

# Can run security in parallel:
T120-T125: All security tasks
```

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "E2E test for successful login flow"
Task: "E2E test for invalid credentials error handling"
Task: "E2E test for form validation errors"
Task: "E2E test for redirect of authenticated users"
Task: "Accessibility test for login page"
Task: "Unit test for LoginForm component"
Task: "Unit test for useLoginMutation hook"

# Launch all components for User Story 1 together:
Task: "Create PasswordInput component"
Task: "Create AuthError component"
Task: "Create AuthSuccess component"
```

---

## Implementation Strategy

### MVP First (User Stories 0, 1, 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 0 (Auth Layout)
4. Complete Phase 4: User Story 1 (Login)
5. **STOP and VALIDATE**: Test login flow independently
6. Complete Phase 5: User Story 2 (Registration + Email Verification)
7. **STOP and VALIDATE**: Test registration → verify email → login flow
8. Deploy/demo if ready

### Incremental Delivery (Recommended)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 0 (Auth Layout) → Test independently → **Deploy/Demo (Foundation!)**
3. Add User Story 1 (Login) → Test independently → Deploy/Demo (MVP!)
4. Add User Story 2 (Registration + Email Verification) → Test independently → Deploy/Demo
5. Add User Story 3 (Password Reset Request) → Test independently → Deploy/Demo
6. Add User Story 4 (Password Reset Confirm) → Test independently → Deploy/Demo
7. Add User Story 5 (Error Handling) → Test across all stories → Deploy/Demo
8. Complete Polish phase → Deploy/Demo (Feature Complete!)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - **Developer A**: User Story 0 (Auth Layout) - MUST complete first
   - **Developer B**: User Story 1 (Login) - Can start after US0
   - **Developer C**: User Story 2 (Registration) - Can start after US0
3. Once US0, US1, US2 are done:
   - **Developer A**: User Story 3 (Password Reset Request)
   - **Developer B**: User Story 4 (Password Reset Confirm) - Depends on US3
   - **Developer C**: User Story 5 (Error Handling)
4. Stories complete and integrate independently
5. Team completes Polish phase together

---

## Notes

- **[P]** tasks = different files, no dependencies
- **[Story]** label maps task to specific user story for traceability
- **US0** = Auth Layout Wrapper (Priority: P0 - Foundation)
- **US1** = Login with Email/Password (Priority: P1)
- **US2** = Registration with Email Verification (Priority: P1)
- **US3** = Password Reset Request (Priority: P2)
- **US4** = Password Reset Confirm (Priority: P2)
- **US5** = Error Handling and User Feedback (Priority: P1)
- Each user story should be independently completable and testable
- Tests MUST fail before implementing (TDD approach)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Task Summary by Type

### Total Tasks: 130

- **Setup (Phase 1)**: 5 tasks
- **Foundational (Phase 2)**: 9 tasks (BLOCKING)
- **User Story 0 (Phase 3)**: 7 tasks (P0 - Foundation)
- **User Story 1 (Phase 4)**: 20 tasks (10 tests + 10 implementation) (P1)
- **User Story 2 (Phase 5)**: 21 tasks (8 tests + 13 implementation) (P1)
- **User Story 3 (Phase 6)**: 13 tasks (5 tests + 8 implementation) (P2)
- **User Story 4 (Phase 7)**: 16 tasks (6 tests + 10 implementation) (P2)
- **User Story 5 (Phase 8)**: 15 tasks (5 tests + 10 implementation) (P1)
- **Polish (Phase 9)**: 24 tasks (documentation, testing, performance, security, validation)

### Estimated Timeline

- **Setup + Foundational**: 1-2 days (BLOCKING - must complete first)
- **User Story 0 (Auth Layout)**: 0.5-1 day
- **User Story 1 (Login)**: 1-2 days (including tests)
- **User Story 2 (Registration)**: 1.5-2.5 days (including tests)
- **User Story 3 (Password Reset Request)**: 0.5-1 day (including tests)
- **User Story 4 (Password Reset Confirm)**: 1-1.5 days (including tests)
- **User Story 5 (Error Handling)**: 1 day (including tests)
- **Polish**: 1 day

**Total Estimated Time**: 8-12 days (1-2 weeks) for a single developer

**With Parallel Development** (3 developers): 4-6 days

---

**Generated**: 2026-04-14  
**Status**: Ready for implementation  
**Next Step**: Begin with Phase 1 (Setup)
