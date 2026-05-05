## ADDED Requirements

### Requirement: Per-Tenant Rate Limiting
The system SHALL enforce rate limits on a per-tenant basis.

#### Scenario: Check rate limit
- **WHEN** a request is made by a tenant
- **THEN** the system SHALL check if the tenant has exceeded their rate limit

#### Scenario: Enforce requests per minute
- **WHEN** a tenant exceeds their requests per minute limit
- **THEN** the request SHALL be rejected with a 429 error

#### Scenario: Enforce tokens per minute
- **WHEN** a tenant exceeds their tokens per minute limit
- **THEN** the request SHALL be rejected with a 429 error

#### Scenario: Redis-backed counters
- **WHEN** rate limit counters are incremented
- **THEN** they SHALL be stored in Redis for distributed enforcement

### Requirement: Per-Provider Rate Limits
The system SHALL support different rate limits per provider.

#### Scenario: Configure provider-specific limits
- **WHEN** rate limits are configured
- **THEN** different providers SHALL have different limits per tenant

#### Scenario: Check provider-specific limit
- **WHEN** a request is made to a specific provider
- **THEN** the rate limit for that tenant-provider combination SHALL be checked

### Requirement: Rate Limit Headers
The system SHALL return rate limit headers in responses.

#### Scenario: Return remaining requests
- **WHEN** a request succeeds
- **THEN** the response SHALL include `X-RateLimit-Remaining` header

#### Scenario: Return retry after
- **WHEN** a request is rate limited
- **THEN** the response SHALL include `Retry-After` header with seconds to wait

### Requirement: 429 Error Handling
The system SHALL handle rate limit errors appropriately.

#### Scenario: Return 429 status code
- **WHEN** a rate limit is exceeded
- **THEN** a 429 Too Many Requests error SHALL be returned

#### Scenario: Map to canonical error
- **WHEN** a 429 error occurs
- **THEN** it SHALL be mapped to `RATE_LIMIT_EXCEEDED` error code

#### Scenario: Include retry information
- **WHEN** a 429 error is returned
- **THEN** it SHALL include information about when to retry
