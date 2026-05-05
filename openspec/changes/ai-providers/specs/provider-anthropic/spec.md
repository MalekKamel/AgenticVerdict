## ADDED Requirements

### Requirement: Anthropic Message Format
The system SHALL convert between OpenAI message format and Anthropic message format for chat completions.

#### Scenario: Convert user messages
- **WHEN** an OpenAI-format user message is provided
- **THEN** it SHALL be converted to Anthropic's message format with role "user"

#### Scenario: Convert assistant messages
- **WHEN** an OpenAI-format assistant message is provided
- **THEN** it SHALL be converted to Anthropic's message format with role "assistant"

#### Scenario: Convert system message
- **WHEN** an OpenAI-format system message is provided
- **THEN** it SHALL be passed as the `system` parameter in Anthropic API (not as a message)

### Requirement: Anthropic Streaming Support
The system SHALL implement streaming for Anthropic chat completions.

#### Scenario: Stream text content blocks
- **WHEN** streaming an Anthropic response
- **THEN** text content blocks SHALL be streamed as deltas

#### Scenario: Stream tool use blocks
- **WHEN** Anthropic invokes a tool during streaming
- **THEN** tool use information SHALL be streamed with input deltas

#### Scenario: Handle stream completion
- **WHEN** an Anthropic stream completes
- **THEN** the final message SHALL include usage statistics and stop reason

### Requirement: Anthropic Vision Support
The system SHALL support image inputs for Anthropic vision-capable models (Claude 3+).

#### Scenario: Convert image content
- **WHEN** a message includes an image
- **THEN** it SHALL be converted to Anthropic's image content block format (base64 or URL)

#### Scenario: Multimodal conversation
- **WHEN** a conversation includes both text and images
- **THEN** content blocks SHALL alternate between text and image types appropriately

### Requirement: Anthropic Tool Use
The system SHALL support tool definitions and tool use for Anthropic models.

#### Scenario: Define tools for Anthropic
- **WHEN** tools are provided in a chat request
- **THEN** they SHALL be converted to Anthropic's tool definition format

#### Scenario: Handle tool use response
- **WHEN** Anthropic returns a tool use request
- **THEN** the tool call SHALL be extracted and formatted for execution

#### Scenario: Continue conversation after tool use
- **WHEN** tool results are provided back to Anthropic
- **THEN** they SHALL be formatted as tool_result content blocks

### Requirement: Anthropic Error Mapping
The system SHALL map Anthropic-specific errors to canonical error codes.

#### Scenario: Invalid API key
- **WHEN** Anthropic returns an authentication error
- **THEN** it SHALL be mapped to `INVALID_API_KEY`

#### Scenario: Rate limit exceeded
- **WHEN** Anthropic returns a 429 error
- **THEN** it SHALL be mapped to `RATE_LIMIT_EXCEEDED`

#### Scenario: Invalid request
- **WHEN** Anthropic returns a 400 error for invalid request format
- **THEN** it SHALL be mapped to `PROVIDER_ERROR` with appropriate message
