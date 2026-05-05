## ADDED Requirements

### Requirement: Tenant-scoped object upload
The system SHALL upload objects to tenant-isolated storage with path-based scoping and SHA-256 integrity verification.

#### Scenario: Successful upload with valid tenant context
- **WHEN** a service uploads a file with a valid tenant ID matching AsyncLocalStorage context
- **THEN** the object is stored at key `tenants/{tenantId}/{key}` with SHA-256 hash in metadata

#### Scenario: Upload rejected with tenant mismatch
- **WHEN** a service attempts upload with tenant ID different from AsyncLocalStorage context
- **THEN** the operation throws `TenantSecurityError` and no object is stored

#### Scenario: Upload includes audit metadata
- **WHEN** an object is uploaded successfully
- **THEN** the S3 metadata includes `tenant-id`, `sha256`, `uploaded-at`, and `uploaded-by` fields

### Requirement: Tenant-scoped object download
The system SHALL download objects from tenant-isolated storage with integrity verification and content-type preservation.

#### Scenario: Successful download with valid tenant context
- **WHEN** a service requests download of an existing object with valid tenant ID
- **THEN** the system returns the object content, content-type, byte length, and last modified date

#### Scenario: Download rejected for missing object
- **WHEN** a service requests download of a non-existent object
- **THEN** the operation throws `StorageNotFoundError`

#### Scenario: Download rejected with tenant mismatch
- **WHEN** a service attempts download with tenant ID different from AsyncLocalStorage context
- **THEN** the operation throws `TenantSecurityError` without checking object existence

### Requirement: Object existence check
The system SHALL verify object existence without downloading content.

#### Scenario: Object exists
- **WHEN** checking existence of an uploaded object
- **THEN** the operation returns `true`

#### Scenario: Object does not exist
- **WHEN** checking existence of a non-existent object
- **THEN** the operation returns `false`

### Requirement: Tenant-scoped object deletion
The system SHALL delete objects from tenant-isolated storage with audit trail.

#### Scenario: Successful deletion
- **WHEN** a service deletes an existing object with valid tenant context
- **THEN** the object is removed from storage and no error is thrown

#### Scenario: Deletion of non-existent object
- **WHEN** a service attempts to delete a non-existent object
- **THEN** the operation completes without error (idempotent behavior)

### Requirement: Storage health check
The system SHALL provide a non-blocking health check for storage backend availability.

#### Scenario: Storage backend is healthy
- **WHEN** SeaweedFS S3 API is accessible and responsive
- **THEN** `isHealthy()` returns `true` within 5 seconds

#### Scenario: Storage backend is unhealthy
- **WHEN** SeaweedFS S3 API is unreachable or returns errors
- **THEN** `isHealthy()` returns `false` and logs error without throwing
