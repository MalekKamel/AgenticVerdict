## ADDED Requirements

### Requirement: Insight List Display
The system SHALL display a paginated list of insights with status indicators, connector information, and metadata.

#### Scenario: Successful list load
- **WHEN** user navigates to `/dashboard/insights`
- **THEN** system displays all insights for the tenant with name, status, domain, connectors, created date, and last run date

#### Scenario: Empty state
- **WHEN** tenant has no insights
- **THEN** system displays empty state with illustration and "Create your first insight" button

#### Scenario: Loading state
- **WHEN** insights are being fetched
- **THEN** system displays skeleton cards with shimmer effect

### Requirement: Insight Filtering
The system SHALL allow users to filter insights by status, domain, and search by name.

#### Scenario: Filter by status
- **WHEN** user selects "Enabled" or "Disabled" from status filter
- **THEN** system displays only insights matching the selected status

#### Scenario: Filter by domain
- **WHEN** user selects a domain from domain filter
- **THEN** system displays only insights matching the selected domain

#### Scenario: Search by name
- **WHEN** user types in search input
- **THEN** system filters insights by name (case-insensitive partial match)

### Requirement: Insight Status Indicators
The system SHALL display status indicators for each insight showing enabled, disabled, running, failed, or no runs states.

#### Scenario: Enabled insight
- **WHEN** insight is active and running on schedule
- **THEN** system displays green checkmark indicator with "Enabled" label

#### Scenario: Running insight
- **WHEN** insight is currently executing
- **THEN** system displays blue spinner indicator with "Running" label

#### Scenario: Failed insight
- **WHEN** insight's last run failed
- **THEN** system displays red error indicator with "Failed" label

### Requirement: Pagination
The system SHALL paginate insight results when total exceeds page size.

#### Scenario: Multiple pages
- **WHEN** tenant has more than 20 insights
- **THEN** system displays pagination controls with page numbers and next/previous buttons

#### Scenario: Page navigation
- **WHEN** user clicks page number or next/previous
- **THEN** system loads and displays insights for the selected page
