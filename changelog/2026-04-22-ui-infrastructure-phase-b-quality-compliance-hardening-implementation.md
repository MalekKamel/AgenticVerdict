# Changelog: UI infrastructure plan — Phase B quality and compliance hardening (B1-B4)

**Date:** 2026-04-22  
**Scope:** Execution of **Phase B (Short-term: 2-6 weeks)** from [`ui-infrastructure-research-and-implementation-plan-2026-04-22.md`](../docs/03-technology-research/frontend/ui-infrastructure-research-and-implementation-plan-2026-04-22.md): token-based auth styling and design-system alignment (B1), WCAG 2.1 AA hardening on auth interactions (B2), auth i18n/RTL parity closure (B3), and auth funnel observability instrumentation (B4). This phase builds directly on Phase A delivery in [`2026-04-22-ui-infrastructure-phase-a-auth-stabilization-implementation.md`](2026-04-22-ui-infrastructure-phase-a-auth-stabilization-implementation.md).

**Verification run:** `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false`, `pnpm --filter @agenticverdict/frontend exec vitest run src/lib/observability/auth-funnel-analytics.test.ts src/hooks/useLoginMutation.test.ts`, `pnpm --filter @agenticverdict/frontend run i18n:validate`

---

## Summary

### B1 — Token-based styling and design-system usage enforcement on auth routes

- Removed repeated one-off auth link color classes (`text-blue-600`) across auth surfaces and replaced with token-driven styles (`--av-color-primary`, focus outlines, underline offsets) in:
  - [`AuthLayout`](../apps/frontend/src/components/auth/AuthLayout.tsx)
  - [`LoginForm`](../apps/frontend/src/components/auth/LoginForm.tsx)
  - [`ForgotPasswordForm`](../apps/frontend/src/components/auth/ForgotPasswordForm.tsx)
  - [`RegisterForm`](../apps/frontend/src/components/auth/RegisterForm.tsx)
  - [`ResetPasswordForm`](../apps/frontend/src/components/auth/ResetPasswordForm.tsx)
- Updated auth shell background and divider usage from Tailwind gray utilities to token-backed surface/border variables in [`AuthLayout`](../apps/frontend/src/components/auth/AuthLayout.tsx).
- Replaced hardcoded success/neutral fallback colors inside password-requirement and strength-adjacent UI with design-token variables in [`RegisterForm`](../apps/frontend/src/components/auth/RegisterForm.tsx) and [`ResetPasswordForm`](../apps/frontend/src/components/auth/ResetPasswordForm.tsx).
- Updated verify-email and fallback spinners/status color blocks to token-driven palette variables in:
  - [`VerifyEmailClient`](../apps/frontend/src/components/auth/VerifyEmailClient.tsx)
  - [`-verify-email.page.tsx`](../apps/frontend/src/routes/$locale/auth/-verify-email.page.tsx)

### B2 — WCAG 2.1 AA hardening for auth flows

- Fixed keyboard accessibility blocker on password visibility toggle by removing `tabIndex={-1}`, adding `aria-pressed`, minimum hit-area sizing, and focus-visible outline treatment in [`PasswordInput`](../apps/frontend/src/components/auth/PasswordInput.tsx).
- Promoted semantic landmark correctness by switching auth content container from `div role="main"` to native `<main id="main-content" tabIndex={-1}>` in [`AuthLayout`](../apps/frontend/src/components/auth/AuthLayout.tsx).
- Strengthened keyboard/a11y regression coverage in Playwright:
  - updated [`login-a11y.spec.ts`](../apps/frontend/e2e/login-a11y.spec.ts) to include keyboard focus traversal through show-password toggle and corrected skip-link selector
  - removed JS-evaluate checkbox click anti-pattern in [`register-flow.spec.ts`](../apps/frontend/e2e/register-flow.spec.ts) in favor of real user interaction
  - added locale-aware auth axe smoke coverage in [`auth-a11y-locale.spec.ts`](../apps/frontend/e2e/auth-a11y-locale.spec.ts) for `/en` and `/ar` auth routes

### B3 — i18n and RTL/LTR parity pass for auth domain

- Added missing shared common auth-support keys in all shipped locale dictionaries:
  - `common.retry`
  - `common.contactSupport`
- Normalized `auth.register` locale structure in `ar` and `fr` to match `en` nested contract (`fields.*.label/placeholder`, `fields.acceptTerms.*`, `buttons.createAccount/creatingAccount`, and state/error keys used by UI).
- Added missing verify-email keys in `ar` and `fr` required by current auth UI:
  - `buttons.signIn`, `buttons.backToRegister`, `buttons.resendCountdown`
  - `errors.noToken`
  - full `status.*` status copy used by `VerifyEmailClient`
- Localized verify-email suspense fallback text to `common.loading` in [`-verify-email.page.tsx`](../apps/frontend/src/routes/$locale/auth/-verify-email.page.tsx).
- Validated locale key alignment via `i18n:validate` (293 leaves aligned).

### B4 — Auth funnel observability instrumentation

- Introduced dedicated auth-funnel telemetry utility [`auth-funnel-analytics.ts`](../apps/frontend/src/lib/observability/auth-funnel-analytics.ts) with tenant-safe payload enrichment and structured event taxonomy on `surface: "auth_funnel"`.
- Added test coverage for helper payload shape and tenant fallback behavior in [`auth-funnel-analytics.test.ts`](../apps/frontend/src/lib/observability/auth-funnel-analytics.test.ts).
- Instrumented login flow in [`useLoginMutation.ts`](../apps/frontend/src/hooks/useLoginMutation.ts):
  - `auth.login.submit`
  - `auth.login.result` success/failure
  - latency capture and redirect classification (`dashboard_default`, `safe_internal`, `auth_loop_blocked`)
- Instrumented register flow in [`useRegisterMutation.ts`](../apps/frontend/src/hooks/useRegisterMutation.ts):
  - `auth.register.submit`
  - `auth.register.result` success/failure + latency
- Instrumented forgot/reset password flows in [`usePasswordReset.ts`](../apps/frontend/src/hooks/usePasswordReset.ts):
  - request reset submit/result success/failure
  - confirm reset submit/result success/failure with token presence classification
- Instrumented verify-email flow and resend action in [`VerifyEmailClient.tsx`](../apps/frontend/src/components/auth/VerifyEmailClient.tsx):
  - attempt/result events with token presence and error-code classification
  - resend click cooldown event

---

## Added

### `apps/frontend/e2e`

- **`auth-a11y-locale.spec.ts`** — axe locale matrix smoke for auth routes (`/en`, `/ar`).

### `apps/frontend/src/lib/observability`

- **`auth-funnel-analytics.ts`** — structured auth funnel telemetry helper.
- **`auth-funnel-analytics.test.ts`** — helper payload and tenant fallback unit tests.

---

## Changed

### `apps/frontend/src/components/auth`

- **`AuthLayout.tsx`** — tokenized shell styles, tokenized nav links, native `<main>` landmark.
- **`PasswordInput.tsx`** — keyboard/focus hardening and toggle semantics (`aria-pressed`).
- **`LoginForm.tsx`** — tokenized auth links.
- **`ForgotPasswordForm.tsx`** — tokenized auth link.
- **`RegisterForm.tsx`** — tokenized terms links and requirement-state color tokens.
- **`ResetPasswordForm.tsx`** — tokenized links/requirement colors and localized requirement aria-state labels.
- **`VerifyEmailClient.tsx`** — auth funnel telemetry events and tokenized status visuals.

### `apps/frontend/src/hooks`

- **`useLoginMutation.ts`** — login telemetry with latency and redirect-class tagging.
- **`useRegisterMutation.ts`** — register telemetry submit/result hooks.
- **`usePasswordReset.ts`** — forgot/reset telemetry submit/result hooks.

### `apps/frontend/src/routes/$locale/auth`

- **`-verify-email.page.tsx`** — localized fallback loading copy and tokenized loader colors.

### `apps/frontend/messages`

- **`en.json`** — added `common.retry`, `common.contactSupport`, and register submit parity key.
- **`ar.json`** — filled register/verify-email missing keys and common auth-support keys.
- **`fr.json`** — filled register/verify-email missing keys and common auth-support keys.

### `apps/frontend/e2e`

- **`login-a11y.spec.ts`** — improved keyboard path and skip-link assertion.
- **`register-flow.spec.ts`** — switched to native checkbox interaction.

---

## Phase B plan mapping

| Phase B task                                             | Delivered outcome                                                                                                                     |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **B1** Enforce token-based styling + design-system usage | Auth shell, links, status visuals, and requirement indicators now use shared tokenized patterns instead of one-off color utilities    |
| **B2** WCAG 2.1 AA hardening                             | Password toggle keyboard access fixed; semantic main landmark standardized; auth a11y E2E coverage expanded (including locale matrix) |
| **B3** i18n + RTL/LTR parity for auth                    | Missing auth locale keys resolved in `ar`/`fr`; fallback loading copy localized; translation tree validation passes                   |
| **B4** Auth funnel observability instrumentation         | Structured tenant-safe auth events added across login/register/forgot/reset/verify flows with helper-level unit coverage              |

---

## Notes and follow-ups

- Route-level auth page `<head>` metadata remains largely static-English and should be moved to locale-aware metadata generation in a follow-up iteration.
- `VerifyEmailClient` currently classifies some failures by message substring (`expired`/`invalid`) due current API response shape; migrating to stable server-side error codes would make classification locale-agnostic.

---

## References

- [`docs/03-technology-research/frontend/ui-infrastructure-research-and-implementation-plan-2026-04-22.md`](../docs/03-technology-research/frontend/ui-infrastructure-research-and-implementation-plan-2026-04-22.md)
- [`changelog/2026-04-22-ui-infrastructure-phase-a-auth-stabilization-implementation.md`](2026-04-22-ui-infrastructure-phase-a-auth-stabilization-implementation.md)
- [`changelog/2026-04-17-web-tanstack-post-review-p1-p2-implementation.md`](2026-04-17-web-tanstack-post-review-p1-p2-implementation.md)
