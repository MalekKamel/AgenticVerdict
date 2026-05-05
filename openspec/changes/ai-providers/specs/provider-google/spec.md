## ADDED Requirements

### Requirement: Google Generative AI Integration
The system SHALL integrate with Google Generative AI SDK for Gemini model access.

#### Scenario: Initialize Google AI client
- **WHEN** the Google provider is instantiated with an API key
- **THEN** the GoogleGenerativeAI client SHALL be initialized with the provided key

#### Scenario: Chat with Gemini model
- **WHEN** a chat request is made with a Gemini model ID
- **THEN** the request SHALL be sent to Google's Generative AI API

#### Scenario: Handle Gemini response
- **WHEN** Google returns a response
- **THEN** it SHALL be converted to the unified response format

### Requirement: Google Multimodal Support
The system SHALL support multimodal inputs (text, images) for Gemini models.

#### Scenario: Send text input
- **WHEN** a chat request includes only text
- **THEN** it SHALL be sent as a text part to Google

#### Scenario: Send image input
- **WHEN** a chat request includes an image
- **THEN** it SHALL be converted to Google's inline_data format (base64)

#### Scenario: Send multimodal input
- **WHEN** a chat request includes both text and images
- **THEN** parts SHALL be sent as an array of text and inline_data parts

### Requirement: Google Streaming Support
The system SHALL implement streaming for Google Generative AI responses.

#### Scenario: Stream Gemini response
- **WHEN** streaming is enabled for a Google chat request
- **THEN** the response SHALL be streamed as chunks using Google's streaming API

#### Scenario: Handle stream completion
- **WHEN** a Google stream completes
- **THEN** usage statistics SHALL be extracted if available

### Requirement: Google Error Mapping
The system SHALL map Google-specific errors to canonical error codes.

#### Scenario: Invalid API key
- **WHEN** Google returns an authentication error
- **THEN** it SHALL be mapped to `INVALID_API_KEY`

#### Scenario: Invalid model
- **WHEN** Google returns an error for an invalid model ID
- **THEN** it SHALL be mapped to `MODEL_NOT_FOUND`

#### Scenario: Quota exceeded
- **WHEN** Google returns a quota exceeded error
- **THEN** it SHALL be mapped to `INSUFFICIENT_QUOTA`
