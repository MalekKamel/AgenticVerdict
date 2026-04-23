# Tenant Logic Consolidation — Phase 0 Baseline and Traceability

**Date:** 2026-04-25  
**Plan Source:** [`tenant-logic-consolidation-implementation-plan-2026-04-25.md`](./tenant-logic-consolidation-implementation-plan-2026-04-25.md)  
**Phase:** 0 (Baseline and Freeze)

---

## Objective

Execute Phase 0 by locking scope boundaries for tenant logic changes, publishing a requirement-to-implementation traceability matrix, and confirming baseline behavior coverage for public auth and authenticated tenant-sensitive paths before consolidation refactors.

---

## Planning Lock (Phase 0 Freeze)

### In Scope

- Build a single traceability matrix mapping tenant requirements to code paths, tests, and owner groups.
- Confirm baseline behavior tests for:
  - public/pre-session auth tenant resolution,
  - authenticated tenant-context enforcement.
- Define explicit Phase 0 entry/exit conditions for subsequent phases.

### Out of Scope

- Shared resolver extraction and adapter rewiring (Phase 1+).
- Context propagation unification changes (Phase 2+).
- Database RLS hardening and observability changes (Phase 3+).

### Freeze Rule

- New tenant decision logic must not be added in app-local modules when a shared primitive already exists in `@agenticverdict/core`.
- Any new tenant behavior change discovered during implementation must first update this matrix and reference the linked requirement ID.

---

## Traceability Matrix (Requirement -> Code Path -> Tests -> Owner)

| Trace ID   | Requirement focus                                                                                | Primary code paths                                                                                                     | Baseline tests                                                                                                                   | Owner                   |
| ---------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| TMX-P0-001 | Public auth procedures resolve one valid `tenantId` from input/header and reject missing hints   | `apps/api/src/trpc/resolve-public-tenant-id.ts`, `apps/api/src/trpc/public-tenant-context.ts`                          | `apps/api/src/trpc/resolve-public-tenant-id.test.ts`                                                                             | Platform API            |
| TMX-P0-002 | Public auth tenant mismatch (input/header disagreement) returns stable tenant security semantics | `apps/api/src/trpc/resolve-public-tenant-id.ts`, `apps/api/src/trpc/init.ts`                                           | `apps/api/src/trpc/resolve-public-tenant-id.test.ts`                                                                             | Platform API + Security |
| TMX-P0-003 | Authenticated requests require established tenant context and enforce JWT tenant agreement       | `apps/api/src/trpc/procedures.ts`, `apps/api/src/middleware/auth.ts`                                                   | `apps/api/src/trpc/authed-procedure.baseline.test.ts`                                                                            | Platform API            |
| TMX-P0-004 | JWT middleware binds tenant ALS and rejects mismatched `x-tenant-id` header                      | `apps/api/src/middleware/jwt-tenant-context.ts`, `apps/api/src/middleware/tenant-route-als.ts`                         | `apps/api/src/middleware/jwt-tenant-context.test.ts`                                                                             | Platform API            |
| TMX-P0-005 | API tenant isolation and route-level tenant security behavior remains stable                     | `apps/api/src/middleware/tenant-isolation-matrix.test.ts`, `apps/api/src/middleware/auth-security-matrix.test.ts`      | `apps/api/src/middleware/tenant-isolation-matrix.test.ts`, `apps/api/src/middleware/auth-security-matrix.test.ts`                | Platform API + Security |
| TMX-P0-006 | Frontend pre-session tenant propagation merges tenant hint deterministically                     | `apps/frontend/src/lib/tenant/merge-pre-session-tenant-input.ts`, `apps/frontend/src/lib/tenant/trpc-tenant-bridge.ts` | `apps/frontend/src/lib/tenant/merge-pre-session-tenant-input.test.ts`, `apps/frontend/src/lib/tenant/trpc-tenant-bridge.test.ts` | Frontend                |
| TMX-P0-007 | Frontend auth route contracts keep tenant-aware pre-session behavior consistent                  | `apps/frontend/src/routes/$locale/auth/*`, `apps/frontend/src/lib/api/auth-api.ts`                                     | `apps/frontend/src/routes/$locale/auth/-auth-route-contracts.test.ts`                                                            | Frontend                |
| TMX-P0-008 | Worker jobs reconstruct tenant ALS context at queue/processor boundary                           | `apps/worker/src/tenant/worker-tenant-als.ts`, `apps/worker/src/queues/report-queues.ts`                               | `apps/worker/src/tenant/worker-tenant-als.test.ts`                                                                               | Worker                  |
| TMX-P0-009 | Tenant context core contracts remain deterministic and isolated                                  | `packages/core/src/tenant-context.ts`, `packages/core/src/tenant-resolution.ts`                                        | `packages/core/src/tenant-context.test.ts`, `packages/core/src/tenant-isolation.test.ts`                                         | Core Platform           |
| TMX-P0-010 | Tenant-scoped database session contract is validated for `dbScoped` baseline behavior            | `packages/database/src/db-scoped.ts`                                                                                   | `packages/database/test/db-scoped.unit.test.ts`                                                                                  | Database                |

---

## Baseline Contract Coverage Snapshot

### Public/Pre-session tenant behavior

- Resolver-level coverage is present for:
  - valid header/body tenant hints,
  - missing tenant hint rejection (`TENANT_CONTEXT_REQUIRED`),
  - mismatch rejection (`TENANT_MISMATCH`).
- Primary evidence: `apps/api/src/trpc/resolve-public-tenant-id.test.ts`.

### Authenticated tenant behavior

- Middleware-level coverage is present for:
  - ALS tenant context binding for authenticated requests,
  - JWT/header mismatch denial.
- New explicit tRPC contract baseline coverage is added for:
  - missing authenticated session (`UNAUTHORIZED`),
  - missing tenant context (`TENANT_CONTEXT_REQUIRED`),
  - session/tenant mismatch (`TENANT_MISMATCH`),
  - happy path continuation.
- Primary evidence: `apps/api/src/middleware/jwt-tenant-context.test.ts`, `apps/api/src/trpc/authed-procedure.baseline.test.ts`.

---

## Phase 0 Exit Criteria Status

| Exit criterion                                                           | Status   | Evidence                                                                                              |
| ------------------------------------------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------- |
| Traceability matrix created and reviewed for Phase 0 scope               | Complete | This document (`TMX-P0-001` to `TMX-P0-010`)                                                          |
| Behavior baseline tests in place for public auth and authenticated flows | Complete | `resolve-public-tenant-id.test.ts`, `jwt-tenant-context.test.ts`, `authed-procedure.baseline.test.ts` |

---

## Implementation Notes

- This artifact is the Phase 0 anchor for the consolidation stream and should be updated first when introducing new tenant requirements in subsequent phases.
- Requirement-level owner assignment is intentionally group-based at Phase 0; DRI assignment can be expanded in phase execution PRs.
