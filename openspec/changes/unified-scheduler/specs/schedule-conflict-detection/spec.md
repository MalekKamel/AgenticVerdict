## ADDED Requirements

### Requirement: Schedule Conflict Detection
The system SHALL detect scheduling conflicts where two active schedules for the same tenant and entity type have identical cron expressions. A conflict SHALL be reported when creating or updating a schedule.

#### Scenario: Conflict detected on create
- **WHEN** a user creates a schedule with a cron expression that matches an existing active schedule for the same tenant and entity type
- **THEN** the system returns conflict information including the conflicting schedule ID and cron expression

#### Scenario: Conflict detected on update
- **WHEN** a user updates a schedule's cron expression to match another active schedule for the same tenant and entity type
- **THEN** the system returns conflict information excluding the schedule being updated

#### Scenario: No conflict for different entity types
- **WHEN** a user creates an insight schedule with the same cron expression as an existing report schedule
- **THEN** the system does NOT report a conflict (different entity types are allowed to share cron expressions)

#### Scenario: No conflict for different tenants
- **WHEN** a user in tenant A creates a schedule with the same cron expression as a schedule in tenant B
- **THEN** the system does NOT report a conflict (tenant isolation prevents cross-tenant conflicts)

#### Scenario: No conflict with self on update
- **WHEN** a user updates a schedule without changing the cron expression
- **THEN** the system does NOT report a conflict with the schedule itself

### Requirement: Conflict Check Endpoint
The system SHALL provide a tRPC procedure `schedules.conflict` that accepts entity type, cron expression, and optional exclude schedule ID, returning conflict information if a matching active schedule exists.

#### Scenario: Check conflict before creating
- **WHEN** a user calls `schedules.conflict` with `entityType`, `cronExpression`, and no exclude ID
- **THEN** the system returns conflict info if a matching active schedule exists, or null if no conflict

#### Scenario: Check conflict excluding a schedule
- **WHEN** a user calls `schedules.conflict` with `entityType`, `cronExpression`, and an exclude schedule ID
- **THEN** the system returns conflict info excluding the specified schedule

### Requirement: Database-Query-Based Conflict Detection
The system SHALL perform conflict detection via database query on the `schedules` table, filtering by tenant ID, entity type, cron expression, and enabled status. This replaces the in-memory `findEnabledScheduleConflict()` function.

#### Scenario: Conflict query uses tenant isolation
- **WHEN** the system queries for conflicts
- **THEN** the query filters by `tenant_id` to ensure tenant-scoped results only

#### Scenario: Conflict query checks enabled status
- **WHEN** the system queries for conflicts
- **THEN** the query only considers schedules where `enabled = true`
