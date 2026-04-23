# Changelog: Tenant logic consolidation — Phase 2 (context propagation) + Phase 3 (database isolation hardening)

**Date:** 2026-04-25  
**Scope:** Execution of **Phase 2 - Context Propagation Unification** and **Phase 3 - Database Isolation Hardening** from [`docs/architecture/tenant-logic-consolidation-implementation-plan-2026-04-25.md`](../docs/architecture/tenant-logic-consolidation-implementation-plan-2026-04-25.md), building on:

- [`changelog/2026-04-25-tenant-logic-consolidation-phase-0-baseline-freeze-and-traceability.md`](2026-04-25-tenant-logic-consolidation-phase-0-baseline-freeze-and-traceability.md)
- [`changelog/2026-04-25-tenant-logic-consolidation-phase-1-shared-resolver-consolidation.md`](2026-04-25-tenant-logic-consolidation-phase-1-shared-resolver-consolidation.md)

**Execution mode:** systematic, shared-contract-first implementation with parallel tracks:

- **Track A (Phase 2):** API + worker context propagation contract unification.
- **Track B (Phase 3):** DB tenant session-binding startup hardening.
- **Track C (Cross-cutting):** targeted test/typecheck verification and evidence locking.

---

## Summary

### Phase 2 outcomes

- Introduced a canonical shared tenant context constructor in `@agenticverdict/core`:
  - `createTenantContext` (`packages/core/src/tenant-context.ts`)
- Refactored shared HTTP tenant context resolution to construct context through the same canonical constructor:
  - `packages/core/src/tenant-request-context.ts`
- Aligned worker ALS entrypoint to use the same constructor path:
  - `apps/worker/src/tenant/worker-tenant-als.ts`
- Preserved API middleware/tRPC propagation semantics while consolidating context shape ownership in core:
  - `apps/api/src/middleware/jwt-tenant-context.ts`
  - `apps/api/src/middleware/tenant-route-als.ts`
  - `apps/api/src/trpc/register-fastify.ts`
  - `apps/api/src/trpc/context.ts`

### Phase 3 outcomes

- Added DB session-binding verification helper to validate tenant scoping assumptions used by `dbScoped` + RLS:
  - `verifyTenantRlsSessionBinding` (`packages/database/src/tenant-rls-guard.ts`)
- Added API startup guard that runs tenant session-binding verification in database-backed mode:
  - `apps/api/src/startup/tenant-rls-startup-check.ts`
  - wired in `apps/api/src/server.ts`
- Kept tenant-owned tRPC database paths constrained to `dbScoped` contracts:
  - `apps/api/src/trpc/routers/auth.ts`
  - `apps/api/src/trpc/routers/admin.ts`

### Why this matters

- Eliminates context-construction drift between API and worker paths.
- Converts DB tenant isolation assumptions into explicit startup/runtime verification.
- Strengthens tenant safety posture without changing Phase 0/1 public and authenticated behavior contracts.

---

## Added

### `packages/database`

- **`src/tenant-rls-guard.ts`**
  - Added `verifyTenantRlsSessionBinding(db, probeTenantId?)`:
    - sets `app.current_tenant_id` in transaction scope,
    - reads `current_setting('app.current_tenant_id', true)`,
    - throws on mismatch.
- **`test/tenant-rls-guard.unit.test.ts`**
  - Added pass/fail coverage for tenant session-binding verification.

### `apps/api/src/startup`

- **`tenant-rls-startup-check.ts`**
  - Added API startup RLS/session-binding check with env gating:
    - skip when no `DATABASE_URL`,
    - skip when `TENANT_RLS_STARTUP_CHECK=false`,
    - enforce check otherwise.
- **`tenant-rls-startup-check.test.ts`**
  - Added tests for skip and verify pathways.

### `docs/architecture`

- **`tenant-logic-consolidation-phase-2-context-propagation-unification-2026-04-25.md`**
- **`tenant-logic-consolidation-phase-3-database-isolation-hardening-2026-04-25.md`**

---

## Changed

### `packages/core`

- **`src/tenant-context.ts`**
  - Added `createTenantContext` as canonical constructor.
  - Updated `buildTenantContextForJob` to delegate to canonical constructor.
- **`src/tenant-request-context.ts`**
  - Context construction now delegates to `createTenantContext`.
- **`src/index.ts`**
  - Exported `createTenantContext`.

### `apps/worker`

- **`src/tenant/worker-tenant-als.ts`**
  - Switched worker context construction from custom path to shared `createTenantContext`.

### `packages/database`

- **`src/index.ts`**
  - Exported `verifyTenantRlsSessionBinding`.

### `apps/api`

- **`src/server.ts`**
  - Runs `runTenantRlsStartupCheck()` at startup prior to route registration.

---

## Phase mapping

| Plan task                                                                                      | Delivered                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase 2:** Standardize API middleware + tRPC context construction through shared entrypoints | Shared canonical constructor (`createTenantContext`) used by HTTP resolution and worker path; API adapters continue to consume shared core tenant context |
| **Phase 2:** Align worker job context creation through one helper path                         | `runWorkerJobWithTenantContext` now builds context through `createTenantContext`                                                                          |
| **Phase 2:** Remove redundant context-building branches                                        | worker/API context constructor divergence removed                                                                                                         |
| **Phase 3:** Verify/harden tenant session and isolation assumptions                            | `verifyTenantRlsSessionBinding` + startup guard wired into API boot                                                                                       |
| **Phase 3:** Ensure tenant-owned DB reads/writes remain tenant-scoped                          | Auth/admin tRPC DB operations continue through `dbScoped` boundary                                                                                        |
| **Phase 3:** Add startup/integration checks for tenant session variable effectiveness          | API startup check + unit tests for guard behavior                                                                                                         |

---

## Verification run

- `pnpm --filter @agenticverdict/core exec vitest run src/tenant-context.test.ts src/tenant-isolation.test.ts`
- `pnpm --filter @agenticverdict/worker exec vitest run src/tenant/worker-tenant-als.test.ts`
- `pnpm --filter @agenticverdict/api exec vitest run src/middleware/jwt-tenant-context.test.ts src/trpc/authed-procedure.baseline.test.ts src/startup/tenant-rls-startup-check.test.ts`
- `pnpm --filter @agenticverdict/database exec vitest run test/db-scoped.unit.test.ts test/tenant-rls-guard.unit.test.ts`
- `pnpm --filter @agenticverdict/core exec tsc --noEmit --pretty false`
- `pnpm --filter @agenticverdict/database exec tsc --noEmit --pretty false`
- `pnpm --filter @agenticverdict/api exec tsc --noEmit --pretty false`
- `pnpm --filter @agenticverdict/worker exec tsc --noEmit --pretty false`

All targeted suites and typechecks above passed.

---

## Deferred / next phases

- **Phase 4:** observability and fairness standardization (tenant attribution helper unification for logs/rate limits and security-event alerting).
- **Phase 5:** governance and enforcement (CI/lint architecture guards to prevent tenant logic drift reintroduction).

---

## References

- [`docs/architecture/tenant-logic-consolidation-implementation-plan-2026-04-25.md`](../docs/architecture/tenant-logic-consolidation-implementation-plan-2026-04-25.md)
- [`docs/architecture/tenant-logic-consolidation-phase-2-context-propagation-unification-2026-04-25.md`](../docs/architecture/tenant-logic-consolidation-phase-2-context-propagation-unification-2026-04-25.md)
- [`docs/architecture/tenant-logic-consolidation-phase-3-database-isolation-hardening-2026-04-25.md`](../docs/architecture/tenant-logic-consolidation-phase-3-database-isolation-hardening-2026-04-25.md)
- [`changelog/2026-04-25-tenant-logic-consolidation-phase-0-baseline-freeze-and-traceability.md`](2026-04-25-tenant-logic-consolidation-phase-0-baseline-freeze-and-traceability.md)
- [`changelog/2026-04-25-tenant-logic-consolidation-phase-1-shared-resolver-consolidation.md`](2026-04-25-tenant-logic-consolidation-phase-1-shared-resolver-consolidation.md)
