# Common Docker operations

This page complements [Operations](./operations.md) with **multi-file Compose** patterns, rebuild shortcuts, database migrations from the host, and backup/restore scripts. The repository root is the working directory unless noted otherwise.

**Recommended entry point:** use the root **`Makefile`** (`make help`) for stacks, validation, backups, and health checks so flags match [Quick start](./quick-start.md) and CI. The **Manual multi-file Compose** section below shows the same merges for advanced or one-off use.

## Makefile targets

The repository root **Makefile** wraps the commands below. Copy **`.env.docker.example`** to **`.env.docker`** (gitignored) if you want `COMPOSE_PROJECT_NAME` and `DATABASE_URL` picked up for `make db-migrate`. Run **`make help`** for the full target list.

| Target                                       | Intent                                                       | Equivalent (when you need raw compose)                                                                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `make dev`                                   | Infra + apps with dev overlay                                | `docker compose -f docker-compose.base-images.yml build` then `docker compose -f docker-compose.yml -f docker-compose.apps.yml -f docker-compose.dev.yml up -d --build` |
| `make dev-stop`                              | Stop the dev stack                                           | Same `-f` list as `up`, then `down`                                                                                                                                     |
| `make dev-logs`                              | Follow dev stack logs                                        | Same `-f` list, then `logs -f`                                                                                                                                          |
| `make apps-up` / `make apps-down`            | Production-like app images (no dev overlay)                  | `docker-compose.yml` + `docker-compose.apps.yml` only                                                                                                                   |
| `make build`                                 | Base images + app images                                     | `make build-base` + `make build-apps`                                                                                                                                   |
| `make build-all`                             | Build all packages (turbo)                                   | `pnpm build`                                                                                                                                                            |
| `make health`                                | HTTP + script probes                                         | `./scripts/health-check.sh` (see [Getting started](./getting-started.md#health-checks))                                                                                 |
| `make validate`                              | Compose merge / YAML checks                                  | `./scripts/docker-validate.sh`                                                                                                                                          |
| `make preflight`                             | Docker CLI, ports, `.env.docker` hint                        | `./scripts/docker-preflight.sh`                                                                                                                                         |
| `make backup`                                | Postgres gzip dump (+ Redis when up)                         | `./scripts/docker-backup.sh` (see also `./scripts/backup-postgres.sh`)                                                                                                  |
| `make restore-latest`                        | Restore newest `./backups/backup-*.sql.gz` non-interactively | `CONFIRM=1` + `./scripts/docker-restore.sh` (see [Backups and restore](#backups-and-restore))                                                                           |
| `make setup`                                 | Secrets + dirs + optional `.env.docker`                      | `./scripts/docker-setup.sh`                                                                                                                                             |
| `make dev-build`                             | Full image rebuild then dev `up --build`                     | `make build` then dev stack recreate                                                                                                                                    |
| `make logs`                                  | Alias for dev stack log follow                               | `make dev-logs`                                                                                                                                                         |
| `make ps` / `make ps-apps`                   | `docker compose ps` for dev or prod-like stack               | Repeat the same `-f` list as your `up`                                                                                                                                  |
| `make apps-logs` / `make ps-apps`            | Prod-like stack                                              | `docker-compose.yml` + `docker-compose.apps.yml` only                                                                                                                   |
| `make pgadmin-up` / `make pgadmin-down`      | Optional pgAdmin overlay on base stack                       | `docker-compose.yml` + `docker-compose.pgadmin.yml`                                                                                                                     |
| `make pgadmin-logs`                          | Follow optional pgAdmin logs                                 | Same `-f` list as pgadmin `up`, then `logs -f pgadmin`                                                                                                                  |
| `make infra-logs`                            | Postgres + Redis logs                                        | `docker compose -f docker-compose.yml logs -f`                                                                                                                          |
| `make db-dump`                               | Postgres-only backup script                                  | `./scripts/backup-postgres.sh`                                                                                                                                          |
| `make db-reset`                              | Destructive DB reset (local)                                 | `pnpm --filter @agenticverdict/database db:reset`                                                                                                                       |
| `make db-generate`                           | Generate Drizzle migration files                             | `pnpm --filter @agenticverdict/database db:generate`                                                                                                                    |
| `make db-studio`                             | Open Drizzle Studio UI                                       | `pnpm --filter @agenticverdict/database db:studio`                                                                                                                      |
| `make restore`                               | Restore a chosen `.sql.gz`                                   | `make restore BACKUP=backups/backup-….sql.gz`                                                                                                                           |
| `make test-e2e`                              | Playwright E2E                                               | `pnpm test:e2e`                                                                                                                                                         |
| `make clean-all`                             | Dev + prod-like `down -v`                                    | Deletes compose volumes for those stacks                                                                                                                                |
| `make prod-example-up` / `prod-example-down` | **Production example** under `deploy/`                       | Requires `POSTGRES_PASSWORD` and `secrets/jwt_secret.txt`                                                                                                               |
| `make sbom` / `make verify-image`            | Local Syft / Cosign                                          | Optional; CI uses `docker-scan.yml` / `docker-release.yml`                                                                                                              |

### Pipeline & quality targets

| Target               | Intent                                            | Equivalent           |
| -------------------- | ------------------------------------------------- | -------------------- |
| `make lint`          | Lint all packages (turbo)                         | `pnpm lint`          |
| `make lint-fix`      | Lint with auto-fix                                | `pnpm lint -- --fix` |
| `make lint-openapi`  | Lint OpenAPI specs                                | `pnpm lint:openapi`  |
| `make typecheck`     | Type-check all packages (turbo)                   | `pnpm typecheck`     |
| `make format`        | Format all files (prettier --write)               | `pnpm format`        |
| `make format-check`  | Check formatting (prettier --check)               | `pnpm format:check`  |
| `make ci`            | Full CI pipeline: lint → typecheck → test → build | `pnpm lint && ...`   |
| `make test-unit`     | Run root-level unit tests (vitest)                | `pnpm test:unit`     |
| `make test-coverage` | Run tests with coverage                           | `pnpm test:coverage` |
| `make check-cycles`  | Detect circular dependencies (madge)              | `pnpm check:cycles`  |
| `make check-all`     | Run all quality checks                            | Multiple checks      |

Run **`make help`** for every target. Production-like stack (no dev overlay) omits `-f docker-compose.dev.yml` and uses only `docker-compose.yml` + `docker-compose.apps.yml`—see [Getting started](./getting-started.md#common-stacks).

## Manual multi-file Compose

Always use the **same** `-f` ordering for `up`, `down`, `logs`, `exec`, and `build`.

**Infrastructure only:**

```bash
docker compose up -d
docker compose ps
docker compose logs -f postgres
```

**Full app stack (production-like Node env in containers):**

```bash
docker compose -f docker-compose.base-images.yml build
docker compose \
  -f docker-compose.yml \
  -f docker-compose.apps.yml \
  up -d --build
```

**App stack with api/worker dev + mocks:**

```bash
docker compose -f docker-compose.base-images.yml build
docker compose \
  -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f docker-compose.dev.yml \
  up -d --build
```

**Stop and remove containers** (add `-v` only if you intend to delete volumes):

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f docker-compose.dev.yml \
  down
```

**Optional pgAdmin overlay:**

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.pgadmin.yml \
  up -d

docker compose \
  -f docker-compose.yml \
  -f docker-compose.pgadmin.yml \
  logs -f pgadmin
```

## Logs, status, and single-service rebuilds

```bash
# Status (repeat your -f list if not using default compose.yml only)
docker compose -f docker-compose.yml -f docker-compose.apps.yml ps

# Follow one service
docker compose -f docker-compose.yml -f docker-compose.apps.yml logs -f api

# Last N lines
docker compose -f docker-compose.yml logs postgres --tail 50
```

**Rebuild a single service** after Dockerfile or dependency changes:

```bash
docker compose -f docker-compose.base-images.yml build
docker compose \
  -f docker-compose.yml \
  -f docker-compose.apps.yml \
  build api
docker compose \
  -f docker-compose.yml \
  -f docker-compose.apps.yml \
  up -d api
```

Enable BuildKit for cache mounts: `export DOCKER_BUILDKIT=1`. See [Compose and networking](./compose-and-networking.md#build-cache-and-faster-compose-builds).

## Database schema apply (host → Compose Postgres)

With the base stack exposing Postgres on **`localhost:5432`**, apply the consolidated baseline schema from the monorepo using the **`@agenticverdict/database`** package and a host **`DATABASE_URL`**:

```bash
export DATABASE_URL='postgresql://postgres:postgres@localhost:5432/agenticverdict'
pnpm --filter @agenticverdict/database db:push
```

For a full destructive reset (drops all schemas, applies baseline, seeds data):

```bash
pnpm --filter @agenticverdict/database db:reset
```

Credentials match the default dev database in [Compose and networking](./compose-and-networking.md#base-stack-docker-composeyml). Adjust the URL if you changed Postgres user, password, port, or database name.

## Backups and restore (gzip SQL)

| Script                                      | Role                                                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `scripts/backup-postgres.sh`                | One-off **`pg_dump`** via `docker compose -f docker-compose.yml exec`; writes `./backups/backup-<timestamp>.sql.gz` |
| `scripts/docker-backup.sh`                  | Same Postgres dump plus optional **Redis** `SAVE` + `docker cp` of `dump.rdb` when Redis is running                 |
| `scripts/docker-restore.sh`                 | **Destructive** restore from `.sql.gz`; interactive `YES` unless `CONFIRM=1` or `CONFIRM=YES`                       |
| `scripts/compliance/restore-from-backup.sh` | Older interactive restore (requires typing `YES`); same pipe-into-`psql` behavior                                   |

**Backup** requires the base stack running:

```bash
./scripts/backup-postgres.sh
```

**Restore** (example path; overwrites current DB data):

```bash
./scripts/compliance/restore-from-backup.sh ./backups/backup-20260409-120000.sql.gz
```

For scheduled sidecar backups and volume `pg_backups`, merge `deploy/docker-compose.backup.yml`; see [Compose files](./compose-files.md) and [Operations](./operations.md).

## Related documentation

- [Getting started](./getting-started.md) — stacks, secrets, health curls
- [Compose files](./compose-files.md) — each YAML layer and example `-f` combinations
- [Troubleshooting](./troubleshooting.md) — quick triage and links to verification runbooks
- [Security](./security.md) — hardening and compliance scripts under `scripts/compliance/`
- [Docker health verification](./docker-health-verification-execution-plan.md) — structured troubleshooting
