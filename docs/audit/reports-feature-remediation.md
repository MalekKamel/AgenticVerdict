# Reports Feature Remediation Plan

**Created:** 2026-05-04  
**Priority:** HIGH  
**Estimated Effort:** 5-7 developer days  
**Target:** Production-ready feature

---

## Phase 1: Critical Blockers (Days 1-2)

**Goal:** Enable actual report content delivery

### Task 1.1: Implement Report Content Storage

**Priority:** 🔴 CRITICAL  
**Effort:** 1 day  
**Dependencies:** None  
**Owner:** Backend Engineer

#### Requirements

1. Add blob storage configuration to environment
2. Implement S3-compatible storage adapter (or local filesystem for dev)
3. Add storage bucket for report files
4. Implement tenant-scoped file paths

#### Implementation

```typescript
// apps/api/src/lib/storage/reports-storage.ts
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

export class ReportsStorage {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = new S3Client({
      region: process.env.STORAGE_REGION || "auto",
      endpoint: process.env.STORAGE_ENDPOINT,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY!,
        secretAccessKey: process.env.STORAGE_SECRET_KEY!,
      },
    });
    this.bucket = process.env.STORAGE_BUCKET || "agenticverdict-reports";
  }

  private getKey(tenantId: string, reportId: string, version: number, format: string): string {
    return `tenants/${tenantId}/reports/${reportId}/v${version}.${format}`;
  }

  async uploadContent(
    tenantId: string,
    reportId: string,
    version: number,
    format: "pdf" | "excel",
    content: Buffer,
    contentType: string,
  ): Promise<{ sha256: string; byteLength: number }> {
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

    return { sha256: hash, byteLength: content.length };
  }

  async getContent(
    tenantId: string,
    reportId: string,
    version: number,
    format: "pdf" | "excel",
  ): Promise<{ content: Buffer; contentType: string }> {
    const key = this.getKey(tenantId, reportId, version, format);
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

    return { content, contentType };
  }
}
```

#### Acceptance Criteria

- [ ] Storage adapter implemented with S3 + local filesystem fallback
- [ ] Tenant-scoped file paths enforced
- [ ] SHA-256 hash calculated on upload
- [ ] Unit tests for storage adapter (85%+ coverage)
- [ ] Environment variables documented in `.env.docker.example`

---

### Task 1.2: Add Report Content Upload Endpoint

**Priority:** 🔴 CRITICAL  
**Effort:** 0.5 days  
**Dependencies:** Task 1.1  
**Owner:** Backend Engineer

#### Requirements

Add tRPC mutation to upload report content after generation.

#### Implementation

```typescript
// apps/api/src/trpc/routers/reports.ts
uploadContent: authedProcedure
  .input(z.object({
    id: z.string(),
    version: z.number().int().min(1),
    format: z.enum(['pdf', 'excel']),
    content: z.string(), // base64 encoded
  }))
  .output(z.object({ success: z.boolean(), sha256: z.string() }))
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
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Report not found' });
      }

      // Upload to storage
      const contentBuffer = Buffer.from(input.content, 'base64');
      const { sha256, byteLength } = await storage.uploadContent(
        tenantId,
        input.id,
        input.version,
        input.format,
        contentBuffer,
        input.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );

      // Update report metadata with version info
      const metadata = report.metadata as any || {};
      const versions = metadata.versions || [];
      versions.push({
        version: input.version,
        sha256,
        byteLength,
        contentType: input.format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        createdAt: new Date().toISOString(),
        objectKey: storage.getKey(tenantId, input.id, input.version, input.format),
      });

      await tx
        .update(reports)
        .set({
          metadata: { ...metadata, versions },
          status: 'ready',
        })
        .where(eq(reports.id, input.id));

      // Audit trail
      await tx.insert(auditTrail).values({
        tenantId,
        reportId: input.id,
        actorSub: ctx.auth.userId,
        action: 'content.upload',
        eventType: 'content_uploaded',
        status: 'success',
        metadata: { version: input.version, sha256, byteLength },
        requestId: randomUUID(),
      });
    });

    return { success: true, sha256 };
  }),
```

#### Acceptance Criteria

- [ ] tRPC mutation implemented
- [ ] Tenant validation enforced
- [ ] Report metadata updated with version info
- [ ] Audit trail entry created
- [ ] Integration test with storage mock

---

### Task 1.3: Update Content Retrieval Endpoint

**Priority:** 🔴 CRITICAL  
**Effort:** 0.5 days  
**Dependencies:** Task 1.1  
**Owner:** Backend Engineer

#### Requirements

Replace placeholder with actual file retrieval from storage.

#### Implementation

```typescript
// apps/api/src/trpc/routers/reports.ts (update existing content procedure)
content: authedProcedure
  .input(z.object({ id: z.string(), format: z.enum(['pdf', 'excel']), version: z.number().optional() }))
  .output(z.object({ content: z.string(), contentType: z.string(), version: z.number() }))
  .query(async ({ ctx, input }) => {
    const tenantId = ctx.tenant.tenantId;
    const db = requireTrpcDatabase();
    const storage = new ReportsStorage();

    const report = await dbScoped(db, async (tx) => {
      const [report] = await tx
        .select()
        .from(reports)
        .where(and(eq(reports.id, input.id), eq(reports.tenantId, tenantId)))
        .limit(1);

      if (!report) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Report not found' });
      }

      return report;
    });

    // Determine version to retrieve
    const metadata = report.metadata as any || {};
    const versions = metadata.versions || [];
    const targetVersion = input.version || versions.length || 1;

    // Retrieve from storage
    const { content, contentType } = await storage.getContent(
      tenantId,
      input.id,
      targetVersion,
      input.format,
    );

    return {
      content: content.toString('base64'),
      contentType,
      version: targetVersion,
    };
  }),
```

#### Acceptance Criteria

- [ ] Actual file content returned (not placeholder)
- [ ] Version parameter supported
- [ ] Default to latest version if not specified
- [ ] Error handling for missing files
- [ ] Integration test with storage mock

---

### Task 1.4: Implement Frontend Download Logic

**Priority:** 🔴 CRITICAL  
**Effort:** 0.5 days  
**Dependencies:** Task 1.3  
**Owner:** Frontend Engineer

#### Requirements

Replace TODO comments with actual download implementation.

#### Implementation

```typescript
// apps/frontend/src/features/reports/pages/ReportListPage.tsx
const handleDownloadReport = async (report: (typeof reports)[0]) => {
  try {
    showInfoNotification({
      title: "Preparing download",
      message: "Your report is being prepared",
    });

    // Fetch report content via tRPC
    const { data: contentData } = await trpc.report.content.query({
      id: report.id,
      format: (report.metadata as any)?.format || "pdf",
    });

    if (!contentData?.content) {
      throw new Error("No content received");
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
```

```typescript
// apps/frontend/src/features/reports/pages/ReportListPage.tsx (bulk download)
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
```

#### Acceptance Criteria

- [ ] Single report download functional
- [ ] Bulk download creates valid ZIP
- [ ] Error handling with user-friendly messages
- [ ] Loading states during download
- [ ] Manual test: Download 5 reports successfully

---

## Phase 2: High Priority Features (Days 3-4)

### Task 2.1: Enable Component Tests

**Priority:** 🟠 HIGH  
**Effort:** 0.5 days  
**Dependencies:** None  
**Owner:** Frontend Engineer

#### Requirements

- Rename `ReportListPage.test.tsx.skip` to `ReportListPage.test.tsx`
- Fix any failing tests
- Add missing test coverage

#### Implementation

```bash
# Rename file
mv apps/frontend/src/features/reports/pages/ReportListPage.test.tsx.skip \
   apps/frontend/src/features/reports/pages/ReportListPage.test.tsx
```

Fix test setup to match actual implementation:

```typescript
// apps/frontend/src/features/reports/pages/ReportListPage.test.tsx
// Update mock data structure to match actual API response
const mockReports = {
  reports: [
    {
      id: "report-1",
      title: "Monthly SEO Report - January 2024", // Changed from 'name' to 'title'
      metadata: { format: "pdf" },
      status: "ready",
      createdAt: new Date("2024-01-31"),
    },
    // ...
  ],
  total: 3,
  page: 1,
  pageSize: 20,
};
```

#### Acceptance Criteria

- [ ] File renamed to `.test.tsx`
- [ ] All tests passing
- [ ] `pnpm run test:unit` includes ReportListPage tests
- [ ] Coverage report shows >70% for ReportListPage.tsx

---

### Task 2.2: Implement Version Management

**Priority:** 🟠 HIGH  
**Effort:** 1 day  
**Dependencies:** Task 1.2  
**Owner:** Full-stack Engineer

#### Requirements

- Populate version selector with actual version data
- Support version switching in viewer
- Display version metadata

#### Frontend Implementation

```typescript
// apps/frontend/src/features/reports/pages/ReportViewerPage.tsx
const versionOptions: { value: string; label: string }[] = [];
const metadata = report.metadata as any;
const versions = metadata?.versions || [];

versions.forEach((v: any) => {
  versionOptions.push({
    value: v.version.toString(),
    label: `v${v.version} - ${new Date(v.createdAt).toLocaleDateString()} (${(v.byteLength / 1024 / 1024).toFixed(2)} MB)`,
  });
});

// Reverse to show latest first
versionOptions.reverse();
```

#### Acceptance Criteria

- [ ] Version selector populated with real data
- [ ] Version switch triggers content reload
- [ ] Version metadata displayed (date, size)
- [ ] Latest version selected by default
- [ ] Manual test: Switch between 3 versions

---

### Task 2.3: Wire Up Audit Trail

**Priority:** 🟠 HIGH  
**Effort:** 0.5 days  
**Dependencies:** None  
**Owner:** Frontend Engineer

#### Requirements

- Add History tab to ReportViewerPage or create ReportDetailPage
- Display audit trail timeline
- Filter by event type

#### Implementation

```typescript
// apps/frontend/src/features/reports/pages/ReportDetailPage.tsx (new file)
import { AuditTrailTimeline } from '@/features/insights/ui/audit-trail/AuditTrailTimeline';

export default function ReportDetailPage() {
  const params = useParams({ strict: false });
  const reportId = (params as { reportId?: string }).reportId;
  const { tenantId } = useTenantContext();

  const { data: auditTrail } = trpc.report.auditTrail.useQuery(
    { reportId: reportId! },
    { enabled: !!tenantId && !!reportId }
  );

  return (
    <Container size="xl">
      <Stack gap="md">
        <Title order={3}>Report History</Title>
        <AuditTrailTimeline events={auditTrail?.events || []} />
      </Stack>
    </Container>
  );
}
```

Backend: Add auditTrail procedure to reports router (similar to insights router).

#### Acceptance Criteria

- [ ] Audit trail query procedure added to reports router
- [ ] History page/tab displays timeline
- [ ] Event type filtering works
- [ ] Date range filtering works
- [ ] Shows: content uploads, downloads, shares, deletes

---

### Task 2.4: Remove TODO Comments

**Priority:** 🟠 HIGH  
**Effort:** 0.25 days  
**Dependencies:** Task 1.4  
**Owner:** Frontend Engineer

#### Requirements

- Remove all TODO comments from reports feature
- Verify no remaining stubs

```bash
# Verify no TODOs remain
grep -rn "TODO\|FIXME\|XXX" apps/frontend/src/features/reports/
```

#### Acceptance Criteria

- [ ] Zero TODO comments in reports feature
- [ ] All stubs replaced with real implementation
- [ ] Code review confirms no hidden stubs

---

## Phase 3: Polish & Testing (Days 5-7)

### Task 3.1: Add Missing Component Tests

**Priority:** 🟡 MEDIUM  
**Effort:** 1 day  
**Dependencies:** Task 2.1  
**Owner:** Frontend Engineer

#### Requirements

- Create `ReportViewerPage.test.tsx`
- Create `ShareReportModal.test.tsx`
- Create `ExcelViewer.test.tsx`

#### Acceptance Criteria

- [ ] All component tests created
- [ ] Component test coverage >70%
- [ ] `pnpm run test:unit` passes all tests

---

### Task 3.2: Improve Excel Viewer

**Priority:** 🟡 MEDIUM  
**Effort:** 0.5 days  
**Dependencies:** None  
**Owner:** Frontend Engineer

#### Requirements

- Add pagination or virtualization for large Excel files
- Show row count indicator
- Add download button for full data

#### Acceptance Criteria

- [ ] Large files (>1000 rows) handled gracefully
- [ ] User can download full Excel file from preview
- [ ] Row count displayed
- [ ] Performance acceptable for 10,000 row files

---

### Task 3.3: Add Accessibility Improvements

**Priority:** 🟡 MEDIUM  
**Effort:** 0.5 days  
**Dependencies:** None  
**Owner:** Frontend Engineer

#### Requirements

- Add live regions for success/loading announcements
- Verify color contrast with WCAG tool
- Add keyboard shortcuts for common actions

#### Acceptance Criteria

- [ ] Screen reader announces download start/complete
- [ ] All color combinations pass WCAG AA
- [ ] Keyboard navigation works without mouse
- [ ] Accessibility audit passes

---

### Task 3.4: Add Integration Tests

**Priority:** 🟡 MEDIUM  
**Effort:** 1 day  
**Dependencies:** Task 1.2, 1.3  
**Owner:** Backend Engineer

#### Requirements

- Test full report lifecycle: create → upload content → download → delete
- Test share link flow: create → access → revoke
- Test version management

#### Acceptance Criteria

- [ ] Integration test suite created
- [ ] Tests run in CI pipeline
- [ ] All tests passing
- [ ] Test coverage report generated

---

### Task 3.5: Documentation

**Priority:** 🟡 MEDIUM  
**Effort:** 0.5 days  
**Dependencies:** All implementation tasks  
**Owner:** Technical Writer

#### Requirements

- Update API documentation with new endpoints
- Add user guide for reports feature
- Document storage configuration
- Create troubleshooting guide

#### Acceptance Criteria

- [ ] API docs updated with `uploadContent`, `auditTrail` procedures
- [ ] User guide in `/docs/user-guide/reports.md`
- [ ] Storage setup documented in `/docs/deployment/storage-setup.md`
- [ ] Troubleshooting guide covers common issues

---

## Testing Strategy

### Unit Tests

```bash
# Run reports feature tests
pnpm --filter @agenticverdict/frontend test -- reports

# Run with coverage
pnpm --filter @agenticverdict/frontend test:coverage -- reports
```

**Target Coverage:**

| File                 | Target |
| -------------------- | ------ |
| report-api.ts        | 90%    |
| ReportListPage.tsx   | 85%    |
| ReportViewerPage.tsx | 80%    |
| ShareReportModal.tsx | 85%    |
| ExcelViewer.tsx      | 75%    |

### Integration Tests

```bash
# Run API integration tests
pnpm --filter @agenticverdict/api test:integration -- reports
```

**Test Scenarios:**

1. Upload report content → retrieve content → verify SHA-256
2. Create share link → access shared report → revoke → verify access denied
3. Upload multiple versions → switch versions → verify content matches

### E2E Tests

```bash
# Run Playwright E2E tests
pnpm run test:e2e -- reports
```

**Test Flows:**

1. Navigate to reports list → filter → download single report
2. Select multiple reports → bulk download → verify ZIP contents
3. Share report → open in incognito → download → verify access
4. View report → switch version → verify content changes

---

## Definition of Done

### Code Quality

- [ ] Zero TypeScript errors (`pnpm run typecheck`)
- [ ] Zero ESLint violations (`pnpm run lint`)
- [ ] Zero TODO/FIXME comments
- [ ] All imports resolved (no missing dependencies)

### Testing

- [ ] Unit test coverage >70% overall
- [ ] Unit test coverage >85% business logic
- [ ] Unit test coverage >90% critical paths
- [ ] All integration tests passing
- [ ] E2E smoke tests passing

### Documentation

- [ ] API documentation updated
- [ ] User guide written
- [ ] Deployment guide includes storage setup
- [ ] Changelog entry created

### Performance

- [ ] Report list loads in <2 seconds
- [ ] Report content downloads in <5 seconds (10MB file)
- [ ] Excel preview renders in <3 seconds (1000 rows)
- [ ] No memory leaks in long-running sessions

### Security

- [ ] Tenant isolation verified in all queries
- [ ] No sensitive data in logs
- [ ] Share links expire correctly
- [ ] Audit trail captures all actions

---

## Risk Mitigation

| Risk                                | Impact | Mitigation                                                |
| ----------------------------------- | ------ | --------------------------------------------------------- |
| Storage integration delays          | HIGH   | Use local filesystem for initial deployment, add S3 later |
| Test coverage gaps                  | MEDIUM | Prioritize critical path tests first                      |
| Performance issues with large files | MEDIUM | Implement pagination, add file size warnings              |
| Share link security vulnerabilities | HIGH   | Security review before deployment                         |

---

## Rollout Plan

### Phase 1: Internal Testing (Week 1)

- Deploy behind feature flag
- Enable for engineering team only
- Monitor error logs closely
- Fix critical bugs immediately

### Phase 2: Beta Users (Week 2-3)

- Enable for 5-10 beta users
- Collect feedback on UX
- Monitor performance metrics
- Iterate based on feedback

### Phase 3: GA Release (Week 4)

- Enable for all users
- Remove feature flag
- Monitor adoption metrics
- Prepare support documentation

---

## Success Metrics

| Metric                       | Target     | Measurement                  |
| ---------------------------- | ---------- | ---------------------------- |
| Report download success rate | >99%       | Error logs / total downloads |
| Average download time        | <5 seconds | Performance monitoring       |
| User satisfaction (NPS)      | >8/10      | User feedback survey         |
| Support tickets              | <5/week    | Help desk tracking           |
| Test coverage                | >70%       | Coverage reports             |

---

## Appendix: File Changes Summary

### New Files

```
apps/api/src/lib/storage/reports-storage.ts
apps/api/src/trpc/routers/reports.audit-trail.ts (optional, or add to reports.ts)
apps/frontend/src/features/reports/pages/ReportDetailPage.tsx
apps/frontend/src/features/reports/pages/ReportViewerPage.test.tsx
apps/frontend/src/features/reports/pages/ShareReportModal.test.tsx
apps/frontend/src/features/reports/ui/ExcelViewer.test.tsx
docs/user-guide/reports.md
docs/deployment/storage-setup.md
```

### Modified Files

```
apps/api/src/trpc/routers/reports.ts (content, uploadContent, auditTrail procedures)
apps/frontend/src/features/reports/pages/ReportListPage.tsx (download handlers)
apps/frontend/src/features/reports/pages/ReportViewerPage.tsx (version selector)
apps/frontend/src/features/reports/pages/ReportListPage.test.tsx (enable)
.env.docker.example (add storage configuration)
```

### Configuration Changes

```bash
# .env.docker.example
STORAGE_PROVIDER=local  # or s3
STORAGE_ENDPOINT=http://minio:9000  # for local, or S3 endpoint
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=agenticverdict-reports
```

---

**Approval:**  
[ ] Engineering Lead  
[ ] Product Owner  
[ ] Security Review

**Start Date:** ****\_\_\_****  
**Target Completion:** ****\_\_\_****
