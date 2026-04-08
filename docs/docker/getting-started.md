# Getting started with Docker

## Prerequisites

- **Docker Engine** and **Docker Compose v2** (`docker compose version`).
- **Node.js 20** and **pnpm** (for monorepo builds on the host and for `pnpm db:up`, which only starts the base stack).
- Repository cloned; commands below assume the **repository root** as the working directory.

## Environment modes and manual testing

The default application Compose overlay runs **production-like** images (`NODE_ENV=production`); mock platform adapters are not available in that mode. For **local development**, use `pnpm dev` with `AGENTICVERDICT_USE_MOCK_ADAPTERS=1`, or add `deploy/docker-compose.dev.override.yml` to the Compose command line for a dev-mode stack with mocks. See [Manual testing guide](../06-reference/manual-testing-guide.md) (especially §2.1.1 and S1 preconditions) for how Docker prod, local dev, and the dev override differ.

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

## Production-shaped example (advanced)

`deploy/docker-compose.production.example.yml` is a **starting point** for image-based deployment (not wired by default). It expects `POSTGRES_PASSWORD`, image tags via `REGISTRY` / `VERSION`, and paths relative to `deploy/` for seccomp. See [Compose and networking](./compose-and-networking.md) and [Security](./security.md).
