# Implementation Plan 02 — Unified Cron Execution Scheduler

**Phase:** P0 (Core Feature Completion)
**Original Reference:** Comprehensive Plan §2.2 (Tasks 2.2.1 – 2.2.5)
**Priority:** P0 — Critical path for automated delivery
**Estimated Effort:** 7 tasks, ~3-4 days

---

## 0. Greenfield Development Policy

This is a **pre-production greenfield** codebase. All database changes use **destructive approaches**:

- No migration files with up/down — use `make db:push` to apply schema directly
- No backward compatibility concerns — break freely, rename freely, drop freely
- Seed scripts use `TRUNCATE ... CASCADE` then fresh `INSERT`
- If a schema change is needed mid-development, drop the table and recreate it
- After any schema change, run `make db:reset` to rebuild from scratch

---

## 1. Overview

Implement a **unified scheduling architecture** that serves both reports and insights with shared abstractions, eliminating code duplication and establishing an extensible foundation for future schedulable entities. The current codebase has divergent patterns: reports use in-memory storage with naive cron regex, while insights use DB JSONB with no cron support. This plan consolidates both into a database-backed, timezone-aware, cron-based scheduling system with shared BullMQ utilities, unified conflict detection, startup recovery, and execution audit trails.

### Business Value

- "Automated delivery on schedule" (success criterion 9.1)
- Every insight and report follows COLLECT → ANALYZE → GENERATE → DELIVER lifecycle on schedule (Section 3.1)
- Eliminates critical risk of schedule data loss on restart (reports currently in-memory only)
- Agency Partners can configure per-tenant schedules with correct timezone behavior
- Unified architecture reduces maintenance burden and prevents future duplication

### Architecture Analysis: Reports vs. Insights

| Aspect                  | Reports (Current)                                   | Insights (Current)                  | Unified Target                                                           |
| ----------------------- | --------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------ |
| **Schedule Storage**    | In-memory Map (`schedule-store.ts`)                 | JSONB column (`insights.schedule`)  | DB table for both, with entity_type polymorphism                         |
| **Schedule Expression** | Raw cron string                                     | `{ frequency, time }`               | Both supported: cron + frequency/time with `cron-parser` conversion      |
| **Timezone**            | None                                                | None                                | IANA timezone field, defaults to UTC                                     |
| **BullMQ Registration** | `report-bullmq.ts` (report-specific)                | None (direct enqueue)               | Shared `schedule-bullmq.ts` with generic register/unregister             |
| **Queue Flow**          | `REPORT_SCHEDULE_QUEUE` → `REPORT_GENERATION_QUEUE` | Direct to `INSIGHT_EXECUTION_QUEUE` | Two-hop for both: `{ENTITY}_SCHEDULE_QUEUE` → `{ENTITY}_EXECUTION_QUEUE` |
| **API Layer**           | Fastify REST (`/api/v1/report-schedules`)           | Embedded in tRPC `insights.ts`      | Unified tRPC `schedules` router + entity-specific extensions             |
| **Conflict Detection**  | In-memory `findEnabledScheduleConflict()`           | None                                | DB-query-based unified conflict detection                                |
| **Audit Trail**         | None                                                | None                                | `schedule_executions` table with entity_type polymorphism                |
| **Startup Recovery**    | None                                                | None                                | Unified `recoverSchedules()` called on API + worker boot                 |

### Key Design Decisions

1. **Polymorphic `schedules` table** — Instead of separate `report_schedules` and `insight_schedules` tables, create a single `schedules` table with `entity_type` ('report' | 'insight') and `entity_id` (UUID). This enables unified schedule management APIs, shared conflict detection, and a single audit trail table. The `insights.schedule` JSONB column will be migrated to this table.

2. **Shared BullMQ schedule utilities** — Extract common `registerScheduleRepeatableJob()` / `unregisterScheduleRepeatableJob()` patterns into a shared `schedule-bullmq.ts` module parameterized by queue name, entity type, and job payload. Both report and insight scheduling use these.

3. **`cron-parser` as new dependency** — Replaces the naive regex validator in `schedule-store.ts:20-26` with a battle-tested library that computes `nextRun` timestamps, handles timezone conversion, and validates cron expressions. Benefits both reports and insights.

4. **Two-hop scheduling for all entities** — Reports already use `REPORT_SCHEDULE_QUEUE` → `REPORT_GENERATION_QUEUE`. Insights will adopt `INSIGHT_SCHEDULE_QUEUE` → `INSIGHT_EXECUTION_QUEUE`. This enables schedule tick audit logging, rate limiting at the schedule layer, and dead-letter handling for failed ticks.

5. **Unified tRPC `schedules` router** — Consolidates schedule CRUD, conflict detection, nextRun computation, and execution history into a single router with entity-type filtering. Entity-specific routers (insights, reports) delegate to this for schedule operations.

6. **Graceful migration path** — The in-memory `schedule-store.ts` will be replaced by DB-backed queries. Existing Fastify report schedule routes will be deprecated in favor of tRPC, but kept functional during transition.

---

## 2. Prerequisites

### Already Implemented (Leverage These)

| Component                          | Location                                                                    | Notes                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Insight schedule (JSONB)           | `packages/database/src/schema/core/insights.ts:28-31`                       | `schedule: { frequency, time }` — will be migrated to `schedules` table         |
| InsightSchedule type               | `packages/types/src/insight.ts:64-68`                                       | frequency: daily/weekly/monthly/quarterly, time: 0-23                           |
| BullMQ repeatable jobs (reports)   | `apps/api/src/services/report-bullmq.ts:65-117`                             | Pattern to generalize, not duplicate                                            |
| In-memory schedule store (reports) | `apps/api/src/services/schedule-store.ts`                                   | Will be replaced by DB-backed `schedules` table                                 |
| Fastify report schedule routes     | `apps/api/src/routes/v1/report-schedules.ts`                                | Will be deprecated in favor of tRPC                                             |
| Insight execution queue            | `apps/worker/src/queues/report-queues.ts:1352-1373`                         | `INSIGHT_EXECUTION_QUEUE` worker already registered                             |
| Insight execution enqueue          | `apps/worker/src/queues/insight-schedule-enqueue.ts`                        | `enqueueScheduledInsightExecution()` exists, usable as-is                       |
| Report schedule enqueue            | `apps/worker/src/queues/report-schedule-enqueue.ts`                         | `enqueueScheduledReportGeneration()` exists, usable as-is                       |
| Insight execution processor        | `apps/worker/src/queues/report-queues.ts:829-1083`                          | `defaultInsightExecutionProcessor()` runs full COLLECT→ANALYZE→GENERATE→DELIVER |
| Report schedule processor          | `apps/worker/src/queues/report-queues.ts:816-822`                           | `createDefaultReportScheduleProcessor()` enqueues to generation queue           |
| Queue names                        | `apps/worker/src/queues/queue-names.ts`                                     | `REPORT_SCHEDULE_QUEUE`, `INSIGHT_EXECUTION_QUEUE` defined                      |
| tRPC insight router                | `apps/api/src/trpc/routers/insights.ts`                                     | CRUD + run + audit trail already implemented                                    |
| ScheduleDeliveryStep               | `apps/frontend/src/features/insights/wizard/steps/ScheduleDeliveryStep.tsx` | Already collects schedule config                                                |

### New External Dependency

| Package       | Justification                                                                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cron-parser` | Battle-tested cron expression parsing, next-run computation, timezone support. Replaces naive regex in `schedule-store.ts:20-26`. Used by both report and insight scheduling. |

---

## 3. Tasks

### Task 2.1: Create Unified `schedules` Table + `schedule_executions` Audit Table

**Original:** 2.2.1
**Files:**

- `packages/database/src/schema/schedules.ts` (NEW — unified schedule table)
- `packages/database/src/schema/schedule-executions.ts` (NEW — unified audit trail)
- `packages/database/src/schema/index.ts` (MODIFY — export new tables)
- `packages/database/src/repositories/schedules.repository.ts` (NEW — data access layer)
- `packages/types/src/schedule.ts` (NEW — unified schedule types)
- `packages/types/src/insight.ts` (MODIFY — deprecate old InsightSchedule, reference new types)

**Implementation:**

1. Create `schedules` table with polymorphic entity support:
   - `id` (UUID, PK)
   - `tenant_id` (UUID, not null)
   - `entity_type` (enum: 'report' | 'insight', not null)
   - `entity_id` (UUID, not null) — FK target depends on entity_type
   - `cron_expression` (varchar, not null) — canonical cron string
   - `timezone` (varchar, not null, default 'UTC') — IANA timezone
   - `enabled` (boolean, not null, default true)
   - `metadata` (jsonb, nullable) — entity-specific config (format, templateId, etc.)
   - `last_run_at` (timestamptz, nullable)
   - `last_run_status` (varchar, nullable)
   - `next_run_at` (timestamptz, nullable, generated) — computed via cron-parser
   - `created_at` (timestamptz, not null, default now())
   - `updated_at` (timestamptz, not null, default now())

2. Add indexes:
   - `(tenant_id, entity_type, entity_id)` — unique constraint
   - `(tenant_id, enabled, cron_expression)` — for conflict detection
   - `(tenant_id, next_run_at)` — for recovery and listing

3. Create `schedule_executions` table for audit trail:
   - `id` (UUID, PK)
   - `schedule_id` (UUID, FK → schedules, not null)
   - `tenant_id` (UUID, not null)
   - `entity_type` (enum: 'report' | 'insight', not null)
   - `entity_id` (UUID, not null)
   - `scheduled_at` (timestamptz, not null)
   - `started_at` (timestamptz, nullable)
   - `completed_at` (timestamptz, nullable)
   - `status` (enum: pending, running, completed, failed, skipped)
   - `error_message` (text, nullable)
   - `execution_job_id` (UUID, nullable) — links to BullMQ job / audit_trail entry
   - `created_at` (timestamptz, not null, default now())

4. Add RLS policies for tenant isolation:
   - Both tables: `SELECT/INSERT/UPDATE`: Tenant-scoped (`tenant_id = current_tenant_id()`)

5. Define Drizzle relations in schema files following the pattern in `insight-templates.ts`:
   - `schedulesRelations` — relation to `tenants`
   - `scheduleExecutionsRelations` — relation to `schedules` and `tenants`

6. Create unified types in `packages/types/src/schedule.ts`:

   ```typescript
   export type ScheduleEntityType = "report" | "insight";

   export interface ScheduleRecord {
     id: string;
     tenantId: string;
     entityType: ScheduleEntityType;
     entityId: string;
     cronExpression: string;
     timezone: string;
     enabled: boolean;
     metadata: Record<string, unknown> | null;
     lastRunAt: Date | null;
     lastRunStatus: string | null;
     nextRunAt: Date | null;
     createdAt: Date;
     updatedAt: Date;
   }

   export interface ScheduleExecutionRecord {
     id: string;
     scheduleId: string;
     tenantId: string;
     entityType: ScheduleEntityType;
     entityId: string;
     scheduledAt: Date;
     startedAt: Date | null;
     completedAt: Date | null;
     status: "pending" | "running" | "completed" | "failed" | "skipped";
     errorMessage: string | null;
     executionJobId: string | null;
     createdAt: Date;
   }
   ```

7. Create `SchedulesRepository` in `packages/database/src/repositories/schedules.repository.ts` following the `InsightTemplatesRepository` pattern:
   - Class-based with `createDatabaseClient` instance, `applicationName: "agenticverdict-schedules"`
   - Static `forTest(db)` method for dependency injection
   - Tenant-scoped query methods (all queries filter by `tenant_id`):
     - `findById(tenantId, scheduleId)` — single schedule lookup
     - `findByEntity(tenantId, entityType, entityId)` — schedule for a specific entity
     - `findAll(tenantId, entityType?)` — list schedules for tenant, optionally filtered by entity type
     - `findConflicts(tenantId, entityType, cronExpression, excludeScheduleId?)` — conflict detection query
     - `create(tenantId, scheduleData)` — insert new schedule
     - `update(tenantId, scheduleId, scheduleData)` — update existing schedule
     - `delete(tenantId, scheduleId)` — tenant-scoped deletion
     - `findExecutions(tenantId, scheduleId, options?)` — paginated execution history
     - `createExecution(tenantId, executionData)` — insert execution audit entry
     - `updateExecution(tenantId, executionId, executionData)` — update execution status
   - All methods use Drizzle ORM with explicit tenant isolation (matching `InsightTemplatesRepository.findAll` pattern)

8. Export repository and types from `packages/database/src/index.ts`:
   - `export { SchedulesRepository } from "./repositories/schedules.repository"`
   - `export type { ScheduleDb, NewSchedule, ScheduleExecutionDb, NewScheduleExecution } from "./schema"`
   - Follow the existing pattern used for `InsightTemplatesRepository` and its related types

9. Run `make db:push` to apply the new tables.

10. **Migration note**: Existing `insights.schedule` JSONB data should be migrated to the `schedules` table via a seed script or manual data migration. The JSONB column can be dropped after migration.

**Testing:** Verify tables created correctly after `make db:push`; RLS policy tests; timezone validation tests; unique constraint tests; repository unit tests with `forTest()` injection.

---

### Task 2.2: Shared Schedule BullMQ Utilities + Cron Parsing + Schedule Service

**Original:** 2.2.2
**Files:**

- `apps/api/src/services/schedule-bullmq.ts` (NEW — shared BullMQ utilities)
- `apps/api/src/services/schedule.service.ts` (NEW — business logic service layer)
- `apps/api/src/services/report-bullmq.ts` (MODIFY — migrate to shared utilities)
- `apps/api/src/services/schedule-store.ts` (MODIFY → DEPRECATE — replace with DB queries)

**Implementation:**

1. Create `apps/api/src/services/schedule-bullmq.ts` with shared utilities:
   - `registerScheduleRepeatableJob(queueName: string, repeatKey: string, cronExpression: string, payload: unknown)` — generic function that accepts queue name, repeat key, cron expression, and job payload. Wraps the existing BullMQ `q.add("scheduled-run", payload, { repeat: { pattern, key } })` pattern.
   - `unregisterScheduleRepeatableJob(queueName: string, repeatKey: string)` — generic removal via `q.removeRepeatableByKey(repeatKey)`.
   - `isBullmqConfigured()` — re-export from `report-bullmq.ts` (no change, shared check).
   - Both functions handle the `!conn` case with `AppFault({ code: "QUEUE_UNAVAILABLE" })` — same pattern as existing.

2. Create cron parsing utilities in `apps/api/src/services/schedule-bullmq.ts`:
   - `isValidCronExpression(expr: string): boolean` — uses `cron-parser`'s `parseExpression()` instead of regex.
   - `frequencyToCron(frequency: string, time: number): string` — converts frequency/time to cron:
     - `daily` → `0 <time> * * *`
     - `weekly` → `0 <time> * * 1` (Monday)
     - `monthly` → `0 <time> 1 * *`
     - `quarterly` → `0 <time> 1 */3 *`
   - `computeNextRun(cronExpression: string, timezone: string): Date | null` — uses `cron-parser` to compute next run time in specified timezone.

3. Refactor `report-bullmq.ts` to use the shared utilities:
   - `registerScheduleRepeatableJob(record)` → calls shared `registerScheduleRepeatableJob("report-schedule", repeatKeyForSchedule(record.id), record.cronExpression, payload)`
   - `unregisterScheduleRepeatableJob(scheduleId)` → calls shared `unregisterScheduleRepeatableJob("report-schedule", repeatKeyForSchedule(scheduleId))`
   - Keep the report-specific `repeatKeyForSchedule()` and payload construction in `report-bullmq.ts`.

4. Create insight schedule registration functions in `apps/api/src/services/schedule-bullmq.ts`:
   - `registerInsightScheduleRepeatableJob(scheduleId: string, entityId: string, cronExpression: string)` — calls shared utility with queue `"insight-schedule"`, key `insight-schedule:${scheduleId}`, payload `{ tenantId, insightId: entityId, scheduleId }`.
   - `unregisterInsightScheduleRepeatableJob(scheduleId: string)` — calls shared utility with same queue and key.

5. Create `apps/api/src/services/schedule.service.ts` following the `InsightTemplatesService` pattern:
   - Class-based with `SchedulesRepository` dependency, default-constructed if not provided
   - Static `forTest(repository)` method for dependency injection
   - Constructor: `constructor(repository?: SchedulesRepository)`
   - Business logic methods (all tenant-scoped):
     - `listSchedules(tenantId, entityType?)` — delegates to `repository.findAll()`
     - `getSchedule(tenantId, scheduleId)` — delegates to `repository.findById()`, throws if not found
     - `getScheduleByEntity(tenantId, entityType, entityId)` — delegates to `repository.findByEntity()`
     - `createSchedule(tenantId, scheduleData)` — validates cron expression via `isValidCronExpression()`, computes `nextRunAt` via `computeNextRun()`, delegates to `repository.create()`, then registers BullMQ job if enabled and `isBullmqConfigured()`
     - `updateSchedule(tenantId, scheduleId, scheduleData)` — unregisters old BullMQ job, delegates to `repository.update()`, re-registers if enabled
     - `deleteSchedule(tenantId, scheduleId)` — unregisters BullMQ job, delegates to `repository.delete()`
     - `toggleSchedule(tenantId, scheduleId)` — flips `enabled` flag, registers/unregisters BullMQ job accordingly
     - `validateSchedule(tenantId, scheduleData)` — validates cron expression, returns computed cron string and next 3 run times
     - `checkConflicts(tenantId, entityType, cronExpression, excludeScheduleId?)` — delegates to `repository.findConflicts()`
     - `getExecutionHistory(tenantId, scheduleId, options?)` — delegates to `repository.findExecutions()`
     - `computeNextRun(tenantId, scheduleId)` — fetches schedule, computes next run via cron-parser
   - All BullMQ operations wrapped in try/catch — failure to register does not fail the operation (graceful degradation)
   - All methods propagate tenant context for structured logging

6. Deprecate `schedule-store.ts`:
   - Keep the file but mark all exports as `@deprecated`.
   - The Fastify routes will continue to work during transition, but new code uses the service layer.

**Testing:** Unit tests for cron conversion (all 4 frequencies + edge cases); unit tests for `isValidCronExpression` with cron-parser; integration tests for job registration/removal; verify report schedules still work after refactor; service layer tests with `forTest()` repository injection; tenant isolation tests.

---

### Task 2.3: Wire Schedule Registration into Entity Lifecycles + Startup Recovery

**Original:** 2.2.2 (continued) + 2.2.3 (startup recovery)
**Files:**

- `apps/api/src/trpc/routers/insights.ts` (MODIFY — delegate to schedule service)
- `apps/api/src/services/schedule.service.ts` (MODIFY — add startup recovery method)
- `apps/api/src/routes/v1/report-schedules.ts` (MODIFY — use schedule service instead of in-memory)
- `apps/worker/src/queues/schedule-recovery.ts` (NEW — startup recovery)
- `apps/api/src/server.ts` (MODIFY — call startup recovery)
- `apps/worker/src/cli.ts` (MODIFY — call startup recovery)
- `apps/worker/src/index.ts` (MODIFY — export startup recovery function)

**Implementation:**

1. Wire into insight tRPC lifecycle (`apps/api/src/trpc/routers/insights.ts`):
   - Import `ScheduleService` singleton (or instantiate with default `SchedulesRepository`)
   - **Create** (mutation `insight.create`): After DB insert, call `scheduleService.createSchedule(tenantId, { entityType: 'insight', entityId, ... })`. The service handles DB insert, cron validation, nextRun computation, and BullMQ registration internally. Wrap in try/catch — failure to register does not fail the insight creation (graceful degradation).
   - **Update** (mutation `insight.update`): If schedule fields changed, call `scheduleService.updateSchedule(tenantId, scheduleId, updatedData)`. The service handles unregistering old job, updating DB, and registering new job.
   - **Delete** (mutation `insight.delete`): Call `scheduleService.deleteSchedule(tenantId, scheduleId)` before DB delete. The service handles BullMQ unregistration and DB deletion.
   - **Run** (mutation `insight.run`): No change — already enqueues to `INSIGHT_EXECUTION_QUEUE` manually.

2. Update Fastify report schedule routes (`apps/api/src/routes/v1/report-schedules.ts`):
   - Import and use `ScheduleService` instead of direct DB queries or in-memory store.
   - Replace in-memory `createScheduleRecord()` with `scheduleService.createSchedule(tenantId, { entityType: 'report', ... })`.
   - Replace `listSchedulesForTenant()` with `scheduleService.listSchedules(tenantId, 'report')`.
   - Replace `findEnabledScheduleConflict()` with `scheduleService.checkConflicts(tenantId, 'report', ...)`.
   - Keep BullMQ registration logic delegated to the service layer.

3. Create startup recovery module (`apps/worker/src/queues/schedule-recovery.ts`):
   - `recoverSchedules(connection: IORedis): Promise<number>` — instantiates `SchedulesRepository` directly (not `dbScoped` since this runs at startup, not per-request), queries all active schedules (`enabled = true`), registers each as a BullMQ repeatable job via shared `registerScheduleRepeatableJob()` based on entity type.
   - Returns count of recovered schedules.
   - Logs each recovery with tenant context: `{ event: "schedule_recovered", tenantId, scheduleId, entityType, cronExpression }`.
   - Uses direct DB query filtering by `tenant_id` explicitly (not `dbScoped`).

4. Call recovery on startup:
   - **API server** (`apps/api/src/server.ts`): Add `recoverSchedules()` call in `buildApiServer()` after DB health check. Only runs when `isBullmqConfigured()`.
   - **Worker** (`apps/worker/src/cli.ts`): Add `recoverSchedules()` call in worker startup sequence, before worker registration.
   - Export from `apps/worker/src/index.ts` for cross-package access.

5. Idempotent registration guarantee:
   - BullMQ's `repeat.key` ensures that re-registering the same schedule ID is idempotent — it updates the existing repeatable job rather than creating a duplicate.
   - The recovery function calls `registerScheduleRepeatableJob()` for every active schedule; BullMQ handles deduplication via the key.

**Testing:** Integration test: create insight → verify schedule record created and job registered; update schedule → verify old job removed and new one registered; delete insight → verify job removed. Startup recovery test: register schedules → simulate restart → verify all re-registered. Report schedule route test: create report schedule via Fastify → verify DB record and job registered. Service layer tests: verify `createSchedule` calls repository and BullMQ correctly via `forTest()` injection.

---

### Task 2.4: Schedule Tick Processing in Worker

**Original:** 2.2.3
**Files:**

- `apps/worker/src/queues/schedule-tick-insight.ts` (NEW)
- `apps/worker/src/queues/queue-names.ts` (MODIFY — add `INSIGHT_SCHEDULE_QUEUE`)
- `apps/worker/src/queues/report-queues.ts` (MODIFY — register insight schedule worker)

**Implementation:**

1. Add `INSIGHT_SCHEDULE_QUEUE` to `queue-names.ts`:

   ```typescript
   export const INSIGHT_SCHEDULE_QUEUE = "insight-schedule";
   ```

2. Create `apps/worker/src/queues/schedule-tick-insight.ts`:
   - `createInsightScheduleProcessor(executionQueue: Queue)` — returns a processor function for insight schedule ticks.
   - On tick: calls `enqueueScheduledInsightExecution()` from existing `insight-schedule-enqueue.ts`.
   - Records execution audit entry: inserts into `schedule_executions` with status `pending`, `scheduled_at = now()`, `entity_type = 'insight'`.
   - Structured logging: `{ event: "insight_schedule_tick", tenantId, insightId, scheduleId }`.

3. Register insight schedule worker in `registerReportWorkers()` (`report-queues.ts`):
   - Create `createInsightScheduleQueue(connection)` in `report-queues.ts`.
   - Add `insightSchedule` worker to `registerReportWorkers()`:
     - Queue: `INSIGHT_SCHEDULE_QUEUE`
     - Processor: `createInsightScheduleProcessor(insightExecutionQueue)`
     - Concurrency: 1 (sequential to avoid thundering herd)
     - Default job options: `{ attempts: 3, backoff: { type: "exponential", delay: 2000 } }`
   - Add to `RegisteredReportWorkers` interface and return object.
   - Add to `refreshBullmqQueueDepthMetrics()` queue list.
   - Add to `close()` cleanup.

4. Update `registerInsightScheduleRepeatableJob()` to use `INSIGHT_SCHEDULE_QUEUE`:
   - Repeatable jobs register to `INSIGHT_SCHEDULE_QUEUE`, which then enqueues to `INSIGHT_EXECUTION_QUEUE`.
   - This two-hop pattern matches the report architecture and enables: (a) schedule tick audit logging, (b) rate limiting at the schedule layer, (c) dead-letter handling for failed ticks.

5. Error handling:
   - Failed schedule ticks retry 3 times with exponential backoff.
   - After max retries: update `schedule_executions` status to `failed`, log error.
   - Dead-letter: BullMQ's `removeOnFail: 5000` retains failed jobs for inspection.

**Testing:** Integration test: register schedule → wait for tick → verify execution job enqueued → verify audit entry created. Error handling test: simulate DB failure → verify retry → verify final failure state.

---

### Task 2.5: Unified tRPC Schedule Management API + Conflict Detection

**Original:** 2.2.4
**Files:**

- `apps/api/src/trpc/routers/schedules.ts` (NEW — unified schedule router)
- `apps/api/src/trpc/root.ts` (MODIFY — register new router)
- `apps/api/src/trpc/routers/insights.ts` (MODIFY — delegate to schedules router)

**Implementation:**

1. Create unified tRPC router with procedures, delegating all business logic to `ScheduleService`:
   - `schedules.list` — Call `scheduleService.listSchedules(tenantId, entityType?)`. Returns schedule summary with entity name, cron expression, timezone, next run time, active status.
   - `schedules.nextRun` — Call `scheduleService.computeNextRun(tenantId, scheduleId)`. Uses `cron-parser` with the schedule's timezone to compute `nextRun`.
   - `schedules.history` — Call `scheduleService.getExecutionHistory(tenantId, scheduleId, options)`. Queries `schedule_executions` via repository. Paginated.
   - `schedules.toggle` — Call `scheduleService.toggleSchedule(tenantId, scheduleId)`. Flips `enabled` flag and registers/removes BullMQ job accordingly.
   - `schedules.validate` — Call `scheduleService.validateSchedule(tenantId, scheduleData)`. Returns computed cron expression and next 3 run times.
   - `schedules.conflict` — Call `scheduleService.checkConflicts(tenantId, entityType, cronExpression, excludeScheduleId?)`. Returns conflict info if another active schedule for the same tenant and entity type has the same cron expression.

2. Router structure follows existing tRPC patterns:
   - Instantiate `ScheduleService` (default constructor uses `SchedulesRepository` internally)
   - All procedures extract `tenantId` from authenticated context
   - Input validation with Zod schemas
   - Error handling: service methods throw on not-found, router catches and maps to `TRPCError`

3. Schedule conflict detection (implemented in service layer):
   - `ScheduleService.checkConflicts()` delegates to `SchedulesRepository.findConflicts()` which queries `schedules` table with tenant-scoped filtering.
   - Returns conflict info if found; used by `validate` procedure and optionally by `toggle`.
   - Replaces both the in-memory `findEnabledScheduleConflict()` in `schedule-store.ts` and the missing insight conflict detection.

4. All procedures are tenant-scoped via context extraction — the service layer enforces tenant isolation through `SchedulesRepository` methods.

5. Register router in `apps/api/src/trpc/root.ts`:
   - Add `schedules: schedulesRouter` to `appRouter`.

6. Update insight router to delegate schedule operations:
   - Insight CRUD still creates/updates/deletes schedule records via `ScheduleService`, but schedule-specific queries (list, history, nextRun) delegate to `schedules.list`, `schedules.history`, `schedules.nextRun` with `entityType: 'insight'`.

**Testing:** Integration tests for all 6 procedures; verify tenant isolation; verify conflict detection; verify timezone-aware nextRun computation; verify entity-type filtering; verify service delegation via `forTest()` injection.

---

### Task 2.6: Schedule Status UI + Frontend Service

**Original:** 2.2.5
**Files:**

- `apps/frontend/src/features/schedules/services/schedule-service.ts` (NEW — frontend service module)
- `apps/frontend/src/features/shared/ui/ScheduleStatusBadge.tsx` (NEW)
- `apps/frontend/src/features/insights/pages/InsightListPage.tsx` (MODIFY)
- `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx` (MODIFY)
- `apps/frontend/src/features/reports/pages/ReportListPage.tsx` (MODIFY)

**Implementation:**

1. Create `apps/frontend/src/features/schedules/services/schedule-service.ts` following the `TemplateService` pattern:
   - Class-based `ScheduleService` with singleton export `scheduleService`
   - Imports `trpcClient` from `@/lib/api/trpc-client`
   - Methods (all delegate to tRPC procedures imperatively):
     - `async listSchedules(entityType?)` → `trpcClient.schedules.list.query({ entityType })`
     - `async getSchedule(scheduleId)` → `trpcClient.schedules.detail.query({ scheduleId })` (add if not in Task 2.5)
     - `async getNextRun(scheduleId)` → `trpcClient.schedules.nextRun.query({ scheduleId })`
     - `async getHistory(scheduleId, options?)` → `trpcClient.schedules.history.query({ scheduleId, ...options })`
     - `async toggleSchedule(scheduleId)` → `trpcClient.schedules.toggle.mutate({ scheduleId })`
     - `async validateSchedule(scheduleData)` → `trpcClient.schedules.validate.mutate(scheduleData)`
     - `async checkConflicts(entityType, cronExpression, excludeScheduleId?)` → `trpcClient.schedules.conflict.mutate({ entityType, cronExpression, excludeScheduleId })`
   - Utility methods (data transformation, derived computations):
     - `formatNextRun(schedule)` — returns human-readable next run string with timezone (e.g. "Tomorrow at 9:00 AM CST")
     - `getScheduleStatus(schedule)` — returns status enum: 'active' | 'disabled' | 'overdue' | 'none'
     - `isOverdue(schedule)` — checks if `nextRunAt` has passed by >1 hour without a completed execution
     - `formatCronHumanReadable(cronExpression)` — returns human-readable description (e.g. "Every Monday at 9:00 AM")
   - Singleton export: `export const scheduleService = new ScheduleService()`

2. Create shared `ScheduleStatusBadge.tsx` component (can be used by both insights and reports):
   - Props: `schedule` (ScheduleRecord | null), `entityType` ('report' | 'insight')
   - Uses `scheduleService.getScheduleStatus()` and `scheduleService.formatNextRun()` for display logic
   - Shows:
     - "Scheduled" (green) with next run time tooltip — when schedule is enabled
     - "Manual only" (gray) — when schedule is disabled or doesn't exist
     - "Overdue" (red) — when `next_run_at` has passed by >1 hour without a completed execution
   - Clicking the badge opens a mini-menu with "View Schedule" and "Toggle Schedule" actions (calls `scheduleService.toggleSchedule()`)

3. Integrate into insight pages:
   - `InsightListPage.tsx` — Show badge on each insight card, using `scheduleService` to fetch schedule status
   - `InsightDetailPage.tsx` Overview tab — Show schedule details (cron expression, timezone, next run, toggle), using `scheduleService` for data fetching and actions

4. Integrate into report pages:
   - `ReportListPage.tsx` — Show badge on each report card (if report has schedule), using `scheduleService`

5. Timezone display: show the configured timezone abbreviation next to the time (e.g. "9:00 AM CST"), computed via `scheduleService.formatNextRun()`.

**Testing:** Component tests for all badge states; integration with list and detail pages; timezone display correctness; frontend service unit tests for utility methods.

---

### Task 2.7: Migrate Existing Report Schedules from In-Memory to DB

**Original:** New (identified during analysis)
**Files:**

- `packages/database/src/seeds/schedules-seed.ts` (NEW — migration seed script)
- `apps/api/src/services/schedule-store.ts` (MODIFY — mark as deprecated)

**Implementation:**

1. Create seed script to migrate existing in-memory report schedules to the `schedules` table:
   - Since `schedule-store.ts` is in-memory, there are no persistent schedules to migrate in production.
   - However, if any test fixtures or development data exist, create a seed script that:
     - Reads existing report schedule configurations (if any)
     - Inserts them into the `schedules` table with `entity_type: 'report'`
     - Converts any frequency/time configs to cron expressions using `frequencyToCron()`

2. Update `schedule-store.ts`:
   - Add `@deprecated` JSDoc comments to all exports.
   - Add runtime warnings when functions are called.
   - Keep the file functional for backward compatibility with Fastify routes during transition.

3. Update Fastify report schedule routes:
   - Add deprecation notice to route schemas.
   - Routes continue to work but log warnings suggesting migration to tRPC.

**Testing:** Verify seed script runs without errors; verify deprecated functions still work but log warnings; verify Fastify routes still functional.

---

## 4. File Change Summary

| File                                                                | Action     | Type                | Notes                                                                            |
| ------------------------------------------------------------------- | ---------- | ------------------- | -------------------------------------------------------------------------------- |
| `packages/database/src/schema/schedules.ts`                         | **Create** | DB schema           | Unified schedule table with entity_type polymorphism                             |
| `packages/database/src/schema/schedule-executions.ts`               | **Create** | DB schema           | Unified execution audit trail table                                              |
| `packages/database/src/schema/index.ts`                             | **Modify** | DB schema           | Export new tables                                                                |
| `packages/database/src/repositories/schedules.repository.ts`        | **Create** | Repository          | Data access layer, class-based with `forTest()` injection, tenant-scoped queries |
| `packages/types/src/schedule.ts`                                    | **Create** | Types               | Unified ScheduleRecord, ScheduleExecutionRecord, ScheduleEntityType              |
| `packages/types/src/insight.ts`                                     | **Modify** | Types               | Deprecate old InsightSchedule, reference new types                               |
| `apps/api/src/services/schedule-bullmq.ts`                          | **Create** | Shared utilities    | Generic register/unregister + cron parsing + frequency conversion                |
| `apps/api/src/services/schedule.service.ts`                         | **Create** | Service             | Business logic layer, depends on `SchedulesRepository`, `forTest()` injection    |
| `apps/api/src/services/report-bullmq.ts`                            | **Modify** | Job registration    | Refactor to use shared utilities                                                 |
| `apps/api/src/services/schedule-store.ts`                           | **Modify** | Cron validation     | Deprecate in-memory store, replace with service layer                            |
| `apps/api/src/trpc/routers/schedules.ts`                            | **Create** | API router          | Unified schedule management + conflict detection, delegates to `ScheduleService` |
| `apps/api/src/trpc/routers/insights.ts`                             | **Modify** | API router          | Wire schedule registration via `ScheduleService` into CRUD lifecycle             |
| `apps/api/src/trpc/root.ts`                                         | **Modify** | Router registration | Add `schedules` router                                                           |
| `apps/api/src/routes/v1/report-schedules.ts`                        | **Modify** | REST routes         | Use `ScheduleService`, add deprecation notices                                   |
| `apps/worker/src/queues/queue-names.ts`                             | **Modify** | Constants           | Add `INSIGHT_SCHEDULE_QUEUE`                                                     |
| `apps/worker/src/queues/schedule-tick-insight.ts`                   | **Create** | Worker processor    | Schedule tick → execution enqueue                                                |
| `apps/worker/src/queues/schedule-recovery.ts`                       | **Create** | Startup recovery    | Re-register all active schedules on boot                                         |
| `apps/worker/src/queues/report-queues.ts`                           | **Modify** | Worker registration | Add insight schedule worker + queue factory                                      |
| `apps/worker/src/index.ts`                                          | **Modify** | Exports             | Export recovery function                                                         |
| `apps/api/src/server.ts`                                            | **Modify** | Startup             | Call schedule recovery on boot                                                   |
| `apps/worker/src/cli.ts`                                            | **Modify** | Startup             | Call schedule recovery on boot                                                   |
| `apps/frontend/src/features/schedules/services/schedule-service.ts` | **Create** | Frontend service    | Singleton service class mirroring `TemplateService` pattern                      |
| `apps/frontend/src/features/shared/ui/ScheduleStatusBadge.tsx`      | **Create** | UI component        | Shared schedule status badge, uses `scheduleService`                             |
| `apps/frontend/src/features/insights/pages/InsightListPage.tsx`     | **Modify** | UI                  | Show badge via `scheduleService`                                                 |
| `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx`   | **Modify** | UI                  | Show schedule status via `scheduleService`                                       |
| `apps/frontend/src/features/reports/pages/ReportListPage.tsx`       | **Modify** | UI                  | Show badge via `scheduleService` (if report has schedule)                        |
| `packages/database/src/seeds/schedules-seed.ts`                     | **Create** | Seed script         | Migration seed for existing schedules                                            |

**Eliminated duplication vs. original plan:**

- ~~`apps/api/src/services/insight-schedule-bullmq.ts`~~ → merged into shared `schedule-bullmq.ts`
- ~~`packages/database/src/schema/insight-schedules.ts`~~ → unified `schedules` table with entity_type polymorphism
- ~~`apps/api/src/trpc/routers/insight-schedules.ts`~~ → unified `schedules` router with entity-type filtering
- ~~`apps/api/src/services/schedule-store.ts`~~ → deprecated in favor of `SchedulesRepository` + `ScheduleService`
- ~~`packages/database/src/schema/schedules.ts` query helpers~~ → moved to `SchedulesRepository` class

**Architecture alignment with existing patterns:**

- `SchedulesRepository` mirrors `InsightTemplatesRepository` — class-based, `createDatabaseClient` instance, `forTest()` injection, tenant-scoped queries
- `ScheduleService` mirrors `InsightTemplatesService` — class-based, depends on repository, `forTest()` injection, encapsulates business logic
- `scheduleService` (frontend) mirrors `templateService` — singleton class, delegates to tRPC, utility methods for data transformation

---

## 5. Testing Requirements

| Test Type   | Scope                                                                                        | Coverage Target |
| ----------- | -------------------------------------------------------------------------------------------- | --------------- |
| Unit        | Cron parsing (cron-parser)                                                                   | 100%            |
| Unit        | Frequency-to-cron conversion (all 4 frequencies)                                             | 100%            |
| Unit        | Timezone-aware nextRun computation                                                           | 90%+            |
| Unit        | Schedule toggle logic                                                                        | 90%+            |
| Unit        | Conflict detection (both entity types)                                                       | 90%+            |
| Unit        | `SchedulesRepository` methods with `forTest()` injection                                     | 90%+            |
| Unit        | `ScheduleService` business logic with mocked repository                                      | 90%+            |
| Unit        | `scheduleService` frontend utility methods                                                   | 80%+            |
| Integration | tRPC procedures (list, nextRun, history, toggle, validate, conflict)                         | 85%+            |
| Integration | BullMQ job registration/removal (both entity types)                                          | 85%+            |
| Integration | Worker schedule tick → execution enqueue → audit entry                                       | 80%+            |
| Integration | Startup recovery (re-register all active schedules)                                          | 85%+            |
| Integration | RLS policy enforcement (schedules + executions tables)                                       | 100%            |
| Integration | Report schedules still work after shared utility refactor                                    | 85%+            |
| Integration | Fastify report schedule routes (backward compatibility)                                      | 80%+            |
| Component   | ScheduleStatusBadge (all states + timezone display)                                          | 80%+            |
| E2E         | Create insight with schedule → verify job registered → verify execution → verify audit entry | Full flow       |
| E2E         | Create report schedule via Fastify → verify DB record → verify job registered                | Full flow       |

---

## 6. Success Criteria

- [ ] `schedules` table created with RLS policies and entity_type polymorphism
- [ ] `schedule_executions` table created with RLS policies
- [ ] `SchedulesRepository` class created with `forTest()` injection, tenant-scoped queries, matching `InsightTemplatesRepository` pattern
- [ ] `ScheduleService` class created with `forTest()` injection, depends on `SchedulesRepository`, matching `InsightTemplatesService` pattern
- [ ] `ScheduleRecord` type includes `timezone` field (default "UTC")
- [ ] `cron-parser` replaces naive regex validation (benefits both reports and insights)
- [ ] Shared `schedule-bullmq.ts` utilities used by both report and insight scheduling
- [ ] `ScheduleService` encapsulates all BullMQ registration/unregistration logic with graceful degradation
- [ ] Creating an insight with a schedule creates a `schedules` record and registers a BullMQ repeatable job via `ScheduleService`
- [ ] Creating a report schedule creates a `schedules` record and registers a BullMQ repeatable job via `ScheduleService`
- [ ] Updating/deleting an entity updates/removes the corresponding schedule record and job via `ScheduleService`
- [ ] `INSIGHT_SCHEDULE_QUEUE` worker processes schedule ticks and enqueues execution jobs
- [ ] Execution audit entries created for each schedule tick (both entity types)
- [ ] Unified tRPC `schedules` router delegates to `ScheduleService` and returns correct data with timezone-aware nextRun
- [ ] Schedule conflict detection prevents duplicate cron expressions per tenant per entity type
- [ ] `scheduleService` frontend singleton mirrors `templateService` pattern with tRPC delegation and utility methods
- [ ] Schedule status badge shows on list and detail pages (both insights and reports) via `scheduleService`
- [ ] Schedules survive server restart (re-registered from DB on startup)
- [ ] Fastify report schedule routes remain functional (backward compatibility)
- [ ] `schedule-store.ts` marked as deprecated with runtime warnings
- [ ] All tests pass, including report schedule regression tests

---

## 7. Dependencies on Other Plans

| Plan                          | Relationship | Notes                                                                       |
| ----------------------------- | ------------ | --------------------------------------------------------------------------- |
| plan-01-insight-templates     | None         | Independent; templates define `defaultSchedule` but scheduler is separate   |
| plan-03-sorting               | None         | Fully independent                                                           |
| plan-06-detail-page-polish    | Provides     | Detail plan 2.5.2 (schedule status in Overview) uses this plan's components |
| plan-05-delivery-enhancements | None         | Scheduler triggers execution; delivery handles output                       |

---

## 8. Deployment Considerations

| Deployment           | Consideration                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloud (Hosted)       | BullMQ + Redis assumed; plan aligns directly                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Self-Hosted (Docker) | Worker and API must be containerized; Redis must be available                                                                                                                                                                                                                                                                                                                                                                                                     |
| Desktop (Electron)   | BullMQ requires Redis which is unavailable in Electron. **Scoped separately**: when desktop support is added, create an abstraction layer `ScheduleBackend` with two implementations: `BullmqScheduleBackend` (cloud/Docker) and `NodeCronScheduleBackend` (Electron). The entity lifecycle code calls `ScheduleBackend.register/unregister` without knowing the implementation. Do NOT implement the Electron fallback in this plan — it is out of scope for P0. |
| Web                  | Requires backend services; no client-side scheduling                                                                                                                                                                                                                                                                                                                                                                                                              |

---

## 9. Risk Mitigation

| Risk                             | Mitigation                                                                                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schedule data loss on restart    | **Critical** — startup recovery re-registers all active schedules from DB (Task 2.3)                                                                     |
| Cron scheduler drift/missed runs | BullMQ repeatable jobs are server-side; `schedule_executions` table tracks actual vs. scheduled times for missed-run detection                           |
| Duplicate job registration       | BullMQ `repeat.key` ensures idempotent registration; recovery function is safe to call multiple times                                                    |
| Tenant isolation breach          | All queries use `SchedulesRepository` with explicit tenant filtering; RLS policies enforced at DB level for both `schedules` and `schedule_executions`   |
| Schema changes mid-development   | Use `make db:reset` to drop and recreate — no migration rollback needed                                                                                  |
| Redis/BullMQ unavailable         | Graceful degradation: `isBullmqConfigured()` check before every queue operation; entity CRUD succeeds even if job registration fails (logged as warning) |
| Thundering herd on schedule tick | `INSIGHT_SCHEDULE_QUEUE` worker concurrency = 1; exponential backoff on failures                                                                         |
| Timezone misconfiguration        | `cron-parser` validates timezone strings; invalid timezone falls back to UTC with warning log                                                            |
| Backward compatibility break     | Fastify routes remain functional during transition; `schedule-store.ts` deprecated but not removed                                                       |

---

## 10. Gap Analysis Resolution

The following gaps were identified in the original plan and addressed:

| Gap                               | Resolution                                                                                                                                                                                                      |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Timezone handling**             | Added `timezone` field to `ScheduleRecord` (Task 2.1); `cron-parser` handles timezone-aware nextRun computation (Task 2.5)                                                                                      |
| **Schedule conflict detection**   | `findEnabledScheduleConflict()` queries `schedules` table directly with entity_type filtering (Task 2.5)                                                                                                        |
| **Rate limiting / backpressure**  | `INSIGHT_SCHEDULE_QUEUE` worker concurrency = 1; exponential backoff; BullMQ `attempts: 3` (Task 2.4)                                                                                                           |
| **Audit trail**                   | `schedule_executions` table tracks scheduled_at, started_at, completed_at, status, error_message for both entity types (Task 2.1)                                                                               |
| **Startup recovery**              | `recoverSchedules()` called on both API and worker startup (Task 2.3)                                                                                                                                           |
| **Cron parsing library**          | `cron-parser` replaces naive regex, benefits both report and insight scheduling (Task 2.2)                                                                                                                      |
| **Desktop fallback scope**        | Deferred to a separate abstraction layer; out of scope for P0 (Section 8)                                                                                                                                       |
| **Code duplication**              | Shared `schedule-bullmq.ts` utilities; unified `schedules` table with entity_type polymorphism; unified tRPC `schedules` router; service/repository pattern eliminates ad-hoc data access (Section 1, Task 2.2) |
| **In-memory report schedules**    | Migrated to DB-backed `schedules` table via `SchedulesRepository`; `schedule-store.ts` deprecated (Task 2.7)                                                                                                    |
| **Divergent API layers**          | Unified tRPC `schedules` router delegates to `ScheduleService`; Fastify routes kept for backward compatibility with deprecation notices (Task 2.5, 2.7)                                                         |
| **One-hop vs two-hop scheduling** | Both entities now use two-hop: `{ENTITY}_SCHEDULE_QUEUE` → `{ENTITY}_EXECUTION_QUEUE` (Task 2.4)                                                                                                                |

---

## 11. Future Extensibility

The unified architecture supports adding new schedulable entities with minimal effort:

1. **Add new entity type**: Add to `ScheduleEntityType` enum ('report' | 'insight' | 'alert' | ...)
2. **Create entity-specific queue**: Add `{ENTITY}_SCHEDULE_QUEUE` and `{ENTITY}_EXECUTION_QUEUE` to `queue-names.ts`
3. **Create tick processor**: Follow the pattern in `schedule-tick-insight.ts`
4. **Register worker**: Add to `registerReportWorkers()` in `report-queues.ts`
5. **Wire into lifecycle**: Add schedule registration to entity CRUD operations

No changes to the `schedules` table, `schedule_executions` table, or shared BullMQ utilities are needed for new entity types.
