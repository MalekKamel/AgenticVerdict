## ADDED Requirements

### Requirement: Type-Safe JSONB Fields
The system SHALL use strict TypeScript interfaces and runtime validation for all JSONB fields (aiConfig, schedule, delivery, connectors).

#### Scenario: AI config type validation
- **WHEN** insight data is received from the API
- **THEN** aiConfig field is validated against InsightAIConfigSchema with model, provider, qualityLevel, and detailLevel

#### Scenario: Schedule type validation
- **WHEN** insight data is received from the API
- **THEN** schedule field is validated against InsightScheduleSchema with enabled, frequency, time, and day fields

#### Scenario: Delivery config type validation
- **WHEN** insight data is received from the API
- **THEN** delivery field is validated against InsightDeliverySchema with format, channels, and recipients

#### Scenario: Connector data type validation
- **WHEN** insight data is received from the API
- **THEN** connectors array is validated against InsightConnectorSchema with connectorId, connectorName, and metrics

#### Scenario: Zero type assertions in production code
- **WHEN** TypeScript compilation runs
- **THEN** no `as` type assertions exist in production code (only in test files allowed)

#### Scenario: Runtime type guard for API responses
- **WHEN** API response is received
- **THEN** Zod schema validation runs before data is used in components
