# Frontend Auth Architecture Reference (2026-04-26)

## Scope

This reference documents the frontend authentication architecture in `apps/frontend`, including session resolution, redirect ownership, loop-prevention controls, tenant alignment, and verification strategy.

Primary implementation files:

- `apps/frontend/src/lib/auth/auth-resolution-state.ts`
- `apps/frontend/src/lib/auth/auth-access-policy.ts`
- `apps/frontend/src/lib/auth/protected-route-session.ts`
- `apps/frontend/src/lib/auth/auth-session-transition.ts`
- `apps/frontend/src/lib/auth/safe-auth-redirect.ts`
- `apps/frontend/src/hooks/useRequireAuth.ts`
- `apps/frontend/src/hooks/useSessionQuery.ts`
- `apps/frontend/src/hooks/useLoginMutation.ts`
- `apps/frontend/src/routes/$locale/dashboard.tsx`
- `apps/frontend/src/routes/$locale/auth/login.tsx`
- `apps/frontend/src/routes/$locale/auth/register.tsx`
- `apps/frontend/src/routes/$locale/auth/forgot-password.tsx`

---

## 1) Auth Resolution State Model

`auth-resolution-state.ts` defines the shared finite-state model:

- `unknown` (`initial` | `probe_failed` | `recovering`)
- `anonymous`
- `authenticated_unverified`
- `authenticated_verified`

Rules:

1. `unknown` is non-terminal and does not trigger hard redirects.
2. Redirect decisions are made only from terminal states.
3. `authenticated_unverified` is first-class and policy-driven, not ad hoc per route.

This model is used consistently in both SSR route probes and client session query flows.

---

## 2) Centralized Access Policy

`auth-access-policy.ts` is the route decision kernel:

- Input: `{ routeKind, authState, locale, redirectTarget }`
- Route kinds: `public_auth` | `protected` | `public_general`
- Output: `allow` | `redirect(to)` | `defer`

Policy highlights:

- `unknown` -> `defer` to prevent probe-failure redirect loops.
- `public_auth` + authenticated -> redirect to safe target (default `/dashboard`).
- `protected` + anonymous -> redirect to `/{locale}/auth/login?redirect=...`.
- `protected` + unverified -> redirect to `/{locale}/auth/verify-email?...`.

This ensures one deterministic decision contract across route guards.

---

## 3) Redirect Ownership and Loop Prevention

### Authoritative redirect layer

Route `beforeLoad` guards own redirect decisions in SSR-capable modes:

- `/$locale/dashboard`
- `/$locale/auth/login`
- `/$locale/auth/register`
- `/$locale/auth/forgot-password`

These routes now consume the shared policy kernel instead of bespoke conditional redirect logic.

### Client fallback behavior

`useRequireAuth` is no longer a competing redirect owner for SSR paths.
It performs redirects only in SPA/test runtime (`import.meta.env.MODE === "spa" || "test"`), where SSR probes are unavailable.

### Layout behavior

`AuthLayout` is render-only and no longer triggers authenticated redirect side effects.
This removes layout-vs-route navigation races that previously contributed to loop behavior.

---

## 4) SSR Session Probe Contract

`fetchProtectedRouteSession()` (`protected-route-session.ts`) calls `auth.getSession` from server context and returns:

- normalized `authState`

Failure semantics:

- Probe/runtime failures are mapped to `authState.kind = "unknown"` with reason `probe_failed`.
- Policy evaluates `unknown` as `defer`, preventing false unauthenticated redirects during transient outages.

---

## 5) Session Source of Truth and Transition Contract

Runtime source of truth:

- Primary: React Query cache key `["auth", "session"]` via `useSessionQuery`.
- Secondary: auth store mirror (`authActions`) for UI convenience only.

Post-login transition hardening:

- `useLoginMutation` now applies successful session updates via `applySuccessfulLoginSession`.
- The helper writes query cache and store atomically for monotonic post-login state.
- This avoids transient authenticated->anonymous flips during immediate navigation.

---

## 6) Redirect Safety Contract

`safe-auth-redirect.ts` sanitizes incoming redirect targets:

- only root-relative internal paths are allowed,
- `/auth/*` redirect targets are blocked to avoid auth self-loop chains,
- fallback target remains `/dashboard`.

All public auth route redirects and post-login redirects use this safety contract.

---

## 7) Tenant Consistency Contract (Auth-Specific)

To prevent tenant mismatch oscillation:

- Session probe and session query for `auth.getSession` avoid tenant-header forcing.
- Pre-session auth requests still use tenant resolution/merge where required.
- Tenant mismatch conditions must resolve to stable UX, not alternating auth/protected redirects.

---

## 8) Test Matrix (Current)

State and policy:

- `apps/frontend/src/lib/auth/auth-resolution-state.test.ts`
- `apps/frontend/src/lib/auth/auth-access-policy.test.ts`

Route contracts:

- `apps/frontend/src/routes/$locale/auth/-auth-route-contracts.test.ts`

Client fallback:

- `apps/frontend/src/hooks/useRequireAuth.test.tsx`

Auth mutation/session transition:

- `apps/frontend/src/hooks/useLoginMutation.test.ts`

Required validation command set for changed scope:

- `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false`
- targeted vitest suites above

---

## 9) Operational Diagnostics Checklist

Use this checklist for auth loop investigations:

1. Confirm runtime mode (`spa` vs SSR-capable) and redirect owner.
2. Inspect probe outcome (`authState.kind` and `authState.reason` for unknown states).
3. Verify `unknown` states are deferred, not redirected.
4. Validate sanitized redirect target is not `/auth/*` or external.
5. Confirm session cache/store transition sequence after login.
6. Validate locale-aware redirect output from policy kernel.
7. Run route and hook contract tests before releasing fixes.

---

## 10) Definition of Stable Behavior

Auth routing is considered stable when:

1. Redirect decisions are centralized through the policy kernel.
2. Probe failures no longer force login redirects.
3. Layout and route layers do not race on redirects.
4. Post-login transitions are monotonic for a navigation tick.
5. Regression tests for loop-prone flows pass consistently.
