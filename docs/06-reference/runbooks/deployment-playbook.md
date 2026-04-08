# Production deployment playbook

Step-by-step guide for releasing **API**, **worker**, and related configuration after Phase 00–03 readiness. Aligns with **P1-3** in `REMEDIATION_PLAN_2026-04-08.md`.

## Pre-deployment checklist

- [ ] All **P0** remediation items closed (security docs accuracy, Grafana provisioning verified).
- [ ] Database backup or snapshot policy confirmed for the target environment.
- [ ] Feature flags and tenant configs reviewed (`configs/companies/*.json` or your live config source).
- [ ] Observability stack reachable: Prometheus scrapes `api:4000` and `worker:9464`; Grafana dashboards provisioned (including **Production SLA overview** and **Circuit breaker & retry health**).
- [ ] Image tags / Git revision recorded for rollback.

## Deployment order

1. **Database migrations** (if any) — run in a maintenance window or using zero-downtime strategy per your ORM runbook.
2. **API** — deploy new revision; ensure readiness probes pass before shifting traffic.
3. **Worker** — deploy after API is compatible with queue payloads; **drain or pause** sensitive queues if a breaking job schema change ships (coordinate with SRE).
4. **Config / secrets** — apply env and vault changes; restart affected services only as needed.

## Post-deployment verification

- [ ] `GET /health` on API returns **200** with expected JSON.
- [ ] Worker `GET /healthz` pings Redis; `GET /ready` returns **200**.
- [ ] Prometheus targets **UP** for `api` and `worker` jobs.
- [ ] No sustained **5xx** spike on API; worker job failure rate stable vs baseline.
- [ ] BullMQ queues draining (depth not growing unbounded).
- [ ] Structured logs appear (Pino JSON) with `requestId` / `tenantId` where applicable.

## Observability

- Grafana folder **AgenticVerdict**: [Grafana setup](grafana-setup.md).
- New dashboards: `production-sla-overview.json`, `circuit-breaker-health.json`.

## Rollback

If verification fails, follow [rollback-procedures.md](rollback-procedures.md) and capture timelines for post-mortem.

## Ownership

Primary: DevOps / SRE. Engineering leads sign off on application-level breaking changes.
