---
name: error-system
description: Implement and review AgenticVerdict canonical error-system changes across core, API/tRPC/worker boundaries, frontend adapters, and telemetry. Use this whenever a task mentions error handling, error codes, AppFault, translators, normalized frontend errors, fallback safety, or error observability, even if "error-system" is not explicitly named.
---

## Purpose

Provide a single workflow for extending or modifying the canonical error system while preserving contract consistency, tenant safety, and safe user-facing messaging.

## When to use

- Adding or changing canonical error codes/categories/surfaces.
- Updating `AppFault` normalization and translator behavior.
- Migrating backend/frontend code away from message-string matching.
- Adjusting frontend error rendering and telemetry metadata.
- Auditing regressions in error handling boundaries.

## Required references

1. `docs/05-reference/error-code-registry.md`
2. `openspec/changes/error-system/tasks.md`
3. `openspec/changes/error-system/specs/error-system-core/spec.md`
4. `openspec/changes/error-system/specs/error-system-boundaries/spec.md`
5. `openspec/changes/error-system/specs/error-system-frontend/spec.md`
6. `openspec/changes/error-system/specs/error-system-governance/spec.md`

## Non-negotiable constraints

- Use canonical codes from `packages/core/src/errors.ts` as SSOT.
- Keep translation logic boundary-specific (`http`, `trpc`, `queue`, `worker`, `frontend`) and typed.
- Never expose raw backend/internal messages in production UI output.
- Keep logs/telemetry secret-safe and low-cardinality.
- Add or update tests for changed error behavior and fallback paths.

## Implementation workflow

1. Classify scope: core contracts, boundary translators, frontend adapter, telemetry, governance checks.
2. Update canonical contracts first (`packages/core`) before downstream consumers.
3. Apply boundary/frontend mapping changes without string matching shortcuts.
4. Add regression tests for:
   - unknown code fallback behavior,
   - retry metadata handling,
   - correlation metadata propagation,
   - translator output correctness per boundary.
5. Run targeted checks for touched packages.
6. Record compatibility/risk notes when adding new codes.

## Validation checklist

- `pnpm check:error-governance`
- `pnpm check:error-translator-coverage`
- Package-specific tests for changed files (frontend/api/core).
- Type checks for touched packages.

## Failure conditions

- New error behavior without test updates.
- Unregistered codes or ad-hoc code strings introduced.
- Raw/internal message leakage into user-facing frontend paths.
- Missing canonical metadata in telemetry after handling errors.
