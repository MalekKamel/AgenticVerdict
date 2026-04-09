# Docker quick start

Minimal path from a clean clone to **Postgres + Redis + web + api + worker** running in Docker, with health checks. **Use the root `Makefile` as the default**; raw `docker compose` snippets below are for production-like stacks or custom `-f` merges. For full context (modes, mocks, observability), read [Getting started](./getting-started.md) and [Compose files](./compose-files.md).

## Prerequisites

- **Docker Engine** and **Docker Compose v2** (`docker compose version`).
- **GNU Make** (recommended): install via Xcode Command Line Tools on macOS or your OS package manager. Run **`make help`** from the repo root.
- Repository cloned; all commands run from the **repository root**.

Node.js and pnpm are not required for the container-only quick path; you need them on the host for `pnpm` database tasks or local app dev.

## Steps

### 1. One-time setup

**Recommended:**

```bash
make setup
```

This runs **`scripts/docker-setup.sh`** (secrets, `backups/` / `logs/` / `sboms/`, optional copy of **`.env.docker.example`** → **`.env.docker`**). Alternatively: **`./scripts/generate-secrets.sh`** only. Details: [Environment and secrets](./environment-and-secrets.md).

### 2. (Optional) Preflight and compose validation

```bash
make preflight
make validate
```

### 3. Start the stack

**Recommended — dev overlay (api/worker development stage + mock-friendly env, includes base image build):**

```bash
make dev
```

**Production-like app images (no dev overlay):**

```bash
make apps-up
```

**Raw Compose** (if you are not using Make)—production-like **`NODE_ENV` on apps**:

```bash
docker compose -f docker-compose.base-images.yml build
docker compose \
  -f docker-compose.yml \
  -f docker-compose.apps.yml \
  up -d --build
```

**Raw Compose** with api/worker dev + mock adapters (equivalent to **`make dev`**):

```bash
docker compose -f docker-compose.base-images.yml build
docker compose \
  -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f docker-compose.dev.yml \
  up -d --build
```

Default **Postgres** in `docker-compose.yml` uses **`postgres` / `postgres`** and database **`agenticverdict`** ([Compose and networking](./compose-and-networking.md)).

### 4. Verify health

```bash
make health
```

Or manually:

```bash
curl -fsS http://127.0.0.1:3000/api/health   # web
curl -fsS http://127.0.0.1:4000/health       # API
./scripts/health-check.sh
```

Optional overrides:

```bash
WEB_HEALTH_URL=http://127.0.0.1:3000/api/health \
API_HEALTH_URL=http://127.0.0.1:4000/health \
./scripts/health-check.sh
```

### 5. (Optional) Production-flow scenario tests (host)

Orchestrator scenarios in **`tests/scripts`** exercise the running API (default **`http://127.0.0.1:4000`**). This path needs **Node.js**, **pnpm**, and workspace dependencies (**`pnpm install`**) on the host; it is not part of the container-only quick path.

From the repo root, **`make help`** lists all targets; common ones:

```bash
make test-scripts                        # all R01–R12 (alias for test-scripts-all)
make test-scripts-all                    # same; optional ARGS= forwarded to Vitest
make test-scripts-scenario SCENARIO=R01
make test-scripts-group GROUP=integration
make test-scripts-validate SCENARIO=R01
```

Artifact verification and capture expect **`TOKEN`** (JWT) and are documented with examples in **[`tests/scripts/README.md`](../../tests/scripts/README.md)**:

```bash
TOKEN="$(node scripts/generate-dev-jwt.mjs --tenant <tenant-uuid>)" make test-scripts-capture
TOKEN="$(node scripts/generate-dev-jwt.mjs --tenant <tenant-uuid>)" make test-scripts-verify-artifacts EXECUTION_ID=<id>
```

For stack modes (mock-friendly **`make dev`** vs production-like apps) and broader manual testing, see [Getting started](./getting-started.md#environment-modes-and-manual-testing) and the [manual testing guide](../../tests/docs/manual-testing-guide.md).

## Short troubleshooting

For a fuller index (CI, backups, build context), see [Troubleshooting](./troubleshooting.md).

| Symptom                                  | What to try                                                                                                                                                                                                             |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Port in use** (3000, 4000, 5432, 6379) | Run **`make preflight`**. Stop conflicting processes or adjust published ports in the relevant compose service (advanced). **`make ps`** / **`docker compose ps`** shows what is bound.                                 |
| **api fails JWT / secret**               | Run **`make setup`** or `./scripts/generate-secrets.sh`; ensure `secrets/jwt_secret.txt` exists. Recreate api: **`make dev`** (or `docker compose -f docker-compose.yml -f docker-compose.apps.yml up -d --build api`). |
| **Stale or broken image**                | **`make dev-build`** or `make build` then `make dev`. Raw: `docker compose -f docker-compose.base-images.yml build` then app `build --no-cache` (use sparingly).                                                        |
| **Postgres or Redis exits**              | **`make infra-logs`** or `docker compose -f docker-compose.yml logs postgres redis`; see [Docker health verification](./docker-health-verification-execution-plan.md#troubleshooting) and [Security](./security.md).    |

## Next steps

- [Common operations](./common-operations.md) — **`make`** targets for logs, down, migrations, backups
- [Compose files](./compose-files.md) — observability, backup sidecar, production example
- [Getting started](./getting-started.md) — BuildKit, optional image builds, production-shaped example
- **[`tests/scripts/README.md`](../../tests/scripts/README.md)** — scenario runners and artifact scripts (also exposed as **`make test-scripts`** / **`test-scripts-*`**)
