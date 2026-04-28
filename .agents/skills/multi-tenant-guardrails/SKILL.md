---
name: multi-tenant-guardrails
description: Enforce non-negotiable multi-tenant safety constraints (tenant isolation, context propagation, tenant-scoped DB access, RLS alignment, and sensitive-data-safe observability) for all architecture, implementation, and review tasks in AgenticVerdict.
---

## Purpose

Provide a repeatable, production-grade checklist and execution workflow that prevents tenant isolation regressions in `AgenticVerdict`.

## When to use

- API routes, middleware, tRPC procedures, server startup, or request lifecycle.
- Worker jobs, queue consumers/producers, scheduled/background execution.
- Database queries, repositories, services, migrations, or access wrappers.
- Auth/session/identity, tenant resolution, feature flag evaluation.
- Logging, metrics, tracing, error serialization, audit records.
- `packages/config` schemas, tenant configuration plumbing, or runtime config interpretation.

## Required sources of truth

1. `/docs/architecture/tenant-requirements-single-source-of-truth-2026-04-25.md`
2. `/packages/config/src/schemas/`
3. Existing `dbScoped` usage patterns and tenant context constraints in current codebase
4. Row-level security assumptions and policies used by PostgreSQL tenant isolation model

## Non-negotiable guardrails

- No hardcoded tenant logic.
- Tenant behavior must be configuration/schema-driven.
- Tenant-scoped DB access only through approved boundaries (`dbScoped` pattern).
- AsyncLocalStorage tenant context propagation is mandatory at entry points and async boundaries.
- RLS assumptions must be preserved; no bypass logic.
- Never log secrets, tokens, credentials, or raw PII.

## Step-by-step workflow

1. Classify tenant-impacting boundaries (request entry, async entry, DB access, logs).
2. Trace tenant context lifecycle (resolve -> validate -> store -> consume).
3. Verify schema-driven behavior from `/packages/config/src/schemas/`.
4. Validate DB scoping via tenant-safe wrappers.
5. Validate RLS compatibility and no policy weakening.
6. Audit observability for redaction/sanitization.
7. Block completion on any guardrail violation.

## Validation checks

- No tenant-specific hardcoded branches.
- Tenant context exists for all tenant data operations.
- No unscoped tenant DB access path.
- RLS assumptions preserved.
- Logs/traces/errors are redacted and safe.
- Negative-path tests exist for missing/wrong tenant context where relevant.

## Deliverables

- Tenant safety impact summary.
- Context-flow notes for touched entrypoints.
- Guardrail checklist results.
- Test evidence for isolation + observability safety.

## Failure conditions

- Hardcoded tenant logic exists.
- Unscoped tenant data access path exists.
- Async context propagation is missing.
- RLS is bypassed or weakened.
- Sensitive data leakage in logs/errors.
