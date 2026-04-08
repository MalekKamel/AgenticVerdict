# Grafana setup and dashboard verification

This runbook covers the optional observability stack (Prometheus, Grafana, Loki, Promtail) and the **Production SLA overview** dashboard shipped in-repo.

## Prerequisites

- Docker with Compose v2
- Repository root as the working directory

## Start the stack

Baseline (metrics, logs, dashboards) per `docker-compose.observability.yml`:

```bash
docker compose -f docker-compose.yml -f docker-compose.apps.yml \
  -f docker-compose.observability.yml up -d
```

- **Grafana UI:** http://localhost:3001 (web app remains on :3000)
- **Prometheus UI:** http://localhost:9090
- **Loki:** http://127.0.0.1:3100 (ingestion; query via Grafana)

To run **only** Prometheus + Grafana + Loki + Promtail (no API/worker), omit `docker-compose.apps.yml`. Prometheus scrape targets `api:4000` and `worker:9464` will be **down** until the app compose file is included and services are healthy.

## Provisioning layout (verified)

| Host path                                           | Container path              | Purpose                                                                       |
| --------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------- |
| `deploy/observability/grafana/provisioning`         | `/etc/grafana/provisioning` | Grafana file provisioning (read-only mount)                                   |
| `.../provisioning/dashboards/dashboardprovider.yml` | same                        | Dashboard file provider: `path` → `/etc/grafana/provisioning/dashboards/json` |
| `.../provisioning/dashboards/json/*.json`           | same                        | Dashboard definitions (including `production-sla-overview.json`)              |
| `.../provisioning/datasources/datasources.yml`      | same                        | Prometheus (`uid: av-prometheus`, URL `http://prometheus:9090`) and Loki      |
| `.../provisioning/alerting/contact_points.yml`      | same                        | Unified alerting contact points (extend for Slack/email)                      |

The dashboard provider sets `options.path` to `/etc/grafana/provisioning/dashboards/json`, which matches the JSON directory in this repo when the parent `provisioning` folder is mounted as above.

## Production SLA dashboard

- **Title:** Production SLA overview (API & worker)
- **UID:** `av-production-sla-overview`
- **File:** `deploy/observability/grafana/provisioning/dashboards/json/production-sla-overview.json`
- **Datasource:** Prometheus `uid: av-prometheus` (must match `datasources.yml`)

After Grafana starts, open **Dashboards → Browse → AgenticVerdict** (folder from `dashboardprovider.yml`) and confirm the dashboard appears without manual import.

## Prometheus targets

Config: `deploy/observability/prometheus.yml`.

| Job      | Target        | Notes                                                    |
| -------- | ------------- | -------------------------------------------------------- |
| `api`    | `api:4000`    | `/metrics` on the API container                          |
| `worker` | `worker:9464` | Worker metrics port (`WORKER_METRICS_PORT` default 9464) |

In Prometheus **Status → Targets**, expect **UP** when `docker-compose.apps.yml` is applied and services are on the `agenticverdict` network. If targets are down, check that API/worker containers are running and reachable from the Prometheus container.

## Panels and “No data”

Dashboard queries use metrics such as `test_report_generation_duration_seconds_*`, `marketing_verdict_parse_*`, and `test_workflow_trigger_*`. If the application has not emitted those series yet, panels may show **No data** even when Prometheus and Grafana are healthy. That is expected until production-flow instrumentation receives traffic.

## Alert notification channels

1. Edit `deploy/observability/grafana/provisioning/alerting/contact_points.yml` (unified alerting). The file starts with an empty `contactPoints` list so provisioning stays valid; add Slack, email, or webhook receivers per [Grafana alerting provisioning](https://grafana.com/docs/grafana/latest/alerting/set-up/provision-alerting/contact-points/).
2. Redeploy Grafana or restart the container after changing provisioning files.
3. Configure notification policies in Grafana UI or add `policies.yml` under the same `alerting` directory when you are ready to route alerts.

Secrets (Slack webhook URLs, SMTP passwords) must come from your secret manager or environment injection policy; do not commit live credentials.

## Quick API checks

```bash
# Grafana health (anonymous access may be disabled; use admin session if configured)
curl -sf http://localhost:3001/api/health

# Prometheus ready
curl -sf http://localhost:9090/-/ready

# Optional: search dashboards (requires authentication if anonymous is off)
# curl -su admin:PASSWORD http://localhost:3001/api/search?type=dash-db
```

## Verification checklist (pre-deployment)

- [ ] `docker compose ... observability.yml` starts Grafana and Prometheus without provisioning errors in Grafana logs.
- [ ] Dashboard **Production SLA overview (API & worker)** appears under folder **AgenticVerdict** without manual JSON import.
- [ ] Prometheus **Configuration → Reload** succeeds if you edit `prometheus.yml` (lifecycle enabled in compose).
- [ ] With apps compose included, targets `api:4000` and `worker:9464` scrape successfully.
- [ ] Contact points and notification policies updated for your environment before relying on alerts.
