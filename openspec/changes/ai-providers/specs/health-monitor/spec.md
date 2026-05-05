## ADDED Requirements

### Requirement: Provider Health Check
The system SHALL implement health checks for each provider.

#### Scenario: Basic health check
- **WHEN** `checkHealth()` is called for a provider
- **THEN** the system SHALL perform a lightweight health check (e.g., fetch model list)

#### Scenario: Measure health check latency
- **WHEN** a health check is performed
- **THEN** the latency SHALL be recorded

#### Scenario: Handle providers without health check
- **WHEN** a provider does not implement `isHealthy()`
- **THEN** a fallback health check SHALL be used (e.g., models() call)

### Requirement: Health Status Aggregation
The system SHALL aggregate health metrics for all providers.

#### Scenario: Get health dashboard
- **WHEN** `getHealthDashboard()` is called
- **THEN** health status SHALL be returned for all registered providers

#### Scenario: Calculate p95 latency
- **WHEN** health metrics are aggregated
- **THEN** p95 latency SHALL be calculated from recent health checks

#### Scenario: Calculate error rate
- **WHEN** health metrics are aggregated
- **THEN** error rate SHALL be calculated from recent requests

### Requirement: Health Status Classification
The system SHALL classify providers into health statuses.

#### Scenario: Healthy status
- **WHEN** error rate < 1% and p95 latency < 2000ms
- **THEN** the provider status SHALL be "healthy"

#### Scenario: Degraded status
- **WHEN** error rate is 1-5% OR p95 latency is 2000-5000ms
- **THEN** the provider status SHALL be "degraded"

#### Scenario: Unhealthy status
- **WHEN** error rate > 5% OR p95 latency > 5000ms
- **THEN** the provider status SHALL be "unhealthy"

### Requirement: Health Dashboard API
The system SHALL provide an API for health dashboard visualization.

#### Scenario: Expose health endpoint
- **WHEN** the health dashboard API is called
- **THEN** it SHALL return health status for all providers with metrics

#### Scenario: Include last checked timestamp
- **WHEN** health status is returned
- **THEN** it SHALL include the last checked timestamp for each provider

#### Scenario: Support agency-level aggregation
- **WHEN** an agency partner requests health dashboard
- **THEN** health status SHALL be aggregated across their managed tenants
