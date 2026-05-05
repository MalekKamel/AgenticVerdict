## ADDED Requirements

### Requirement: Reports React Query Hooks
The system SHALL provide React Query hooks for reports operations including list retrieval, individual report fetching, and report generation status polling.

#### Scenario: Fetch reports list for insight
- **WHEN** user calls `useReportList({ insightId, page: 1, pageSize: 10 })`
- **THEN** system fetches reports filtered by insight ID with pagination

#### Scenario: Fetch single report by ID
- **WHEN** user calls `useReportById(reportId)`
- **THEN** system fetches complete report data including metrics and AI insights

#### Scenario: Handle empty reports list
- **WHEN** insight has no generated reports
- **THEN** hook returns empty array with proper empty state handling

#### Scenario: Poll report generation status
- **WHEN** report is being generated
- **THEN** system polls status endpoint until completion or timeout

#### Scenario: Handle tenant scoping
- **WHEN** any report hook is called
- **THEN** system automatically includes tenantId from AsyncLocalStorage context
