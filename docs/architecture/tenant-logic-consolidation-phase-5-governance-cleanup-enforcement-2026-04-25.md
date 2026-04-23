# Tenant Logic Consolidation — Phase 5 Governance, Cleanup, and Enforcement

**Date:** 2026-04-25  
**Plan Source:** [`tenant-logic-consolidation-implementation-plan-2026-04-25.md`](./tenant-logic-consolidation-implementation-plan-2026-04-25.md)  
**Phase:** 5 (Governance, cleanup, and enforcement)

---

## Objective

Remove deprecated tenant naming/alias pathways, enforce architectural boundaries to prevent logic drift outside shared contracts, and publish governance/checklist requirements for future tenant changes.

---

## Implementation

### 1) Cleanup of deprecated tenant alias pathways

- `packages/core/src/index.ts`
  - removed public alias exports (`*PublicTenant*`) in favor of canonical names:
    - `parseOptionalTenantId`
    - `readOptionalTenantIdHeader`
    - `resolveRequiredTenantIdFromHints`
    - `assertOptionalTenantHintsMatchResolvedTenant`
- `packages/core/src/tenant-resolution.ts`
  - removed support for legacy `tenant_id` JWT claim aliases and `x-tenant-id` header.

### 2) Canonical tenant naming and shared helper usage

- `packages/core/src/tenant-data-access.ts`
  - introduced canonical `assertResourceTenantId`.
  - retained `assertResourceTenantId` as a deprecated compatibility shim.
- `apps/api/src/trpc/routers/auth.ts`
  - migrated usages to `assertResourceTenantId`.
- `apps/api/src/middleware/request-logging.ts`
  - now consumes shared `isTenantUuid` from `@agenticverdict/core`.
- `apps/frontend/src/lib/tenant/resolve-tenant-id-by-priority.ts`
  - consumes shared `isTenantUuid` validator.
- `apps/frontend/src/lib/tenant/fetch-current-tenant-name.ts`
  - removed local UUID regex; uses shared validator.

### 3) Architecture enforcement in CI

- Added tenant boundary gate script:
  - `scripts/tenant/verify-tenant-boundaries.mjs`
  - fails on forbidden legacy patterns (`x-tenant-id`, `tenant_id`, namespaced tenant claim).
- Added root script:
  - `package.json` -> `check:tenant-boundaries`
- Enforced in CI quality job:
  - `.github/workflows/ci.yml` -> `Tenant architecture boundary check`

### 4) Governance process and checklist publication

- Added tenant-change checklist:
  - `docs/05-reference/checklists/tenant-change-pr-checklist.md`

---

## Exit criteria status (Phase 5)

| Exit criterion                                          | Status                                                  | Evidence                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Deprecated tenant helper paths removed                  | Complete (compat shim retained with deprecation marker) | `packages/core/src/index.ts`, `apps/api/src/trpc/resolve-public-tenant-id.ts`             |
| CI gate prevents tenant-resolution drift reintroduction | Complete                                                | `scripts/tenant/verify-tenant-boundaries.mjs`, `.github/workflows/ci.yml`, `package.json` |
| Governance/checklist process published                  | Complete                                                | `docs/05-reference/checklists/tenant-change-pr-checklist.md`                              |
