## ADDED Requirements

### Requirement: Toast Notifications for User Actions
The system SHALL display toast notifications for all user-initiated mutations (create, update, delete, run).

#### Scenario: Success toast on insight creation
- **WHEN** user successfully creates a new insight
- **THEN** system displays a success toast with title "Insight created" and auto-dismisses after 5 seconds

#### Scenario: Success toast on insight update
- **WHEN** user successfully updates an insight
- **THEN** system displays a success toast with title "Insight updated" and auto-dismisses after 5 seconds

#### Scenario: Success toast on insight deletion
- **WHEN** user successfully deletes an insight
- **THEN** system displays a success toast with title "Insight deleted" and auto-dismisses after 5 seconds

#### Scenario: Success toast on insight execution
- **WHEN** user successfully starts insight execution (Run Now)
- **THEN** system displays a success toast with title "Insight started" and message "Report generation in progress"

#### Scenario: Error toast on mutation failure
- **WHEN** any mutation (create, update, delete, run) fails
- **THEN** system displays an error toast with translated error message from canonical error system

#### Scenario: Error toast on report deletion
- **WHEN** report deletion fails
- **THEN** system displays an error toast with title "Failed to delete report" and actionable message

#### Scenario: Localization support
- **WHEN** user's language is set to Arabic
- **THEN** toast notifications display in Arabic with RTL layout
