## Mocking and Development Behavior Consolidation

### Purpose

This document defines a comprehensive, step-by-step implementation plan to consolidate mocking and development-only behavior into a single source of truth in a core package, enforced by environment-variable policy.

It is based on a repository-wide analysis of `apps/frontend`, `apps/api`, `apps/worker`, `packages/*`, Docker Compose files, scripts, and CI workflows.

---

## 1) Current-State Analysis (Consolidated Findings)

### 1.1 High-risk patterns identified

- **Frontend auth mock defaults to enabled in non-production** when `VITE_PUBLIC_AUTH_API_MOCK` is not explicitly `"false"` (`apps/frontend/src/lib/api/auth-api.ts`), creating behavior divergence from real auth.
- **SSR protected-route path can bypass real auth checks** under mock mode (`apps/frontend/src/lib/auth/protected-route-session.ts`).
- **Hardcoded tenant fallbacks exist in runtime code**, including a fixed UUID fallback (`apps/frontend/src/lib/tenant/trpc-tenant-bridge.ts`) and other tenant hardcoding patterns.
- **Hardcoded tenant constants appear in route/branding logic** (`apps/frontend/src/routes/$locale/index.tsx`, `apps/frontend/src/lib/tenant/tenant-branding.ts`), violating strict configuration-driven tenancy.
- **Worker can fall back to synthetic tenant config** when tenant config loading fails (`apps/worker/src/tenant/worker-tenant-als.ts`), which is unsafe for production-like runtime.
- **Mock email short-circuit can be enabled by env var** without strict production-like guard (`apps/worker/src/services/email.ts`).
- **Prod-like compose config enables stub formats** (`docker-compose.apps.yml` includes `AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS=1`), causing production-like behavior drift.
- **Report format stubs are controlled via direct env reads in package code** (`packages/report-generator/src/services/format-registry.ts`) outside centralized policy.

### 1.2 Cross-cutting root causes

- Mock/stub toggles are implemented in multiple layers (frontend, worker, package internals) with inconsistent policy enforcement.
- Several modules read env vars directly instead of consuming a centralized runtime policy contract.
- Fallback behavior sometimes fails open (silent synthetic behavior) instead of fail closed.
- Production-like protection is partly present for adapter mocks but not uniformly applied to non-adapter stubs (email/report formats/dev auth paths).

---

## 2) Target Architecture (Single Source of Truth)

### 2.1 Ownership

Create and enforce a unified mock/dev policy in `@agenticverdict/config` (core shared package), with typed schema validation and runtime assertion helpers.

### 2.2 Core runtime policy model

Introduce a centralized exported API (example shape):

- `resolveRuntimePolicy(env): RuntimePolicy`
- `assertProductionSafeRuntimePolicy(policy): void`
- `isFeatureMockEnabled(policy, feature): boolean`

Where `RuntimePolicy` includes:

- Runtime axis (`development | test | staging | production`)
- Adapter mock policy
- Report-format stub policy
- Email-delivery stub policy
- Frontend auth mode policy
- Tenant fallback policy (explicitly disallow hardcoded runtime fallbacks in production-like envs)

### 2.3 Standard environment contract

Use a strict contract with explicit defaults:

- `AGENTICVERDICT_RUNTIME_ENV`: `development | test | staging | production`
- `AGENTICVERDICT_MOCK_MODE`: `off | selective | all`
- `AGENTICVERDICT_MOCK_CONNECTORS`: comma-separated connector list (when selective)
- `AGENTICVERDICT_MOCK_SCENARIO`: scenario name
- `AGENTICVERDICT_STUB_REPORT_FORMATS`: `0 | 1`
- `AGENTICVERDICT_STUB_EMAIL_DELIVERY`: `0 | 1`
- `VITE_PUBLIC_AUTH_API_MODE`: `real | mock` (default `real`)

Compatibility mapping layer (temporary) should support legacy variables (e.g., `AGENTICVERDICT_USE_MOCK_ADAPTERS`, `AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS`, `VITE_PUBLIC_AUTH_API_MOCK`) and emit deprecation warnings.

### 2.4 Security posture

- In production-like environments (`staging`, `production`):
  - All mocks/stubs are denied by default.
  - Any attempt to enable denied toggles must fail startup (API/worker) or fail build/runtime initialization (frontend).
- No hardcoded tenant IDs in runtime paths.
- No synthetic tenant fallback in production-like runtime.

---

## 3) Repository Inventory and Migration Mapping

### 3.1 Frontend scope

Primary migration targets:

- `apps/frontend/src/lib/api/auth-api.ts`
- `apps/frontend/src/lib/auth/protected-route-session.ts`
- `apps/frontend/src/lib/tenant/trpc-tenant-bridge.ts`
- `apps/frontend/src/lib/tenant/tenant-branding.ts`
- `apps/frontend/src/routes/$locale/index.tsx`
- `apps/frontend/src/lib/api/trpc-client.ts`
- `apps/frontend/src/lib/auth/resolve-server-api-base-urls.ts`

Migration approach:

- Replace direct env checks with centralized `frontendRuntimePolicy` adapter (fed by `@agenticverdict/config` contract).
- Remove hardcoded tenant constants from runtime behavior; use request/session/host-derived tenant resolution only.
- Make API URL resolution strict for production-like runtime (no localhost inference).

### 3.2 API scope

Primary migration targets:

- `apps/api/src/routes/v1/workflow-trigger-gate.ts`
- `apps/api/src/startup/tenant-rls-startup-check.ts`
- Runtime modules with direct env policy branches.

Migration approach:

- Resolve production-like checks from shared runtime policy instead of ad hoc `NODE_ENV` normalization assumptions.
- Enforce startup invariants through shared assertion utility.

### 3.3 Worker scope

Primary migration targets:

- `apps/worker/src/tenant/worker-tenant-als.ts`
- `apps/worker/src/services/email.ts`
- `apps/worker/src/queues/production-flow-scenarios-extended.ts`
- `apps/worker/src/cli.ts`

Migration approach:

- Remove silent fallback to test tenant config outside test runtime.
- Gate email/report stubs through centralized policy and deny in production-like runtime.
- Isolate test scenarios from default production worker path.

### 3.4 Shared package scope

Primary migration targets:

- `packages/report-generator/src/services/format-registry.ts`
- `packages/config/src/configuration.ts` (expand as policy SSOT)

Migration approach:

- Eliminate direct env reads in non-config packages for mock/stub policy decisions.
- Consume `RuntimePolicy` from config package everywhere.

### 3.5 Infrastructure and CI scope

Primary migration targets:

- `docker-compose.apps.yml`
- `docker-compose.dev.yml`
- `docker-compose.test.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/docker-compose-validate.yml`
- scripts with unsafe defaults (e.g., hardcoded secret fallback patterns)

Migration approach:

- Remove mock/stub enables from production-like compose stacks.
- Add policy-lint and startup contract checks in CI.
- Enforce no hardcoded secrets/mock-enabling defaults in scripts.

---

## 4) Step-by-Step Implementation Plan

### Phase 0 - Lock and baseline (Day 1)

1. Freeze new mock/stub additions via temporary contribution note.
2. Create a baseline inventory report (all current mock/stub toggles and direct env reads).
3. Define severity labels:
   - P0: production-leak risk
   - P1: staging/prod-like divergence risk
   - P2: maintainability/debt risk

Exit criteria:

- Baseline inventory committed.
- All P0 locations explicitly tracked.

### Phase 1 - Build SSOT policy in core config (Day 1-2)

1. Implement `RuntimePolicy` schema and parser in `@agenticverdict/config`.
2. Add compatibility mapper for legacy env variables.
3. Implement `assertProductionSafeRuntimePolicy`.
4. Add unit tests covering all env combinations and deny rules.

Exit criteria:

- Policy API published and tested.
- Production-like deny rules enforced by tests.

### Phase 2 - Migrate package-level controls (Day 2-3)

1. Refactor `packages/report-generator` to consume policy API.
2. Ensure no direct `process.env` mock/stub checks remain in non-config package code.
3. Add targeted tests for stub behavior under each runtime env.

Exit criteria:

- Package stubs fully policy-driven.

### Phase 3 - Migrate worker and API (Day 3-4)

1. Worker:
   - Remove synthetic tenant fallback outside test.
   - Gate mock email/stub flows through policy.
2. API:
   - Enforce policy-based startup safety checks.
   - Standardize production-like gating for test-trigger paths.
3. Add integration tests for startup failure when forbidden toggles are enabled.

Exit criteria:

- API/worker fail closed in production-like environments for all forbidden mock/stub settings.

### Phase 4 - Migrate frontend runtime policy (Day 4-5)

1. Replace `VITE_PUBLIC_AUTH_API_MOCK` behavior with explicit auth mode contract (`real` default).
2. Remove hardcoded tenant/runtime fallback constants in production paths.
3. Route tenant and API endpoint resolution through policy-safe strategy.
4. Add frontend unit tests for auth mode, tenant resolution, and API URL behavior by env.

Exit criteria:

- Frontend mock behavior is explicit opt-in only.
- No hardcoded tenant IDs in runtime behavior.

### Phase 5 - Infrastructure and CI guardrails (Day 5-6)

1. Add CI policy-lint job for workflow and compose env assignments.
2. Add startup contract tests for API/worker under `AGENTICVERDICT_RUNTIME_ENV=production`.
3. Update compose files to ensure production-like stacks never set mock/stub enables.
4. Extend production bundle checks with runtime policy assertions.

Exit criteria:

- CI blocks merges that introduce mock/stub leakage into production-like paths.

### Phase 6 - Legacy cleanup and hardening (Day 6-7)

1. Remove deprecated env variable usages after migration window.
2. Remove compatibility shims no longer needed.
3. Finalize docs and operational runbook for runtime policy management.

Exit criteria:

- Single-source policy fully adopted.
- No legacy direct mock/stub env reads remain.

---

## 5) Validation and Test Strategy

### 5.1 Unit tests

- `@agenticverdict/config` policy parsing/validation matrix by runtime env.
- Deny-list tests for production-like environments.
- Legacy mapping correctness tests.

### 5.2 Integration tests

- API startup fails with forbidden mock/stub toggles in production-like env.
- Worker startup fails or blocks execution for forbidden toggles/synthetic fallbacks.
- Frontend route/auth behavior is deterministic and policy-driven.

### 5.3 Build and CI checks

- Production-bundle verification includes runtime policy safety assertions.
- Compose/workflow policy-lint checks for forbidden values.
- Static scan for banned patterns in runtime code:
  - hardcoded demo tenant UUIDs/constants
  - direct mock/stub env checks outside config package
  - permissive default-on mock logic

### 5.4 Operational verification

- Smoke test matrix:
  - local dev (mocks enabled intentionally)
  - test environment
  - staging (mocks denied)
  - production (mocks denied)
- Verify telemetry/logging for policy violations and startup denials.

---

## 6) Rollback and Risk Mitigation

### Rollback plan

- Keep legacy-to-new compatibility mapper during migration.
- Allow temporary feature-flagged fallback to previous behavior only in development/test.
- If regressions occur, rollback by feature scope (frontend auth mode, worker email stubs, report stubs) without restoring unsafe production defaults.

### Risk controls

- Production-like fail-closed policy as invariant.
- Explicit runtime assertions at startup.
- CI enforcement for config drift.
- No silent fallback to synthetic tenant behavior.

---

## 7) Acceptance Criteria (Definition of Done)

1. All mock/stub policy decisions originate from `@agenticverdict/config` only.
2. No hardcoded tenant IDs remain in production runtime paths.
3. Production-like environments fail closed when forbidden mock/stub toggles are set.
4. Frontend auth mock behavior is explicit opt-in and defaults to real mode.
5. Worker synthetic tenant fallback is removed outside test runtime.
6. Compose/workflow files for production-like stacks contain no mock/stub enable values.
7. CI has policy-lint + startup safety checks and they pass.
8. Documentation is updated with the new env contract and migration guidance.

---

## 8) Recommended Deliverables

- `docs/architecture/runtime-mock-dev-policy-single-source-of-truth.md` (authoritative architecture and policy document)
- `@agenticverdict/config` runtime policy module + tests
- App/package migrations listed in Section 3
- CI policy-lint script and workflow integration
- Migration changelog entry documenting deprecations and final contract
