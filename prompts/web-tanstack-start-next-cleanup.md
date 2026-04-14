# Web app stack consolidation: Next.js removal

## Background

The `apps/web` package was originally scaffolded with Next.js. The project has since migrated to **TanStack Start**. Residual Next.js configuration, dependencies, patterns, and documentation may still exist and should be eliminated so the web app has a single, coherent stack.

## Goal

Complete removal of Next.js from `apps/web` and alignment of the codebase with **TanStack Start** as the only application framework and runtime for that package.

## Scope of work

1. **Analyze** `apps/web` (and any shared packages it depends on for routing/build) to identify:
   - Next.js dependencies and scripts
   - Next.js-specific APIs, file conventions, and configuration
   - Documentation or comments that still describe a Next.js setup

2. **Clean up** by replacing or removing the above with TanStack Start–appropriate equivalents, or by deleting obsolete artifacts.

3. **Verify** that the web app:
   - Builds successfully
   - Passes TypeScript type checking with no errors
   - Passes the project’s lint rules with no issues

## Deliverable

A fully migrated `apps/web` tree where TanStack Start is the sole stack, with a clean build and no type or lint regressions attributable to this cleanup.

## Constraints

- Preserve existing product behavior unless a change is required strictly for the stack migration or build health.
- Follow repository conventions (monorepo scripts, shared configs, coding standards).
