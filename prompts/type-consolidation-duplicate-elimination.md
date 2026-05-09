# Type Consolidation: Eliminate Duplicates via `/packages/types`

## Context

All shared types and schemas should be defined once in `/packages/types` and imported throughout the codebase. Current violations exist where types are duplicated across application packages and core libraries instead of being reused from the canonical source.

## Evidence of Violations

- `tenantConfigOutputSchema` is duplicated within `/apps/api/src/trpc/routers/insights.ts` (self-duplicate)
- `tenantAIConfigSchema` is defined in `/packages/core/src/tenant/config-schema.ts` instead of `/packages/types`

## Objective

Establish `/packages/types` as the single source of truth for all shared types, eliminating all duplicates across the monorepo.

## Task

1. **Audit**: Scan the entire codebase to identify every type/schema that is duplicated or defined outside `/packages/types` when it should be shared.
2. **Document**: Produce a file containing a comprehensive implementation plan that, for each duplicate found, specifies:
   - The canonical definition location (in `/packages/types`)
   - All duplicate locations to be refactored to import the canonical type
   - Any dependency ordering or migration steps required
3. **Prioritize**: Order the plan by impact and dependency so it can be executed incrementally without breaking builds.
