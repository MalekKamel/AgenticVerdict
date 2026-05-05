## ADDED Requirements

### Requirement: Versioned report content storage
The system SHALL store report content with version tracking, supporting multiple versions per report with format-specific files (PDF, Excel).

#### Scenario: Upload first version
- **WHEN** uploading content for a new report
- **THEN** the content is stored at `tenants/{tenantId}/reports/{reportId}/v1.{format}` and version metadata is added to report record

#### Scenario: Upload subsequent version
- **WHEN** uploading content for an existing report
- **THEN** the content is stored at `tenants/{tenantId}/reports/{reportId}/v{version}.{format}` and version metadata is appended

#### Scenario: Multiple formats per version
- **WHEN** uploading both PDF and Excel formats for same version
- **THEN** separate files are stored (`v1.pdf`, `v1.xlsx`) with shared version metadata

### Requirement: Report content download with version selection
The system SHALL allow downloading report content by report ID, format, and optional version number.

#### Scenario: Download latest version
- **WHEN** requesting report content without specifying version
- **THEN** the latest available version is returned

#### Scenario: Download specific version
- **WHEN** requesting report content with explicit version number
- **THEN** the specified version is returned if available

#### Scenario: Version not found
- **WHEN** requesting a non-existent version
- **THEN** the operation throws `StorageNotFoundError` with version details

### Requirement: Report content integrity verification
The system SHALL verify content integrity using SHA-256 hashes stored in report metadata.

#### Scenario: Upload calculates SHA-256
- **WHEN** uploading report content
- **THEN** SHA-256 hash is calculated and stored in both S3 metadata and report version metadata

#### Scenario: Download verifies SHA-256
- **WHEN** downloading report content
- **THEN** the downloaded content's SHA-256 is compared against stored hash and mismatch throws error

### Requirement: Report deletion cascades to storage
The system SHALL delete all report content from SeaweedFS when a report is deleted from the database.

#### Scenario: Delete report with content
- **WHEN** a report is deleted (soft or hard delete)
- **THEN** all versions and formats are deleted from SeaweedFS storage

#### Scenario: Delete specific version
- **WHEN** a specific report version is deleted
- **THEN** only that version's files are removed from storage

### Requirement: Report status reflects content availability
The system SHALL update report status based on content upload completion.

#### Scenario: Content upload completes
- **WHEN** report content is successfully uploaded to SeaweedFS
- **THEN** report status is updated to `ready`

#### Scenario: Content upload fails
- **WHEN** report content upload fails
- **THEN** report status remains `processing` or transitions to `failed` with error details
