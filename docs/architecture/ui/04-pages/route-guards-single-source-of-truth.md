# Route Guards Single Source of Truth (SSOT)

Date: 2026-04-27  
Status: Active governance reference  
Scope: Frontend route-level access control for guarded routes under `apps/frontend/src/routes`

## 1) Purpose and ownership

This document is the canonical governance source for route-guard behavior in the frontend. It defines:

- canonical route kinds and their auth-state decision matrix,
- redirect safety and loop-prevention rules,
- guard ownership boundaries (`beforeLoad` is the redirect owner),
- SPA vs SSR execution contract,
- required shared APIs and factory usage,
- testing and rollout expectations.

Any implementation change to guarded route behavior must align with this SSOT.

## 2) Canonical route kinds

All guarded frontend routes must map to one of the following route kinds:

- `protected`
  - Authenticated access required.
  - Anonymous users must be redirected to login.
  - Unverified authenticated users must be redirected to verify-email flow.
- `public_auth`
  - Routes intended for unauthenticated users (for example login/register/forgot-password).
  - Authenticated users must be redirected away to safe post-auth destination.

No ad-hoc route-kind variants are allowed without updating this SSOT and the policy kernel.

## 3) Canonical auth states

Route decisions are made against normalized auth states:

- `anonymous`
- `authenticated_verified`
- `authenticated_unverified`
- `unknown`

State normalization must happen in auth/session infrastructure. Route guards consume normalized state and do not infer custom state semantics.

## 4) Decision matrix (route kind x auth state)

The matrix below defines canonical outcomes. The source implementation is `resolveRouteAccessDecision`.

| Route Kind    | Auth State                 | Decision   | Redirect Target                                                    |
| ------------- | -------------------------- | ---------- | ------------------------------------------------------------------ |
| `protected`   | `anonymous`                | `redirect` | login route with safe redirect target                              |
| `protected`   | `authenticated_verified`   | `allow`    | N/A                                                                |
| `protected`   | `authenticated_unverified` | `redirect` | verify-email route                                                 |
| `protected`   | `unknown`                  | `defer`    | N/A                                                                |
| `public_auth` | `anonymous`                | `allow`    | N/A                                                                |
| `public_auth` | `authenticated_verified`   | `redirect` | safe post-auth destination (redirect target or dashboard fallback) |
| `public_auth` | `authenticated_unverified` | `redirect` | verify-email route                                                 |
| `public_auth` | `unknown`                  | `defer`    | N/A                                                                |

Non-matrix outcomes are considered behavioral drift and must be treated as regressions.

## 5) Redirect safety and loop prevention

All redirect targets must be treated as untrusted input and validated before decision evaluation.

### 5.1 Allowed redirect target policy

- Allow only internal, relative application paths.
- Reject absolute URLs and protocol-relative URLs.
- Reject malformed paths and unsafe schemes.
- Normalize empty/invalid targets to safe defaults.

### 5.2 Loop-prevention policy

Guards must prevent redirect loops by rejecting self-referential and auth-cycle targets, including:

- login/register/forgot-password redirecting back to auth entry routes in a cycle,
- verify-email redirect loops,
- nested redirect targets that resolve to already-guarded auth entry points in invalid state.

### 5.3 Required sanitizer usage

- Public-auth redirect query values must be sanitized through shared redirect sanitization utilities.
- Protected-route return targets must be built from route location using canonical helper functions.
- No route file may implement custom redirect sanitization logic inline.

## 6) Guard ownership model

`beforeLoad` is the sole owner of route-level redirect decisions.

### 6.1 Ownership rules

- Route `beforeLoad` performs guard decision evaluation and redirect throws.
- Page/layout components must not perform equivalent primary redirect logic for guarded route access.
- Client hooks can provide UX reconciliation/fallback only (for example rendering adjustments after hydration), not ownership of canonical route-access decisions.

### 6.2 Rationale

Single-owner redirect semantics prevent inconsistent behavior across SSR and SPA transitions, minimize flicker, and reduce policy drift.

## 7) SPA vs SSR contract

Guards must follow a consistent dual-mode contract:

- SSR-capable branch:
  - Resolve session/auth state through server-capable session probe (`fetchProtectedRouteSession`).
  - Execute `resolveRouteAccessDecision`.
  - Translate redirect outcomes into route redirects in `beforeLoad`.
- SPA bypass branch:
  - Preserve the established SPA bypass behavior where configured.
  - Do not introduce alternate decision logic in SPA mode.
  - Maintain parity expectations via client fallback mechanisms and tests.

Behavior differences between SSR and SPA branches are allowed only where explicitly documented and tested as expected contract.

## 8) Required APIs and usage model

## 8.1 Policy kernel (required)

- `resolveRouteAccessDecision(...)` is the canonical decision kernel.
- All guarded route outcomes must flow through this API.
- Route files and factories must not duplicate decision matrix logic inline.

## 8.2 Shared guard factories (required)

Guard wiring must use shared factories:

- `createProtectedBeforeLoad()`
- `createPublicAuthBeforeLoad()`

These factories must:

- preserve existing SPA bypass semantics,
- fetch session state for SSR decisions,
- construct/sanitize redirect targets via shared helpers,
- call `resolveRouteAccessDecision`,
- map decision outcomes to `allow`, `defer`, or `throw redirect({ href })`.

Direct custom `beforeLoad` implementations for guarded routes require explicit architectural exception and documented rationale.

## 9) Testing expectations

Testing must enforce both decision correctness and guard wiring consistency.

### 9.1 Unit coverage

- Full decision truth table for route kinds x auth states.
- Redirect target helper behavior (protected target builder + public auth redirect sanitizer).
- Loop-prevention and external target rejection paths.
- Factory decision mapping behavior (`allow`, `defer`, `redirect`).

### 9.2 Integration coverage

- SSR `beforeLoad` execution with session probe and redirect result assertions.
- SPA bypass branch behavior with expected fallback semantics.
- Verify-email redirect composition for unverified users.

### 9.3 E2E coverage

- Anonymous -> protected -> login -> safe post-login return.
- Authenticated users blocked from auth entry routes by redirect.
- Unverified user redirect to verify-email.
- Invalid/malicious redirect target fallback behavior.
- Locale parity checks for at least one LTR and one RTL locale.

### 9.4 Contract and drift prevention

- Contract tests must assert guarded routes consume shared factory APIs.
- New guarded routes must not introduce inline decision matrix logic.

## 10) Rollout and change management expectations

Route-guard changes should ship with low-risk sequencing:

1. Establish baseline tests and decision matrix parity checks.
2. Implement/update shared guard utilities/factories.
3. Migrate routes incrementally with targeted tests after each route.
4. Enforce contract tests and document governance links.
5. Monitor and regression-test redirect loops post-rollout.

## 11) Governance references

- Implementation plan: `docs/architecture/reviews/2026-04-27-route-guard-single-source-of-truth-implementation-plan.md`
- Auth architecture reference: `docs/architecture/ui/04-pages/auth-architecture-reference-2026-04-26.md`
- Repository architecture index: `CLAUDE.md` (Architecture Documentation section)
