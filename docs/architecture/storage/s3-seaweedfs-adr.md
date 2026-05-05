# ADR: S3-Compatible Object Storage with SeaweedFS

**ADR ID:** ADR-007  
**Status:** Proposed  
**Date:** 2026-05-04  
**Author:** Engineering Team  
**Reviewers:** TBD  
**Replaces:** N/A (greenfield implementation)

---

## Summary

Adopt **SeaweedFS** as the S3-compatible object storage backend for AgenticVerdict, providing tenant-isolated file storage for reports, exports, uploads, and future file-based features.

---

## Context

### Current State

- Insights Reports UI implementation complete (`/openspec/changes/insights-reports/tasks.md`)
- Report content storage currently uses in-memory or file-system backend (`apps/api/src/services/report-blob-storage.ts`)
- No centralized, scalable object storage solution
- Phase 1 remediation plan (`/docs/audit/reports-remediation-phase-1.md`) identifies S3 storage as critical blocker

### Requirements

1. **Multi-tenant isolation:** Every file must be tenant-scoped with cryptographic verification
2. **S3 compatibility:** Leverage existing AWS SDK patterns, minimize custom code
3. **Self-hosted:** Full control over data residency, compliance, and costs
4. **Scalability:** Horizontal scaling for growing file storage needs
5. **Production-ready:** High availability, replication, backup support

### Constraints

- Greenfield implementation (no backward compatibility requirements)
- Destructive approach permitted (no database migrations)
- Must integrate with existing tenant context propagation (AsyncLocalStorage)
- Must follow existing adapter patterns from `packages/data-connectors/`

---

## Decision

### Chosen: SeaweedFS S3-Compatible API

**SeaweedFS** is an open-source distributed file system inspired by Facebook Haystack, optimized for small to large files with S3-compatible API.

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AgenticVerdict Platform                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  API Service │  │  Worker Svc  │  │   Frontend   │         │
│  │              │  │              │  │              │         │
│  │  @aws-sdk/   │  │  @aws-sdk/   │  │  Presigned   │         │
│  │  client-s3   │  │  client-s3   │  │  URLs        │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                  │
│         └─────────────────┼─────────────────┘                  │
│                           │                                    │
│                  ┌────────▼────────┐                           │
│                  │  Storage Adapter│                           │
│                  │  (S3Client)     │                           │
│                  └────────┬────────┘                           │
│                           │                                    │
└───────────────────────────┼────────────────────────────────────┘
                            │
                   ┌────────▼────────┐
                   │   SeaweedFS     │
                   │   S3 API        │
                   │   :8333         │
                   ├─────────────────┤
                   │  Filer UI       │
                   │  :8888          │
                   ├─────────────────┤
                   │  Volume Servers │
                   │  (replicated)   │
                   └────────┬────────┘
                            │
                   ┌────────▼────────┐
                   │  Persistent     │
                   │  Volumes        │
                   └─────────────────┘
```

#### Tenant Isolation Model

**Path-based isolation** (chosen over bucket-per-tenant):

```
tenants/{tenantId}/reports/{reportId}/v{version}.{format}
tenants/{tenantId}/exports/{exportId}.{format}
tenants/{tenantId}/uploads/{userId}/{fileId}
```

**Rationale:**

- Simpler operations (single bucket management)
- Lower memory footprint (no per-bucket overhead)
- Easier backup/restore (single bucket)
- Consistent with existing `report-blob-storage.ts` patterns

**Security enforcement:**

1. Tenant ID extracted from JWT → AsyncLocalStorage context
2. All storage operations prepend `tenants/{tenantId}/` to object keys
3. Tenant ID validated before any S3 operation
4. SHA-256 hash calculated on upload for integrity verification
5. Audit trail captures all storage operations with tenant context

---

## Alternatives Considered

### Option 1: AWS S3 (Managed Service)

**Pros:**

- Fully managed, zero operational overhead
- Global availability, built-in replication
- Mature ecosystem, extensive documentation

**Cons:**

- Egress fees ($0.09/GB)
- Data residency concerns (GDPR, local compliance)
- Vendor lock-in
- Higher long-term costs at scale

**Verdict:** Rejected due to data sovereignty requirements and cost concerns.

### Option 2: MinIO

**Pros:**

- S3-compatible, widely adopted
- Kubernetes-native, good operator support
- Strong consistency guarantees

**Cons:**

- Heavier resource requirements (memory, CPU)
- More complex operational model
- Over-engineered for current scale

**Verdict:** Considered, but SeaweedFS offers better performance for small files and simpler operations.

### Option 3: Continue with File System Storage

**Pros:**

- Zero dependencies, simplest implementation
- Already implemented (`FileSystemReportBlobStorage`)

**Cons:**

- No horizontal scalability
- Single point of failure
- No built-in replication or backup
- Difficult multi-node deployments

**Verdict:** Rejected. Acceptable for development, not production-ready.

### Option 4: Cloudflare R2

**Pros:**

- S3-compatible, zero egress fees
- Managed service, global CDN

**Cons:**

- Limited self-hosting options
- Data residency constraints
- Vendor dependency

**Verdict:** Rejected due to self-hosting requirement.

---

## Implementation Strategy

### Phase 1: Core Storage Adapter (Reports)

**Scope:** Replace `report-blob-storage.ts` with S3-backed implementation

**Deliverables:**

1. `apps/api/src/lib/storage/reports-storage.ts` - S3 storage adapter
2. Docker Compose SeaweedFS service
3. Environment configuration (`.env.docker.example`)
4. Unit + integration tests (85%+ coverage)

**Timeline:** 2-3 days

### Phase 2: Frontend Integration

**Scope:** Wire up report download/upload endpoints

**Deliverables:**

1. Update tRPC routers (`apps/api/src/trpc/routers/reports.ts`)
2. Frontend download logic (`apps/frontend/src/features/reports/`)
3. Error handling with canonical error system

**Timeline:** 1-2 days

### Phase 3: Extended Features

**Scope:** Exports, uploads, presigned URLs

**Deliverables:**

1. Generic storage adapter (`packages/core/src/storage/object-storage.ts`)
2. Presigned URL generation for direct uploads
3. Worker integration for async file processing

**Timeline:** 3-4 days

### Phase 4: Production Hardening

**Scope:** Backup, monitoring, disaster recovery

**Deliverables:**

1. Backup strategy (daily snapshots)
2. Prometheus metrics (upload/download latency, error rates)
3. Runbook for disaster recovery

**Timeline:** 2-3 days

---

## Technical Specifications

### SeaweedFS Configuration

**Local Development:**

```yaml
services:
  seaweedfs:
    image: chrislusf/seaweedfs:latest
    container_name: seaweedfs
    ports:
      - "8333:8333" # S3 API
      - "8888:8888" # Filer UI
    command: >
      server
      -s3
      -filer=true
      -s3.port=8333
      -dir=/data
    volumes:
      - seaweedfs_data:/data
    networks:
      - agenticverdict-network
    restart: unless-stopped
```

**Production:**

- Replication factor: 2 (minimum)
- Persistent volumes with SSD storage
- HTTPS termination via reverse proxy
- Separate volume servers for horizontal scaling

### Environment Variables

```bash
# SeaweedFS S3-compatible Storage
STORAGE_PROVIDER=seaweedfs
STORAGE_ENDPOINT=http://seaweedfs:8333        # Docker internal
STORAGE_ENDPOINT_LOCAL=http://localhost:8333   # Local dev
STORAGE_REGION=auto
STORAGE_ACCESS_KEY=agenticverdict
STORAGE_SECRET_KEY=<generate-secure-secret>
STORAGE_BUCKET=agenticverdict-reports
STORAGE_FORCE_PATH_STYLE=true
```

### Storage Adapter Interface

```typescript
interface ObjectStorage {
  uploadObject(params: {
    tenantId: string;
    key: string;
    content: Buffer;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<{ sha256: string; byteLength: number; key: string }>;

  downloadObject(params: {
    tenantId: string;
    key: string;
  }): Promise<{ content: Buffer; contentType: string; byteLength: number }>;

  objectExists(params: { tenantId: string; key: string }): Promise<boolean>;

  deleteObject(params: { tenantId: string; key: string }): Promise<void>;

  generatePresignedUrl(params: {
    tenantId: string;
    key: string;
    expiresInSeconds: number;
    operation: "get" | "put";
  }): Promise<string>;
}
```

### Tenant Context Integration

```typescript
import { requireTenantContext } from "@agenticverdict/core";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export class S3ObjectStorage implements ObjectStorage {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const ctx = requireTenantContext();
    this.client = new S3Client({
      region: process.env.STORAGE_REGION || "auto",
      endpoint: process.env.STORAGE_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY!,
        secretAccessKey: process.env.STORAGE_SECRET_KEY!,
      },
    });
    this.bucket = process.env.STORAGE_BUCKET || "agenticverdict-reports";
  }

  private getKey(tenantId: string, key: string): string {
    // Enforce tenant isolation at path level
    return `tenants/${tenantId}/${key}`;
  }

  async uploadObject(params: UploadParams): Promise<UploadResult> {
    const ctx = requireTenantContext();

    // CRITICAL: Validate tenant context matches expected tenant
    if (ctx.tenantId !== params.tenantId) {
      throw new TenantSecurityError(
        `Tenant mismatch: expected ${ctx.tenantId}, got ${params.tenantId}`,
      );
    }

    const key = this.getKey(params.tenantId, params.key);
    const hash = crypto.createHash("sha256").update(params.content).digest("hex");

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: params.content,
        ContentType: params.contentType,
        Metadata: {
          "tenant-id": params.tenantId,
          sha256: hash,
          "uploaded-at": new Date().toISOString(),
          ...params.metadata,
        },
      }),
    );

    return { sha256: hash, byteLength: params.content.length, key };
  }
}
```

---

## Security Considerations

### Tenant Isolation

1. **Path-based isolation:** All object keys prefixed with `tenants/{tenantId}/`
2. **Context validation:** Tenant ID validated against AsyncLocalStorage context
3. **No cross-tenant operations:** Single-tenant operations only (no batch cross-tenant)

### Data Protection

1. **SHA-256 verification:** Integrity check on upload/download
2. **Audit trail:** All operations logged with tenant context
3. **No credentials in logs:** S3 credentials excluded from structured logging

### Access Control

1. **Internal network only:** SeaweedFS not exposed to public internet
2. **Service-to-service auth:** No user-facing credentials
3. **Presigned URLs:** Time-limited access for direct uploads (future)

---

## Observability

### Metrics (Prometheus)

```typescript
// Storage adapter metrics
storage_upload_duration_seconds{tenantId, operation, outcome}
storage_download_duration_seconds{tenantId, operation, outcome}
storage_bytes_uploaded_total{tenantId}
storage_bytes_downloaded_total{tenantId}
storage_errors_total{tenantId, error_type}
```

### Logging (Pino)

```typescript
logger.info(
  {
    tenantId: ctx.tenantId,
    requestId: ctx.requestId,
    objectKey: key,
    byteLength: content.length,
    sha256: hash,
    operation: "upload",
  },
  "File uploaded to SeaweedFS",
);
```

### Health Checks

```typescript
async isHealthy(): Promise<boolean> {
  try {
    await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
    return true;
  } catch (error) {
    logger.error({ error }, 'SeaweedFS health check failed');
    return false;
  }
}
```

---

## Migration Path

### Development

1. Add SeaweedFS to `docker-compose.yml`
2. Update `.env.docker.example` with storage configuration
3. Run `make setup` to generate secrets
4. Test with `make dev`

### Production

1. Deploy SeaweedFS with persistent volumes
2. Configure replication factor (minimum 2)
3. Set up backup strategy (daily snapshots)
4. Update `STORAGE_ENDPOINT` to production URL
5. Enable HTTPS via reverse proxy

### Data Migration (Future)

If migrating from `FileSystemReportBlobStorage`:

```bash
# Export existing files
find $REPORT_BLOB_STORAGE_DIR -type f -exec aws s3 cp {} s3://agenticverdict-reports/tenants/{tenantId}/reports/{} \;

# Verify migration
aws s3 ls s3://agenticverdict-reports/tenants/ --recursive

# Switch storage backend (zero downtime deploy)
```

---

## Testing Strategy

### Unit Tests

- Mock S3Client with vitest
- Test tenant isolation logic
- Test SHA-256 verification
- Test error handling (NoSuchKey, access denied)

### Integration Tests

- Spin up SeaweedFS in Docker
- Test actual upload/download operations
- Test tenant isolation (tenant A cannot access tenant B's files)
- Test concurrent uploads

### E2E Tests

- Full report generation → upload → download flow
- Test with Playwright (frontend download)
- Test error scenarios (missing files, network failures)

---

## Success Criteria

### Functional

- [ ] Reports upload/download functional with SeaweedFS
- [ ] Tenant isolation verified (cross-tenant access blocked)
- [ ] SHA-256 integrity checks passing
- [ ] Audit trail capturing all operations

### Non-Functional

- [ ] Upload latency < 2 seconds for 10MB file
- [ ] Download latency < 3 seconds for 10MB file
- [ ] Zero memory leaks in long-running sessions
- [ ] Unit test coverage > 85%
- [ ] Integration tests passing

### Operational

- [ ] SeaweedFS health checks passing
- [ ] Prometheus metrics exposed
- [ ] Backup strategy documented
- [ ] Runbook created for disaster recovery

---

## Risks and Mitigations

| Risk                       | Impact   | Probability | Mitigation                                               |
| -------------------------- | -------- | ----------- | -------------------------------------------------------- |
| SeaweedFS instability      | High     | Low         | Use latest stable release, monitor GitHub issues         |
| Data loss (no replication) | Critical | Medium      | Configure replication factor ≥ 2, daily backups          |
| Performance degradation    | Medium   | Low         | Benchmark with production-like load, tune volume servers |
| Security vulnerability     | High     | Low         | Regular security updates, network isolation              |
| Operational complexity     | Medium   | Medium      | Document runbooks, train team on SeaweedFS ops           |

---

## References

- [SeaweedFS Documentation](https://github.com/chrislusf/seaweedfs)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- Phase 1 Remediation Plan: `/docs/audit/reports-remediation-phase-1.md`
- Business Architecture: `/docs/architecture/business/business-architecture.md`
- Multi-Tenant Guardrails: `/docs/05-reference/multi-tenant-guardrails.md`

---

## Approval

- [ ] Engineering Lead
- [ ] Security Review
- [ ] DevOps Review

**Decision Date:** ****\_\_\_****  
**Review Date:** ****\_\_\_**** (6 months from decision)
