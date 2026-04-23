# Authentication Implementation Alignment Roadmap

**Date:** 2026-04-23  
**Scope:** `/apps/frontend/src/routes/$locale/auth`  
**Plan References:**

- `/docs/architecture/ui/04-pages/authentication.md`
- `/docs/architecture/ui/00-overview.md`

## 1) Objective

Deliver full alignment between the current authentication implementation and the planned UI architecture, behavior, and quality constraints (accessibility, localization/RTL, security UX, and testing/performance standards).

## 2) Current-State Baseline (Implementation Inventory)

### Implemented foundation

- Localized auth route surface exists for login, register, forgot-password, reset-password, verify-email, terms, privacy, and help.
- Route-level search validation exists for:
  - `redirect` on `/$locale/auth/login`
  - `token` on `/$locale/auth/reset-password`
  - `token` on `/$locale/auth/verify-email`
- Shared auth shell and primary forms are implemented:
  - `AuthLayout`, `LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `ResetPasswordForm`, `VerifyEmailClient`
- Shared validation schemas exist in `auth.ts` for login/register/forgot/reset/verify.
- Hooks and API wrappers exist for login/register/reset/verify flows.
- i18n and RTL primitives are present at app/layout level, and auth UI uses localized routing wrappers.

### Major observed alignment gaps

- Registration flow is not the planned 4-step flow.
- Login does not implement OAuth entry points or full query-driven states (`session=expired`, `oauth=provider`).
- Query parameters are validated at route level but reparsed inconsistently in client hooks/components.
- Verify email is token-status driven UI, not the planned OTP (6-digit) entry experience with true resend integration.
- Error localization is inconsistent (some raw error strings/keys leak to UI).
- Auth pages are not guarded against already-authenticated users (redirect away from auth pages).
- Accessibility details are incomplete in some areas (e.g., referenced `aria-describedby` IDs without matching description nodes).
- UI/flow test coverage is incomplete for auth forms and route behavior.
- Console logging remains in auth runtime paths where production-quality observability should be used.

## 3) Alignment Targets from Plan

The implementation must satisfy all of the following plan-level outcomes:

- **Page capabilities:** login, register (multi-step), forgot-password, reset-password, verify-email.
- **Behavioral states:** initial, validation, loading, error, success, rate-limit/lockout where applicable.
- **Routing contracts:** query-parameter driven behavior and safe redirect handling.
- **Accessibility:** WCAG 2.1 AA baseline and AAA target for critical auth path characteristics.
- **Localization + RTL:** externalized strings, mirrored layout behavior, logical properties.
- **Architecture:** atomic/component reuse aligned with shared auth layout and design-system expectations.
- **Quality gates:** unit and route-flow tests, accessibility tests, RTL/LTR validation, performance budget checks.

## 4) Systematic Execution Plan (Parallel Workstreams)

Execution is divided into sequential phases, with parallel tracks inside each phase to reduce delivery time while controlling risk.

## Phase 0 — Planning Lock and Traceability (Short)

### Goals

- Freeze requirement interpretation and convert plan into an executable checklist.
- Prevent scope drift before implementation starts.

### Execution artifact (2026-04-23)

- [`authentication-phase-0-planning-lock-and-traceability-2026-04-23.md`](./authentication-phase-0-planning-lock-and-traceability-2026-04-23.md)

### Tasks

- Create a requirement-to-code traceability matrix (feature + state + route + a11y + i18n).
- Define “done” criteria per page and shared pattern.
- Confirm acceptance criteria with architecture/UI owners.

### Parallelization

- **Track A:** Functional requirement matrix.
- **Track B:** A11y + RTL + i18n requirement matrix.
- **Track C:** Test and quality-gate baseline matrix.

## Phase 1 — Shared Foundation Corrections

### Goals

- Standardize common auth behavior before page-specific rewrites.

### Tasks

1. **Authenticated-user redirect guard for auth pages**
   - Add redirect behavior so authenticated users are sent to dashboard (or safe redirect target), avoiding unnecessary auth-page access.

2. **Canonical search-param handling**
   - Replace ad-hoc URL search parsing in hooks/components with route-validated search usage.
   - Ensure route-level validation and consumer-level usage are consistent.

3. **Error localization normalization**
   - Centralize translation of auth API error keys/messages before UI rendering.
   - Ensure all user-visible auth errors resolve to localized strings.

4. **Validation standardization**
   - Align all forms to shared Zod schema strategy (especially login).

5. **Observability hygiene**
   - Remove console-based runtime logging from auth hooks/components.
   - Ensure telemetry events remain structured and non-sensitive.

### Parallelization

- **Track A (Routing):** auth-page redirect guard + search param consistency.
- **Track B (Forms):** validation + error localization standardization.
- **Track C (Quality):** observability/logging cleanup and lint/test stabilization.

## Phase 2 — Login and Recovery Alignment

### Goals

- Fully align login, forgot-password, and reset-password with planned behavior and states.

### Tasks

1. **Login feature completion**
   - Add query-driven behaviors:
     - `?session=expired` message/state
     - `?oauth=provider` auto-trigger behavior (with graceful fallback)
   - Implement OAuth entry controls for planned providers.
   - Ensure rate-limit and lockout UX states are surfaced consistently.

2. **Forgot-password alignment**
   - Ensure success/error/rate-limit/retry states map to plan.
   - Confirm resend timing and user feedback behavior are implemented or explicitly deferred with mitigation.

3. **Reset-password alignment**
   - Enforce token validity UX, invalid/expired handling, and request-new-link recovery path.
   - Verify password-strength and requirements UX aligns with plan and accessibility expectations.

### Parallelization

- **Track A:** login + OAuth behavior.
- **Track B:** forgot/reset flow hardening.
- **Track C:** auth API contract and route-query integration checks.

## Phase 3 — Registration and Email Verification Rebuild

### Goals

- Close the largest functional gap by implementing the planned onboarding flow.

### Tasks

1. **Register multi-step flow (Step 1-4)**
   - Implement account type, tenant info, user account, and confirmation steps.
   - Persist step state safely, support step navigation/back behavior, and enforce per-step validation.

2. **Verification gating**
   - Ensure dashboard access is gated until email verification is complete.

3. **Verify-email OTP flow**
   - Implement planned 6-digit OTP experience:
     - per-digit inputs
     - paste support
     - auto-advance/backspace behavior
     - resend countdown with real API integration
     - attempts/rate-limit states

### Parallelization

- **Track A:** register stepper + form/state orchestration.
- **Track B:** OTP component + resend API flow + attempt handling.
- **Track C:** gating and redirect rules (post-register, post-verify, dashboard access).

## Phase 4 — Accessibility, RTL, and UX Compliance Hardening

### Goals

- Close all non-functional compliance gaps for critical auth paths.

### Tasks

1. **Accessibility hardening**
   - Resolve broken ARIA references and ensure proper `aria-describedby` linkage.
   - Validate keyboard order, focus handling, and live regions for async states.
   - Confirm color contrast and status semantics (`status`/`alert`) across all states.

2. **RTL/LTR parity hardening**
   - Validate mirrored layout behavior for all auth pages and interactions.
   - Ensure logical properties and direction-sensitive icon behavior are correct.

3. **UX consistency pass**
   - Ensure loading/success/error/rate-limit patterns are consistent across all auth flows.

### Parallelization

- **Track A:** a11y implementation fixes.
- **Track B:** RTL/LTR visual and interaction parity.
- **Track C:** shared UX state/pattern consistency.

## Phase 5 — Verification, Testing, and Release Readiness

### Goals

- Validate complete plan alignment and ship with objective quality evidence.

### Tasks

1. **Unit and component tests**
   - Add missing tests for login/register/forgot/reset/verify components and key hook behavior.

2. **Route-flow integration tests**
   - Cover redirect query handling, token handling, authenticated-user auth-page redirect, and verification gating.

3. **Accessibility and RTL validation**
   - Run automated a11y scans and directionality checks across changed auth pages.

4. **Performance checks**
   - Verify auth route/bundle impact remains aligned with UI overview targets and does not regress startup UX.

5. **Final traceability sign-off**
   - Mark each requirement as satisfied with evidence (test or implementation artifact).

### Parallelization

- **Track A:** test implementation.
- **Track B:** a11y/RTL validation.
- **Track C:** performance and release checklist.

## 5) File-Level Worklist (Primary Touchpoints)

- Routes:
  - `/apps/frontend/src/routes/$locale/auth/login.tsx`
  - `/apps/frontend/src/routes/$locale/auth/register.tsx`
  - `/apps/frontend/src/routes/$locale/auth/forgot-password.tsx`
  - `/apps/frontend/src/routes/$locale/auth/reset-password.tsx`
  - `/apps/frontend/src/routes/$locale/auth/verify-email.tsx`
- Pages:
  - `/apps/frontend/src/routes/$locale/auth/-login.page.tsx`
  - `/apps/frontend/src/routes/$locale/auth/-register.page.tsx`
  - `/apps/frontend/src/routes/$locale/auth/-forgot-password.page.tsx`
  - `/apps/frontend/src/routes/$locale/auth/-reset-password.page.tsx`
  - `/apps/frontend/src/routes/$locale/auth/-verify-email.page.tsx`
- Components:
  - `/apps/frontend/src/components/auth/LoginForm.tsx`
  - `/apps/frontend/src/components/auth/RegisterForm.tsx`
  - `/apps/frontend/src/components/auth/ForgotPasswordForm.tsx`
  - `/apps/frontend/src/components/auth/ResetPasswordForm.tsx`
  - `/apps/frontend/src/components/auth/VerifyEmailClient.tsx`
  - `/apps/frontend/src/components/auth/AuthLayout.tsx`
- Hooks/API/validation:
  - `/apps/frontend/src/hooks/useLoginMutation.ts`
  - `/apps/frontend/src/hooks/usePasswordReset.ts`
  - `/apps/frontend/src/hooks/useAuthMutation.ts`
  - `/apps/frontend/src/lib/api/auth-api.ts`
  - `/apps/frontend/src/lib/validations/auth.ts`
- Tests (to add/expand in relevant test directories):
  - auth component tests
  - auth route behavior tests
  - auth flow integration tests

## 6) Acceptance Criteria for 100% Alignment

Alignment is complete only when all conditions are true:

1. All authentication pages and states defined in `/docs/architecture/ui/04-pages/authentication.md` are implemented or explicitly documented as deferred with approved mitigation.
2. Auth flow routing/query behavior matches documented contracts and is validated through tests.
3. WCAG 2.1 AA compliance is achieved for changed auth surfaces, with critical path quality meeting the project’s AAA target intent.
4. RTL/LTR parity is verified for all changed auth surfaces.
5. Error handling, loading/success feedback, and security-sensitive messaging are consistent across flows.
6. Automated and manual validation evidence is attached for functional, a11y, i18n/RTL, and performance checks.

## 7) Risks and Mitigations

- **Risk:** Multi-step registration introduces state complexity and regressions.  
  **Mitigation:** Isolate step state machine, add step-level tests, and gate merges behind route-flow tests.

- **Risk:** OAuth and query-state additions create redirect edge cases.  
  **Mitigation:** Use a single redirect sanitization utility and centralize query contract parsing.

- **Risk:** OTP flow complexity (timers, retries, resend) leads to flaky tests.  
  **Mitigation:** Use deterministic timer controls in tests and strict API contract mocks.

- **Risk:** A11y/RTL fixes regress existing visual behavior.  
  **Mitigation:** Combine automated checks with targeted visual regression and keyboard/screen-reader test scripts.

## 8) Definition of Done

This roadmap is complete when:

- All phases are executed.
- Every requirement in the referenced plan docs is traceably satisfied.
- All required tests and checks pass.
- Stakeholders approve final traceability and release-readiness evidence.
