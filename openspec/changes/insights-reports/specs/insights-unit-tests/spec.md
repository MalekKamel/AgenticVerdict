## ADDED Requirements

### Requirement: Unit Test Coverage for Insights and Reports
The system SHALL provide comprehensive unit tests for hooks, mutations, utilities, and validation schemas meeting coverage thresholds of 70% overall, 85% business logic, and 90% critical paths.

#### Scenario: Test insight hooks
- **WHEN** unit tests run for `useInsightList`, `useInsightCreate`, `useInsightUpdate`, `useInsightDelete`, `useInsightRun`
- **THEN** tests verify query execution, cache invalidation, error handling, and tenant scoping with 90% coverage

#### Scenario: Test report hooks
- **WHEN** unit tests run for `useReportList`, `useReportById`
- **THEN** tests verify query execution, filtering, pagination, and error handling with 90% coverage

#### Scenario: Test connector hooks
- **WHEN** unit tests run for `useConnectorList`, `useConnectorMetrics`
- **THEN** tests verify data fetching, health status, and error states with 85% coverage

#### Scenario: Test API utilities
- **WHEN** unit tests run for `insightApi` utility functions
- **THEN** tests verify cache key generation, direct API calls, and error translation with 85% coverage

#### Scenario: Test validation schemas
- **WHEN** unit tests run for wizard validation Zod schemas
- **THEN** tests verify valid data passes, invalid data fails with correct error messages

#### Scenario: Fix existing failing tests
- **WHEN** `insight-api.test.ts` and `report-api.test.ts` run
- **THEN** tests pass with proper TSX configuration and QueryClientProvider setup

#### Scenario: Meet coverage thresholds
- **WHEN** coverage report generated
- **THEN** overall coverage >= 70%, business logic >= 85%, critical paths >= 90%
