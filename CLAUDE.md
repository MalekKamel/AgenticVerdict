# CLAUDE.md

This file defines always-on guardrails for working in this repository. Detailed, task-conditional guidance lives in skills under `.agents/skills/`.

## Project essentials

- Multi-tenant SaaS architecture with strict tenant isolation.
- Configuration-driven behavior; avoid tenant-specific hardcoding.
- Monorepo stack centered on TypeScript, Turborepo, pnpm, Vite, Fastify/tRPC, PostgreSQL/Drizzle.
- Frontend uses TanStack Start + Mantine with design-system governance.

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

- `frontend-governance`
  - Trigger: changes to `apps/frontend`, `packages/ui`, routes, auth pages, UI/UX, localization, or design tokens.
- `multi-tenant-guardrails`
  - Trigger: API/worker/database/auth/config changes that can impact tenant resolution, scoping, or isolation.
- `runtime-config-docker`
  - Trigger: Dockerfiles, compose files, runtime env/config behavior, CI container workflows, mock runtime configuration.
- `testing-policy`
  - Trigger: any behavior-changing implementation, refactor, bug fix, or CI-quality hardening.
- `docs-navigation`
  - Trigger: planning/research/review tasks that need SSOT discovery or conflict resolution.
- `backend-patterns`
  - Trigger: backend/domain/service/connector implementation in `apps/api`, `apps/worker`, or shared backend packages.
- `roadmap-context`
  - Trigger: phase planning, scope definition, milestone execution, or roadmap-gap reconciliation.

For detailed skill usage and maintenance, see `/docs/05-reference/skills-reference.md`.

## Frontend governance precedence

For frontend conflicts, precedence is:

1. `/docs/05-reference/frontend-ui-architecture-guidelines.md`
2. `/design-system/README.md`
3. `/docs/05-reference/frontend-development-guidelines.md`
4. `/CLAUDE.md`

## Mandatory workflow reminders

- Prefer documented repository workflows and SSOT docs for each domain.
- Prefer `make` targets for Docker/Compose workflows from repo root.
- Run type checks and targeted tests for changed scope before concluding work.
- If a rule must be deviated from, document rationale, risk, mitigation, owner, and due date.
