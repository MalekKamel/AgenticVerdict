# Changelog: Connector migration plan — Parts 6 (performance) & 7 (documentation)

**Date:** 2026-04-10  
**Scope:** [Connector refactoring migration execution plan](docs/architecture/connector-refactoring-migration-execution-plan.md) — **Part 6: Performance Validation**, **Part 7: Documentation Updates**.

## Summary

Delivered operational performance guidance, automated micro-benchmark guardrails aligned to plan targets, extended the local performance baseline script, and refreshed connector-centric documentation (package README, public JSDoc, root/CLAUDE structure, new runbooks).

## Part 6: Performance validation

### Runbook

- Added [`docs/06-reference/runbooks/connector-performance-validation.md`](docs/06-reference/runbooks/connector-performance-validation.md) with:
  - Target table mapped to concrete measurement methods
  - PostgreSQL `EXPLAIN (ANALYZE, BUFFERS)` examples using current schema names (`public.companies`, `core.connector_tag_mappings`, index `connector_tag_mappings_tag_idx`)
  - Shell timing commands (`turbo run build` / `test`, API cold start)
  - Pointers to [`database-performance.md`](docs/06-reference/runbooks/database-performance.md) and [`performance-baselines.md`](docs/06-reference/performance-baselines.md)

### Script

- [`scripts/performance-baseline.mjs`](scripts/performance-baseline.mjs) — appended step **`pnpm --filter @agenticverdict/data-connectors test`** so connector-boundary tests (including perf guardrails) are included in quick local timing runs.

### Automated tests (Vitest)

- [`packages/data-connectors/src/registry.performance.test.ts`](packages/data-connectors/src/registry.performance.test.ts) — 5k samples; **p99 `resolve()` &lt; 50 ms** (plan budget for registry-class work; in-process map should stay far below this).
- [`packages/core/src/tenant-context.performance.test.ts`](packages/core/src/tenant-context.performance.test.ts) — 50k `getTenantContext()` calls inside one `runWithTenantContext`; **amortized &lt; 1 ms per call** (plan target for tenant context reads).

## Part 7: Documentation updates

### Runbook (operations index)

- Added [`docs/06-reference/runbooks/connector-centric-operations.md`](docs/06-reference/runbooks/connector-centric-operations.md) — links migration plan, Docker/Makefile, deployment, rollback, performance validation, and a connector-focused troubleshooting table aligned with plan Part 8.

### Package README

- Replaced stale `@agenticverdict/platform-adapters` content in [`packages/data-connectors/README.md`](packages/data-connectors/README.md) with current **`ConnectorAdapter` / `BaseConnectorAdapter` / `createAdapterRegistry`** integration guidance and links to runbooks.

### JSDoc / module docs

- [`packages/data-connectors/src/adapter.ts`](packages/data-connectors/src/adapter.ts) — documented **`ConnectorAdapter`**.
- [`packages/data-connectors/src/registry.ts`](packages/data-connectors/src/registry.ts) — documented **`AdapterFactory`**, **`ConnectorAdapterRegistry`**, **`createAdapterRegistry`** (with `@example`).
- [`packages/data-connectors/src/index.ts`](packages/data-connectors/src/index.ts) — updated package banner to connector terminology.
- [`packages/core/src/tenant-context.ts`](packages/core/src/tenant-context.ts) — documented **`runWithTenantContext`** (with `@example`) per plan §7.1.

### Project overview docs

- [`CLAUDE.md`](CLAUDE.md) — plugin principle and repository tree: **`data-connectors`** / connector wording; Phase 1 line uses “Connector adapters”.
- [`README.md`](README.md) — repository structure shows **`packages/data-connectors/`**.

## Verification

```bash
pnpm --filter @agenticverdict/core test
pnpm --filter @agenticverdict/data-connectors test
pnpm --filter @agenticverdict/core exec tsc --noEmit
pnpm --filter @agenticverdict/data-connectors exec tsc --noEmit
node scripts/performance-baseline.mjs
```

## Intentional non-goals

- No changes to production RLS SQL in this batch (none checked into `packages/database` as `.sql`); DB validation remains operator-driven via the new runbook.
- Full monorepo `time turbo run build` / `test` baselines are environment-specific; they are documented as manual checks, not committed numbers.
