## ADDED Requirements

### Requirement: Audit Trail React Query Hook
The system SHALL provide React Query hook for fetching audit trail entries for insights with filtering and pagination support.

#### Scenario: Fetch audit trail for insight
- **WHEN** user calls `useAuditTrail({ insightId, page: 1, pageSize: 20 })`
- **THEN** system fetches audit trail entries filtered by insight ID

#### Scenario: Filter audit trail by action type
- **WHEN** user filters by action type (created, updated, deleted, report_generated)
- **THEN** system returns only matching audit trail entries

#### Scenario: Display audit trail in timeline format
- **WHEN** audit trail data is loaded
- **THEN** system provides data formatted for timeline component display
