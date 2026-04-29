# Error System Onboarding Guide

This guide helps new developers understand how the canonical error system works across API, worker, frontend, and shared packages in AgenticVerdict.

The implementation is aligned with:

- `openspec/changes/error-system/tasks.md`
- `openspec/changes/error-system/design.md`
- `openspec/changes/error-system/specs/error-system-core/spec.md`
- `openspec/changes/error-system/specs/error-system-boundaries/spec.md`
- `openspec/changes/error-system/specs/error-system-frontend/spec.md`
- `openspec/changes/error-system/specs/error-system-governance/spec.md`

## Why this system exists

The error system provides one typed, canonical contract for failures so every boundary can:

- classify errors consistently (`code`, `category`, `surface`)
- expose safe user-facing messages (`messageKey`-oriented behavior)
- preserve retry semantics and transport status metadata
- keep observability dimensions low-cardinality and tenant-safe

## Source of truth

Use these files first when working on error behavior:

- Canonical error primitives and registry: `packages/core/src/errors.ts`
- Boundary translators: `packages/core/src/error-translators.ts`
- Public core exports: `packages/core/src/index.ts`
- Canonical registry governance and ownership: `docs/05-reference/error-code-registry.md`
- Governance enforcement script: `scripts/error-system/verify-error-governance.mjs`
- Error-system skill reference: `.agents/skills/error-system/SKILL.md`

## Core concepts and terminology

- `ErrorCode`: stable machine-readable code from `ERROR_CODES` in `packages/core/src/errors.ts`
- `ErrorCategory`: semantic class (for example validation, auth, tenant, queue, connector, internal)
- `ErrorSurface`: where the error is emitted/translated (`http`, `trpc`, `queue`, `worker`, `frontend`, `integration`)
- `AppFault`: canonical typed error object used as the common failure currency
- `toAppFault()`: normalization utility for unknown errors into safe canonical form
- Boundary translators:
  - `toHttpErrorResponse(...)`
  - `toTrpcErrorMeta(...)`
  - `toTrpcErrorCode(...)`
  - `toQueueFailure(...)`
  - `toWorkerFailure(...)`

## High-level architecture by layer

### Shared core (`@agenticverdict/core`)

- Canonical registry lives in `packages/core/src/errors.ts` with mappings for:
  - message keys
  - category
  - HTTP status
  - retryability
- Transport shaping lives in `packages/core/src/error-translators.ts`.
- New code additions must update registry and mapping completeness together.

### API (Fastify + tRPC)

- Global HTTP translation is centralized in `apps/api/src/server.ts`.
- Middleware and route paths consume canonical behavior in:
  - `apps/api/src/middleware/auth.ts`
  - `apps/api/src/middleware/rate-limit.ts`
  - `apps/api/src/middleware/report-rbac.ts`
  - `apps/api/src/routes/v1/*.ts`
- tRPC canonical metadata shaping is implemented in:
  - `apps/api/src/trpc/init.ts`
  - `apps/api/src/trpc/procedures.ts`
  - `apps/api/src/trpc/resolve-public-tenant-id.ts`
  - `apps/api/src/trpc/routers/auth.ts`

### Worker and queue paths

- Queue/job contract types with canonical-like code handling:
  - `apps/worker/src/queues/job-types.ts`
  - `apps/worker/src/queues/report-queues.ts`
- API-side queue integration and enqueue failure handling:
  - `apps/api/src/services/report-bullmq.ts`
  - `apps/api/src/services/report-store.ts`

### Frontend

- Single normalization adapter:
  - `apps/frontend/src/lib/errors/normalized-error-adapter.ts`
- tRPC message/mapping adapters:
  - `apps/frontend/src/lib/api/trpc-error-mapping.ts`
  - `apps/frontend/src/lib/api/trpc-error-message.ts`
- Route/auth/dashboard usage:
  - `apps/frontend/src/components/errors/AppRouteError.tsx`
  - `apps/frontend/src/components/auth/AuthError.tsx`
  - `apps/frontend/src/features/dashboard/model/dashboard-errors.ts`
  - `apps/frontend/src/features/dashboard/api/dashboard-api.ts`
- Structured client logging and telemetry forwarding:
  - `apps/frontend/src/lib/observability/client-log.ts`
  - `apps/frontend/src/lib/observability/telemetry-ingest.ts`

## End-to-end error lifecycle

1. A failure occurs in API/worker/frontend runtime code.
2. It is converted to canonical form (`AppFault` / normalized canonical metadata).
3. Boundary translator emits a transport-safe contract:
   - HTTP response body
   - tRPC error metadata
   - queue/worker failure payload
4. Frontend normalizer converts transport payload into `NormalizedUiError`.
5. UI renders translation keys and safe fallback messages.
6. Observability records canonical metadata and correlation identifiers when available.

## How to add a new canonical error code

Follow this sequence exactly.

1. Confirm need and scope in OpenSpec under `openspec/changes/error-system/`.
2. Update canonical registry in `packages/core/src/errors.ts`:
   - `ERROR_CODES`
   - message key mapping
   - category mapping
   - HTTP status mapping
   - retryability mapping
3. Update governance documentation in `docs/05-reference/error-code-registry.md`.
4. Update or add translator behavior in `packages/core/src/error-translators.ts` if boundary behavior changes.
5. Update emitting code in touched layers (API/worker/frontend) to use canonical codes, not message parsing.
6. Add tests for all affected layers.
7. Run governance and translator coverage checks before merge.

## Frontend localization and user messaging model

- User-visible copy should come from message keys and translation resources, not raw backend text.
- Frontend normalizer must keep safe fallback behavior for unknown/invalid payloads.
- Canonical metadata should still be logged for observability even when user-facing copy falls back.
- Keep domain-specific overrides (for example dashboard UX) localized to feature layers, while preserving canonical base behavior in shared adapters.

## Testing strategy and required checks

Run change-scoped tests first, then broader gates.

- Governance checks:
  - `pnpm check:error-governance`
  - `pnpm check:error-translator-coverage`
- Core tests:
  - `pnpm --filter @agenticverdict/core exec vitest run src/errors.test.ts src/error-translators.test.ts src/error-boundaries.integration.test.ts`
- API tests (targeted examples):
  - `pnpm --filter @agenticverdict/api exec vitest run src/api.contract.test.ts src/routes/v1/workflows.test.ts src/routes/v1/workflow-status-contract.test.ts src/integration/api-validation-workflows.integration.test.ts`
- Frontend tests (targeted examples):
  - `pnpm --filter @agenticverdict/frontend test -- src/lib/errors/normalized-error-adapter.test.ts`
  - `pnpm --filter @agenticverdict/frontend test -- src/lib/api/trpc-error-mapping.test.ts src/lib/api/trpc-error-message.test.ts`
  - `pnpm --filter @agenticverdict/frontend test -- src/lib/observability/client-log.test.ts`
- Worker tests:
  - `pnpm --filter @agenticverdict/worker exec vitest run src/queues/report-queues.test.ts`
- Global type safety:
  - `pnpm typecheck`

## Governance and review expectations

From `docs/05-reference/error-code-registry.md`:

- Primary owner: Platform Architecture
- Required reviewers: API, Worker, Frontend, Observability
- Every new code requires OpenSpec update and affected translator tests
- CI must pass governance and translator coverage checks

## Common pitfalls and anti-patterns

- Using raw `error.message` string matching for behavior branching
- Introducing unregistered uppercase error codes outside canonical registry
- Leaking internal exception text into user-facing UI
- Skipping boundary translators and returning ad hoc transport payloads
- Expanding governance allowlists instead of migrating code to canonical patterns
- Forgetting tenant-safety constraints in error handling or logs

## Day-1 checklist for new contributors

1. Read:
   - `packages/core/src/errors.ts`
   - `packages/core/src/error-translators.ts`
   - `docs/05-reference/error-code-registry.md`
2. Trace one backend flow:
   - `apps/api/src/server.ts` -> one route in `apps/api/src/routes/v1/` -> `apps/api/src/services/report-bullmq.ts`
3. Trace one frontend flow:
   - `apps/frontend/src/lib/errors/normalized-error-adapter.ts` -> `apps/frontend/src/components/errors/AppRouteError.tsx` -> `apps/frontend/src/lib/observability/client-log.ts`
4. Run baseline checks:
   - `pnpm check:error-governance`
   - `pnpm --filter @agenticverdict/core exec vitest run src/errors.test.ts src/error-translators.test.ts`

## Current migration note

The repository is aligned to canonical patterns, but some legacy response envelopes may still exist in isolated paths. For all new work, treat `AppFault` + boundary translators + frontend normalization as the required default.
