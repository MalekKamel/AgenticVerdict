## ADDED Requirements

### Requirement: Provider Registration
The system SHALL support dynamic registration of AI providers at application startup, enabling runtime discovery without code modifications.

#### Scenario: Provider registration at startup
- **WHEN** the application initializes
- **THEN** all configured providers (openai, anthropic, google, bedrock, openai-compatible) are registered in the ProviderRegistry

#### Scenario: Provider lookup by ID
- **WHEN** a component requests a provider by ID
- **THEN** the ProviderFactory returns the registered provider instance or throws ProviderNotFoundError

#### Scenario: List available providers
- **WHEN** a component calls ProviderFactory.listProviders()
- **THEN** the system returns an array of all registered provider IDs

### Requirement: Provider Health Status
The system SHALL track provider health status to enable intelligent failover decisions.

#### Scenario: Provider health check
- **WHEN** a provider operation fails with a retryable error
- **THEN** the provider health status is updated to reflect the failure

#### Scenario: Circuit breaker open
- **WHEN** a provider exceeds failure threshold within time window
- **THEN** the circuit breaker opens and requests fail fast without attempting the provider

### Requirement: Dynamic Provider Validation
The system SHALL validate provider references against the registry to prevent configuration errors.

#### Scenario: Valid provider in API request
- **WHEN** an API request includes a provider ID that exists in the registry
- **THEN** the request passes validation and proceeds

#### Scenario: Invalid provider in API request
- **WHEN** an API request includes a provider ID not in the registry
- **THEN** the request fails validation with "Provider not available" error
