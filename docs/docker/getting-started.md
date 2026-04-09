# Getting started with Docker

## Prerequisites

- **Docker Engine** and **Docker Compose v2** (`docker compose version`).
- **Node.js 20** and **pnpm** (for monorepo builds on the host and for `pnpm db:up`, which only starts the base stack).
- Repository cloned; commands below assume the **repository root** as the working directory.

## Environment modes and manual testing

The default application Compose overlay (`docker-compose.yml` + `docker-compose.apps.yml` only) runs **production-like** app services (`NODE_ENV=production`); mock platform adapters are **not** used on **API** or **worker** in that mode.

To run **API** and **worker** with **`NODE_ENV=development`** and mock adapters enabled in Docker, use one of:

- **Deploy override (documented in the manual testing guide):** add [`deploy/docker-compose.dev.override.yml`](../../deploy/docker-compose.dev.override.yml) — sets **`TARGET_STAGE=development`** and **`NODE_ENV=development`** build args for **api** and **worker** (multi-stage Dockerfiles), plus `AGENTICVERDICT_USE_MOCK_ADAPTERS=1`.
- **Root overlay (same intent):** add [`docker-compose.dev.yml`](../../docker-compose.dev.yml) at the repo root — merges the same **api** / **worker** build args and env; compose with  
  `docker compose -f docker-compose.yml -f docker-compose.apps.yml -f docker-compose.dev.yml up --build`.

For **integration-style runs** with **`NODE_ENV=test`** on API/worker, see [`docker-compose.test.yml`](../../docker-compose.test.yml).

**Web (Next.js)** in Docker stays a **production standalone** image: it does **not** load mock adapter code at runtime. Use **`pnpm dev`** on the host for web flows that need mocks, or rely on **API/worker** mocks for pipeline testing. See [Container images](./container-images.md) and [Manual testing guide](../06-reference/manual-testing-guide.md) (§2.1.1, §2.6).

**Configuration layers:** Runtime mock toggles and validated env-derived settings live in `@agenticverdict/config` (`configuration` export / `ConfigurationService`); build-time boundaries remain in `build-constants`. See `changelog/2026-04-08-layered-runtime-config-docker-mock-adapters.md`.

## One-time secrets (application stack)

The application overlay mounts JWT material from a Compose **secret** backed by a file:

- Path: `secrets/jwt_secret.txt` (created by the helper script; **not** committed — see [Environment and secrets](./environment-and-secrets.md)).

```bash
./scripts/generate-secrets.sh
```

This also generates `db_password.txt`, `redis_password.txt`, and `encryption_key.txt` for future production-style use. The **development** `docker-compose.yml` Postgres/Redis services still use the inline dev credentials documented in [Compose and networking](./compose-and-networking.md).

## Common stacks

### Infrastructure only (Postgres + Redis)

Equivalent to `pnpm run db:up` / `pnpm run db:down`:

```bash
docker compose up -d
docker compose ps
docker compose down
```

### Full application stack (web + API + worker + Postgres + Redis)

```bash
docker compose \
      -f docker-compose.yml \
      -f docker-compose.apps.yml \
      up -d --build
```

### Application stack with API/worker mocks (dev)

Same as above, plus a fourth file so **api** and **worker** build from the **`development`** image stage and run with mock-friendly env:

```bash
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

```bash
docker build -f apps/web/Dockerfile -t agenticverdict/web:local .
docker build -f apps/api/Dockerfile -t agenticverdict/api:local .
docker build -f apps/worker/Dockerfile -t agenticverdict/worker:local .
```

**API / worker multi-stage builds:** pass **`--build-arg TARGET_STAGE=development|test|production`** and matching **`NODE_ENV`** when you need a non-default stage (defaults: `TARGET_STAGE=production`, `NODE_ENV=production`). See [Container images](./container-images.md).

## Production-shaped example (advanced)

`deploy/docker-compose.production.example.yml` is a **starting point** for image-based deployment (not wired by default). It expects `POSTGRES_PASSWORD`, image tags via `REGISTRY` / `VERSION`, and paths relative to `deploy/` for seccomp. See [Compose and networking](./compose-and-networking.md) and [Security](./security.md).
