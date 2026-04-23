# Container images

All application images build from the **monorepo root** so workspace packages, lockfile, and configs are available.

## Shared build conventions

- **Node:** `ARG NODE_VERSION=20` (bookworm-slim build stages).
- **Package manager:** Corepack + `pnpm@10.28.1`, `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` in the **deps base image** and in API **runner** `base` (API still ships its own slim runtime stage).
- **Install:** `pnpm install --frozen-lockfile` with a BuildKit pnpm store cache mount lives in **`docker/base/Dockerfile.deps`**; app Dockerfiles use **`FROM ${DEPS_IMAGE}`** so the install layer is built once and reused.
- **Pre-build gate:** `node scripts/dockerPrebuild.mjs` enforces Node 20+ before app builds.

### Shared base images (local / CI)

Build and tag these **before** app images unless CI passes explicit tags (see `.github/workflows/docker-build.yml`).

| Image                                 | Dockerfile                        | Default tag (local Compose)          |
| ------------------------------------- | --------------------------------- | ------------------------------------ |
| Workspace `node_modules`              | `docker/base/Dockerfile.deps`     | `agenticverdict/deps:local`          |
| Chromium + PDF fonts (worker runtime) | `docker/base/Dockerfile.chromium` | `agenticverdict/chromium-base:local` |

```bash
docker compose -f docker-compose.base-images.yml build
```

**Build args on app images:**

- **`DEPS_IMAGE`** — image containing `/app` after `pnpm install` (default `agenticverdict/deps:local`).
- **`CHROMIUM_IMAGE`** — worker only (default `agenticverdict/chromium-base:local`).
- **`USE_TURBOPACK`** — frontend `builder` only; `true` runs `next build --turbopack` (default `false` for reproducible standalone output).

**Layer size checks (troubleshooting slow export/push):**

```bash
docker history <image> --no-trunc
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
```

### Build performance (summary)

- Copy monorepo/package manifests before source code so dependency install layers stay cacheable across source edits.
- **Deps image:** BuildKit cache mount at **`/pnpm-cache`** with **`id=pnpm-appuser`** (see `docker/base/Dockerfile.deps`).
- Keep multi-stage `TARGET_STAGE` pattern for API/worker to preserve environment-specific runner content.
- **API** runner extends **`${DEPS_IMAGE}`** so **`node_modules`** is inherited as **`appuser`** (no giant **`COPY`**). **Worker** copies **`node_modules`** from **deps** without **`--chown`** (root-owned, readable **`appuser`**).
- For the full implemented architecture, see [Build optimization (implemented)](./build-optimization-implemented.md) and [Build best practices](./build-best-practices.md).

## Frontend (`apps/frontend/Dockerfile`)

| Stage     | Purpose                                                                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deps`    | **`FROM ${DEPS_IMAGE}`** — shared workspace install (see [Shared base images](#shared-base-images-local--ci))                                       |
| `builder` | Copy **`packages`** → **`tests`** → **`apps`** (cache-friendly order), `dockerPrebuild`, `next build --no-lint` (optional **`USE_TURBOPACK=true`**) |
| `runner`  | `gcr.io/distroless/nodejs20-debian12`                                                                                                               |

**Runtime:**

- User **65532:65532** (non-root).
- `NODE_OPTIONS=--dns-result-order=ipv4first --tls-min-v1.2`
- **HEALTHCHECK:** distroless Node `fetch` to `http://127.0.0.1:3000/api/health`
- **CMD:** `apps/frontend/server.js` (Next.js **standalone** output)

### Frontend runtime env contract (production-like)

The frontend service requires all three variables in production/staging runtime:

- **`API_URL`**: SSR/internal API base URL (inside Compose network, e.g. `http://api:4000`)
- **`VITE_PUBLIC_API_URL`**: browser-visible API base URL (host/browser reachable, e.g. `http://localhost:4000`)
- **`VITE_PUBLIC_DEFAULT_TENANT_ID`**: default tenant UUID used by current `/$locale` loader contract

Startup-time contract validation fails fast when these are missing or invalid, and CI validates Compose wiring for this contract.

**Monorepo alignment:** `apps/frontend/next.config.ts` sets `output: "standalone"` and `outputFileTracingRoot` to the monorepo root so workspace packages trace into `.next/standalone`.

**Lint:** Image build skips ESLint (`--no-lint`); lint remains for local dev and CI.

**Build args:** **`DEPS_IMAGE`** (see [Shared base images](#shared-base-images-local--ci)); **`USE_TURBOPACK`** (`true` \| `false`, default `false`).

## API (`apps/api/Dockerfile`)

| Stage                                 | Purpose                                                                                                                                                                                                                                                                                                  |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base`                                | bookworm-slim + openssl, ca-certificates, **wget** (used by **`source`** toolchain / parity; **runner** extends **deps**, not this stage)                                                                                                                                                                |
| `source`                              | Selective **`COPY --chown=appuser:appuser`**, then **`USER appuser`** + **`dockerPrebuild.mjs`**                                                                                                                                                                                                         |
| `deps`                                | **`FROM ${DEPS_IMAGE}`** — shared workspace install                                                                                                                                                                                                                                                      |
| `buildenv`                            | **`FROM deps`** + **`COPY --from=source /app /app`** (no **`COPY . .`** on top of **`node_modules`**)                                                                                                                                                                                                    |
| `development` / `test` / `production` | **`NODE_ENV`** variants **`FROM buildenv`**                                                                                                                                                                                                                                                              |
| `app_build`                           | **`FROM ${TARGET_STAGE}`** — filesystem selected for the runner overlay                                                                                                                                                                                                                                  |
| `runner`                              | **`FROM ${DEPS_IMAGE}`** — inherits **`/app/node_modules`** as **`appuser`**; **`COPY`** only manifests, **`packages/`**, **`apps/api/`**, **`configs/`**, **`scripts/`**, toolchain files from **`app_build`**; **`ARG TARGET_STAGE`**, **`ARG NODE_ENV`**; **`USER appuser`**; `WORKDIR /app/apps/api` |

**Build args (runner / merge):**

- **`DEPS_IMAGE`:** tag for the shared workspace install image (default `agenticverdict/deps:local`).
- **`TARGET_STAGE`:** `development` \| `test` \| `production` — selects which **`buildenv`** variant becomes **`app_build`**; the **runner** copies **only** manifests and app paths from **`app_build`** ( **`node_modules`** is inherited from **`${DEPS_IMAGE}`**).
- **`NODE_ENV`:** should match the intended runtime (Compose overlays set both when using dev/test stacks).

**Runtime:**

- `NODE_OPTIONS` same as frontend.
- **HEALTHCHECK:** `wget --spider` to `http://127.0.0.1:4000/health` (45s start period).
- **CMD:** `node dist/cli.mjs` (runtime executes the verified production Vite bundle artifact).

## Worker (`apps/worker/Dockerfile`)

**Build args:** **`DEPS_IMAGE`**, **`CHROMIUM_IMAGE`** (defaults `agenticverdict/deps:local`, `agenticverdict/chromium-base:local`), plus **`TARGET_STAGE`** and **`NODE_ENV`** like API.

Same **multi-stage** pattern as API: **`source`** on **`${CHROMIUM_IMAGE}`**, **`buildenv`** on **`${DEPS_IMAGE}`**, then **`development` / `test` / `production`**, **`app_build`**, and **`runner`** with the same **`TARGET_STAGE` / `NODE_ENV`** build args.

- **`deps`:** **`FROM ${DEPS_IMAGE}`** (shared install).
- **`runner`:** **`FROM ${CHROMIUM_IMAGE}`**; **`COPY --from=deps`** for **`node_modules`** and root manifests **without `--chown`**; **`COPY --from=app_build`** for **`packages/`**, **`apps/worker/`**, **`configs/`**, **`scripts/`**, toolchain files; **`USER appuser`**; `WORKDIR /app/apps/worker`.
- **CMD:** `node dist/cli.mjs`
- **No exposed ports** in the Dockerfile; worker consumes Redis from the network.
- **PDF/Chromium:** system Chromium and fonts live in the **chromium base image** (apt cache mounts apply when rebuilding that image locally).

## API authentication and JWT (runtime)

The API reads signing material from **`JWT_SECRET_FILE`** (file path, read once and cached) or **`JWT_SECRET`**, minimum length **8**. In Compose, `JWT_SECRET_FILE` points at the mounted secret under `/run/secrets/`. See `apps/api/src/middleware/auth.ts` and tests.

## Worker process behavior

`apps/worker/src/cli.ts` requires **`REDIS_URL`**, registers workers, and shuts down on `SIGTERM` / `SIGINT` (including Redis `quit()` after workers stop).
