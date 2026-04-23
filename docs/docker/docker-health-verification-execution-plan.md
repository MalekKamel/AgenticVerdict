# Docker health verification — execution plan

This document is a **development and operations runbook** for verifying that AgenticVerdict’s Docker implementation is healthy after changes—or on a recurring basis—with steps grounded in the repository’s Compose files, Dockerfiles, and scripts.

**Authoritative references**

- [README](./README.md) (index)
- [Getting started](./getting-started.md), [Compose and networking](./compose-and-networking.md), [Container images](./container-images.md)
- [Environment and secrets](./environment-and-secrets.md), [Operations](./operations.md), [Observability](./observability.md), [Security](./security.md), [Testing](./testing.md)

**Conventions**

- Run all commands from the **repository root** unless noted.
- When multiple Compose files are used, **repeat the same `-f` list** for `up`, `down`, `ps`, `logs`, and `exec` so Docker resolves the correct project and services.
- **Pass** means the step completes with expected output and no blocking errors; **fail** means stop, capture logs, and use [Troubleshooting](#troubleshooting).

---

## 1. Prerequisites

| Requirement                | Verification                                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Docker Engine + Compose v2 | `docker version`, `docker compose version`                                                                            |
| Node.js 20 + pnpm          | `node -v`, `pnpm -v` (host builds/tests; `pnpm db:up` uses base Compose only)                                         |
| Sufficient disk and RAM    | Rough guide: ≥ 10 GB free disk for images/build cache; ≥ 4 GB RAM for full stack (more for observability / E2E)       |
| Ports available (defaults) | `5432`, `6379`; with apps: `3000`, `4000`; observability: `9090`, `3001`, `127.0.0.1:3100`; pgAdmin: `127.0.0.1:5050` |
| Clone + read access        | Repository matches current `docs/docker/` and compose paths                                                           |

---

## 2. Pre-flight checklist

Complete before first `up` or after a major environment reset.

1. **Engine sanity:** `docker info` succeeds; no critical daemon errors.
2. **Port conflicts:** Nothing else bound to required ports (`lsof -i :5432` / `ss -tlnp` as appropriate).
3. **Secrets for app overlay:** `./scripts/generate-secrets.sh` has been run so `./secrets/jwt_secret.txt` exists (mode `600`). Required for `docker-compose.apps.yml` API service.
4. **Seccomp path:** `deploy/security/seccomp-profile.json` exists (referenced by Compose `security_opt`).
5. **Optional overlays:** If using observability or backup, confirm additional disk and (for Falco) **Linux** host and acceptance of **privileged** runtime.
6. **Clean vs preserve data:** Decide whether this run is allowed to use `docker compose down -v` (**destructive** to named volumes). Skip `-v` when validating persistence.

---

## 3. Compose file sets (reference)

| Stack                     | Files (in order)                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Base infrastructure       | `docker-compose.yml` (includes `docker-compose.networks.yml`)                                                   |
| Apps on top of base       | `-f docker-compose.yml -f docker-compose.apps.yml`                                                              |
| + Observability           | Add `-f docker-compose.observability.yml`                                                                       |
| + pgAdmin                 | Add `-f docker-compose.pgadmin.yml`                                                                             |
| + Falco (Linux)           | Same as observability, add `--profile security`                                                                 |
| + Scheduled DB backups    | `-f docker-compose.yml -f deploy/docker-compose.backup.yml`                                                     |
| Production-shaped example | `deploy/docker-compose.production.example.yml` (+ optional `deploy/docker-compose.security-linux.override.yml`) |

Define shell variables to avoid mistakes:

```bash
export COMPOSE_BASE="-f docker-compose.yml"
export COMPOSE_APPS="-f docker-compose.yml -f docker-compose.apps.yml"
export COMPOSE_FULL_OBS="$COMPOSE_APPS -f docker-compose.observability.yml"
export COMPOSE_PGADMIN="-f docker-compose.yml -f docker-compose.pgadmin.yml"
```

---

## 4. Phased execution plan

### Phase A — Tooling and project context

| Step | Action                                          | Pass criteria                                   |
| ---- | ----------------------------------------------- | ----------------------------------------------- |
| A.1  | `docker compose version`                        | Compose v2 reported                             |
| A.2  | `docker compose $COMPOSE_BASE config`           | Renders merged config without errors            |
| A.3  | Optional: `docker compose $COMPOSE_APPS config` | Merges apps + secrets definition without errors |

---

### Phase B — Image build integrity (apps overlay)

Run when Dockerfiles, `package.json`, lockfile, or `scripts/dockerPrebuild.mjs` change.

| Step | Action                                                                          | Pass criteria                                                                                                                                  |
| ---- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| B.1  | `docker compose $COMPOSE_APPS build --no-cache` (or `up -d --build` in Phase C) | All images build; Node 20 / `dockerPrebuild` gate passes                                                                                       |
| B.2  | Optional standalone builds                                                      | Per [getting-started](./getting-started.md): `docker build -f apps/frontend/Dockerfile -t agenticverdict/frontend:local .` (repeat api/worker) |

**Notes:** Frontend image uses Next standalone + distroless runner; API/worker use `tsx` at runtime. Worker runtime policy uses `AGENTICVERDICT_STUB_REPORT_FORMATS=1` only for dev/test stub runs, and `0` in production-like stacks.

---

### Phase C — Base stack: Postgres, Redis, network, volumes

| Step | Action                                                                                   | Pass criteria                                                                                                                                  |
| ---- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| C.1  | `docker compose $COMPOSE_BASE up -d`                                                     | Exit code 0                                                                                                                                    |
| C.2  | `docker compose $COMPOSE_BASE ps`                                                        | `postgres`, `redis` **running** and **healthy**                                                                                                |
| C.3  | `docker compose $COMPOSE_BASE exec -T postgres pg_isready -U postgres -d agenticverdict` | `accepting connections`                                                                                                                        |
| C.4  | `docker compose $COMPOSE_BASE exec -T redis redis-cli ping`                              | `PONG`                                                                                                                                         |
| C.5  | Network                                                                                  | `docker network inspect` shows `agenticverdict` bridge with subnet `172.28.0.0/16` (see [compose-and-networking](./compose-and-networking.md)) |
| C.6  | Volumes                                                                                  | `docker volume ls` shows project volumes for `pgdata`, `redis_data` (names prefixed by project)                                                |

**Persistence spot-check (optional):** Create a test table or key, `docker compose $COMPOSE_BASE restart postgres redis`, confirm data still present. Use `down` **without** `-v` to keep volumes.

---

### Phase D — Application overlay: frontend, API, worker

| Step | Action                                       | Pass criteria                                                                                                                                |
| ---- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| D.0  | `./scripts/generate-secrets.sh`              | `secrets/jwt_secret.txt` exists                                                                                                              |
| D.1  | `docker compose $COMPOSE_APPS up -d --build` | All services **running**; postgres/redis **healthy** first                                                                                   |
| D.2  | `docker compose $COMPOSE_APPS ps`            | `frontend`, `api`, `worker` running (worker has no published ports)                                                                          |
| D.3  | HTTP — frontend                              | `curl -fsS http://127.0.0.1:3000/api/health` succeeds                                                                                        |
| D.4  | HTTP — API                                   | `curl -fsS http://127.0.0.1:4000/health` succeeds                                                                                            |
| D.5  | **Scripted check**                           | `WEB_HEALTH_URL=http://127.0.0.1:3000/api/health API_HEALTH_URL=http://127.0.0.1:4000/health ./scripts/health-check.sh` exits **0**          |
| D.6  | Worker                                       | `docker compose $COMPOSE_APPS logs worker --tail 80` shows clean startup (no fatal Redis/DB errors; process stays up). Adjust tail as needed |
| D.7  | In-container DNS (optional)                  | From `api`: reach `postgres:5432` / `redis:6379` via app behavior or tool available in image (API image includes `wget`)                     |

**Important:** Compose does **not** automatically run DB migrations or seeds. If health endpoints require schema, run Drizzle against `DATABASE_URL` per [testing](./testing.md) before expecting full application behavior.

**Image HEALTHCHECK:** Frontend and API Dockerfiles define container health checks; `docker inspect --format='{{.State.Health.Status}}' <container>` should trend to `healthy` after start periods.

---

### Phase E — Observability overlay (optional)

| Step | Action                                   | Pass criteria                                                                                                                           |
| ---- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| E.1  | `docker compose $COMPOSE_FULL_OBS up -d` | Prometheus, Loki, Promtail, Grafana start                                                                                               |
| E.2  | URLs                                     | Grafana `http://localhost:3001`, Prometheus `http://localhost:9090`, Loki `http://127.0.0.1:3100` respond                               |
| E.3  | Promtail                                 | Logs show container discovery activity; on Docker Desktop, if logs missing, verify socket mount per [observability](./observability.md) |
| E.4  | Falco (Linux only)                       | `docker compose $COMPOSE_FULL_OBS --profile security up -d`; container running; review Falco logs for driver errors                     |

Volumes: `prometheus_tsdb`, `loki_data`, `grafana_data` should exist for the project.

---

### Phase E2 — pgAdmin overlay (optional)

| Step | Action                                  | Pass criteria                                                                                     |
| ---- | --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| E2.1 | `docker compose $COMPOSE_PGADMIN up -d` | `pgadmin` container running                                                                       |
| E2.2 | UI reachability                         | `http://127.0.0.1:5050` responds (or overridden `PGADMIN_PORT`)                                   |
| E2.3 | DB connectivity from pgAdmin            | Can register/connect to server host `postgres`, port `5432`, DB `agenticverdict` over the network |

Volume `pgadmin_data` should exist for the project after first startup.

---

### Phase F — Backup overlay (optional)

| Step | Action                                                                           | Pass criteria                                                                                                          |
| ---- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| F.1  | `docker compose -f docker-compose.yml -f deploy/docker-compose.backup.yml up -d` | `postgres-backup` running, depends on healthy `postgres`                                                               |
| F.2  | After schedule or manual trigger per image docs                                  | Files appear under volume `pg_backups` (inspect with `docker run --rm -v <vol>:/v alpine ls /v` or documented pattern) |
| F.3  | One-off host backup                                                              | `./scripts/backup-postgres.sh` produces `./backups/backup-*.sql.gz` when base stack is up                              |

---

### Phase G — Security and hardening verification (optional but recommended after security-related changes)

Aligns with defaults documented in [security](./security.md).

| Step | Action                                             | Pass criteria                                                                                                                                                                                |
| ---- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G.1  | `./scripts/compliance/verify-runtime-hardening.sh` | Read-only root where expected; **Postgres** typically shows empty or minimal `CapDrop` (see [security](./security.md)); **Redis** shows `Config.User` `999:999`; apps show `cap_drop: [ALL]` |
| G.2  | `./scripts/compliance/verify-networks.sh`          | `agenticverdict` network driver/subnet/attachments consistent                                                                                                                                |
| G.3  | AppArmor (Linux)                                   | If using `deploy/docker-compose.security-linux.override.yml`, profile loaded on host per [security](./security.md); containers start                                                         |

**Supply chain:** For CI-aligned verification, see [continuous-integration](./continuous-integration.md) (Trivy, SBOM, Cosign).

---

### Phase H — Teardown and regression modes

| Mode                                         | Command                                 | Use when                                   |
| -------------------------------------------- | --------------------------------------- | ------------------------------------------ |
| Stop, keep volumes                           | `docker compose <same -f list> down`    | Daily dev; preserve DB                     |
| Stop + remove volumes                        | `docker compose <same -f list> down -v` | Clean slate (**data loss**)                |
| Quick regression (after small Docker change) | Phases A (light), C.1–C.4, D.3–D.5      | Fast signal                                |
| Full audit                                   | All phases applicable to your stack     | Release prep, security reviews, onboarding |

---

## 5. Pass/fail summary

| Area          | Primary signals                                                   |
| ------------- | ----------------------------------------------------------------- |
| Builds        | `docker compose build` / `up --build` succeeds                    |
| Orchestration | `docker compose ps` — expected services **running** / **healthy** |
| Data plane    | `pg_isready`, `redis-cli ping`, optional persistence check        |
| App plane     | `curl` health URLs + `./scripts/health-check.sh` exit 0           |
| Worker        | Stable process, no fatal errors in logs                           |
| Observability | Grafana/Prometheus/Loki reachable; Promtail shipping              |
| Security      | Compliance scripts + documented seccomp/AppArmor behavior         |

---

## Troubleshooting

| Symptom                                                                       | Likely cause                                                      | What to do                                                                                                   |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `jwt_secret` / file not found                                                 | Secrets not generated                                             | Run `./scripts/generate-secrets.sh`; confirm `./secrets/jwt_secret.txt`                                      |
| Port already allocated                                                        | Host conflict                                                     | Stop conflicting service or change published ports in a local override (document deviations)                 |
| API unhealthy / 5xx                                                           | DB not migrated, bad `DATABASE_URL`, JWT unreadable               | Check `docker compose ... logs api`; verify secret mount and DB readiness                                    |
| Frontend unhealthy                                                            | Next build/runtime error                                          | `docker compose ... logs frontend`; verify `postgres`/`redis` healthy first                                  |
| Worker exits / restarts                                                       | Missing `REDIS_URL`, Redis unreachable                            | Confirm `docker-compose.apps.yml` env and `redis` health                                                     |
| `seccomp` / permission errors                                                 | Profile path or engine support                                    | Confirm `deploy/security/seccomp-profile.json` path relative to compose invocation cwd                       |
| Promtail no logs                                                              | Docker socket on Desktop VM                                       | See [observability](./observability.md) Docker Desktop note                                                  |
| Falco fails to start                                                          | Non-Linux or kernel driver                                        | Use only on supported Linux; omit `--profile security` otherwise                                             |
| `health-check.sh` SKIP for Postgres/Redis                                     | Only base file used for `exec` while project differs              | Ensure base stack is up; run `exec` with the same project name (same directory and consistent compose usage) |
| Postgres exits (1); logs show `chmod` / `Operation not permitted` on data dir | `cap_drop: [ALL]` (or similar) on Postgres                        | Default `docker-compose.yml` omits cap drop on Postgres; see [security](./security.md)                       |
| Redis exits (1); logs show `failed switching to "redis"`                      | `no-new-privileges` and/or stock entrypoint + strict caps/seccomp | Default stack runs `redis-server` as `999:999`; see [security](./security.md)                                |
| Redis AOF errors after changing user/volume                                   | Old `redis_data` owned by root                                    | `docker compose down -v` (data loss) or fix volume ownership for UID 999                                     |
| pgAdmin port bind fails                                                       | Port `5050` already in use                                        | Set `PGADMIN_PORT` in `.env.docker` and restart `docker compose $COMPOSE_PGADMIN up -d`                      |
| pgAdmin cannot connect to DB                                                  | Incorrect host (using localhost) or base stack not running        | Use host `postgres` in pgAdmin server config; ensure base stack is healthy                                   |

**Diagnostic snippets**

```bash
docker compose $COMPOSE_APPS ps -a
docker compose $COMPOSE_APPS logs --tail 200 frontend api worker
docker inspect "$(docker compose $COMPOSE_APPS ps -q api)" --format '{{json .State.Health}}'
```

---

## Document control

- **Intent:** Repeatable verification aligned with repository Docker SSOT under `docs/docker/`.
- **When to update this plan:** New services, ports, volumes, health endpoints, or compose overlays are added; keep steps in sync with [README](./README.md) and linked docs.
