# Tenant Logic Consolidation — Phase 2 Context Propagation Unification

**Date:** 2026-04-25  
**Plan Source:** [`tenant-logic-consolidation-implementation-plan-2026-04-25.md`](./tenant-logic-consolidation-implementation-plan-2026-04-25.md)  
**Phase:** 2 (Context propagation unification)

---

## Objective

Unify API and worker tenant context propagation on one shared contract so all async paths use the same context constructor and ALS primitives.

---

## Implementation

### 1) Shared canonical tenant context constructor

- Added `createTenantContext` in `packages/core/src/tenant-context.ts` as the canonical constructor for API/tRPC/worker paths.
- Kept `buildTenantContextForJob` as a compatibility wrapper that delegates to `createTenantContext`.
- Exported `createTenantContext` from `packages/core/src/index.ts`.

### 2) API context path alignment

- `packages/core/src/tenant-request-context.ts` now uses `createTenantContext` when building resolved HTTP tenant contexts.
- `apps/api/src/middleware/jwt-tenant-context.ts` continues to resolve tenant context via shared `resolveTenantContextFromHttp` and attach it to `request.tenantContext`.
- `apps/api/src/middleware/tenant-route-als.ts` and `apps/api/src/trpc/register-fastify.ts` continue running request/tRPC paths inside shared core ALS contracts.
- `apps/api/src/trpc/context.ts` continues to publish `tenant` from `request.tenantContext` into tRPC context.

### 3) Worker context path alignment

- `apps/worker/src/tenant/worker-tenant-als.ts` now uses `createTenantContext` + `runWithTenantContext` directly, removing constructor-path drift with API.

---

## Behavior compatibility guarantees

- API authenticated/tRPC propagation semantics are unchanged: tenant context is still required and mismatch is still rejected.
- Worker jobs continue to expose `getTenantContext()` during work execution and clear ALS after completion.
- Context shape (`tenantId`, `config`, `requestId`, optional `userId`) remains stable across API and worker adapters.

---

## Verification evidence

- `pnpm --filter @agenticverdict/core exec vitest run src/tenant-context.test.ts src/tenant-isolation.test.ts`
- `pnpm --filter @agenticverdict/api exec vitest run src/middleware/jwt-tenant-context.test.ts src/trpc/authed-procedure.baseline.test.ts`
- `pnpm --filter @agenticverdict/worker exec vitest run src/tenant/worker-tenant-als.test.ts`

---

## Exit criteria status (Phase 2)

| Exit criterion                                                                            | Status   | Evidence                                                                                                                       |
| ----------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| API middleware + tRPC tenant context construction standardized through shared entrypoints | Complete | `packages/core/src/tenant-request-context.ts`, `apps/api/src/middleware/jwt-tenant-context.ts`, `apps/api/src/trpc/context.ts` |
| Worker context creation aligned to one helper path                                        | Complete | `apps/worker/src/tenant/worker-tenant-als.ts`, `packages/core/src/tenant-context.ts`                                           |
| Redundant context-building branches removed where overlap existed                         | Complete | Shared context constructor `createTenantContext` used by API and worker paths                                                  |
| Concurrency/ALS isolation behavior remains verified                                       | Complete | `src/tenant-context.test.ts` (core), `src/worker-tenant-als.test.ts` (worker)                                                  |
