# Changelog: Authentication implementation alignment — Phase 1 shared foundation corrections

**Date:** 2026-04-23  
**Scope:** Execution of **Phase 1 — Shared Foundation Corrections** from [`authentication-implementation-alignment-roadmap-2026-04-23.md`](../docs/architecture/ui/04-pages/authentication-implementation-alignment-roadmap-2026-04-23.md), following the traceability baseline in [`2026-04-23-authentication-implementation-alignment-phase-0-planning-lock-and-traceability.md`](2026-04-23-authentication-implementation-alignment-phase-0-planning-lock-and-traceability.md).  
**Verification run:** `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false` and `pnpm --filter @agenticverdict/frontend exec vitest run src/hooks/useLoginMutation.test.ts`.

---

## Summary

### Track A — Routing guard + canonical query contracts

- Added authenticated-user redirect protection to auth entry routes (`login`, `register`, `forgot-password`) with safe target sanitization and locale-aware redirect behavior.
- Standardized route search contracts so auth pages consume validated route search values instead of ad-hoc `URLSearchParams` parsing in components/hooks.
- Introduced shared safe-redirect utilities to prevent auth-route loops and reject unsafe targets (including protocol-relative values).
- Added shared auth layout client guard using `useSessionQuery()` to redirect authenticated users away from auth surfaces in SPA/runtime paths.

### Track B — Validation + error localization normalization

- Standardized login form validation to shared Zod schema (`loginSchema`) via Mantine `zodResolver`, matching the existing shared-schema strategy used by other auth forms.
- Normalized auth API error mapping so raw backend values are converted to auth i18n keys before UI rendering.
- Updated auth forms/components to render translated error messages from normalized auth keys rather than exposing backend/raw strings.

### Track C — Observability/logging hygiene

- Removed runtime `console.*` statements from auth hooks in active execution paths (`useRegisterMutation`, `usePasswordReset`, `useAuthMutation`, `LoginForm`) while preserving structured funnel events.
- Kept telemetry events outcome-based and non-sensitive (no credential/token payload logging introduced).

---

## Added

### `apps/frontend`

- `src/lib/auth/safe-auth-redirect.ts`
  - `sanitizeAuthRedirectTarget()` for safe internal redirect fallback behavior.
  - `classifyAuthRedirectTarget()` for telemetry-safe redirect outcome classification.

### `changelog`

- `2026-04-23-authentication-implementation-alignment-phase-1-shared-foundation-corrections.md` (this execution record).

---

## Changed

### `apps/frontend/src/routes/$locale/auth`

- `login.tsx`, `register.tsx`, `forgot-password.tsx`
  - Added route-level authenticated-user redirect guards (SSR path) using `fetchProtectedRouteSession`.
  - Added/standardized `validateSearch.redirect`.
  - Redirect destination now uses shared sanitization utility + locale-safe redirect href.
- `reset-password.tsx`, `verify-email.tsx`
  - Search validation now includes canonical optional `redirect` alongside existing `token`.
- `-login.page.tsx`, `-register.page.tsx`, `-forgot-password.page.tsx`, `-reset-password.page.tsx`, `-verify-email.page.tsx`
  - Switched to route-validated search consumption via `Route.useSearch()`.
  - Passed canonical search values down into auth components (`redirect`, `token`) instead of reparsing URL state in hooks/components.

### `apps/frontend/src/components/auth`

- `AuthLayout.tsx`
  - Added authenticated-user client guard with `useSessionQuery()` + `router.replace()` to keep auth pages inaccessible to authenticated users in SPA paths.
  - Added `authenticatedRedirectTo` prop with safe-target sanitization.
- `LoginForm.tsx`
  - Replaced hand-written validation with `zodResolver(loginSchema)`.
  - Removed runtime `console.error`.
  - Added translation-safe rendering for auth error keys.
  - Accepts `redirectTo` and forwards it to login mutation.
- `ResetPasswordFormClient.tsx`, `VerifyEmailClient.tsx`
  - Removed ad-hoc query parsing (`URLSearchParams`) and now receive token from route/page props.
- `RegisterForm.tsx`, `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`, `VerifyEmailClient.tsx`
  - Normalized localized rendering of auth API error keys.

### `apps/frontend/src/hooks`

- `useLoginMutation.ts`
  - Removed direct URL search parsing.
  - Uses shared redirect-classification utility and optional `redirectFromSearch` input.
  - Emits normalized auth error keys to UI/store (`auth.errors.*`) instead of raw English literals.
- `usePasswordReset.ts`
  - Removed ad-hoc URL search parsing for token resolution; token now comes from caller contract.
  - Removed runtime console logging in success/error paths.
- `useRegisterMutation.ts`, `useAuthMutation.ts`
  - Removed runtime console logging from active mutation handlers.
- `useLoginMutation.test.ts`
  - Added protocol-relative redirect rejection case to safe redirect behavior coverage.

### `apps/frontend/src/lib/api`

- `auth-api.ts`
  - `extractErrorMessage()` now normalizes backend/raw error messages into auth translation keys, preferring `auth.*` keys and falling back to code map.

---

## Phase 1 roadmap mapping

| Phase 1 task                                     | Delivered implementation                                                                                                                                                                                    |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authenticated-user redirect guard for auth pages | Route guards on `login/register/forgot-password` + shared `AuthLayout` session guard for runtime/SPA auth surfaces.                                                                                         |
| Canonical search-param handling                  | Route-level `validateSearch` is consumed with `Route.useSearch()` in auth pages; removed ad-hoc query parsing from `LoginMutation`, `ResetPasswordFormClient`, `VerifyEmailClient`, and `usePasswordReset`. |
| Error localization normalization                 | `auth-api` now normalizes raw backend errors to auth i18n keys; auth forms/components render localized keys for all user-visible auth errors.                                                               |
| Validation standardization                       | Login form switched to shared Zod (`loginSchema` + `zodResolver`), aligning with shared auth validation strategy.                                                                                           |
| Observability hygiene                            | Removed runtime `console.*` from auth hooks/components in active execution paths; retained structured funnel telemetry events.                                                                              |

---

## Deferred / follow-ups

- `reset-password` and `verify-email` rely on shared `AuthLayout` session guard for authenticated-user redirection in runtime/SPA paths; route-level SSR guard parity can be added in a follow-up if strict SSR symmetry is required for all auth routes.
- Phase 2/3 behavioral gaps from the roadmap remain open by design (login query states, OAuth entry behavior, register multi-step flow, OTP verify flow).
- Additional auth route/component integration tests beyond `useLoginMutation` redirect unit coverage remain for Phase 5 validation scope.

---

## References

- [`docs/architecture/ui/04-pages/authentication-implementation-alignment-roadmap-2026-04-23.md`](../docs/architecture/ui/04-pages/authentication-implementation-alignment-roadmap-2026-04-23.md)
- [`docs/architecture/ui/04-pages/authentication-phase-0-planning-lock-and-traceability-2026-04-23.md`](../docs/architecture/ui/04-pages/authentication-phase-0-planning-lock-and-traceability-2026-04-23.md)
- [`changelog/2026-04-23-authentication-implementation-alignment-phase-0-planning-lock-and-traceability.md`](2026-04-23-authentication-implementation-alignment-phase-0-planning-lock-and-traceability.md)
