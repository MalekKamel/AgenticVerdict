---
name: docs-navigation
description: Fast, reliable navigation of AgenticVerdict documentation so agents can find the right source-of-truth files by task type and avoid conflicting guidance.
---

## Purpose

Provide a concise lookup guide to locate authoritative documentation before planning, implementing, or reviewing changes.

## When to use

- Starting non-trivial architecture/frontend/infra/testing/roadmap tasks.
- Resolving conflicting documentation.
- Preparing implementation plans and review notes.

## Navigation map by task type

- Architecture:
  - `docs/architecture/business/business-architecture.md`
  - `docs/architecture/business/technical-architecture.md`
  - `docs/architecture/business/implementation-guide.md`
  - `docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md`
  - `docs/architecture/runtime-mocking-comprehensive-guide.md`
- Frontend UI/auth/routes:
  - `docs/05-reference/frontend-ui-architecture-guidelines.md`
  - `docs/05-reference/frontend-ui-architecture-guidelines-checklist.md`
  - `design-system/README.md`
  - `docs/05-reference/frontend-development-guidelines.md`
  - `docs/architecture/ui/04-pages/route-guards-single-source-of-truth.md`
- Docker/runtime:
  - `docs/docker/README.md`
  - `docs/docker/quick-start.md`
  - `docs/docker/getting-started.md`
  - `Makefile`
- Testing:
  - `docs/02-planning-and-methodology/testing-strategy.md`
- Roadmap/specs:
  - `docs/04-project-management/roadmap-development.md`
  - `docs/04-project-management/future-roadmap-gaps-and-enhancements-2026-04-08.md`
  - `specs/00-core/02-intelligence/README.md`
  - `specs/00-core/03-insights/README.md`
- Changelog:
  - `changelog/`

## Retrieval workflow

1. Classify task domain.
2. Open domain SSOT first.
3. Pull supporting docs only after SSOT is clear.
4. Resolve conflicts using defined precedence.
5. Record consulted docs in output.

## Deliverables

- Docs consulted list with exact paths.
- Chosen governing SSOT for task.
- Conflict-resolution note when needed.

## Failure conditions

- Secondary docs used without SSOT confirmation.
- Conflicting guidance unresolved.
- Missing path-level references for major decisions.
