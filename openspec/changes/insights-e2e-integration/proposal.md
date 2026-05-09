## Why

The `dashboard/insights/` routes have been implemented across listing, creation, detail, editing, and execution flows, but 42 gaps across frontend, API, database, and integration layers prevent the feature from being production-ready. Critical blockers include missing database schema definitions, broken pipeline tool wiring, disconnected REST endpoints, and incomplete localization. This change closes all gaps to deliver a fully functional, end-to-end insights feature.

## What Changes

- **Database**: Add `generated_insights` table and `insight_type` enum to baseline schema with RLS policies, indexes, and FK constraints
- **API Layer**: Remove duplicate procedures, add connector existence validation, enforce `INSIGHTS_READ` permission, fix broken `getAIInsights` query, normalize error handling, add rate limiting on tRPC mutations, add idempotency on `run`
- **Agent Runtime**: Wire `metricsStore` into insight execution pipeline, consume `selectedMetrics` and `filters` from insight-connectors, reconcile `InsightItem.type` enum mismatch
- **Scheduling**: Implement scheduled insight execution using existing scheduling infrastructure
- **Frontend**: Implement sorting, wire domain filter to API, sync pagination to URL, fix `onManageConnectors` no-op, add enable/disable toggle, replace native dialogs with Mantine modals, i18n-ize wizard buttons, fix type mismatches and state drift, clean up duplicate hooks
- **Localization**: Add missing `insights.*` namespace keys to `zh.json` and `fr.json` (~40+ keys each)
- **Connector Integration**: Add health pre-check before execution, fix silent mock fallback, add credential refresh logic
- **Testing**: Enable skipped tests, add tRPC router integration tests

## Capabilities

### New Capabilities

- `insights-e2e-execution`: End-to-end insight execution pipeline with metrics store integration, connector health checks, idempotent job enqueue, and scheduled execution
- `insights-data-model`: Complete database schema for insights including `generated_insights` table, RLS policies, indexes, and constraints
- `insights-api-contracts`: Production-ready tRPC procedures with permission enforcement, input validation, error normalization, and rate limiting
- `insights-localization`: Full i18n coverage for insights feature across all supported locales (en, ar, es, zh, fr)

### Modified Capabilities

- `dashboard-surfaces`: Insights listing, detail, creation, and editing surfaces gain sorting, filtering, pagination sync, enable/disable toggle, connector health display, and Mantine modal confirmations
- `dashboard-foundation`: Insights routes adopt canonical error boundaries, loading skeletons, and standardized async state patterns

## Impact

- **Database**: New `generated_insights` table in baseline schema; `insights` table gains `updated_at` column; `insight_connectors` gains standalone index
- **API**: `apps/api/src/trpc/routers/insights.ts` — significant refactoring (deduplication, validation, error normalization, rate limiting); `apps/api/src/routes/v1/insights.ts` — replace in-memory store
- **Worker**: `apps/worker/src/queues/report-queues.ts` — metrics store wiring, filter consumption, scheduling; `apps/worker/src/connector-factory.ts` — mock fallback and health check
- **Agent Runtime**: `packages/agent-runtime/src/agent-kinds.ts` — metrics store provision; `packages/agent-runtime/src/intelligence-pipeline.ts` — type reconciliation
- **Frontend**: 10+ files across `apps/frontend/src/features/insights/` — sorting, filtering, pagination, toggles, modals, i18n, type fixes, hook cleanup
- **i18n**: `apps/i18n/locales/zh.json`, `apps/i18n/locales/fr.json` — ~40+ new keys each
