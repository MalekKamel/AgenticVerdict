## ADDED Requirements

### Requirement: Connector Configure Page Route
The system MUST provide a route at `/connectors/[id]/configure` that renders the connector configuration page.

#### Scenario: Navigation to configure page
- **WHEN** a user navigates to `/connectors/[id]/configure`
- **THEN** the system renders the configuration page within the dashboard layout
- **AND** loads the current configuration for the specified connector

### Requirement: Account Selection Configuration
The system MUST allow users to view and change the connected account(s).

#### Scenario: Switch account
- **WHEN** a user selects a different account from the available options
- **THEN** the system updates the connector to use the selected account
- **AND** displays help text describing each account

### Requirement: Metrics Configuration
The system MUST allow users to modify which metrics are collected from the connector.

#### Scenario: Toggle metrics
- **WHEN** a user checks or unchecks a metric checkbox
- **THEN** the system updates the connector's metric collection configuration
- **AND** provides a "Select All" option
- **AND** allows searching for specific metrics

### Requirement: Sync Preferences Configuration
The system MUST allow users to adjust sync frequency and data retention.

#### Scenario: Change sync frequency
- **WHEN** a user selects a sync frequency option
- **THEN** the system updates the connector's sync schedule accordingly

#### Scenario: Change data retention
- **WHEN** a user selects a data retention period
- **THEN** the system updates the connector's retention policy
- **AND** displays help text explaining the implications

### Requirement: Notification Settings Configuration
The system MUST allow users to configure notification preferences for the connector.

#### Scenario: Toggle notifications
- **WHEN** a user checks or unchecks a notification option
- **THEN** the system updates the connector's notification settings
- **AND** options include sync failure alerts, authentication expiration warnings, and optional weekly summaries

### Requirement: Advanced Configuration Options
The system MUST expose advanced connector options for power users.

#### Scenario: Custom parameters
- **WHEN** a user adds custom parameters via tag input
- **THEN** the system stores and applies those parameters to connector requests

#### Scenario: IP filter toggle
- **WHEN** a user toggles the IP filter option
- **THEN** the system enables or disables exclusion of internal traffic

### Requirement: Configuration Save and Test
The system MUST allow users to save changes and test the connection.

#### Scenario: Save configuration
- **WHEN** a user clicks "Save Changes"
- **THEN** the system persists all modified settings
- **AND** displays a success toast
- **AND** form fields remain populated for further editing

#### Scenario: Test connection
- **WHEN** a user clicks "Test Connection"
- **THEN** the system validates the connector configuration against the provider
- **AND** displays "Connection successful" or "Connection failed" inline

### Requirement: Unsaved Changes Detection
The system MUST detect and warn about unsaved changes.

#### Scenario: Discard changes warning
- **WHEN** a user attempts to navigate away with unsaved changes
- **THEN** the system displays a confirmation dialog
- **AND** allows the user to stay and save or discard and leave
