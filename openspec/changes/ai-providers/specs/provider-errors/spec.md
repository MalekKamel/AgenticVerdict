## ADDED Requirements

### Requirement: Canonical Error Code Enum
The system SHALL define a comprehensive `AgentRuntimeErrorCode` enum covering all error scenarios across providers.

#### Scenario: Authentication errors
- **WHEN** a provider returns an authentication error
- **THEN** the error SHALL be mapped to one of: `INVALID_API_KEY`, `EXPIRED_API_KEY`, or `TENANT_UNAUTHORIZED`

#### Scenario: Provider errors
- **WHEN** a provider returns a service error
- **THEN** the error SHALL be mapped to one of: `PROVIDER_ERROR`, `INSUFFICIENT_QUOTA`, or `RATE_LIMIT_EXCEEDED`

#### Scenario: Model errors
- **WHEN** a provider returns a model-related error
- **THEN** the error SHALL be mapped to one of: `MODEL_NOT_FOUND` or `CONTEXT_LENGTH_EXCEEDED`

#### Scenario: Network errors
- **WHEN** a network error occurs during provider communication
- **THEN** the error SHALL be mapped to one of: `NETWORK_ERROR` or `TIMEOUT`

### Requirement: Error Class with Metadata
The system SHALL implement an `AgentRuntimeError` class that includes comprehensive error metadata.

#### Scenario: Create error with full metadata
- **WHEN** an error is instantiated
- **THEN** it SHALL include: code, message, providerId, tenantId (optional), endpoint (optional), statusCode (optional)

#### Scenario: Error serialization
- **WHEN** an error is serialized to JSON
- **THEN** all metadata fields SHALL be included except sensitive information (API keys, credentials)

#### Scenario: Error cause preservation
- **WHEN** an error is created with an underlying cause
- **THEN** the original error SHALL be preserved in the `cause` property for debugging

### Requirement: Provider-Specific Error Translators
Each provider implementation SHALL include an error translator that maps provider-specific errors to canonical codes.

#### Scenario: Translate OpenAI authentication error
- **WHEN** OpenAI returns a 401 error with "Invalid API key"
- **THEN** the translator SHALL map this to `INVALID_API_KEY` with providerId="openai"

#### Scenario: Translate Anthropic rate limit error
- **WHEN** Anthropic returns a 429 error
- **THEN** the translator SHALL map this to `RATE_LIMIT_EXCEEDED` with providerId="anthropic"

#### Scenario: Translate Google model not found error
- **WHEN** Google returns a 404 error for an invalid model
- **THEN** the translator SHALL map this to `MODEL_NOT_FOUND` with providerId="google"

#### Scenario: Preserve provider-specific error messages
- **WHEN** translating a provider error
- **THEN** the original provider error message SHALL be included in the translated error for debugging

### Requirement: Integration with Core Error System
The system SHALL integrate with `@agenticverdict/core` error-system for consistent error handling across the application.

#### Scenario: Error translation to frontend
- **WHEN** an `AgentRuntimeError` reaches the API boundary
- **THEN** it SHALL be translated to a frontend-compatible error format using the error-system translators

#### Scenario: Structured logging with error metadata
- **WHEN** an error is logged
- **THEN** the log entry SHALL include: tenantId, providerId, errorCode, statusCode, requestId

#### Scenario: Error tracking integration
- **WHEN** an error occurs
- **THEN** it SHALL be reported to Sentry (or configured error tracking service) with full context
