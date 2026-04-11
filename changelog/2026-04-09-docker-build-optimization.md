# Changelog: Docker build optimization — consolidated record (2026-04-09)

**Date:** 2026-04-09  
**Supersedes (removed from the tree):**

- `changelog/2026-04-09-docker-build-optimization-final-analysis.md`
- `changelog/2026-04-09-docker-build-remediation-implementation.md` (V1 implementation)
- `changelog/2026-04-09-docker-build-remediation-plan.md`
- `changelog/2026-04-09-docker-build-remediation-plan-v2.md`
- `changelog/2026-04-09-docker-build-remediation-plan-v3.md`
- `changelog/2026-04-09-docker-build-remediation-v2-implementation.md`
- `changelog/2026-04-09-docker-build-remediation-v3-implementation.md`

**Operational SSOT for the implemented stack:** [`docs/docker/build-optimization-implemented.md`](../docs/docker/build-optimization-implemented.md). Earlier analysis and research remain under [`docs/docker/build-performance-analysis.md`](../docs/docker/build-performance-analysis.md) and [`docs/docker/build-optimization-research.md`](../docs/docker/build-optimization-research.md). Phase-0 discovery narrative (pre-remediation) remains in [`changelog/2026-04-09-docker-build-optimization-phase-00.md`](./2026-04-09-docker-build-optimization-phase-00.md).

---

## Executive summary

Iterative remediation (V1 → V3) addressed duplicated installs, Chromium cost on every worker build, oversized context, monolithic **`COPY --chown`** of **`/app`**, and finally **`COPY --chown`** on **`node_modules`**. The largest structural win was making the **API** **`runner`** stage **`FROM ${DEPS_IMAGE}`** so **`node_modules`** is inherited with correct ownership instead of copied with metadata rewrites.

**Observed outcome (one benchmark run, hardware-specific):** total image build path **847.9s → 66.1s (~92% reduction)**; remaining time was dominated by **Next.js** build. Re-validate with [`scripts/measure-build-performance.sh`](../scripts/measure-build-performance.sh).

---

## Results timeline (representative)

| Milestone | Approx. total | Focus                                                                                                                                                                       |
| --------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline  | ~848s         | Pre-remediation                                                                                                                                                             |
| V1        | ~300s (est.)  | Shared **deps**, Chromium base, **`COPY --chown`** instead of **`chown -R`**                                                                                                |
| V2        | ~166s         | **source** / **buildenv** split, aggressive **`.dockerignore`**, **`docker-prep.sh`**, web cache mounts / optional Turbopack under Compose                                  |
| V3        | **~66s**      | **`appuser`** install in **deps**, **`pnpm-appuser`** store cache, API **`runner`** **`FROM ${DEPS_IMAGE}`**, worker **`COPY`** without **`--chown`** on **`node_modules`** |

---

## V1 — Shared deps, Chromium base, compose and CI wiring

**Problem:** Per-service **`pnpm install`**, worker **apt** + Chromium on hot path, recursive **`chown -R /app`** over **`node_modules`**.

**Implemented:**

- **`docker/base/Dockerfile.deps`:** single workspace **`pnpm install --frozen-lockfile`**; BuildKit pnpm store cache; manifest-only **`COPY`** list; optional **`LOCKFILE_HASH`** label.
- **`docker/base/Dockerfile.chromium`:** Chromium, fonts, runtime deps; **`chromium --version`** smoke; labels for traceability.
- **`docker-compose.base-images.yml`:** **`deps-base`**, **`chromium-base`** → local tags.
- **App Dockerfiles:** **`ARG DEPS_IMAGE`**, **`FROM ${DEPS_IMAGE} AS deps`** (web, api, worker); worker **`CHROMIUM_IMAGE`**; runners use **`COPY --chown=appuser:appuser`** instead of traversing **`node_modules`** for **`chown -R`**.
- **Compose / CI:** **`DEPS_IMAGE`** / **`CHROMIUM_IMAGE`** build args; workflows build base images with GHA scopes **`monorepo-deps`** and **`chromium-base`**; **`scripts/measure-build-performance.sh`** pre-builds bases.
- **`.dockerignore`:** excludes **`changelog/`**, **`ignored/`**, documents **`tests/`** exception for **`tests/phase01-platform-integration/package.json`**.

**Breaking note:** Raw **`docker build`** of app images requires pre-built or pulled **`DEPS_IMAGE`** (and **`CHROMIUM_IMAGE`** for worker). Compose users build base images first.

---

## V2 — Source/buildenv split, context hygiene, web caches

**Problem:** **`COPY . .`** on **`deps`** inflated **`/app`** (~2.1GB) before runner **`COPY --chown`**; local **`.next`** made context transfers huge (~668MB class).

**Implemented:**

- **API / worker:** **`source`** stage (no **`node_modules`**, selective **`COPY`**); **`buildenv` = `FROM ${DEPS_IMAGE}` + `COPY --from=source`**. Target stages (**`development`**, **`test`**, **`production`**) no longer overlay the full tree with **`COPY . .`**.
- **Worker **`source`:\***\* **`FROM ${CHROMIUM_IMAGE}`** for **`dockerPrebuild`\*\* parity with runtime.
- **Runner pattern (V2):** split **`COPY`** — **`node_modules`** + root manifests **from `deps`**, application trees **from `app_build`** (avoids copying a single giant **`app_build /app`**).
- **`.dockerignore`:** nested **`**/`**` patterns for outputs; **`scripts/docker-prep.sh`** deletes local artifacts; CI runs **`docker-prep.sh`** after checkout; measurement script invokes it.
- **Web:** BuildKit mounts for Turbo/npm caches; **`docker-compose.apps.yml`** may set **`USE_TURBOPACK=true`** for local web builds while CI often keeps webpack unless args change.

**Deferred:** **`find`**-based stripping of tests inside **`node_modules`** (high breakage risk).

---

## V3 — Deps-owned `node_modules`, API runner extends deps

**Problem:** **`COPY --from=deps --chown=appuser:appuser /app/node_modules`** dominated time (~57s-class per service) due to recursive metadata rewrite on **`pnpm`**’s virtual store.

**Implemented:**

- **`Dockerfile.deps`:** **`appuser`** before install; **`runuser`** for **`pnpm`**; **`/pnpm-cache`** mount with **`id=pnpm-appuser`**; **`chmod 777`** on mount for **`appuser`** writes without mass **`chown`** on cache.
- **`Dockerfile.chromium`:** creates **`appuser`** for alignment with worker **source** / deps convention.
- **API **`runner`:\***\* **`FROM ${DEPS_IMAGE}`** — inherits **`node_modules`**; copies only smaller **`app_build`** paths. **Critical correction:\*\* **`COPY`** without **`--chown`** does **not** preserve source image ownership (defaults to **`root:root`**), so “install as **`appuser`** then plain **`COPY`**” does **not** fix API **`node_modules`** ownership; inheritance does.
- **Worker **`runner`:\***\* still **`FROM ${CHROMIUM_IMAGE}`**; **`COPY`\*\* **`node_modules`** **without `--chown`** (root-owned, readable **`appuser`**); removed duplicate **`useradd`** (user from Chromium image).
- **API / worker **`source`:\***\* root performs all **`COPY --chown`**, then **`USER appuser`** only for **`dockerPrebuild.mjs`\*\*.

**Breaking note:** Rebuild **`DEPS_IMAGE`** whenever **`Dockerfile.deps`** changes; stale layers will not match the new install path.

**Deferred:** **`pnpm deploy`** / prod-only **`node_modules`** while preserving **`tsx`** workspace layout.

---

## Operator checklist

1. After lockfile or base Dockerfile changes:  
   `docker compose -f docker-compose.base-images.yml build`
2. Optional before local builds with artifacts:  
   `bash scripts/docker-prep.sh`
3. Application stack:  
   `docker compose -f docker-compose.yml -f docker-compose.apps.yml up -d --build`  
   (plus **`docker-compose.dev.yml`**, **`docker-compose.test.yml`**, or **`deploy/docker-compose.dev.override.yml`** as needed.)

---

## Lessons learned

1. **Layer inheritance** beat incremental **`COPY`** tuning for the API once **`node_modules`** ownership was correct in **deps**.
2. **`COPY --chown`** on very large trees is a metadata hotspot; avoid it on **`node_modules`** where possible.
3. **Build context** size affects client time even when **`.dockerignore`** excludes files — nested globs and **`docker-prep.sh`** matter.
4. **Cache IDs** for BuildKit mounts should not pin operators to irreparable **root-owned** legacy stores.

---

## Maintenance notes

- **`pnpm-lock.yaml`** changes force **deps** rebuild — expected.
- Keep **`DEPS_IMAGE`** stable when possible for cache hits.
- CI: ensure GHA cache scopes (**`monorepo-deps`**, **`chromium-base`**, service images, **`pnpm-appuser`** store) remain coherent across workflows.

---

## References

- Implemented architecture: [`docs/docker/build-optimization-implemented.md`](../docs/docker/build-optimization-implemented.md)
- Container reference: [`docs/docker/container-images.md`](../docs/docker/container-images.md)
- Docker SSOT index: [`docs/docker/README.md`](../docs/docker/README.md)
- Docker **`COPY`:** [Dockerfile `COPY` reference](https://docs.docker.com/reference/dockerfile/#copy)

---

**Document version:** 1.0  
**Last updated:** 2026-04-09
