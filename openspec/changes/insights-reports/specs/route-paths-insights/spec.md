## ADDED Requirements

### Requirement: Type-Safe Route Paths for Insights and Reports
The system SHALL provide centralized route path constants for all insights and reports navigation to replace hardcoded route strings.

#### Scenario: Navigate to insights list
- **WHEN** user navigates to insights list page
- **THEN** system uses `ROUTE_PATHS.DASHBOARD_INSIGHTS` constant

#### Scenario: Navigate to new insight wizard
- **WHEN** user creates new insight
- **THEN** system uses `ROUTE_PATHS.DASHBOARD_INSIGHTS_NEW` constant

#### Scenario: Navigate to insight detail
- **WHEN** user views insight detail page
- **THEN** system uses route helper with `ROUTE_PATHS.DASHBOARD_INSIGHTS_DETAIL` pattern

#### Scenario: Navigate to insight edit
- **WHEN** user edits existing insight
- **THEN** system uses route helper with `ROUTE_PATHS.DASHBOARD_INSIGHTS_EDIT` pattern

#### Scenario: Navigate to reports section
- **WHEN** user navigates to reports
- **THEN** system uses `ROUTE_PATHS.DASHBOARD_REPORTS` and related constants
