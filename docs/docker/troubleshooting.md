# Docker troubleshooting

Use this page for **fast triage**. Prefer **`make preflight`**, **`make validate`**, and **`make dev-logs`** / **`make apps-logs`** when debugging stacks you started via the root **Makefile**. Deep, checklist-style verification lives in [Docker health verification](./docker-health-verification-execution-plan.md). Stack layout and ports are in [Compose and networking](./compose-and-networking.md) and [Compose files](./compose-files.md).

## Symptom index

| Symptom                                              | What to check                                                                                                                                                                                                                            |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Port in use** (`bind: address already in use`)     | **`make preflight`** (runs `./scripts/docker-preflight.sh`); change host ports only if you customize Compose, or stop the conflicting process (`lsof -nP -iTCP:<port> -sTCP:LISTEN`).                                                    |
| **Container exits immediately**                      | **`make dev-logs`** or **`make apps-logs`**, or `docker compose … logs <service>`; compare Postgres/Redis hardening notes in [Security](./security.md); ensure the same `-f` list as your `up` (or use **`make`** consistently).         |
| **Frontend/API health fails**                        | **`make health`** or `curl -fsS http://127.0.0.1:3000/api/health` and `curl -fsS http://127.0.0.1:4000/health`; run `./scripts/health-check.sh`.                                                                                         |
| **API fails with JWT / secret errors**               | **`make setup`** or `./scripts/generate-secrets.sh` so `secrets/jwt_secret.txt` exists; see [Environment and secrets](./environment-and-secrets.md).                                                                                     |
| **Build slow or huge context**                       | Run `bash scripts/docker-prep.sh` before builds; see [Build optimization (implemented)](./build-optimization-implemented.md) and [Build best practices](./build-best-practices.md).                                                      |
| **Database connection from host**                    | Default URL: `postgresql://postgres:postgres@127.0.0.1:5432/agenticverdict`; ensure base stack is up (`docker compose up -d` or `make infra-up`).                                                                                        |
| **pgAdmin unavailable or login/connectivity issues** | Ensure `make pgadmin-up` is running, port `5050` is free (or set `PGADMIN_PORT`), and connect pgAdmin to host `postgres` (service DNS on `agenticverdict` network). Check logs with `make pgadmin-logs`.                                 |
| **Restore / migration errors**                       | Backups: [Common operations](./common-operations.md#backups-and-restore-gzip-sql); destructive restore requires an explicit confirmation in `scripts/compliance/restore-from-backup.sh` or `CONFIRM=1` with `scripts/docker-restore.sh`. |

## Commands that usually answer “why won’t it start?”

```bash
make preflight
make validate
make ps          # dev stack; use make ps-apps for production-like stack
make dev-logs    # or: make apps-logs
```

Raw Compose equivalent for prod-like **`ps`** / **`logs`**: `docker compose -f docker-compose.yml -f docker-compose.apps.yml ps` and the same `-f` list with `logs --tail 80 frontend api worker postgres redis`.

For **API/worker mock** behavior in containers, use **`make dev`** or merge **`docker-compose.dev.yml`** / **`deploy/docker-compose.dev.override.yml`** (see [Getting started](./getting-started.md#environment-modes-and-manual-testing)).

## CI and scans

- Compose YAML checks: `.github/workflows/docker-compose-validate.yml`
- Image builds: `.github/workflows/docker-build.yml` (PRs need label `trigger:build-docker` unless pushed to configured branches)
- Vulnerability / SBOM: `.github/workflows/docker-scan.yml` — details in [Continuous integration](./continuous-integration.md)

## Related

- [Operations](./operations.md) — lifecycle, logs, backups
- [Quick start](./quick-start.md) — minimal bring-up
- [Security](./security.md) — seccomp, read-only rootfs, AppArmor overlay
