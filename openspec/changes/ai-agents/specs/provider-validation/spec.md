## ADDED Requirements

### Requirement: Dynamic Provider Validation in API
The system SHALL validate provider references in API requests against the registered providers at runtime.

#### Scenario: Valid provider in insight creation
- **WHEN** a client creates an insight with a provider ID from the registry
- **THEN** the API accepts the request and proceeds with validation

#### Scenario: Invalid provider in insight creation
- **WHEN** a client creates an insight with an unregistered provider ID
- **THEN** the API rejects the request with a 400 Bad Request and "Provider not available" error

#### Scenario: Provider validation on update
- **WHEN** a client updates an insight and changes the provider
- **THEN** the API validates the new provider against the registry

### Requirement: Schema Flexibility
The system SHALL accept any registered provider in API schemas instead of static enums.

#### Scenario: Schema accepts new provider without code change
- **WHEN** a new provider is registered at runtime
- **THEN** existing API schemas automatically accept the new provider without code modifications

#### Scenario: Schema rejects removed provider
- **WHEN** a provider is deregistered (hypothetical future scenario)
- **THEN** API schemas reject requests with the removed provider ID
