## Why

The current codebase has divergent scheduling patterns: reports use in-memory storage with naive cron regex validation, while insights use a JSONB column with no cron expression support. This creates critical risks — schedule data is lost on server restart (reports are in-memory only), and there is no unified conflict detection, audit trail, or timezone handling. This plan consolidates both into a database-backed, timezone-aware, cron-based scheduling system with shared abstractions, eliminating code duplication and establishing an extensible foundation for future schedulable entities.

## What Changes

- **New unified `schedules` table** with polymorphic entity support (`entity_type`: 'report' | 'insight') replacing in-memory store and JSONB column
- **New `schedule_executions` audit table** tracking all schedule ticks with status, timing, and error information
- **Shared BullMQ schedule utilities** (`schedule-bullmq.ts`) parameterized by queue name and entity type, replacing report-specific job registration
- **`cron-parser` library** replacing naive regex validation, enabling next-run computation and timezone-aware scheduling
- **Unified tRPC `schedules` router** consolidating schedule CRUD, conflict detection, nextRun computation, and execution history
- **Two-hop scheduling for all entities** — `{ENTITY}_SCHEDULE_QUEUE` → `{ENTITY}_EXECUTION_QUEUE` pattern for both reports and insights
- **Startup recovery** (`recoverSchedules()`) re-registering all active schedules on API and worker boot
- **Frontend schedule status UI** — shared `ScheduleStatusBadge` component and `scheduleService` frontend module
- **Deprecation of `schedule-store.ts`** in-memory store with runtime warnings

## Capabilities

### New Capabilities

- `schedule-management`: CRUD operations for schedules with polymorphic entity support, cron expression validation, timezone configuration, and enable/disable toggling
- `schedule-execution`: Two-hop queue processing (schedule tick → execution enqueue), execution audit trail recording, and retry/backoff handling
- `schedule-recovery`: Startup recovery that re-registers all active schedules from the database on API and worker boot
- `schedule-conflict-detection`: Database-query-based conflict detection preventing duplicate cron expressions per tenant per entity type

### Modified Capabilities

<!-- No existing specs are being modified — this is a new feature area -->

## Impact

- **Database**: New `schedules` and `schedule_executions` tables with RLS policies; `insights.schedule` JSONB column will be deprecated
- **API**: New tRPC `schedules` router; existing Fastify report schedule routes kept for backward compatibility with deprecation notices
- **Worker**: New `INSIGHT_SCHEDULE_QUEUE` worker, shared schedule tick processors, startup recovery module
- **Frontend**: New `ScheduleStatusBadge` component, `scheduleService` frontend module, integration into insight and report list/detail pages
- **Dependencies**: New `cron-parser` package
- **Types**: New `ScheduleRecord`, `ScheduleExecutionRecord`, `ScheduleEntityType` types; `InsightSchedule` type deprecated
