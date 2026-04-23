# Local Development with Docker

## Purpose

This guide defines the standard local Docker workflow for running AgenticVerdict in a production-like multi-service environment while keeping an efficient development loop.

Use this guide when you need:

- all core services running together (`frontend`, `api`, `worker`, `postgres`, `redis`),
- predictable environment behavior close to production,
- file-change-driven rebuild/restart loops using Docker Compose watch.

## Prerequisites

- Docker Engine + Docker Compose v2
- GNU Make
- Repository checked out locally

Optional but recommended:

- Node.js 20 + `pnpm` for host-side DB scripts (`make db-migrate`, `make db-seed`)

## One-time setup

From the repository root:

```bash
make setup
```

This prepares required local artifacts such as secrets and support directories.

Optional host checks:

```bash
make preflight
```

## Start the development stack

Bring up the Docker development stack (includes development-stage API/worker image settings and mock-friendly env values):

```bash
make dev
```

What this runs:

- builds required base images,
- starts `postgres` + `redis`,
- starts `frontend` + `api` + `worker` using:
  - `docker-compose.yml`
  - `docker-compose.apps.yml`
  - `docker-compose.dev.yml`

## Enable watch/rebuild loop

In a second terminal, start Compose watch:

```bash
make dev-watch
```

Watch mode rebuilds and restarts impacted services when files change in:

- `apps/frontend`
- `apps/api`
- `apps/worker`
- `packages`
- `configs`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `turbo.json`

Recommended daily loop:

1. `make dev` (once per session)
2. `make dev-watch` (keep running)
3. edit code
4. monitor logs with `make dev-logs` as needed

## Common commands

- Start dev stack without forcing rebuild: `make dev-up`
- Rebuild everything and restart dev stack: `make dev-build`
- Stop dev stack: `make dev-stop`
- Follow dev logs: `make dev-logs`
- Show container status: `make ps`

Production-like app images (without dev overlay): `make apps-up`

## Health verification

Use the bundled checks:

```bash
make health
make health-frontend
make health-api
make health-worker
```

Direct probes:

```bash
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:4000/health
```

## Rebuild strategy

Use targeted commands by intent:

- fast restart with existing images: `make dev-up`
- full app rebuild: `make dev-build`
- base image refresh + app rebuild from scratch-ish: `make build && make dev-up`

When dependency metadata changes (for example lockfile or workspace config), prefer `make dev-build`.

## Database workflow in Docker setup

Once containers are running:

- Apply schema sync: `make db-migrate`
- Seed test data: `make db-seed`
- Reset local DB (destructive): `make db-reset`
- Open psql shell: `make shell-db`

### Optional pgAdmin for DB inspection

When you need a visual DB admin workflow in local development:

- Start: `make pgadmin-up`
- Logs: `make pgadmin-logs`
- Stop: `make pgadmin-down`

Default URL: `http://127.0.0.1:5050` (configurable via `PGADMIN_PORT`).

## Troubleshooting

- Build path errors for frontend image:
  - verify Compose points to `apps/frontend/Dockerfile`
  - run `make validate` and then `make dev-build`
- Services unhealthy after startup:
  - run `make dev-logs`
  - run `make health`
- Changes not reflected:
  - ensure `make dev-watch` is running in a separate terminal
  - confirm edited files are inside configured watch paths
- State drift or stale containers:
  - run `make dev-stop`
  - rerun `make dev-build`

## Validation checklist

Before sharing Docker workflow updates with the team:

1. `make validate`
2. `make dev`
3. `make health`
4. `make dev-watch` and confirm at least one file-change rebuild path
5. `make dev-stop`
