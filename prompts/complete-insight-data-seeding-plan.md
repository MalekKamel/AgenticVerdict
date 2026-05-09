# Complete Insight Data Seeding — Implementation Plan

## Background

The current seed script at `/packages/database/src/seeds/insights-seed.ts` inserts only minimal insight records (`tenantId`, `name`, `description`, `enabled`, `templateId`). It omits:

- **Connector associations** — No rows are created in the `insight_connectors` junction table, leaving insights with zero connectors.
- **JSONB configuration fields** — `schedule`, `delivery`, and `ai_config` remain as empty defaults (`'{}'::jsonb`).
- **Operational fields** — `domain`, `status`, `lastRunAt`, and `lastRunStatus` are not populated.

## Objective

Produce a comprehensive implementation plan that extends the insight seeding pipeline to generate fully populated, realistic insight records with associated connector mappings.

## Scope

### In Scope

1. **Schema analysis** — Review the `insights` and `insight_connectors` table definitions in `/packages/database/src/schema/core/insights.ts`.
2. **Factory design** — Define or extend `InsightFactory` to produce complete `SeedInsight` configurations including connector references, schedule, delivery, and AI config.
3. **Seed script enhancement** — Update `seedInsightsForTenant` (or introduce a companion function) to:
   - Insert insight records with all non-default fields populated.
   - Insert corresponding `insight_connectors` rows linking each insight to relevant data connectors.
4. **Multi-tenant compliance** — All operations must use `runWithTenantContext()` and `dbScoped()`.
5. **Idempotency** — Seed operations must be safe for repeated execution via `onConflictDoNothing()` or `onConflictDoUpdate()`.

### Out of Scope

- Production data migration.
- Changes to the `insights` or `insight_connectors` schema itself.
- Worker-side insight generation logic.

## Deliverable

A single markdown file containing a detailed implementation plan that covers:

- **Data model analysis** — All required and optional fields for `insights` and `insight_connectors`.
- **Factory specification** — Interface definitions and factory method signatures for generating complete insight configurations.
- **Seed implementation** — Code-level specification for the enhanced seed function(s), including connector association logic.
- **Execution order** — Dependency-ordered seeding steps (connectors registry → tenant connectors → insights → insight-connectors).
- **Idempotency strategy** — Conflict resolution approach for each table.
- **Testing approach** — Unit test patterns for seed idempotency and tenant isolation.
- **Success criteria** — Checklist of acceptance conditions.

## Constraints

- **Greenfield pre-production** — No backward compatibility or database migrations required. Use destructive approaches (drop/recreate) freely.
- Follow AgenticVerdict multi-tenant guardrails (no hardcoded tenant IDs, always use `dbScoped()`).
- Follow AgenticVerdict coding standards (TypeScript strict mode, canonical error handling).
- Use existing infrastructure: `@agenticverdict/core` for tenant context, `@agenticverdict/database` for schema access.
- Seed data must be PII-safe and use `.test`/`.local` TLDs per project conventions.

## References

- Seed script: `/packages/database/src/seeds/insights-seed.ts`
- Insight factory: `/packages/database/src/factories/insight-factory.ts`
- Schema: `/packages/database/src/schema/core/insights.ts`
- Multi-tenant guardrails: `.agents/skills/multi-tenant-guardrails/SKILL.md`
- Backend patterns: `.agents/skills/backend-patterns/SKILL.md`
