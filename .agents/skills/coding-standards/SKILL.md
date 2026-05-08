---
name: coding-standards
description: Enforce AgenticVerdict coding standards including TypeScript strict mode, error system patterns, logging conventions, and security-first implementation rules.
---

## Purpose

Define and enforce coding standards that ensure type safety, consistent error handling, secure logging, and maintainable code across the AgenticVerdict monorepo.

## When to use

- Writing new production code.
- Reviewing PRs for style and convention compliance.
- Refactoring existing code to meet standards.
- Onboarding new contributors to code conventions.

## TypeScript standards

- **Strict mode enforced.** Zero `any` types in production code.
- Use `unknown` for untyped values, then narrow with type guards.
- Cyclomatic complexity < 15 per function.
- Prefer explicit return types on exported functions.
- Use branded types for tenant IDs, user IDs, and other domain identifiers.

## Error handling

- Use canonical error system (`packages/core/src/error-system/`)
- Never expose internal errors to frontend without translation
- Always include tenant context in error metadata
- Define structured domain errors with stable error codes
- Translate errors at API/worker boundaries before returning to clients

## Logging conventions

- Use Pino via `packages/observability/`
- Structured JSON format in production
- **Never log:** credentials, tokens, PII, raw request bodies
- Always include: `tenantId`, `requestId`, `userId` (if authenticated)
- Log levels: `error` for failures, `warn` for recoverable issues, `info` for significant events, `debug` for troubleshooting

## Security rules

1. No `any` types in production code.
2. No hardcoded tenant logic.
3. No tenant data access without tenant context and scoping safeguards.
4. No sensitive data in logs (credentials, tokens, raw PII).
5. No long-running blocking operations in API request handlers.
6. No platform-specific leakage into shared core abstractions.
7. Follow security-first defaults and fail-closed validation behavior.

## Code organization

- Avoid barrel files (`index.ts` re-exports) in production code. Import directly:

```typescript
// Avoid
import { something } from "@agenticverdict/core";

// Prefer
import { something } from "@agenticverdict/core/src/specific-module";
```

- Keep domain logic in `packages/core/`
- Keep infrastructure concerns in respective service packages
- Shared types live in `packages/types/`

## Step-by-step workflow

1. Identify the scope and affected packages.
2. Apply TypeScript strict mode rules (no `any`, use `unknown` + narrowing).
3. Use canonical error system for all error paths.
4. Ensure logging follows structured format with tenant context.
5. Verify no sensitive data leakage in logs or error messages.
6. Check barrel file usage and prefer direct imports.

## Validation checks

- Zero `any` types introduced.
- Error system compliance at all boundaries.
- Structured logging with required metadata.
- No sensitive data in logs or errors.
- Cyclomatic complexity < 15 per function.
- Direct imports (no barrel files) in production code.

## Deliverables

- Type-safe, strictly-typed implementation.
- Error system-compliant error handling.
- Structured logging with tenant context.
- Clean import paths without barrel file usage.

## Failure conditions

- `any` types in production code.
- Internal errors exposed to frontend without translation.
- Sensitive data in logs or error messages.
- Missing tenant context in error metadata.
- Barrel files in production code paths.
- Cyclomatic complexity >= 15 in any function.
