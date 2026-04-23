# Authentication Alignment — Phase 0 Planning Lock and Traceability

**Date:** 2026-04-23  
**Roadmap Source:** [`authentication-implementation-alignment-roadmap-2026-04-23.md`](./authentication-implementation-alignment-roadmap-2026-04-23.md)  
**Scope:** `/apps/frontend/src/routes/$locale/auth`  
**Phase:** 0 (Planning Lock and Traceability)

---

## Objective

Freeze interpretation of authentication requirements before implementation phases begin, and provide a requirement-to-delivery mapping that prevents scope drift and enables deterministic sign-off.

---

## Planning Lock

### In scope for alignment execution

- Login page parity (query contracts, OAuth entry points, auth states, redirect safety).
- Registration parity (4-step flow, validation gates, verify-email dependency).
- Forgot/reset password parity (token handling, recovery states, rate-limit messaging).
- Verify email parity (planned OTP UX, resend behavior, attempt handling).
- Shared quality constraints across auth:
  - WCAG 2.1 AA baseline with AAA target intent on critical auth paths.
  - RTL/LTR parity via logical properties and locale direction.
  - Localized error and success messaging (no raw server strings in UI).
  - Test, a11y, and performance evidence for changed surfaces.

### Out of scope for Phase 0

- Code-level implementation of Phase 1+ tasks.
- Legal content finalization not required for auth behavior alignment.
- New architecture decisions outside already approved UI architecture docs.

---

## Track A — Functional Requirement Matrix

| Requirement ID | Source requirement                                                                                               | Route/page scope                          | Current state (baseline)                          | Phase target | Evidence artifact (planned)                     | Source trace                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------- | ------------ | ----------------------------------------------- | --------------------------------------------------------------- |
| FR-LOGIN-001   | Login supports email/password and OAuth provider entry points                                                    | `auth/login` + `LoginForm`                | Email/password present; OAuth parity incomplete   | Phase 2      | Login form tests + route-flow tests             | `authentication.md#login-page`                                  |
| FR-LOGIN-002A  | Canonical query ownership for `redirect`, `session=expired`, `oauth=provider` lives at route validation boundary | `auth/login` route and consumers          | Query behavior parsed inconsistently in consumers | Phase 1      | Route validation tests + hook contract tests    | `authentication.md#login-page`                                  |
| FR-LOGIN-002B  | Query-driven login behavior (`session=expired` message and `oauth=provider` trigger/fallback) is complete        | `auth/login` route + page                 | Partial                                           | Phase 2      | Route-flow integration tests                    | `authentication.md#login-page`                                  |
| FR-LOGIN-003   | Rate-limit/lockout UX states are user-visible and actionable                                                     | `LoginForm`, API error mapping            | Partial/inconsistent                              | Phase 2      | Component tests + translated state assertions   | `authentication.md#login-page`                                  |
| FR-LOGIN-004   | Remember-me session persistence behavior is explicit and tested                                                  | `LoginForm`, auth session handling        | Not explicitly trace-mapped                       | Phase 2      | Login behavior tests + session assertions       | `authentication.md#login-page`                                  |
| FR-REG-001     | Registration follows 4-step flow (account type, tenant info, user account, confirmation)                         | `auth/register` + `RegisterForm`          | Not implemented as 4-step flow                    | Phase 3      | Multi-step flow tests + acceptance checklist    | `authentication.md#registration-page`                           |
| FR-REG-002     | Step-level validation and safe step navigation/back behavior                                                     | `RegisterForm` state orchestration        | Missing                                           | Phase 3      | Unit tests for step state machine               | `authentication.md#registration-page`                           |
| FR-REG-003     | Verification gating enforced before dashboard access                                                             | Register + dashboard auth gate            | Not complete                                      | Phase 3      | Route-flow integration tests                    | `authentication.md#registration-page`                           |
| FR-REG-004     | Register query contracts (`plan`, `type`, `invite`, `oauth`) are route-validated and consumer-consistent         | `auth/register` route + page              | Missing explicit contract coverage                | Phase 1 + 3  | Route validation + register flow tests          | `authentication.md#registration-page`                           |
| FR-FORGOT-001  | Forgot password state parity (loading/success/error/rate-limit/retry)                                            | `auth/forgot-password`                    | Partial                                           | Phase 2      | Form tests and error-state snapshots            | `authentication.md#password-reset-request-page`                 |
| FR-RESET-001   | Reset password token validity and recovery path                                                                  | `auth/reset-password`                     | Token handling present but parity gaps remain     | Phase 2      | Route + component tests                         | `authentication.md#password-reset-confirm-page`                 |
| FR-RESET-002   | Reset password UX includes strength rules, requirement checklist, and confirm-match behavior                     | `auth/reset-password` form UI             | Under-specified in current implementation         | Phase 2      | Component tests for strength/match requirements | `authentication.md#password-reset-confirm-page`                 |
| FR-VERIFY-001  | Verify email uses 6-digit OTP UX with resend countdown and attempt handling                                      | `auth/verify-email` + `VerifyEmailClient` | Token-status UI, not OTP flow                     | Phase 3      | OTP interaction tests + integration tests       | `authentication.md#email-verification-page`                     |
| FR-VERIFY-002  | Verify-email query contracts (`email`, `resend`) are route-validated and behavior-safe                           | `auth/verify-email` route + page          | Missing explicit contract coverage                | Phase 1 + 3  | Route validation + verify flow tests            | `authentication.md#email-verification-page`                     |
| FR-VERIFY-003  | Verify-email supports safe "change email" escape flow                                                            | `auth/verify-email`                       | Missing explicit mapping                          | Phase 3      | Flow navigation tests                           | `authentication.md#email-verification-page`                     |
| FR-SHARED-001  | Auth pages redirect authenticated users away from auth surface                                                   | all auth routes                           | Missing/inconsistent                              | Phase 1      | Route guard tests                               | `authentication-implementation-alignment-roadmap-2026-04-23.md` |
| FR-SHARED-002  | Canonical search-param ownership is route-first and consumer-consistent                                          | auth routes + hooks                       | Partial, duplicate parsing                        | Phase 1      | Route/use-hook contract tests                   | `authentication-implementation-alignment-roadmap-2026-04-23.md` |

---

## Track B — Accessibility, RTL, and i18n Matrix

| Requirement ID | Quality domain | Requirement                                                                                        | Scope                          | Baseline gap                          | Phase target | Evidence artifact (planned)                         | Source trace                                       |
| -------------- | -------------- | -------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------- | ------------ | --------------------------------------------------- | -------------------------------------------------- |
| QL-A11Y-001    | Accessibility  | Valid `aria-describedby` linkages and error semantics                                              | all auth forms                 | Broken/missing references in places   | Phase 4      | axe + manual SR checks (no broken ARIA refs)        | `authentication.md#shared-authentication-patterns` |
| QL-A11Y-002    | Accessibility  | Keyboard-first navigation and visible focus states                                                 | all auth pages                 | Needs hardening                       | Phase 4      | keyboard journey scripts with pass/fail checklist   | `authentication.md#shared-authentication-patterns` |
| QL-A11Y-003    | Accessibility  | Async feedback uses proper `status`/`alert` live regions                                           | loading/error/success states   | Inconsistent patterns                 | Phase 4      | component-level assertions + SR announcement checks | `authentication.md#shared-authentication-patterns` |
| QL-A11Y-004    | Accessibility  | High-contrast support for auth critical interactions                                               | all auth pages                 | Not explicitly validated              | Phase 4      | contrast report + manual verification evidence      | `00-overview.md#key-principles`                    |
| QL-A11Y-005    | Accessibility  | Screen reader compatibility target (NVDA/JAWS/VoiceOver) for critical auth path                    | login/register/recovery/verify | Not formalized in auth phase plan     | Phase 5      | SR matrix report with pass outcomes                 | `00-overview.md#success-metrics`                   |
| QL-I18N-001    | Localization   | All user-facing strings externalized and key-driven                                                | routes/components/hooks        | Raw error text can leak               | Phase 1 + 4  | i18n validation + untranslated-key checks           | `00-overview.md#key-principles`                    |
| QL-I18N-002    | Localization   | Error localization normalized for API/auth errors                                                  | hooks + API wrappers + forms   | Inconsistent translation resolution   | Phase 1      | error mapper tests                                  | `authentication.md#shared-authentication-patterns` |
| QL-I18N-003    | Localization   | Timer/rate-limit interpolation and pluralization are locale-correct                                | login/forgot/verify            | Not explicitly validated              | Phase 4      | locale snapshot/assertion tests                     | `authentication.md#shared-authentication-patterns` |
| QL-RTL-001     | RTL/LTR        | Directional parity for all auth interactions and layout                                            | all auth pages                 | Not fully validated end-to-end        | Phase 4      | RTL/LTR visual + interaction checks                 | `00-overview.md#rtl-implementation`                |
| QL-RTL-002     | RTL/LTR        | Logical properties and directional icon behavior                                                   | shared auth components         | Requires consistency pass             | Phase 4      | component visual/behavior checks                    | `00-overview.md#rtl-implementation`                |
| QL-RTL-003     | RTL/LTR        | Page-specific RTL differences (stepper reversal, button direction, mirrored controls) are verified | register/verify/login patterns | Not explicitly enumerated in baseline | Phase 4      | page-specific parity checklist                      | `authentication.md#registration-page`              |

---

## Track C — Testing and Quality-Gate Baseline Matrix

| Requirement ID | Gate           | Requirement                                                                    | Baseline                            | Phase target | Evidence artifact (planned)               | Source trace                                                    |
| -------------- | -------------- | ------------------------------------------------------------------------------ | ----------------------------------- | ------------ | ----------------------------------------- | --------------------------------------------------------------- |
| QG-TEST-001    | Unit/component | Auth form and state logic coverage expanded for critical routes                | Partial coverage                    | Phase 5      | Vitest suite additions                    | `authentication-implementation-alignment-roadmap-2026-04-23.md` |
| QG-TEST-002    | Integration    | Route-flow coverage for redirects, token/query contracts, verification gating  | Incomplete                          | Phase 5      | route-flow integration tests              | `authentication-implementation-alignment-roadmap-2026-04-23.md` |
| QG-A11Y-001    | Accessibility  | Automated a11y checks on changed auth pages (zero axe violations in CI)        | Not complete                        | Phase 5      | a11y CI reports (axe zero-violation gate) | `00-overview.md#success-metrics`                                |
| QG-A11Y-002    | Accessibility  | Manual critical-path SR and keyboard evidence captured with named owner        | Not formalized                      | Phase 5      | manual test report + sign-off table       | `00-overview.md#success-metrics`                                |
| QG-RTL-001     | RTL/LTR        | Directionality validation for changed auth routes                              | Not complete                        | Phase 5      | RTL/LTR test evidence                     | `00-overview.md#key-principles`                                 |
| QG-I18N-001    | Localization   | Locale key parity and no raw error key leakage in auth surfaces                | Not complete                        | Phase 4 + 5  | i18n validate report + UI assertions      | `00-overview.md#key-principles`                                 |
| QG-SECUX-001   | Security UX    | Redirect sanitization and unsafe target blocking validated in route-flow tests | Not explicit in baseline matrix     | Phase 2 + 5  | redirect safety integration tests         | `authentication-implementation-alignment-roadmap-2026-04-23.md` |
| QG-VRT-001     | Visual quality | Auth visual-regression checks (LTR and RTL) for changed surfaces               | Missing                             | Phase 4 + 5  | visual regression artifacts               | `00-overview.md#success-metrics`                                |
| QG-PERF-001    | Performance    | Auth route performance/bundle impact check against overview targets            | Not formalized per auth updates     | Phase 5      | performance/bundle reports                | `00-overview.md#success-metrics`                                |
| QG-OBS-001     | Observability  | Remove console logging from auth runtime paths, retain structured telemetry    | Console logging present in baseline | Phase 1      | lint + code audit evidence                | `00-overview.md#success-metrics`                                |

### Gate timing policy

- Phase-exit checks are left-shifted for touched scope:
  - **Phase 1 exit:** `QG-OBS-001`, initial `QG-I18N-001`
  - **Phase 2 exit:** `QG-SECUX-001` for login/recovery routes
  - **Phase 3 exit:** OTP and registration route-flow coverage subset from `QG-TEST-002`
  - **Phase 4 exit:** `QG-A11Y-001` dry-run + `QG-RTL-001` + `QG-VRT-001` for changed pages
  - **Phase 5 exit:** full gate closure and owner sign-off

---

## Definition of Done Matrix (Phase-Level)

| Phase   | Done when                                                                                                                                                             | Blocking dependencies            |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| Phase 1 | Authenticated-user redirect guard, canonical query handling, localized error normalization, validation standardization, and observability cleanup all land with tests | Phase 0 lock                     |
| Phase 2 | Login + recovery flows match documented states and routing contracts; OAuth/query behaviors and lockout messaging validated                                           | Phase 1                          |
| Phase 3 | Registration 4-step flow, OTP verification UX, and verification gating behavior are complete and tested                                                               | Phase 2 foundations              |
| Phase 4 | a11y + RTL/LTR parity hardening complete for all changed auth surfaces                                                                                                | Phases 1-3 functional completion |
| Phase 5 | test/a11y/RTL/performance evidence complete; full traceability sign-off achieved                                                                                      | Phases 1-4                       |

---

## Acceptance Ownership and Sign-off

| Owner group          | Expected decision                                             | Status                                    | Notes                                            |
| -------------------- | ------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------ |
| UI Architecture      | Confirm traceability matrix completeness and scope boundaries | Pending                                   | Requires owner review in implementation PR cycle |
| Frontend Engineering | Confirm phase sequencing and dependency correctness           | Approved (engineering execution baseline) | This document is execution baseline for Phase 1+ |
| QA / Quality         | Confirm quality-gate expectations and evidence format         | Pending                                   | To be finalized before Phase 5 closeout          |

---

## Execution Notes

- This Phase 0 artifact is intentionally implementation-agnostic and functions as the contract for all subsequent phases.
- Any new requirement discovered in implementation must be added here first, with source link and phase assignment, before code changes proceed.
- Deferred work requires explicit mitigation and owner in the execution changelog.
