# Changelog: Authentication implementation alignment — Phase 4 accessibility, RTL, and UX compliance hardening

**Date:** 2026-04-23  
**Scope:** Execution of **Phase 4 — Accessibility, RTL, and UX Compliance Hardening** from [`docs/architecture/ui/04-pages/authentication-implementation-alignment-roadmap-2026-04-23.md`](../docs/architecture/ui/04-pages/authentication-implementation-alignment-roadmap-2026-04-23.md), building on:

- [`changelog/2026-04-23-authentication-implementation-alignment-phase-0-planning-lock-and-traceability.md`](2026-04-23-authentication-implementation-alignment-phase-0-planning-lock-and-traceability.md)
- [`changelog/2026-04-23-authentication-implementation-alignment-phase-1-shared-foundation-corrections.md`](2026-04-23-authentication-implementation-alignment-phase-1-shared-foundation-corrections.md)
- [`changelog/2026-04-23-authentication-implementation-alignment-phase-2-login-and-recovery-alignment.md`](2026-04-23-authentication-implementation-alignment-phase-2-login-and-recovery-alignment.md)
- [`changelog/2026-04-23-authentication-implementation-alignment-phase-3-registration-and-email-verification-rebuild.md`](2026-04-23-authentication-implementation-alignment-phase-3-registration-and-email-verification-rebuild.md)

**Execution mode:** systematic hardening with parallelized tracks:

- **Track A:** accessibility semantics and ARIA/focus repairs
- **Track B:** RTL/LTR parity for directional auth controls
- **Track C:** UX state-consistency normalization across auth flows

**Verification run:** `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false`, `pnpm --filter @agenticverdict/frontend exec vitest run src/hooks/useLoginMutation.test.ts src/hooks/usePasswordReset.test.ts src/hooks/useRequireAuth.test.tsx`, `pnpm --filter @agenticverdict/frontend run i18n:validate`.

---

## Summary

### Track A — Accessibility hardening

- Removed broken `aria-describedby` references in `RegisterForm` where corresponding DOM nodes did not exist.
- Corrected conditional ARIA linkage in `ResetPasswordForm` by wiring password requirement IDs only when requirement nodes are mounted.
- Standardized critical async error announcement semantics:
  - added explicit `role="alert"` + `aria-live="assertive"` wrappers where missing
  - ensured register and reset-password API failure states are announced consistently
- Improved focus discoverability of state transitions by focusing status regions on key transitions:
  - register API failure
  - register confirmation step activation
  - verify-email status surfaces
- Improved OTP input semantics by grouping code input under a labelled group (`aria-labelledby`) instead of relying on nearby visual text only.

### Track B — RTL/LTR parity hardening

- Introduced shared directional auth-control helper (`getDirectionalSectionProps`) to place button icons on logical start side for both LTR and RTL.
- Applied directional icon-section behavior across login/register/forgot/reset actions and login OAuth provider buttons.
- Applied directional mirroring to the directional forgot-password icon (`IconMailForward`) in RTL contexts.
- Added `login.oauth.redirecting` locale key parity in `en`, `ar`, and `fr` dictionaries to support new live OAuth transition status.

### Track C — UX consistency hardening

- Removed login in-form success alert (`login.successMessage`) that was typically hidden by immediate redirect; aligned login UX to transition-first behavior.
- Added explicit OAuth redirecting live status in `LoginForm` for `oauth_redirecting` state.
- Reworked verify-email failure handling from brittle message substring parsing to structured code-based state mapping using mutation error metadata.
- Added structured `AuthMutationError` propagation for verify/resend and register mutations to preserve error codes and retry metadata.
- Split verify-email rate-limit UX into its own warning surface (yellow semantics) instead of reusing generic red error rendering.
- Ensured resend button state parity with other auth forms by exposing `loading` during resend mutation and applying consistent disable/cooldown behavior.

---

## Added

### `apps/frontend/src/components/auth`

- `authUi.ts`
  - Added `getDirectionalSectionProps(icon, isRtl)` utility for shared logical icon placement.

### `changelog`

- `2026-04-23-authentication-implementation-alignment-phase-4-accessibility-rtl-ux-compliance-hardening.md` (this execution record).

---

## Changed

### `apps/frontend/src/components/auth`

- `LoginForm.tsx`
  - Added locale-direction awareness (`useLocale` + `getDirection`) for button icon sections.
  - Added OAuth redirecting live status alert (`role="status"`).
  - Removed transient success alert path for redirect-driven login flow.
- `ForgotPasswordForm.tsx`
  - Added locale-direction-aware icon placement and directional icon mirroring for RTL.
- `ResetPasswordForm.tsx`
  - Added live error-region semantics (`role="alert"`).
  - Corrected conditional `aria-describedby` to avoid dangling ARIA references.
  - Added locale-direction-aware icon placement for submit CTA.
- `RegisterForm.tsx`
  - Removed broken `aria-describedby` references on account-step fields.
  - Added focusable status region handling for API failures and confirmation state.
  - Added locale-direction-aware icon placement for submit CTA.
- `VerifyEmailClient.tsx`
  - Added structured error classification helpers and code-driven status mapping.
  - Added dedicated `rate_limited` warning UI state (separate from generic error state).
  - Added resilient resend error handling (rate-limit-specific cooldown; non-rate-limit errors stay in generic error state).
  - Added grouped OTP labeling semantics and refined status focus management.
  - Reduced action duplication by rendering base action controls in idle state and state-specific controls in non-idle modes.

### `apps/frontend/src/hooks`

- `useAuthMutation.ts`
  - `useVerifyEmailMutation` and `useResendEmailVerificationMutation` now throw `AuthMutationError` with code/details for deterministic UI-state mapping.
- `useRegisterMutation.ts`
  - Register mutation now throws `AuthMutationError` on API failures and logs structured failure code.
- `usePasswordReset.ts`
  - Expanded retry metadata extraction to support both `retryAfter` and `retryAfterSeconds`.

### `apps/frontend/src/lib/api`

- `auth-api.ts`
  - Updated `verifyEmail` response typing to include optional `attemptsRemaining` metadata.

### `apps/frontend/messages`

- `en.json`, `ar.json`, `fr.json`
  - Added `auth.login.oauth.redirecting` key with locale parity.

---

## Phase 4 roadmap mapping

| Phase 4 task             | Delivered implementation                                                                                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accessibility hardening  | Broken ARIA linkages removed/fixed; async status semantics normalized; status-focus management added; OTP group labeling improved                                                 |
| RTL/LTR parity hardening | Direction-aware icon section helper introduced and applied to auth actions/OAuth controls; directional icon mirrored for RTL; locale key parity maintained                        |
| UX consistency pass      | Verify-email states normalized to structured error codes; dedicated rate-limit rendering added; login redirect UX de-duplicated; resend/loading/disabled behavior made consistent |

---

## Deferred / follow-ups

- Add dedicated verify-email component tests for code-based status mapping and rate-limit surface behavior (currently covered by type contracts and targeted hook tests only).
- Expand locale messaging model to support rich-text interpolation for complex legal copy assembly patterns in register terms text (full word-order control per locale).
- Add route-level a11y automation (keyboard flow assertions + live-region announcement checks) as part of Phase 5 verification evidence.

---

## References

- [`docs/architecture/ui/04-pages/authentication-implementation-alignment-roadmap-2026-04-23.md`](../docs/architecture/ui/04-pages/authentication-implementation-alignment-roadmap-2026-04-23.md)
- [`changelog/2026-04-17-web-tanstack-post-review-p1-p2-implementation.md`](2026-04-17-web-tanstack-post-review-p1-p2-implementation.md)
- [`changelog/2026-04-23-authentication-implementation-alignment-phase-0-planning-lock-and-traceability.md`](2026-04-23-authentication-implementation-alignment-phase-0-planning-lock-and-traceability.md)
- [`changelog/2026-04-23-authentication-implementation-alignment-phase-1-shared-foundation-corrections.md`](2026-04-23-authentication-implementation-alignment-phase-1-shared-foundation-corrections.md)
- [`changelog/2026-04-23-authentication-implementation-alignment-phase-2-login-and-recovery-alignment.md`](2026-04-23-authentication-implementation-alignment-phase-2-login-and-recovery-alignment.md)
- [`changelog/2026-04-23-authentication-implementation-alignment-phase-3-registration-and-email-verification-rebuild.md`](2026-04-23-authentication-implementation-alignment-phase-3-registration-and-email-verification-rebuild.md)
