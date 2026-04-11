# Health checks

Standard probes for AgenticVerdict services.

## API

| Check    | Method | Path       | Expect                                                         |
| -------- | ------ | ---------- | -------------------------------------------------------------- |
| Liveness | GET    | `/health`  | `200`, body `{ "ok": true, "service": "@agenticverdict/api" }` |
| Metrics  | GET    | `/metrics` | `200`, Prometheus text including registered collectors         |

### Authenticated smoke (after deploy)

- Obtain a valid JWT for a test tenant.
- `GET /api/v1/reports` (or equivalent low-risk list endpoint) returns `200` and tenant-scoped data.

## Worker

| Check            | Path                                              | Expect                           |
| ---------------- | ------------------------------------------------- | -------------------------------- |
| Readiness        | GET `http://<host>:<WORKER_HEALTH_PORT>/ready`    | `200`, body `Ready`              |
| Liveness + Redis | GET `.../healthz`                                 | `200` when Redis `PING` = `PONG` |
| Metrics          | GET `http://<host>:<WORKER_METRICS_PORT>/metrics` | `200`, Prometheus text           |

## Dependencies

- **Redis**: `PING` from API/worker network perspective.
- **PostgreSQL** (when enabled): simple `SELECT 1` via admin or app pool.
- **Prometheus**: targets for `api` and `worker` jobs **UP** ([grafana-setup.md](grafana-setup.md)).

## Log sanity

- **Pino** JSON lines include `level`, `time`, `service` (`api` | `worker`).
- API request logs include `event: http_access`, `statusCode`, `responseTimeMs`.
- Worker job logs include `event: job_start`, `queue`, `jobId`, `tenantId` where applicable.
