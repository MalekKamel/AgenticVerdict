# Repository-Wide Vite Migration

## Context

- The web application (`apps/frontend`) has already been migrated to **TanStack Start** with **Vite** as the bundler.
- Other packages or apps in the monorepo may still rely on non-Vite build tooling or inconsistent configuration.

## Objective

Complete a **repository-wide adoption of Vite** for bundling and dev servers where applicable, so build and development workflows are consistent with `apps/frontend` and with modern tooling expectations.

**Clarification:** This effort targets **Vite** as the build tool. **Turborepo** (`turbo`) may remain in use for monorepo task orchestration (for example `turbo run build`); the goal is not to replace orchestration unless explicitly required, but to ensure **bundling and Vite-related workflows** are correctly documented and implemented.

## Scope of Work

1. **Codebase analysis**  
   Inventory all packages and apps: identify current bundlers (e.g. Webpack, Rollup-only, legacy scripts), entry points, and how builds are invoked from the root and from CI.

2. **Migration**  
   Migrate remaining consumers to **Vite** (or to a clearly justified shared Vite preset) so that dev, build, and preview flows are Vite-based end-to-end for frontend and any other packages that should use Vite per project conventions.

3. **Documentation**  
   Update **all affected documentation** so instructions, architecture notes, and developer onboarding describe **Vite-based** builds and commands—not outdated tooling. Remove or replace references that imply a non-Vite default where the repo has standardized on Vite.

4. **Validation**  
   Confirm `pnpm`/Turborepo pipelines, scripts, and Docker or CI steps still run successfully after the migration.

## Deliverables

- Vite configuration and scripts applied consistently across the agreed scope.
- Documentation and examples aligned with the new setup.
- A short summary of what changed (packages touched, breaking changes if any, and how to run dev/build locally).

## Success Criteria

- No remaining critical path that depends on a legacy bundler for targets that are in scope for Vite.
- Docs match actual commands and architecture.
- Builds and checks relevant to the migration pass in the development environment used by the team.
