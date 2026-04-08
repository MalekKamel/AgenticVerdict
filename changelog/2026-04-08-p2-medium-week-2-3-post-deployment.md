# Changelog: P2 MEDIUM — Week 2–3 post-deployment remediation

**Date:** 2026-04-08  
**Scope:** Execution of **🟡 P2 - MEDIUM (Week 2-3 Post-Deployment)** from `REMEDIATION_PLAN_2026-04-08.md`: integration test expansion toward the 25% integration target, Arabic review enablement (glossary + playbook wiring), BullMQ queue latency/depth metrics with alerting and Grafana, and database query performance instrumentation with dashboards and runbook updates.

**Reference:** `REMEDIATION_PLAN_2026-04-08.md` sections P2-1 through P2-4.

---

## Summary

| Track                          | Delivered                                                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P2-1 Integration coverage**  | New Fastify inject suites under `apps/api/src/integration/`, optional Redis BullMQ depth check under `apps/worker/src/integration/`, mock-adapter fetch suite under `packages/platform-adapters/src/integration/`, cross-package config parse suite under `tests/integration/`; Vitest project `tests/integration` scoped with its own `root` so it does not sweep the whole monorepo. |
| **P2-2 Arabic review**         | `docs/06-reference/localization/arabic-glossary.md` (terminology table, source paths, reviewer deliverables); playbook link from `arabic-native-review-playbook.md`. **Human native sign-off** remains a manual gate (not automatable here).                                                                                                                                           |
| **P2-3 Queue latency metrics** | `agenticverdict_queue_job_duration_seconds`, `agenticverdict_queue_job_age_seconds`, `agenticverdict_queue_depth`; worker processors record wait + duration; `refreshBullmqQueueDepthMetrics` before worker `/metrics` scrape; Prometheus rules `queues.yml`; Grafana `queue-health.json` (UID `av-queue-health`).                                                                     |
| **P2-4 DB query performance**  | `agenticverdict_db_query_duration_seconds`, `agenticverdict_db_slow_queries_total`; optional `queryMetrics` on `createDatabaseClient` (postgres.js `unsafe` timing); Prometheus `database-queries.yml`; Grafana `database-performance.json` (UID `av-database-performance`); database performance runbook Prometheus note.                                                             |

---

## Added

### `packages/observability`

- **`src/queue-metrics.ts`** (+ **`src/queue-metrics.test.ts`**) — Histograms/gauge for BullMQ job duration, wait time, and depth.
- **`src/database-metrics.ts`** (+ **`src/database-metrics.test.ts`**) — Query duration histogram and slow-query counter.

### `packages/database`

- **`@agenticverdict/observability`** dependency; **`queryMetrics`** option on `DatabaseClientOptions` with `attachPostgresQueryMetrics` (wraps `unsafe`, optional `onSlowQuery` callback).

### `apps/worker`

- **`src/queues/report-queues.ts`** — `wireQueueLatencyListeners`, `recordQueueJobWaitSeconds` at job start, workflow-trigger completion/failure also records queue duration; **`refreshBullmqQueueDepthMetrics`** (exported from package index).
- **`src/cli.ts`** — Awaits `refreshBullmqQueueDepthMetrics` before `renderProductionFlowTestMetrics` when `WORKER_METRICS_PORT` is set.
- **`src/integration/bullmq-queue-depth.integration.test.ts`** — Runs when `REDIS_URL` is set (`describe.runIf`).

### `apps/api`

- **`src/integration/api-health-metrics.integration.test.ts`** — `/health`, `/metrics` inject tests; sets `COMPANY_CONFIG_DIR` relative to package root for monorepo-wide Vitest runs.
- **`src/integration/api-validation-workflows.integration.test.ts`** — Workflow trigger 401/503 (no Redis), secured GET `/api/v1/reports` 401; same `COMPANY_CONFIG_DIR` pattern.

### `packages/platform-adapters`

- **`src/integration/mock-adapter-metrics.integration.test.ts`** — Meta / GA4 / GSC / TikTok mock `fetchMetrics` integration-style checks.

### `tests/integration`

- **`vitest.config.ts`** — `root` = `tests/integration` so the workspace Vitest project only runs files in this directory.
- **`company-config-cross-package.integration.test.ts`** — Parses API company JSON fixtures with `companyConfigSchema`.

### `deploy/observability`

- **`prometheus/alerts/queues.yml`** — `AgenticVerdictHighQueueDepth`, `AgenticVerdictSlowQueueProcessing`.
- **`prometheus/alerts/database-queries.yml`** — `AgenticVerdictElevatedSlowQueries`.
- **`grafana/provisioning/dashboards/json/queue-health.json`** — Queue depth, p90 duration, p90 wait.
- **`grafana/provisioning/dashboards/json/database-performance.json`** — p95 query duration, slow-query rate.

### `docs`

- **`06-reference/localization/arabic-glossary.md`** — P2-2 review package.
- **`03-development-phases/phase-03-report-generation/arabic-native-review-playbook.md`** — Glossary link (terminology checklist).

---

## Changed

### `packages/observability`

- **`src/index.ts`** — Exports queue and database metric helpers.

### `deploy/observability/prometheus.yml`

- **`rule_files`** — Includes `queues.yml` and `database-queries.yml`.

### `vitest.config.ts` (repo root)

- **`testProjects`** — Adds `"tests/integration"` for `pnpm test:unit` / root Vitest.

### `package.json` (repo root)

- **`devDependencies`** — `@agenticverdict/config` for `tests/integration` imports.

### `docs/06-reference/runbooks/database-performance.md`

- Diagnosis step for Prometheus DB metrics and Grafana UID `av-database-performance`.

---

## Configuration / operations

| Variable / setting                                                                                       | Purpose                                                                                          |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `WORKER_METRICS_PORT`                                                                                    | When set, worker HTTP server refreshes queue depth gauges before each `/metrics` scrape.         |
| `REDIS_URL`                                                                                              | Enables `bullmq-queue-depth.integration.test.ts` (optional).                                     |
| `createDatabaseClient(..., { queryMetrics: { enabled: true, slowThresholdMs?: number, onSlowQuery? } })` | Emits `agenticverdict_db_*` metrics; wire in API/worker where a shared DB client is constructed. |

---

## Verification commands

```bash
pnpm check:cycles
pnpm exec turbo run test typecheck --filter=@agenticverdict/observability --filter=@agenticverdict/database --filter=@agenticverdict/worker --filter=@agenticverdict/api --filter=@agenticverdict/platform-adapters
pnpm exec vitest run --config tests/integration/vitest.config.ts
pnpm --filter @agenticverdict/api exec vitest run src/integration/

# With Redis (optional worker integration):
# REDIS_URL=redis://localhost:6379 pnpm --filter @agenticverdict/worker exec vitest run src/integration/bullmq-queue-depth.integration.test.ts

# Metrics spot-check (worker up with WORKER_METRICS_PORT):
# curl -s http://localhost:9464/metrics | grep agenticverdict_queue_
```

---

## Gaps & follow-ups (expected for P2)

| Item                        | Notes                                                                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Integration % target (25%)  | This slice adds **11** new integration-style cases plus existing repo integration tests; continue adding DB-backed API tests when `TestDatabase` / containers are standardized. |
| Arabic native sign-off      | Glossary and playbook prepared; reviewer engagement and `ar.json` edits are **out of band**.                                                                                    |
| pgBouncer                   | Still operational (see runbook); not automated in code.                                                                                                                         |
| API `/metrics`              | Does not yet call `refreshBullmqQueueDepthMetrics` (worker-only); API DB metrics require enabling `queryMetrics` where the DB client is created.                                |
| Validation route 400 bodies | Some `/api/v1/*/validate` error payloads serialize as `{}` under current Fastify response schema; tracked separately from this P2 slice.                                        |

---

## Related documents

- `REMEDIATION_PLAN_2026-04-08.md` — P2-1 … P2-4 definitions.
- `PRODUCTION_READINESS_AUDIT_2026-04-08.md` — Source audit (referenced by remediation plan).
