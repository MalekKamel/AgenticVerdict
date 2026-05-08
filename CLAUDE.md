# CLAUDE.md

This file defines always-on guardrails for working in this repository. Detailed, task-conditional guidance lives in skills under `.agents/skills/`.

## Non-negotiable constraints

1. No `any` types in production code.
2. No hardcoded tenant logic.
3. No tenant data access without tenant context and scoping safeguards.
4. No sensitive data in logs (credentials, tokens, raw PII).
5. No long-running blocking operations in API request handlers.
6. No platform-specific leakage into shared core abstractions.
7. Follow security-first defaults and fail-closed validation behavior.

## Skill trigger matrix

Load and follow these skills based on change scope:

| Skill                     | Trigger                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------- |
| `architecture-governance` | Monorepo structure, service boundaries, adapters                                    |
| `coding-standards`        | TypeScript, error handling, logging, security                                       |
| `ci-governance`           | CI/CD pipeline, PR workflow, bundle gates                                           |
| `frontend-governance`     | `apps/frontend`, `packages/ui`, routes, UI/UX                                       |
| `multi-tenant-guardrails` | API/worker/database/auth/tenant isolation                                           |
| `runtime-config-docker`   | Dockerfiles, compose, runtime config                                                |
| `testing-policy`          | Behavior-changing implementation, refactors                                         |
| `backend-patterns`        | `apps/api`, `apps/worker`, backend packages                                         |
| `docs-navigation`         | Planning/research needing SSOT discovery                                            |
| `roadmap-context`         | Phase planning, milestone execution                                                 |
| `debugging`               | Service failures, log analysis, health checks, connectivity issues, troubleshooting |

Full skill reference → `docs/05-reference/skills-reference.md`.
For detailed skill usage and maintenance, see `AGENTS.md`.
