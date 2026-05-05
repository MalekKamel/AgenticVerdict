## ADDED Requirements

### Requirement: Storage operation metrics
The system SHALL expose Prometheus metrics for all storage operations with tenant-scoped labels.

#### Scenario: Upload duration metric recorded
- **WHEN** an upload operation completes
- **THEN** `storage_upload_duration_seconds` histogram is updated with `tenantId`, `operation`, and `outcome` labels

#### Scenario: Download duration metric recorded
- **WHEN** a download operation completes
- **THEN** `storage_download_duration_seconds` histogram is updated with `tenantId`, `operation`, and `outcome` labels

#### Scenario: Bytes transferred counters
- **WHEN** data is uploaded or downloaded
- **THEN** `storage_bytes_uploaded_total` and `storage_bytes_downloaded_total` counters are incremented with `tenantId` label

#### Scenario: Error metric recorded
- **WHEN** a storage operation fails
- **THEN** `storage_errors_total` counter is incremented with `tenantId`, `error_type`, and `operation` labels

### Requirement: Structured storage logging
The system SHALL log all storage operations with tenant context and operation details.

#### Scenario: Successful upload logged
- **WHEN** a file is uploaded successfully
- **THEN** an INFO log is written with `tenantId`, `requestId`, `objectKey`, `byteLength`, `sha256`, `durationMs`, and `operation` fields

#### Scenario: Failed upload logged
- **WHEN** a file upload fails
- **THEN** an ERROR log is written with `tenantId`, `requestId`, `objectKey`, `durationMs`, `operation`, and `error` fields

#### Scenario: Successful download logged
- **WHEN** a file is downloaded successfully
- **THEN** an INFO log is written with `tenantId`, `requestId`, `objectKey`, `byteLength`, `durationMs`, and `operation` fields

#### Scenario: Credentials excluded from logs
- **WHEN** any storage operation is logged
- **THEN** access keys, secrets, and tokens are NEVER included in log fields

### Requirement: Audit trail for storage operations
The system SHALL record all storage operations in the audit trail with tenant and user context.

#### Scenario: Upload audit trail entry
- **WHEN** a file is uploaded successfully
- **THEN** an audit trail entry is created with `tenantId`, `reportId` (if applicable), `actorSub`, `action='content.upload'`, `eventType='content_uploaded'`, `status='success'`, and metadata including `version`, `sha256`, `storageKey`, `storageProvider`

#### Scenario: Download audit trail entry
- **WHEN** a file is downloaded
- **THEN** an audit trail entry is created with `tenantId`, `reportId`, `actorSub`, `action='content.download'`, `eventType='content_downloaded'`, `status='success'`, and metadata

#### Scenario: Failed operation audit trail
- **WHEN** a storage operation fails
- **THEN** an audit trail entry is created with `status='failure'` and error details in metadata

### Requirement: Health check endpoint integration
The system SHALL expose SeaweedFS health status via service health endpoints.

#### Scenario: API health includes storage status
- **WHEN** `/health` endpoint is called
- **THEN** response includes `storage` field with SeaweedFS health status

#### Scenario: Unhealthy storage reported
- **WHEN** SeaweedFS is unreachable
- **THEN** health endpoint returns degraded status with storage error details
