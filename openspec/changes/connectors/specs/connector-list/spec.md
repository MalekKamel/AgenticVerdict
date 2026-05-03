## ADDED Requirements

### Requirement: Connector List Page Route
The system MUST provide a route at `/connectors` that renders the connector list page within the dashboard layout.

#### Scenario: Navigation to connector list
- **WHEN** a user navigates to `/connectors`
- **THEN** the system renders the connector list page with the standard dashboard layout including sidebar and top bar
- **AND** the page displays all connectors accessible to the current tenant

### Requirement: Connector Card Display
The system MUST display each connector as a card showing status indicator, name, domain tags, last sync time, health message, and action buttons.

#### Scenario: Active connector card
- **WHEN** a connector is in active state
- **THEN** the card displays a green status indicator
- **AND** shows "All systems operational" or equivalent health message
- **AND** displays last sync timestamp
- **AND** provides "View Details", "Sync Now", and "Disconnect" action buttons

#### Scenario: Connector needing attention
- **WHEN** a connector requires attention (e.g., authentication expiring)
- **THEN** the card displays a yellow status indicator
- **AND** shows the warning message
- **AND** highlights a "Resolve issue" action

#### Scenario: Disconnected connector
- **WHEN** a connector is disconnected or not configured
- **THEN** the card displays a red or gray status indicator
- **AND** shows the disconnected or setup prompt message
- **AND** provides "Connect" or "Set Up" action buttons

### Requirement: Connector Filtering
The system MUST allow users to filter connectors by status and domain.

#### Scenario: Filter by status
- **WHEN** a user selects a status filter (All, Active, Needs Attention, Inactive)
- **THEN** the connector grid updates to show only connectors matching the selected status
- **AND** displays a result count (e.g., "Showing 3 of 5 connectors")

#### Scenario: Filter by domain
- **WHEN** a user selects a domain from the domain dropdown
- **THEN** the connector grid updates to show only connectors associated with that domain
- **AND** a "Clear filters" button becomes available

### Requirement: Connector Search
The system MUST provide a search input to filter connectors by name or platform.

#### Scenario: Search connectors
- **WHEN** a user types into the search input
- **THEN** the connector grid filters in real time to show only connectors matching the search query
- **AND** an empty state displays when no connectors match the query

### Requirement: Connector List Permissions
The system MUST enforce role-based permissions on connector actions within the list page.

#### Scenario: Viewer access
- **WHEN** a user with Viewer role accesses the connector list
- **THEN** they can view connectors and their status
- **AND** action buttons (Sync, Disconnect, Configure) are not available

#### Scenario: Analyst access
- **WHEN** a user with Analyst role accesses the connector list
- **THEN** they can view connectors, sync, and view details
- **AND** they cannot add, configure, or disconnect connectors

#### Scenario: Admin access
- **WHEN** a user with Admin or Owner role accesses the connector list
- **THEN** they have full access to all connector actions including add, configure, and disconnect

### Requirement: Manual Sync Trigger
The system MUST allow authorized users to trigger a manual sync from the connector list.

#### Scenario: Sync now action
- **WHEN** an authorized user clicks "Sync Now" on a connector card
- **THEN** the action button enters a loading state
- **AND** the card displays a syncing progress indicator
- **AND** other actions on that card are disabled during sync
- **AND** upon completion, the card updates with the new sync timestamp and status
