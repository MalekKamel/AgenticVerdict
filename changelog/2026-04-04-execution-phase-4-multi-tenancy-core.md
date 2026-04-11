# Changelog entry: Execution Phase 4 (multi-tenancy core, application layer)

**Date:** 2026-04-04  
**Scope:** Phase 0 — [Execution Phase 4 — Multi-tenancy core](specs/00-core/00-foundation/EXECUTION-PLAN.md) (`tasks.md` §4: 0.34–0.43).

---

## Summary

- Authored **[multi-tenancy-architecture.md](specs/00-core/00-foundation/multi-tenancy-architecture.md)** describing AsyncLocalStorage + RLS defense in depth, resolution order (headers → JWT → subdomain), cache key namespacing, and threat notes.
- Extended **`@agenticverdict/core`** with **`TenantSecurityError`**, **`resolveTenantIdentity`** / **`extractTenantSlugFromHost`**, **`resolveTenantContextFromHttp`** (config load + optional active check via injected `isTenantActive`), **`continueWithTenantContext`** / **`bindTenantContext`** / **`runWithCapturedTenantContext`**, and **`assertResourceCompanyId`** / **`tenantContextMatches`** for application-layer routing checks.
- Extended **`@agenticverdict/database`** with migration **`0001_companies_active`** (`companies.active` default true), **`provisionTenantCompany`** + **`suggestSlugFromCompanyName`**, **`setTenantCompanyActive`**, and **`tenantScopedCacheKey`** for Redis-style isolation.
- Added **unit tests** in `packages/core` (`tenant-isolation.test.ts`) and `packages/database` (`tenant-helpers.unit.test.ts`).

---

## Verification (local)

- `pnpm exec turbo run build lint test typecheck`
- `pnpm run check:cycles`
- `pnpm --filter @agenticverdict/database run test:integration` (Docker; RLS suite applies all migrations including `0001`)

---

## Follow-ups

- **HTTP servers:** Wire `resolveTenantContextFromHttp` into Fastify/Next middleware in later execution phases; keep trusted-header behavior behind gateways in production.
- **Tenant provisioning API:** Expose admin HTTP routes with authz; persist new company JSON via ops workflow or a future `ConfigManager` write path.
- **E2E:** Playwright multi-tenant isolation scenarios deferred to Execution Phase 6 per plan.

---

## Related documentation

- [`specs/00-core/00-foundation/EXECUTION-PLAN.md`](specs/00-core/00-foundation/EXECUTION-PLAN.md) — Execution Phase 4 definition.
- [`specs/00-core/00-foundation/tasks.md`](specs/00-core/00-foundation/tasks.md) — tasks 0.34–0.43.
- [`specs/00-core/00-foundation/acceptance-criteria.md`](specs/00-core/00-foundation/acceptance-criteria.md) — §4 Multi-Tenancy Implementation.
