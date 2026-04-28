---
name: runtime-config-docker
description: Enforce production-safe, Makefile-first Docker workflows and layered runtime configuration boundaries for API/worker/web services in AgenticVerdict.
---

## Purpose

Ensure Docker and runtime-config changes follow Makefile-first workflows, layered configuration boundaries, and production-safe build/runtime behavior.

## When to use

- Dockerfiles, compose files, image build pipelines.
- Runtime config loading/validation or env contract changes.
- API/worker/web container behavior changes.
- CI workflows related to Docker build/scan/release/validation.

## Required sources of truth

- `/docs/docker/README.md`
- `/docs/docker/quick-start.md`
- `/docs/docker/getting-started.md`
- `/docs/architecture/runtime-mocking-comprehensive-guide.md`
- `/changelog/2026-04-15-repository-wide-vite-migration.md`

## Guardrails

- Prefer `make` targets over ad-hoc compose commands.
- Keep configuration layers separated:
  - build constants,
  - runtime env config,
  - DB feature flags.
- Keep `TARGET_STAGE` and `NODE_ENV` coherent.
- Keep mock adapter scope constrained to intended API/worker paths.
- Do not commit secrets; use env templates only.

## Step-by-step workflow

1. Classify scope (build, compose, runtime contract, mock behavior, CI).
2. Load Docker/runtime SSOT docs.
3. Map layer boundaries and avoid cross-layer coupling.
4. Validate stage/env correctness across impacted services.
5. Implement with Makefile-first workflow.
6. Validate mock-adapter boundaries and production bundle safety.
7. Update docs/templates when behavior changes.

## Validation commands

- `make help`
- `make preflight`
- `make validate`
- `make dev` (when integrated stack verification is needed)
- `make apps-up` (when production-like app image checks are needed)
- `NODE_ENV=production pnpm run verify:production-bundle`

## Deliverables

- Docker/config changes aligned with SSOT and Makefile workflows.
- Validation evidence with command results.
- Updated docs/env templates when relevant.
- Clear residual-risk note for operationally sensitive changes.

## Failure conditions

- Workflow depends on undocumented ad-hoc compose usage.
- `TARGET_STAGE`/`NODE_ENV` mismatch.
- Runtime-config layer boundary violations.
- Mock behavior leaks to disallowed scope.
- Production-bundle verification is skipped or failing.
