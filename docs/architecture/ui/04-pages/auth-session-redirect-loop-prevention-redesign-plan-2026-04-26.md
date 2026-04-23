# Auth Session and Redirect Loop Prevention Redesign Plan (2026-04-26)

## Status

- Proposed architecture and implementation plan.
- Scope: `apps/frontend` auth/session routing and guard behavior, plus API contract hardening needed to support deterministic decisions.
- Primary incident addressed: redirect loop between `/$locale/auth/login?redirect=...` and `/$locale/dashboard`.

## 1) Executive Summary

The current implementation mixes multiple sources of truth for auth state and redirect decisions:

- server route guards (`beforeLoad` + `createServerFn` session probe),
- client route/page guards (`useRequireAuth`, `AuthLayout`),
- React Query session cache,
- auth store mirror state.

This creates timing windows and inconsistent failure semantics (for example, probe failures interpreted as "unauthenticated"), which can cause redirect ping-pong loops.

### Redesign goal

Adopt a **single authoritative auth decision model** per navigation lifecycle:

1. Normalize auth state into explicit finite states (`authenticated_verified`, `authenticated_unverified`, `anonymous`, `unknown`).
2. Make route guards pure and deterministic from those states.
3. Treat transport/probe failures as `unknown` (non-redirecting) until a client reconciliation pass resolves state.
4. Remove duplicated guard logic from page layouts/components that can fight route-level decisions.

This plan aligns with tenant SSOT requirements (explicit failure codes, deterministic resolution, no silent fallbacks) and prevents this class of issue structurally, not incidentally.

---

## 2) Current-State Deep Analysis

## 2.1 Current auth decision surfaces

1. **SSR route guards**
   - `/$locale/dashboard` `beforeLoad` calls `fetchProtectedRouteSession()`.
   - Auth routes (`login`, `register`, `forgot-password`) also call the same probe and redirect when authenticated.

2. **Client guards**
   - `useRequireAuth` performs redirect decisions from `useSessionQuery`.
   - `AuthLayout` performs an additional authenticated-session check and redirect.

3. **Session state stores**
   - React Query cache key `["auth","session"]`.
   - Zustand auth store as a mirrored state.

4. **Session transport**
   - Cookie (`av_session`) and/or bearer token, evaluated by API `auth.getSession`.
   - Server probe path and browser path can fail independently.

## 2.2 Why loops emerged

### A) Post-login race window

- Successful login updates local session cache.
- Immediate session invalidation/refetch can transiently return `user: null`.
- Client/page guard sees anonymous, redirects to login.
- Concurrent route guard or layout logic can push back to dashboard if it still sees authenticated state.

### B) Probe-failure semantic mismatch

- Server-side probe failures were interpreted as "unauthenticated" (historically).
- Redirects were executed based on transport failures, not actual session truth.
- Client checks could disagree and route back, causing oscillation.

### C) Multi-guard competition

- Redirect logic duplicated in route guards, hooks, and layout.
- Different layers run at different times with different data freshness.
- No single arbitration mechanism existed.

## 2.3 Structural weaknesses (not just bugs)

1. **No explicit `unknown` auth state model** for transient/unavailable checks.
2. **No single "redirect authority"** per route segment.
3. **Mirror-state architecture** (`auth store` + query cache) without strict ownership contracts.
4. **Inconsistent error classification** between API/network failure and authenticated/anonymous outcomes.
5. **Insufficient navigation-level regression tests** (race + failure-injection + SSR/client disagreement).

---

## 3) Target Architecture (End State)

## 3.1 Auth state machine (authoritative)

Introduce shared frontend domain model:

```ts
type AuthResolutionState =
  | { kind: "unknown"; reason: "initial" | "probe_failed" | "recovering" }
  | { kind: "anonymous" }
  | { kind: "authenticated_unverified"; user: SessionUser }
  | { kind: "authenticated_verified"; user: SessionUser };
```

Rules:

- `unknown` is non-terminal and **must not hard-redirect**.
- Redirects execute only from terminal states (`anonymous`, `authenticated_*`) after policy evaluation.
- `authenticated_unverified` is first-class, not derived ad hoc at each guard.

## 3.2 Single redirect authority

### Route-level policy engine

Create central policy module:

- `resolveRouteAccessDecision(routeKind, authState, redirectTarget, locale): Decision`

Where:

- `routeKind` ∈ `public_auth`, `protected`, `public_general`.
- `Decision` ∈ `allow | redirect(to) | defer`.

Only route `beforeLoad` uses this policy to decide redirects.

### Remove layout-level redirect ownership

- `AuthLayout` and other shell components must render-only.
- `useRequireAuth` becomes data exposure hook (or is limited to non-routing contexts), not a competing redirect source for routes already guarded in `beforeLoad`.

## 3.3 Session source-of-truth consolidation

Choose one authoritative runtime session source:

- **Primary**: React Query session cache.
- **Secondary**: auth store only for UI convenience, derived read-through mirror with no routing authority.

Contract:

- No immediate invalidation after successful login mutation.
- Session cache writes must be monotonic for a navigation tick (avoid authenticated -> anonymous flips without explicit logout/expiry event).

## 3.4 Failure handling model

- API/probe transport failures map to `unknown` with metadata.
- `unknown` on protected routes:
  - show deterministic loading/recovery UI,
  - trigger bounded retry/backoff,
  - only redirect to login after confirmed `anonymous`.
- Instrument and expose a timeout escape hatch (e.g., "Retry session check" CTA).

## 3.5 Tenant-aware consistency

To comply with tenant SSOT:

- Session probing remains tenant-neutral for `auth.getSession` where required.
- Any tenant mismatch errors are explicit and mapped to non-looping UX states.
- Header/body/JWT mismatch must never trigger alternating redirects; it should land in stable error/recovery route.

---

## 4) Redesign Workstreams

## Workstream A — Auth policy kernel

Deliverables:

1. New module: `src/lib/auth/auth-access-policy.ts`.
2. Canonical route kinds and policy decisions.
3. Unit tests with full state x route matrix.

Acceptance criteria:

- Every auth/protected route delegates redirect decision to this kernel.
- No direct handcrafted `if (authenticated)` redirect logic remains in route files.

## Workstream B — Session state machine + adapter

Deliverables:

1. `resolveAuthResolutionState(sessionResult, error): AuthResolutionState`.
2. Shared adapter used by SSR probe and client session query.
3. Explicit classification of probe errors into `unknown` reasons.

Acceptance criteria:

- SSR and client produce the same semantic state model.
- Probe failure no longer implicitly equals anonymous.

## Workstream C — Guard ownership simplification

Deliverables:

1. Remove redirect behavior from `AuthLayout`.
2. Refactor `useRequireAuth`:
   - either route-unaware read hook,
   - or delegated decision via policy kernel with clear ownership boundaries.
3. Route files own redirects; pages/components do not.

Acceptance criteria:

- Exactly one redirect decision source per navigation.
- No multiple `router.push` / `router.replace` races from separate layers.

## Workstream D — Mutation/session cache contract hardening

Deliverables:

1. Post-login session handling contract doc + code safeguards.
2. Utilities for atomic session update transitions.
3. Remove anti-patterns: immediate invalidate/refetch on success path.

Acceptance criteria:

- Login transition cannot produce transient anonymous state unless backend explicitly rejects session.
- Cache transitions covered by tests.

## Workstream E — Observability + incident diagnostics

Deliverables:

1. Structured event schema for auth navigation:
   - `auth.guard.decision`
   - `auth.state.transition`
   - `auth.redirect.executed`
   - `auth.redirect.suppressed_unknown_state`
2. Loop detector metric:
   - same user/session hits alternating auth/protected redirects N times in T seconds.
3. Dashboards + alert thresholds.

Acceptance criteria:

- Future loops are detected within minutes.
- Every redirect can be traced to decision input state.

## Workstream F — Test strategy redesign

Deliverables:

1. Pure policy matrix tests.
2. Route contract tests (SSR probe success/failure/timeout).
3. Client race tests (mutation success + delayed session response).
4. Playwright flow tests:
   - login -> dashboard no bounce,
   - expired session -> login once,
   - probe failure -> stable loading then recover.

Acceptance criteria:

- Redirect-loop regression tests mandatory in CI.
- Failure-injection test suite must pass before release.

---

## 5) Phased Implementation Plan

## Phase 0 — Baseline and freeze (1 day)

- Record current guard decision points and event timeline.
- Add temporary debug instrumentation to quantify duplicate redirects.
- Freeze auth route behavior changes outside this plan.

Exit gate:

- Baseline report captured with reproducible traces.

## Phase 1 — Policy kernel and state model (2-3 days)

- Implement `AuthResolutionState`.
- Implement access policy kernel.
- Add exhaustive unit matrix tests.

Exit gate:

- Policy tests pass with 100% branch coverage for decision logic.

## Phase 2 — Route integration (2-3 days)

- Migrate auth/protected route `beforeLoad` to policy kernel.
- Remove bespoke redirect branches.
- Keep backward-compatible behavior for success paths.

Exit gate:

- Existing route contract tests pass.
- New `unknown` behavior tests pass.

## Phase 3 — Guard de-duplication (2 days)

- Strip redirect effects from `AuthLayout`.
- Constrain or retire `useRequireAuth` redirect side effects in route-owned pages.

Exit gate:

- No duplicate redirect invocations in instrumentation logs.

## Phase 4 — Cache contract hardening (1-2 days)

- Enforce post-login transition invariants.
- Add helper for atomic session state updates.

Exit gate:

- Race simulation tests pass consistently.

## Phase 5 — Observability and loop alerts (1-2 days)

- Add metrics/log events and alerting thresholds.
- Add operational runbook entry for auth loop incidents.

Exit gate:

- Synthetic loop test triggers alert as expected.

## Phase 6 — Rollout and cleanup (1 day)

- Feature-flag rollout (internal -> staging -> production).
- Remove temporary debug instrumentation.
- Final docs + changelog updates.

Exit gate:

- No loop indicators over agreed observation window.

---

## 6) Key Invariants (Must Always Hold)

1. **No redirect from `unknown` auth state.**
2. **Only one layer owns redirect decisions per route transition.**
3. **Auth mutations cannot force immediate contradictory session fetches.**
4. **Probe/network failure != anonymous.**
5. **Tenant mismatch/missing errors resolve to stable recovery states, not redirect oscillation.**
6. **Every redirect decision is observable and attributable.**

---

## 7) Required Code Changes (Concrete Targets)

Frontend likely targets:

- `apps/frontend/src/lib/auth/protected-route-session.ts`
  - Return normalized state payload (or state adapter input), not booleans only.
- `apps/frontend/src/lib/auth/` (new)
  - `auth-resolution-state.ts`
  - `auth-access-policy.ts`
- `apps/frontend/src/routes/$locale/dashboard.tsx`
- `apps/frontend/src/routes/$locale/auth/login.tsx`
- `apps/frontend/src/routes/$locale/auth/register.tsx`
- `apps/frontend/src/routes/$locale/auth/forgot-password.tsx`
  - Migrate to central policy.
- `apps/frontend/src/components/auth/AuthLayout.tsx`
  - Remove redirect side-effect ownership.
- `apps/frontend/src/hooks/useRequireAuth.ts`
  - Re-scope to non-competing behavior or policy-backed usage.
- `apps/frontend/src/hooks/useLoginMutation.ts`
  - Preserve atomic post-login session transition contract.

Testing:

- `apps/frontend/src/routes/$locale/auth/-auth-route-contracts.test.ts`
- `apps/frontend/src/hooks/useRequireAuth.test.tsx`
- New tests for policy and state adapters under `apps/frontend/src/lib/auth/`.

---

## 8) Compatibility and Migration Notes

- Keep URL contracts unchanged (`redirect` query behavior, locale-prefixed routes).
- Preserve safe redirect sanitization rules (`/auth/*` blocked as redirect targets).
- Maintain existing i18n UX behavior and auth page SEO behavior.
- Ensure no breaking changes to API `auth.getSession` response shape during frontend migration.

---

## 9) Risks and Mitigations

1. **Risk:** behavior drift on edge auth routes.
   - **Mitigation:** route contract matrix tests before/after migration.

2. **Risk:** temporary regressions from removing `AuthLayout` redirect logic.
   - **Mitigation:** feature-flag new guard ownership and run A/B in staging.

3. **Risk:** hidden dependency on auth store side effects.
   - **Mitigation:** explicit audit and telemetry for store-driven redirects.

4. **Risk:** increased complexity in policy kernel.
   - **Mitigation:** strict pure-function design and exhaustive test vectors.

---

## 10) Validation Checklist (Release Gate)

- [ ] `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false`
- [ ] Unit tests for policy/state modules pass.
- [ ] Route contract tests include probe-failure and race scenarios.
- [ ] Playwright auth flows pass for `en` and at least one RTL locale (`ar`).
- [ ] No duplicate redirect events in instrumentation during soak.
- [ ] Loop detector metrics remain below threshold for defined period.

---

## 11) Ownership and Timeline Suggestion

- **Frontend platform owner:** Workstreams A-D, F.
- **API/platform owner:** tenant/session error semantics alignment, transport classification support.
- **Observability owner:** Workstream E dashboards + alerts.
- **QA owner:** end-to-end and failure-injection scenarios.

Suggested execution: 2 engineering weeks (parallelized streams) with staged rollout.

---

## 12) Definition of Done

This redesign is complete when:

1. Redirect decisions are centralized and deterministic.
2. Probe failures no longer trigger auth redirects.
3. No route/page/layout redirect competition remains.
4. CI contains robust loop-regression coverage.
5. Production telemetry confirms no redirect oscillation under normal and degraded network conditions.
