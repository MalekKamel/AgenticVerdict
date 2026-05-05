## Why

AgenticVerdict currently lacks a production-ready, scalable object storage solution for reports, exports, and file uploads. The existing in-memory and file-system backends are insufficient for multi-tenant production deployments, creating a critical blocker identified in the Phase 1 remediation plan. This change adopts SeaweedFS S3-compatible storage to provide tenant-isolated, scalable file storage with full data sovereignty control.

## What Changes

- **New S3-compatible storage adapter** in `packages/core/src/storage/` with tenant isolation enforcement
- **SeaweedFS Docker service** added to `docker-compose.yml` for local development and production
- **Storage factory pattern** supporting multiple providers (seaweedfs, memory) with environment-based configuration
- **tRPC router integration** for report upload/download operations with audit trail
- **Worker service integration** for async file processing and report generation
- **Presigned URL generation** for direct browser uploads (future phase)
- **Prometheus metrics and structured logging** for storage observability
- **Comprehensive test suite** with unit, integration, and tenant isolation tests

## Capabilities

### New Capabilities

- `object-storage`: Core tenant-scoped object storage interface with S3 implementation, error types, and tenant isolation enforcement
- `seaweedfs-integration`: SeaweedFS S3 API integration including Docker configuration, health checks, and environment setup
- `storage-observability`: Prometheus metrics, structured logging, and audit trail for all storage operations
- `presigned-urls`: Time-limited presigned URL generation for direct browser uploads and downloads

### Modified Capabilities

- `reports`: Report content storage now uses SeaweedFS instead of in-memory/filesystem backend; adds versioned content storage with SHA-256 integrity verification

## Impact

**Affected Systems:**

- `packages/core/src/storage/` - New storage adapter layer
- `apps/api/src/trpc/routers/reports.ts` - tRPC router integration
- `apps/worker/src/` - Worker service file handling
- `docker-compose.yml` - SeaweedFS service addition
- `.env.docker` - New storage configuration variables
- `Makefile` - New SeaweedFS management targets

**Dependencies:**

- AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
- SeaweedFS Docker image (`chrislusf/seaweedfs:latest`)
- Existing tenant context propagation (AsyncLocalStorage)
- Canonical error system (`packages/core/src/error-system/`)

**Breaking Changes:**

- **BREAKING**: Filesystem storage provider deprecated; migration to SeaweedFS required for production deployments
- **BREAKING**: Storage configuration now requires `STORAGE_PROVIDER`, `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` environment variables
