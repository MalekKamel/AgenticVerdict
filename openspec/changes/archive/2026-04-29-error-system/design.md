## Context

Error handling is inconsistent across API routes, tRPC, queue/worker flows, and frontend clients. Existing code mixes typed errors, plain `Error` usage, local taxonomies, and message-string matching, which makes behavior hard to reason about and increases security and reliability risk. This design introduces one canonical error contract and enforces translation at every boundary so internal failures are normalized, observable, and safe for consumers.

Primary constraints:

- Multi-tenant isolation and sensitive-data-safe observability must be preserved.
- Runtime surfaces must fail closed with consistent, machine-readable semantics.
- Legacy error pathways are removed rather than kept for compatibility.

## Goals / Non-Goals

**Goals:**

- Define a canonical shared error model (`AppFault`) with strict code/category/surface semantics.
- Standardize boundary translation for HTTP, tRPC, queue/worker, and frontend DTOs.
- Centralize frontend error adaptation and remove feature-local models.
- Provide observability and governance rules that keep error behavior consistent over time.

**Non-Goals:**

- Introducing tenant-specific behavior in the error model.
- Preserving legacy string-matching handlers or local error taxonomies.
- Reworking unrelated feature flows that do not cross error boundaries.

## Decisions

1. Canonical shared contract in `packages/core/errors`.
   - Decision: add `ErrorCode` registry, `ErrorCategory`, `ErrorSurface`, `AppFault`, `isAppFault`, and `toAppFault`.
   - Rationale: keeps source-of-truth semantics in one package and prevents drift between services.
   - Alternative considered: keeping per-surface contracts with adapters only. Rejected because it preserves duplication and inconsistent evolution.

2. Boundary-first translation architecture.
   - Decision: add translators for HTTP, tRPC, queue/worker, and frontend-safe payloads and require boundary layers to translate all unknown errors.
   - Rationale: boundaries are the correct control points to enforce safe output and stable contracts.
   - Alternative considered: translating only at throw sites. Rejected because throw sites are harder to enforce and audit.

3. Frontend normalized adapter with message-key output.
   - Decision: frontend consumes canonical payloads and maps to one view model with `messageKey`, interpolation params, retry metadata, and severity.
   - Rationale: prevents raw server message leakage and removes duplicated UI mapping logic.
   - Alternative considered: retaining domain-specific frontend error types. Rejected due to maintenance overhead and inconsistent UX behavior.

4. Governance through CI and lint-style guardrails.
   - Decision: enforce registered code usage, ban runtime string-code matching patterns, and require translator coverage in tests.
   - Rationale: prevents regression after migration and keeps extension of the registry intentional.
   - Alternative considered: documentation-only enforcement. Rejected because it is insufficient for long-term consistency.

## Risks / Trade-offs

- [Migration churn across many modules] -> Stage rollout by capability and require dependency-order execution in tasks.
- [Incorrect code mappings during cutover] -> Add contract tests per surface and integration tests for representative failure classes.
- [Observability label cardinality growth] -> Restrict label dimensions to stable controlled sets (`surface`, `code`, `category`, `retryable`, `severity`).
- [Frontend regressions from model consolidation] -> Add adapter and resolver tests plus targeted UX smoke coverage for auth/dashboard/reporting flows.

## Migration Plan

1. Implement shared canonical error core and translators with unit tests.
2. Migrate API/tRPC and queue/worker boundaries to translator-first handling and remove legacy branches.
3. Migrate frontend to the normalized adapter and remove feature-local error models.
4. Add governance checks and finalize cleanup of deprecated modules/helpers.
5. Rollback strategy: isolate rollback to the latest migration phase by reverting phase-specific commits while preserving shared core primitives already validated by tests.

## Open Questions

- Should retry metadata include explicit backoff hints (`retryAfterSec`) for all surfaces or only queue/frontend payloads?
- Which team owns approving new `ErrorCode` additions, and what review gate is required for code-registry changes?
- Should non-production environments include sanitized developer diagnostics in frontend payloads behind a strict debug flag?
