# Appendix

## Command cheat sheet

| Goal                             | Command                                                                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Recommended daily workflow**   | `make setup` (first time) → `make preflight` → `make dev` or `make apps-up` → `make health`; `make validate` after compose edits ([Common operations](./common-operations.md))                    |
| Infra only                       | **`make infra-up`** / **`make infra-down`** (or `docker compose up -d` / `down`)                                                                                                                  |
| Apps + infra                     | **`make apps-up`** (or `make build` then raw `docker compose -f docker-compose.base-images.yml build` + `-f docker-compose.yml -f docker-compose.apps.yml up -d --build`)                         |
| Apps + infra + api/worker mocks  | Add `-f docker-compose.dev.yml` or `-f deploy/docker-compose.dev.override.yml` (see [Getting started](./getting-started.md))                                                                      |
| + Observability                  | Add `-f docker-compose.observability.yml`                                                                                                                                                         |
| + Falco (Linux)                  | Add `--profile security` to the observability command                                                                                                                                             |
| + Backup sidecar                 | `docker compose -f docker-compose.yml -f deploy/docker-compose.backup.yml up -d`                                                                                                                  |
| Generate secrets                 | `./scripts/generate-secrets.sh`                                                                                                                                                                   |
| HTTP health                      | `./scripts/health-check.sh`                                                                                                                                                                       |
| Manual DB dump                   | `./scripts/backup-postgres.sh`                                                                                                                                                                    |
| Build image (web / api / worker) | Build `docker/base/Dockerfile.deps` (+ Chromium for worker); then `docker build --build-arg DEPS_IMAGE=…` per [Getting started](./getting-started.md#optional-local-image-builds-without-compose) |

## Repository file index (Docker-related)

| Path                                                                  | Role                                                     |
| --------------------------------------------------------------------- | -------------------------------------------------------- |
| `docker-compose.yml`                                                  | Postgres + Redis                                         |
| `docker-compose.networks.yml`                                         | Shared bridge network                                    |
| `docker-compose.base-images.yml`                                      | Shared deps + Chromium base images                       |
| `docker-compose.apps.yml`                                             | Web, API, worker                                         |
| `docker-compose.dev.yml`                                              | API/worker dev stage + mock env (merge with apps)        |
| `docker-compose.test.yml`                                             | API/worker test stage + mock env                         |
| `deploy/docker-compose.dev.override.yml`                              | Same intent as `docker-compose.dev.yml` (deploy path)    |
| `docker-compose.observability.yml`                                    | Prometheus, Loki, Promtail, Grafana, Falco               |
| `apps/frontend/Dockerfile`                                            | Next.js standalone / distroless                          |
| `apps/api/Dockerfile`                                                 | Fastify API + tsx                                        |
| `apps/worker/Dockerfile`                                              | BullMQ worker + tsx                                      |
| `deploy/docker-compose.backup.yml`                                    | Scheduled backups                                        |
| `deploy/docker-compose.production.example.yml`                        | Production-shaped example                                |
| `deploy/docker-compose.security-linux.override.yml`                   | AppArmor overlay                                         |
| `deploy/security/seccomp-profile.json`                                | Seccomp JSON                                             |
| `deploy/security/apparmor-profile`                                    | AppArmor template                                        |
| `deploy/observability/*`                                              | Prometheus, Loki, Promtail, Grafana, Falco configs       |
| `.github/workflows/docker-build.yml`                                  | CI image build                                           |
| `.github/workflows/docker-release.yml`                                | GHCR push + Cosign                                       |
| `.github/workflows/docker-scan.yml`                                   | Trivy + SBOM                                             |
| `.github/workflows/docker-compose-validate.yml`                       | Compose `config` validation + optional image build smoke |
| `Makefile`                                                            | Dev/prod-like/infra targets, backup, validate, etc.      |
| `scripts/docker-validate.sh`                                          | Local / CI Compose merge checks                          |
| `scripts/docker-preflight.sh`                                         | Docker / port / `.env.docker` hints                      |
| `scripts/docker-setup.sh`                                             | Secrets + dirs bootstrap                                 |
| `scripts/docker-backup.sh` / `scripts/docker-restore.sh`              | Postgres (+ optional Redis) backup / restore             |
| `scripts/generate-secrets.sh`                                         | Local secret files                                       |
| `scripts/health-check.sh`                                             | Health probes                                            |
| `scripts/backup-postgres.sh`                                          | One-off `pg_dump`                                        |
| `scripts/dockerPrebuild.mjs`                                          | Node 20+ guard                                           |
| `scripts/bootstrap-deploy-dirs.sh`                                    | Server directory layout                                  |
| `scripts/setup-tls.sh`                                                | Dev TLS material                                         |
| `scripts/compliance/*.sh`                                             | Operational verification helpers                         |
| `changelog/2026-04-05-docker-implementation-containerization.md`      | Implementation changelog                                 |
| `changelog/2026-04-08-layered-runtime-config-docker-mock-adapters.md` | TARGET_STAGE images, layered config, feature flags       |

## Glossary

| Term                     | Meaning                                               |
| ------------------------ | ----------------------------------------------------- |
| **Overlay**              | Additional Compose file merged with `-f`              |
| **SSOT**                 | Single source of truth (this `docs/docker/` tree)     |
| **GHCR**                 | GitHub Container Registry (`ghcr.io`)                 |
| **Standalone (Next.js)** | Self-contained server output under `.next/standalone` |
| **Distroless**           | Minimal runtime image without shell (web final stage) |
