## ADDED Requirements

### Requirement: Usage Data Collection
The system SHALL collect AI usage data from the agent runtime, including token counts, costs, and request metadata.

#### Scenario: Report usage from agent runtime
- **WHEN** the agent runtime completes an AI request
- **THEN** the system SHALL record the usage data (prompt tokens, completion tokens, total tokens, cost, model, timestamp)

#### Scenario: Atomic usage upsert
- **WHEN** multiple usage reports arrive concurrently for the same tenant and time window
- **THEN** the system SHALL atomically upsert the usage data without race conditions or data loss

#### Scenario: Usage data validation
- **WHEN** usage data is submitted
- **THEN** the system SHALL validate the data format and reject invalid reports with appropriate error messages

### Requirement: Usage Dashboard
The system SHALL provide a dashboard for visualizing AI usage and costs over time.

#### Scenario: View usage summary
- **WHEN** a user navigates to the usage dashboard
- **THEN** the system SHALL display total usage (tokens, requests, cost) for the selected time period

#### Scenario: Usage breakdown by provider
- **WHEN** a user views the usage dashboard
- **THEN** the system SHALL display a breakdown of usage by AI provider (e.g., Claude, GPT-4o)

#### Scenario: Usage breakdown by domain
- **WHEN** a user views the usage dashboard
- **THEN** the system SHALL display a breakdown of usage by business domain

#### Scenario: Time-series visualization
- **WHEN** a user views the usage dashboard
- **THEN** the system SHALL display a time-series chart showing usage trends over the selected period

#### Scenario: Dashboard load performance
- **WHEN** a user loads the usage dashboard
- **THEN** the system SHALL render the dashboard in <2 seconds

### Requirement: Usage Filtering and Aggregation
The system SHALL allow users to filter and aggregate usage data by various dimensions.

#### Scenario: Filter by date range
- **WHEN** a user selects a date range (e.g., last 7 days, last 30 days, custom range)
- **THEN** the system SHALL filter the usage data to the selected period

#### Scenario: Filter by domain
- **WHEN** a user filters by a specific business domain
- **THEN** the system SHALL show only usage data for connectors within that domain

#### Scenario: Filter by provider
- **WHEN** a user filters by a specific AI provider
- **THEN** the system SHALL show only usage data for that provider

#### Scenario: Aggregate by time granularity
- **WHEN** a user selects a time granularity (hourly, daily, weekly, monthly)
- **THEN** the system SHALL aggregate the usage data accordingly

### Requirement: Cost Calculation
The system SHALL calculate costs based on token usage and configured pricing models.

#### Scenario: Calculate cost from tokens
- **WHEN** usage data is recorded with token counts
- **THEN** the system SHALL calculate the cost based on the provider's pricing model (per 1K tokens)

#### Scenario: Cost tier pricing
- **WHEN** a provider is configured with a cost tier (premium/standard/economy)
- **THEN** the system SHALL apply the tier's pricing multiplier to the base cost

#### Scenario: Custom pricing override
- **WHEN** a tenant configures custom pricing for a provider
- **THEN** the system SHALL use the custom pricing instead of the default tier pricing

### Requirement: Usage Data Retention
The system SHALL enforce data retention policies for usage data.

#### Scenario: Raw data retention
- **WHEN** usage data is older than 90 days
- **THEN** the system SHALL aggregate the data into monthly summaries and delete the raw records

#### Scenario: Aggregated data retention
- **WHEN** aggregated usage data is older than 2 years
- **THEN** the system SHALL archive or delete the aggregated data per tenant configuration

#### Scenario: Tenant data export
- **WHEN** a tenant requests their usage data export
- **THEN** the system SHALL generate a CSV or JSON export of all usage data within the retention period
