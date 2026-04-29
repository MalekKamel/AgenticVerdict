## 1. Shared Error Core Foundation

- [x] 1.1 Create `packages/core/errors` module with `ErrorCode`, `ErrorCategory`, `ErrorSurface`, and `AppFault` primitives.
- [x] 1.2 Implement `isAppFault()` and `toAppFault()` normalization utilities with strict typing and safe defaults.
- [x] 1.3 Add canonical registry ownership docs and initial code catalog for tenant/auth/validation/queue/db/connector/runtime/internal domains.
- [x] 1.4 Add unit tests for contract creation, normalization behavior, and unregistered-code guard behavior.

## 2. Boundary Translators and Backend Migration

- [x] 2.1 Implement boundary translators for HTTP, tRPC, queue, and worker payload shaping from canonical faults.
- [x] 2.2 Integrate HTTP translation in global API error handling and remove route-level ad hoc response mapping.
- [x] 2.3 Integrate tRPC formatter translation path and remove duplicate tRPC-specific error mapping helpers.
- [x] 2.4 Replace queue/worker message-string matching with canonical typed-code handling in enqueue and job execution flows.
- [x] 2.5 Add integration tests for representative boundary failures (tenant, validation, queue unavailable, DB conflict, connector failure).

## 3. Frontend Error System Consolidation

- [x] 3.1 Implement a single frontend adapter that converts canonical payloads to normalized UI error view model fields (`messageKey`, params, severity, retry metadata).
- [x] 3.2 Replace feature-local error models and mappers in auth/dashboard/shared hooks with the normalized adapter.
- [x] 3.3 Route frontend error telemetry through one observability helper carrying canonical metadata and correlation IDs when present.
- [x] 3.4 Add frontend tests for safe fallback behavior, unknown-code handling, and retryable UX behavior.

## 4. Governance, Cleanup, and Quality Gates

- [x] 4.1 Add CI/static checks for unregistered error codes and banned message-string matching patterns in runtime-critical paths.
- [x] 4.2 Add translator coverage thresholds and fail builds when minimum contract coverage drops.
- [x] 4.3 Remove superseded legacy error classes, wrappers, and mapping utilities across API, worker, frontend, and shared packages.
- [x] 4.4 Update architecture/testing docs with error code extension process, review ownership, and migration completion checklist.
