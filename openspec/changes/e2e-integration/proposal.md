## Why

The AgenticVerdict intelligence pipeline is currently broken end-to-end. While individual components exist (API, worker, agent runtime, data connectors, report generator), critical integration gaps prevent the core "Run Now" insight execution flow from working. Users can create insights but cannot execute them, agents run with no tools, results are never persisted, and there is no real-time status tracking. This change fixes all 42 identified gaps (10 critical, 12 high, 14 medium, 6 low) to deliver a fully functional end-to-end intelligence pipeline.

## What Changes

- **Worker gains database access** -- `dbScoped()` integration for credential fetching, result persistence, and tenant-scoped operations
- **Insight execution queue** -- New BullMQ `insight-execution` queue connecting API "Run Now" to worker pipeline processing
- **Agent tools wired into pipeline** -- `createPipelineAgentTools()` returns actual tool instances (data fetchers, metric calculators, tenant context providers) instead of empty array
- **Agent configuration becomes functional** -- `createPipelineAgentConfig()` uses tenant name, prompt vars, template version, and platform dependencies
- **Structured data flow between pipeline stages** -- Typed `AnalysisResult` and `InsightsResult` replace raw text truncation
- **Real connector authentication** -- Worker fetches OAuth credentials from `platform_credentials` table instead of hardcoded mock token
- **Pipeline result persistence** -- Insights, verdicts, and generated reports stored in database with retrieval endpoints
- **Real-time status updates** -- Polling-based status tracking on insight detail page (running -> completed/failed)
- **AI insights retrieval** -- `getAIInsights` returns real data from persisted pipeline results instead of empty response
- **Audit trail event type alignment** -- Shared enum between backend and frontend fixes timeline display mismatches
- **Report list scoping** -- Detail page filters reports by insight ID
- **RLS policy expansion** -- Row-level security on all 28+ tenant-scoped tables (currently only 6)
- **Schema fixes** -- FK references, unique constraint conflicts, and seed data completeness
- **RBAC middleware enforcement** -- `requirePermission()` and `requireRole()` applied to tRPC routers
- **Bug fixes** -- `deleteMany` bulk delete, `agency.getAggregateMetrics` multi-client query, `connector.test` real connectivity, email attachments

## Capabilities

### New Capabilities

- `insight-execution`: End-to-end insight run flow from API "Run Now" through BullMQ queue to worker pipeline execution and result persistence
- `pipeline-agent-tools`: Functional tool wiring for analysis, insights, and verdict agents with platform data fetchers and tenant context providers
- `worker-database-integration`: Worker database access via `dbScoped()` for credential management, result persistence, and tenant configuration
- `real-time-status`: Real-time pipeline execution status tracking with polling-based updates on insight detail page
- `report-persistence`: Generated report storage in database/blob storage with retrieval and download endpoints
- `audit-trail-alignment`: Shared audit event type enum between backend and frontend with consistent event logging
- `rbac-enforcement`: API-level permission enforcement via RBAC middleware on all tRPC mutation procedures

### Modified Capabilities

- `dashboard-surfaces`: Insight detail page gains real-time status tracking, insight-scoped report list, and fixed run hook cache invalidation
- `dashboard-foundation`: Typed data contracts extended to include pipeline execution status and structured analysis results

## Impact

- **apps/api** -- `insights.ts` (run, getAIInsights, generateAIInsights procedures), `report-bullmq.ts` (new queue), `agency.ts` (multi-client fix), `reports.ts` (deleteMany fix), RBAC middleware wiring across all routers
- **apps/worker** -- New `database.ts` singleton, `connector-factory.ts` (real credentials), `report-queues.ts` (insight execution processor, result persistence, report storage), `tenant/worker-tenant-als.ts` (DB config loading)
- **apps/frontend** -- `InsightDetailPage.tsx` (status polling, report scoping, run hook fix), `insight-api.ts` (status polling hook), `AuditTrailTimeline.tsx` (shared event types)
- **packages/agent-runtime** -- `agent-kinds.ts` (tools wiring, config options), `intelligence-pipeline.ts` (structured data flow), new `types/pipeline-data.ts`
- **packages/database** -- New RLS migration, schema fixes (FK references, unique constraints), new seed files (platform credentials, audit trail, marketing metrics, provenance records)
- **packages/types** -- New `audit-event-types.ts` shared enum
- **Breaking changes** -- None for external APIs. Internal queue job schemas and pipeline data structures are new additions.
