## MODIFIED Requirements

### Requirement: Standardized Async State Experience Across Surfaces
The system MUST provide consistent loading, error, empty, partial-data, and retry behavior across all dashboard surfaces, including insight detail pages where report list data MUST be scoped to the specific insight ID.

#### Scenario: Partial data availability
- **WHEN** one or more dashboard sections fail while others succeed
- **THEN** successful sections remain visible
- **AND** failed sections show standardized partial-data error treatment with retry affordances

#### Scenario: Manual refresh execution
- **WHEN** user triggers dashboard refresh
- **THEN** all refresh-eligible sections follow consistent refetch indicators and completion feedback
- **AND** failures are isolated to affected sections without collapsing unrelated rendered content

#### Scenario: Insight report list scoped to current insight
- **WHEN** the insight detail page loads its report list
- **THEN** the `useReportList` query is filtered by the current `insightId` parameter
- **AND** reports from other insights are never included in the response
- **AND** the backend query uses `dbScoped()` with tenant isolation to prevent cross-tenant data leakage
