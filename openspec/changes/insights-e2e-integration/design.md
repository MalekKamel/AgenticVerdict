## Context

The insights feature spans 4 layers (frontend, API, agent runtime, database) with 42 identified gaps. The feature is functionally implemented across listing, creation, detail, editing, and execution flows, but critical integration points are broken: `generated_insights` is missing from the baseline SQL schema, `metricsStore` is never wired into the execution pipeline, the REST endpoint uses an in-memory store disconnected from tRPC/PostgreSQL, and `getAIInsights` ignores its `insightId` parameter. The codebase is greenfield (no production data), so schema changes can be applied without migration complexity.

## Goals / Non-Goals

**Goals:**

- Deliver fully functional end-to-end insights feature (listing, creation, detail, editing, execution)
- Fix all critical blockers: schema gaps, pipeline wiring, broken queries, missing localization
- Establish production-ready API contracts with permission enforcement, validation, and error normalization
- Enable scheduled insight execution with idempotent job enqueue
- Achieve full i18n coverage across all 5 supported locales

**Non-Goals:**

- Insight templates support (P3-7) — deferred to future iteration
- Bulk operations (P3-10) — deferred to future iteration
- Connector credential refresh logic — out of scope for this change (separate connector lifecycle work)
- PDF report generation improvements — existing pipeline generator is sufficient

## Decisions

### D1: Schema-first approach for `generated_insights`

**Decision:** Add `generated_insights` table and `insight_type` enum directly to `baseline-schema.sql` rather than relying solely on Drizzle migrations.
**Rationale:** The baseline schema is the source of truth for `make db-reset && make db-seed`. Adding it here ensures the table exists after any database reset. The Drizzle schema file (`generated-insights.ts`) will be updated to use `coreSchema` instead of `pgTable` for consistency.
**Alternatives considered:** Drizzle-only migrations — rejected because baseline schema is the reset authority.

### D2: `metricsStore` wiring via `runIntelligencePipeline` specialization

**Decision:** Pass `metricsStore` through the `specialization` field of `runIntelligencePipeline` in `defaultInsightExecutionProcessor`, using the existing `CreatePipelineAgentOptions.metricsStore` interface.
**Rationale:** The `createPipelineAgentTools()` function already accepts `metricsStore` and registers database query tools when provided. The gap is simply that the processor never passes it. This is a minimal, non-breaking change.
**Alternatives considered:** Creating a new pipeline variant — rejected as unnecessary complexity.

### D3: Insight type enum reconciliation

**Decision:** Standardize on the pipeline's canonical set: `"opportunity" | "risk" | "observation" | "recommendation"`. Update `generated_insights.insight_type` enum and the `InsightItem.type` mapping to use explicit conversion instead of blind `as` casts.
**Rationale:** The current mismatch (`anomaly/trend/opportunity/warning` vs `opportunity/risk/observation/recommendation`) causes silent data corruption. Since this is greenfield, we can standardize now.
**Alternatives considered:** Keep both enums with runtime mapping — rejected as it perpetuates the inconsistency.

### D4: Scheduled execution via existing `report-schedule` infrastructure

**Decision:** Reuse the existing `REPORT_SCHEDULE_QUEUE` pattern to create an `INSIGHT_SCHEDULE_QUEUE` that processes `InsightSchedule` configurations and enqueues jobs to `INSIGHT_EXECUTION_QUEUE`.
**Rationale:** The report scheduling infrastructure (`enqueueScheduledReportGeneration`, `report-schedule-enqueue.ts`) provides a proven pattern. Insights have similar scheduling needs (frequency, time) but different payload structure.
**Alternatives considered:** Cron-based scheduling — rejected as it duplicates existing BullMQ delayed job infrastructure.

### D5: tRPC rate limiting via middleware composition

**Decision:** Apply rate limiting at the tRPC router level using a composable middleware that wraps mutation procedures, rather than a global tRPC middleware.
**Rationale:** Different mutations have different rate limits (`run` is more expensive than `update`). Router-level composition allows per-procedure configuration. Redis-backed counters support multi-instance deployments.
**Alternatives considered:** Global tRPC middleware — rejected as it applies uniform limits. Express-level middleware — rejected as it doesn't cover tRPC.

### D6: REST v1 endpoint delegation to tRPC

**Decision:** Replace the in-memory `analysis-store.ts` in `apps/api/src/routes/v1/insights.ts` with direct calls to the database layer (shared with tRPC), rather than calling tRPC from Express.
**Rationale:** Calling tRPC from Express creates circular dependency and context propagation issues. Direct DB access is cleaner and maintains tenant isolation via `dbScoped()`.
**Alternatives considered:** tRPC-from-Express — rejected due to context complexity. Keep in-memory — rejected as it defeats the purpose.

## Risks / Trade-offs

| Risk                                                     | Impact            | Mitigation                                                                          |
| -------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------- |
| `metricsStore` wiring changes pipeline tool set          | Medium            | Test pipeline with and without metricsStore; verify tool registration               |
| Type enum change breaks any existing generated data      | None (greenfield) | No production data exists; seed data will be regenerated                            |
| Rate limiting blocks legitimate batch operations         | Medium            | Configure generous limits (10 req/min for `run`, 30 req/min for mutations); monitor |
| Schema changes require full `db-reset`                   | None (greenfield) | No production data; acceptable for development                                      |
| Scheduling infrastructure conflicts with report-schedule | Low               | Use separate queue name; share worker infrastructure                                |
| REST endpoint change breaks API consumers                | Low               | Internal API only; no external consumers identified                                 |
