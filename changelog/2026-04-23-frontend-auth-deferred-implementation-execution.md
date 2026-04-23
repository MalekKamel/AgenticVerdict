# Changelog: Frontend auth deferred implementation plan — execution

**Date:** 2026-04-23  
**Scope:** Systematic execution of the engineering-owned tracks from [`docs/05-reference/frontend-auth-deferred-implementation-plan.md`](../docs/05-reference/frontend-auth-deferred-implementation-plan.md): **A3 (support contact configuration path)**, **B (dedicated auth-only shell behavior)**, and **C (unified auth route metadata / `<head>`)**. This delivery adds config-aware public support contact handling, introduces a locale-aware shell gate that removes member app chrome on `/auth/*`, and centralizes localized auth SEO metadata with consistent robots behavior across auth routes.

**Verification run:**

- `pnpm --filter @agenticverdict/frontend run typecheck`
- `pnpm --filter @agenticverdict/frontend run i18n:validate`
- `pnpm --filter @agenticverdict/frontend run test`
- `pnpm --filter @agenticverdict/frontend exec vitest run src/components/layout/LocaleShellGate.test.ts`

---

## Summary

### A3 — Help/support path made config-aware

- Added a frontend-safe support resolver in [`apps/frontend/src/lib/public-support.ts`](../apps/frontend/src/lib/public-support.ts) to read `VITE_PUBLIC_SUPPORT_EMAIL` with safe trimming/fallback behavior.
- Updated [`apps/frontend/src/components/auth/AuthLegalDocument.tsx`](../apps/frontend/src/components/auth/AuthLegalDocument.tsx) so `AuthHelpContent` resolves support email from environment first, then locale messages (`auth.help.supportEmailDefault`).
- Added `VITE_PUBLIC_SUPPORT_EMAIL` typing in [`apps/frontend/src/vite-env.d.ts`](../apps/frontend/src/vite-env.d.ts).
- Documented env usage in [`.env.example`](../.env.example) to support operations-owned support-channel rollout without code changes.

### B — Auth-only shell behavior under `/$locale`

- Added [`apps/frontend/src/components/layout/AuthChromeLayout.tsx`](../apps/frontend/src/components/layout/AuthChromeLayout.tsx): minimal header chrome (language + color-scheme controls) and centered content area for unauthenticated auth screens.
- Added [`apps/frontend/src/components/layout/LocaleShellGate.tsx`](../apps/frontend/src/components/layout/LocaleShellGate.tsx): route-path gate that chooses `AuthChromeLayout` for `/auth/*` and `AppShellLayout` for non-auth locale routes.
- Updated [`apps/frontend/src/routes/$locale/route.tsx`](../apps/frontend/src/routes/$locale/route.tsx) to use `LocaleShellGate` instead of always wrapping with `AppShellLayout`.
- Added path-selection tests in [`apps/frontend/src/components/layout/LocaleShellGate.test.ts`](../apps/frontend/src/components/layout/LocaleShellGate.test.ts).

### C — Unified auth route metadata (`<head>`)

- Added centralized auth SEO meta builder in [`apps/frontend/src/lib/auth/build-auth-seo-head.ts`](../apps/frontend/src/lib/auth/build-auth-seo-head.ts), reading localized strings from the `/$locale` loader messages and emitting:
  - route title
  - route description
  - `robots: noindex, nofollow`
- Added `auth.seo.*` keys to locale dictionaries:
  - [`apps/frontend/messages/en.json`](../apps/frontend/messages/en.json)
  - [`apps/frontend/messages/ar.json`](../apps/frontend/messages/ar.json)
  - [`apps/frontend/messages/fr.json`](../apps/frontend/messages/fr.json)
- Migrated auth routes to use centralized metadata builder:
  - [`apps/frontend/src/routes/$locale/auth/login.tsx`](../apps/frontend/src/routes/$locale/auth/login.tsx)
  - [`apps/frontend/src/routes/$locale/auth/register.tsx`](../apps/frontend/src/routes/$locale/auth/register.tsx)
  - [`apps/frontend/src/routes/$locale/auth/forgot-password.tsx`](../apps/frontend/src/routes/$locale/auth/forgot-password.tsx)
  - [`apps/frontend/src/routes/$locale/auth/reset-password.tsx`](../apps/frontend/src/routes/$locale/auth/reset-password.tsx)
  - [`apps/frontend/src/routes/$locale/auth/verify-email.tsx`](../apps/frontend/src/routes/$locale/auth/verify-email.tsx)
  - [`apps/frontend/src/routes/$locale/auth/terms.tsx`](../apps/frontend/src/routes/$locale/auth/terms.tsx)
  - [`apps/frontend/src/routes/$locale/auth/privacy.tsx`](../apps/frontend/src/routes/$locale/auth/privacy.tsx)
  - [`apps/frontend/src/routes/$locale/auth/help.tsx`](../apps/frontend/src/routes/$locale/auth/help.tsx)

---

## Added

### `apps/frontend/src/lib`

- **`public-support.ts`** — public support email resolver (`getPublicSupportEmail`) with env + fallback safety.
- **`auth/build-auth-seo-head.ts`** — locale-message-driven auth metadata factory shared by auth route files.

### `apps/frontend/src/components/layout`

- **`AuthChromeLayout.tsx`** — slim unauthenticated chrome wrapper.
- **`LocaleShellGate.tsx`** — locale-path gate for shell selection (`/auth/*` vs app routes).
- **`LocaleShellGate.test.ts`** — unit tests for auth-path detection.

### `changelog`

- **`2026-04-23-frontend-auth-deferred-implementation-execution.md`** — this execution record.

---

## Changed

### `apps/frontend/messages`

- **`en.json`**, **`ar.json`**, **`fr.json`**
  - Added localized `auth.seo` blocks for all auth routes.
  - Renamed help email key to `auth.help.supportEmailDefault`.
  - Updated help-hours wording to operationally neutral language (no placeholder disclaimer text in help-hours copy).

### `apps/frontend/src/components/auth`

- **`AuthLegalDocument.tsx`**
  - `AuthHelpContent` now derives support email from env-backed resolver, with message fallback.

### `apps/frontend/src/routes/$locale`

- **`route.tsx`**
  - Replaced unconditional `AppShellLayout` wrapping with `LocaleShellGate` routing behavior.

### `apps/frontend/src/routes/$locale/auth`

- **`login.tsx`**, **`register.tsx`**, **`forgot-password.tsx`**, **`reset-password.tsx`**, **`verify-email.tsx`**, **`terms.tsx`**, **`privacy.tsx`**, **`help.tsx`**
  - Replaced per-file hardcoded `head` metadata with `buildAuthSeoHead(matches, routeKey)`.

### Environment typing/docs

- **`apps/frontend/src/vite-env.d.ts`** — added `VITE_PUBLIC_SUPPORT_EMAIL`.
- **`.env.example`** — documented frontend support-email env for auth help page.

---

## Plan mapping

| Plan track / step                                        | Delivered                                                                                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **A3.2** (`VITE_PUBLIC_SUPPORT_EMAIL` / config contract) | Added env var contract, typing, and `AuthHelpContent` read-path with fallback.                                                    |
| **A3.4** (i18n support content path)                     | Updated locale dictionaries consistently (`en`/`ar`/`fr`) and validated key parity.                                               |
| **B2.3** (conditional shell approach)                    | Implemented structural shell gate (`LocaleShellGate`) selecting auth vs app shell by locale-aware pathname.                       |
| **B3** (landmark/RTL-safe shell split constraints)       | Kept locale wrapper with `lang`/`dir`; removed app chrome on `/auth/*`; retained dedicated auth screen structure in `AuthLayout`. |
| **C2.2** (single source metadata + i18n)                 | Added `auth.seo.*` and centralized route head builder consuming locale loader messages.                                           |
| **C2.3** (robots policy)                                 | Added `robots: noindex, nofollow` across auth routes via shared head builder.                                                     |

---

## Deferred / follow-ups

- **A1 / A2 (Legal finalization):** Terms and Privacy legal-body replacement/sign-off remains Legal + Product owned; this execution did not author counsel-final legal text.
- **A3 tenant bootstrap integration:** current support email source is frontend env + locale fallback; per-tenant runtime support channels from backend tenant bootstrap API can be added later if required.
- **B architecture note/ADR:** implementation follows the deferred plan’s shell split intent; a formal ADR is still optional if product/design wants a long-lived auth-layout branch strategy.
- **C social metadata:** OG/Twitter auth tags remain intentionally omitted pending marketing policy (auth pages are currently `noindex`).

---

## References

- [`docs/05-reference/frontend-auth-deferred-implementation-plan.md`](../docs/05-reference/frontend-auth-deferred-implementation-plan.md)
- [`prompts/frontend-auth-production-readiness-prompt.md`](../prompts/frontend-auth-production-readiness-prompt.md)
- [`changelog/2026-04-17-web-tanstack-post-review-p1-p2-implementation.md`](2026-04-17-web-tanstack-post-review-p1-p2-implementation.md)
