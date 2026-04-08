# Changelog: P1 HIGH — Week 1–2 post-deployment remediation

**Date:** 2026-04-08  
**Scope:** Execution of **🟠 P1 - HIGH (Week 1-2 Post-Deployment)** from `REMEDIATION_PLAN_2026-04-08.md`: structured logging (Pino), circuit breaker and retry observability for platform adapters, production deployment and operational runbooks, live adapter validation artifact, Prometheus alert rules, and Grafana dashboard for breaker/retry health.

**Reference:** `REMEDIATION_PLAN_2026-04-08.md` sections P1-1 through P1-5.

---

## Summary

| Track                            | Delivered                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P1-1 Pino**                    | Shared `createPinoLogger` with tenant mixin (`@agenticverdict/core`), `LOG_LEVEL` / rotation envs via `@agenticverdict/config`, Fastify wiring + HTTP access hook, worker root + per-job log correlation.                                                                 |
| **P1-2 Circuit / retry metrics** | Prometheus: `agenticverdict_circuit_breaker_*`, `agenticverdict_retry_attempts`; breaker emits on state change; backoff records final attempt histogram. Grafana `circuit-breaker-health.json`; Prometheus rules `prometheus/alerts/circuit-breaker.yml` + compose mount. |
| **P1-3 Deployment docs**         | `deployment-playbook.md`, `environment-variables.md`, `rollback-procedures.md`, `health-checks.md`, `template.md`.                                                                                                                                                        |
| **P1-4 Live validation**         | `docs/06-reference/platform-validation-results.md` (procedure, checklist, results table).                                                                                                                                                                                 |
| **P1-5 Runbooks**                | `incident-response.md`, `queue-backlog.md`, `database-performance.md`, `platform-outages.md`, `tenant-issues.md`, `report-failures.md`.                                                                                                                                   |

---

## Added

### `packages/observability`

- **`src/registry.ts`** — Single `productionFlowTestRegistry` for all `/metrics` collectors.
- **`src/logger.ts`** (+ **`src/logger.test.ts`**) — Pino factory: pretty transport in dev (no `LOG_FILE`), JSON + optional `rotating-file-stream` when `LOG_FILE` set; tenant fields from ALS.
- **`src/platform-resilience-metrics.ts`** (+ **`src/platform-resilience-metrics.test.ts`**) — Gauge, counter, histograms for breaker state/transitions/durations and retry outcomes.

### `packages/config`

- **`src/schemas/observability.ts`** — `observabilityEnvSchema`, `resolveLogLevel()`, exported from package index.

### `apps/api`

- **`src/middleware/request-logging.ts`** — `http_access` structured logs (`method`, `url`, `statusCode`, `responseTimeMs`).
- **`src/server.ts`** — Uses `createPinoLogger("api")` when not under Vitest.

### `apps/worker`

- **`src/queues/logger.ts`** — `getWorkerRootLogger()` / `createJobLogger(queue, jobId)`; **`cli.ts`** and **`health.ts`** share root logger.
- **`src/queues/report-queues.ts`** — `job_start` logs per queue with tenant/report/workflow context.

### `packages/platform-adapters`

- **`circuit-breaker.ts`** — Optional `CircuitBreakerObservabilityLabels`; transition instrumentation via `@agenticverdict/observability`.
- **`rate-limit.ts`** — Optional `ExponentialBackoffTelemetry`; records final attempt histogram on success or exhaustion.
- **`adapter.ts`** — Default breaker labels + telemetry for `fetchMetrics` backoff.

### `deploy/observability`

- **`grafana/provisioning/dashboards/json/circuit-breaker-health.json`** — UID `av-circuit-breaker-health`.
- **`prometheus/alerts/circuit-breaker.yml`** — `PlatformCircuitBreakerOpen`, `HighPlatformRetryExhaustionRate`.
- **`prometheus.yml`** — `rule_files` entry for mounted alerts.

### `docs/06-reference`

- **`runbooks/deployment-playbook.md`**, **`environment-variables.md`**, **`rollback-procedures.md`**, **`health-checks.md`**, **`template.md`**
- **`runbooks/incident-response.md`**, **`queue-backlog.md`**, **`database-performance.md`**, **`platform-outages.md`**, **`tenant-issues.md`**, **`report-failures.md`**
- **`platform-validation-results.md`**

---

## Changed

### `packages/observability`

- **`src/test-metrics.ts`** — Registers metrics on shared `productionFlowTestRegistry` from `./registry` (no inline `new Registry()`).
- **`src/index.ts`** — Exports logger, registry, resilience record helpers, existing test-metric recorders.

### `docker-compose.observability.yml`

- Prometheus volume: `./deploy/observability/prometheus/alerts` → `/etc/prometheus/alerts`.

### `apps/api`

- **`src/middleware/tenant-route-als.ts`** — Handler `this` typed as `FastifyInstance` for Fastify 5 / `tsc` compatibility.
- **`src/services/analysis-store.ts`** — `PlatformType` assertion for provenance `dataSources` (typed platforms).

### `apps/worker`

- **`src/queues/job-types.ts`** — Zod 4 `z.record(key, value)` for `productionFlowEvidence`; exported **`WorkflowJobErrorCode`**; tightened `runPipelineWorkflow` typing in **`report-queues.ts`**.

### `packages/platform-adapters`

- **`src/adapter-factory.node-env.test.ts`** — `vi.resetModules()` + dynamic imports so `NODE_ENV=production` matches `IS_PRODUCTION`; `MetaPlatformAdapter` loaded from same graph as factory for `instanceof`.

### Dependencies

- **`@agenticverdict/observability`**: `pino`, `pino-pretty`, `rotating-file-stream`, `@agenticverdict/core`, `@agenticverdict/config`.
- **`@agenticverdict/platform-adapters`**: `@agenticverdict/observability`.

---

## Configuration / operations

| Variable                         | Purpose                                                                 |
| -------------------------------- | ----------------------------------------------------------------------- |
| `LOG_LEVEL`                      | Pino level (`trace` … `silent`).                                        |
| `LOG_FILE`                       | Optional log path; enables rotating file sink.                          |
| `LOG_MAX_SIZE` / `LOG_MAX_FILES` | Rotation size and retained files.                                       |
| `LIVE_ADAPTER_VALIDATION`        | `1` enables optional live Meta/GA4 tests (see platform validation doc). |

---

## Verification commands

```bash
pnpm check:cycles
pnpm exec turbo run test typecheck --filter=@agenticverdict/observability --filter=@agenticverdict/platform-adapters --filter=@agenticverdict/api --filter=@agenticverdict/worker
# Metrics spot-check (when stack up):
# curl -s http://localhost:4000/metrics | grep agenticverdict_circuit_breaker
# curl -s http://localhost:9464/metrics | grep agenticverdict_retry
```

---

## Follow-ups (outside this P1 slice)

- P2: deeper integration tests, queue latency histograms, DB slow-query metrics, Arabic review (per remediation plan).
- Tune Prometheus alert thresholds using production baselines once series are warm.

---

## References

- `REMEDIATION_PLAN_2026-04-08.md` — P1-1 … P1-5 definitions and timeline.
- `docs/06-reference/runbooks/grafana-setup.md` — Stack bring-up and dashboard provisioning.
- `PRODUCTION_READINESS_AUDIT_2026-04-08.md` — Original gap list.
