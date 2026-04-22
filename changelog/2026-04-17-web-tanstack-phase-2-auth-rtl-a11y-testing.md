# Changelog: Web TanStack Start — Phase 2 (auth hardening, RTL/a11y baselines, testing & CI)

**Date:** 2026-04-17  
**Scope:** Execution of **Phase 2 (Weeks 3–4) — Core features** from [`web-tanstack-start-recommendations-implementation-plan-2026-04-17.md`](../docs/03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md): unified session-aware auth guard, mock session persistence aligned with `useSessionQuery`, protected dashboard route, MFA readiness types + env gate, design-token pipeline in main CI, `eslint-plugin-jsx-a11y`, expanded axe E2E (login + RTL), and additional unit tests. Aligns with [Decision 11](../docs/architecture/ui/04-decision-record.md#decision-11-trpc-as-unified-api-layer-for-multi-client-support) (domain RPC on `apps/api`).

**Verification run:** `pnpm run validate:pen-files`, `pnpm exec turbo run lint typecheck --filter=@agenticverdict/frontend`, `pnpm --filter @agenticverdict/frontend test`, `pnpm --filter @agenticverdict/frontend build`, `pnpm exec vitest run --coverage` (monorepo gate), `pnpm --filter @agenticverdict/frontend test:e2e` (recommended before merge).

---

## Summary

- **P2-1 Auth hardening:** Introduced **`SessionProvider`** so `useSessionQuery` runs app-wide; mock **`authApi`** now keeps an in-memory session after **`login`** / **`logout`** so the session query does not wipe **`authActions.setAuth`** from login. **`useRequireAuth`** is rewritten to use **`useSessionQuery`** (`isPending` + `data.user`) and locale-aware redirects to `/auth/login` with a `redirect` query param, skipping `/auth/*` to avoid loops. Added **`/$locale/dashboard`** as a first protected surface using **`useRequireAuth`**. **`useLoginMutation`** / **`useLogoutMutation`** invalidate `["auth","session"]` after success.
- **P2-2 MFA readiness:** Added **`mfa-readiness.ts`** (`MfaFactorType`, `MfaChallengeResponse`, **`isMfaUiEnabled()`** via **`VITE_PUBLIC_ENABLE_MFA_UI`**). Default off until product enables MFA.
- **P2-3 Design tokens:** **`pnpm run validate:pen-files`** added to **`.github/workflows/ci.yml`** (Quality job) so the Pencil pipeline runs on every CI run, not only the path-filtered UI guidelines workflow.
- **P2-4 RTL baseline:** Swapped physical Tailwind padding on auth UI (**`pe-12`** on password field, **`ps-5`** on error list) for logical inline start/end.
- **P2-5 A11y baseline:** Enabled **`eslint-plugin-jsx-a11y`** (`flatConfigs.recommended`) in **`apps/frontend/eslint.config.mjs`**; fixed or narrowly suppressed violations in auth forms (redundant **`role`** attributes; **`form` + `onKeyDown`** documented with eslint-disable where Enter-validation is intentional; password requirement list items no longer use **`role="checkbox"`** on **`li`**—**`aria-label`** per row instead). Extended **`e2e/a11y-home.spec.ts`** with English and Arabic **login** axe scans (wcag2a/2aa, critical/serious).
- **P2-6 Test infra:** New tests: **`useRequireAuth.test.tsx`**, **`auth-api.session.test.ts`**, **`mfa-readiness.test.ts`**. Monorepo **Vitest coverage** configuration remains **excluding `apps/frontend/**`** from thresholded coverage (same as pre–Phase 2) to avoid collapsing global % until Phase 3’s scoped coverage push; web still runs full unit tests in CI via **`vitest run --coverage`\*\* on packages/apps that participate in the gate.

---

## Added

### `apps/frontend`

- **`src/providers/SessionProvider.tsx`** — mounts **`useSessionQuery()`** under React Query.
- **`src/routes/$locale/dashboard.tsx`** — authenticated dashboard stub (navigation + email).
- **`src/lib/auth/mfa-readiness.ts`** — MFA API contract types + **`isMfaUiEnabled()`**.
- **`src/hooks/useRequireAuth.test.tsx`** — redirect / pending / auth-route behavior.
- **`src/lib/api/auth-api.session.test.ts`** — mock login → getSession → logout chain.
- **`src/lib/auth/mfa-readiness.test.ts`** — env flag behavior.

### CI

- **`.github/workflows/ci.yml`** — **`Validate Pencil .pen files`** step (`pnpm run validate:pen-files`).

### Dependencies

- **`apps/frontend`:** `eslint-plugin-jsx-a11y` (dev).

---

## Changed

### `apps/frontend`

- **`src/lib/api/auth-api.ts`** — in-memory **`mockBrowserSession`**; login sets session, logout clears, getSession reads it; mock **`tenantId`** uses UUID **`11111111-1111-4111-8111-111111111111`** for alignment with tenant resolution tests.
- **`src/hooks/useRequireAuth.ts`** — session-query-based guard + optional **`UseRequireAuthOptions`** (`redirectTo`, **`onUnauthorized`**); retains **`isAuthenticatedGuard`** for **`useAuth`** consumers.
- **`src/hooks/useSessionQuery.ts`** — removed obsolete stub **`useRequireAuth`**; tuned defaults (**`refetchOnWindowFocus: true`**, **`staleTime`**, **`refetchInterval`** for soft session refresh).
- **`src/hooks/useLoginMutation.ts`** / **`src/hooks/useAuthMutation.ts`** (**`useLogoutMutation`**) — session query invalidation after login/logout.
- **`src/components/Providers.tsx`** — **`SessionProvider`** wrapping **`TenantProvider`**.
- **`src/components/auth/PasswordInput.tsx`**, **`AuthError.tsx`**, **`ForgotPasswordForm.tsx`**, **`RegisterForm.tsx`**, **`ResetPasswordForm.tsx`** — logical CSS / jsx-a11y fixes.
- **`src/vite-env.d.ts`** — **`VITE_PUBLIC_ENABLE_MFA_UI`**.
- **`eslint.config.mjs`** — jsx-a11y recommended flat config.
- **`e2e/a11y-home.spec.ts`** — login routes (en/ar) axe coverage.

### `vitest.config.ts`

- Restored **`apps/frontend/**`** under **`coverage.exclude`\*\* (no change to effective web coverage reporting vs Phase 1 baseline; avoids global threshold regression until Phase 3).

---

## Work packages mapping

| Plan ID | Delivered in this change                                                                                 |
| ------- | -------------------------------------------------------------------------------------------------------- |
| P2-1    | SessionProvider, mock session bridge, unified useRequireAuth, dashboard route, login/logout invalidation |
| P2-2    | MFA types + env gate (`VITE_PUBLIC_ENABLE_MFA_UI`)                                                       |
| P2-3    | `validate:pen-files` in main CI Quality job                                                              |
| P2-4    | Logical Tailwind on auth components (sample fixes)                                                       |
| P2-5    | eslint-plugin-jsx-a11y + form fixes; axe E2E for login (LTR + RTL)                                       |
| P2-6    | New unit tests; coverage gate unchanged (web still excluded from global thresholds)                      |

---

## Deferred / follow-ups (Phase 3+)

- **`beforeLoad` / server-aware auth** for protected routes once session cookies or SSR session reads are defined (current guard is client/session-query SSOT with mock API).
- **Raise `apps/frontend` coverage** with explicit globs/thresholds (Phase 3 **P3-6**) — re-include `apps/frontend` in coverage or add a package-local threshold.
- **Storybook / Ladle** (plan open question): still optional per product; not started here.
- **CompanyConfig-driven MFA** when backend exposes tenant MFA policy (beyond env flag).

---

## References

- [`docs/03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md`](../docs/03-technology-research/frontend/web-tanstack-start-recommendations-implementation-plan-2026-04-17.md) — Phase 2 exit criteria and work packages.
- [`docs/architecture/ui/04-decision-record.md`](../docs/architecture/ui/04-decision-record.md) — Decision 11 (tRPC unified API).
- [`changelog/2026-04-17-web-tanstack-phase-1-foundation-tenant-trpc-errors.md`](2026-04-17-web-tanstack-phase-1-foundation-tenant-trpc-errors.md) — Phase 1 foundation.
