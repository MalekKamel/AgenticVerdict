# Changelog: Connector refactoring — Part 1 (code restructuring)

**Date:** 2026-04-10  
**Plan:** `docs/architecture/connector-refactoring-migration-execution-plan.md` — **Part 1 only** (§1.1–1.3) as the **initial** restructuring batch.  
**Addendum (2026-04-11):** Part 2 (interface renames) was completed in a **follow-up** change set; see **`changelog/2026-04-10-connector-part2-interface-renaming.md`**. The narrative below describes the Part 1 scope at the time of that commit and may mention historical names (for example `platform-adapters`) where the rename had not yet landed.

## Summary

This batch implements connector-centric **database structure**, **package rename** (`platform-adapters` → `data-connectors`), **connector registry seeding**, and two new workspace packages (**multi-tenancy** facade, **queueing** re-exports). Tenant isolation for new business tables follows the existing `app.current_tenant_id` RLS pattern.

---

## 1. Database (`@agenticverdict/database`)

### 1.1 `core` schema (PostgreSQL)

New tables under schema **`core`** (Drizzle `pgSchema("core")`):

| Table                         | Purpose                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| `core.agency_partners`        | Agency resale / partner accounts (`slug`, `settings` JSONB).                                     |
| `core.data_connectors`        | Connector registry rows with string primary keys (`ga4`, `meta`, …).                             |
| `core.connector_tags`         | Domain tags (`marketing`, `seo`, …).                                                             |
| `core.connector_tag_mappings` | Many-to-many connector ↔ tag.                                                                    |
| `core.insights`               | Tenant-scoped insight configurations (business-facing successor to internal “pipeline” wording). |
| `core.insight_connectors`     | Per-insight connector attachment, metrics, filters.                                              |
| `core.usage_tracking`         | Billing / metering quantities by tenant and period.                                              |

### 1.2 `public.tenants` enhancement

- Nullable **`agency_partner_id`** foreign key to `core.agency_partners(id)` with `ON DELETE SET NULL`.

### 1.3 Row-level security

Enabled with **FORCE ROW LEVEL SECURITY** on:

- `core.insights` — `tenant_id = current_setting('app.current_tenant_id', true)::uuid`
- `core.insight_connectors` — existence subquery on parent `insights` row for current tenant
- `core.usage_tracking` — same tenant pattern as other tenant-scoped tables

Global catalog tables (`data_connectors`, `connector_tags`, `connector_tag_mappings`, `agency_partners`) do **not** use RLS in this migration; treat writes as migration/admin-only unless a follow-up adds explicit policies.

### 1.4 Migrations

- **`migrations/0004_connector_core_schema.sql`** — creates `core` tables, FKs, RLS policies, `tenants.agency_partner_id`.
- **`migrations/0005_sync_insight_usage_indexes.sql`** — btree indexes on `insights(tenant_id)` and `usage_tracking(tenant_id, period_start, period_end)` (aligned with Drizzle schema definitions).

**Operational note:** If a local database already applied an earlier draft of `0004` that included these indexes inline, reconcile manually (drop duplicate indexes or skip `0005` statements) before re-running migrations.

### 1.5 Drizzle source layout

New files under `packages/database/src/schema/core/`:

- `schema.ts` — `coreSchema`
- `tenants.ts` — `agencyPartners`
- `connectors.ts` — `dataConnectors`, `connectorTags`, `connectorTagMappings`
- `insights.ts` — `insights`, `insightConnectors`
- `usage.ts` — `usageTracking`

`packages/database/src/schema/index.ts` re-exports these symbols alongside existing Phase 0 tables.

### 1.6 Connector registry seed

- **`packages/database/src/seed-connectors.ts`** — `seedConnectorRegistry(db)` upserts GA4, GSC, Meta, TikTok, GBP connectors, domain tags, and tag mappings (idempotent).
- Wired into **`scripts/seed.ts`** and **`scripts/seed-test.ts`** after migrations, before tenant JSON seeds.

### 1.7 Tests

- **`packages/database/test/schema.unit.test.ts`** — export list updated for new tables.

---

## 2. Package rename: `platform-adapters` → `data-connectors`

- **Directory:** `packages/platform-adapters` → `packages/data-connectors` (git mv).
- **Package name:** `@agenticverdict/platform-adapters` → `@agenticverdict/data-connectors`.
- **Consumers updated:** `apps/frontend`, `apps/worker`, `packages/agent-runtime`, `packages/mock-platform-server`, `tests/phase01-platform-integration`, `tests/factories`, root `package.json` (cycle check + production bundle path + devDependency), `vitest.config.ts`, `tools/build/bundle-adapter-factory-smoke.mjs`, `docker/base/Dockerfile.deps`.
- **`pnpm-lock.yaml`** regenerated via `pnpm install`.

**Documentation:** Many historical markdown paths and filter commands still mention `platform-adapters`; update them when touching those docs. The OpenAPI asset filename `platform-adapters-health.yaml` is unchanged.

---

## 3. New packages

### 3.1 `@agenticverdict/multi-tenancy`

- **Location:** `packages/multi-tenancy/`
- **Role:** Thin, **non-duplicating** facade over `@agenticverdict/core` for tenant context, resolution, data-access assertions, and `TenantSecurityError`.
- **Rationale:** Satisfies Part 1.3 “new package” without forking AsyncLocalStorage logic; future work can move implementations here if desired.

### 3.2 `@agenticverdict/queueing`

- **Location:** `packages/queueing/`
- **Role:** Centralizes **BullMQ** and **ioredis** versions and re-exports `Queue`, `Worker`, `FlowProducer`, and common job/connection option types.
- **Rationale:** Workers can migrate imports incrementally; no behavioral change to `apps/worker` in this PR.

---

## 4. Verification performed

- `pnpm --filter @agenticverdict/database test` — pass.
- `pnpm --filter @agenticverdict/data-connectors test` — pass.
- `pnpm --filter @agenticverdict/{multi-tenancy,queueing,database,data-connectors} typecheck` — pass.
- `pnpm exec turbo run typecheck --continue` — **@agenticverdict/api** still reports existing Fastify/logger generic mismatches in `apps/api/src/server.ts` (unrelated to this restructuring).

---

## 5. Follow-up (not in Part 1)

- Part 2: Rename `PlatformAdapter`, `PlatformType`, `NormalizedPlatformSnapshot`, etc., across types and adapters.
- Optionally migrate `apps/worker` queue wiring to `@agenticverdict/queueing`.
- Optionally migrate API middleware to import from `@agenticverdict/multi-tenancy` instead of `@agenticverdict/core` for clearer layering.
- Refresh top-level docs (`CLAUDE.md`, `README.md`, phase docs) to say `data-connectors` and `@agenticverdict/data-connectors`.
