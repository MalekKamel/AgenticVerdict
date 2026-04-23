# Tenant Logic Consolidation Implementation Plan (Single Source of Truth)

## 1) Executive Summary

Tenant requirements were implemented successfully, but tenant logic is currently distributed across API middleware, tRPC adapters, frontend propagation utilities, worker execution wrappers, and shared packages. This distribution increases maintenance cost and creates drift risk in validation, error semantics, and context propagation.

This plan defines a phased consolidation into a single shared source-of-truth tenant layer, with explicit ownership boundaries and quality gates. The target state enforces one canonical tenant contract while improving consistency, testability, and operational safety.

## 2) Scope and Inputs

### In Scope

- Consolidation of tenant resolution, validation, context propagation, and error contracts.
- API/tRPC, frontend pre-session propagation, worker ALS propagation, and database tenant-scoped access integration.
- Observability and rate-limit tenant attribution consistency.
- Governance and quality gates for future tenant-related changes.

### Source Inputs

- `/docs/architecture/tenant-requirements-implementation-plan-2026-04-25.md`
- `/docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md`
- `/changelog/2026-04-25-tenant-requirements-phase-1-2-implementation.md`
- `/changelog/2026-04-25-tenant-requirements-phase-3-4-trpc-als-and-db-scoped.md`
- `/changelog/2026-04-25-tenant-requirements-phase-5-6-frontend-propagate-and-worker-als.md`
- `/changelog/2026-04-25-tenant-requirements-phase-7-observability-rate-limits-docs.md`

## 3) Current-State Findings

### 3.1 Tenant Logic Footprint (Where Logic Exists Today)

- Shared core: `packages/core/src/tenant-context.ts`, `packages/core/src/tenant-resolution.ts`, `packages/core/src/tenant-security-error.ts`, `packages/core/src/tenant-data-access.ts`.
- Database scope: `packages/database/src/db-scoped.ts` and tenant-provisioning entrypoints.
- API middleware/tRPC: `apps/api/src/middleware/jwt-tenant-context.ts`, `apps/api/src/middleware/tenant-route-als.ts`, `apps/api/src/trpc/context.ts`, `apps/api/src/trpc/procedures.ts`, `apps/api/src/trpc/public-tenant-context.ts`, `apps/api/src/trpc/resolve-public-tenant-id.ts`.
- API observability/fairness: `apps/api/src/middleware/request-logging.ts`, `apps/api/src/middleware/rate-limit.ts`, `apps/api/src/trpc/init.ts`.
- Frontend tenant propagation: `apps/frontend/src/lib/tenant/*`, `apps/frontend/src/lib/api/trpc-client.ts`, `apps/frontend/src/lib/api/auth-api.ts`, auth/dashboard routes and hooks.
- Worker propagation: `apps/worker/src/tenant/worker-tenant-als.ts`, `apps/worker/src/queues/report-queues.ts`.

### 3.2 Key Problems

1. Duplicate tenant parsing and UUID validation across API/frontend/shared modules.
2. API-local pre-session resolver logic overlaps with shared tenant resolution intent.
3. Multiple source-priority paths for tenant hinting in frontend increase divergence risk.
4. Worker context creation has partially duplicated pathways around pipeline execution.
5. RLS assumptions need explicit verification/hardening in schema and migration checks.

## 4) Target State Architecture

## 4.1 Single Source of Truth Boundary

Adopt `@agenticverdict/core` as the canonical tenant logic authority (or a dedicated `@agenticverdict/tenant` extracted from core in a later step), while keeping DB-specific mechanics in `@agenticverdict/database`.

### Ownership Model

- `@agenticverdict/core` owns:
  - Tenant ID normalization/validation and source-precedence resolution.
  - Transport-agnostic authenticated and pre-session tenant resolution primitives.
  - Canonical tenant error taxonomy and mapping helpers.
  - AsyncLocalStorage context lifecycle contracts.
- `@agenticverdict/database` owns:
  - `dbScoped` tenant session binding.
  - RLS policy bootstrap/verification helpers and checks.
- `apps/api` owns:
  - Transport adapters only (Fastify/tRPC wiring, serialization).
  - No tenant decision logic outside shared primitives.
- `apps/frontend` owns:
  - UI routing/UX propagation behavior, consuming shared tenant resolution utilities.
- `apps/worker` owns:
  - Queue adapter wiring to shared tenant context wrappers.
- `packages/types` owns:
  - Shared schemas/unions for tenant-related request/response contracts.

### 4.2 Canonical Contracts

- Canonical internal and external identifier name: `tenantId`.
- No backward-compatibility aliases: all adapters, headers, claims, request bodies, and logs use `tenantId`.
- One stable tenant security code taxonomy exported from shared package.
- One source-priority contract for effective tenant resolution across frontend and API pre-session flows.

## 5) Step-by-Step Migration Plan

## Phase 0 - Baseline and Freeze (1-2 days)

- Freeze new tenant-logic additions outside shared package boundary.
- Build a traceability matrix: tenant requirement -> code path -> tests -> owner.
- Capture current behavior with contract tests before refactor.

**Exit Criteria**

- Traceability matrix created and reviewed.
- Behavior baseline tests in place for auth/public and authenticated flows.

## Phase 1 - Shared Resolver Consolidation (2-4 days)

- Move duplicated parsing/validation/source-precedence logic into shared tenant utilities.
- Refactor API pre-session resolver to call shared primitives.
- Refactor frontend utility modules to consume shared pure/isomorphic tenant helpers.

**Exit Criteria**

- No duplicate tenant parsing helpers in API/frontend outside designated shared adapters.
- Public auth tenant mismatch and missing-tenant behavior unchanged and fully tested.

## Phase 2 - Context Propagation Unification (2-3 days)

- Standardize API middleware + tRPC tenant context construction through shared entrypoints.
- Align worker job context creation and pipeline tenant object construction through one helper path.
- Remove redundant context-building branches where behavior overlaps.

**Exit Criteria**

- API and worker context propagation use a single shared contract.
- Concurrency tests show no ALS leakage between requests/jobs.

## Phase 3 - Database Isolation Hardening (2-4 days)

- Verify and harden RLS enforcement in migrations/bootstrap where missing.
- Ensure tenant-owned reads/writes are consistently routed via `dbScoped` (or explicit reviewed exception).
- Add startup/integration checks for tenant session variable and policy effectiveness.

**Exit Criteria**

- Cross-tenant access denial tests pass on real Postgres integration paths.
- RLS checks are automated and enforced in CI/runtime validation.

## Phase 4 - Observability and Fairness Standardization (1-2 days)

- Standardize tenant attribution helper usage in request logs, rate-limit bucketing, and tenant security events.
- Add dashboards/alerts for tenant security code frequencies and tenant-throttle anomalies.

**Exit Criteria**

- Tenant attribution and event semantics are consistent across HTTP and tRPC paths.
- Alerting playbook exists for tenant mismatch spikes and context-missing incidents.

## Phase 5 - Governance, Cleanup, and Enforcement (1-2 days)

- Add lint/architecture checks to prevent future tenant logic drift outside shared package.
- Publish governance process and PR checklist for tenant changes.

**Exit Criteria**

- Deprecated tenant helper paths removed.
- CI gate prevents reintroduction of duplicate tenant-resolution logic.

## 6) Risks and Mitigations

1. **Behavior regression in auth/public flows**
   - Mitigation: snapshot/contract tests for header/body/JWT mismatch matrix before and after refactor.
2. **Silent tenant-scope bypass in DB access**
   - Mitigation: static checks + integration tests enforcing `dbScoped` for tenant-owned operations.
3. **Worker context leakage across jobs**
   - Mitigation: concurrent job tests validating isolated ALS stores and cleanup.
4. **Frontend SSR/client divergence**
   - Mitigation: route-level tests around verify-email/dashboard tenant query propagation and hydration order.
5. **Browser bundle breakage from shared imports**
   - Mitigation: keep frontend-consumed helpers isomorphic and free of Node-only dependencies.
6. **Operational regressions from stricter enforcement**
   - Mitigation: run full integration and contract suites before merge, with environment-level smoke verification immediately after deployment.

## 7) Verification and Acceptance Criteria

## Functional Criteria

- Public auth flows consistently enforce tenant input agreement and emit stable error codes.
- Authenticated routes enforce session-tenant agreement through shared procedure guards.
- Worker processors consistently run inside tenant context with required metadata.
- Tenant-owned DB operations are protected by tenant scope and policy checks.

## Quality Gates (Required)

- Type checks:
  - `pnpm --filter @agenticverdict/api exec tsc --noEmit --pretty false`
  - `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false`
  - `pnpm --filter @agenticverdict/worker exec tsc --noEmit --pretty false`
- Tenant-focused tests:
  - API middleware/tRPC resolver and error contract tests.
  - Frontend tenant bridge/pre-session merge tests.
  - Worker tenant ALS isolation tests.
  - DB integration tests for tenant session scoping and RLS behavior.
- Locale/UX consistency for touched auth flows:
  - `pnpm --filter @agenticverdict/frontend run i18n:validate`
  - relevant auth e2e/a11y specs.

## 8) Rollout and Rollback Strategy

### Rollout

- Enable strict tenant enforcement by default across all paths in the same release window.
- Perform rollout in one forward-only migration sequence: shared contracts -> adapters -> tests/docs cleanup.
- Validate with telemetry and smoke tests after each deployment environment promotion.

### Rollback

- If severe regressions occur, revert the affected change set and re-deploy; keep core isolation invariants enforced.
- Trigger rollback on elevated tenant mismatch errors, unexplained 4xx spikes, or context-missing event anomalies.

## 9) Effort and Sequencing Recommendation

- Total estimate: **8-17 engineering days** depending on RLS and test depth.
- Recommended staffing:
  - 1 platform engineer (shared/core/api),
  - 1 frontend engineer (tenant propagation),
  - 1 worker/data engineer (ALS + dbScoped/RLS),
  - 1 QA/automation contributor (contract + integration coverage).
- Recommended order:
  - Baseline -> shared resolver extraction -> propagation unification -> DB hardening -> observability -> cleanup enforcement.

## 10) Governance and Operating Model

- Establish a tenant change review gate requiring approvals from Platform/API, Database, Security, and Observability owners.
- Require architecture decision updates for changes to tenant source precedence, error taxonomy, or isolation controls.
- Enforce a tenant PR checklist:
  - traceability mapping updated,
  - tests added for missing/mismatch/propagation cases,
  - observability impact assessed,
  - rollback path documented.

## 11) Definition of Done

The consolidation effort is complete when:

1. Tenant resolution and error semantics are centralized in a shared package API.
2. API/frontend/worker consume shared primitives without duplicated local logic.
3. Tenant-scoped DB behavior is verified with strong automated checks.
4. Observability and rate-limit attribution are standardized and monitored.
5. Governance controls and CI checks prevent regression into scattered tenant logic.
