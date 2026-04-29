## ADDED Requirements

### Requirement: Normalized frontend error adapter
The frontend MUST consume canonical backend error payloads through one adapter that outputs message key, interpolation data, severity, and retry metadata.

#### Scenario: Rendering a translated user-facing error
- **WHEN** the frontend receives a canonical error payload
- **THEN** the adapter SHALL return a normalized model used by all UI error presentation components

### Requirement: Safe message rendering
Frontend surfaces MUST render only approved message keys or safe fallback text and MUST NOT display raw backend/internal error messages in production mode.

#### Scenario: Unknown error code received
- **WHEN** the frontend receives an unknown or unmapped canonical code
- **THEN** the UI SHALL render the configured generic fallback key with no raw server message exposure

### Requirement: Unified client-side error telemetry
Frontend error logging MUST route through one observability path that attaches canonical metadata and correlation context when available.

#### Scenario: Client logs a retryable API error
- **WHEN** a retryable canonical error is handled in the UI
- **THEN** the telemetry event SHALL include canonical code/category/surface and retryability fields
