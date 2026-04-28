---
name: roadmap-context
description: Phase-aware planning and execution context loader for AgenticVerdict using specs, roadmap artifacts, and transition acceptance criteria.
---

## Purpose

Ground implementation plans in the correct phase/spec scope, dependencies, and acceptance criteria before execution.

## When to use

- New features, sizable refactors, architecture changes.
- Milestone planning, phase closure, roadmap follow-up tasks.

## Phase/spec lookup map

1. `specs/00-core/` (phase SSOT)
2. `changelog/2026-04-08-phase-02-03-systematic-implementation-consolidation.md`
3. `docs/04-project-management/future-roadmap-gaps-and-enhancements-2026-04-08.md`
4. `docs/04-project-management/roadmap-development.md`
5. `docs/04-project-management/requirements.md`

## Planning workflow

1. Classify request by phase and domain.
2. Load matching spec acceptance criteria.
3. Check prerequisites and sequencing.
4. Overlay roadmap gaps and label deferrals.
5. Attach validation gates (tests, coverage, docs updates).
6. Produce an execution packet with risks and exit criteria.

## Deliverables

- Phase-mapped implementation plan.
- Acceptance checklist.
- Dependency/risk register.
- Validation and completion criteria.

## Failure conditions

- No explicit mapping to phase specs.
- Missing acceptance criteria and verification gates.
- Ignores known roadmap gaps for medium/large work.
