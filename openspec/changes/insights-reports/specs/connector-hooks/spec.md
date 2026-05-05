## ADDED Requirements

### Requirement: Connector React Query Hooks
The system SHALL provide React Query hooks for fetching connector list and available metrics per connector type to replace mock data in wizard flows.

#### Scenario: Fetch user connectors list
- **WHEN** user calls `useConnectorList()`
- **THEN** system fetches all authenticated connectors for current tenant with health status

#### Scenario: Fetch available metrics for connector type
- **WHEN** user calls `useConnectorMetrics({ connectorType: 'meta_ads' })`
- **THEN** system returns list of available metrics for that connector type

#### Scenario: Handle connector with no data
- **WHEN** connector is authenticated but has no metrics available
- **THEN** hook returns empty metrics array with appropriate empty state

#### Scenario: Handle disconnected connector
- **WHEN** connector authentication has expired
- **THEN** hook marks connector as unhealthy with reauth required flag
