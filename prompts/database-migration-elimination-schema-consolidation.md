# Database Migration Elimination & Schema Consolidation

## Context

This is a greenfield pre-production environment. No backward compatibility or incremental migration paths are required. Destructive schema changes are acceptable and preferred over maintaining migration history.

## Objective

Eliminate all incremental migration files and consolidate the complete database schema into a single authoritative baseline file.

## Tasks

1. **Audit Existing Migrations**: Review all files under `/packages/database/migrations/` to catalog every schema change, constraint, index, and RLS policy applied incrementally.

2. **Consolidate into Baseline Schema**: Merge all migration changes into `/packages/database/scripts/baseline-schema.sql` so it represents the complete, self-contained schema definition. The baseline must include:
   - All table definitions with full column specifications
   - Primary keys, foreign keys, and unique constraints
   - Indexes
   - Row-level security (RLS) policies
   - Enums, types, and extensions

3. **Remove Migration Files**: Delete all files under `/packages/database/migrations/` after their changes are fully incorporated into the baseline.

4. **Update Tooling**: Ensure any scripts, Makefile targets, or Docker entrypoints that reference the migrations directory are updated to use the baseline schema exclusively.

5. **Validate**: Confirm the consolidated baseline produces an identical schema state by comparing against a fresh database initialized with the original migration chain.

## Constraints

- Preserve all existing RLS policies and multi-tenant isolation boundaries
- Maintain referential integrity across all table relationships
- Do not alter business logic or column semantics during consolidation

## Deliverables

- Updated `/packages/database/scripts/baseline-schema.sql` with complete schema
- Removed `/packages/database/migrations/` directory
- Updated build/setup scripts referencing schema initialization
