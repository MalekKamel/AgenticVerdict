## ADDED Requirements

### Requirement: Audit Trail Display
The system SHALL display immutable audit log for insights and reports.

#### Scenario: Timeline view
- **WHEN** user views History tab
- **THEN** system displays chronological timeline of events with timestamps

#### Scenario: Event types
- **WHEN** audit trail is displayed
- **THEN** system shows event type icons and descriptions (created, updated, run, delivered, shared, etc.)

#### Scenario: Actor information
- **WHEN** event has associated actor
- **THEN** system displays actor name/email or "System" for automated events

### Requirement: Audit Event Filtering
The system SHALL allow filtering audit events by type and date range.

#### Scenario: Filter by event type
- **WHEN** user selects event types (create, update, run, deliver, share)
- **THEN** system displays only matching events

#### Scenario: Date range filter
- **WHEN** user selects date range
- **THEN** system displays only events within the range

### Requirement: Run History
The system SHALL display execution history for insights.

#### Scenario: Run list
- **WHEN** insight has been run multiple times
- **THEN** system displays list of runs with start time, duration, status, and report generated

#### Scenario: Run status
- **WHEN** run completed successfully
- **THEN** system displays green checkmark

#### Scenario: Run failure
- **WHEN** run failed
- **THEN** system displays red error indicator with error message

### Requirement: Configuration Changes
The system SHALL display configuration change history.

#### Scenario: Configuration change
- **WHEN** insight configuration was modified
- **THEN** system displays what changed (connectors, metrics, schedule, etc.)

#### Scenario: Before/after comparison
- **WHEN** user clicks on configuration change event
- **THEN** system shows diff of what changed

### Requirement: Delivery Events
The system SHALL display report delivery history.

#### Scenario: Email delivery
- **WHEN** report was delivered via email
- **THEN** system displays recipients, delivery time, and status

#### Scenario: Webhook delivery
- **WHEN** report was delivered via webhook
- **THEN** system displays webhook URL, response status, and time
