## ADDED Requirements

### Requirement: HTTP boundary translation
HTTP handlers MUST translate all failures into a safe canonical response shape that includes stable error code metadata and correlation fields without exposing raw internal details.

#### Scenario: API route failure translation
- **WHEN** an API route throws a domain or infrastructure error
- **THEN** the HTTP boundary SHALL return the canonical error response contract for clients

### Requirement: tRPC boundary translation
tRPC handlers MUST map failures through the canonical translation path so error metadata remains consistent with HTTP and worker-facing contracts.

#### Scenario: tRPC mutation failure
- **WHEN** a tRPC procedure throws any error type
- **THEN** the formatter SHALL emit canonical code/category/retryability metadata through the configured tRPC error payload

### Requirement: Queue and worker failure translation
Queue producers and workers MUST emit machine-readable canonical failure payloads and MUST NOT branch behavior using raw message-string matching.

#### Scenario: Queue dependency unavailable
- **WHEN** queue infrastructure is unavailable during enqueue or job execution
- **THEN** queue boundaries SHALL emit the canonical queue-unavailable code and retryability semantics
