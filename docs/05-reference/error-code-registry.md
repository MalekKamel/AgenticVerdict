# Canonical Error Code Registry (v1)

This document defines ownership and the initial canonical error code catalog for the shared `@agenticverdict/core` error system.

## Ownership

- Primary owner: Platform Architecture
- Required reviewers: API, Worker, Frontend, and Observability owners
- Change process: all new codes require OpenSpec change updates and tests for affected translators

## Review and Approval Workflow

1. Open an OpenSpec change that explains why a new canonical code is needed.
2. Update `packages/core/src/errors.ts` and include boundary translation updates in the same change.
3. Request approval from all required reviewers (API, Worker, Frontend, Observability).
4. Ensure CI passes:
   - `pnpm check:error-governance`
   - `pnpm check:error-translator-coverage`
5. Record migration notes in changelog/release docs for affected domains.

## Naming Rules

- Upper snake case with one domain prefix:
  - `TENANT_*`
  - `AUTH_*`
  - `VALIDATION_*`
  - `QUEUE_*`
  - `DB_*`
  - `CONNECTOR_*`
  - `RUNTIME_*`
  - `INTERNAL_*`
- Codes must be stable and machine-readable; never encode tenant-specific data.

## Initial Code Catalog

### Tenant domain

- `TENANT_CONTEXT_REQUIRED`
- `TENANT_MISMATCH`
- `TENANT_NOT_FOUND`

### Auth domain

- `AUTH_UNAUTHORIZED`
- `AUTH_FORBIDDEN`
- `AUTH_SESSION_EXPIRED`

### Validation domain

- `VALIDATION_FAILED`
- `VALIDATION_MISSING_FIELD`

### Queue domain

- `QUEUE_UNAVAILABLE`
- `QUEUE_JOB_FAILED`

### Database domain

- `DB_CONFLICT`
- `DB_UNAVAILABLE`

### Connector domain

- `CONNECTOR_TIMEOUT`
- `CONNECTOR_UPSTREAM_FAILURE`

### Runtime domain

- `RUNTIME_TIMEOUT`
- `RUNTIME_UNAVAILABLE`

### Internal domain

- `INTERNAL_ERROR`

## Extension Checklist

1. Add the code in `packages/core/src/errors.ts`.
2. Update this registry document with rationale.
3. Add/adjust translator mapping tests for impacted boundaries.
4. Confirm observability dimensions remain low-cardinality.

## Migration Completion Checklist

- [ ] Legacy message-string matching removed from touched runtime boundaries.
- [ ] Boundary translators emit canonical code/category/retryable metadata.
- [ ] Frontend uses normalized adapter output (`messageKey`, severity, retry metadata) for UI rendering.
- [ ] Frontend telemetry includes canonical metadata and correlation/request identifiers when available.
- [ ] `pnpm check:error-governance` passes.
- [ ] `pnpm check:error-translator-coverage` passes.
