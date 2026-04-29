## ADDED Requirements

### Requirement: Production Dashboard Route Skeleton
The system MUST replace prototype dashboard route behavior with a production route skeleton that enforces strict layering from route to typed API integrations.

#### Scenario: Route module remains thin
- **WHEN** a dashboard route is implemented
- **THEN** route files contain only routing and guard orchestration concerns
- **AND** business logic is implemented in page/component/hook/service layers

#### Scenario: Prototype route behavior is decommissioned
- **WHEN** the new dashboard foundation is enabled
- **THEN** prototype dashboard components and state flows are not reachable from active route navigation
- **AND** only explicitly approved reusable utilities may remain referenced

### Requirement: Canonical Guard and Redirect Safety
The system MUST use canonical guard handling for dashboard entry and MUST prevent redirect loops and unsafe redirect targets.

#### Scenario: Redirect target is unsafe
- **WHEN** a dashboard guard receives an invalid or unsafe redirect target
- **THEN** the system sanitizes the target
- **AND** navigates to a deterministic safe fallback route

#### Scenario: Guard path could loop
- **WHEN** guard preconditions evaluate to a potential redirect cycle
- **THEN** the guard resolves using a non-looping deterministic fallback
- **AND** route resolution completes without repeated redirects

### Requirement: Typed Dashboard Data Contracts
The system MUST consume dashboard data through typed contracts and MUST not rely on untyped payload assumptions.

#### Scenario: Contracted data request succeeds
- **WHEN** a dashboard page requests KPI or insights data
- **THEN** the request and response are validated by typed contract boundaries
- **AND** consuming components receive strongly typed data structures

#### Scenario: Contract returns a typed error
- **WHEN** a dashboard data request fails validation or execution
- **THEN** the system returns a stable typed error shape
- **AND** dashboard UI transitions to a standardized recoverable error state

### Requirement: Shared Dashboard State Model
The system MUST provide a shared dashboard state model for date range, comparison, context, and view mode with deterministic transitions.

#### Scenario: User updates date range and comparison
- **WHEN** a user changes date range or comparison settings
- **THEN** shared state updates once and propagates consistently to all dependent dashboard blocks
- **AND** stale state from prior selections is not displayed after transition completion

#### Scenario: State transition across loading and refetch
- **WHEN** a dashboard refresh is triggered
- **THEN** state transitions follow standardized loading and refetch semantics
- **AND** freshness indicators reflect the most recent successful data timestamp
