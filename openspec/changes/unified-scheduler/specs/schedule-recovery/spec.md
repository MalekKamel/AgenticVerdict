## ADDED Requirements

### Requirement: Startup Schedule Recovery
The system SHALL re-register all active (enabled = true) schedules as BullMQ repeatable jobs on API server boot and worker startup. This ensures schedules survive server restarts.

#### Scenario: Recovery on API server boot
- **WHEN** the API server starts
- **THEN** the system queries all enabled schedules from the database and registers each as a BullMQ repeatable job

#### Scenario: Recovery on worker boot
- **WHEN** the worker process starts
- **THEN** the system queries all enabled schedules from the database and registers each as a BullMQ repeatable job

#### Scenario: Recovery logs per schedule
- **WHEN** a schedule is recovered during startup
- **THEN** the system logs `{ event: "schedule_recovered", tenantId, scheduleId, entityType, cronExpression }`

### Requirement: Idempotent Job Registration
The system SHALL ensure that re-registering the same schedule is idempotent. BullMQ's `repeat.key` mechanism SHALL prevent duplicate job creation when recovery runs multiple times.

#### Scenario: Duplicate registration is safe
- **WHEN** the same schedule is registered twice (e.g., API and worker both recover)
- **THEN** BullMQ updates the existing repeatable job rather than creating a duplicate

#### Scenario: Recovery returns count of recovered schedules
- **WHEN** startup recovery completes
- **THEN** the system returns the count of schedules that were re-registered

### Requirement: Recovery Skips Disabled Schedules
The system SHALL only recover schedules where `enabled = true`. Disabled schedules SHALL NOT be registered as BullMQ jobs during recovery.

#### Scenario: Disabled schedules excluded from recovery
- **WHEN** startup recovery runs and a schedule has `enabled = false`
- **THEN** the system skips that schedule and does not register a BullMQ job

### Requirement: Recovery Handles BullMQ Unavailability Gracefully
The system SHALL handle BullMQ/Redis unavailability during recovery gracefully. If Redis is not configured, recovery SHALL log a warning and skip job registration without failing the startup process.

#### Scenario: Recovery when Redis is unavailable
- **WHEN** startup recovery runs but Redis is not configured
- **THEN** the system logs a warning and continues startup without registering jobs
