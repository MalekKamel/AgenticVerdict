# Changelog: Tenant logic consolidation — Phase 1 (shared resolver consolidation)

**Date:** 2026-04-25  
**Scope:** Execution of **Phase 1 - Shared Resolver Consolidation** from [`docs/architecture/tenant-logic-consolidation-implementation-plan-2026-04-25.md`](../docs/architecture/tenant-logic-consolidation-implementation-plan-2026-04-25.md). This phase consolidates duplicated tenant parsing/validation/source-precedence logic into shared primitives, refactors API pre-session resolver wiring to those primitives, and aligns frontend tenant utility resolution through one shared priority helper.

**Execution mode:** systematic, shared-primitive-first implementation with parallelized tracks:

- **Track A:** Core shared utility extraction for public tenant hint validation/resolution.
- **Track B:** API adapter refactor (`resolve-public-tenant-id`) to consume shared primitives.
- **Track C:** Frontend utility consolidation to remove duplicated tenant-priority branching.

---

## Summary

### Phase 1 outcomes delivered

- Added shared, transport-agnostic public tenant resolution primitives in `@agenticverdict/core`:
  - `isTenantUuid`
  - `parseOptionalTenantId`
  - `readOptionalTenantIdHeader`
  - `resolveRequiredTenantIdFromHints`
  - `assertOptionalTenantHintsMatchResolvedTenant`
- Refactored `apps/api` pre-session resolver adapter (`resolve-public-tenant-id`) to delegate parsing/mismatch/missing checks to shared core helpers while preserving tRPC error mapping semantics.
- Consolidated frontend tenant utility source-precedence logic behind one helper:
  - `resolveTenantIdByPriority`
  - consumed by both `tenant-resolution` and `trpc-tenant-bridge`.
- Added/updated focused tests across `core`, `api`, and `frontend` to verify behavior parity.
- Added a dedicated phase architecture execution artifact:
  - [`docs/architecture/tenant-logic-consolidation-phase-1-shared-resolver-consolidation-2026-04-25.md`](../docs/architecture/tenant-logic-consolidation-phase-1-shared-resolver-consolidation-2026-04-25.md)

### Why this matters

- Removes duplicated tenant UUID parsing and mismatch logic from API-local modules.
- Reduces drift risk between frontend header/body tenant propagation and API pre-session expectations.
- Establishes reusable Phase 1 baseline for Phase 2 context-propagation unification.

---

## Added

### `packages/core/src`

- **`public-tenant-resolution.ts`**
  - Added shared public tenant hint parsing and resolution primitives.
- **`public-tenant-resolution.test.ts`**
  - Added direct behavior coverage for UUID validation, header parsing, mismatch handling, and required/optional hint semantics.

### `apps/frontend/src/lib/tenant`

- **`resolve-tenant-id-by-priority.ts`**
  - Added shared frontend helper for deterministic tenant selection ordering.
- **`resolve-tenant-id-by-priority.test.ts`**
  - Added focused tests for candidate ordering and UUID filtering behavior.

### `docs/architecture`

- **`tenant-logic-consolidation-phase-1-shared-resolver-consolidation-2026-04-25.md`**
  - Added detailed implementation notes, compatibility guarantees, and Phase 1 exit-criteria evidence.

### `changelog`

- **`2026-04-25-tenant-logic-consolidation-phase-1-shared-resolver-consolidation.md`**
  - Added this comprehensive Phase 1 execution record.

---

## Changed

### `packages/core/src/index.ts`

- Re-exported shared public tenant helper aliases for API adapter usage:
  - `parseOptionalPublicTenantId`
  - `readOptionalPublicTenantIdHeader`
  - `resolveRequiredPublicTenantIdFromHints`
  - `assertOptionalPublicTenantHintsMatchResolvedTenant`

### `apps/api/src/trpc/resolve-public-tenant-id.ts`

- Removed local duplicated parser/UUID/header helpers.
- Refactored resolver and optional assertion flow to consume core shared primitives.
- Kept `TenantSecurityError` -> `TRPCError` mapping unchanged via existing translation helper.

### `apps/frontend/src/lib/tenant/tenant-resolution.ts`

- Refactored effective tenant resolution to use shared `resolveTenantIdByPriority`.
- Continued exporting `isTenantUuid` from shared tenant helper module.

### `apps/frontend/src/lib/tenant/trpc-tenant-bridge.ts`

- Replaced duplicated branch-based tenant source precedence logic with `resolveTenantIdByPriority`.
- Preserved source ordering:
  - auth store -> provider published -> env default -> dev fallback.

---

## Phase 1 plan mapping

| Phase 1 task from plan                                                                  | Delivered artifact/output                                                                                                                           |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Move duplicated parsing/validation/source-precedence logic into shared tenant utilities | Added `packages/core/src/public-tenant-resolution.ts`; frontend shared helper `resolve-tenant-id-by-priority.ts`; refactored API/frontend consumers |
| Refactor API pre-session resolver to call shared primitives                             | Updated `apps/api/src/trpc/resolve-public-tenant-id.ts` to delegate to core shared helpers                                                          |
| Refactor frontend utility modules to consume shared pure/isomorphic tenant helpers      | Updated `tenant-resolution.ts` + `trpc-tenant-bridge.ts` to consume `resolveTenantIdByPriority`                                                     |
| Exit criteria: no duplicate tenant parsing helpers in API/frontend outside adapters     | API local duplicate parser removed; frontend priority duplication removed                                                                           |
| Exit criteria: public auth mismatch/missing behavior unchanged and tested               | Existing `resolve-public-tenant-id.test.ts` retained and passing                                                                                    |

---

## Parallel track execution detail

### Track A — Shared utility extraction

- Implemented core transport-agnostic utility layer for public tenant hints.
- Added dedicated core tests to lock behavior before adapter-level usage.

### Track B — API adapter alignment

- Rewired pre-session resolver adapter to shared utility contracts.
- Preserved existing external behavior and tRPC formatter compatibility.

### Track C — Frontend priority consolidation

- Centralized tenant priority resolution into one helper consumed by both bridge and resolution modules.
- Reduced future drift risk when modifying tenant source ordering.

---

## Verification run

- `pnpm --filter @agenticverdict/core exec vitest run src/public-tenant-resolution.test.ts`
- `pnpm --filter @agenticverdict/api exec vitest run src/trpc/resolve-public-tenant-id.test.ts src/trpc/authed-procedure.baseline.test.ts`
- `pnpm --filter @agenticverdict/frontend exec vitest run src/lib/tenant/tenant-resolution.test.ts src/lib/tenant/trpc-tenant-bridge.test.ts src/lib/tenant/merge-pre-session-tenant-input.test.ts src/lib/tenant/resolve-tenant-id-by-priority.test.ts`

All targeted suites passed.

---

## Deferred / follow-ups

- Phase 2 remains to unify API middleware + tRPC + worker context creation paths under one shared propagation contract.
- Phase 3 remains to enforce/verify tenant DB isolation hardening and RLS checks in runtime/CI paths.

---

## References

- [`docs/architecture/tenant-logic-consolidation-implementation-plan-2026-04-25.md`](../docs/architecture/tenant-logic-consolidation-implementation-plan-2026-04-25.md)
- [`docs/architecture/tenant-logic-consolidation-phase-1-shared-resolver-consolidation-2026-04-25.md`](../docs/architecture/tenant-logic-consolidation-phase-1-shared-resolver-consolidation-2026-04-25.md)
- [`docs/architecture/tenant-logic-consolidation-phase-0-baseline-and-traceability-2026-04-25.md`](../docs/architecture/tenant-logic-consolidation-phase-0-baseline-and-traceability-2026-04-25.md)
- [`changelog/2026-04-17-web-tanstack-post-review-p1-p2-implementation.md`](2026-04-17-web-tanstack-post-review-p1-p2-implementation.md)
