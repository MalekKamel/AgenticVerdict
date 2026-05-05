## ADDED Requirements

### Requirement: OpenAI Chat Completion
The system SHALL implement chat completion with streaming support for OpenAI models.

#### Scenario: Non-streaming chat completion
- **WHEN** a chat request is made with `stream: false`
- **THEN** the full response SHALL be returned as a single message

#### Scenario: Streaming chat completion
- **WHEN** a chat request is made with `stream: true`
- **THEN** the response SHALL be returned as an async iterable stream of chunks

#### Scenario: Chat with system message
- **WHEN** a chat request includes a system message
- **THEN** the system message SHALL be passed to OpenAI as the system role

#### Scenario: Chat with tool definitions
- **WHEN** a chat request includes tool definitions
- **THEN** tools SHALL be passed to OpenAI and tool calls SHALL be handled appropriately

### Requirement: OpenAI Vision Support
The system SHALL support multimodal inputs (text + images) for OpenAI vision-capable models.

#### Scenario: Chat with image attachment
- **WHEN** a chat request includes an image URL or base64-encoded image
- **THEN** the image SHALL be formatted according to OpenAI vision API requirements

#### Scenario: Vision model detection
- **WHEN** a chat request is made with a vision-capable model
- **THEN** image inputs SHALL be allowed; for non-vision models, images SHALL be rejected

### Requirement: OpenAI Model Discovery
The system SHALL fetch and cache the list of available OpenAI models.

#### Scenario: Fetch model list
- **WHEN** `models()` is called on the OpenAI provider
- **THEN** the system SHALL fetch the list of available models from OpenAI API

#### Scenario: Cache model list with TTL
- **WHEN** the model list is fetched
- **THEN** it SHALL be cached with a TTL of 1 hour to reduce API calls

#### Scenario: Include model metadata
- **WHEN** models are returned
- **THEN** each model SHALL include: id, name, context window, capabilities (chat, vision, tools), pricing

### Requirement: OpenAI Error Mapping
The system SHALL map OpenAI-specific errors to canonical error codes.

#### Scenario: Invalid API key error
- **WHEN** OpenAI returns a 401 error
- **THEN** the error SHALL be mapped to `INVALID_API_KEY`

#### Scenario: Rate limit error
- **WHEN** OpenAI returns a 429 error
- **THEN** the error SHALL be mapped to `RATE_LIMIT_EXCEEDED`

#### Scenario: Context length exceeded
- **WHEN** OpenAI returns an error indicating context length exceeded
- **THEN** the error SHALL be mapped to `CONTEXT_LENGTH_EXCEEDED`

### Requirement: OpenAI Streaming Protocol
The system SHALL implement a unified streaming protocol for OpenAI responses.

#### Scenario: Stream text deltas
- **WHEN** streaming a chat response
- **THEN** each chunk SHALL include the text delta and cumulative content

#### Scenario: Stream tool calls
- **WHEN** the model invokes a tool during streaming
- **THEN** tool call information SHALL be included in the stream chunks

#### Scenario: Stream usage information
- **WHEN** the stream completes
- **THEN** the final chunk SHALL include token usage information (input, output, total)
