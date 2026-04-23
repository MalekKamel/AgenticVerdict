# Tenant Logic Consolidation — Phase 4 Observability and Fairness Standardization

**Date:** 2026-04-25  
**Plan Source:** [`tenant-logic-consolidation-implementation-plan-2026-04-25.md`](./tenant-logic-consolidation-implementation-plan-2026-04-25.md)  
**Phase:** 4 (Observability and fairness standardization)

---

## Objective

Standardize tenant attribution and tenant-security semantics across HTTP and tRPC surfaces, and operationalize alerting/dashboard support for tenant-security and throttle-fairness anomalies.

---

## Implementation

### 1) Shared tenant security and fairness metrics

- Added `recordTenantSecurityEvent` and `recordTenantRateLimitHit` in:
  - `packages/observability/src/tenant-security-metrics.ts`
- Re-exported from `packages/observability/src/index.ts`.

### 2) Cross-surface tenant security event standardization

- `apps/api/src/middleware/auth.ts`
  - `tenantSecurityErrorReply` now emits `http_tenant_security` logs with stable fields:
    - `event`, `surface`, `code`, `requestId`, optional `tenantId`
  - records `agenticverdict_tenant_security_events_total{surface="http",code=...}`.
- `apps/api/src/middleware/jwt-tenant-context.ts`
  - calls updated `tenantSecurityErrorReply(request, reply, err)` path.
- `apps/api/src/trpc/init.ts`
  - existing `trpc_tenant_security` event now records tenant security metric with `surface="trpc"`.

### 3) Rate-limit fairness instrumentation

- `apps/api/src/middleware/rate-limit.ts`
  - records rate-limit hits in `agenticverdict_tenant_rate_limit_hits_total` labeled by:
    - `key_prefix`
    - `bucket_type` (`tenant` | `anonymous` | `global`)

### 4) Alerts and dashboard

- Added Prometheus rules:
  - `deploy/observability/prometheus/alerts/tenant-security.yml`
  - Alerts:
    - `AgenticVerdictTenantMismatchSpike`
    - `AgenticVerdictTenantContextMissingSpike`
    - `AgenticVerdictTenantThrottleAnomaly`
- Wired rule file in `deploy/observability/prometheus.yml`.
- Added Grafana dashboard:
  - `deploy/observability/grafana/provisioning/dashboards/json/tenant-security-and-fairness.json`

### 5) Alerting playbook

- Added dedicated runbook:
  - `docs/05-reference/runbooks/tenant-security-alerts-playbook.md`
- Linked from:
  - `docs/05-reference/runbooks/tenant-issues.md`
  - `docs/docker/observability.md`

---

## Exit criteria status (Phase 4)

| Exit criterion                                                               | Status   | Evidence                                                                                                                                                    |
| ---------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tenant attribution and event semantics consistent across HTTP and tRPC paths | Complete | `apps/api/src/middleware/auth.ts`, `apps/api/src/middleware/jwt-tenant-context.ts`, `apps/api/src/trpc/init.ts`                                             |
| Dashboards/alerts for tenant security frequencies and throttle anomalies     | Complete | `deploy/observability/prometheus/alerts/tenant-security.yml`, `deploy/observability/grafana/provisioning/dashboards/json/tenant-security-and-fairness.json` |
| Alerting playbook for mismatch/context incidents exists                      | Complete | `docs/05-reference/runbooks/tenant-security-alerts-playbook.md`                                                                                             |
