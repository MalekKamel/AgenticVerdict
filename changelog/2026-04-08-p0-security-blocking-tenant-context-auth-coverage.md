# Changelog entry: P0 security / blocking (tenant ALS, JWT matrix, coverage)

**Date:** 2026-04-08  
**Scope:** Execution of **P0 — CRITICAL (Security/Blocking)** items from `PHASE_00-03_CORE_AUDIT_REPORT.md`: tenant context propagation for the Fastify API, expanded authentication and authorization tests, reaffirmed JWT coverage for v1 routes, monorepo `vitest --coverage` measurement, and a small fixture-path fix so root-level coverage runs pass.

**Test counts:** Scenario counts in this entry match individual Vitest `it()` cases (`grep -c "it(" <file>`). Parameterized or table-driven tests are still one `it()` each unless the file uses multiple `it()` per loop.

---

## Summary

- **Tenant context:** After JWT validation, the API loads `CompanyConfig` per tenant, attaches `FastifyRequest.tenantContext`, and wraps route handlers with `runWithTenantContext` when that context exists so `getTenantContext()` works for the full handler (required because `AsyncLocalStorage.enterWith` after an async `preHandler` does not carry into Fastify’s handler invocation).
- **Security tests:** Added **25** matrix-style API tests (`it()` blocks in `auth-security-matrix.test.ts`) plus **2** focused tenant-context middleware tests; existing contract and route tests unchanged in behavior aside from needing company JSON for JWT tenants under Vitest.
- **JWT posture:** All tenant-scoped `/api/v1` routes that already used `jwtAuth` now chain tenant resolution; documented exceptions remain webhook shared-secret and share-link download (no bearer JWT).
- **Coverage:** Ran `pnpm test:coverage`; recorded aggregate totals from `coverage/coverage-summary.json`. Fixed workflow contract fixture resolution to use `import.meta.url` so tests pass when Vitest’s cwd is the repo root.
- **Core:** Exported `bindTenantContextAsyncContinuation` (`AsyncLocalStorage.enterWith` wrapper) for advanced / non-Fastify callers; the HTTP API uses explicit `runWithTenantContext` via `onRoute` wrapping instead.

---

## Added

### `packages/core`

- **`bindTenantContextAsyncContinuation`** in `src/tenant-context.ts` (re-exported from `src/index.ts`) — documents and exposes Node `enterWith` binding for narrow use cases.

### `apps/api`

- **`src/middleware/jwt-tenant-context.ts`** — `bindJwtTenantAsyncContext()` runs after `jwtAuth`, calls `resolveTenantContextFromHttp`, sets `request.tenantContext`, returns `403` with `tenant_config_not_found` when config is missing.
- **`src/middleware/tenant-route-als.ts`** — `registerTenantAlsRouteWrapping` hooks `onRoute` to run handlers inside `runWithTenantContext` when `tenantContext` is present.
- **`src/middleware/jwt-tenant-context.test.ts`** — asserts ALS visibility in handler and 403 for unknown tenant config.
- **`src/middleware/auth-security-matrix.test.ts`** — **25** scenarios (count = `grep -c "it("` on this file): unauthenticated / bad JWT sweeps over key GET routes, role-based 403 (reports write, translations write, admin workflows), optional JWT, JWT garbage, admin-only mini-app, missing company config.
- **`test-fixtures/company-configs/*.json`** — company configs for JWT tenants used in API tests (including Masafh and demo UUIDs aligned with `api.contract.test.ts`).

### `specs/00-core`

- **`p0-phase-00-03-security-blocking-execution-plan-2026-04-08.md`** — step-by-step execution plan and verification commands tied to this P0 slice.

---

## Changed

### `apps/api`

- **`src/server.ts`** — registers `registerTenantAlsRouteWrapping` inside the `/api/v1` plugin; side-effect import of `jwt-tenant-context` for `FastifyRequest` augmentation.
- **`src/index.ts`** — exports `bindJwtTenantAsyncContext`.
- **`vitest.config.ts`** — sets `COMPANY_CONFIG_DIR` to `test-fixtures/company-configs` for isolated, hermetic config loading in API tests.
- **v1 route modules** (`insights`, `verdicts`, `analysis-results`, `reports`, `workflows`, `test-flow`, `translations`, `report-schedules`, `validation`, `report-templates`) — each JWT `preHandler` chain now includes `bindJwtTenantAsyncContext()` immediately after `jwtAuth`.
- **`src/routes/v1/workflow-contract-fixtures.test.ts`** — fixture paths resolved relative to the test file (fixes `ENOENT` when running Vitest from monorepo root).

### `apps/worker`

- **`src/queues/workflow-contract-fixtures.test.ts`** — same fixture path fix as API (monorepo root `test:coverage` compatibility).

---

## Coverage (2026-04-08)

Command: `pnpm test:coverage` (repository root, Vitest v8 provider).

| Metric     | Total (included scope) |
| ---------- | ---------------------- |
| Lines      | **90.84%**             |
| Statements | **90.84%**             |
| Functions  | **92.9%**              |
| Branches   | **82.47%**             |

Source: `coverage/coverage-summary.json` → `total`.

**Note:** Root `vitest.config.ts` excludes several app packages from coverage _threshold_ `include`/`exclude` tuning; the run still executes API tests. Treat per-app coverage as a separate follow-up if product gates require `apps/api` in the threshold set.

---

## Security / behavior notes

- **Config must exist for JWT tenants:** Valid JWT + unknown/missing company file → **403** `tenant_config_not_found` (fail closed for tenant resolution).
- **Intentional non-bearer surfaces:** `/health`, `/metrics`, Swagger UI, `POST /api/v1/reports/delivery-events/webhook` (`x-delivery-webhook-token`), `GET /api/v1/reports/shared/:token/content` (opaque share token).
- **Operational:** Production deployments must keep `JWT_SECRET` / `JWT_SECRET_FILE` and `COMPANY_CONFIG_DIR` consistent with issued tokens and tenant JSON files.

---

## References

- `PHASE_00-03_CORE_AUDIT_REPORT.md` — P0 table (tenant middleware, auth tests, JWT, coverage).
- `specs/00-core/p0-phase-00-03-security-blocking-execution-plan-2026-04-08.md` — detailed execution checklist for this slice.
