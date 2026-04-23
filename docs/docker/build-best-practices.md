# Docker build best practices

This guide captures stable Docker build patterns for AgenticVerdict alongside the **implemented** architecture in [Build optimization (implemented)](./build-optimization-implemented.md).

Related references:

- [Build performance analysis](./build-performance-analysis.md)
- [Build optimization research](./build-optimization-research.md)
- [Container images](./container-images.md)
- [Continuous integration](./continuous-integration.md)
- [Compose and networking](./compose-and-networking.md)
- [Getting started](./getting-started.md)

## 1) BuildKit cache mount patterns

- Enable BuildKit in local environments:
  - `export DOCKER_BUILDKIT=1`
- Use pnpm store cache mounts in dependency-install layers:

```dockerfile
RUN --mount=type=cache,target=/root/.local/share/pnpm/store,id=pnpm,sharing=shared \
    pnpm install --frozen-lockfile
```

- Use apt cache mounts for OS package-heavy layers (worker/Chromium):

```dockerfile
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends chromium
```

## 2) Layer ordering for monorepos

- Copy root manifests and workspace `package.json` files before dependency install.
- Run `pnpm install --frozen-lockfile` once manifest layers are in place.
- Copy frequently changing source code after install.
- This pattern keeps `pnpm install` cached when only source files change.

Recommended order:

1. Root workspace manifests (`package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`, `turbo.json`)
2. Workspace manifests (`apps/*/package.json`, `packages/*/package.json`, `tests/*/package.json`)
3. Dependency install
4. Source code copy and build steps

## 3) Multi-stage build guidance

- Keep the existing API/worker `TARGET_STAGE` pattern (`development|test|production`) for environment-correct runner images.
- Prefer low-risk artifact movement for runtime-stage TypeScript+tsx execution (`COPY --from=app_build /app /app`) unless moving to compiled/bundled runtime output.
- For frontend, copy only standalone runtime artifacts to final image (`.next/standalone`, `.next/static`, `public`).

## 4) CI/CD cache integration

- Set inline cache metadata:
  - `build-args: BUILDKIT_INLINE_CACHE=1`
- Configure layered cache backends in build workflows:
  - Registry cache (`ghcr.io/<owner>/<repo>/build-cache:<service>`)
  - GHA cache fallback (`type=gha,scope=<service>`)
- Keep cache scopes service-specific to reduce churn.

## 5) Performance measurement

Use the script from the repository root:

```bash
chmod +x scripts/measure-build-performance.sh
scripts/measure-build-performance.sh frontend
scripts/measure-build-performance.sh api
scripts/measure-build-performance.sh worker
```

What it records:

- Wall-clock build duration
- BuildKit log file per service under `.build-metrics/`
- Heuristic cache-hit trend (`CACHED` lines / step lines)

## 6) Troubleshooting

### Cache mounts not working

- Verify BuildKit:
  - `docker buildx version`
- Build with plain progress:
  - `docker buildx build --progress=plain -f apps/api/Dockerfile .`

### Registry cache unavailable

- Verify auth:
  - `docker login ghcr.io`
- Confirm cache refs match the repository path and lowercase naming.

### Build performance regresses

- Compare current metrics with the baseline log set from `scripts/measure-build-performance.sh`.
- Reset local cache if required:
  - `docker builder prune -f`
- Re-check layer ordering in Dockerfiles if deps are unexpectedly rebuilding.

## 7) BuildKit daemon tuning (CI/self-hosted)

For dedicated BuildKit daemons and self-hosted runners, tune:

- `worker.oci.max-parallelism`
- GC policies (`keepBytes`, `keepDuration`) for cache classes

The canonical **implemented** notes and example config anchor live in [Build optimization (implemented)](./build-optimization-implemented.md#23-configure-buildkit-daemon-settings) and [`buildkitd.toml.example`](./buildkitd.toml.example).
