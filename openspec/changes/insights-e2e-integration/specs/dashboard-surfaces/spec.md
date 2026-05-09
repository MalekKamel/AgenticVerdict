## ADDED Requirements

### Requirement: Insights Listing Surface
The system MUST provide a production-ready insights listing page with sorting, filtering (search, status, domain), URL-synced pagination, enable/disable toggles, and auto-refresh for running insights.

#### Scenario: Insights list displays with complete data
- **WHEN** an authorized user opens the insights listing page
- **THEN** insights are displayed with name, status, last run time, and associated connectors
- **AND** sorting, search, status filter, and domain filter controls are available

#### Scenario: Sorting changes insight order
- **WHEN** a user selects a sort field (name, createdAt, lastRunAt, status) and direction
- **THEN** the list reorders according to the selected sort parameters
- **AND** sort state is reflected in the URL search params

#### Scenario: Domain filter filters insights
- **WHEN** a user selects a domain filter value
- **THEN** only insights matching the selected domain are displayed
- **AND** the domain filter state is synced to the URL

#### Scenario: Pagination syncs to URL
- **WHEN** a user navigates between pages
- **THEN** `page` and `pageSize` are reflected in the URL search params
- **AND** refreshing the page restores the current pagination position

#### Scenario: Enable/disable toggle works inline
- **WHEN** a user toggles an insight's enabled state from the list
- **THEN** the insight is updated without navigating to the edit page
- **AND** the list cache is invalidated to reflect the change

#### Scenario: Auto-refresh during running insights
- **WHEN** any insight in the list has a running status
- **THEN** the list auto-refreshes at a configured interval
- **AND** polling stops when no insights are running

### Requirement: Insights Detail Surface
The system MUST provide a production-ready insights detail page with overview tab (configuration summary), reports tab (paginated list), history tab (audit trail timeline), run-now execution with job status polling, AI insights section, connector health display, and Mantine modal confirmations for destructive actions.

#### Scenario: Detail page shows complete configuration
- **WHEN** a user opens an insight detail page
- **THEN** the overview tab displays the full configuration summary including name, description, connectors, AI config, schedule, and delivery settings

#### Scenario: Run now triggers execution with status polling
- **WHEN** a user clicks "Run Now" on the detail page
- **THEN** an execution job is enqueued and a job status badge is displayed
- **AND** the badge updates with progress until a terminal status is reached

#### Scenario: Connector health is displayed
- **WHEN** an insight detail page loads
- **THEN** the health status of each associated connector is displayed
- **AND** disconnected connectors are visually distinguished

#### Scenario: Delete confirmation uses Mantine modal
- **WHEN** a user clicks delete on an insight
- **THEN** a Mantine modal confirmation dialog is shown
- **AND** native `confirm()` is not used

### Requirement: Insights Creation Wizard Surface
The system MUST provide a 6-step creation wizard with per-step validation, connector selection with health display, metric configuration, AI settings with model validation, schedule/delivery form, review summary, error boundary wrapper, and loading skeletons during async data fetches.

#### Scenario: Wizard navigates correctly
- **WHEN** a user progresses through the 6-step wizard
- **THEN** forward and backward navigation works correctly
- **AND** per-step validation prevents advancing with invalid data

#### Scenario: Manage Connectors navigates properly
- **WHEN** a user clicks "Manage Connectors" in the connector selection step
- **THEN** navigation to the connector management page occurs
- **AND** a return URL is provided to resume the wizard

#### Scenario: Loading state during connector fetch
- **WHEN** the wizard fetches available connectors
- **THEN** a loading skeleton is displayed
- **AND** form interaction is disabled until data is loaded

### Requirement: Insights Editing Surface
The system MUST provide an editing flow that pre-populates all 6 wizard steps with existing data, supports per-step dirty tracking with "Unsaved changes" badge, reset-to-default per step, and validation consistent with creation.

#### Scenario: Edit form pre-populates correctly
- **WHEN** a user opens the edit page for an existing insight
- **THEN** all 6 steps display the correct existing values
- **AND** the form reflects the current insight configuration

#### Scenario: Dirty tracking shows unsaved changes
- **WHEN** a user modifies any field in the edit form
- **THEN** an "Unsaved changes" badge is displayed
- **AND** the cancel action prompts for confirmation if changes are unsaved
