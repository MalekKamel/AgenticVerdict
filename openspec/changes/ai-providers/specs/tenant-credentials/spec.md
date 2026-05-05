## ADDED Requirements

### Requirement: Tenant-Scoped Credential Storage
The system SHALL store API credentials scoped to individual tenants with complete isolation between tenants.

#### Scenario: Store tenant credentials
- **WHEN** credentials are saved for a tenant-provider pair
- **THEN** the credentials are encrypted at rest and associated with the tenant ID

#### Scenario: Retrieve tenant credentials
- **WHEN** credentials are requested for a specific tenant and provider
- **THEN** only the credentials belonging to that tenant are returned

#### Scenario: Prevent cross-tenant credential access
- **WHEN** a request is made to access credentials for tenant A using tenant B's context
- **THEN** the system SHALL return no credentials or throw an authorization error

#### Scenario: Credential encryption at rest
- **WHEN** credentials are stored in the database
- **THEN** the API key field SHALL be encrypted using AES-256-GCM or equivalent

#### Scenario: Credential metadata tracking
- **WHEN** credentials are created or updated
- **THEN** metadata fields (createdAt, updatedAt, lastUsedAt) SHALL be automatically maintained

### Requirement: Credential Rotation
The system SHALL support credential rotation with overlapping key periods to prevent service disruption.

#### Scenario: Rotate credentials with grace period
- **WHEN** credentials are rotated for a tenant-provider pair
- **THEN** both old and new keys SHALL be valid during the grace period (default 7 days)

#### Scenario: Automatic credential expiration
- **WHEN** the grace period expires after credential rotation
- **THEN** the old credential SHALL be automatically invalidated

#### Scenario: Credential rotation notification
- **WHEN** credentials are rotated
- **THEN** the tenant SHALL receive a notification 7 days before old credential expiration

### Requirement: AsyncLocalStorage Context Propagation
The system SHALL use Node.js `AsyncLocalStorage` to propagate tenant context throughout the request lifecycle.

#### Scenario: Set tenant context at request start
- **WHEN** a request arrives with a valid JWT
- **THEN** the tenant ID extracted from the JWT SHALL be set in `AsyncLocalStorage`

#### Scenario: Retrieve tenant context in nested calls
- **WHEN** code deep in the call stack requests the current tenant ID
- **THEN** the tenant ID set at request start SHALL be accessible without explicit parameter passing

#### Scenario: Fail if tenant context is missing
- **WHEN** code attempts to access tenant context outside a request scope
- **THEN** the system SHALL throw an error with message "Tenant context not found"

#### Scenario: Concurrent request isolation
- **WHEN** multiple requests from different tenants are processed concurrently
- **THEN** each request SHALL maintain its own tenant context without leakage
