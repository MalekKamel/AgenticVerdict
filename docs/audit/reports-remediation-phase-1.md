# Reports Feature Remediation: Phase 1 - Critical Blockers

**Created:** 2026-05-04  
**Priority:** HIGH  
**Estimated Effort:** 2-3 developer days  
**Target:** Production-ready report content delivery  
**Storage Backend:** SeaweedFS S3-compatible API

---

## Overview

Phase 1 focuses on enabling actual report content delivery using SeaweedFS as the S3-compatible storage backend. This phase addresses critical blockers that prevent users from downloading generated reports.

### SeaweedFS Deployment

SeaweedFS provides an S3-compatible API that integrates seamlessly with the AWS SDK. Key benefits:

- **Self-hosted:** Full control over data residency and tenant isolation
- **S3-compatible:** Works with existing AWS SDK code
- **Cost-effective:** No egress fees, runs on existing infrastructure
- **Scalable:** Horizontal scaling for large file storage

**Local Development:**

- SeaweedFS runs in Docker at `http://seaweedfs:8333`
- S3 API port: `8333`
- Filer UI: `http://localhost:8888`

**Production:**

- Deploy via Docker Compose or Kubernetes
- Configure replication for high availability
- Use persistent volumes for data durability

---

## Task 1.1: Implement SeaweedFS Report Content Storage

**Priority:** 🔴 CRITICAL  
**Effort:** 1 day  
**Dependencies:** None  
**Owner:** Backend Engineer

### Requirements

1. Add SeaweedFS storage configuration to environment
2. Implement S3-compatible storage adapter using AWS SDK
3. Configure SeaweedFS bucket for report files
4. Implement tenant-scoped file paths for isolation

### Implementation

```typescript
// apps/api/src/lib/storage/reports-storage.ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { streamToBuffer } from "@agenticverdict/core/utils/stream-utils";

export class ReportsStorage {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = new S3Client({
      region: process.env.STORAGE_REGION || "auto",
      endpoint: process.env.STORAGE_ENDPOINT,
      forcePathStyle: true, // Required for SeaweedFS
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY!,
        secretAccessKey: process.env.STORAGE_SECRET_KEY!,
      },
    });
    this.bucket = process.env.STORAGE_BUCKET || "agenticverdict-reports";
  }

  private getKey(tenantId: string, reportId: string, version: number, format: string): string {
    // Tenant-scoped path ensures isolation
    return `tenants/${tenantId}/reports/${reportId}/v${version}.${format}`;
  }

  async uploadContent(
    tenantId: string,
    reportId: string,
    version: number,
    format: "pdf" | "excel",
    content: Buffer,
    contentType: string,
  ): Promise<{ sha256: string; byteLength: number; key: string }> {
    const key = this.getKey(tenantId, reportId, version, format);
    const hash = crypto.createHash("sha256").update(content).digest("hex");

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: content,
        ContentType: contentType,
        Metadata: {
          "tenant-id": tenantId,
          "report-id": reportId,
          version: version.toString(),
          sha256: hash,
        },
      }),
    );

    return { sha256: hash, byteLength: content.length, key };
  }

  async getContent(
    tenantId: string,
    reportId: string,
    version: number,
    format: "pdf" | "excel",
  ): Promise<{ content: Buffer; contentType: string; byteLength: number }> {
    const key = this.getKey(tenantId, reportId, version, format);

    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      const content = await streamToBuffer(response.Body);
      const contentType =
        response.ContentType ||
        (format === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

      return {
        content,
        contentType,
        byteLength: content.length,
      };
    } catch (error) {
      if (error.name === "NoSuchKey" || error.name === "NotFound") {
        throw new Error(`Report content not found: ${key}`);
      }
      throw error;
    }
  }

  async verifyContentExists(
    tenantId: string,
    reportId: string,
    version: number,
    format: "pdf" | "excel",
  ): Promise<boolean> {
    const key = this.getKey(tenantId, reportId, version, format);

    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return true;
    } catch (error) {
      if (error.name === "NotFound" || error.name === "404") {
        return false;
      }
      throw error;
    }
  }
}
```

### Environment Configuration

```bash
# .env.docker.example - SeaweedFS Configuration

# SeaweedFS S3-compatible Storage
STORAGE_PROVIDER=seaweedfs
STORAGE_ENDPOINT=http://seaweedfs:8333
STORAGE_REGION=auto
STORAGE_ACCESS_KEY=agenticverdict
STORAGE_SECRET_KEY=<generate-secure-secret>
STORAGE_BUCKET=agenticverdict-reports
STORAGE_FORCE_PATH_STYLE=true

# For local development with default SeaweedFS credentials
STORAGE_ACCESS_KEY_LOCAL=minioadmin
STORAGE_SECRET_KEY_LOCAL=minioadmin
```

### SeaweedFS Docker Setup

```yaml
# docker-compose.yml (excerpt)
services:
  seaweedfs:
    image: chrislusf/seaweedfs:latest
    container_name: seaweedfs
    ports:
      - "8333:8333" # S3 API
      - "9333:9333" # Filer UI
      - "8888:8888" # Filer HTTP
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

volumes:
  seaweedfs_data:
    driver: local
```

### Acceptance Criteria

- [ ] Storage adapter implemented with SeaweedFS S3-compatible API
- [ ] Tenant-scoped file paths enforced (`tenants/{tenantId}/reports/...`)
- [ ] SHA-256 hash calculated on upload for integrity verification
- [ ] `verifyContentExists()` method for pre-download validation
- [ ] Unit tests for storage adapter (85%+ coverage)
- [ ] Environment variables documented in `.env.docker.example`
- [ ] SeaweedFS Docker Compose configuration added
- [ ] Local development setup tested end-to-end

---

## Task 1.2: Add Report Content Upload Endpoint

**Priority:** 🔴 CRITICAL  
**Effort:** 0.5 days  
**Dependencies:** Task 1.1  
**Owner:** Backend Engineer

### Requirements

Add tRPC mutation to upload report content to SeaweedFS after generation.

### Implementation

```typescript
// apps/api/src/trpc/routers/reports.ts
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { ReportsStorage } from '../../lib/storage/reports-storage';
import { dbScoped } from '@agenticverdict/database';
import { requireTrpcDatabase } from '../../lib/database/trpc-database';
import { reports, auditTrail } from '@agenticverdict/database/schema';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

uploadContent: authedProcedure
  .input(z.object({
    id: z.string().uuid(),
    version: z.number().int().min(1),
    format: z.enum(['pdf', 'excel']),
    content: z.string(), // base64 encoded
  }))
  .output(z.object({
    success: z.boolean(),
    sha256: z.string(),
    byteLength: z.number(),
    key: z.string(),
  }))
  .mutation(async ({ ctx, input }) => {
    const tenantId = ctx.tenant.tenantId;
    const db = requireTrpcDatabase();
    const storage = new ReportsStorage();

    await dbScoped(db, async (tx) => {
      // Verify report exists and belongs to tenant
      const [report] = await tx
        .select()
        .from(reports)
        .where(and(eq(reports.id, input.id), eq(reports.tenantId, tenantId)))
        .limit(1);

      if (!report) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Report not found',
        });
      }

      // Validate report status allows content upload
      if (report.status === 'deleted') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot upload content to deleted report',
        });
      }

      // Upload to SeaweedFS storage
      const contentBuffer = Buffer.from(input.content, 'base64');
      const { sha256, byteLength, key } = await storage.uploadContent(
        tenantId,
        input.id,
        input.version,
        input.format,
        contentBuffer,
        input.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      // Update report metadata with version info
      const metadata = report.metadata as Record<string, unknown> || {};
      const versions = (metadata.versions as Array<Record<string, unknown>>) || [];

      versions.push({
        version: input.version,
        sha256,
        byteLength,
        contentType: input.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        storageKey: key,
        uploadedAt: new Date().toISOString(),
        uploadedBy: ctx.auth.userId,
      });

      await tx
        .update(reports)
        .set({
          metadata: { ...metadata, versions },
          status: 'ready',
          updatedAt: new Date(),
        })
        .where(eq(reports.id, input.id));

      // Audit trail for compliance
      await tx.insert(auditTrail).values({
        tenantId,
        reportId: input.id,
        actorSub: ctx.auth.userId,
        action: 'content.upload',
        eventType: 'content_uploaded',
        status: 'success',
        metadata: {
          version: input.version,
          sha256,
          byteLength,
          storageKey: key,
          storageProvider: 'seaweedfs',
        },
        requestId: randomUUID(),
        createdAt: new Date(),
      });
    });

    return { success: true, sha256, byteLength, key: storage.getKey(tenantId, input.id, input.version, input.format) };
  }),
```

### Acceptance Criteria

- [ ] tRPC mutation implemented with strict input validation
- [ ] Tenant validation enforced via `dbScoped()` wrapper
- [ ] Report ownership verified before upload
- [ ] Report metadata updated with version info including storage key
- [ ] Audit trail entry created with SeaweedFS storage provider metadata
- [ ] Error handling for deleted reports and duplicate versions
- [ ] Integration test with SeaweedFS mock/local instance
- [ ] Response includes storage key for debugging

---

## Task 1.3: Update Content Retrieval Endpoint

**Priority:** 🔴 CRITICAL  
**Effort:** 0.5 days  
**Dependencies:** Task 1.1  
**Owner:** Backend Engineer

### Requirements

Replace placeholder with actual file retrieval from SeaweedFS storage.

### Implementation

```typescript
// apps/api/src/trpc/routers/reports.ts (update existing content procedure)
import { ReportsStorage } from '../../lib/storage/reports-storage';

content: authedProcedure
  .input(z.object({
    id: z.string().uuid(),
    format: z.enum(['pdf', 'excel']),
    version: z.number().int().min(1).optional(),
  }))
  .output(z.object({
    content: z.string(),
    contentType: z.string(),
    version: z.number(),
    byteLength: z.number(),
  }))
  .query(async ({ ctx, input }) => {
    const tenantId = ctx.tenant.tenantId;
    const db = requireTrpcDatabase();
    const storage = new ReportsStorage();

    // Fetch report with tenant isolation
    const report = await dbScoped(db, async (tx) => {
      const [report] = await tx
        .select()
        .from(reports)
        .where(and(eq(reports.id, input.id), eq(reports.tenantId, tenantId)))
        .limit(1);

      if (!report) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Report not found',
        });
      }

      return report;
    });

    // Determine version to retrieve
    const metadata = report.metadata as Record<string, unknown> || {};
    const versions = (metadata.versions as Array<Record<string, unknown>>) || [];

    if (versions.length === 0) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No content available for this report',
      });
    }

    const targetVersion = input.version ?? versions.length;

    // Verify version exists in metadata
    const versionInfo = versions.find((v: Record<string, unknown>) => v.version === targetVersion);
    if (!versionInfo) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Version ${targetVersion} not found`,
      });
    }

    // Retrieve from SeaweedFS storage
    const { content, contentType, byteLength } = await storage.getContent(
      tenantId,
      input.id,
      targetVersion,
      input.format,
    );

    // Audit: Log download (async, non-blocking)
    // Note: Full audit logging would go here, but kept minimal for query performance

    return {
      content: content.toString('base64'),
      contentType,
      version: targetVersion,
      byteLength,
    };
  }),
```

### Acceptance Criteria

- [ ] Actual file content retrieved from SeaweedFS (not placeholder)
- [ ] Version parameter supported with validation
- [ ] Default to latest version if not specified
- [ ] Error handling for missing files, invalid versions
- [ ] Tenant isolation enforced throughout
- [ ] Integration test with SeaweedFS mock/local instance
- [ ] Response includes byteLength for client-side validation

---

## Task 1.4: Implement Frontend Download Logic

**Priority:** 🔴 CRITICAL  
**Effort:** 0.5 days  
**Dependencies:** Task 1.3  
**Owner:** Frontend Engineer

### Requirements

Replace TODO comments with actual download implementation using tRPC client.

### Implementation

```typescript
// apps/frontend/src/features/reports/pages/ReportListPage.tsx
import { trpc } from "@/lib/trpc/client";
import {
  showInfoNotification,
  showSuccessNotification,
  showErrorNotification,
} from "@/components/ui/notifications";
import JSZip from "jszip";

export function ReportListPage() {
  const { tenantId } = useTenantContext();
  const [selectedReports, setSelectedReports] = useState<Set<string>>(new Set());

  const handleDownloadReport = async (report: (typeof reports)[0]) => {
    try {
      showInfoNotification({
        title: "Preparing download",
        message: "Your report is being prepared...",
      });

      // Fetch report content via tRPC
      const { data: contentData } = await trpc.report.content.query({
        id: report.id,
        format: ((report.metadata as Record<string, unknown>)?.format as "pdf" | "excel") ?? "pdf",
      });

      if (!contentData?.content) {
        throw new Error("No content received from server");
      }

      // Create download link
      const link = document.createElement("a");
      link.href = `data:${contentData.contentType};base64,${contentData.content}`;
      link.download = `${report.title}.${contentData.contentType === "application/pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showSuccessNotification({
        title: "Download complete",
        message: `${report.title} downloaded successfully`,
      });
    } catch (error) {
      showErrorNotification({
        title: "Download failed",
        message: getReportErrorMessage(error),
      });
    }
  };

  const handleBulkDownload = async () => {
    const selectedIds = Array.from(selectedReports);
    if (selectedIds.length === 0) return;

    if (selectedIds.length > 10) {
      showErrorNotification({
        title: "Too many reports",
        message: "Please select at most 10 reports for bulk download",
      });
      return;
    }

    try {
      showInfoNotification({
        title: "Preparing download",
        message: `Preparing ${selectedIds.length} reports...`,
      });

      const zip = new JSZip();
      const reportsFolder = zip.folder("reports");

      // Fetch all selected reports in parallel
      const downloadPromises = selectedIds.map(async (reportId) => {
        const { data: contentData } = await trpc.report.content.query({
          id: reportId,
          format: "pdf",
        });

        if (contentData?.content) {
          const report = reports.find((r) => r.id === reportId);
          const fileName = `${report?.title || reportId}.pdf`;
          const binaryString = atob(contentData.content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          reportsFolder?.file(fileName, bytes);
        }
      });

      await Promise.all(downloadPromises);

      // Generate and download ZIP
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reports-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccessNotification({
        title: "Download complete",
        message: `${selectedIds.length} reports downloaded successfully`,
      });
    } catch (error) {
      showErrorNotification({
        title: "Bulk download failed",
        message: getReportErrorMessage(error),
      });
    }
  };

  // ... rest of component
}
```

### Error Handling Utility

```typescript
// apps/frontend/src/features/reports/utils/report-errors.ts
import { TRPCClientError } from "@trpc/client";

export function getReportErrorMessage(error: unknown): string {
  if (error instanceof TRPCClientError) {
    switch (error.message) {
      case "Report not found":
        return "This report no longer exists or you do not have access to it.";
      case "No content available for this report":
        return "This report has no downloadable content yet.";
      case "Report content not found":
        return "The report content could not be retrieved. Please try again.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}
```

### Acceptance Criteria

- [ ] Single report download functional with proper file naming
- [ ] Bulk download creates valid ZIP file with all selected reports
- [ ] Error handling with user-friendly, localized messages
- [ ] Loading states during download preparation
- [ ] Success/error notifications for all outcomes
- [ ] Manual test: Download 5 reports successfully
- [ ] Manual test: Bulk download 3 reports in ZIP
- [ ] Manual test: Error handling for missing content

---

## Testing Strategy

### Unit Tests

```bash
# Run storage adapter tests
pnpm --filter @agenticverdict/api test -- reports-storage

# Run with coverage
pnpm --filter @agenticverdict/api test:coverage -- reports-storage
```

**Target Coverage:**

| File                 | Target | Critical Paths         |
| -------------------- | ------ | ---------------------- |
| `reports-storage.ts` | 90%    | upload, get, verify    |
| `reports.ts` (tRPC)  | 85%    | uploadContent, content |
| `ReportListPage.tsx` | 80%    | download handlers      |

### Integration Tests

```typescript
// apps/api/tests/integration/reports-storage.test.ts
import { ReportsStorage } from "../../src/lib/storage/reports-storage";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

describe("ReportsStorage (SeaweedFS)", () => {
  let storage: ReportsStorage;
  const testTenantId = "tenant-test-001";
  const testReportId = "report-test-001";

  beforeAll(() => {
    storage = new ReportsStorage();
  });

  it("should upload and retrieve content with tenant isolation", async () => {
    const content = Buffer.from("test report content");
    const version = 1;
    const format = "pdf" as const;

    // Upload
    const { sha256, byteLength, key } = await storage.uploadContent(
      testTenantId,
      testReportId,
      version,
      format,
      content,
      "application/pdf",
    );

    expect(key).toBe(`tenants/${testTenantId}/reports/${testReportId}/v${version}.${format}`);
    expect(byteLength).toBe(content.length);
    expect(sha256).toBeDefined();

    // Retrieve
    const {
      content: retrieved,
      contentType,
      byteLength: retrievedSize,
    } = await storage.getContent(testTenantId, testReportId, version, format);

    expect(retrieved).toEqual(content);
    expect(contentType).toBe("application/pdf");
    expect(retrievedSize).toBe(content.length);
  });

  it("should enforce tenant isolation", async () => {
    const content = Buffer.from("tenant A content");
    const version = 1;
    const format = "pdf" as const;

    // Upload for tenant A
    await storage.uploadContent(
      "tenant-a",
      testReportId,
      version,
      format,
      content,
      "application/pdf",
    );

    // Tenant B should not be able to access tenant A's content
    await expect(storage.getContent("tenant-b", testReportId, version, format)).rejects.toThrow(
      "Report content not found",
    );
  });

  it("should verify content existence", async () => {
    const exists = await storage.verifyContentExists(testTenantId, testReportId, 1, "pdf");
    expect(exists).toBe(true);

    const notExists = await storage.verifyContentExists(testTenantId, testReportId, 999, "pdf");
    expect(notExists).toBe(false);
  });
});
```

### Local Development Testing

```bash
# Start SeaweedFS
docker compose up -d seaweedfs

# Verify SeaweedFS is running
curl http://localhost:8333/

# Run integration tests
pnpm --filter @agenticverdict/api test:integration -- reports
```

---

## Definition of Done: Phase 1

### Code Quality

- [ ] Zero TypeScript errors (`pnpm run typecheck`)
- [ ] Zero ESLint violations (`pnpm run lint`)
- [ ] Zero TODO/FIXME comments in Phase 1 files
- [ ] All imports resolved
- [ ] SeaweedFS-specific configuration documented

### Testing

- [ ] Unit test coverage >85% for storage adapter
- [ ] Unit test coverage >85% for tRPC endpoints
- [ ] Integration tests passing with local SeaweedFS
- [ ] Tenant isolation tests passing
- [ ] Manual download testing completed

### Documentation

- [ ] SeaweedFS setup documented in `.env.docker.example`
- [ ] Docker Compose includes SeaweedFS service
- [ ] Storage adapter API documented with JSDoc
- [ ] Phase 1 completion checklist verified

### Security

- [ ] Tenant isolation verified in all storage operations
- [ ] No credentials logged
- [ ] SHA-256 integrity checks implemented
- [ ] Audit trail captures all upload/download operations

### Performance

- [ ] Upload completes in <2 seconds for 10MB file
- [ ] Download completes in <3 seconds for 10MB file
- [ ] No memory leaks in long-running sessions
- [ ] SeaweedFS connection pooling configured

---

## Deployment Notes

### Local Development

1. Start SeaweedFS: `docker compose up -d seaweedfs`
2. Copy `.env.docker.example` to `.env.local`
3. Set `STORAGE_ENDPOINT=http://seaweedfs:8333`
4. Run API in dev mode: `pnpm --filter @agenticverdict/api dev`

### Production

1. Deploy SeaweedFS with persistent volumes
2. Configure replication factor for HA
3. Set secure credentials in secrets manager
4. Update `STORAGE_ENDPOINT` to production URL
5. Enable HTTPS for S3 API endpoint
6. Configure backup strategy for SeaweedFS data

### Monitoring

- Monitor SeaweedFS disk usage
- Track upload/download latency
- Alert on storage errors
- Audit trail for compliance

---

## Next Phase

**Phase 2: High Priority Features** covers:

- Version management UI
- Audit trail visualization
- Component test coverage
- TODO comment removal

See `/docs/audit/reports-feature-remediation.md` for full roadmap.

---

**Approval:**  
[ ] Engineering Lead  
[ ] Security Review (SeaweedFS configuration)  
[ ] Backend Engineer

**Start Date:** ****\_\_\_****  
**Target Completion:** ****\_\_\_****
