## ADDED Requirements

### Requirement: SeaweedFS S3 API configuration
The system SHALL configure SeaweedFS S3-compatible storage with environment-based credentials and endpoint settings.

#### Scenario: Local development configuration
- **WHEN** `STORAGE_PROVIDER=seaweedfs` and `STORAGE_ENDPOINT=http://seaweedfs:8333`
- **THEN** the S3 client connects to local SeaweedFS instance with path-style addressing

#### Scenario: Production configuration
- **WHEN** `STORAGE_ENDPOINT` points to production SeaweedFS URL with HTTPS
- **THEN** the S3 client uses secure connection with production credentials

#### Scenario: Missing required configuration
- **WHEN** `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, or `STORAGE_SECRET_KEY` is not set
- **THEN** the storage factory throws an error with clear message about missing variable

### Requirement: SeaweedFS Docker service
The system SHALL include SeaweedFS as a Docker Compose service with persistent storage and health checks.

#### Scenario: SeaweedFS starts successfully
- **WHEN** running `docker compose up -d seaweedfs`
- **THEN** SeaweedFS container starts with S3 API on port 8333 and Filer UI on port 8888

#### Scenario: SeaweedFS health check passes
- **WHEN** SeaweedFS is running and healthy
- **THEN** health check endpoint `http://localhost:8333/` returns 200 OK within 10 seconds

#### Scenario: Persistent storage configured
- **WHEN** SeaweedFS container restarts
- **THEN** previously uploaded objects remain accessible (data persists in volume)

### Requirement: SeaweedFS S3 configuration file
The system SHALL configure SeaweedFS S3 credentials via JSON configuration file.

#### Scenario: Default credentials loaded
- **WHEN** SeaweedFS starts with `/etc/seaweedfs/s3.json`
- **THEN** S3 API accepts requests with configured `ident` (access key) and `secret`

#### Scenario: Production secret generation
- **WHEN** running `make setup`
- **THEN** a secure random secret is generated and stored in `.env.docker`

### Requirement: Storage provider factory
The system SHALL instantiate the correct storage provider based on environment configuration.

#### Scenario: SeaweedFS provider selected
- **WHEN** `STORAGE_PROVIDER=seaweedfs`
- **THEN** `createObjectStorageFromEnv()` returns `S3ObjectStorage` instance

#### Scenario: Memory provider selected
- **WHEN** `STORAGE_PROVIDER=memory` or not set
- **THEN** `createObjectStorageFromEnv()` returns `MemoryObjectStorage` instance

#### Scenario: Unknown provider
- **WHEN** `STORAGE_PROVIDER` is set to an unsupported value
- **THEN** the factory throws an error with list of supported providers

### Requirement: SeaweedFS management Makefile targets
The system SHALL provide Makefile targets for common SeaweedFS operations.

#### Scenario: Start SeaweedFS
- **WHEN** running `make seaweedfs-up`
- **THEN** SeaweedFS container starts in detached mode

#### Scenario: View SeaweedFS logs
- **WHEN** running `make seaweedfs-logs`
- **THEN** SeaweedFS container logs are displayed in follow mode

#### Scenario: SeaweedFS shell access
- **WHEN** running `make seaweedfs-shell`
- **THEN** interactive SeaweedFS shell session is opened
