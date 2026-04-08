# Docker health verification scripts

This directory contains **bash automation** that implements the phased checks described in the repository’s Docker health runbook:

**[docs/docker/docker-health-verification-execution-plan.md](../../docs/docker/docker-health-verification-execution-plan.md)**

Use these scripts after Docker-related changes, for onboarding, or on a recurring basis to confirm that Compose stacks, images, and health endpoints behave as documented.

---

## Contents

| File                             | Purpose                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `verify-docker-health.sh`        | Main driver: orchestrates phases A–G, optional teardown (phase H), logging, and dry-run mode                       |
| `../lib/docker-health-common.sh` | Shared helpers: repository root resolution, Compose file sets, assertions, worker log sanity checks                |
| `../verify-docker-health.sh`     | Thin wrapper at `scripts/verify-docker-health.sh` that `exec`s this directory’s driver (convenient from repo root) |

---

## Prerequisites

Align with the execution plan and [docs/docker/getting-started.md](../../docs/docker/getting-started.md):

- **Docker Engine** with **`docker compose`** available on `PATH`
- **curl** (HTTP probes and `scripts/health-check.sh`)
- Sufficient **disk** and **RAM** for the stacks you start (full apps + observability is heavier than base only)
- **Ports** not in conflict with defaults (e.g. `5432`, `6379`, `3000`, `4000`; observability adds `9090`, `3001`, `127.0.0.1:3100`)

Optional on the host (warn-only in preflight if missing):

- **Node.js 20** and **pnpm** — useful for host-side builds/tests; not required for Compose-only verification

---

## Quick start

From the **repository root**:

```bash
# Default path: phases A → C → D (compose config, base stack, apps up --build, HTTP + health-check.sh + worker logs)
./scripts/verify-docker-health.sh

# Same entrypoint, explicit path to this directory
./scripts/docker-health/verify-docker-health.sh
```

**First-time apps overlay:** ensure secrets exist. The driver runs `scripts/generate-secrets.sh` during phase D (and preflight may run it when phase `d` is selected) unless you pass `--skip-generate-secrets`.

**Faster signal when the stack is already running** (execution plan “quick regression” style):

```bash
./scripts/verify-docker-health.sh --quick
```

`--quick` runs phases **A**, **C**, and **D.3–D.5** only. The **web** and **API** containers must already be up and healthy enough to serve health URLs.

---

## Phase reference

Phases mirror the execution plan. You can run subsets with `--phase` (comma-separated, no spaces).

| Phase | What the driver does (summary)                                                                                                                                 |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A** | `docker compose version`; merged `config` for base (and apps when `b`, `d`, or `e` are selected)                                                               |
| **B** | `docker compose … build` for the apps file set (`--no-cache` when `--no-cache` is set)                                                                         |
| **C** | Base stack `up -d`; Postgres/Redis running + healthy; `pg_isready`; `redis-cli ping`; network subnet `172.28.0.0/16`; volume names for `pgdata` / `redis_data` |
| **D** | `generate-secrets.sh` (unless skipped); apps stack `up -d --build`; service checks; HTTP probes; `scripts/health-check.sh`; worker log sanity (tail)           |
| **E** | Observability overlay `up -d` (`docker-compose.observability.yml`); optional Falco via `--with-falco` on Linux; HTTP probes to Prometheus / Grafana / Loki     |
| **F** | Backup overlay `up -d`; `postgres-backup` running; optional `scripts/backup-postgres.sh`                                                                       |
| **G** | `scripts/compliance/verify-runtime-hardening.sh` and `scripts/compliance/verify-networks.sh`                                                                   |

**Phase H (teardown)** is not a letter flag: use `--teardown` or `--teardown-volumes` after a successful run. See [Teardown](#teardown) below.

---

## Default phase selection

If you **do not** pass `--phase`:

- Base default: **`a,c,d`**
- **`--with-build`** → **`a,b,c,d`**
- **`--with-obs`** → append **`,e`**
- **`--with-backup`** → append **`,f`**
- **`--with-compliance`** → append **`,g`**

Flags can be combined (for example `--with-build --with-obs` → `a,b,c,d,e`).

---

## Command-line options

| Option                    | Description                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `-h`, `--help`            | Print built-in usage                                                                                                                       |
| `-q`, `--quick`           | Phases `a,c,d` with **partial D** (HTTP + `health-check.sh` only). **Cannot** be combined with `--phase`                                   |
| `-n`, `--dry-run`         | Print **mutating** commands (`docker compose up/build/down`, etc.) instead of executing them; skips checks that require running containers |
| `-v`, `--verbose`         | Log executed commands (`DH_VERBOSE=1`)                                                                                                     |
| `--with-build`            | Include phase **B** in the default phase list                                                                                              |
| `--no-cache`              | With phase **B** or `--with-build`, run `docker compose build --no-cache`                                                                  |
| `--skip-preflight`        | Skip Docker info, seccomp file, secrets hints, and optional Node/pnpm notices                                                              |
| `--skip-generate-secrets` | Do not run `scripts/generate-secrets.sh` in phase **D**                                                                                    |
| `--with-obs`              | Add phase **E** to the default phase list                                                                                                  |
| `--with-backup`           | Add phase **F** to the default phase list                                                                                                  |
| `--with-compliance`       | Add phase **G** to the default phase list                                                                                                  |
| `--with-falco`            | With phase **E**, pass `--profile security` on **Linux**; on other OSes, Falco is skipped with a warning                                   |
| `--phase LIST`            | Explicit subset, e.g. `a,c` or `a,b,c,d,e`. **Cannot** be combined with `--quick`                                                          |
| `--teardown`              | After success, run `docker compose down` for the appropriate file set (see below)                                                          |
| `--teardown-volumes`      | Same as `--teardown` but adds **`-v`** (**destructive** to named volumes for that project)                                                 |

---

## Environment variables

| Variable         | Default                            | Purpose                                                                    |
| ---------------- | ---------------------------------- | -------------------------------------------------------------------------- |
| `WEB_HEALTH_URL` | `http://127.0.0.1:3000/api/health` | Web health endpoint for curls and `scripts/health-check.sh`                |
| `API_HEALTH_URL` | `http://127.0.0.1:4000/health`     | API health endpoint                                                        |
| `DH_VERBOSE`     | `0`                                | Set to `1` with `-v` / `--verbose`                                         |
| `DH_DRY_RUN`     | `0`                                | Set to `1` with `-n` / `--dry-run` (normally you do not set this manually) |

---

## Repository root and working directory

The driver **`cd`s to the repository root** derived from the location of `scripts/lib/docker-health-common.sh` (two levels above `scripts/lib`). You can invoke the wrapper from any directory using an absolute path; Compose commands always run with the repo as the working directory so relative paths such as `deploy/security/seccomp-profile.json` resolve correctly.

---

## Compose file sets

The driver uses the same **`-f` ordering** as the execution plan:

| Constant (in `docker-health-common.sh`) | Files                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| Base                                    | `docker-compose.yml`                                                                  |
| Apps                                    | `docker-compose.yml` + `docker-compose.apps.yml`                                      |
| Observability                           | `docker-compose.yml` + `docker-compose.apps.yml` + `docker-compose.observability.yml` |
| Backup                                  | `docker-compose.yml` + `deploy/docker-compose.backup.yml`                             |

---

## Dry-run mode

`--dry-run` is intended for **reviewing** what would be executed without changing container state:

- **Mutating** `docker compose` / `docker` invocations routed through `dh_run` are **printed** with a leading `+`.
- **Read-only** steps (for example `docker compose config` in phase **A**) still run so you can catch merge errors.
- Stateful checks after a printed `up` (service health, `exec` into Postgres/Redis, HTTP probes against a stack that was not started) are **skipped** where documented in log lines.
- If `secrets/jwt_secret.txt` is missing, the driver **warns** instead of failing, so you can dry-run on a clean clone without generating secrets.

---

## Teardown

When `--teardown` succeeds, `docker compose down` uses the **highest relevant** file set inferred from `--phase` (or the default path):

1. If phase **`e`** ran → observability file set
2. Else if **`d`** → apps file set
3. Else if **`f`** → backup file set
4. Else if **`c`** → base file set only

`--teardown-volumes` adds **`-v`**. This **removes named volumes** for that Compose project and can destroy database data. Use only when you intend a clean slate.

---

## Examples

```bash
# Validate compose merge only
./scripts/verify-docker-health.sh --phase a

# Base infrastructure only (Postgres + Redis)
./scripts/verify-docker-health.sh --phase a,c

# Full apps path with explicit image rebuild
./scripts/verify-docker-health.sh --with-build

# No layer cache (slower, stricter build check)
./scripts/verify-docker-health.sh --with-build --no-cache

# Observability on top of apps (adds phase E to defaults)
./scripts/verify-docker-health.sh --with-obs

# Compliance scripts after containers exist (phase G)
./scripts/verify-docker-health.sh --with-compliance

# Plan a run without executing mutating compose commands
./scripts/verify-docker-health.sh --dry-run --skip-preflight

# Run checks, then stop stacks but keep volumes
./scripts/verify-docker-health.sh --teardown
```

---

## Exit codes

| Code | Meaning                                                               |
| ---- | --------------------------------------------------------------------- |
| `0`  | All selected phases passed                                            |
| `1`  | Verification failure (failed assertion, curl, health script, etc.)    |
| `2`  | Usage error (unknown flag, invalid `--phase` / `--quick` combination) |

---

## Troubleshooting

- **Symptoms and fixes** are centralized in the execution plan: [Troubleshooting](../../docs/docker/docker-health-verification-execution-plan.md#troubleshooting).
- **JWT / secrets**: run `./scripts/generate-secrets.sh` and confirm `secrets/jwt_secret.txt` exists and is mode `600`.
- **Port conflicts**: stop conflicting host services or use a local Compose override (document any deviation from defaults).
- **Observability on Docker Desktop**: see [docs/docker/observability.md](../../docs/docker/observability.md) (e.g. Promtail and the Docker socket).
- **Falco**: requires a supported **Linux** host; omit `--with-falco` elsewhere.

---

## Related documentation

- [docs/docker/README.md](../../docs/docker/README.md) — Docker documentation index
- [docs/docker/docker-health-verification-execution-plan.md](../../docs/docker/docker-health-verification-execution-plan.md) — authoritative step-by-step runbook
- [docs/docker/getting-started.md](../../docs/docker/getting-started.md) — first-time stack bring-up

---

## Maintenance

When Compose files, services, ports, health URLs, or overlays change, update:

1. `docs/docker/docker-health-verification-execution-plan.md`
2. `scripts/lib/docker-health-common.sh` and/or `scripts/docker-health/verify-docker-health.sh`
3. This **README** so operators keep a single, accurate picture of the automation surface.
