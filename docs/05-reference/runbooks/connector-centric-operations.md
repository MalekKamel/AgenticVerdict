# Connector-centric operations

Companion to [Part 7: Documentation Updates — Runbook creation](../../architecture/connector-refactoring-migration-execution-plan.md#73-runbook-creation) for the connector refactoring migration plan.

This page **indexes** existing procedures and connector-specific notes. It does not replace the detailed execution plan.

## Migration and schema

- **Step-by-step migration** (schema, package rename, interfaces): [`docs/architecture/connector-refactoring-migration-execution-plan.md`](../../architecture/connector-refactoring-migration-execution-plan.md)
- **Local Docker / database workflows**: [`docs/docker/README.md`](../../docker/README.md) and root `Makefile` (`make help`)
- **Schema apply (push-only):** sync the database from Drizzle schema with **`pnpm db:push`** (from repo root or via **`pnpm --filter @agenticverdict/database`** per [`packages/database/README.md`](../../../packages/database/README.md)); use **`pnpm db:reset`** for a destructive local reset + push + seed. **`pnpm db:generate`** is optional and writes SQL to **`.drizzle-out/`** (gitignored). There is no committed versioned SQL migration apply path — see **`changelog/2026-04-10-database-remove-versioned-sql-migrations.md`**.

## Deployment

- [Deployment playbook](./deployment-playbook.md)

## Rollback

- [Rollback procedures](./rollback-procedures.md)
- **Code / package rollback** narrative: migration plan [Part 5: Rollback Procedures](../../architecture/connector-refactoring-migration-execution-plan.md#part-5-rollback-procedures)

## Performance validation

- [Connector performance validation](./connector-performance-validation.md)

## Troubleshooting (connector-focused)

Symptoms map to migration plan [Part 8: Common Issues and Solutions](../../architecture/connector-refactoring-migration-execution-plan.md#part-8-common-issues-and-solutions).

| Symptom                                                | Likely cause                           | First steps                                                                                       |
| ------------------------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `Cannot find module '@agenticverdict/data-connectors'` | Missing workspace dep or stale install | `pnpm install`; verify `package.json` `workspace:*`                                               |
| Circular dependency / build order failures             | Types or helpers in wrong package      | Run `madge --circular` from repo root; move shared types to `@agenticverdict/types`               |
| Slow tenant-scoped queries                             | Missing index or RLS plan regression   | `EXPLAIN ANALYZE`; see [Database performance](./database-performance.md)                          |
| `Tenant context is not set`                            | ALS scope lost across callbacks        | Prefer `runWithTenantContext`; see `bindTenantContextAsyncContinuation` in `@agenticverdict/core` |
| `No adapter registered for connector`                  | Bootstrap did not register factory     | Ensure `createAdapterRegistry().register(...)` runs before `resolve`                              |

## Package documentation

- **`@agenticverdict/data-connectors`**: [`packages/data-connectors/README.md`](../../../packages/data-connectors/README.md)
