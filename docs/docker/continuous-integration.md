# Continuous integration (Docker)

Workflows live under `.github/workflows/`. Runners are `ubuntu-latest` (amd64); image builds do not pin `platforms:` in YAML — behavior follows Docker Buildx defaults on the runner.

## `docker-build.yml` — verify image builds

**Triggers:**

- **Push** to `main` or `feature/**`
- **Pull request** `opened`, `synchronize`, `reopened`, **`labeled`**

**PR gating:** jobs run on pull requests **only** when the PR has the label **`trigger:build-docker`**. Pushes to the branches above always run the jobs.

**Jobs:** parallel builds for **web**, **api**, **worker** (45-minute timeout each):

- `docker/setup-buildx-action`
- `docker/login-action` (GHCR auth for registry-backed cache)
- **`packages/docker/base/Dockerfile.deps`** built first, **`load: true`**, tagged **`agenticverdict/deps:ci`**, with GHA cache scope **`monorepo-deps`** (shared across the three jobs).
- **Worker** job also builds **`packages/docker/base/Dockerfile.chromium`** → **`agenticverdict/chromium-base:ci`** with scope **`chromium-base`**.
- `docker/metadata-action` → tags (branch, PR ref, `sha-*`)
- `docker/build-push-action` with **`push: false`**, **`load: true`**, `BUILDKIT_INLINE_CACHE=1`, **`DEPS_IMAGE=agenticverdict/deps:ci`** (and **`CHROMIUM_IMAGE`** for worker), and cache backends:
  - Registry cache: `ghcr.io/<owner>/<repo>/build-cache:{web|api|worker}`
  - GHA cache fallback: `type=gha` with per-service scopes

### Build cache and performance metrics

- Cache scopes are service-specific (`web`, `api`, `worker`) to reduce cross-service cache churn; **`monorepo-deps`** and **`chromium-base`** deduplicate expensive base layers across jobs on the same runner cache.
- First build for a service may be cold; later builds should reuse pnpm/deps layers and intermediate stages.
- The same workflow includes a manual `workflow_dispatch` performance job that runs `scripts/measure-build-performance.sh` for all services, uploads logs, and writes a summary table.
- For the implemented build architecture and cache semantics, see [Build optimization (implemented)](./build-optimization-implemented.md) and [`changelog/2026-04-09-docker-build-optimization.md`](../../changelog/2026-04-09-docker-build-optimization.md).

## `docker-release.yml` — publish to GHCR

**Trigger:** GitHub **Release** `published`.

**Registry:** `ghcr.io/<lowercase owner/repo>/{web,api,worker}`

**Tags:** semver (`{{version}}`, `{{major}}.{{minor}}`), `sha-*`, and **`latest`** when the release is **not** a prerelease.

**Signing:** after each push, **Cosign** keyless (`cosign sign --yes` with OIDC) signs the image digest.

**Permissions:** `packages: write`, `id-token: write`, `contents: read`.

Release builds also use inline cache and registry/GHA cache backends so published images carry reusable cache metadata across CI runs.

## `docker-scan.yml` — vulnerability scan and SBOM

**Triggers:**

- Push and pull request targeting **`main`**
- **Weekly** schedule (`cron: 0 6 * * 1` — Monday 06:00 UTC)

**Matrix:** `web`, `api`, `worker`

**Steps:**

1. `docker build` of **`Dockerfile.deps`** (all matrix jobs) and **`Dockerfile.chromium`** (worker only), then `docker build` of the app Dockerfile with matching **`DEPS_IMAGE` / `CHROMIUM_IMAGE`** build args → `agenticverdict/<service>:scan`
2. **Trivy** SARIF for **CRITICAL** and **HIGH**; **`exit-code: "0"`** (non-blocking)
3. Upload SARIF to GitHub (`upload-sarif`)
4. **Anchore SBOM** (`spdx-json`) uploaded as workflow artifact per service

**Permissions:** `security-events: write`, `actions: read`.

## `docker-compose-validate.yml` — Compose config + build smoke

**Triggers:** push and pull request when `docker-compose*.yml`, `deploy/docker-compose*.yml`, `scripts/docker-*.sh`, `Makefile`, `.env.docker.example`, or the workflow file change.

**Jobs:**

1. **`validate`** — runs `scripts/docker-validate.sh` (`docker compose … config` for each file and common merges).
2. **`compose-build-smoke`** (after validate) — `scripts/docker-prep.sh`, Buildx, `docker compose -f docker-compose.base-images.yml build`, then `docker compose -f docker-compose.yml -f docker-compose.apps.yml build` (no `up`).

**Permissions:** `contents: read`.

## Related CI

Application linting and tests remain in the main CI workflow (e.g. `.github/workflows/ci.yml` when present). Docker image builds intentionally use `next build --no-lint` for web; ESLint is expected in non-Docker CI paths.
