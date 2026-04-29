## Purpose
Define the canonical core error model and shared utilities that standardize fault normalization and typed error handling across runtime surfaces.

## Requirements

### Requirement: Canonical fault contract
The system MUST define a shared canonical fault contract that includes a strict error code, category, surface, retryability, safe message, and optional structured details.

#### Scenario: Normalizing unknown errors
- **WHEN** a runtime surface receives an unknown thrown value
- **THEN** the system SHALL convert it into the canonical fault contract using deterministic fallback metadata

### Requirement: Typed error code registry
The system MUST maintain a centrally owned, typed registry of error codes and MUST reject unregistered runtime codes in guarded environments.

#### Scenario: Using an unregistered code
- **WHEN** a developer introduces an error code that is not present in the registry
- **THEN** validation and quality checks SHALL fail with actionable feedback

### Requirement: Fault type guard and adapter APIs
The system MUST provide a type guard and adapter utilities that allow all consuming modules to detect and convert canonical faults without using message-string inspection.

#### Scenario: Handling mixed native and canonical errors
- **WHEN** a service catches either native errors or canonical faults
- **THEN** the service SHALL use adapter utilities to produce one canonical representation
