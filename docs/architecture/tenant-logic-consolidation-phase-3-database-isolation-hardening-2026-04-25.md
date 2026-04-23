# Tenant Logic Consolidation — Phase 3 Database Isolation Hardening

**Date:** 2026-04-25  
**Plan Source:** [`tenant-logic-consolidation-implementation-plan-2026-04-25.md`](./tenant-logic-consolidation-implementation-plan-2026-04-25.md)  
**Phase:** 3 (Database isolation hardening)

---

## Objective

Harden tenant DB isolation by enforcing tenant-scoped execution contracts and adding startup validation for tenant session binding assumptions used by `dbScoped` and RLS policies.

---

## Implementation

### 1) Tenant session binding verification primitive

- Added `verifyTenantRlsSessionBinding` in `packages/database/src/tenant-rls-guard.ts`.
- The check runs in a transaction, sets `app.current_tenant_id`, reads it back via `current_setting`, and fails fast on mismatch.
- Exported the helper from `packages/database/src/index.ts`.

### 2) API startup hardening

- Added `apps/api/src/startup/tenant-rls-startup-check.ts` to run tenant session-binding verification at API startup.
- `buildApiServer` now calls `runTenantRlsStartupCheck()` before initializing routes.
- Startup check behavior:
  - skips when `DATABASE_URL` is not configured,
  - skips when `TENANT_RLS_STARTUP_CHECK=false`,
  - verifies binding when database-backed mode is enabled.

### 3) Tenant-scoped DB access contract reaffirmed

- `packages/database/src/db-scoped.ts` remains the required tenant execution boundary, enforcing active ALS tenant context before DB work.
- tRPC auth/admin tenant-owned operations continue through `dbScoped`:
  - `apps/api/src/trpc/routers/auth.ts`
  - `apps/api/src/trpc/routers/admin.ts`

---

## Behavior compatibility guarantees

- No change to public auth or authenticated API semantics; this phase adds guardrails, not contract changes.
- Database-backed API startup now fails early when tenant session binding is broken, preventing runtime silent isolation drift.
- Runtime without database configuration remains supported for non-DB development/test paths.

---

## Verification evidence

- `pnpm --filter @agenticverdict/database exec vitest run test/db-scoped.unit.test.ts test/tenant-rls-guard.unit.test.ts`
- `pnpm --filter @agenticverdict/api exec vitest run src/startup/tenant-rls-startup-check.test.ts`
- `pnpm --filter @agenticverdict/database exec tsc --noEmit --pretty false`
- `pnpm --filter @agenticverdict/api exec tsc --noEmit --pretty false`
- `pnpm --filter @agenticverdict/core exec tsc --noEmit --pretty false`
- `pnpm --filter @agenticverdict/worker exec tsc --noEmit --pretty false`

---

## Exit criteria status (Phase 3)

| Exit criterion                                                                       | Status   | Evidence                                                                                                        |
| ------------------------------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------- |
| Tenant-owned reads/writes consistently routed via `dbScoped` (or reviewed exception) | Complete | `apps/api/src/trpc/routers/auth.ts`, `apps/api/src/trpc/routers/admin.ts`, `packages/database/src/db-scoped.ts` |
| Startup/integration checks for tenant session variable effectiveness                 | Complete | `packages/database/src/tenant-rls-guard.ts`, `apps/api/src/startup/tenant-rls-startup-check.ts`                 |
| RLS checks automated in validation paths                                             | Complete | `packages/database/test/tenant-rls-guard.unit.test.ts`, `apps/api/src/startup/tenant-rls-startup-check.test.ts` |
