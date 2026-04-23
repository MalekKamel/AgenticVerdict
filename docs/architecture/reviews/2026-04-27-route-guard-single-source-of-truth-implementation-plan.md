# Route Guard Single Source of Truth - Implementation Plan

Date: 2026-04-27  
Scope: `apps/frontend/src/routes` auth/protected routing guard behavior  
Primary objective: Centralize route-guard decisions and wiring so all guarded routes rely on one reusable pattern and one decision source of truth.

## Governance Source of Truth

Primary governance reference for route-guard architecture and behavior:

- `docs/architecture/ui/04-pages/route-guards-single-source-of-truth.md`

This implementation plan is execution guidance and must remain aligned with the route-guard SSOT above.

## 1) Current-State Analysis

### 1.1 Guarded route inventory

Current `beforeLoad` implementations exist in:

- `apps/frontend/src/routes/$locale/dashboard.tsx` (`protected`)
- `apps/frontend/src/routes/$locale/onboarding.tsx` (`protected`)
- `apps/frontend/src/routes/$locale/auth/login.tsx` (`public_auth`)
- `apps/frontend/src/routes/$locale/auth/register.tsx` (`public_auth`)
- `apps/frontend/src/routes/$locale/auth/forgot-password.tsx` (`public_auth`)
- `apps/frontend/src/routes/$locale/route.tsx` (locale normalization, non-auth)
- `apps/frontend/src/routes/index.tsx` (default locale redirect, non-auth)

### 1.2 Existing source-of-truth candidate already present

The decision kernel is already centralized in `apps/frontend/src/lib/auth/auth-access-policy.ts` via `resolveRouteAccessDecision({ routeKind, authState, locale, redirectTarget })`, which returns:

- `allow`
- `defer` (`unknown_state`)
- `redirect` (`to`)

This kernel currently defines route-kind and auth-state behavior consistently, including verify-email and login redirects.

### 1.3 Main architecture gap

Decision policy is centralized, but route wiring is not:

- Protected routes repeat the same SSR guard flow (`fetchProtectedRouteSession`, redirect target building, decision mapping, redirect throw).
- Public auth routes repeat the same flow with search redirect sanitization.

This duplication increases drift risk and weakens maintainability.

### 1.4 Risk and correctness findings

- **Duplication risk:** identical logic duplicated across multiple route files.
- **Manual wiring risk:** each route manually maps policy output to redirect behavior.
- **SPA/SSR split risk:** SPA bypass is intentional but easy to misuse if future routes skip client fallback enforcement.
- **Redirect-safety drift risk:** all routes must consistently sanitize `search.redirect` before policy evaluation.

## 2) Target Architecture

Implement a reusable route-guard module that becomes the only route-level guard entry point, while preserving `auth-access-policy.ts` as decision kernel.

### 2.1 Proposed modules

Create a new guard package under `apps/frontend/src/lib/auth/route-guards/`:

- `guard-types.ts`
  - shared input/output types and helpers
- `redirect-target.ts`
  - `buildProtectedRedirectTarget(location)`
  - `resolvePublicAuthRedirectTarget(searchRedirect)` (internally uses `sanitizeAuthRedirectTarget`)
- `create-protected-before-load.ts`
  - standard protected-route `beforeLoad` factory
- `create-public-auth-before-load.ts`
  - standard auth-route `beforeLoad` factory
- `index.ts`
  - exports canonical APIs for routes

### 2.2 Canonical APIs

- `createProtectedBeforeLoad()` for `protected` routes
- `createPublicAuthBeforeLoad()` for `public_auth` routes

Both factories must:

1. honor SPA bypass behavior exactly as current implementation,
2. call `fetchProtectedRouteSession()` for SSR guard decisions,
3. delegate all access decisions to `resolveRouteAccessDecision()`,
4. translate decisions into either return or `throw redirect({ href })`.

### 2.3 Guard ownership model

- `beforeLoad` remains the single redirect owner for route-level guard decisions.
- Page/layout components must stay redirect-side-effect free for these flows.
- Client hooks remain fallback/reconciliation only, not primary guard owner.

## 3) Implementation Plan (Step-by-Step)

### Phase 0 - Baseline and safety net

1. Confirm all existing route contract tests pass before refactor.
2. Add or expand tests for guard-decision behavior where coverage is weak.
3. Record baseline behavior matrix for:
   - anonymous -> protected
   - authenticated verified -> auth pages
   - authenticated unverified -> protected
   - unknown state -> defer

Deliverable: baseline test evidence for parity checks.

### Phase 1 - Create Route Guard SSOT document and governance links

1. Create and publish a dedicated SSOT document for route guards at:
   - `docs/architecture/ui/04-pages/route-guards-single-source-of-truth.md`
2. Document in that SSOT:
   - canonical route kinds and auth-state decision matrix,
   - redirect safety and loop-prevention rules,
   - guard ownership model (`beforeLoad` as redirect owner),
   - SPA vs SSR behavior contract,
   - required APIs (`resolveRouteAccessDecision`, shared guard factories),
   - testing and rollout expectations.
3. Link the new SSOT in `CLAUDE.md` under Architecture Documentation.
4. Update this implementation plan and any related review docs to reference the new SSOT as the primary route-guard governance source.

Deliverable: published route-guard SSOT document linked from `CLAUDE.md` and referenced by this plan and related review docs as the authoritative governance source.

### Phase 2 - Extract shared guard utilities

1. Add `redirect-target.ts` for protected/public-auth redirect target normalization.
2. Keep implementation behavior-preserving:
   - Protected target from route location path/search.
   - Public auth target from sanitized query redirect.
3. Add unit tests for both target helpers.

Deliverable: tested shared helper utilities.

### Phase 3 - Add reusable beforeLoad factories

1. Implement `createProtectedBeforeLoad()` using:
   - SPA bypass
   - SSR session fetch
   - protected redirect target helper
   - `resolveRouteAccessDecision({ routeKind: "protected", ... })`
2. Implement `createPublicAuthBeforeLoad()` using:
   - SPA bypass
   - SSR session fetch
   - sanitized auth redirect target helper
   - `resolveRouteAccessDecision({ routeKind: "public_auth", ... })`
3. Add focused tests for each factory.

Deliverable: reusable route guard factories with behavior parity.

### Phase 4 - Route migration (low-risk sequence)

Migrate in small batches:

1. `apps/frontend/src/routes/$locale/dashboard.tsx`
2. `apps/frontend/src/routes/$locale/onboarding.tsx`
3. `apps/frontend/src/routes/$locale/auth/login.tsx`
4. `apps/frontend/src/routes/$locale/auth/register.tsx`
5. `apps/frontend/src/routes/$locale/auth/forgot-password.tsx`

For each file:

- replace inline `beforeLoad` logic with factory call,
- preserve `validateSearch`, `head`, and component wiring,
- run targeted tests immediately.

Deliverable: all guarded routes switched to shared factory APIs.

### Phase 5 - Contract enforcement and drift prevention

1. Add a route-guard contract test suite that asserts all guarded routes use the shared factories.
2. Add lightweight lint/review rule guidance in docs for future guarded routes.
3. Update internal frontend architecture docs with the guard SSOT pattern.

Deliverable: enforceable single-source pattern for new routes.

### Phase 6 - Operational hardening

1. Add non-sensitive diagnostic logs/events for guard decisions (`routeKind`, `authState.kind`, `decision.type`).
2. Add explicit loop-prevention regression tests for malformed/external/auth-loop redirect targets.
3. Ensure unknown-state defer behavior remains immutable in tests.

Deliverable: robust regression and incident-prevention coverage.

## 4) Testing Strategy

### 4.1 Unit tests

- `auth-access-policy` truth table (all route kinds x auth states).
- Redirect target helpers.
- `sanitizeAuthRedirectTarget` loop and external target protection.
- Factory decision mapping (`allow`, `defer`, `redirect`) behavior.

### 4.2 Integration tests

- SSR `beforeLoad` + session probe + redirect output.
- SPA mode bypass path with client fallback expectations.
- Verify-email redirect parameter composition for unverified users.

### 4.3 E2E tests

- Anonymous -> protected -> login -> safe return.
- Authenticated -> auth/login/register/forgot-password -> dashboard (or safe redirect).
- Unverified -> protected -> verify-email path.
- Invalid redirect query -> fallback destination.
- Locale parity across at least one LTR and one RTL locale.

## 5) Risks and Mitigations

- **Behavior regression during migration**
  - Mitigation: route-by-route migration with immediate targeted test execution.
- **Redirect loop regressions**
  - Mitigation: preserve sanitizer and add dedicated loop tests.
- **Dual redirect owners reintroduced later**
  - Mitigation: contract tests + documented ownership rules.
- **SPA/SSR behavior drift**
  - Mitigation: explicit tests for both branches in factory suite.

## 6) Acceptance Criteria

1. All protected/auth routes use shared route guard factories.
2. `resolveRouteAccessDecision` remains the only decision kernel for guarded route outcomes.
3. Redirect sanitization is centralized and reused by guard factories.
4. Route-guard SSOT document exists at `docs/architecture/ui/04-pages/route-guards-single-source-of-truth.md` and is linked from `CLAUDE.md`.
5. Existing auth route contract tests pass, plus new factory/unit tests added.
6. No redirect loops observed in targeted E2E coverage.
7. Frontend typecheck and test gates pass for changed scope.

## 7) Definition of Done

- Code refactor completed for all identified guarded routes.
- Route-guard SSOT documentation published and linked from core architecture references.
- Guard SSOT utilities and factories implemented and documented.
- Test suites updated and passing (unit + integration + critical E2E for auth routing flows).
- No known regressions in locale-aware routing or auth entry/protected navigation.
