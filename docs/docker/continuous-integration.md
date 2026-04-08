# Continuous integration (Docker)

Workflows live under `.github/workflows/`. Runners are `ubuntu-latest` (amd64); image builds do not pin `platforms:` in YAML — behavior follows Docker Buildx defaults on the runner.

## `docker-build.yml` — verify image builds

**Triggers:**

- **Push** to `main` or `feature/**`
- **Pull request** `opened`, `synchronize`, `reopened`, **`labeled`**

**PR gating:** jobs run on pull requests **only** when the PR has the label **`trigger:build-docker`**. Pushes to the branches above always run the jobs.

**Jobs:** parallel builds for **web**, **api**, **worker** (45-minute timeout each):

- `docker/setup-buildx-action`
- `docker/metadata-action` → tags (branch, PR ref, `sha-*`)
- `docker/build-push-action` with **`push: false`**, **`load: true`**, GHA cache per image (`scope=web|api|worker`)

## `docker-release.yml` — publish to GHCR

**Trigger:** GitHub **Release** `published`.

**Registry:** `ghcr.io/<lowercase owner/repo>/{web,api,worker}`

**Tags:** semver (`{{version}}`, `{{major}}.{{minor}}`), `sha-*`, and **`latest`** when the release is **not** a prerelease.

**Signing:** after each push, **Cosign** keyless (`cosign sign --yes` with OIDC) signs the image digest.

**Permissions:** `packages: write`, `id-token: write`, `contents: read`.

## `docker-scan.yml` — vulnerability scan and SBOM

**Triggers:**

- Push and pull request targeting **`main`**
- **Weekly** schedule (`cron: 0 6 * * 1` — Monday 06:00 UTC)

**Matrix:** `web`, `api`, `worker`

**Steps:**

1. `docker build` to `agenticverdict/<service>:scan`
2. **Trivy** SARIF for **CRITICAL** and **HIGH**; **`exit-code: "0"`** (non-blocking)
3. Upload SARIF to GitHub (`upload-sarif`)
4. **Anchore SBOM** (`spdx-json`) uploaded as workflow artifact per service

**Permissions:** `security-events: write`, `actions: read`.

## Related CI

Application linting and tests remain in the main CI workflow (e.g. `.github/workflows/ci.yml` when present). Docker image builds intentionally use `next build --no-lint` for web; ESLint is expected in non-Docker CI paths.
