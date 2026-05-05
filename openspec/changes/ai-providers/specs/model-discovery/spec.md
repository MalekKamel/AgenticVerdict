## ADDED Requirements

### Requirement: Dynamic Model List Fetching
The system SHALL fetch available models from each provider dynamically.

#### Scenario: Fetch models from provider
- **WHEN** `discoverModels()` is called with a provider ID
- **THEN** the system SHALL call the provider's `models()` method to fetch available models

#### Scenario: Cache discovered models
- **WHEN** models are fetched from a provider
- **THEN** they SHALL be cached with a TTL of 1 hour

#### Scenario: Handle providers without model discovery
- **WHEN** a provider does not support model discovery
- **THEN** an empty array SHALL be returned

#### Scenario: Refresh cached models
- **WHEN** the cache TTL expires
- **THEN** the next request SHALL refresh the model list from the provider

### Requirement: Model Capability Detection
The system SHALL detect and cache model capabilities.

#### Scenario: Detect chat capability
- **WHEN** a model is discovered
- **THEN** its chat capability SHALL be detected and stored

#### Scenario: Detect vision capability
- **WHEN** a model is discovered
- **THEN** its vision capability SHALL be detected and stored

#### Scenario: Detect tool use capability
- **WHEN** a model is discovered
- **THEN** its tool use capability SHALL be detected and stored

#### Scenario: Detect context window
- **WHEN** a model is discovered
- **THEN** its context window size SHALL be detected and stored

### Requirement: Model Metadata
The system SHALL store comprehensive metadata for each model.

#### Scenario: Store model pricing
- **WHEN** a model is discovered
- **THEN** its pricing (input per 1K tokens, output per 1K tokens) SHALL be stored

#### Scenario: Store model provider mapping
- **WHEN** a model is discovered
- **THEN** its provider ID SHALL be stored for routing

#### Scenario: Store model aliases
- **WHEN** a model has common aliases
- **THEN** aliases SHALL be mapped to the canonical model ID

### Requirement: UI Integration Support
The system SHALL provide APIs for UI to display available models.

#### Scenario: List models by capability
- **WHEN** the UI requests models with a specific capability
- **THEN** only models with that capability SHALL be returned

#### Scenario: Filter models by provider
- **WHEN** the UI requests models from a specific provider
- **THEN** only models from that provider SHALL be returned

#### Scenario: Get model details
- **WHEN** the UI requests details for a specific model
- **THEN** full model metadata SHALL be returned
