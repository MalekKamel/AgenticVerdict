## ADDED Requirements

### Requirement: Home Dashboard Surface
The system MUST provide a production-ready home dashboard surface with KPI overview, insights summary, connector health, and quick action access.

#### Scenario: Home dashboard loads with complete data
- **WHEN** an authorized user opens the home dashboard
- **THEN** KPI overview, insights summary, and connector health sections render with current data
- **AND** quick actions are available according to user permissions

#### Scenario: Home dashboard has no data
- **WHEN** home dashboard data sources return empty states
- **THEN** the system renders standardized empty-state guidance for each affected section
- **AND** empty-state UI provides actionable next steps where applicable

### Requirement: Domain Dashboard Surface Parity
The system MUST provide domain-specific dashboards that preserve shared filter, refresh, and interaction behavior parity.

#### Scenario: User navigates between home and domain dashboards
- **WHEN** user switches to a domain dashboard route
- **THEN** shared filters and refresh controls behave consistently with the home dashboard model
- **AND** domain-specific KPI/chart/table sections render according to domain contracts

#### Scenario: Domain deep link is loaded
- **WHEN** a user opens a valid domain dashboard deep link
- **THEN** the route resolves correctly with expected domain context
- **AND** dashboard state initializes without redirect instability

### Requirement: Agency and Client Context Dashboard Surface
The system MUST provide agency overview and client-context dashboards with explicit context switching behavior and isolation-safe rendering.

#### Scenario: Agency user switches client context
- **WHEN** an agency user selects a client in client mode
- **THEN** dashboard content updates to the selected client context only
- **AND** persisted filters are scoped to the active client context

#### Scenario: Agency overview aggregate view
- **WHEN** an authorized agency user views agency overview
- **THEN** aggregate metrics render only from permitted scoped entities
- **AND** drill-down links preserve safe context boundaries

### Requirement: Dashboard Customization Lifecycle
The system MUST support role-gated dashboard customization including view/edit mode, widget ordering, and save/reset persistence behavior.

#### Scenario: Authorized user customizes layout
- **WHEN** a user with customization permission enters edit mode and reorders widgets
- **THEN** the new layout preview is immediately reflected in the UI
- **AND** saving persists the layout for subsequent sessions

#### Scenario: Unauthorized customization attempt
- **WHEN** a user without customization permission attempts to edit layout
- **THEN** edit controls are not available or are blocked with a clear permission-safe response
- **AND** dashboard layout remains unchanged

### Requirement: Standardized Async State Experience Across Surfaces
The system MUST provide consistent loading, error, empty, partial-data, and retry behavior across all dashboard surfaces.

#### Scenario: Partial data availability
- **WHEN** one or more dashboard sections fail while others succeed
- **THEN** successful sections remain visible
- **AND** failed sections show standardized partial-data error treatment with retry affordances

#### Scenario: Manual refresh execution
- **WHEN** user triggers dashboard refresh
- **THEN** all refresh-eligible sections follow consistent refetch indicators and completion feedback
- **AND** failures are isolated to affected sections without collapsing unrelated rendered content
