# Container images

All application images build from the **monorepo root** so workspace packages, lockfile, and configs are available.

## Shared build conventions

- **Node:** `ARG NODE_VERSION=20` (bookworm-slim build stages).
- **Package manager:** Corepack + `pnpm@10.28.1`, `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` in build stages.
- **Install:** `pnpm install --frozen-lockfile` after copying workspace manifests and sources required for dependency resolution.
- **Pre-build gate:** `node scripts/dockerPrebuild.mjs` enforces Node 20+ before app builds.

## Web (`apps/web/Dockerfile`)

| Stage     | Purpose                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------ |
| `base`    | Node bookworm-slim, openssl/ca-certificates, pnpm                                                      |
| `deps`    | Copy workspace roots + `pnpm install --frozen-lockfile`                                                |
| `builder` | Full copy, `dockerPrebuild`, `next build --no-lint` (webpack build for reproducible standalone output) |
| `runner`  | `gcr.io/distroless/nodejs20-debian12`                                                                  |

**Runtime:**

- User **65532:65532** (non-root).
- `NODE_OPTIONS=--dns-result-order=ipv4first --tls-min-v1.2`
- **HEALTHCHECK:** distroless Node `fetch` to `http://127.0.0.1:3000/api/health`
- **CMD:** `apps/web/server.js` (Next.js **standalone** output)

**Monorepo alignment:** `apps/web/next.config.ts` sets `output: "standalone"` and `outputFileTracingRoot` to the monorepo root so workspace packages trace into `.next/standalone`.

**Lint:** Image build skips ESLint (`--no-lint`); lint remains for local dev and CI.

## API (`apps/api/Dockerfile`)

| Stage            | Purpose                                                                     |
| ---------------- | --------------------------------------------------------------------------- |
| `base`           | bookworm-slim + openssl, ca-certificates, **wget** (healthcheck)            |
| `deps` / `build` | install + full tree + `dockerPrebuild`                                      |
| `runner`         | Copy `/app`, non-root **`appuser`** (uid/gid 1001), `WORKDIR /app/apps/api` |

**Runtime:**

- `NODE_OPTIONS` same as web.
- **HEALTHCHECK:** `wget --spider` to `http://127.0.0.1:4000/health` (45s start period).
- **CMD:** `node --import tsx src/cli.ts` (no pnpm at runtime — avoids Corepack download as non-root).

`tsx` is a **production** dependency of `@agenticverdict/api` for this entry pattern.

## Worker (`apps/worker/Dockerfile`)

Same runtime pattern as API (bookworm-slim, `appuser`, `WORKDIR /app/apps/worker`).

- **CMD:** `node --import tsx src/cli.ts`
- **No exposed ports** in the Dockerfile; worker consumes Redis from the network.
- **PDF/Chromium:** not included; for real generators extend the image (e.g. Playwright/OS deps) or keep `AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS=1` in Compose.

## API authentication and JWT (runtime)

The API reads signing material from **`JWT_SECRET_FILE`** (file path, read once and cached) or **`JWT_SECRET`**, minimum length **8**. In Compose, `JWT_SECRET_FILE` points at the mounted secret under `/run/secrets/`. See `apps/api/src/middleware/auth.ts` and tests.

## Worker process behavior

`apps/worker/src/cli.ts` requires **`REDIS_URL`**, registers workers, and shuts down on `SIGTERM` / `SIGINT` (including Redis `quit()` after workers stop).
