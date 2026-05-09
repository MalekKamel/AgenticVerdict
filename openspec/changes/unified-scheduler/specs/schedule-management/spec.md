## ADDED Requirements

### Requirement: Schedule CRUD Operations
The system SHALL provide CRUD operations for schedules through a unified tRPC router, supporting polymorphic entity types ('report' | 'insight'). Each schedule SHALL be scoped to a tenant and include: cron expression, IANA timezone (default 'UTC'), enabled status, entity type, and entity ID.

#### Scenario: Create a schedule for an insight
- **WHEN** a user creates a schedule with `entityType: 'insight'`, `entityId`, `cronExpression`, and `timezone`
- **THEN** the system creates a schedule record in the `schedules` table, computes `nextRunAt` using cron-parser, and registers a BullMQ repeatable job if enabled

#### Scenario: Create a schedule for a report
- **WHEN** a user creates a schedule with `entityType: 'report'`, `entityId`, `cronExpression`, and `timezone`
- **THEN** the system creates a schedule record in the `schedules` table, computes `nextRunAt` using cron-parser, and registers a BullMQ repeatable job if enabled

#### Scenario: Update a schedule
- **WHEN** a user updates a schedule's cron expression or timezone
- **THEN** the system unregisters the old BullMQ job, updates the database record, recomputes `nextRunAt`, and registers a new BullMQ job if enabled

#### Scenario: Delete a schedule
- **WHEN** a user deletes a schedule
- **THEN** the system unregisters the BullMQ job and removes the schedule record from the database

#### Scenario: Toggle a schedule
- **WHEN** a user toggles a schedule's enabled status
- **THEN** the system flips the `enabled` flag and registers or unregisters the BullMQ job accordingly

### Requirement: Cron Expression Validation
The system SHALL validate cron expressions using the `cron-parser` library. Invalid cron expressions SHALL be rejected with a descriptive error message. The system SHALL support both raw cron strings and frequency/time conversion (daily, weekly, monthly, quarterly).

#### Scenario: Valid cron expression accepted
- **WHEN** a user provides a valid cron expression like `0 9 * * 1`
- **THEN** the system accepts the expression and computes the next run time

#### Scenario: Invalid cron expression rejected
- **WHEN** a user provides an invalid cron expression like `99 99 * * *`
- **THEN** the system rejects the request with an error message indicating the expression is invalid

#### Scenario: Frequency/time conversion to cron
- **WHEN** a user provides `frequency: 'weekly'` and `time: 9`
- **THEN** the system converts to cron expression `0 9 * * 1` (Monday at 9:00 AM)

### Requirement: Timezone-Aware Scheduling
The system SHALL support IANA timezone strings for all schedules. The timezone SHALL default to 'UTC' if not specified. The `nextRunAt` computation SHALL use the schedule's timezone. Invalid timezone strings SHALL fall back to UTC with a warning log.

#### Scenario: Schedule with explicit timezone
- **WHEN** a user creates a schedule with `timezone: 'America/New_York'` and cron `0 9 * * *`
- **THEN** the system computes `nextRunAt` as 9:00 AM Eastern Time

#### Scenario: Schedule with default timezone
- **WHEN** a user creates a schedule without specifying a timezone
- **THEN** the system defaults to 'UTC' and computes `nextRunAt` accordingly

#### Scenario: Invalid timezone fallback
- **WHEN** a user provides an invalid timezone like 'Mars/Olympus'
- **THEN** the system falls back to UTC and logs a warning

### Requirement: Schedule Validation Preview
The system SHALL provide a validation endpoint that returns the computed cron expression and the next 3 run times without persisting the schedule. This allows users to preview when their schedule will fire before saving.

#### Scenario: Preview next 3 run times
- **WHEN** a user validates a schedule with cron `0 9 * * 1` and timezone `UTC`
- **THEN** the system returns the cron expression and the next 3 Monday 9:00 AM timestamps

### Requirement: Schedule Listing with Entity Filtering
The system SHALL allow listing all schedules for a tenant, optionally filtered by entity type. Each list item SHALL include the schedule ID, entity type, entity ID, cron expression, timezone, enabled status, and next run time.

#### Scenario: List all schedules for a tenant
- **WHEN** a user requests all schedules for their tenant
- **THEN** the system returns all schedules regardless of entity type

#### Scenario: List only insight schedules
- **WHEN** a user requests schedules with `entityType: 'insight'`
- **THEN** the system returns only schedules where `entity_type = 'insight'`

### Requirement: Execution History Retrieval
The system SHALL provide paginated execution history for any schedule. Each execution record SHALL include: scheduled time, start time, completion time, status (pending/running/completed/failed/skipped), and error message if applicable.

#### Scenario: Retrieve execution history for a schedule
- **WHEN** a user requests execution history for a schedule with pagination
- **THEN** the system returns paginated execution records from the `schedule_executions` table
