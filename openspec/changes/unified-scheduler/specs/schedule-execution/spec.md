## ADDED Requirements

### Requirement: Two-Hop Schedule Processing
The system SHALL process schedules using a two-hop queue pattern: `{ENTITY}_SCHEDULE_QUEUE` fires on cron tick, then enqueues a job to `{ENTITY}_EXECUTION_QUEUE`. This applies to both 'report' and 'insight' entity types.

#### Scenario: Insight schedule tick triggers execution
- **WHEN** the `INSIGHT_SCHEDULE_QUEUE` fires a tick for an insight schedule
- **THEN** the system enqueues a job to `INSIGHT_EXECUTION_QUEUE` and records a `pending` execution audit entry

#### Scenario: Report schedule tick triggers execution
- **WHEN** the `REPORT_SCHEDULE_QUEUE` fires a tick for a report schedule
- **THEN** the system enqueues a job to `REPORT_GENERATION_QUEUE` and records a `pending` execution audit entry

### Requirement: Execution Audit Trail
The system SHALL record an entry in the `schedule_executions` table for every schedule tick. The entry SHALL include: schedule ID, tenant ID, entity type, entity ID, scheduled time, start time, completion time, status, and error message if failed.

#### Scenario: Record pending execution on tick
- **WHEN** a schedule tick fires
- **THEN** the system inserts a `schedule_executions` record with `status: 'pending'` and `scheduled_at: now()`

#### Scenario: Update execution status on completion
- **WHEN** an execution job completes successfully
- **THEN** the system updates the execution record with `status: 'completed'`, `completed_at: now()`, and clears any error message

#### Scenario: Update execution status on failure
- **WHEN** an execution job fails after max retries
- **THEN** the system updates the execution record with `status: 'failed'`, `completed_at: now()`, and the error message

### Requirement: Retry and Backoff for Failed Ticks
The system SHALL retry failed schedule ticks up to 3 times with exponential backoff (initial delay: 2 seconds). After max retries, the execution SHALL be marked as failed and the error logged.

#### Scenario: Retry on transient failure
- **WHEN** a schedule tick fails due to a transient error (e.g., DB connection timeout)
- **THEN** the system retries with exponential backoff up to 3 times

#### Scenario: Mark as failed after max retries
- **WHEN** a schedule tick fails 3 consecutive times
- **THEN** the system marks the execution as failed and logs the error

### Requirement: Sequential Schedule Tick Processing
The system SHALL process insight schedule ticks sequentially (concurrency = 1) to prevent thundering herd on schedule firing. Report schedule ticks SHALL follow the same sequential pattern.

#### Scenario: Sequential processing prevents concurrent ticks
- **WHEN** multiple insight schedules fire at the same time
- **THEN** the system processes them one at a time in queue order

### Requirement: Dead-Letter Retention for Failed Jobs
The system SHALL retain failed schedule tick jobs in BullMQ for inspection (up to 5000 failed jobs). This enables post-mortem analysis of scheduling failures.

#### Scenario: Failed jobs retained for inspection
- **WHEN** a schedule tick job fails after max retries
- **THEN** the job is retained in BullMQ's failed jobs list (up to 5000 entries)
