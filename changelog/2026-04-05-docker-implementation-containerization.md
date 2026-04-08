# Docker foundation snapshot — AgenticVerdict

**Date:** 2026-04-05  
**Kind:** Greenfield foundation — this file is **one description of what the foundation implements**, not a timeline of edits.

This slice delivers **container images** for web, API, and worker; **Postgres and Redis** in Compose with hardening defaults; **multi-file Compose** for apps, networks, observability (metrics + logs + optional runtime security), backups, production-shaped examples, and Linux AppArmor overrides; **secrets, TLS, health, and backup helpers** plus **compliance-oriented shell scripts**; **GitHub Actions** for Docker build, release, and scanning; **API auth** aligned with file-backed JWT secrets; **worker CLI** for Redis-backed jobs; **lockfile and package updates** for image runtime parity; and companion **documentation** for how to run, secure, and validate the stack. **Operational single source of truth:** [`docs/docker/README.md`](../docs/docker/README.md).

---

## Application images

### Next.js web (`apps/web`)

- **`next.config.ts`:** `output: "standalone"` and `outputFileTracingRoot` at the monorepo root so `.next/standalone` traces workspace packages; runtime entry is `apps/web/server.js` relative to the standalone root.
- **`apps/web/Dockerfile`:** Multi-stage build on **Node 20 bookworm-slim** (`pnpm install --frozen-lockfile`, `scripts/dockerPrebuild.mjs`, `next build --no-lint`), then **`gcr.io/distroless/nodejs20-debian12`**: copies standalone output, `.next/static`, and `public` as **65532:65532**, runs non-root, **`NODE_OPTIONS`** for IPv4-first DNS and **TLS 1.2+**, **`HEALTHCHECK`** via **`/nodejs/bin/node -e`** and **`fetch`** to `/api/health`. Build stages set **`COREPACK_ENABLE_DOWNLOAD_PROMPT=0`**.
- **Lint in images:** Image builds use **`--no-lint`**; ESLint remains for local dev and CI (see [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) when present).

### API (`apps/api`)

- **`apps/api/Dockerfile`:** Workspace install, **bookworm-slim** runner, non-root **`appuser`**, **`WORKDIR /app/apps/api`**, same **`NODE_OPTIONS`** as web, **`CMD ["node", "--import", "tsx", "src/cli.ts"]`** (no runtime **pnpm** / Corepack fetch as non-root), **`wget`** healthcheck on **`/health`** with a 45s start period.
- **`apps/api/package.json`:** **`tsx`** as a production dependency for the same entry pattern.
- **`apps/api/src/middleware/auth.ts` (+ tests):** JWT signing material from **`JWT_SECRET_FILE`** (read once, trimmed, cached; **`resetJwtSecretCacheForTests`** for Vitest) or **`JWT_SECRET`**, minimum length **8**, matching Compose secrets under **`/run/secrets/`**.

### Worker (`apps/worker`)

- **`apps/worker/src/cli.ts`:** Requires **`REDIS_URL`**, registers report workers, graceful shutdown on **`SIGTERM`** / **`SIGINT`** (including Redis **`quit()`** after workers stop).
- **`apps/worker/package.json`:** **`tsx`** in dependencies; **`start`** uses **`node --import tsx src/cli.ts`** to mirror the image.
- **`apps/worker/Dockerfile`:** Same runtime pattern as API (**bookworm-slim**, **`appuser`**, **`NODE_OPTIONS`**, **`WORKDIR /app/apps/worker`**). **`AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS=1`** in the Compose overlay unless Playwright/Chromium is added to the image.

---

## Monorepo build hygiene

- **`scripts/dockerPrebuild.mjs`:** Node 20+ guard invoked from Dockerfiles before app builds.

---

## Compose

### Named network ([`docker-compose.networks.yml`](../docker-compose.networks.yml))

- Bridge **`agenticverdict`** (**`172.28.0.0/16`**), included by the base stack and observability.

### Base infrastructure ([`docker-compose.yml`](../docker-compose.yml))

- **Postgres:** **`postgres:16-alpine`**, volume **`pgdata`**, **`5432:5432`**, **`pg_isready`**, **`deploy.resources`**, **`read_only: true`**, **`tmpfs`** on **`/tmp`** and **`/run`**, **`cap_drop: [ALL]`**, **`security_opt`:** **`no-new-privileges:true`** and **`seccomp=deploy/security/seccomp-profile.json`** (repo-relative).
- **Redis:** **`redis:7-alpine`**, volume **`redis_data`**, AOF, **`6379:6379`**, healthcheck, resources, same read-only / caps / seccomp pattern (**`tmpfs`** on **`/tmp`** only).
- **Network:** Both on **`agenticverdict`**.

### Application overlay ([`docker-compose.apps.yml`](../docker-compose.apps.yml))

- **Build:** **`web`**, **`api`**, **`worker`** from repo root with root-relative Dockerfiles.
- **Depends on:** Postgres and Redis with **`condition: service_healthy`**.
- **Ports:** Web **`3000:3000`**, API **`4000:4000`**.
- **Environment:** **`DATABASE_URL`**, **`REDIS_URL`**, **`COMPANY_CONFIG_DIR`**; worker stub generators flag; **`TMPDIR`** / **`XDG_CACHE_HOME`** under **`/tmp`** for read-only rootfs with **`tsx`**.
- **Secrets:** **`./secrets/jwt_secret.txt`** → **`jwt_secret`**; API **`JWT_SECRET_FILE: /run/secrets/jwt_secret`**. Run **`scripts/generate-secrets.sh`** before first **`up`**.
- **Hardening (web / api / worker):** **`read_only: true`**, **`tmpfs`** on **`/tmp`**, **`cap_drop: [ALL]`**, seccomp path **`deploy/security/seccomp-profile.json`**, **`deploy.resources`**.

### Observability overlay ([`docker-compose.observability.yml`](../docker-compose.observability.yml))

- **Includes** [`docker-compose.networks.yml`](../docker-compose.networks.yml).
- **Prometheus** (**`prom/prometheus:v2.55.1`**): config from **`deploy/observability/prometheus.yml`**, TSDB volume, **`9090:9090`**, **`agenticverdict`**, resource limits.
- **Loki** (**`grafana/loki:3.3.2`**): **`deploy/observability/loki/local-config.yaml`**, volume **`loki_data`**, **`127.0.0.1:3100:3100`**, read-only root + **`cap_drop`** + **`tmpfs`** where configured.
- **Promtail** (**`grafana/promtail:3.3.2`**): Docker socket mount for log shipping, config **`deploy/observability/promtail/config.yml`**, depends on Loki.
- **Grafana** (**`grafana/grafana:11.4.0`**): **`3001:3000`**, provisioning under **`deploy/observability/grafana/provisioning`** (Prometheus + **Loki** datasources in **`datasources.yml`**), volume for Grafana data, depends on Prometheus and Loki.
- **Falco** (**`falcosecurity/falco:0.39.2`**, Compose **`profile: security`**): privileged, host mounts for syscall visibility, custom rules **`deploy/observability/falco/rules.d/agenticverdict-custom.yaml`**, JSON logging — **Linux hosts**; enable with **`--profile security`**.

### Backup overlay ([`deploy/docker-compose.backup.yml`](../deploy/docker-compose.backup.yml))

- **`postgres-backup`** (**`prodrigestivill/postgres-backup-local:16`**): schedule, retention knobs, credentials aligned with dev Compose, volume **`pg_backups`**, **`agenticverdict`**, **`depends_on`** Postgres healthy, read-only + **`tmpfs`**, light resources.

### Production-oriented example ([`deploy/docker-compose.production.example.yml`](../deploy/docker-compose.production.example.yml))

- Example project **`agenticverdict-prod`**: **`REGISTRY`** / **`VERSION`** image refs, required **`POSTGRES_PASSWORD`**, JWT from file-backed secret paths relative to **`deploy/`**, published ports, healthchecks, **`depends_on`**, inline **`agenticverdict`** network, volumes, resources, read-only rootfs, **`tmpfs`**, **`cap_drop`**, seccomp (**`security/seccomp-profile.json`** relative to **`deploy/`**).

### Optional Linux hardening ([`deploy/docker-compose.security-linux.override.yml`](../deploy/docker-compose.security-linux.override.yml))

- Appends **`apparmor=agenticverdict-app`** to **`security_opt`** for **web**, **api**, and **worker** (Compose list merge). Postgres/Redis omitted where shells are required.

---

## Secrets, TLS, health, backup, and compliance scripts

- **`scripts/generate-secrets.sh`:** **`secrets/jwt_secret.txt`**, **`db_password.txt`**, **`redis_password.txt`**, **`encryption_key.txt`** via **`openssl`**, **`chmod 600`**.
- **`scripts/setup-tls.sh`:** Dev self-signed material under **`deploy/tls/`**; production guidance otherwise.
- **`scripts/bootstrap-deploy-dirs.sh`:** Creates **`DEPLOY_ROOT`** (default **`/opt/agenticverdict`**) layout: **`secrets`**, **`certs`**, **`logs`**, **`backups`**, **`scripts`**, **`monitoring`** with tightened permissions.
- **`scripts/health-check.sh`:** HTTP checks for web **`/api/health`** and API **`/health`** (overridable **`WEB_HEALTH_URL`** / **`API_HEALTH_URL`**); optional **`docker compose`** probes when the stack is up.
- **`scripts/backup-postgres.sh`:** One-off **`pg_dump`** from **`postgres`** to timestamped **`.sql.gz`** under **`./backups`**.
- **`scripts/compliance/`:** Operational checks and runbook helpers — e.g. **`verify-runtime-hardening.sh`**, **`verify-networks.sh`**, **`verify-database.sh`**, **`verify-backups.sh`**, **`verify-compliance-sql.sh`**, **`pitr-recovery.sh`**, **`restore-from-backup.sh`**, **`rotate-secrets.sh`**, **`security-audit.sh`**, **`security-patch-deploy.sh`**, **`performance-review.sh`** — supporting documented gap/remediation workflows.

- **`.gitignore`:** Ignores **`secrets/`**, **`deploy/tls/*.pem`**, **`backups/`**, and related Docker dev paths so generated material is not committed.

---

## Security profiles

- **`deploy/security/seccomp-profile.json`:** Seccomp JSON for Node and data images; referenced from Compose **`security_opt`**.
- **`deploy/security/apparmor-profile`:** **`agenticverdict-app`** for optional Linux application containers (see security override).

---

## Continuous integration and release

### Image build ([`.github/workflows/docker-build.yml`](../.github/workflows/docker-build.yml))

- **Triggers:** Push to **`main`** or **`feature/**`**; PRs (**`opened`**, **`synchronize`**, **`reopened`**, **`labeled`\*\*).
- **PR gating:** Docker jobs on PRs only when label **`trigger:build-docker`** is set; pushes build **web**, **api**, **worker**.
- **Per job:** Buildx, **`docker/metadata-action@v5`**, **`docker/build-push-action@v6`** with **`push: false`**, **`load: true`**, **`linux/amd64`**, GHA cache per image.

### Release push ([`.github/workflows/docker-release.yml`](../.github/workflows/docker-release.yml))

- **Trigger:** GitHub **release** published.
- **Registry:** GHCR **`ghcr.io/<lowercase owner/repo>/{web,api,worker}`**, **`GITHUB_TOKEN`**, **`linux/amd64`**, semver tags from metadata, **`latest`** when not prerelease.

### Image scan ([`.github/workflows/docker-scan.yml`](../.github/workflows/docker-scan.yml))

- **Triggers:** Push and PR to **`main`**, weekly schedule.
- **Matrix:** **web**, **api**, **worker** — build, **Trivy** SARIF (**CRITICAL** / **HIGH**, non-blocking scan step), **upload-sarif**, **Anchore SBOM** (SPDX JSON) artifact.

---

## Documentation (staged with this foundation)

- **Docker (single source of truth):** [`docs/docker/README.md`](../docs/docker/README.md) — images, Compose, security, observability, CI/CD, operations, testing.
- **Methodology:** [`docs/02-planning-and-methodology/report-generation-system-test-plan.md`](../docs/02-planning-and-methodology/report-generation-system-test-plan.md) (report paths, mocks, GLM gate).
- **Roadmap presentation:** [`docs/05-project-management/simplified-mvp-roadmap-ppt.md`](../docs/05-project-management/simplified-mvp-roadmap-ppt.md) updated for current messaging.
- **Phase status analysis:** [`PHASE_COMPLETION_ANALYSIS.md`](../PHASE_COMPLETION_ANALYSIS.md) and [`PHASE_COMPLETION_COMPREHENSIVE_REPORT.md`](../PHASE_COMPLETION_COMPREHENSIVE_REPORT.md) — structured review of Phase 02 / 03 completion against acceptance criteria (companion to containerization work, not a substitute for runtime verification).

---

## Verify locally

```bash
# One-time secret files for Compose (JWT file for API)
./scripts/generate-secrets.sh

# Infrastructure only
pnpm run db:up
docker compose ps

# Direct image builds (optional)
docker build -f apps/web/Dockerfile -t agenticverdict/web:local .
docker build -f apps/api/Dockerfile -t agenticverdict/api:local .
docker build -f apps/worker/Dockerfile -t agenticverdict/worker:local .

# Full stack: apps + Postgres + Redis
docker compose -f docker-compose.yml -f docker-compose.apps.yml up -d --build

# Optional: Prometheus, Grafana, Loki, Promtail (Grafana http://localhost:3001, Prometheus :9090, Loki :3100 loopback)
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f docker-compose.observability.yml up -d

# Optional: same stack + Falco on Linux (--profile security)
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f docker-compose.observability.yml --profile security up -d

# Optional: scheduled Postgres backups (volume pg_backups)
docker compose -f docker-compose.yml -f deploy/docker-compose.backup.yml up -d

# Optional: one-off SQL dump to ./backups on the host
./scripts/backup-postgres.sh

curl -fsS http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:4000/health

./scripts/health-check.sh
```

---

## Out of scope for this foundation slice

- **API / worker images:** Still ship workspace sources and **`tsx`**; compiling to minimal JS artifacts is a later optimization.
- **Edge TLS:** Terminate at proxy / ingress / cloud LB; **`setup-tls.sh`** targets dev certs under **`deploy/tls/`**.
- **Network depth:** Three-tier segmentation is future hardening beyond the single named bridge.
- **Further detail:** Use [`docs/docker/README.md`](../docs/docker/README.md) and the linked pages in that directory.

---

## Related documentation (index)

- [`docs/docker/README.md`](../docs/docker/README.md)
- [`docs/docker/getting-started.md`](../docs/docker/getting-started.md)
- [`docs/docker/testing.md`](../docs/docker/testing.md)
