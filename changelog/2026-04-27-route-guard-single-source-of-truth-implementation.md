# Changelog: Route guards single source of truth implementation

**Date:** 2026-04-27  
**Scope:** Execution of `docs/architecture/reviews/2026-04-27-route-guard-single-source-of-truth-implementation-plan.md` to establish a single source of truth for guarded-route wiring and decision ownership across frontend auth/protected routes. Delivers shared route-guard factories, shared redirect-target helpers, route migration to canonical factories, guard diagnostics, contract enforcement tests, and route-guard governance documentation under `docs/architecture/ui/04-pages/`.

**Verification run:** `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false`, `pnpm --filter @agenticverdict/frontend exec vitest run "src/lib/auth/route-guards/redirect-target.test.ts" "src/lib/auth/route-guards/before-load-factories.test.ts" "src/lib/auth/route-guards/route-guard-diagnostics.test.ts"`, `pnpm --filter @agenticverdict/frontend exec vitest run 'src/routes/$locale/auth/-auth-route-contracts.test.ts'`

---

## Summary

### Route-guard implementation

- Added a dedicated shared route-guard module at `apps/frontend/src/lib/auth/route-guards/` so guarded routes no longer duplicate `beforeLoad` logic.
- Implemented `createProtectedBeforeLoad()` and `createPublicAuthBeforeLoad()` as canonical guard factories; both preserve SPA bypass behavior, call `fetchProtectedRouteSession()` for SSR guard decisions, delegate outcome selection to `resolveRouteAccessDecision(...)`, and map redirect outcomes via `throw redirect({ href })`.
- Extracted redirect target normalization into shared helpers:
  - `buildProtectedRedirectTarget(location)` for locale-stripped protected return targets.
  - `resolvePublicAuthRedirectTarget(search.redirect)` (internally using `sanitizeAuthRedirectTarget`) for auth-page redirect safety and loop prevention.
- Added non-sensitive route guard diagnostics (`routeKind`, `authState.kind`, `decision.type`) through `createRouteGuardDiagnosticsLogger()` in `route-guard-diagnostics.ts`.

### Route migration

- Migrated all targeted guarded routes to shared factory usage:
  - `apps/frontend/src/routes/$locale/dashboard.tsx`
  - `apps/frontend/src/routes/$locale/onboarding.tsx`
  - `apps/frontend/src/routes/$locale/auth/login.tsx`
  - `apps/frontend/src/routes/$locale/auth/register.tsx`
  - `apps/frontend/src/routes/$locale/auth/forgot-password.tsx`
- Preserved `validateSearch`, SEO `head`, and lazy component wiring while removing duplicated inline guard wiring from route files.

### Contract enforcement and regression coverage

- Added helper/factory unit suites:
  - `apps/frontend/src/lib/auth/route-guards/redirect-target.test.ts`
  - `apps/frontend/src/lib/auth/route-guards/before-load-factories.test.ts`
  - `apps/frontend/src/lib/auth/route-guards/route-guard-diagnostics.test.ts`
- Extended route contracts in `apps/frontend/src/routes/$locale/auth/-auth-route-contracts.test.ts` to enforce that guarded routes use shared factory-owned `beforeLoad` handlers via `__routeGuardFactoryKind`.
- Added explicit regression checks for:
  - malformed/external redirect targets,
  - auth-loop redirect targets (for example `/auth/login`),
  - unknown-state `defer` behavior immutability.

### Governance documentation

- Published Route Guards SSOT document:
  - `docs/architecture/ui/04-pages/route-guards-single-source-of-truth.md`
- Updated plan and review governance links to point to this SSOT as the authoritative source:
  - `docs/architecture/reviews/2026-04-27-route-guard-single-source-of-truth-implementation-plan.md`
  - `docs/architecture/reviews/2026-04-27-foundation-auth-review/README.md`
  - `docs/architecture/reviews/2026-04-27-foundation-auth-review/02-standards-and-best-practices-research.md`
  - `docs/architecture/reviews/2026-04-27-foundation-auth-review/03-remediation-plan.md`
- `CLAUDE.md` already included the Route Guards SSOT reference under Architecture Documentation; no duplicate insertion was required.

---

## Added

### `apps/frontend/src/lib/auth/route-guards`

- `guard-types.ts` — shared route-guard types (`GuardLocation`, diagnostics context/logger types, and factory marker type for contract assertions).
- `redirect-target.ts` — canonical protected/public-auth redirect target helpers.
- `create-protected-before-load.ts` — shared protected `beforeLoad` factory.
- `create-public-auth-before-load.ts` — shared public-auth `beforeLoad` factory.
- `route-guard-diagnostics.ts` — non-sensitive decision diagnostics logger.
- `index.ts` — canonical exports for route guard APIs and types.
- `redirect-target.test.ts` — helper behavior coverage (locale stripping + redirect sanitization expectations).
- `before-load-factories.test.ts` — factory behavior mapping coverage (`allow` / `defer` / `redirect`) and redirect safety expectations.
- `route-guard-diagnostics.test.ts` — diagnostics payload safety coverage.

### `docs/architecture/ui/04-pages`

- `route-guards-single-source-of-truth.md` — canonical governance document for route kinds, decision matrix, redirect safety, ownership boundaries, SSR/SPA contract, required APIs, and testing/rollout expectations.

---

## Changed

### Guarded route files

- `apps/frontend/src/routes/$locale/dashboard.tsx` — replaced inline protected `beforeLoad` logic with `createProtectedBeforeLoad()`.
- `apps/frontend/src/routes/$locale/onboarding.tsx` — replaced inline protected `beforeLoad` logic with `createProtectedBeforeLoad()`.
- `apps/frontend/src/routes/$locale/auth/login.tsx` — replaced inline public-auth `beforeLoad` logic with `createPublicAuthBeforeLoad()`.
- `apps/frontend/src/routes/$locale/auth/register.tsx` — replaced inline public-auth `beforeLoad` logic with `createPublicAuthBeforeLoad()`.
- `apps/frontend/src/routes/$locale/auth/forgot-password.tsx` — replaced inline public-auth `beforeLoad` logic with `createPublicAuthBeforeLoad()`.

### Route contract enforcement

- `apps/frontend/src/routes/$locale/auth/-auth-route-contracts.test.ts` — added factory ownership assertions for all guarded routes and retained existing redirect/defer behavior contracts.

### Plan/review governance alignment

- `docs/architecture/reviews/2026-04-27-route-guard-single-source-of-truth-implementation-plan.md` — added explicit governance section that declares the Route Guards SSOT as the primary architecture source.
- `docs/architecture/reviews/2026-04-27-foundation-auth-review/README.md` — added route-guard governance references.
- `docs/architecture/reviews/2026-04-27-foundation-auth-review/02-standards-and-best-practices-research.md` — added governance update linkage.
- `docs/architecture/reviews/2026-04-27-foundation-auth-review/03-remediation-plan.md` — tied P1 route-guard remediation to SSOT + implementation-plan sequencing.

---

## Plan mapping

| Plan phase                                      | Delivered                                                                                     |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Phase 1** Route Guard SSOT + governance links | SSOT doc published and linked from plan/review docs; existing `CLAUDE.md` reference preserved |
| **Phase 2** Shared redirect utilities           | `redirect-target.ts` + unit tests                                                             |
| **Phase 3** Shared `beforeLoad` factories       | `createProtectedBeforeLoad` / `createPublicAuthBeforeLoad` + tests                            |
| **Phase 4** Route migration                     | Dashboard, onboarding, login, register, forgot-password migrated                              |
| **Phase 5** Contract enforcement                | Route-contract suite now asserts shared-factory ownership                                     |
| **Phase 6** Operational hardening               | Non-sensitive diagnostics + loop-prevention and unknown-state defer regression coverage       |

---

## Verification evidence

- `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false`
  - Pass
- `pnpm --filter @agenticverdict/frontend exec vitest run "src/lib/auth/route-guards/redirect-target.test.ts" "src/lib/auth/route-guards/before-load-factories.test.ts" "src/lib/auth/route-guards/route-guard-diagnostics.test.ts"`
  - Pass
- `pnpm --filter @agenticverdict/frontend exec vitest run 'src/routes/$locale/auth/-auth-route-contracts.test.ts'`
  - Pass

---

## Follow-ups

- Add/refresh E2E route-guard checks to explicitly cover invalid redirect query fallback and locale parity (LTR + RTL) in browser-level navigation flows.
- If desired, route guard diagnostics can be wired into a centralized frontend telemetry sink; current implementation intentionally logs only non-sensitive debug fields.

---

## References

- `docs/architecture/reviews/2026-04-27-route-guard-single-source-of-truth-implementation-plan.md`
- `docs/architecture/ui/04-pages/route-guards-single-source-of-truth.md`
- `docs/architecture/ui/04-pages/auth-architecture-reference-2026-04-26.md`
