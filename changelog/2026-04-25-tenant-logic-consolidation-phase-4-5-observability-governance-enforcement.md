# Changelog: Tenant logic consolidation — Phase 4 (observability/fairness) + Phase 5 (governance/cleanup/enforcement)

**Date:** 2026-04-25  
**Scope:** Execution of **Phase 4 — Observability and Fairness Standardization** and **Phase 5 — Governance, Cleanup, and Enforcement** from [`docs/architecture/tenant-logic-consolidation-implementation-plan-2026-04-25.md`](../docs/architecture/tenant-logic-consolidation-implementation-plan-2026-04-25.md), building on:

- [`changelog/2026-04-25-tenant-logic-consolidation-phase-0-baseline-freeze-and-traceability.md`](2026-04-25-tenant-logic-consolidation-phase-0-baseline-freeze-and-traceability.md)
- [`changelog/2026-04-25-tenant-logic-consolidation-phase-1-shared-resolver-consolidation.md`](2026-04-25-tenant-logic-consolidation-phase-1-shared-resolver-consolidation.md)
- [`changelog/2026-04-25-tenant-logic-consolidation-phase-2-3-context-propagation-and-db-hardening.md`](2026-04-25-tenant-logic-consolidation-phase-2-3-context-propagation-and-db-hardening.md)

**Execution mode:** systematic implementation with parallel tracks:

- **Track A (Phase 4):** cross-surface tenant attribution/event semantics + fairness instrumentation.
- **Track B (Phase 4):** operationalization via alerts, dashboard, and playbook.
- **Track C (Phase 5):** cleanup of legacy aliases + tenant-boundary enforcement in CI + governance checklist publication.

---

## Summary

### Phase 4 outcomes (observability and fairness)

- Standardized tenant security event semantics across HTTP and tRPC paths:
  - HTTP middleware now emits `http_tenant_security`.
  - tRPC formatter continues emitting `trpc_tenant_security`.
  - both surfaces now record shared tenant-security counters.
- Added tenant-specific observability counters in `@agenticverdict/observability`:
  - `agenticverdict_tenant_security_events_total{surface,code}`
  - `agenticverdict_tenant_rate_limit_hits_total{key_prefix,bucket_type}`
- Instrumented rate-limit middleware to record tenant fairness signals for `tenant`/`anonymous`/`global` bucket types.
- Added Prometheus alerts for:
  - tenant mismatch spikes,
  - missing-tenant-context spikes,
  - throttle fairness anomalies.
- Added Grafana dashboard for tenant security and fairness signals.
- Published dedicated runbook for tenant-security alert triage and rollback triggers.

### Phase 5 outcomes (governance, cleanup, enforcement)

- Removed canonical-export drift by replacing `*PublicTenant*` aliases with canonical shared resolver exports.
- Removed legacy `tenant_id` transport aliases from runtime tenant resolution (`x-tenant-id`, namespaced/tenant claim aliases).
- Migrated API tenant data-access guard usage to canonical `assertResourceTenantId`.
- Replaced local tenant UUID regex checks in API/frontend with shared core validator.
- Added CI-enforced tenant architecture boundary gate:
  - `scripts/tenant/verify-tenant-boundaries.mjs`
  - `pnpm run check:tenant-boundaries`
  - wired into `.github/workflows/ci.yml`.
- Published tenant-change PR governance checklist.

### Why this matters

- Closes remaining Phase 4 gap where tenant-security observability semantics diverged by surface.
- Converts tenant fairness from implicit behavior into explicit measurable telemetry + alerting.
- Hardens Phase 5 against regression by making legacy tenant alias reintroduction fail CI.

---

## Added

### `packages/observability`

- **`src/tenant-security-metrics.ts`**
  - `recordTenantSecurityEvent(surface, code)`
  - `recordTenantRateLimitHit(keyPrefix, bucketType)`

### `deploy/observability`

- **`prometheus/alerts/tenant-security.yml`**
  - `AgenticVerdictTenantMismatchSpike`
  - `AgenticVerdictTenantContextMissingSpike`
  - `AgenticVerdictTenantThrottleAnomaly`
- **`grafana/provisioning/dashboards/json/tenant-security-and-fairness.json`**
  - tenant security rate by code
  - HTTP vs tRPC security surface split
  - rate-limit hits by key prefix/bucket type
  - anonymous/tenant throttle fairness ratio

### `docs/05-reference`

- **`runbooks/tenant-security-alerts-playbook.md`**
  - alert inventory, triage matrix, mitigations, rollback triggers
- **`checklists/tenant-change-pr-checklist.md`**
  - required review/evidence checklist for tenant-impacting PRs

### `docs/architecture`

- **`tenant-logic-consolidation-phase-4-observability-and-fairness-standardization-2026-04-25.md`**
- **`tenant-logic-consolidation-phase-5-governance-cleanup-enforcement-2026-04-25.md`**

---

## Changed

### `apps/api`

- **`src/middleware/auth.ts`**
  - `tenantSecurityErrorReply` now accepts `request`, emits standardized HTTP tenant-security event, and records security metric.
- **`src/middleware/jwt-tenant-context.ts`**
  - switched to updated `tenantSecurityErrorReply(request, reply, err)` signature.
- **`src/trpc/init.ts`**
  - records tenant-security metric in error formatter for `TenantSecurityError`.
  - logs include `surface: "trpc"` for unified querying semantics.
- **`src/middleware/rate-limit.ts`**
  - records fairness metric on 429 path with bucket type (`tenant`, `anonymous`, `global`).
- **`src/middleware/request-logging.ts`**
  - migrated tenant UUID check to shared `@agenticverdict/core` validator.
- **`src/trpc/resolve-public-tenant-id.ts`**
  - migrated imports from alias names to canonical shared resolver names.
- **`src/trpc/routers/auth.ts`**
  - migrated resource ownership assertions to `assertResourceTenantId`.

### `packages/core`

- **`src/index.ts`**
  - removed exported alias names (`parseOptionalPublicTenantId`, etc.); canonical exports only.
- **`src/tenant-resolution.ts`**
  - removed support for legacy `x-tenant-id` and `tenant_id` JWT claim aliases.
  - exported `isTenantUuid` for shared validator usage.
- **`src/tenant-data-access.ts`**
  - added canonical `assertResourceTenantId`.
  - retained `assertResourceTenantId` as a deprecated compatibility shim.
- **`src/tenant-isolation.test.ts`**
  - updated tests to canonical `assertResourceTenantId`.

### `apps/frontend`

- **`src/lib/tenant/resolve-tenant-id-by-priority.ts`**
  - uses shared core UUID validator instead of local regex.
- **`src/lib/tenant/fetch-current-tenant-name.ts`**
  - uses shared core UUID validator instead of local regex.

### Root / CI

- **`scripts/tenant/verify-tenant-boundaries.mjs`**
  - fails build on forbidden legacy tenant alias patterns in runtime code.
- **`package.json`**
  - added `check:tenant-boundaries`.
- **`.github/workflows/ci.yml`**
  - added `Tenant architecture boundary check` step in quality pipeline.

### Docs

- **`docs/05-reference/runbooks/tenant-issues.md`**
  - linked tenant-security alerts playbook.
- **`docs/docker/observability.md`**
  - added tenant alerting section and references.
- **`deploy/observability/prometheus.yml`**
  - added rule-file include for `tenant-security.yml`.
- **`packages/observability/src/index.ts`**
  - exports tenant-security/fairness metric helpers.

---

## Plan mapping (Phase 4 + 5)

| Plan task                                                                                      | Delivered                                                                                                                                                            |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phase 4:** Standardize tenant attribution helper usage in logs/rate-limit/security events    | `request-logging.ts`, `auth.ts`, `jwt-tenant-context.ts`, `trpc/init.ts`, `rate-limit.ts`, shared metrics in `packages/observability`                                |
| **Phase 4:** Add dashboards/alerts for tenant security frequencies + tenant-throttle anomalies | Prometheus rules in `deploy/observability/prometheus/alerts/tenant-security.yml`; Grafana dashboard `tenant-security-and-fairness.json`                              |
| **Phase 4:** Alerting playbook for mismatch/context incidents                                  | `docs/05-reference/runbooks/tenant-security-alerts-playbook.md`                                                                                                      |
| **Phase 5:** Remove deprecated helpers and remaining alias pathways                            | canonical exports in `packages/core/src/index.ts`; transport alias removal in `packages/core/src/tenant-resolution.ts`; callsite migration to canonical helper names |
| **Phase 5:** Add lint/architecture checks to block drift                                       | CI gate `check:tenant-boundaries` (`scripts/tenant/verify-tenant-boundaries.mjs` + workflow wiring)                                                                  |
| **Phase 5:** Publish governance process and PR checklist                                       | `docs/05-reference/checklists/tenant-change-pr-checklist.md`; phase architecture docs                                                                                |

---

## Verification run

- `pnpm run check:tenant-boundaries`
- `pnpm --filter @agenticverdict/core exec vitest run src/tenant-isolation.test.ts src/public-tenant-resolution.test.ts`
- `pnpm --filter @agenticverdict/api exec vitest run src/middleware/request-logging.test.ts src/middleware/jwt-tenant-context.test.ts src/trpc/resolve-public-tenant-id.test.ts`
- `pnpm --filter @agenticverdict/frontend exec vitest run src/lib/tenant/resolve-tenant-id-by-priority.test.ts src/lib/tenant/tenant-resolution.test.ts src/lib/tenant/trpc-tenant-bridge.test.ts`
- `pnpm --filter @agenticverdict/core exec tsc --noEmit --pretty false`
- `pnpm --filter @agenticverdict/api exec tsc --noEmit --pretty false`
- `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false`
- `pnpm --filter @agenticverdict/observability exec tsc --noEmit --pretty false`

All verification commands above passed.

---

## References

- [`docs/architecture/tenant-logic-consolidation-implementation-plan-2026-04-25.md`](../docs/architecture/tenant-logic-consolidation-implementation-plan-2026-04-25.md)
- [`docs/architecture/tenant-logic-consolidation-phase-4-observability-and-fairness-standardization-2026-04-25.md`](../docs/architecture/tenant-logic-consolidation-phase-4-observability-and-fairness-standardization-2026-04-25.md)
- [`docs/architecture/tenant-logic-consolidation-phase-5-governance-cleanup-enforcement-2026-04-25.md`](../docs/architecture/tenant-logic-consolidation-phase-5-governance-cleanup-enforcement-2026-04-25.md)
- [`changelog/2026-04-25-tenant-logic-consolidation-phase-0-baseline-freeze-and-traceability.md`](2026-04-25-tenant-logic-consolidation-phase-0-baseline-freeze-and-traceability.md)
- [`changelog/2026-04-25-tenant-logic-consolidation-phase-1-shared-resolver-consolidation.md`](2026-04-25-tenant-logic-consolidation-phase-1-shared-resolver-consolidation.md)
- [`changelog/2026-04-25-tenant-logic-consolidation-phase-2-3-context-propagation-and-db-hardening.md`](2026-04-25-tenant-logic-consolidation-phase-2-3-context-propagation-and-db-hardening.md)
