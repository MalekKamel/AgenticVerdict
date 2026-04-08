# Docker — single source of truth

This directory is the **authoritative** documentation for container images, Compose stacks, security overlays, observability, CI/CD, and day-to-day commands for AgenticVerdict. It reflects the implementation described in `changelog/2026-04-05-docker-implementation-containerization.md` and the **current** files in the repository (Compose, Dockerfiles, workflows, `deploy/`, `scripts/`).

For Docker-related operations, use this directory. Non-Docker operational notes (for example API troubleshooting, email, phase handoffs) live under `docs/06-reference/runbooks/`.

## Contents

| Document                                                                   | What it covers                                                         |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [Getting started](./getting-started.md)                                    | Prerequisites, first-time secrets, minimal `docker compose` flows      |
| [Compose and networking](./compose-and-networking.md)                      | Multi-file Compose, services, ports, volumes, overlays                 |
| [Container images](./container-images.md)                                  | Dockerfiles, build context, runtime users, health checks               |
| [Environment and secrets](./environment-and-secrets.md)                    | Variables for apps, JWT file secret, `.gitignore`                      |
| [Operations](./operations.md)                                              | Start/stop, logs, health scripts, backups, helper scripts              |
| [Observability](./observability.md)                                        | Prometheus, Loki, Promtail, Grafana, optional Falco                    |
| [Security](./security.md)                                                  | Seccomp, AppArmor override, read-only rootfs, app vs infra hardening   |
| [Continuous integration](./continuous-integration.md)                      | `docker-build`, `docker-release`, `docker-scan`, Cosign                |
| [Appendix](./appendix.md)                                                  | Command cheat sheet, file index, glossary                              |
| [Health verification plan](./docker-health-verification-execution-plan.md) | Phased runbook: builds, services, volumes, networking, optional stacks |

## Quick verification (local)

From the repository root:

```bash
./scripts/generate-secrets.sh
docker compose -f docker-compose.yml -f docker-compose.apps.yml up -d --build
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:4000/health
./scripts/health-check.sh
```

## Historical and supplementary material

- Changelog narrative: `changelog/2026-04-05-docker-implementation-containerization.md`
