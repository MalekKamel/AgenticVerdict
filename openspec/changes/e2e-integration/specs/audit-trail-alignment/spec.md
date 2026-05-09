## ADDED Requirements

### Requirement: Shared audit event type enum
The system SHALL define a shared `AuditEventType` enum in `packages/types/src/audit-event-types.ts` that is used by both the backend and frontend. The enum SHALL include the following values: `run`, `config_change`, `delivery`, `error`, `created`, `updated`, `deleted`.

#### Scenario: Backend uses shared enum
- **WHEN** the backend creates an audit trail event
- **THEN** it uses a value from the shared `AuditEventType` enum

#### Scenario: Frontend uses shared enum
- **WHEN** the frontend filters audit trail events
- **THEN** it uses the same `AuditEventType` enum values

### Requirement: Backend event type mapping
The backend SHALL map existing event types (`created`, `updated`, `deleted`, `ai_generated`) to the shared enum. New events SHALL use the appropriate shared enum values: `run` for insight executions, `config_change` for insight edits, `delivery` for report deliveries, and `error` for failures.

#### Scenario: Insight run event
- **WHEN** an insight is executed via `insight.run`
- **THEN** an audit event with type `run` is created

#### Scenario: Insight config change event
- **WHEN** an insight's configuration is modified
- **THEN** an audit event with type `config_change` is created

### Requirement: Frontend event type alignment
The `AuditTrailTimeline` component SHALL use the shared `AuditEventType` enum for filtering and display. The component SHALL correctly display all event types without showing "No events found" for valid events.

#### Scenario: All event types displayed
- **WHEN** the audit trail contains events of type `run`, `config_change`, `delivery`, and `error`
- **THEN** all events are displayed correctly in the timeline

#### Scenario: Event type filter works
- **WHEN** the user filters the timeline by event type
- **THEN** only events matching the selected type are shown

### Requirement: Audit trail seed data
The development seed SHALL populate the `audit_trail` table with realistic events for each tenant. The seed function SHALL use the correct column names matching the `audit_trail` schema.

#### Scenario: Audit trail seeded
- **WHEN** `seed-dev.ts` is executed
- **THEN** each tenant has audit trail events covering all event types
