# Docker — single source of truth

This directory is the **authoritative** documentation for container images, Compose stacks, security overlays, observability, CI/CD, and day-to-day commands for AgenticVerdict. It reflects the implementation described in `changelog/2026-04-05-docker-implementation-containerization.md`, **`changelog/2026-04-08-layered-runtime-config-docker-mock-adapters.md`** (API/worker **TARGET_STAGE** compose overlays and layered config), and the **current** files in the repository (Compose, Dockerfiles, workflows, `deploy/`, `scripts/`).

**Recommended:** run Docker workflows from the repository root using the **`Makefile`** (`make help`, `make dev`, `make validate`, …). That keeps multi-file Compose invocations consistent with CI and docs. Use raw `docker compose -f …` when you need a custom merge (for example observability or backup overlays) or to inspect equivalent commands—see [Common operations](./common-operations.md).

For Docker-related operations, use this directory. Non-Docker operational notes (for example API troubleshooting, email, phase handoffs) live under `docs/06-reference/runbooks/`.

## Contents

| Document                                                                   | What it covers                                                                       |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [Getting started](./getting-started.md)                                    | Prerequisites, first-time secrets; **Makefile-first** and raw `docker compose` flows |
| [Local development with Docker](./local-development-with-docker.md)        | End-to-end local dev workflow with watch/rebuild inner loop                          |
| [Quick start](./quick-start.md)                                            | Shortest path: **`make`** + health checks                                            |
| [Compose files](./compose-files.md)                                        | What each `docker-compose*.yml` and `deploy/*` overlay contains                      |
| [Common operations](./common-operations.md)                                | Makefile targets, logs, rebuilds, migrations, backups                                |
| [Troubleshooting](./troubleshooting.md)                                    | Quick triage, links to health verification and CI                                    |
| [Compose and networking](./compose-and-networking.md)                      | Multi-file Compose, services, ports, volumes, overlays                               |
| [Container images](./container-images.md)                                  | Dockerfiles, build context, runtime users, health checks                             |
| [Environment and secrets](./environment-and-secrets.md)                    | Variables for apps, JWT file secret, `.gitignore`                                    |
| [Operations](./operations.md)                                              | Start/stop, logs, health scripts, backups, helper scripts                            |
| [Observability](./observability.md)                                        | Prometheus, Loki, Promtail, Grafana, optional Falco                                  |
| [Security](./security.md)                                                  | Seccomp, AppArmor override, read-only rootfs, app vs infra hardening                 |
| [Continuous integration](./continuous-integration.md)                      | `docker-build`, `docker-release`, `docker-scan`, Cosign                              |
| [Appendix](./appendix.md)                                                  | Command cheat sheet, file index, glossary                                            |
| [Health verification plan](./docker-health-verification-execution-plan.md) | Phased runbook: builds, services, volumes, networking, optional stacks               |
| [pgAdmin integration plan](./pgadmin-integration-implementation-plan.md)   | Step-by-step rollout plan for optional pgAdmin Compose overlay                       |
| **Phase 0: Build Optimization**                                            | **Performance analysis, research, implemented architecture**                         |
| [Build performance analysis](./build-performance-analysis.md)              | Current state assessment, bottleneck identification, metrics                         |
| [Build optimization research](./build-optimization-research.md)            | BuildKit patterns, cache strategies, production examples                             |
| [Build optimization (implemented)](./build-optimization-implemented.md)    | **SSOT:** shared deps/Chromium, API `FROM deps`, context hygiene, CI                 |
| [Build best practices](./build-best-practices.md)                          | BuildKit cache mounts, layer ordering, CI cache, and troubleshooting                 |
| `buildkitd.toml.example`                                                   | Example BuildKit daemon GC and parallelism settings for CI/self-hosted               |

The **implemented** build architecture is documented in [Build optimization (implemented)](./build-optimization-implemented.md); the dated consolidation narrative is [`changelog/2026-04-09-docker-build-optimization.md`](../../changelog/2026-04-09-docker-build-optimization.md). Day-to-day patterns remain in [Build best practices](./build-best-practices.md).

## Quick verification (local)

From the repository root (recommended **`make`** path):

```bash
make setup          # or: ./scripts/generate-secrets.sh  (+ optional .env.docker from .env.docker.example)
make preflight      # optional host checks
make dev            # base images + dev-stack api/worker + up --build
make health         # ./scripts/health-check.sh
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:4000/health
```

Production-like app images (no dev overlay): **`make apps-up`** then **`make health`**.

Optional database admin UI:

```bash
make pgadmin-up
make pgadmin-logs
make pgadmin-down
```

See [pgAdmin integration plan](./pgadmin-integration-implementation-plan.md) for implementation details and rollout rationale.

Equivalent raw Compose (no Makefile): `./scripts/generate-secrets.sh`, `docker compose -f docker-compose.base-images.yml build`, `docker compose -f docker-compose.yml -f docker-compose.apps.yml up -d --build` (add `-f docker-compose.dev.yml` or `-f deploy/docker-compose.dev.override.yml` for mock-friendly api/worker—see [Getting started](./getting-started.md#environment-modes-and-manual-testing)).

## Historical and supplementary material

- Changelog narrative: `changelog/2026-04-05-docker-implementation-containerization.md`
