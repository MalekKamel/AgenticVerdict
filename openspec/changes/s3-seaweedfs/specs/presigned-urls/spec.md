## ADDED Requirements

### Requirement: Presigned URL generation for downloads
The system SHALL generate time-limited presigned URLs for direct browser downloads from SeaweedFS.

#### Scenario: Generate presigned GET URL
- **WHEN** a service requests a presigned URL with `operation='get'` and valid expiration time
- **THEN** a signed URL is returned that allows direct download without server proxying

#### Scenario: Presigned URL expiration
- **WHEN** a presigned URL is used after its expiration time
- **THEN** the request is rejected with 403 Forbidden by SeaweedFS

#### Scenario: Maximum expiration enforced
- **WHEN** requesting presigned URL with `expiresInSeconds > 604800` (7 days)
- **THEN** the operation throws `StoragePresignedUrlError` with validation message

### Requirement: Presigned URL generation for uploads
The system SHALL generate time-limited presigned URLs for direct browser uploads to tenant-scoped storage.

#### Scenario: Generate presigned PUT URL
- **WHEN** a service requests a presigned URL with `operation='put'`, content type, and valid expiration
- **THEN** a signed URL is returned that allows direct upload with specified content type

#### Scenario: Upload enforces content type
- **WHEN** uploading via presigned PUT URL with different content type than specified
- **THEN** the upload is rejected by SeaweedFS

#### Scenario: Tenant isolation enforced
- **WHEN** generating presigned URL
- **THEN** the URL is scoped to `tenants/{tenantId}/...` path based on tenant context

### Requirement: Presigned URL error handling
The system SHALL handle presigned URL generation failures with appropriate error types.

#### Scenario: Invalid tenant context
- **WHEN** generating presigned URL with tenant ID mismatch
- **THEN** the operation throws `TenantSecurityError`

#### Scenario: URL generation failure
- **WHEN** AWS SDK presigner fails to generate URL
- **THEN** the operation throws `StoragePresignedUrlError` with underlying cause
