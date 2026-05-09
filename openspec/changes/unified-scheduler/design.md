## Context

The AgenticVerdict platform currently handles scheduling for two entity types — reports and insights — with completely divergent patterns:

- **Reports**: In-memory Map storage (`schedule-store.ts`), naive regex cron validation, Fastify REST API, single-hop BullMQ queue (`REPORT_SCHEDULE_QUEUE` → `REPORT_GENERATION_QUEUE`)
- **Insights**: JSONB column on `insights` table, frequency/time config (no cron), embedded in tRPC insight router, direct enqueue to `INSIGHT_EXECUTION_QUEUE` (no schedule queue)

This divergence creates several problems:

1. **Data loss on restart** — report schedules exist only in memory
2. **No timezone support** — neither entity handles IANA timezones
3. **No audit trail** — no record of when schedules fired or failed
4. **No conflict detection for insights** — only reports have in-memory conflict checks
5. **Code duplication** — separate BullMQ registration patterns, separate validation logic

The platform uses PostgreSQL with Row-Level Security (RLS) for multi-tenancy, BullMQ + Redis for job queues, tRPC for the primary API layer, and a Fastify REST API for backward compatibility. The codebase follows a repository/service pattern with `forTest()` dependency injection.

## Goals / Non-Goals

**Goals:**

- Unified database-backed schedule storage with polymorphic entity support (`entity_type`: 'report' | 'insight')
- Cron expression support via `cron-parser` for both entity types, replacing naive regex
- Timezone-aware scheduling with IANA timezone defaults to UTC
- Execution audit trail via `schedule_executions` table
- Shared BullMQ utilities parameterized by queue name and entity type
- Two-hop scheduling pattern for all entities (`{ENTITY}_SCHEDULE_QUEUE` → `{ENTITY}_EXECUTION_QUEUE`)
- Startup recovery that re-registers all active schedules from DB on boot
- Unified tRPC `schedules` router with conflict detection
- Frontend schedule status badge component and service module
- Backward compatibility: Fastify routes remain functional with deprecation notices

**Non-Goals:**

- Desktop (Electron) scheduling fallback — deferred to a separate `ScheduleBackend` abstraction
- Migration of existing in-memory report schedules — they are lost on restart by design; seed script provided for test/dev fixtures
- Changes to insight or report execution logic — only scheduling is affected
- Real-time schedule updates via WebSockets — out of scope for P0

## Decisions

### 1. Polymorphic `schedules` table over separate tables

**Decision**: Single `schedules` table with `entity_type` enum and `entity_id` UUID, rather than separate `report_schedules` and `insight_schedules` tables.

**Rationale**: Enables unified schedule management APIs, shared conflict detection, single audit trail table, and easier extensibility for future entity types. The unique constraint on `(tenant_id, entity_type, entity_id)` ensures referential integrity per entity.

**Alternatives considered**:

- Separate tables: Cleaner FK constraints but duplicates schema and logic for every entity type
- JSONB payload: Flexible but loses queryability for conflict detection and recovery

### 2. `cron-parser` over custom validation

**Decision**: Use `cron-parser` library instead of the existing naive regex in `schedule-store.ts:20-26`.

**Rationale**: Battle-tested library that handles cron expression validation, next-run computation, and timezone conversion. The existing regex only validates format — it cannot compute `nextRun` or handle timezones.

**Alternatives considered**:

- `cronstrue`: Human-readable descriptions only, no next-run computation
- Custom implementation: Error-prone for edge cases (leap years, DST transitions)

### 3. Two-hop scheduling for all entities

**Decision**: Both reports and insights use `{ENTITY}_SCHEDULE_QUEUE` → `{ENTITY}_EXECUTION_QUEUE` pattern.

**Rationale**: Enables schedule tick audit logging, rate limiting at the schedule layer, and dead-letter handling for failed ticks. Reports already use this pattern; insights adopt it for consistency.

**Alternatives considered**:

- Direct enqueue: Simpler but loses audit trail and backpressure control
- Single shared schedule queue: Loses entity-specific rate limiting and error isolation

### 4. Service/repository pattern with `forTest()` injection

**Decision**: `SchedulesRepository` and `ScheduleService` follow the existing `InsightTemplatesRepository`/`InsightTemplatesService` pattern with class-based design and static `forTest()` methods.

**Rationale**: Consistency with existing codebase patterns, enables dependency injection for testing, maintains tenant isolation through repository-level filtering.

### 5. Graceful degradation for BullMQ operations

**Decision**: BullMQ registration failures do not fail entity CRUD operations — they are caught, logged as warnings, and the entity operation proceeds.

**Rationale**: Schedule registration is a side effect; the primary entity (report/insight) should still be created. Startup recovery will re-register jobs on next boot.

### 6. Startup recovery on both API and worker

**Decision**: `recoverSchedules()` is called on both API server boot (`server.ts`) and worker startup (`cli.ts`).

**Rationale**: Either service may restart independently; both need to ensure repeatable jobs are registered. BullMQ's `repeat.key` ensures idempotent registration — calling twice is safe.

## Risks / Trade-offs

| Risk                             | Impact                                               | Mitigation                                                                                                         |
| -------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Schedule data loss on restart    | Critical — automated delivery stops                  | Startup recovery re-registers all active schedules from DB; BullMQ repeatable jobs persist in Redis                |
| Thundering herd on schedule tick | High — concurrent execution overload                 | `INSIGHT_SCHEDULE_QUEUE` worker concurrency = 1; exponential backoff on failures                                   |
| Tenant isolation breach          | Critical — cross-tenant data exposure                | RLS policies on both tables; all repository methods filter by `tenant_id`; no `dbScoped` bypass                    |
| Cron expression incompatibility  | Medium — schedules may not fire as expected          | `cron-parser` validates expressions on creation; `validateSchedule` procedure shows next 3 run times before saving |
| BullMQ/Redis unavailable         | Medium — schedules created but not registered        | `isBullmqConfigured()` check before every queue operation; graceful degradation with warning logs                  |
| Timezone misconfiguration        | Low — schedules fire at wrong time                   | `cron-parser` validates timezone strings; invalid timezone falls back to UTC with warning log                      |
| Backward compatibility break     | Medium — existing report schedule integrations break | Fastify routes remain functional with deprecation notices; `schedule-store.ts` deprecated but not removed          |
