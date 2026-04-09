# Compose files reference

AgenticVerdict splits Docker Compose into **small, composable YAML files** at the repository root and under `deploy/`. You merge them with repeated `-f` flags so each concern (networks, infrastructure, apps, dev/test overlays, observability, backups, production-shaped examples, Linux security) stays easy to reason about and diff.

All stacks that talk to Postgres, Redis, or the apps share the bridge network **`agenticverdict`** (`172.28.0.0/16`). The base stack **includes** the networks fragment so a plain `docker compose up` still attaches services to that network.

**Default development Postgres** (root `docker-compose.yml`) uses user **`postgres`**, password **`postgres`**, database **`agenticverdict`**—see [Compose and networking](./compose-and-networking.md#base-stack-docker-composeyml).

For first-time flows and health checks, see [Getting started](./getting-started.md). Day-to-day commands, logs, and backups are in [Operations](./operations.md). Seccomp, read-only rootfs, and optional AppArmor are covered in [Security](./security.md).

## Why multi-file Compose?

- **Infrastructure only** stays a single default file (or `docker-compose.yml` alone).
- **Apps** opt in via `docker-compose.apps.yml` after shared base images are built.
- **Behavior overlays** (`dev`, `test`, observability, backup) add services or override `build.args` / `environment` without copying entire stacks.
- **Production-shaped** examples live under `deploy/` with paths and secrets layout suited to servers.

When you run `logs`, `exec`, `down`, or `build`, pass the **same** `-f` list you used for `up` (see [Common operations](./common-operations.md)).

---

## `docker-compose.networks.yml`

|                  |                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| **Purpose**      | Declares the shared **`agenticverdict`** external-style bridge network and subnet.                           |
| **Key services** | None (network-only fragment).                                                                                |
| **Typical use**  | Included by `docker-compose.yml` via Compose `include:`; referenced implicitly whenever the base stack runs. |

You rarely pass this file on the CLI; the base compose file pulls it in.

---

## `docker-compose.yml`

|                  |                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**      | **Base infrastructure:** Postgres 16, Redis 7, named volumes, hardening (read-only root, tmpfs, seccomp, resource limits). |
| **Key services** | `postgres`, `redis`.                                                                                                       |
| **Includes**     | `docker-compose.networks.yml` (see above).                                                                                 |

**Example (repo root):**

```bash
docker compose up -d
docker compose ps
docker compose down
```

Equivalent via pnpm: `pnpm run db:up` / `pnpm run db:down` (see root `package.json`).

---

## `docker-compose.base-images.yml`

|                  |                                                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**      | Build **shared layers** consumed by app Dockerfiles: workspace deps image and Chromium base for the worker.                                        |
| **Key services** | `deps-base` → `agenticverdict/deps:local`; `chromium-base` → `agenticverdict/chromium-base:local`.                                                 |
| **Typical use**  | Run **before** building `web` / `api` / `worker` when using Compose; `docker-compose.apps.yml` sets `DEPS_IMAGE` / `CHROMIUM_IMAGE` to these tags. |

**Example (repo root):**

```bash
docker compose -f docker-compose.base-images.yml build
```

See [Getting started](./getting-started.md#common-stacks) and [Build optimization (implemented)](./build-optimization-implemented.md).

---

## `docker-compose.apps.yml`

|                  |                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------- |
| **Purpose**      | **Application services:** build and run `web`, `api`, `worker` against the base stack. |
| **Key services** | `web` (port 3000), `api` (4000), `worker` (no published port).                         |
| **Depends on**   | Healthy `postgres` and `redis` from `docker-compose.yml`.                              |

**Example (repo root, production-like `NODE_ENV=production` on apps):**

```bash
docker compose -f docker-compose.base-images.yml build
docker compose \
  -f docker-compose.yml \
  -f docker-compose.apps.yml \
  up -d --build
```

JWT material: Compose secret from `secrets/jwt_secret.txt` (create with `./scripts/generate-secrets.sh`). See [Environment and secrets](./environment-and-secrets.md).

---

## `docker-compose.dev.yml`

|                  |                                                                                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**      | **Development overlay** for **api** and **worker:** `TARGET_STAGE=development`, `NODE_ENV=development`, mock-friendly env (e.g. `AGENTICVERDICT_USE_MOCK_ADAPTERS=1`). |
| **Key services** | Overrides `api` and `worker` build args and environment only.                                                                                                          |

**Example (repo root):**

```bash
docker compose -f docker-compose.base-images.yml build
docker compose \
  -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f docker-compose.dev.yml \
  up -d --build
```

**Web** remains a production-standalone image in Docker; use host `pnpm dev` for Next.js with mocks if needed. See [Getting started](./getting-started.md#environment-modes-and-manual-testing).

---

## `docker-compose.test.yml`

|                  |                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Purpose**      | **Test overlay** for **api** and **worker:** `TARGET_STAGE=test`, `NODE_ENV=test`, mock adapters for deterministic integration-style runs. |
| **Key services** | Overrides `api` and `worker` only (same pattern as `docker-compose.dev.yml`).                                                              |

**Example (repo root):**

```bash
docker compose -f docker-compose.base-images.yml build
docker compose \
  -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f docker-compose.test.yml \
  up --build
```

---

## `docker-compose.observability.yml`

|                  |                                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**      | **Metrics and logs:** Prometheus, Loki, Promtail, Grafana; optional **Falco** under profile `security` (Linux, privileged). |
| **Key services** | `prometheus`, `loki`, `promtail`, `grafana`, `falco` (profile).                                                             |

**Example (repo root):**

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f docker-compose.observability.yml \
  up -d
```

With Falco:

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f docker-compose.observability.yml \
  --profile security \
  up -d
```

Details: [Observability](./observability.md), [Getting started](./getting-started.md#add-observability-metrics-logs-grafana).

---

## `deploy/docker-compose.dev.override.yml`

|                  |                                                                                                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Purpose**      | Same **intent** as `docker-compose.dev.yml`: api/worker **development** stage and mock-friendly settings, kept under `deploy/` for server-side or path-prefix workflows. |
| **Key services** | Overrides `api` and `worker` (merge with base + apps).                                                                                                                   |

**Example (repo root):** use this file **instead of** `docker-compose.dev.yml` in the `-f` list:

```bash
docker compose -f docker-compose.base-images.yml build
docker compose \
  -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f deploy/docker-compose.dev.override.yml \
  up -d --build
```

---

## `deploy/docker-compose.backup.yml`

|                  |                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Purpose**      | **Scheduled Postgres backups** via sidecar `postgres-backup` (image pinned in file); dumps to volume `pg_backups`. |
| **Key services** | `postgres-backup`.                                                                                                 |

**Example (repo root):**

```bash
docker compose \
  -f docker-compose.yml \
  -f deploy/docker-compose.backup.yml \
  up -d
```

One-off host backups (gzip SQL under `./backups`) use `./scripts/backup-postgres.sh`; see [Operations](./operations.md).

---

## `deploy/docker-compose.production.example.yml`

|                  |                                                                                                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**      | **Example** production-oriented stack: image tags via `REGISTRY` / `VERSION`, stricter env expectations, project name `agenticverdict-prod`. **Not** wired by default; adapt for your environment. |
| **Key services** | `postgres`, `redis`, `web`, `api`, `worker` (image refs via `REGISTRY` / `VERSION`).                                                                                                               |

**Requirements (typical):** set `POSTGRES_PASSWORD` in the environment; JWT file at repo `secrets/jwt_secret.txt` (path relative to `deploy/` inside the file); seccomp under `deploy/security/`. See [Compose and networking](./compose-and-networking.md#production-example-deploydocker-composeproductionexampleyml) and [Security](./security.md).

**Example (from repo root, paths as documented in the file):**

```bash
export POSTGRES_PASSWORD='your-secure-password'
docker compose -f deploy/docker-compose.production.example.yml up -d
```

---

## `deploy/docker-compose.security-linux.override.yml`

|                  |                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| **Purpose**      | **Optional Linux hardening:** AppArmor profile for app containers when the profile is loaded on the host. |
| **Key services** | Adds `security_opt` overrides to selected services (see file).                                            |

**Example:** merge with the production example when you use AppArmor:

```bash
docker compose -f deploy/docker-compose.production.example.yml \
  -f deploy/docker-compose.security-linux.override.yml \
  up -d
```

See [Security](./security.md).

---

## Quick reference table

| File                                                | Layer                                                |
| --------------------------------------------------- | ---------------------------------------------------- |
| `docker-compose.networks.yml`                       | Shared network (included by base)                    |
| `docker-compose.yml`                                | Postgres + Redis + volumes                           |
| `docker-compose.base-images.yml`                    | Build deps + Chromium base images                    |
| `docker-compose.apps.yml`                           | web, api, worker                                     |
| `docker-compose.dev.yml`                            | Dev stage + mocks (api/worker)                       |
| `docker-compose.test.yml`                           | Test stage + mocks (api/worker)                      |
| `docker-compose.observability.yml`                  | Prometheus, Loki, Promtail, Grafana; Falco (profile) |
| `deploy/docker-compose.dev.override.yml`            | Same role as dev overlay, `deploy/` path             |
| `deploy/docker-compose.backup.yml`                  | Scheduled Postgres sidecar                           |
| `deploy/docker-compose.production.example.yml`      | Example prod-style stack                             |
| `deploy/docker-compose.security-linux.override.yml` | AppArmor overlay (Linux)                             |

For topology diagrams and port tables, see [Compose and networking](./compose-and-networking.md).
