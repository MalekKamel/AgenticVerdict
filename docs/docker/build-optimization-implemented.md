# Docker build optimizations — implemented architecture

**Status:** Implemented (2026-04-09). This document is the **single source of truth** for what the repository actually does to keep image builds fast. Narrative history, superseded plans, and benchmark tables live in [`changelog/2026-04-09-docker-build-optimization.md`](../../changelog/2026-04-09-docker-build-optimization.md).

Background research and older assessments remain in [Build performance analysis](./build-performance-analysis.md), [Build optimization research](./build-optimization-research.md), and day-to-day tips in [Build best practices](./build-best-practices.md).

---

## Goals (achieved)

- One shared **`pnpm install`** layer reused by **web**, **api**, and **worker** (`DEPS_IMAGE`).
- No per-build Chromium **apt** on the worker runner (pre-built **`CHROMIUM_IMAGE`**).
- Avoid recursive **`chown -R`** over **`node_modules`** and avoid expensive **`COPY --chown`** on huge trees where possible.
- Keep Docker **build context** small (nested **`.next`**, **`dist`**, etc. ignored and optionally stripped locally).

---

## Shared base images

| Image             | Dockerfile                                 | Default tag (local)                  |
| ----------------- | ------------------------------------------ | ------------------------------------ |
| Workspace install | `packages/docker/base/Dockerfile.deps`     | `agenticverdict/deps:local`          |
| Chromium runtime  | `packages/docker/base/Dockerfile.chromium` | `agenticverdict/chromium-base:local` |

```bash
docker compose -f docker-compose.base-images.yml build
```

### Deps image: ownership and pnpm store

- **`appuser` / `1001:1001`** exists in the **`base`** stage before install.
- **`pnpm install --frozen-lockfile --store-dir /pnpm-cache`** runs as **`appuser`** via **`runuser -u appuser --`** so **`/app/node_modules`** is **`1001:1001`** from creation.
- BuildKit cache mount: **`--mount=type=cache,target=/pnpm-cache,id=pnpm-appuser,sharing=shared`**. The dedicated **`id`** avoids reusing a legacy **root-owned** store that would require mass permission repair. The mount is **`chmod 777`** before install so **`appuser`** can write without recursive **`chown`** on a warm cache.

### Chromium image

- Same **`appuser` / `1001:1001`** so worker **source** **`COPY --chown=appuser:appuser`** and runtime **`USER appuser`** align with the monorepo convention.

---

## Application Dockerfiles (behavioral summary)

### Web (`apps/web/Dockerfile`)

- **`FROM ${DEPS_IMAGE} AS deps`**, then builder copies **`packages`** → **`tests`** → **`apps`** (cache-friendly order).
- Optional **`USE_TURBOPACK=true`** for **`next build --turbopack`**; Compose may set this while CI often keeps the default webpack path unless workflows pass the arg.
- Builder uses BuildKit cache mounts for **Turbo** and **npm** caches where configured.
- Runner remains **distroless** with **`65532:65532`** for Next standalone output (unchanged by api/worker optimization passes).

### API (`apps/api/Dockerfile`)

- **`source`:** selective **`COPY --chown=appuser:appuser`**, then **`USER appuser`** for **`dockerPrebuild.mjs`** only (root must own **`COPY`** into **`/app`**).
- **`buildenv`:** **`FROM ${DEPS_IMAGE}`** + **`COPY --from=source /app /app`** — never **`COPY . .`** on top of **`node_modules`**.
- **`runner`:** **`FROM ${DEPS_IMAGE}`** — inherits **`/app/node_modules`** with correct ownership. **No** **`COPY`** of **`node_modules`** into the runner.
- **Why not `COPY` `node_modules` without `--chown`?** Docker **`COPY`** without **`--chown`** sets destination files to **`root:root`**, so ownership from the source image is **not** preserved. Extending **`${DEPS_IMAGE}`** avoids that pitfall entirely for the API.

### Worker (`apps/worker/Dockerfile`)

- **`source`:** **`FROM ${CHROMIUM_IMAGE}`** (same Node line as runtime) + selective **`COPY --chown`**, then **`USER appuser`** for **`dockerPrebuild.mjs`**.
- **`runner`:** **`FROM ${CHROMIUM_IMAGE}`**; **`COPY --from=deps`** for **`node_modules`** and root manifests **without `--chown`** (faster than recursive metadata rewrite). **`node_modules`** is **root-owned** but typically readable by **`appuser`** via default modes — see header comment in the Dockerfile.

---

## Build arguments (reference)

| Arg                  | Default (local)                      | Used by                                               |
| -------------------- | ------------------------------------ | ----------------------------------------------------- |
| **`DEPS_IMAGE`**     | `agenticverdict/deps:local`          | web, api, worker                                      |
| **`CHROMIUM_IMAGE`** | `agenticverdict/chromium-base:local` | worker                                                |
| **`USE_TURBOPACK`**  | `false`                              | web builder                                           |
| **`TARGET_STAGE`**   | `production`                         | api, worker (`development` \| `test` \| `production`) |

CI tags **`agenticverdict/deps:ci`** and **`agenticverdict/chromium-base:ci`** and passes them as **`--build-arg`** (see [Continuous integration](./continuous-integration.md)).

---

## Build context hygiene

- **`.dockerignore`:** nested-safe globs for **`.next`**, **`dist`**, **`build`**, **`out`**, **`.turbo`**, coverage, logs, etc., so the client does not walk huge artifact trees.
- **`scripts/docker-prep.sh`:** removes local outputs before **`docker build`** / CI jobs (see script header). Workflows run it after checkout where configured.

---

## Continuous integration

- GHA cache scopes **`monorepo-deps`** and **`chromium-base`** deduplicate expensive base layers across **web** / **api** / **worker** jobs.
- **`docker-prep.sh`** runs after checkout on build workflows to normalize context size on self-hosted or dirty workspaces.

Details: [Continuous integration](./continuous-integration.md).

---

## Verification (optional)

```bash
docker run --rm agenticverdict/deps:local ls -ld /app/node_modules
# Expect appuser (1001:1001)

docker run --rm --user 1001:1001 <api-image> test -r /app/node_modules/.pnpm && echo OK
```

Full-stack rebuild and benchmarks: **`scripts/measure-build-performance.sh`** (invokes **`docker-prep.sh`** when present).

---

## Deferred / not implemented

- **Production-only `node_modules`** via **`pnpm deploy`** (or similar) while keeping **`tsx`** + workspace TypeScript layout unchanged — left for a future track because of breakage risk.
- Stripping **`node_modules`** test sources under **`find`** — explicitly deferred in prior plans.

---

<a id="23-configure-buildkit-daemon-settings"></a>

## BuildKit daemon settings (CI / self-hosted)

For dedicated BuildKit daemons (not typical Docker Desktop defaults), tune parallelism and GC so cache mounts and layer stores stay bounded. Example excerpt:

```toml
# /etc/buildkit/buildkitd.toml (example — adjust for your runners)
[worker.oci]
  max-parallelism = 4

[[worker.oci.gcpolicy]]
  keepBytes = 512000000
  keepDuration = 172800
  filters = [ "type==source.local", "type==exec.cachemount" ]
```

Full sample: [`buildkitd.toml.example`](./buildkitd.toml.example). Operational summary: [Build best practices](./build-best-practices.md) § BuildKit daemon tuning.

---

## References

- Consolidated changelog: [`changelog/2026-04-09-docker-build-optimization.md`](../../changelog/2026-04-09-docker-build-optimization.md)
- Image stage tables: [Container images](./container-images.md)
- Docker **`COPY`** ownership: [Dockerfile `COPY` reference](https://docs.docker.com/reference/dockerfile/#copy)

**Document version:** 1.0  
**Last updated:** 2026-04-09
