---
name: backend-patterns
description: Enforce production-ready backend implementation patterns for AgenticVerdict services with strict typing, resilient integrations, secure observability, and non-blocking request handling.
---

## Purpose

Provide a repeatable backend implementation standard aligned to repository constraints and multi-tenant production safety.

## When to use

- Changes in `apps/api`, `apps/worker`, or shared backend packages.
- Connector integration work.
- API/worker refactors affecting errors, logging, or runtime behavior.

## Core patterns

- Strict typing and no `any`; use `unknown` + narrowing when needed.
- Structured domain errors with stable error codes.
- Structured observability without secrets/PII.
- Connector adapters must follow shared `ConnectorAdapter` contract.
- Keep API routes non-blocking; offload long-running work to workers.
- Keep behavior configuration-driven and tenant-safe.

## Step-by-step workflow

1. Scope runtime boundaries and risks.
2. Define/update contracts (types, schemas, errors) first.
3. Implement with resilience and observability.
4. Add/adjust tests for success and failure paths.
5. Run targeted type checks and tests.
6. Document behavior and risk changes when applicable.

## Validation checks

- No `any` introduced.
- Input validation for external boundaries.
- Structured errors at boundaries.
- Redacted safe logs.
- No long-running blocking API path.
- Connector contract compliance where relevant.

## Deliverables

- Production-ready backend code with tests.
- Updated type/schema/error contracts.
- Observability updates.
- Concise notes on risk and operational impact.

## Failure conditions

- Weak typing or runtime-validation gaps.
- Sensitive-data leakage in logs/errors.
- Blocking API routes for long-running tasks.
- Connector contract violations.
