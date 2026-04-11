# Changelog entry: P1 production readiness (audit remediation)

**Date:** 2026-04-08  
**Scope:** Execution of **🟠 P1 — HIGH (Production Readiness)** from `PHASE_00-03_CORE_AUDIT_REPORT.md`: expanded multi-tenant isolation coverage, concurrent API load matrix, Grafana SLA-oriented dashboard, durable report blob storage option, optional live platform adapter checks, and Redis-backed email suppression after bounces/complaints (API webhook + worker delivery).

**Test counts:** Isolation scenario counts match individual Vitest `it()` cases in `tenant-isolation-matrix.test.ts` (`grep -c "it(" apps/api/src/middleware/tenant-isolation-matrix.test.ts`).

---

## Summary

- **Tenant isolation:** Added **21** API tests (`tenant-isolation-matrix.test.ts`) covering store-level invariants, cross-tenant **404** behavior across report lifecycle routes, schedules, analysis results, template customization visibility, and delivery-metrics scoping.
- **Load matrix:** Added Vitest-driven parallel **GET /api/v1/reports** bursts for **1 / 5 / 10 / 25 / 50** concurrent requests with success and wall-clock assertions (`reports-concurrent-load-matrix.test.ts`). Root script: `pnpm test:p1-report-load-matrix`.
- **Observability:** Provisioned Grafana dashboard **`Production SLA overview (API & worker)`** (`uid: av-production-sla-overview`) targeting Prometheus metrics from `@agenticverdict/observability` (report generation histogram, verdict parse counters, workflow trigger enqueue/completion, worker job duration).
- **Report storage:** Introduced `report-blob-storage.ts` with **memory** (default / Vitest) and optional **filesystem** backend when `REPORT_BLOB_STORAGE_DIR` is set in non-test runs; `report-store` delegates blob I/O to this layer.
- **Delivery hardening:** Webhook ingestion of **bounced** / **complaint** events with `recipientEmail` calls `suppressRecipientForTenant` on the shared BullMQ **TCP Redis** (`REDIS_URL`). `defaultReportDeliveryProcessor` skips `sendReportEmail` when the recipient is in the suppression set, records `recipient_suppressed`, and still emits lifecycle webhooks where configured.
- **Live adapters:** Optional integration file `adapters-live-optional.integration.test.ts` (skipped unless `LIVE_ADAPTER_VALIDATION=1`) for Meta/GA4 smoke calls with operator-supplied env credentials.

---

## Added

### `deploy/observability/grafana/provisioning/dashboards/json`

- **`production-sla-overview.json`** — SLA-oriented panels over existing Prometheus scrape targets (`api:4000`, `worker:9464`).

### `specs/00-core`

- **`p1-phase-00-03-production-readiness-execution-plan-2026-04-08.md`** — Step-by-step P1 plan, verification commands, and sign-off checklist.

### `apps/api`

- **`src/services/report-blob-storage.ts`** (+ **`report-blob-storage.test.ts`**) — `ReportBlobStorage` interface, `MemoryReportBlobStorage`, `FileSystemReportBlobStorage`, env-driven backend selection.
- **`src/middleware/tenant-isolation-matrix.test.ts`** — Cross-tenant isolation matrix (**21** `it()` cases per `grep -c "it("`).
- **`src/routes/v1/reports-concurrent-load-matrix.test.ts`** — Concurrent authenticated load bursts.

### `apps/worker`

- **`src/services/delivery-suppression-redis.ts`** (+ **`delivery-suppression-redis.test.ts`**) — Redis set helpers `av:delivery:suppress:{tenantId}`.

### `tests/phase01-platform-integration`

- **`src/integration/adapters-live-optional.integration.test.ts`** — Opt-in live Meta/GA4 smoke (skipped by default).

### Root `package.json`

- **`test:p1-report-load-matrix`** — Runs only the P1 concurrent report-list load test file.

---

## Changed

### `apps/api`

- **`src/services/report-store.ts`** — Blob operations use `getReportBlobStorage()`; test reset clears memory backend and rebinds env backend.
- **`src/services/report-bullmq.ts`** — **`getBullmqRedisConnection()`** exported for shared Redis access (queues + suppression).
- **`src/routes/v1/reports.ts`** — After recording bounce/complaint webhook events, **`suppressRecipientForTenant`** when `REDIS_URL`-backed client exists; OpenAPI summary updated for blob storage env.

### `apps/worker`

- **`src/queues/report-queues.ts`** — **`defaultReportDeliveryProcessor(data, options?)`** with optional **`suppressionRedis`**; **`registerReportWorkers`** passes the worker connection into the default processor.
- **`src/index.ts`** — Re-exports **`suppressRecipientForTenant`**, **`isRecipientSuppressed`**, **`ReportDeliveryProcessorOptions`**.
- **`src/queues/report-delivery-schedule.test.ts`** — Coverage for suppressed vs allowed sends.

---

## Configuration / operations

| Variable                                            | Purpose                                                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `REPORT_BLOB_STORAGE_DIR`                           | Absolute or relative base directory for filesystem-backed report bytes (ignored when `VITEST=true`). |
| `REDIS_URL`                                         | Required for suppression writes (API) and enforcement (worker); same TCP Redis as BullMQ.            |
| `LIVE_ADAPTER_VALIDATION`                           | Set to `1` to enable optional live Meta/GA4 integration tests.                                       |
| `META_LIVE_ACCESS_TOKEN`, `META_LIVE_AD_ACCOUNT_ID` | Meta live smoke credentials.                                                                         |
| `GA4_LIVE_ACCESS_TOKEN`, `GA4_LIVE_PROPERTY_ID`     | GA4 live smoke credentials (property id as used by `Ga4PlatformAdapter.authenticate`).               |

---

## References

- `PHASE_00-03_CORE_AUDIT_REPORT.md` — P1 table (isolation tests, load testing, dashboards, storage, live validation, delivery hardening).
- `specs/00-core/p1-phase-00-03-production-readiness-execution-plan-2026-04-08.md` — Detailed execution checklist for this slice.
