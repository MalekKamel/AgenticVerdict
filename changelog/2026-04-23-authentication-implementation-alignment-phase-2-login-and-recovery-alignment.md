# Changelog: Authentication implementation alignment — Phase 2 login and recovery alignment

**Date:** 2026-04-23  
**Scope:** Execution of **Phase 2 — Login and Recovery Alignment** from [`docs/architecture/ui/04-pages/authentication-implementation-alignment-roadmap-2026-04-23.md`](../docs/architecture/ui/04-pages/authentication-implementation-alignment-roadmap-2026-04-23.md), building on:

- [`changelog/2026-04-23-authentication-implementation-alignment-phase-0-planning-lock-and-traceability.md`](2026-04-23-authentication-implementation-alignment-phase-0-planning-lock-and-traceability.md)
- [`changelog/2026-04-23-authentication-implementation-alignment-phase-1-shared-foundation-corrections.md`](2026-04-23-authentication-implementation-alignment-phase-1-shared-foundation-corrections.md)

**Execution mode:** systematic implementation with parallelized review and delivery across roadmap tracks:

- **Track A:** login query-state + OAuth surface alignment
- **Track B:** forgot/reset flow state hardening
- **Track C:** auth API contract normalization + route-query integration

**Verification run:** `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false`, `pnpm --filter @agenticverdict/frontend exec vitest run src/hooks/useLoginMutation.test.ts src/hooks/usePasswordReset.test.ts`, `pnpm --filter @agenticverdict/frontend run i18n:validate`.

---

## Summary

### Track A — Login feature completion (query states + OAuth controls + lockout/rate-limit UX)

- Extended login route query contract to support roadmap query-driven states:
  - `?session=expired` for explicit expired-session messaging
  - `?oauth=google|microsoft|apple` for provider auto-trigger attempts
  - retained canonical `redirect` behavior from Phase 1
- Updated login page wiring to consume validated route search and pass session/OAuth intent directly into `LoginForm`.
- Added OAuth entry controls in `LoginForm` for planned providers (`Google`, `Microsoft`, `Apple`) with localized labels and dedicated state messaging.
- Added OAuth auto-trigger behavior from query state with graceful fallback:
  - auto-trigger attempts once per provider intent
  - on failure, user remains on login form with explicit fallback notice and manual OAuth controls available
- Introduced explicit lockout/rate-limit UI handling on login:
  - dedicated rate-limit alert with retry-after countdown message when available
  - dedicated lockout alert state for repeated attempt/account-lock errors
- Preserved secure post-login redirect behavior through existing safe redirect sanitization/classification logic.

### Track B — Forgot-password and reset-password hardening

- Upgraded forgot-password flow state handling to cover retry/rate-limit conditions:
  - form now tracks `retryAfter` cooldown from API details
  - submit action is disabled while cooldown is active
  - localized retry countdown feedback is shown inline
- Added optional `email` route query support for forgot-password page to allow request-new-link continuity and prefilled recovery flow.
- Refined reset-password error-state handling using structured mutation errors (code + message + details) instead of substring-only parsing.
- Strengthened reset-password recovery UX:
  - invalid/expired/rate-limited states now consistently surface request-new-link path
  - reset form reads typed error object (not plain message string)
- Added password strength live status semantics (`aria-live="polite"`) to improve assistive feedback during password composition.

### Track C — API contract and route-query integration checks

- Improved auth API error normalization (`auth-api.ts`) to map lockout-related backend responses to consistent localized keys:
  - `auth.errors.accountLocked`
  - `auth.errors.tooManyAttempts`
- Introduced typed auth mutation errors in password-reset hooks, preserving:
  - normalized error code
  - translated message key
  - `retryAfter` details for UI countdown
- Expanded route-level search validation:
  - `login`: `session`, `oauth`, `redirect`
  - `forgot-password`: `redirect`, `email`
  - `reset-password`: trimmed `token`, `redirect`, `email`
- Added hook-level unit coverage for new state helpers and retry-after normalization.

---

## Added

### `apps/frontend`

- `src/hooks/usePasswordReset.test.ts`
  - Added unit coverage for typed auth mutation error retry-after normalization.

### `changelog`

- `2026-04-23-authentication-implementation-alignment-phase-2-login-and-recovery-alignment.md` (this execution record).

---

## Changed

### `apps/frontend/src/routes/$locale/auth`

- `login.tsx`
  - Added canonical validated search params for `session` and `oauth` provider intent.
- `-login.page.tsx`
  - Wired validated `session` and `oauth` search states into `LoginForm`.
- `forgot-password.tsx`
  - Added optional `email` search validation for prefilled recovery paths.
- `-forgot-password.page.tsx`
  - Passes `defaultEmail` into forgot-password form.
- `reset-password.tsx`
  - Search validation now trims `token` and accepts optional `email` context.

### `apps/frontend/src/components/auth`

- `LoginForm.tsx`
  - Added session-expired state alert.
  - Added OAuth controls and provider auto-trigger fallback behavior.
  - Added explicit rate-limit/lockout state rendering.
  - Preserved existing email/password login behavior and locale-aware flow.
- `ForgotPasswordForm.tsx`
  - Added retry-after cooldown handling and countdown UX.
  - Added `defaultEmail` form initialization support.
  - Normalized unknown error fallback to generic internal error key.
- `ResetPasswordForm.tsx`
  - Consumes typed error metadata (`code`, `retryAfterSeconds`) for token/rate-limit handling.
  - Strengthened request-new-link conditional states.
  - Added `aria-live` strength status text behavior.
- `ResetPasswordFormClient.tsx`
  - Passes structured `AuthMutationError` into reset form instead of raw string message.

### `apps/frontend/src/hooks`

- `useLoginMutation.ts`
  - Added `LoginOAuthProvider` + extended mutation state model (`idle/submitting/oauth_redirecting/error/rate_limited/locked_out`).
  - Added `loginWithOAuth` flow with graceful unavailable fallback.
  - Added retry-after extraction from API details for rate-limited states.
  - Added helper export `resolveLoginErrorState` for deterministic state mapping.
- `useLoginMutation.test.ts`
  - Added tests for rate-limit and lockout state mapping behavior.
- `usePasswordReset.ts`
  - Added `AuthMutationError` typed error class preserving `code`, `details`, and `retryAfterSeconds`.
  - Reworked forgot/reset error handling to keep structured metadata for UI state branching and analytics.

### `apps/frontend/src/lib/api`

- `auth-api.ts`
  - Enhanced backend raw error normalization for account lockout / excessive-attempt semantics to localized auth keys.

### `apps/frontend/messages`

- `en.json`, `ar.json`, `fr.json`
  - Added new localized keys for:
    - login session-expired state
    - login OAuth UI + fallback
    - login rate-limit and lockout states
    - forgot-password retry countdown and rate-limit messaging
    - reset-password rate-limit messaging

---

## Phase 2 roadmap mapping

| Phase 2 task                                                      | Delivered implementation                                                                                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Login query-driven behavior (`session=expired`, `oauth=provider`) | Route-level validated search contract + page-form wiring + session-expired alert + OAuth auto-trigger/fallback flow |
| OAuth entry controls                                              | Added localized provider controls in `LoginForm` for Google/Microsoft/Apple                                         |
| Login rate-limit/lockout UX consistency                           | `useLoginMutation` state model + dedicated UI alerts for rate-limit/lockout + retry-after messaging                 |
| Forgot-password state alignment (success/error/rate-limit/retry)  | Added typed error mapping and cooldown countdown state with disabled submit + retry messaging                       |
| Reset-password token validity and recovery path                   | Structured invalid/expired/rate-limited handling, request-new-link path consistency, typed error propagation        |
| Password strength UX/a11y alignment                               | Added live strength announcement semantics and preserved requirements/strength indicator behavior                   |
| Auth API contract and route-query integration checks              | Auth API error normalization hardening + route query coverage expansion + hook/unit verification                    |

---

## Deferred / follow-ups

- OAuth provider redirect endpoints and backend callback integration remain pending; current Phase 2 implementation provides the planned UI/query contract and graceful fallback without unsafe or broken redirects.
- Forgot-password resend timing behavior is currently driven by server-provided retry metadata when present; if backend does not supply retry hints, generic rate-limit messaging is used.
- Dedicated component/route integration tests for login OAuth auto-trigger and forgot/reset UI state branches are recommended for Phase 5 quality gate expansion.

---

## References

- [`docs/architecture/ui/04-pages/authentication-implementation-alignment-roadmap-2026-04-23.md`](../docs/architecture/ui/04-pages/authentication-implementation-alignment-roadmap-2026-04-23.md)
- [`changelog/2026-04-23-authentication-implementation-alignment-phase-0-planning-lock-and-traceability.md`](2026-04-23-authentication-implementation-alignment-phase-0-planning-lock-and-traceability.md)
- [`changelog/2026-04-23-authentication-implementation-alignment-phase-1-shared-foundation-corrections.md`](2026-04-23-authentication-implementation-alignment-phase-1-shared-foundation-corrections.md)
- [`changelog/2026-04-17-web-tanstack-post-review-p1-p2-implementation.md`](2026-04-17-web-tanstack-post-review-p1-p2-implementation.md)
