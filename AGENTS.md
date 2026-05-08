# AGENTS.md

**Purpose:** High-signal entry point for AI agents. Read this first, then load skills via `CLAUDE.md` trigger matrix for task-conditional workflows.

---

## Quick Start

```bash
pnpm install
make setup              # Docker secrets & directories
make dev                # Start full stack
make health             # Verify all services
pnpm run typecheck      # Type-check all packages
pnpm run lint           # Lint all packages
pnpm run test:unit      # Unit tests (Vitest workspace)
```

**Key commands:** See `Makefile` for 50+ Docker/compose targets. Use `make help`.

---

## Monorepo Structure

```
apps/        # api, worker, frontend, desktop
packages/    # core, database, data-connectors, agent-runtime, config, i18n, observability, testing, ui, types, report-generator
```

Full architecture details → `architecture-governance` skill.

---

## Multi-Tenancy (Critical)

Every operation must be tenant-scoped:

1. Tenant context via `AsyncLocalStorage`
2. Row-level security in PostgreSQL
3. Tenant-prefixed cache keys in Redis
4. Structured logging with tenant metadata

**Never:** Hardcode tenant IDs, access DB without `dbScoped()`, log credentials/tokens/PII.

Full guardrails → `multi-tenant-guardrails` skill.

---

## Skill System

Task-conditional workflows live in `.agents/skills/`. The trigger matrix in `CLAUDE.md` determines which skill to load:

| Skill                     | Trigger                                          |
| ------------------------- | ------------------------------------------------ |
| `architecture-governance` | Monorepo structure, service boundaries, adapters |
| `coding-standards`        | TypeScript, error handling, logging, security    |
| `ci-governance`           | CI/CD pipeline, PR workflow, bundle gates        |
| `frontend-governance`     | `apps/frontend`, `packages/ui`, routes, UI/UX    |
| `multi-tenant-guardrails` | API/worker/database/auth/tenant isolation        |
| `runtime-config-docker`   | Dockerfiles, compose, runtime config             |
| `testing-policy`          | Behavior-changing implementation, refactors      |
| `backend-patterns`        | `apps/api`, `apps/worker`, backend packages      |
| `docs-navigation`         | Planning/research needing SSOT discovery         |
| `roadmap-context`         | Phase planning, milestone execution              |

Full skill reference → `docs/05-reference/skills-reference.md`.

---

## Command Order

```bash
lint -> typecheck -> test -> build
```

Full CI/CD details → `ci-governance` skill.

---

## Troubleshooting

Common issues and resolutions → `docs/05-reference/skills-reference.md` or domain-specific skills above.
