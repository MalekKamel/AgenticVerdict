## Context

AgenticVerdict has a multi-component architecture (API, worker, agent runtime, data connectors, report generator, frontend) with significant integration gaps preventing end-to-end functionality. The intelligence pipeline (COLLECT -> ANALYZE -> GENERATE -> DELIVER) is broken at multiple points:

1. `insight.run` is a no-op stub -- returns success without enqueuing any job
2. Pipeline agents run with zero tools -- `createPipelineAgentTools()` returns `[]`
3. Agent configuration ignores all options -- `void options` in `createPipelineAgentConfig()`
4. Worker has no database access -- uses disk config, hardcoded mock tokens
5. Pipeline results are never persisted -- lost after job completion
6. No real-time status tracking -- only 5s polling on list page
7. RLS on only 6 of 34+ tables -- 28 tables rely solely on app-level enforcement

The remediation plan identifies 42 gaps across 6 phases requiring coordinated changes across all apps and packages.

**Constraints:**

- Multi-tenant isolation must be maintained throughout (RLS, `dbScoped()`, tenant-prefixed cache keys)
- Existing BullMQ infrastructure (4 queues) must be extended, not replaced
- Agent runtime's 5-provider failover/circuit-breaker infrastructure is solid and must be preserved
- Data connectors (GA4, Meta, GSC, GBP, TikTok) are production-ready and must not be modified
- Drizzle ORM schema changes require clean migrations with rollback paths

## Goals / Non-Goals

**Goals:**

- End-to-end insight execution: "Run Now" triggers actual pipeline, persists results, updates UI
- Agents receive functional tools (data fetchers, metric calculators, tenant context)
- Worker accesses database for credentials, config, and result persistence
- Real-time status tracking on insight detail page
- All tenant-scoped tables protected by RLS policies
- RBAC middleware enforced at API level
- Audit trail event types aligned between backend and frontend
- All 42 identified gaps resolved

**Non-Goals:**

- New data connectors (LinkedIn, Twitter/X, YouTube) -- deferred
- Incremental/delta sync for connectors -- deferred
- Credential encryption implementation -- schema and seed only, encryption utility deferred
- WebSocket/SSE infrastructure -- polling-based status only for now
- XLSX chart generation -- deferred
- Multi-template report composition -- deferred
- Desktop app changes -- out of scope

## Decisions

### D1: Polling over WebSocket/SSE for real-time status

**Decision:** Use client-side polling (3s interval) for pipeline status updates instead of WebSocket or SSE.
**Rationale:** WebSocket requires infrastructure changes (connection management, scaling, heartbeat). SSE requires server-side event stream support. Polling leverages existing tRPC infrastructure, is simpler to implement, and is sufficient for the current scale. Can migrate to WebSocket later if needed.
**Alternatives considered:** WebSocket (too complex for current needs), SSE (requires server changes), long-polling (same complexity as regular polling).

### D2: Single insight-execution queue vs. per-stage queues

**Decision:** Use a single `insight-execution` BullMQ queue for the entire pipeline rather than separate queues per stage.
**Rationale:** The intelligence pipeline is already designed as a synchronous 3-stage process within a single `runIntelligencePipeline()` call. Splitting into per-stage queues would require significant pipeline refactoring, add complexity for job correlation, and provide minimal benefit given current throughput needs.
**Alternatives considered:** Per-stage queues (more complex, enables parallelism but not needed), separate queues per tenant (overkill, tenant scoping handled in job data).

### D3: Structured data types between pipeline stages

**Decision:** Define typed `AnalysisResult` and `InsightsResult` interfaces that flow between stages alongside text output for logging.
**Rationale:** Raw text truncation (12k-20k chars) causes data loss and prevents structured insight generation. Typed interfaces enable per-metric insights, confidence scores, and actionable recommendations. Maintaining text output ensures backward compatibility for logging and debugging.
**Alternatives considered:** Text-only with JSON embedding (fragile parsing), protobuf serialization (overkill for single-process), event-sourced state machine (too complex).

### D4: Worker database access via existing `dbScoped()` pattern

**Decision:** Worker uses the same `dbScoped()` function from `@agenticverdict/database` as the API, with tenant context from `AsyncLocalStorage`.
**Rationale:** Consistency across services, existing RLS integration, proven pattern. Worker already has ALS for tenant context -- just needs to wire it to `dbScoped()`.
**Alternatives considered:** Separate database client for worker (duplication, inconsistent scoping), raw SQL queries (bypasses ORM and RLS).

### D5: Credential fetching with mock fallback

**Decision:** Worker attempts real credential fetch from `platform_credentials` table, falls back to mock adapter with warning log if credentials missing or decryption fails.
**Rationale:** Enables gradual migration to real connectors. Development environments can use `USE_MOCK_CREDENTIALS=1` to bypass real credentials. Production failures degrade gracefully rather than crashing.
**Alternatives considered:** Hard failure on missing credentials (breaks dev environments), always use mock (defeats purpose).

### D6: Shared audit event type enum

**Decision:** Create a shared `AuditEventType` enum in `packages/types/src/audit-event-types.ts` used by both backend and frontend.
**Rationale:** Eliminates the current mismatch where backend stores `created/updated/deleted/ai_generated` but frontend filters by `run/config_change/delivery/error`. Single source of truth prevents future drift.
**Alternatives considered:** Backend-only enum (frontend still hardcodes), frontend-only enum (backend still hardcodes), string constants (no type safety).

### D7: Phased RLS migration

**Decision:** Create a single migration `003_rls_policies_extended.sql` covering all 28+ missing tables, tested in dev before production.
**Rationale:** Single migration is easier to track and rollback. Testing in dev catches any queries that bypass tenant scoping. Indexes on `tenant_id` columns included for performance.
**Alternatives considered:** Per-table migrations (harder to track), application-level enforcement only (insufficient security).

## Risks / Trade-offs

| Risk                                                     | Impact | Mitigation                                                                         |
| -------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------- |
| LLM API costs during testing                             | Medium | Use mock LLM for all unit/integration tests, real LLM only for E2E validation      |
| Connector API rate limits during development             | Medium | Use mock adapters in dev, sandbox credentials for testing                          |
| RLS migration breaks existing queries                    | High   | Test in dev with `db:reset` + `seed-dev`, add rollback migration script            |
| Schema changes break seed data                           | Medium | Run seed after each schema change, add validation assertions                       |
| BullMQ queue complexity with new insight-execution queue | Medium | Start with single queue, add retry/dead-letter configuration incrementally         |
| Polling adds API load at scale                           | Low    | 3s interval is manageable; can increase to 5s or add exponential backoff if needed |
| Agent tool wiring increases pipeline execution time      | Low    | Tools are cached; circuit breaker prevents cascading failures                      |
| Structured data types require pipeline refactoring       | Medium | Maintain backward compatibility with text output during transition                 |

## Migration Plan

1. **Phase 1 (Foundation):** Worker DB access + credential fetching + seed data
   - Deploy: `packages/database` migration + seed, `apps/worker` DB integration
   - Verify: Worker can query DB, fetch credentials, persist results
   - Rollback: Revert migration, restart worker with disk config

2. **Phase 2 (Agent Runtime):** Tool wiring + config options + structured data
   - Deploy: `packages/agent-runtime` changes
   - Verify: Pipeline produces structured output with real tools
   - Rollback: Revert to empty tools array, text-only output

3. **Phase 3 (API Integration):** Insight execution queue + real `insight.run`
   - Deploy: `apps/api` queue enqueue + `apps/worker` queue processor
   - Verify: "Run Now" triggers pipeline, results persisted
   - Rollback: Revert `insight.run` to stub, drain queue

4. **Phase 4 (Frontend):** Real-time status + UI fixes
   - Deploy: `apps/frontend` status polling + bug fixes
   - Verify: Status updates on detail page, report list scoped correctly
   - Rollback: Revert frontend build

5. **Phase 5 (Database):** RLS expansion + schema fixes
   - Deploy: RLS migration + schema fixes
   - Verify: All tables have RLS, schema consistent
   - Rollback: Rollback migration

6. **Phase 6 (Bug Fixes):** Remaining quality improvements
   - Deploy: Individual fixes (deleteMany, agency metrics, RBAC, etc.)
   - Verify: Each fix tested independently
   - Rollback: Revert individual changes

## Open Questions

1. **Credential encryption utility:** Should we implement AES-256 encryption for stored credentials in this change, or defer to a follow-up? The remediation plan marks it as medium priority (G-30). _Decision: Defer encryption implementation; store credentials in plain text for now with clear TODO markers._

2. **Pipeline timeout configuration:** What is the maximum acceptable pipeline execution time? Current stub returns immediately; real pipeline with 5 connectors and 3 LLM stages could take minutes. _Decision: Set default timeout to 10 minutes, configurable via environment variable `PIPELINE_TIMEOUT_MS`._

3. **Report blob storage:** Where should generated reports be stored? Currently no blob storage infrastructure exists. _Decision: Store report content as base64 in `reports` table `content` column for now. Migrate to S3/SeaweedFS in a follow-up change (reference: `openspec/changes/s3-seaweedfs`)._
