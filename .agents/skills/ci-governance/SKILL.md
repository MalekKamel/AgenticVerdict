---
name: ci-governance
description: Enforce AgenticVerdict CI/CD pipeline standards including quality gates, bundle verification, E2E workflows, and PR merge requirements.
---

## Purpose

Ensure all changes pass through the repository's CI/CD pipeline with appropriate quality gates, bundle verification, and E2E validation before merging.

## When to use

- Opening or reviewing PRs.
- CI failure triage and debugging.
- Adding new CI workflows or modifying existing ones.
- Pre-merge validation of change quality.

## CI/CD pipeline definition

**On PR/Push:**

1. **Quality Gate** (30 min timeout)
   - Format check (`prettier --check`)
   - Lint + typecheck (Turbo)
   - Unit tests with coverage
   - Circular dependency check (`madge`)
   - Tenant boundary check
   - Scenario orchestration tests (R01-R12)
   - Phase 01 integration tests (mock APIs, load, chaos)

2. **Bundle Gate**
   - Production bundle verification
   - CLI artifact existence

3. **E2E** (45 min timeout)
   - Playwright browser tests
   - Desktop Electron smoke tests

**Artifacts:**

- Scenario documents → `scenario-artifacts/`
- Coverage reports → `coverage/`
- SBOM (if `syft` installed) → `sboms/`

## Command order (mandatory)

```bash
lint -> typecheck -> test -> build
```

CI enforces this sequence. Use Turbo for parallel package execution:

```bash
turbo run lint typecheck test build
```

## Production bundle gate

```bash
# Verify production bundles (adapter factory, CLI artifacts)
pnpm run verify:production-bundle

# Assert CLI artifacts exist
test -f apps/api/dist/cli.mjs
test -f apps/worker/dist/cli.mjs
```

CI blocks merges if bundles fail or artifacts missing.

## PR workflow standards

- Prefer documented repository workflows and SSOT docs for each domain.
- Prefer `make` targets for Docker/Compose workflows from repo root.
- Run type checks and targeted tests for changed scope before concluding work.
- If a rule must be deviated from, document rationale, risk, mitigation, owner, and due date.

## Step-by-step workflow

1. Classify the change scope and risk level.
2. Run local quality gate: `lint -> typecheck -> test -> build`.
3. Verify production bundle if applicable.
4. Ensure targeted tests cover changed behavior.
5. Push branch and monitor CI pipeline.
6. Triage any failures using CI artifacts and logs.
7. Confirm all gates pass before merge.

## Validation commands

```bash
# Full quality gate
turbo run lint typecheck test build

# Bundle verification
pnpm run verify:production-bundle

# Package-scoped validation
turbo run lint typecheck test --filter=<package>
```

## Deliverables

- Passing CI pipeline with all gates green.
- Coverage reports for changed modules.
- Bundle verification evidence where applicable.
- Triage notes for any resolved CI failures.

## Failure conditions

- Quality gate failures (lint, typecheck, tests).
- Production bundle verification failure.
- Missing CLI artifacts.
- E2E test failures.
- Tenant boundary check violations.
- Circular dependency introductions.
