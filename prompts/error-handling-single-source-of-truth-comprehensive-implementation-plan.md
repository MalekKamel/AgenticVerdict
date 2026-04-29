# Error Handling Single Source of Truth - Comprehensive Implementation Plan

## 1) Scope and Intent

This plan defines how to implement a reusable single source of truth (SSOT) for error handling across `apps/api`, `apps/worker`, `apps/frontend`, and shared packages.

Assumption: greenfield pre-production context; backward compatibility is out of scope and legacy error paths must be fully removed.

Goals:

- establish one canonical error contract and code registry,
- standardize translation at all transport boundaries (HTTP, tRPC, queue, UI),
- enforce structured logging and observability for every failure path,
- remove message-string matching, duplicated local error taxonomies, and all legacy error handlers.

## 2) Current-State Findings (Condensed)

### Backend and shared packages

- Tenant errors are relatively structured via `TenantSecurityError` in `packages/core/src/tenant-security-error.ts`.
- API tRPC has partial centralization (`apps/api/src/trpc/init.ts`, `apps/api/src/trpc/resolve-public-tenant-id.ts`), but REST routes remain largely ad hoc.
- Queue paths still rely on plain `Error` message matching (for example `queue_unavailable`) in `apps/api/src/services/report-bullmq.ts` and route handlers.
- `packages/data-connectors` and `packages/agent-runtime` each maintain their own error classes and code vocabularies.
- Database error handling is mixed: typed tenant guards plus generic errors in adjacent flows.

### Frontend

- Multiple parallel models exist (`AppError`, `AuthMutationError`, `DashboardTypedError`) with duplicated mapping logic.
- User-facing message resolution is fragmented; some paths still risk exposing raw error messages.
- Retry handling is partly centralized for tRPC but not consistently applied by all feature hooks.
- Client error logging is split between structured telemetry and local utilities.

### Observability

- Useful logging/metrics foundations exist (`packages/observability`), but error semantics are not unified end to end (code, severity, retryability, surface).

## 3) Target Architecture

## 3.1 Canonical Error Contract (shared package)

Create core package: `packages/core/errors`.

Core primitives:

- `ErrorCode`: strict string-union registry.
- `ErrorCategory`: `validation | authentication | authorization | tenant | dependency | data_access | rate_limit | timeout | conflict | internal`.
- `ErrorSurface`: `http | trpc | queue | worker | frontend | integration`.
- `AppFault` class:
  - `code: ErrorCode`
  - `category: ErrorCategory`
  - `httpStatus: number`
  - `retryable: boolean`
  - `safeMessage: string`
  - `details?: Record<string, unknown>`
  - `cause?: unknown`
  - `surface?: ErrorSurface`
- `isAppFault()` type guard.
- `toAppFault(unknownError, context)` normalizer.

Code naming convention:

- Upper snake case with domain prefix:
  - `TENANT_*`, `AUTH_*`, `VALIDATION_*`, `QUEUE_*`, `DB_*`, `CONNECTOR_*`, `RUNTIME_*`, `INTERNAL_*`.

## 3.2 Transport translators

Implement translators in one module:

- `toHttpErrorResponse(error, requestId)`
- `toTrpcError(error)`
- `toQueueFailure(error)`
- `toFrontendError(error)` (safe DTO contract)

Rule: all boundaries translate from domain/internal errors to canonical wire-safe shapes; no raw message pass-through in production.

## 3.3 Observability contract

Define one error log envelope:

- `event: "error"`
- `code`, `category`, `surface`, `retryable`, `severity`
- `tenantId?`, `requestId?`, `traceId?`, `userId?`
- `operation`, `component`
- `safeMessage`
- `causeType` and `causeMessage` (sanitized)

Define base metrics:

- `error_total{surface,code,category,severity,retryable}`
- `error_boundary_translate_total{from,to,code}`
- `retry_attempt_total{operation,code}`

## 3.4 Frontend consumption model

Frontend receives only safe error payloads and converts them to:

- stable `messageKey` + interpolation params,
- retry metadata (`retryable`, `retryAfterSec`),
- UX severity (`error | warning | info`).

Replace and delete feature-specific error models; all frontend boundaries must consume the shared contract directly.

## 4) Step-by-Step Execution Plan (Systematic)

## Phase 0 - Architecture and RFC (1-2 days)

1. Create RFC doc under `docs/architecture/` with contract schema and full replacement strategy.
2. Freeze canonical code list v1 and ownership matrix.
3. Define strict removal criteria for legacy handlers and update tests to new contracts only.

Deliverables:

- approved RFC,
- v1 code registry,
- migration checklist template with explicit legacy-deletion checkpoints.

## Phase 1 - Shared Foundation (2-3 days)

1. Add shared errors package/module with:
   - `ErrorCode` registry,
   - `AppFault` base class,
   - normalizer and type guards,
   - translator functions.
2. Add unit tests for all primitives and translation mappings.
3. Add lint rule or lightweight static guard that disallows new raw `throw new Error("code_string")` in runtime surfaces.
4. Add repository-wide legacy pattern inventory and cleanup checklist (classes, mappers, helpers, string-matching branches).

Deliverables:

- shared contract package published in workspace,
- tests green for core mappings.

## Phase 2 - Backend/API migration (parallelizable, 3-5 days)

Workstream A (API boundary):

1. Replace route-level ad hoc catches with shared translator.
2. Add Fastify global error handler in `apps/api` using canonical response shaping.
3. Replace `queue_unavailable` string matching with typed `QUEUE_UNAVAILABLE`.
4. Delete replaced ad hoc error helpers and route-local mapping tables after translator adoption.

Workstream B (tRPC boundary):

1. Align tRPC `errorFormatter` with canonical contract.
2. Ensure tenant security and validation errors map via one adapter path.
3. Remove duplicate tRPC-specific code mapping logic not needed after canonical adapter.
4. Remove legacy tRPC error wrappers once canonical adapter paths are in place.

Workstream C (DB and connectors):

1. Wrap DB and connector errors into `AppFault` at service boundaries.
2. Replace direct SQL-code matching (`23505`) with typed adapter helper.
3. Keep low-level native errors internal; expose canonical codes outward.
4. Remove connector/package-local public error contracts superseded by `AppFault`.

Deliverables:

- unified API and tRPC error outputs,
- no message-based queue error branching,
- typed mapping for DB/connector failures.

## Phase 3 - Worker and async pipeline migration (parallelizable, 2-4 days)

1. Add queue/job error schema adapters based on canonical code registry.
2. Standardize worker failure paths to emit typed codes + structured logs.
3. Ensure retryable vs non-retryable semantics are explicit and test-covered.
4. Remove worker-local fallback error shapes and legacy retry heuristics.

Deliverables:

- worker errors standardized,
- queue payload failures machine-readable and consistent.

## Phase 4 - Frontend migration (parallelizable with Phase 3, 3-5 days)

1. Introduce one frontend adapter from server payload to `AppError` view model.
2. Consolidate auth/dashboard/local mappings into shared resolvers.
3. Replace feature-local error display helpers with centralized message-key resolver.
4. Standardize retry behavior (reuse shared retry policy across hooks/queries).
5. Route all error logging through one frontend observability function.
6. Delete `AppError`, `AuthMutationError`, `DashboardTypedError`, and related legacy mappers after adapter cutover.

Deliverables:

- single frontend error model in active use,
- no raw backend messages shown to users in production mode.

## Phase 5 - Governance and hardening (2-3 days)

1. Add CI checks:
   - no unregistered error code usage,
   - no raw runtime string-code throws,
   - translator coverage thresholds.
2. Add developer guide:
   - how to create new errors,
   - how to map boundary responses,
   - when to mark retryable.
3. Add dashboards and alerts keyed by canonical codes.
4. Add CI checks that fail when legacy error modules/classes are still referenced.

Deliverables:

- CI guardrails,
- operational dashboards,
- onboarding docs.

## 5) Parallel Execution Matrix

Run in parallel where dependencies allow:

- Track 1 (Foundation): shared package and tests.
- Track 2 (API/tRPC): starts once Track 1 contract is merged.
- Track 3 (Worker/queue): starts once Track 1 contract is merged.
- Track 4 (Frontend): can start adapter scaffolding in parallel, full migration after API mappings stabilize.
- Track 5 (Observability/CI): begins after first boundary migrations land.

Recommended staffing:

- 1 owner for shared contract,
- 1 backend owner (API/tRPC),
- 1 async/worker owner,
- 1 frontend owner,
- 1 QA/observability owner.

## 6) Implementation Backlog (Ordered)

P0:

- create `ErrorCode` registry and `AppFault`,
- add translators (`http`, `trpc`, `queue`, `frontend`),
- migrate queue-unavailable flow to typed errors.

P1:

- migrate API route handlers and global error handler,
- migrate tRPC formatter and tenant adapters,
- add DB error adapter helper.

P2:

- migrate worker schemas and failure reporting,
- unify frontend model and message mapping,
- remove all local legacy error models and transitional wrappers.

P3:

- CI guards, docs, dashboards, alert tuning.

## 7) Testing and Validation Strategy

Unit:

- `AppFault` construction, type guards, and normalizer behavior.
- translator mapping for each code to each transport.

Integration:

- API and tRPC responses for representative failures:
  - tenant missing/mismatch,
  - validation failures,
  - queue unavailable,
  - DB unique violation,
  - connector rate limit/upstream errors.

System:

- end-to-end flow through API -> queue -> worker -> frontend with canonical code preserved/safely transformed.

Regression requirements:

- no raw internal stack/messages exposed to clients,
- all errors include stable code and request correlation fields,
- retryable semantics validated in queue and frontend behavior.

## 8) Acceptance Criteria (Definition of Done)

1. Every user-visible error payload includes:
   - canonical `code`,
   - safe message key/text,
   - correlation identifier.
2. All API/tRPC/worker boundaries use shared translators.
3. No runtime-critical path depends on string-message matching.
4. Logs and metrics include canonical error dimensions.
5. Frontend uses one normalized error consumption model.
6. CI fails on unregistered error codes and non-compliant patterns.
7. Documentation includes code registry ownership and extension process.

## 9) Risks and Mitigations

- Risk: migration churn across many packages.
  - Mitigation: phased rollout with strict per-phase deletion gates and owner sign-off.
- Risk: code namespace conflicts with existing constants.
  - Mitigation: reserve prefix catalog and enforce via CI.
- Risk: frontend regressions due to message mapping consolidation.
  - Mitigation: snapshot tests for message keys, fallback behavior, and explicit checks that legacy resolvers are removed.
- Risk: observability cardinality explosion.
  - Mitigation: control label set (`surface`, `code`, `category`), avoid dynamic labels.

## 10) Docs Consulted (SSOT-first)

- `docs/architecture/business/technical-architecture.md`
- `docs/architecture/business/implementation-guide.md`
- `docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md`
- `docs/02-planning-and-methodology/testing-strategy.md`

## 11) Code Areas Surveyed

- `apps/api/src/trpc/*`
- `apps/api/src/routes/v1/*`
- `apps/api/src/services/report-bullmq.ts`
- `apps/worker/src/queues/*`
- `apps/frontend/src/lib/api/*`
- `apps/frontend/src/lib/types/errors.ts`
- `apps/frontend/src/features/auth/hooks/*`
- `apps/frontend/src/features/dashboard/model/*`
- `packages/core/src/tenant-security-error.ts`
- `packages/database/src/db-scoped.ts`
- `packages/data-connectors/src/errors.ts`
- `packages/agent-runtime/src/*`
- `packages/observability/src/*`
