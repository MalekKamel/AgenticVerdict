## ADDED Requirements

### Requirement: Insights Route Error Boundaries
The system MUST wrap all insight routes (listing, creation, detail, editing) with page-level error boundaries that provide user-friendly error messages with retry options, consistent with the standardized async state patterns defined in the dashboard surfaces spec.

#### Scenario: Error boundary catches route-level errors
- **WHEN** an unhandled error occurs in any insight route
- **THEN** the error boundary displays a user-friendly error message
- **AND** a retry option is available to re-fetch the data

#### Scenario: Create wizard has error boundary
- **WHEN** an error occurs during the insight creation wizard
- **THEN** the `PageErrorBoundary` catches and displays the error
- **AND** the error treatment is consistent with the edit page

### Requirement: Insights Route Loading Skeletons
The system MUST display loading skeletons during async data fetches in insight routes, using Mantine Skeleton components and preventing form interaction until data is loaded.

#### Scenario: Loading skeleton displays during fetch
- **WHEN** an insight route fetches async data (connectors, insight details, etc.)
- **THEN** a Mantine Skeleton loading state is displayed
- **AND** the perceived performance is improved over blank screens
