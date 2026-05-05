## ADDED Requirements

### Requirement: Connector Metrics Fetching
The system SHALL fetch available metrics for selected connectors dynamically from the backend API.

#### Scenario: Metrics load on connector selection
- **WHEN** user selects one or more connectors in the InsightCreateWizard
- **THEN** system fetches available metrics for each selected connector and displays them in the MetricConfigurationStep

#### Scenario: Loading state during metrics fetch
- **WHEN** metrics are being fetched from the API
- **THEN** system displays a loading indicator in the metrics selection UI

#### Scenario: Error handling for metrics fetch failure
- **WHEN** the metrics API call fails
- **THEN** system displays an error message and allows retry

#### Scenario: Metrics validation
- **WHEN** user proceeds to next step without selecting at least one metric per connector
- **THEN** system displays validation error and prevents progression
