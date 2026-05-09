## ADDED Requirements

### Requirement: Insight Detail Page Real-Time Status
The insight detail page SHALL display real-time pipeline execution status when a run is in progress. The page SHALL show a running spinner with progress indicator, a completed badge with success toast, or a failed error display with retry option based on the job status.

#### Scenario: Status updates during pipeline execution
- **WHEN** a pipeline is running for the current insight
- **THEN** the detail page displays a spinner, "Running..." text, and progress indicator that updates every 3 seconds

#### Scenario: Status transitions to completed
- **WHEN** the pipeline completes successfully
- **THEN** the detail page shows a completed badge, displays a success toast, and refetches the latest insight data

#### Scenario: Status transitions to failed
- **WHEN** the pipeline fails
- **THEN** the detail page shows an error display with the failure reason and a retry button

### Requirement: Insight-Scoped Report List
The report list on the insight detail page SHALL display only reports associated with the current insight. The list SHALL pass the insight ID as a filter parameter to the API. An empty state SHALL be shown when no reports exist for the insight.

#### Scenario: Reports filtered by insight
- **WHEN** the user views the reports tab on an insight detail page
- **THEN** only reports linked to that insight are displayed

#### Scenario: No reports for insight
- **WHEN** an insight has no associated reports
- **THEN** an empty state is shown with guidance to run the insight to generate reports

### Requirement: Run Hook Cache Invalidation
The insight detail page SHALL use `useInsightRunMutation()` for the "Run Now" action instead of `useInsightRun()`. The mutation SHALL invalidate the `insight.getById` query on success to ensure the detail page displays updated data.

#### Scenario: Detail page invalidated after run
- **WHEN** the user clicks "Run Now" and the mutation succeeds
- **THEN** the `insight.getById` query is invalidated and the detail page refetches

## MODIFIED Requirements

### Requirement: Standardized Async State Experience Across Surfaces
The system MUST provide consistent loading, error, empty, partial-data, and retry behavior across all dashboard surfaces, including the insight detail page during pipeline execution.

#### Scenario: Partial data availability
- **WHEN** one or more dashboard sections fail while others succeed
- **THEN** successful sections remain visible
- **AND** failed sections show standardized partial-data error treatment with retry affordances

#### Scenario: Manual refresh execution
- **WHEN** user triggers dashboard refresh
- **THEN** all refresh-eligible sections follow consistent refetch indicators and completion feedback
- **AND** failures are isolated to affected sections without collapsing unrelated rendered content

#### Scenario: Pipeline execution in progress
- **WHEN** a pipeline is executing for an insight viewed on the detail page
- **THEN** the status section shows a loading indicator while other sections display cached data
- **AND** sections refresh automatically when the pipeline completes
