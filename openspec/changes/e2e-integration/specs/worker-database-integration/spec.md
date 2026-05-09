## ADDED Requirements

### Requirement: Worker database singleton
The worker SHALL initialize a database singleton using `createDatabaseClient()` from `@agenticverdict/database`. The singleton SHALL support health checks and graceful shutdown. The database connection SHALL be established before any queue processors start.

#### Scenario: Database initialized on worker startup
- **WHEN** the worker process starts
- **THEN** a database connection is established and verified via health check

#### Scenario: Database health check
- **WHEN** the worker health endpoint is called
- **THEN** it includes database connectivity status

#### Scenario: Graceful shutdown
- **WHEN** the worker receives a shutdown signal
- **THEN** the database connection is closed gracefully after in-flight jobs complete

### Requirement: Tenant config from database
The worker SHALL load tenant configuration from the database via `dbScoped()` with a fallback to disk-based config for backward compatibility. The tenant context from `AsyncLocalStorage` SHALL propagate to `dbScoped()` for all database operations.

#### Scenario: Tenant config loaded from DB
- **WHEN** a job is processed with a valid tenant ID
- **THEN** tenant configuration is fetched from the database using `dbScoped(tenantId)`

#### Scenario: Fallback to disk config
- **WHEN** database config is unavailable for a tenant
- **THEN** the worker falls back to disk-based config with a warning log

### Requirement: Credential store service
The worker SHALL provide a credential store service that queries the `platform_credentials` table via `dbScoped()` to fetch OAuth credentials by `tenantId` and `connectorType`. Credentials SHALL be decrypted before use. Missing credentials SHALL fall back to mock adapter with clear logging.

#### Scenario: Credentials fetched successfully
- **WHEN** the credential store is queried for a tenant's GA4 credentials
- **THEN** the encrypted credentials are fetched, decrypted, and returned

#### Scenario: Missing credentials fallback
- **WHEN** credentials are not found for a tenant and connector type
- **THEN** a mock adapter is returned with a warning log

#### Scenario: Credential fetch error
- **WHEN** the credential store encounters a database error
- **THEN** the error is surfaced as a job failure with actionable error message

### Requirement: Connector factory with real credentials
The `createWorkerPlatformFetchToolDeps()` function SHALL use the credential store to fetch real credentials instead of hardcoded mock tokens. Credential validation SHALL occur before adapter authentication.

#### Scenario: Real connector authentication
- **WHEN** a connector is created with valid credentials
- **THEN** the adapter authenticates with the real platform API

#### Scenario: Invalid credentials
- **WHEN** a connector is created with expired or invalid credentials
- **THEN** the adapter authentication fails and the job is marked as failed

### Requirement: Database environment requirement
The worker SHALL require `DATABASE_URL` as a mandatory environment variable. The worker SHALL fail to start if `DATABASE_URL` is not set.

#### Scenario: Missing DATABASE_URL
- **WHEN** the worker starts without `DATABASE_URL`
- **THEN** the worker exits with an error message indicating the missing environment variable
