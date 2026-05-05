## ADDED Requirements

### Requirement: Execution Status Tracking
The system SHALL track and display the real-time execution status of insights (idle, running, completed, failed).

#### Scenario: Running status display
- **WHEN** an insight is executing (generating a report)
- **THEN** insight card displays a spinner indicator and status badge showing "Running"

#### Scenario: Run Now button disabled during execution
- **WHEN** insight status is "running"
- **THEN** the "Run Now" button is disabled to prevent duplicate executions

#### Scenario: Last run timestamp display
- **WHEN** an insight has been executed at least once
- **THEN** the insight card displays the last run timestamp in user's locale format

#### Scenario: Never run state
- **WHEN** an insight has never been executed
- **THEN** the insight card displays "Never run" instead of a timestamp

#### Scenario: Last run status indicator
- **WHEN** an insight has completed execution
- **THEN** the insight card displays whether the last run was successful or failed

#### Scenario: Status polling during execution
- **WHEN** insight status is "running"
- **THEN** system polls the API every 5 seconds to update status

#### Scenario: Polling stops after completion
- **WHEN** insight status changes from "running" to "completed" or "failed"
- **THEN** system stops polling and displays final status
