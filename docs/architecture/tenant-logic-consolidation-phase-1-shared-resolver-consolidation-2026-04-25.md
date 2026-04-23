# Tenant Logic Consolidation — Phase 1 Shared Resolver Consolidation

**Date:** 2026-04-25  
**Plan Source:** [`tenant-logic-consolidation-implementation-plan-2026-04-25.md`](./tenant-logic-consolidation-implementation-plan-2026-04-25.md)  
**Phase:** 1 (Shared resolver consolidation)

---

## Objective

Consolidate duplicated tenant parsing, UUID validation, and source-precedence logic into shared utilities, then refactor API pre-session auth tenant resolution and frontend tenant utilities to consume those shared helpers without changing established tenant mismatch/missing semantics.

---

## Implementation

### 1) Shared public-tenant resolver primitives in `@agenticverdict/core`

- Added transport-agnostic helpers in `packages/core/src/public-tenant-resolution.ts`:
  - `isTenantUuid`
  - `parseOptionalTenantId`
  - `readOptionalTenantIdHeader`
  - `resolveRequiredTenantIdFromHints`
  - `assertOptionalTenantHintsMatchResolvedTenant`
- Exported shared aliases from `packages/core/src/index.ts` for API adapter consumption:
  - `parseOptionalPublicTenantId`
  - `readOptionalPublicTenantIdHeader`
  - `resolveRequiredPublicTenantIdFromHints`
  - `assertOptionalPublicTenantHintsMatchResolvedTenant`

### 2) API pre-session resolver refactor

- Refactored `apps/api/src/trpc/resolve-public-tenant-id.ts` to remove local UUID/header parsing duplication and delegate to shared `@agenticverdict/core` primitives.
- Preserved tRPC error translation behavior through existing `trpcErrorFromTenantSecurity` mapping so error formatter semantics remain stable.

### 3) Frontend shared utility consolidation

- Added `apps/frontend/src/lib/tenant/resolve-tenant-id-by-priority.ts` with:
  - `isTenantUuid`
  - `resolveTenantIdByPriority`
- Updated `apps/frontend/src/lib/tenant/tenant-resolution.ts` to consume `resolveTenantIdByPriority`.
- Updated `apps/frontend/src/lib/tenant/trpc-tenant-bridge.ts` to consume the same shared priority function, removing duplicated branching logic between bridge and resolution modules.

---

## Behavior compatibility guarantees

- Public auth/pre-session mismatch behavior remains unchanged:
  - body/header mismatch -> `TENANT_MISMATCH`
  - no usable tenant hint -> `TENANT_CONTEXT_REQUIRED`
- Optional tenant hint checks for token-based reset flows remain unchanged:
  - mismatched hints or hint-to-account mismatch -> `TENANT_MISMATCH`
- Frontend priority ordering is preserved:
  - auth store tenant -> provider-published tenant -> env default -> dev fallback.

---

## Verification evidence

- Core shared utility tests:
  - `pnpm --filter @agenticverdict/core exec vitest run src/public-tenant-resolution.test.ts`
- API resolver contract tests:
  - `pnpm --filter @agenticverdict/api exec vitest run src/trpc/resolve-public-tenant-id.test.ts src/trpc/authed-procedure.baseline.test.ts`
- Frontend tenant utility tests:
  - `pnpm --filter @agenticverdict/frontend exec vitest run src/lib/tenant/tenant-resolution.test.ts src/lib/tenant/trpc-tenant-bridge.test.ts src/lib/tenant/merge-pre-session-tenant-input.test.ts src/lib/tenant/resolve-tenant-id-by-priority.test.ts`

---

## Exit criteria status (Phase 1)

| Exit criterion                                                                     | Status   | Evidence                                                                                                         |
| ---------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| Duplicate tenant parsing/validation logic moved to shared utilities                | Complete | `packages/core/src/public-tenant-resolution.ts`; API/frontend refactors listed above                             |
| API pre-session resolver consumes shared primitives                                | Complete | `apps/api/src/trpc/resolve-public-tenant-id.ts`                                                                  |
| Frontend utility modules consume shared pure helper for tenant priority resolution | Complete | `apps/frontend/src/lib/tenant/resolve-tenant-id-by-priority.ts`, `tenant-resolution.ts`, `trpc-tenant-bridge.ts` |
| Public auth mismatch and missing-tenant behavior unchanged and tested              | Complete | `apps/api/src/trpc/resolve-public-tenant-id.test.ts`                                                             |
