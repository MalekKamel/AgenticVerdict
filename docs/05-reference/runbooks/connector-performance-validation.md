# Connector refactoring: performance validation

Operational companion to [Part 6: Performance Validation](../../architecture/connector-refactoring-migration-execution-plan.md#part-6-performance-validation) in the connector migration execution plan.

## Targets (from migration plan)

| Metric                                                 | Target                                              | How to measure                                                     |
| ------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------ |
| RLS policy overhead                                    | &lt; 10% vs same query with RLS bypassed (dev only) | `EXPLAIN ANALYZE` compare plans                                    |
| Tenant context read (`getTenantContext` in active ALS) | &lt; 1 ms amortized per call                        | Vitest `packages/core/src/tenant-context.performance.test.ts`      |
| In-process adapter registry `resolve()`                | &lt; 50 ms p99                                      | Vitest `packages/data-connectors/src/registry.performance.test.ts` |
| Package build time (monorepo)                          | &lt; 2 minutes                                      | `time turbo run build` (local / CI)                                |
| Test execution (monorepo)                              | &lt; 5 minutes                                      | `time turbo run test` (local / CI)                                 |

**Note:** The 50 ms registry budget in the plan applies to **application-level** connector resolution paths (including I/O). The automated test only guards the **in-process** `createAdapterRegistry` map lookup; keep API and DB-backed registry work within the same budget separately.

## Database checks

Run against a database that matches current Drizzle schema (`public.companies`, `core.data_connectors`, `core.connector_tag_mappings`, index `connector_tag_mappings_tag_idx` on `connector_tag_id`).

Replace `<company_uuid>` with a real tenant id from your environment.

```sql
-- RLS-aware tenant fetch (requires session var as your app sets via dbScoped)
SET LOCAL app.current_tenant_id = '<company_uuid>';
\timing on
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM companies WHERE id = '<company_uuid>'::uuid;

-- Connector tag lookup (index: connector_tag_mappings_tag_idx)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM core.connector_tag_mappings
WHERE connector_tag_id = 'marketing';
```

Interpretation:

- Confirm **Index Scan** (or suitable plan) on `connector_tag_mappings` for tag filters.
- Compare **execution time** before/after policy or index changes; investigate if planning time or row counts explode.

For ongoing DB latency triage, use [Database performance](./database-performance.md).

## Application / monorepo timings

From repository root:

```bash
# Full build (target < 2 min on dev hardware; CI may vary)
time turbo run build

# Full test suite (target < 5 min)
time turbo run test

# API startup (after build; measures cold start of compiled entry)
time node apps/api/dist/index.js
```

Quick regression slices (fast local probes) live in `scripts/performance-baseline.mjs`:

```bash
node scripts/performance-baseline.mjs
# Optional: append timings to docs/05-reference/performance-baselines.md
PERFBASELINE_WRITE=1 node scripts/performance-baseline.mjs
```

## Automated guardrails in CI

- `@agenticverdict/core` — tenant context throughput test.
- `@agenticverdict/data-connectors` — registry `resolve()` p99 ceiling.

Run only these packages when iterating:

```bash
pnpm --filter @agenticverdict/core test
pnpm --filter @agenticverdict/data-connectors test
```

## Related

- [Performance baselines (local)](../performance-baselines.md)
- [Database performance](./database-performance.md)
- [Connector-centric operations](./connector-centric-operations.md)
