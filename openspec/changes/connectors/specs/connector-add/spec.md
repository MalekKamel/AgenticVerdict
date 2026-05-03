## ADDED Requirements

### Requirement: Add Connector Wizard Route
The system MUST provide a route at `/connectors/add` that renders a multi-step connector setup wizard.

#### Scenario: Navigation to add connector
- **WHEN** a user navigates to `/connectors/add`
- **THEN** the system renders the add connector wizard within the dashboard layout
- **AND** the wizard displays a progress stepper showing the current step

### Requirement: Platform Selection Step
The system MUST provide a platform selection step with searchable platform cards.

#### Scenario: Browse platforms
- **WHEN** a user is on Step 1 of the wizard
- **THEN** the system displays available platform cards with icon, name, description, domain tags, and availability status
- **AND** provides a search input to filter platforms by name

#### Scenario: Select platform
- **WHEN** a user clicks on a platform card
- **THEN** the card is highlighted to indicate selection
- **AND** the "Continue" button becomes enabled

#### Scenario: Coming soon platform
- **WHEN** a platform is marked as "Coming Soon"
- **THEN** the card is visually distinct and disabled for selection
- **AND** optionally provides a "Notify me" option

### Requirement: Authentication Step
The system MUST support OAuth and API key authentication methods based on the selected platform.

#### Scenario: OAuth authentication
- **WHEN** a user selects a platform that supports OAuth
- **THEN** the system displays a "Connect with [Provider]" button
- **AND** upon clicking, initiates the OAuth flow
- **AND** upon successful redirect back with token, advances to the next step automatically

#### Scenario: API key authentication
- **WHEN** a user selects a platform that requires API key
- **THEN** the system displays input fields for the required credentials
- **AND** provides mask/unmask toggle for sensitive fields
- **AND** validates the format in real time
- **AND** provides help links to documentation for finding credentials

#### Scenario: Authentication failure
- **WHEN** authentication fails (OAuth error or invalid API key)
- **THEN** the system displays an error message
- **AND** provides a retry button

### Requirement: Configuration Step
The system MUST allow users to configure connector settings after successful authentication.

#### Scenario: Account selection
- **WHEN** a user reaches the configuration step
- **THEN** the system fetches and displays available accounts from the provider
- **AND** allows the user to select one or more accounts

#### Scenario: Metric selection
- **WHEN** a user is configuring metrics
- **THEN** the system displays a checklist of available metrics with recommended defaults pre-selected
- **AND** allows the user to customize selections

#### Scenario: Sync preferences
- **WHEN** a user sets sync preferences
- **THEN** the system provides options for sync frequency and data retention period
- **AND** enforces that required selections are made before continuing

### Requirement: Confirmation Step
The system MUST display a summary of the connector configuration and test the connection.

#### Scenario: Connection test success
- **WHEN** a user reaches the confirmation step
- **THEN** the system tests the connection automatically
- **AND** upon success, displays a success message with a summary of connected data
- **AND** provides a "Go to Connector" button to navigate to the detail page

#### Scenario: Connection test warning
- **WHEN** the connection test succeeds with limited permissions
- **THEN** the system displays a warning message explaining the limitation

#### Scenario: Connection test failure
- **WHEN** the connection test fails
- **THEN** the system displays an error with troubleshooting steps
- **AND** allows the user to retry or go back to configuration

### Requirement: Wizard Navigation
The system MUST allow users to cancel or navigate within the wizard.

#### Scenario: Cancel wizard
- **WHEN** a user clicks "Cancel" at any step
- **THEN** the system discards all progress
- **AND** navigates back to the connector list page

#### Scenario: Query parameter pre-selection
- **WHEN** a user navigates to `/connectors/add?platform=meta`
- **THEN** the system pre-selects the Meta platform on Step 1
- **AND** when `?redirect=/insights/create` is present, navigates to the specified path upon completion
