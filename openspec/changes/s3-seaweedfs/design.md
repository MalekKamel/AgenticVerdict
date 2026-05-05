## Context

**Current State:**

- Reports UI complete but storage uses temporary in-memory/filesystem backend
- Phase 1 remediation identifies S3 storage as critical production blocker
- No centralized object storage for reports, exports, or uploads
- Multi-tenant isolation not enforced at storage layer

**Constraints:**

- Greenfield implementation (no backward compatibility required)
- Must integrate with existing tenant context propagation (AsyncLocalStorage)
- Self-hosted solution required for data sovereignty (GDPR compliance)
- Follow existing adapter patterns from `packages/data-connectors/`
- Zero tolerance for cross-tenant data access

**Stakeholders:**

- Engineering team (implementation)
- DevOps (SeaweedFS operations, backup strategy)
- Security (tenant isolation validation)
- Product (report generation features)

## Goals / Non-Goals

**Goals:**

- Tenant-isolated object storage with path-based scoping (`tenants/{tenantId}/...`)
- S3-compatible API using AWS SDK v3 patterns
- Production-ready with health checks, metrics, and audit trail
- Support for reports, exports, and future file uploads
- Comprehensive testing (85%+ coverage, tenant isolation tests)
- Docker-based local development and production deployment

**Non-Goals:**

- User-facing file upload UI (future phase)
- Multi-cloud storage abstraction (single provider: SeaweedFS)
- Real-time file synchronization or CDN integration
- Advanced features like versioning, lifecycle policies, or replication configuration
- Migration from existing filesystem storage (destructive approach)

## Decisions

### 1. SeaweedFS over MinIO/AWS S3

**Decision:** Use SeaweedFS as S3-compatible storage backend.

**Rationale:**

- **Performance:** Optimized for small to large files (Facebook Haystack inspiration)
- **Simplicity:** Lighter resource footprint than MinIO, easier operations
- **Cost:** Zero egress fees, self-hosted control vs AWS S3
- **S3 Compatibility:** Mature S3 API implementation, AWS SDK integration
- **Data Sovereignty:** Full control over data residency (GDPR compliance)

**Alternatives Considered:**

- **AWS S3:** Rejected due to egress fees, vendor lock-in, data residency concerns
- **MinIO:** Rejected due to heavier resource requirements, over-engineered for current scale
- **Cloudflare R2:** Rejected due to limited self-hosting options
- **Filesystem:** Rejected due to no horizontal scalability, single point of failure

### 2. Path-Based Tenant Isolation

**Decision:** Single bucket with path-based scoping (`tenants/{tenantId}/...`) vs bucket-per-tenant.

**Rationale:**

- **Simpler Operations:** Single bucket management, no per-bucket overhead
- **Lower Memory:** No bucket metadata duplication
- **Easier Backup:** Single bucket backup/restore
- **Consistent Pattern:** Aligns with existing `report-blob-storage.ts` approach

**Security Enforcement:**

1. Tenant ID extracted from JWT → AsyncLocalStorage context
2. All operations prepend `tenants/{tenantId}/` to object keys
3. Tenant ID validated against context before any S3 operation
4. SHA-256 integrity verification on upload/download
5. Audit trail captures all operations with tenant metadata

### 3. Storage Adapter Layer in Core Package

**Decision:** Implement storage interface in `packages/core/src/storage/` rather than API-specific module.

**Rationale:**

- **Reusability:** Shared by API, Worker, and potentially CLI tools
- **Domain Logic:** Storage is domain concern, not infrastructure detail
- **Testing:** Easier to unit test in isolation
- **Consistency:** Follows pattern from `packages/data-connectors/`

**Interface Design:**

```typescript
interface ObjectStorage {
  uploadObject(params): Promise<UploadObjectResult>;
  downloadObject(params): Promise<DownloadObjectResult>;
  objectExists(params): Promise<boolean>;
  deleteObject(params): Promise<void>;
  generatePresignedUrl(params): Promise<string>;
  isHealthy(): Promise<boolean>;
}
```

### 4. Environment-Based Provider Selection

**Decision:** Storage factory selects provider via `STORAGE_PROVIDER` environment variable.

**Rationale:**

- **Flexibility:** Easy switching between seaweedfs, memory, future providers
- **Testing:** Memory provider for unit tests, SeaweedFS for integration
- **Configuration:** Clear separation of concerns, no code changes for provider switch

**Configuration:**

```bash
STORAGE_PROVIDER=seaweedfs|memory
STORAGE_ENDPOINT=http://seaweedfs:8333
STORAGE_ACCESS_KEY=agenticverdict
STORAGE_SECRET_KEY=<secure-secret>
STORAGE_BUCKET=agenticverdict-reports
STORAGE_FORCE_PATH_STYLE=true
```

### 5. Observability First

**Decision:** Implement Prometheus metrics and structured logging from day one.

**Rationale:**

- **Production Readiness:** Immediate visibility into storage performance
- **Debugging:** Tenant-contextualized logs for troubleshooting
- **Alerting:** Error rate, latency thresholds for on-call
- **Capacity Planning:** Byte counters for storage growth tracking

**Metrics:**

- `storage_upload_duration_seconds{tenantId, operation, outcome}`
- `storage_download_duration_seconds{tenantId, operation, outcome}`
- `storage_bytes_uploaded_total{tenantId}`
- `storage_bytes_downloaded_total{tenantId}`
- `storage_errors_total{tenantId, error_type, operation}`

## Risks / Trade-offs

**[SeaweedFS Immaturity]** → Mitigation: Use latest stable release, monitor GitHub issues, maintain MinIO as fallback option

**[Data Loss (No Replication)]** → Mitigation: Configure replication factor ≥ 2 in production, implement daily backup strategy with `weed backup`

**[Performance Degradation at Scale]** → Mitigation: Benchmark with production-like load, tune volume server count, add performance tests to CI

**[Operational Complexity]** → Mitigation: Document runbooks (`docs/storage/runbook.md`), train team on SeaweedFS operations, start with single-node deployment

**[S3 API Incompatibility]** → Mitigation: Use standard AWS SDK commands only, avoid SeaweedFS-specific extensions, test presigned URLs thoroughly

**[Tenant Isolation Bypass]** → Mitigation: Code review focus on tenant validation, penetration testing, add tenant isolation tests to E2E suite

## Migration Plan

### Phase 1: Local Development (Days 1-3)

1. Add SeaweedFS to `docker-compose.yml`
2. Create storage adapter in `packages/core/src/storage/`
3. Update `.env.docker.example` with storage configuration
4. Run `make setup` to generate secrets
5. Test with `make dev`

### Phase 2: API Integration (Days 4-5)

1. Update tRPC routers (`apps/api/src/trpc/routers/reports.ts`)
2. Integrate storage factory into API service
3. Add audit trail logging
4. Test upload/download flows

### Phase 3: Worker Integration (Days 6-7)

1. Integrate storage into worker service
2. Update report generation jobs
3. Test async file processing

### Phase 4: Testing & Hardening (Days 8-10)

1. Unit tests (85%+ coverage)
2. Integration tests with SeaweedFS
3. Tenant isolation validation
4. Performance benchmarks
5. Security review

### Phase 5: Production Deployment (Day 11+)

1. Deploy SeaweedFS with persistent volumes
2. Configure replication factor ≥ 2
3. Set up backup strategy (daily snapshots)
4. Update `STORAGE_ENDPOINT` to production URL
5. Enable HTTPS via reverse proxy
6. Monitor metrics and error rates

**Rollback Strategy:**

- Revert to memory/filesystem storage via `STORAGE_PROVIDER=memory`
- No data migration required (destructive approach)
- Feature flag for gradual rollout (future enhancement)

## Open Questions

1. **Backup Strategy:** Should we use SeaweedFS native backup or implement custom snapshot solution? (Decision: Start with native `weed backup`, evaluate custom solution based on recovery time objectives)

2. **Presigned URL Implementation:** AWS SDK v3 presigner requires specific command types. Should we implement full presigned URL support in Phase 1 or defer to Phase 3? (Decision: Defer to Phase 3, focus on core upload/download first)

3. **Production Replication:** What replication factor for initial production deployment? (Decision: Start with replication factor 2, scale to 3 based on storage growth and availability requirements)

4. **Monitoring Integration:** Should we add custom SeaweedFS metrics (volume server health, filer status) or rely on health checks only? (Decision: Start with health checks, add custom metrics if operational issues arise)
