## ADDED Requirements

### Requirement: Connector Detail Page Route
The system MUST provide a route at `/connectors/[id]` that renders the connector detail page.

#### Scenario: Navigation to detail page
- **WHEN** a user navigates to `/connectors/[id]`
- **THEN** the system renders the detail page within the dashboard layout
- **AND** loads connector-specific data including health, recent data, sync history, and connected metrics

### Requirement: Connector Health Display
The system MUST display the current health status of the connector prominently.

#### Scenario: Healthy connector
- **WHEN** a connector is healthy
- **THEN** the system displays a green status indicator with "All Systems Operational" message
- **AND** shows last sync time, next scheduled sync time, and data freshness indicator

#### Scenario: Warning state
- **WHEN** a connector has warnings (e.g., auth expiring soon)
- **THEN** the system displays a yellow status indicator with the warning message
- **AND** shows relevant sync history warnings
- **AND** surfaces troubleshooting guidance

#### Scenario: Error state
- **WHEN** a connector has errors (e.g., authentication failed)
- **THEN** the system displays a red status indicator with the error message
- **AND** shows failed syncs in history
- **AND** provides a "Reconnect" button

### Requirement: Recent Data Snapshot
The system MUST display a snapshot of recent data from the connector.

#### Scenario: Data snapshot display
- **WHEN** a user views the detail page
- **THEN** the system displays key metrics with period-over-period comparison (e.g., Sessions, Conversions, Revenue)
- **AND** provides a link to view the full domain-specific dashboard

### Requirement: Sync History
The system MUST display the sync history for the connector.

#### Scenario: View sync history
- **WHEN** a user views the detail page
- **THEN** the system displays the last 30 days of sync history in a table
- **AND** each entry shows timestamp, status (Success/Warning/Error), and record count
- **AND** provides a link to view the full sync history

### Requirement: Connected Metrics Display
The system MUST display which metrics are currently active for the connector.

#### Scenario: View connected metrics
- **WHEN** a user views the detail page
- **THEN** the system displays a list of active metrics with checkmarks
- **AND** provides a "Manage Metrics" link to the configure page

### Requirement: Troubleshooting Section
The system MUST display troubleshooting guidance for known issues.

#### Scenario: Issues detected
- **WHEN** the system detects known issues (e.g., auth expiring, high latency)
- **THEN** it displays each issue with description and relevant action button (e.g., "Renew Now", "Learn More")
- **AND** provides links to documentation and support

### Requirement: Detail Page Actions
The system MUST provide actions from the detail page.

#### Scenario: Configure from detail
- **WHEN** a user clicks "Configure"
- **THEN** the system navigates to `/connectors/[id]/configure`

#### Scenario: Sync from detail
- **WHEN** a user clicks "Sync Now"
- **THEN** the system triggers a manual sync
- **AND** updates the page state to show syncing progress
- **AND** refreshes data upon completion

#### Scenario: Breadcrumb navigation
- **WHEN** a user is on the detail page
- **THEN** the breadcrumb displays "Connectors > [Connector Name]"
- **AND** "Connectors" links back to the list page
