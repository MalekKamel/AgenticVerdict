## ADDED Requirements

### Requirement: Connector Remove Page Route
The system MUST provide a route at `/connectors/[id]/remove` that renders the connector removal confirmation page.

#### Scenario: Navigation to remove page
- **WHEN** a user navigates to `/connectors/[id]/remove`
- **THEN** the system renders the removal confirmation page within the dashboard layout
- **AND** loads connector details and affected resources

### Requirement: Removal Impact Preview
The system MUST display the consequences of removing a connector before allowing confirmation.

#### Scenario: View impact
- **WHEN** a user views the remove page
- **THEN** the system displays a list of impacts including: data collection will stop, existing insights will show historical data only, no new reports will include this connector, historical data will be retained for 90 days, and the connector can be reconnected anytime

### Requirement: Affected Insights Listing
The system MUST list insights that depend on the connector being removed.

#### Scenario: Show affected insights
- **WHEN** a user views the remove page
- **THEN** the system displays a list of affected insights with names
- **AND** explains that these insights will continue to work but won't receive new data

### Requirement: Alternative Pause Option
The system MUST offer an alternative to removal: pausing data collection.

#### Scenario: Pause vs remove
- **WHEN** a user is on the remove page
- **THEN** the system presents two radio options: "Pause data collection" (keep connector, stop syncing) and "Remove connector completely" (disconnect and remove configuration)
- **AND** pre-selects "Remove" by default

### Requirement: Data Export Before Removal
The system MUST provide an option to export historical data before removal.

#### Scenario: Export historical data
- **WHEN** a user clicks "Export historical data"
- **THEN** the system prepares and initiates a download of historical data for the connector
- **AND** shows a loading state while preparing

### Requirement: Confirmation Input
The system MUST require typed confirmation before executing removal.

#### Scenario: Type to confirm
- **WHEN** a user types "REMOVE" into the confirmation input
- **THEN** the "Confirm Removal" button becomes enabled
- **AND** if the input does not exactly match "REMOVE", the button remains disabled

### Requirement: Execute Removal
The system MUST execute removal upon confirmation and redirect appropriately.

#### Scenario: Successful removal
- **WHEN** a user clicks "Confirm Removal"
- **THEN** the system processes the removal
- **AND** displays a success message
- **AND** redirects to the connector list page after a brief delay

#### Scenario: Removal error
- **WHEN** removal fails
- **THEN** the system displays an error message
- **AND** provides a retry button and support contact link

### Requirement: Cancel Removal
The system MUST allow users to cancel the removal process.

#### Scenario: Cancel removal
- **WHEN** a user clicks "Cancel"
- **THEN** the system discards the removal flow
- **AND** navigates back to the connector detail page

### Requirement: Query Parameter Pre-selection
The system MUST support query parameters for pre-selection.

#### Scenario: Pre-select pause
- **WHEN** a user navigates to `/connectors/[id]/remove?pause=true`
- **THEN** the system pre-selects the "Pause data collection" option

#### Scenario: Redirect after removal
- **WHEN** a user navigates to `/connectors/[id]/remove?redirect=/insights`
- **THEN** the system redirects to the specified path after successful removal instead of the connector list
