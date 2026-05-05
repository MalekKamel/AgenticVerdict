# Reports Feature Remediation: Phase 2 & 3

**Created:** 2026-05-04  
**Priority:** HIGH  
**Estimated Effort:** 4-5 developer days  
**Target:** Production-ready feature  
**Scope:** High Priority Features (Days 3-4) + Polish & Testing (Days 5-7)

---

## Overview

This document covers **Phase 2** and **Phase 3** of the Reports Feature Remediation Plan. These phases focus on enabling testing infrastructure, implementing high-priority user features, and ensuring production readiness through comprehensive testing and documentation.

**Prerequisites:** Phase 1 (Critical Blockers) must be completed before starting this work, as Tasks 2.1-3.5 depend on the storage infrastructure and content upload/download endpoints implemented in Phase 1.

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
**Dependencies:** Task 1.2 (Phase 1)  
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
**Dependencies:** Task 1.4 (Phase 1)  
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
**Dependencies:** Task 1.2, 1.3 (Phase 1)  
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

## SeaweedFS Integration Testing Notes

### Configuration

The application uses SeaweedFS S3-compatible API for blob storage. Configure your test environment:

```bash
# .env.local or .env.test
STORAGE_PROVIDER=s3
STORAGE_ENDPOINT=http://localhost:8333  # SeaweedFS S3 gateway
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=test-access-key
STORAGE_SECRET_KEY=test-secret-key
STORAGE_BUCKET=agenticverdict-reports-test
```

### Local SeaweedFS Setup for Testing

```bash
# Start SeaweedFS locally for integration tests
docker run -d \
  -p 8333:8333 \
  -p 9333:9333 \
  --name seaweedfs-test \
  chrislusf/seaweedfs \
  server -s3
```

### Test Considerations

1. **Bucket Cleanup:** Integration tests should create unique test buckets and clean up after execution to avoid conflicts.

2. **Tenant Isolation:** Verify that tenant-scoped paths prevent cross-tenant access:

   ```typescript
   // Test should fail when accessing another tenant's report
   await expect(storage.getContent("tenant-b", "report-a", 1, "pdf")).rejects.toThrow("NotFound");
   ```

3. **SHA-256 Verification:** Test that uploaded content hash matches retrieved content:

   ```typescript
   const uploaded = await storage.uploadContent(
     tenantId,
     reportId,
     1,
     "pdf",
     content,
     "application/pdf",
   );
   const retrieved = await storage.getContent(tenantId, reportId, 1, "pdf");
   const retrievedHash = crypto.createHash("sha256").update(retrieved.content).digest("hex");
   expect(retrievedHash).toBe(uploaded.sha256);
   ```

4. **Error Handling:** Test SeaweedFS-specific error codes (e.g., bucket not found, access denied, quota exceeded).

5. **Performance:** Measure upload/download latency for files of varying sizes (1MB, 10MB, 50MB).

### Mock Mode for CI

For CI environments without SeaweedFS, use the mock adapter:

```bash
# .env.ci
AGENTICVERDICT_MOCK_MODE=storage
AGENTICVERDICT_MOCK_SEED=42001
```

Verify mock mode is active:

```bash
curl http://localhost:3000/api/health/adapters | jq '.storage.mockMode'
```

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

## Success Metrics

| Metric                       | Target     | Measurement                  |
| ---------------------------- | ---------- | ---------------------------- |
| Report download success rate | >99%       | Error logs / total downloads |
| Average download time        | <5 seconds | Performance monitoring       |
| User satisfaction (NPS)      | >8/10      | User feedback survey         |
| Support tickets              | <5/week    | Help desk tracking           |
| Test coverage                | >70%       | Coverage reports             |

---

## File Changes Summary

### New Files

```
apps/frontend/src/features/reports/pages/ReportDetailPage.tsx
apps/frontend/src/features/reports/pages/ReportViewerPage.test.tsx
apps/frontend/src/features/reports/pages/ShareReportModal.test.tsx
apps/frontend/src/features/reports/ui/ExcelViewer.test.tsx
docs/user-guide/reports.md
docs/deployment/storage-setup.md
```

### Modified Files

```
apps/api/src/trpc/routers/reports.ts (auditTrail procedure)
apps/frontend/src/features/reports/pages/ReportListPage.test.tsx (enable)
apps/frontend/src/features/reports/pages/ReportViewerPage.tsx (version selector)
.env.docker.example (add SeaweedFS storage configuration)
```

### Configuration Changes

```bash
# .env.docker.example
STORAGE_PROVIDER=s3
STORAGE_ENDPOINT=http://seaweedfs:8333  # SeaweedFS S3 gateway
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_BUCKET=agenticverdict-reports
```

---

## Risk Mitigation

| Risk                                | Impact | Mitigation                                        |
| ----------------------------------- | ------ | ------------------------------------------------- |
| Test coverage gaps                  | MEDIUM | Prioritize critical path tests first              |
| Performance issues with large files | MEDIUM | Implement pagination, add file size warnings      |
| Share link security vulnerabilities | HIGH   | Security review before deployment                 |
| SeaweedFS integration issues        | MEDIUM | Use mock adapter for CI, test locally with Docker |

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

**Approval:**  
[ ] Engineering Lead  
[ ] Product Owner  
[ ] Security Review

**Start Date:** ****\_\_\_****  
**Target Completion:** ****\_\_\_****
