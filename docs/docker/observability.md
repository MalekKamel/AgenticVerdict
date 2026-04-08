# Observability stack

Optional stack in `docker-compose.observability.yml`. Combine with base + apps as needed.

## Services

| Component      | Purpose                  | Config / notes                                                                                                                                              |
| -------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prometheus** | Metrics TSDB             | `deploy/observability/prometheus.yml` mounted read-only; volume `prometheus_tsdb`                                                                           |
| **Loki**       | Log aggregation          | `deploy/observability/loki/local-config.yaml`; volume `loki_data`; bound to **127.0.0.1:3100** on host                                                      |
| **Promtail**   | Container log shipping   | Read-only Docker socket; `deploy/observability/promtail/config.yml`                                                                                         |
| **Grafana**    | Dashboards               | Port **3001:3000**; provisioning in `deploy/observability/grafana/provisioning` (Prometheus + Loki datasources in `datasources.yml`); volume `grafana_data` |
| **Falco**      | Runtime security (Linux) | **Profile `security`**; **privileged**; custom rules `deploy/observability/falco/rules.d/agenticverdict-custom.yaml`; `FALCO_JSON_OUTPUT=true`              |

## Bring-up

```bash
docker compose -f docker-compose.yml -f docker-compose.apps.yml \
  -f docker-compose.observability.yml up -d
```

With Falco (Linux):

```bash
docker compose -f docker-compose.yml -f docker-compose.apps.yml \
  -f docker-compose.observability.yml --profile security up -d
```

## URLs (default local)

- Grafana: `http://localhost:3001`
- Prometheus: `http://localhost:9090`
- Loki: `http://127.0.0.1:3100` (loopback)

Provisioned **Loki** datasource UID: `av-loki`. Dashboard **Testing & container logs** (`/d/av-testing-logs`) shows Promtail-captured Docker logs (including the E2E `test-runner`). See [Observability + testing](./observability-and-testing.md).

## Scraping application metrics

`deploy/observability/prometheus.yml` includes **commented** example jobs for `api:4000` and `web:3000` when `/metrics` exists. Uncomment and ensure targets share the `agenticverdict` network.

## Docker Desktop note

Promtail uses `/var/run/docker.sock`. On macOS/Windows this path is typically forwarded from the host VM; if log collection fails, verify socket mount compatibility with your engine.
