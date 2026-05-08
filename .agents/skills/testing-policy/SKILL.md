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

## Test pyramid

```
Unit (Vitest) → Integration → E2E (Playwright) → Scenario Orchestration (R01-R12)
```

## Coverage thresholds

| Scope                                     | Threshold |
| ----------------------------------------- | --------- |
| Overall                                   | 70%       |
| Business logic                            | 85%       |
| Critical (auth, tenant isolation, agents) | 90%       |
| UI components                             | 70%       |

## Required validation by change type

- Frontend UI/routes/auth/session: targeted unit/integration + relevant E2E/a11y checks.
- API/controllers/middleware: targeted unit/integration + error behavior checks.
- Database/tenant isolation: integration checks and cross-tenant regression tests.
- Shared packages: package-local tests + dependent targeted checks.
- Security-sensitive changes: redaction/error safety tests.

## Test commands

```bash
# Unit tests (root workspace runs all packages)
pnpm run test:unit

# Unit tests with coverage (70% overall, 85% business logic, 90% critical)
pnpm run test:coverage

# Package-scoped tests (Turbo)
turbo run test

# Integration tests (database, API flows)
pnpm run test:integration

# E2E tests (Playwright; auto-starts webServer)
pnpm run test:e2e

# Production flow scenarios (R01-R12 mock adapter runs)
pnpm run test:production-flow

# Scenario orchestration (full workflow validation)
pnpm run test:scenarios:all
make test-scripts-all

# Frontend-only tests
pnpm --filter @agenticverdict/frontend test

# Frontend E2E (Smoke)
pnpm run test:e2e:frontend:smoke

# AI/Agent runtime tests
pnpm --filter @agenticverdict/agent-runtime test
```

## Mock adapter mode

For deterministic, network-free development and testing:

```bash
# .env.local
AGENTICVERDICT_MOCK_MODE=all
AGENTICVERDICT_MOCK_SEED=42001
AGENTICVERDICT_MOCK_SCENARIO=normal
```

Verify: `curl http://localhost:3000/api/health/adapters` → includes `mockMode`.

**Usage:**

- Unit tests: use mock responses for platform adapters.
- Integration tests: use controlled inputs with mock adapter.
- Scenario orchestration: use R01-R12 mock adapter runs.
- **Never use production API keys in tests.** Use separate test keys or mock responses.

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
- Production API keys used in tests.
