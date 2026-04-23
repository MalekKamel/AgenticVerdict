# Compose topology and networking

Compose is split into **layers** you combine with multiple `-f` files. All application-facing stacks use the shared bridge network **`agenticverdict`** (`172.28.0.0/16`).

## File roles

| File                                                | Role                                                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `docker-compose.networks.yml`                       | Declares `agenticverdict` bridge + subnet; included by the base stack and observability        |
| `docker-compose.yml`                                | **Base infrastructure:** Postgres 16, Redis 7, volumes, hardening                              |
| `docker-compose.apps.yml`                           | **Optional apps:** build/run `frontend`, `api`, `worker`                                       |
| `docker-compose.dev.yml`                            | **Optional:** `api` / `worker` **development** image stage + mock env (merge with base + apps) |
| `docker-compose.test.yml`                           | **Optional:** `api` / `worker` **test** image stage + mock env (CI / deterministic runs)       |
| `docker-compose.observability.yml`                  | **Optional:** Prometheus, Loki, Promtail, Grafana; Falco under profile `security`              |
| `docker-compose.pgadmin.yml`                        | **Optional:** local pgAdmin UI for manual Postgres inspection                                  |
| `deploy/docker-compose.dev.override.yml`            | **Optional:** same role as `docker-compose.dev.yml` (deploy-prefixed path for overrides)       |
| `deploy/docker-compose.backup.yml`                  | **Optional:** scheduled `postgres-backup` sidecar                                              |
| `deploy/docker-compose.production.example.yml`      | **Example** production-style stack (image refs, stricter env)                                  |
| `deploy/docker-compose.security-linux.override.yml` | **Optional:** AppArmor profile for app containers                                              |

## Base stack (`docker-compose.yml`)

Includes `docker-compose.networks.yml`.

| Service    | Image                | Host port   | Notes                                                                                                                                      |
| ---------- | -------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `postgres` | `postgres:16-alpine` | `5432:5432` | User `postgres`, password `postgres`, DB `agenticverdict`; healthcheck `pg_isready`                                                        |
| `redis`    | `redis:7-alpine`     | `6379:6379` | AOF on volume `redis_data`; `redis-cli ping` healthcheck; runs as `999:999` with `redis-server` entrypoint (see [Security](./security.md)) |

**Hardening:** Both use `read_only: true`, `tmpfs` (`/tmp`; Postgres also `/run`), `seccomp=deploy/security/seccomp-profile.json`, and `deploy.resources` limits. **Postgres** keeps the default capability set (no `cap_drop: [ALL]`) so the image entrypoint can fix data-dir permissions. **Redis** omits `cap_drop` and `no-new-privileges` and does not use the stock entrypoint’s setuid drop; details and rationale are in [Security](./security.md). **Postgres** still sets `no-new-privileges:true`.

## Application overlay (`docker-compose.apps.yml`)

Build context is the **repository root**; Dockerfiles `apps/frontend/Dockerfile`, `apps/api/Dockerfile`, `apps/worker/Dockerfile`, plus shared bases under `docker/base/` (`Dockerfile.deps`, `Dockerfile.chromium`). See [Container images](./container-images.md#shared-base-images-local--ci).

| Service    | Host ports  | Depends on               | Notes                                                                                              |
| ---------- | ----------- | ------------------------ | -------------------------------------------------------------------------------------------------- |
| `frontend` | `3000:3000` | Postgres + Redis healthy | `NODE_ENV=production`, `TENANT_CONFIG_DIR=/app/configs/tenants`                                    |
| `api`      | `4000:4000` | Postgres + Redis healthy | `JWT_SECRET_FILE=/run/secrets/jwt_secret` (Compose secret from `./secrets/jwt_secret.txt`)         |
| `worker`   | (none)      | Postgres + Redis healthy | `REDIS_URL` required at runtime; `AGENTICVERDICT_STUB_REPORT_FORMATS=0` for production-like safety |

**Connection strings (in-container):** `DATABASE_URL=postgresql://postgres:postgres@postgres:5432/agenticverdict`, `REDIS_URL=redis://redis:6379`.

**Hardening:** Same pattern as base (read-only root, `tmpfs` `/tmp`, `cap_drop`, seccomp, limits).

## Build cache and faster Compose builds

- Enable BuildKit so Dockerfile cache mounts are active:
  - `export DOCKER_BUILDKIT=1`
- Build only changed services when possible:
  - `docker compose -f docker-compose.yml -f docker-compose.apps.yml build api`
- For API/worker, use build args from overlays (`TARGET_STAGE`, `NODE_ENV`) to match intended runtime behavior.
- Avoid routine `--no-cache`; reserve it for debugging cache corruption or dependency resolver edge cases.

For advanced local cache export/import workflows and troubleshooting, see [Build best practices](./build-best-practices.md) and [Getting started](./getting-started.md#buildkit-and-local-build-cache).

## Observability (`docker-compose.observability.yml`)

| Service      | Image (pinned in compose)    | Ports / access                                     |
| ------------ | ---------------------------- | -------------------------------------------------- |
| `prometheus` | `prom/prometheus:v2.55.1`    | `9090:9090`                                        |
| `loki`       | `grafana/loki:3.3.2`         | `127.0.0.1:3100:3100` (loopback only on host)      |
| `promtail`   | `grafana/promtail:3.3.2`     | Docker socket mount for log shipping               |
| `grafana`    | `grafana/grafana:11.4.0`     | `3001:3000` (UI; **frontend app remains on 3000**) |
| `falco`      | `falcosecurity/falco:0.39.2` | Profile `security`; **privileged**; Linux-oriented |

Promtail expects `/var/run/docker.sock` from the host (Docker Desktop typically still exposes this path).

## pgAdmin overlay (`docker-compose.pgadmin.yml`)

| Service   | Image                 | Host port                     | Notes                                                                                        |
| --------- | --------------------- | ----------------------------- | -------------------------------------------------------------------------------------------- |
| `pgadmin` | `dpage/pgadmin4:8.14` | `127.0.0.1:5050:80` (default) | Local-only binding by default, depends on healthy `postgres`, stores state in `pgadmin_data` |

`pgadmin` connects to Postgres over the shared `agenticverdict` network using service DNS (`postgres`), not `localhost`.

Typical usage:

```bash
docker compose -f docker-compose.yml -f docker-compose.pgadmin.yml up -d
```

## Backup overlay (`deploy/docker-compose.backup.yml`)

- Service: `postgres-backup` (`prodrigestivill/postgres-backup-local:16`)
- Volume: `pg_backups` for dump output
- Schedule/retention: `SCHEDULE`, `BACKUP_KEEP_DAYS`, `BACKUP_KEEP_WEEKS`, `BACKUP_KEEP_MONTHS` (defaults in file)
- Uses dev-aligned `POSTGRES_PASSWORD: postgres` for the sidecar environment

## Production example (`deploy/docker-compose.production.example.yml`)

- Compose project name: `agenticverdict-prod`
- Images: `${REGISTRY:-agenticverdict}/frontend|api|worker:${VERSION:-latest}`
- **Required:** `POSTGRES_PASSWORD` in the environment when invoking Compose
- JWT secret file: `../secrets/jwt_secret.txt` relative to `deploy/` (i.e. repo-root `secrets/`)
- Seccomp path in that file: `security/seccomp-profile.json` (**relative to `deploy/`**, i.e. `deploy/security/seccomp-profile.json`)
- **Postgres / Redis** use the same hardening pattern as the root `docker-compose.yml` (see [Security](./security.md)); keep these services in sync when editing either file.

Combine with AppArmor override when the profile is loaded on the host:

```bash
docker compose -f deploy/docker-compose.production.example.yml \
  -f deploy/docker-compose.security-linux.override.yml up -d
```

## Network merge behavior

Using multiple `-f` files merges services and networks into one project when run from the same directory and compatible `name` (default project name is derived from the directory). The `agenticverdict` network must be shared so apps and observability resolve each other by service name.
