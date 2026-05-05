## ADDED Requirements

### Requirement: OpenAI-Compatible Provider Factory
The system SHALL provide a factory function to create providers for OpenAI-compatible APIs.

#### Scenario: Create provider with custom baseURL
- **WHEN** `createOpenAICompatibleProvider()` is called with a providerId and baseURL
- **THEN** it SHALL return a provider class that uses the OpenAI SDK with the custom baseURL

#### Scenario: Configure provider capabilities
- **WHEN** creating an OpenAI-compatible provider
- **THEN** capabilities (chat, vision, tools) SHALL be configurable per provider

#### Scenario: Create DeepSeek provider
- **WHEN** the factory is used to create a DeepSeek provider
- **THEN** it SHALL use baseURL "https://api.deepseek.com/v1"

#### Scenario: Create Groq provider
- **WHEN** the factory is used to create a Groq provider
- **THEN** it SHALL use baseURL "https://api.groq.com/openai/v1"

#### Scenario: Create Mistral provider
- **WHEN** the factory is used to create a Mistral provider
- **THEN** it SHALL use baseURL "https://api.mistral.ai/v1"

### Requirement: Reuse OpenAI Provider Logic
The system SHALL reuse chat, embeddings, and other logic from the OpenAI provider implementation.

#### Scenario: Chat implementation
- **WHEN** an OpenAI-compatible provider receives a chat request
- **THEN** it SHALL use the same chat implementation as the OpenAI provider

#### Scenario: Streaming implementation
- **WHEN** streaming is enabled
- **THEN** it SHALL use the same streaming protocol as OpenAI

#### Scenario: Error handling
- **WHEN** an error occurs
- **THEN** it SHALL be handled using OpenAI error mapping with provider-specific overrides

### Requirement: Provider-Specific Overrides
The system SHALL allow provider-specific customizations while reusing base logic.

#### Scenario: Custom error mapping
- **WHEN** a provider has unique error codes
- **THEN** the provider SHALL override the default error mapping

#### Scenario: Custom model discovery
- **WHEN** a provider has a custom model list endpoint
- **THEN** the provider SHALL override the default model discovery

#### Scenario: Custom headers
- **WHEN** a provider requires custom authentication headers
- **THEN** the provider SHALL add custom headers to requests
