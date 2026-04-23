# Operations

**Prefer `make`:** the root **Makefile** is the recommended way to start/stop stacks and run health, backup, and validation targets (`make help`). For a short guided path, see [Quick start](./quick-start.md) and [Common operations](./common-operations.md).

## Lifecycle

```bash
# Infrastructure
docker compose up -d
docker compose down

# Apps + infrastructure (rebuild after Dockerfile or dependency changes)
docker compose -f docker-compose.yml -f docker-compose.apps.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.apps.yml down

# Tear down and remove volumes (data loss)
docker compose down -v
```

## Logs and status

```bash
docker compose ps
docker compose logs -f frontend
docker compose logs postgres --tail 50
```

When using multiple compose files, repeat the same `-f` list for `logs`, `exec`, and `down`.

## Health verification

- **Script:** `./scripts/health-check.sh` — HTTP checks for frontend `/api/health` and API `/health`; optional `docker compose exec` probes for Postgres/Redis when the default project is up.
- **Containers:** Frontend and API Dockerfiles define `HEALTHCHECK`; `depends_on: condition: service_healthy` gates app start on Postgres/Redis.

## Manual Postgres backup

**One-off dump** to `./backups/backup-<timestamp>.sql.gz` (host directory):

```bash
./scripts/backup-postgres.sh
```

Requires the **base** stack (`docker-compose.yml`) running; uses `docker compose -f docker-compose.yml exec -T postgres pg_dump`.

**Scheduled backups:** use `deploy/docker-compose.backup.yml` (volume `pg_backups`). See [Compose and networking](./compose-and-networking.md).

## Deploy directory bootstrap (servers)

`scripts/bootstrap-deploy-dirs.sh` creates a layout under **`DEPLOY_ROOT`** (default `/opt/agenticverdict`): `secrets`, `certs`, `logs`, `backups`, `scripts`, `monitoring` with tightened permissions.

## TLS (development)

`scripts/setup-tls.sh` generates self-signed material under `deploy/tls/` for local experimentation. Terminate production TLS at your ingress or load balancer.

## Compliance and verification helpers (`scripts/compliance/`)

| Script                        | Purpose                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `verify-database.sh`          | Postgres readiness + simple `SELECT 1` against `agenticverdict`                                                           |
| `verify-networks.sh`          | Inspect Docker networks matching `agenticverdict` pattern (driver, subnets, attachments)                                  |
| `verify-runtime-hardening.sh` | `docker inspect` read-only rootfs, `CapDrop`, `Config.User` (Postgres/Redis differ from apps — [Security](./security.md)) |
| `verify-backups.sh`           | Ensures `./backups` has recent `backup-*.sql.gz` (default freshness: 2 days)                                              |
| `verify-compliance-sql.sh`    | Lists Postgres extensions; reminds about future compliance SQL                                                            |
| `restore-from-backup.sh`      | Confirmed restore from `.sql.gz` into Compose Postgres (**destructive** to DB)                                            |
| `pitr-recovery.sh`            | Prints PITR checklist; exits non-zero (not automated here)                                                                |
| `rotate-secrets.sh`           | Prints manual secret rotation steps                                                                                       |
| `security-audit.sh`           | Docker/Compose version reminder + scan pointers                                                                           |
| `security-patch-deploy.sh`    | `docker compose pull` + `up -d` for base and optional apps file                                                           |
| `performance-review.sh`       | One-shot `docker stats` style snapshot                                                                                    |

These scripts support operational checklists; read each file before relying on it in production.
