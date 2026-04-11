# Getting started with Docker

## Prerequisites

- **Docker Engine** and **Docker Compose v2** (`docker compose version`).
- **GNU Make** (recommended): the repo root **`Makefile`** is the preferred way to run multi-file stacks (`make help`). Install Make via Xcode CLT on macOS or your package manager on Linux.
- **Node.js 20** and **pnpm** (for monorepo builds on the host and for `pnpm db:up`, which only starts the base stack).
- Repository cloned; commands below assume the **repository root** as the working directory.

## Recommended workflow (Makefile)

For day-to-day Docker work, use **`make`** so the same `-f` file lists are used as in [Common operations](./common-operations.md) and CI:

| Goal                                                             | Command                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| First-time bootstrap (secrets, dirs, optional `.env.docker`)     | `make setup`                                                                     |
| Host / port checks before `up`                                   | `make preflight`                                                                 |
| Validate compose after editing YAML                              | `make validate`                                                                  |
| Postgres + Redis only                                            | `make infra-up` / `make infra-down`                                              |
| Full stack, production-like app images                           | `make apps-up` / `make apps-down`                                                |
| Full stack, api/worker **development** stage + mock-friendly env | `make dev` / `make dev-stop`                                                     |
| Logs                                                             | `make dev-logs`, `make apps-logs`, or `make infra-logs`                          |
| Health probes                                                    | `make health` (and `make health-web` / `make health-api` / `make health-worker`) |

The sections below document the underlying **`docker compose`** invocations for custom merges (observability, backup sidecar, production example) and for operators who prefer the CLI directly.

## Environment modes and manual testing

The default application Compose overlay (`docker-compose.yml` + `docker-compose.apps.yml` only) runs **production-like** app services (`NODE_ENV=production`); mock platform adapters are **not** used on **API** or **worker** in that mode.

To run **API** and **worker** with **`NODE_ENV=development`** and mock adapters enabled in Docker, use one of:

- **Deploy override (documented in the manual testing guide):** add [`deploy/docker-compose.dev.override.yml`](../../deploy/docker-compose.dev.override.yml) — sets **`TARGET_STAGE=development`** and **`NODE_ENV=development`** build args for **api** and **worker** (multi-stage Dockerfiles), plus `AGENTICVERDICT_USE_MOCK_ADAPTERS=1`.
- **Root overlay (same intent):** add [`docker-compose.dev.yml`](../../docker-compose.dev.yml) at the repo root — merges the same **api** / **worker** build args and env; compose with  
  `docker compose -f docker-compose.yml -f docker-compose.apps.yml -f docker-compose.dev.yml up --build`.

For **integration-style runs** with **`NODE_ENV=test`** on API/worker, see [`docker-compose.test.yml`](../../docker-compose.test.yml).

**Web (Next.js)** in Docker stays a **production standalone** image: it does **not** load mock adapter code at runtime. Use **`pnpm dev`** on the host for web flows that need mocks, or rely on **API/worker** mocks for pipeline testing. See [Container images](./container-images.md) and [Manual testing guide](../../tests/docs/manual-testing-guide.md) (§2.1.1, §2.6).

**Configuration layers:** Runtime mock toggles and validated env-derived settings live in `@agenticverdict/config` (`configuration` export / `ConfigurationService`); build-time boundaries remain in `build-constants`. See `changelog/2026-04-08-layered-runtime-config-docker-mock-adapters.md`.

## One-time secrets (application stack)

The application overlay mounts JWT material from a Compose **secret** backed by a file:

- Path: `secrets/jwt_secret.txt` (created by the helper script; **not** committed — see [Environment and secrets](./environment-and-secrets.md)).

```bash
./scripts/generate-secrets.sh
```

This also generates `db_password.txt`, `redis_password.txt`, and `encryption_key.txt` for future production-style use. The **development** `docker-compose.yml` Postgres/Redis services still use the inline dev credentials documented in [Compose and networking](./compose-and-networking.md).

## Common stacks

Application images (**web**, **api**, **worker**) expect pre-built **workspace deps** and (for **worker**) **Chromium** layers. **`make dev`** and **`make apps-up`** run **`make build-base`** first; **`make build`** builds bases plus app images without starting containers.

`docker-compose.apps.yml` sets **`DEPS_IMAGE=agenticverdict/deps:local`** and **`CHROMIUM_IMAGE=agenticverdict/chromium-base:local`** for you.

### Infrastructure only (Postgres + Redis)

**Recommended:** `make infra-up`, then `docker compose ps` (default project), and `make infra-down` when finished.

Equivalent to `pnpm run db:up` / `pnpm run db:down`:

```bash
docker compose up -d
docker compose ps
docker compose down
```

### Full application stack (web + API + worker + Postgres + Redis)

**Recommended:** `make apps-up` (stops with `make apps-down`).

Raw Compose:

```bash
docker compose -f docker-compose.base-images.yml build
docker compose \
      -f docker-compose.yml \
      -f docker-compose.apps.yml \
      up -d --build
```

### Application stack with API/worker mocks (dev)

**Recommended:** `make dev` / `make dev-stop`.

Raw Compose (same as above, plus dev overlay):

```bash
docker compose -f docker-compose.base-images.yml build
docker compose \
      -f docker-compose.yml \
      -f docker-compose.apps.yml \
      -f docker-compose.dev.yml \
      up -d --build
```

Equivalent **deploy/** override: `-f deploy/docker-compose.dev.override.yml` instead of `docker-compose.dev.yml`.

If **postgres** or **redis** exit immediately, check logs (`docker compose ... logs postgres redis`) and compare with the troubleshooting table in [Docker health verification](./docker-health-verification-execution-plan.md#troubleshooting) and [Security](./security.md) (infrastructure hardening).

### Add observability (metrics, logs, Grafana)

```bash
docker compose \
      -f docker-compose.yml \
      -f docker-compose.apps.yml \
      -f docker-compose.observability.yml \
      up -d
```

### Add Falco (Linux hosts only, privileged)

```bash
docker compose \
      -f docker-compose.yml \
      -f docker-compose.apps.yml \
      -f docker-compose.observability.yml \
      --profile security \
      up -d
```

### Scheduled Postgres backups (sidecar)

```bash
docker compose \
      -f docker-compose.yml \
      -f deploy/docker-compose.backup.yml \
      up -d
```

## Health checks

```bash
curl -fsS http://127.0.0.1:3000/api/health   # web
curl -fsS http://127.0.0.1:4000/health       # API
./scripts/health-check.sh
```

Override URLs if you publish services elsewhere:

```bash
  WEB_HEALTH_URL=http://127.0.0.1:3000/api/health \
  API_HEALTH_URL=http://127.0.0.1:4000/health \
  ./scripts/health-check.sh
```

## Optional local image builds (without Compose)

Build shared layers first (same tags as Compose defaults), then pass **`DEPS_IMAGE`** (and **`CHROMIUM_IMAGE`** for worker):

```bash
docker build -f docker/base/Dockerfile.deps -t agenticverdict/deps:local .
docker build -f docker/base/Dockerfile.chromium -t agenticverdict/chromium-base:local .

docker build --build-arg DEPS_IMAGE=agenticverdict/deps:local -f apps/web/Dockerfile -t agenticverdict/web:local .
docker build --build-arg DEPS_IMAGE=agenticverdict/deps:local -f apps/api/Dockerfile -t agenticverdict/api:local .
docker build \
  --build-arg DEPS_IMAGE=agenticverdict/deps:local \
  --build-arg CHROMIUM_IMAGE=agenticverdict/chromium-base:local \
  -f apps/worker/Dockerfile \
  -t agenticverdict/worker:local \
  .
```

**API / worker multi-stage builds:** pass **`--build-arg TARGET_STAGE=development|test|production`** and matching **`NODE_ENV`** when you need a non-default stage (defaults: `TARGET_STAGE=production`, `NODE_ENV=production`). See [Container images](./container-images.md).

## BuildKit and local build cache

Use BuildKit for cache mounts and better layer reuse:

```bash
export DOCKER_BUILDKIT=1
docker buildx version
```

For local performance tracking:

```bash
chmod +x scripts/measure-build-performance.sh
scripts/measure-build-performance.sh web
scripts/measure-build-performance.sh api
scripts/measure-build-performance.sh worker
```

For local cache cleanup when troubleshooting:

```bash
docker builder prune -f
```

`buildkitd.toml` tuning (GC policy, parallelism) applies to dedicated BuildKit daemons and CI runners, not typical Docker Desktop usage. See [Build optimization (implemented)](./build-optimization-implemented.md#23-configure-buildkit-daemon-settings), [Build best practices](./build-best-practices.md), and the sample config at `docs/docker/buildkitd.toml.example`.

## Production-shaped example (advanced)

`deploy/docker-compose.production.example.yml` is a **starting point** for image-based deployment (not wired by default). It expects `POSTGRES_PASSWORD`, image tags via `REGISTRY` / `VERSION`, and paths relative to `deploy/` for seccomp. See [Compose and networking](./compose-and-networking.md) and [Security](./security.md).
