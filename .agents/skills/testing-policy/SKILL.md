---
name: testing-policy
description: Enforce change-scoped, risk-based testing and validation for AgenticVerdict using repository testing standards and quality gates.
---

## Purpose

Provide a repeatable testing workflow that ensures changes are validated sufficiently without unnecessary broad-suite execution.

## When to use

- Any behavior-changing PR.
- Refactors that may affect runtime behavior.
- CI failure triage or regression prevention updates.

## Required sources of truth

- `/docs/02-planning-and-methodology/testing-strategy.md`
- `/docs/05-reference/frontend-development-guidelines.md`

## Coverage expectations

- Business logic: `>=85%` (`>=90%` for critical code)
- Data models: `>=80%`
- API controllers: `>=75%`
- Utilities: `>=90%`
- UI components: `>=70%` (`>=80%` for critical UI)

## Required validation by change type

- Frontend UI/routes/auth/session: targeted unit/integration + relevant E2E/a11y checks.
- API/controllers/middleware: targeted unit/integration + error behavior checks.
- Database/tenant isolation: integration checks and cross-tenant regression tests.
- Shared packages: package-local tests + dependent targeted checks.
- Security-sensitive changes: redaction/error safety tests.

## Step-by-step workflow

1. Classify changed files by risk and runtime impact.
2. Map changed scope to required test layers.
3. Run smallest sufficient targeted suites first.
4. Add/adjust regression tests for fixed defects.
5. Expand to broader suites when shared contracts or critical flows are affected.
6. Confirm coverage expectations on touched critical code.
7. Record validation evidence and any justified exclusions.

## Deliverables

- Updated tests for changed behavior and key edge cases.
- Passing targeted test evidence.
- Coverage notes for touched critical modules.
- PR validation summary.

## Failure conditions

- Behavior changes with no updated tests.
- Under-testing critical scope.
- Critical coverage thresholds missed without approved exception.
- Frontend quality gates skipped without rationale.
