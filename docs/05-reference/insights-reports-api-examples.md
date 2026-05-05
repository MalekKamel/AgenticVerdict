# Insights & Reports API Integration Examples

## Overview

This document provides examples of how to integrate with the Insights and Reports APIs using the React Query hooks provided in the features layer.

## Table of Contents

1. [Insights API](#insights-api)
2. [Reports API](#reports-api)
3. [Sharing API](#sharing-api)
4. [Audit Trail API](#audit-trail-api)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)

## Insights API

### List Insights

```typescript
import { useInsightList } from "@/features/insights/api/insight-api";

function InsightList() {
  const { data, isLoading, isError, error } = useInsightList({
    status: "enabled",
    search: "SEO",
    page: 1,
    pageSize: 20,
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage error={error} />;

  return (
    <div>
      {data?.insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
      <Pagination total={data.total} page={data.page} />
    </div>
  );
}
```

### Get Insight Detail

```typescript
import { useInsightDetail } from "@/features/insights/api/insight-api";

function InsightDetail({ insightId }: { insightId: string }) {
  const { data, isLoading, isError } = useInsightDetail(insightId);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage />;
  if (!data) return <NotFound />;

  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.description}</p>
      <StatusBadge status={data.enabled ? "enabled" : "disabled"} />
    </div>
  );
}
```

### Get Insight by Tenant and ID

```typescript
import { useInsightById } from "@/features/insights/api/insight-api";

function InsightView({ tenantId, insightId }: { tenantId: string; insightId: string }) {
  const { data, isLoading, isError } = useInsightById(tenantId, insightId);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage />;
  if (!data) return <NotFound />;

  return <InsightDetail insight={data} />;
}
```

### Create Insight

```typescript
import { useInsightCreate } from "@/features/insights/api/insight-api";
import { useRouter } from "@/router";

function CreateInsightForm() {
  const router = useRouter();
  const createMutation = useInsightCreate();

  const handleSubmit = async (formData: InsightCreateData) => {
    try {
      const result = await createMutation.mutateAsync(formData);

      // Show success toast
      toast.success("Insight created successfully");

      // Navigate to detail page
      router.push(`/dashboard/insights/${result.id}`);
    } catch (error) {
      toast.error("Failed to create insight");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={createMutation.isLoading}>
        {createMutation.isLoading ? "Creating..." : "Create Insight"}
      </button>
    </form>
  );
}
```

### Update Insight

```typescript
import { useInsightUpdate } from "@/features/insights/api/insight-api";

function EditInsightForm({ insightId }: { insightId: string }) {
  const updateMutation = useInsightUpdate();

  const handleSave = async (formData: InsightUpdateData) => {
    try {
      await updateMutation.mutateAsync({
        id: insightId,
        ...formData,
      });

      toast.success("Insight updated successfully");
    } catch (error) {
      toast.error("Failed to update insight");
    }
  };

  return (
    <form onSubmit={handleSave}>
      {/* Form fields */}
      <button type="submit" disabled={updateMutation.isLoading}>
        {updateMutation.isLoading ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}
```

### Delete Insight

```typescript
import { useInsightDelete } from "@/features/insights/api/insight-api";
import { useRouter } from "@/router";

function InsightActions({ insightId }: { insightId: string }) {
  const router = useRouter();
  const deleteMutation = useInsightDelete();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this insight?")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ id: insightId });
      toast.success("Insight deleted successfully");
      router.push("/dashboard/insights");
    } catch (error) {
      toast.error("Failed to delete insight");
    }
  };

  return (
    <Button color="red" onClick={handleDelete} disabled={deleteMutation.isLoading}>
      Delete Insight
    </Button>
  );
}
```

### Run Insight Manually

```typescript
import { useInsightRun } from "@/features/insights/api/insight-api";

function RunNowButton({ insightId }: { insightId: string }) {
  const runMutation = useInsightRun();

  const handleRun = async () => {
    try {
      await runMutation.mutateAsync({ id: insightId });
      toast.success("Insight run started");
    } catch (error) {
      toast.error("Failed to run insight");
    }
  };

  return (
    <Button onClick={handleRun} disabled={runMutation.isLoading}>
      {runMutation.isLoading ? "Running..." : "Run Now"}
    </Button>
  );
}
```

## Reports API

### List Reports

```typescript
import { useReportList } from "@/features/reports/api/report-api";

function ReportList() {
  const { data, isLoading, isError } = useReportList({
    dateFrom: "2024-01-01",
    dateTo: "2024-12-31",
    format: "pdf",
    status: "ready",
    search: "Monthly",
    page: 1,
    pageSize: 20,
  });

  if (isLoading) return <TableSkeleton />;
  if (isError) return <ErrorMessage />;

  return (
    <Table>
      <TableHead />
      <TableBody>
        {data?.reports.map((report) => (
          <ReportRow key={report.id} report={report} />
        ))}
      </TableBody>
    </Table>
  );
}
```

### Get Report Detail

```typescript
import { useReportDetail } from "@/features/reports/api/report-api";

function ReportHeader({ reportId }: { reportId: string }) {
  const { data, isLoading } = useReportDetail(reportId);

  if (isLoading) return <Skeleton />;
  if (!data) return null;

  return (
    <div>
      <h1>{data.name}</h1>
      <Badge>{data.format}</Badge>
      <StatusBadge status={data.status} />
    </div>
  );
}
```

### Get Report Content

```typescript
import { useReportContent } from "@/features/reports/api/report-api";

function ReportViewer({ reportId, format }: { reportId: string; format: "pdf" | "excel" }) {
  const { data, isLoading, isError } = useReportContent(reportId, format);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage />;
  if (!data) return null;

  if (format === "pdf") {
    return <PdfViewer data={data.data} />;
  } else {
    return <ExcelViewer data={data.data} />;
  }
}
```

### Get Report by Tenant and ID

```typescript
import { useReportById } from "@/features/reports/api/report-api";

function ReportView({ tenantId, reportId }: { tenantId: string; reportId: string }) {
  const { data, isLoading } = useReportById(tenantId, reportId);

  if (isLoading) return <LoadingSpinner />;
  if (!data) return <NotFound />;

  return <ReportDetail report={data} />;
}
```

### Get Report Content with Version

```typescript
import { useReportContent } from "@/features/reports/api/report-api";

function VersionedReportViewer({
  tenantId,
  reportId,
  versionHash,
}: {
  tenantId: string;
  reportId: string;
  versionHash?: string;
}) {
  const { data, isLoading } = useReportContent(tenantId, reportId, versionHash);

  if (isLoading) return <LoadingSpinner />;
  if (!data) return <NotFound />;

  return <ReportViewer content={data} />;
}
```

### Delete Report

```typescript
import { useReportDelete } from "@/features/reports/api/report-api";

function DeleteReportButton({ reportId }: { reportId: string }) {
  const deleteMutation = useReportDelete();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this report?")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ id: reportId });
      toast.success("Report deleted successfully");
    } catch (error) {
      toast.error("Failed to delete report");
    }
  };

  return (
    <Button color="red" onClick={handleDelete} disabled={deleteMutation.isLoading}>
      Delete Report
    </Button>
  );
}
```

### Bulk Delete Reports

```typescript
import { useReportDeleteMany } from "@/features/reports/api/report-api";

function BulkDeleteButton({ reportIds }: { reportIds: string[] }) {
  const deleteManyMutation = useReportDeleteMany();

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${reportIds.length} reports?`)) {
      return;
    }

    try {
      await deleteManyMutation.mutateAsync({ ids: reportIds });
      toast.success(`${reportIds.length} reports deleted`);
    } catch (error) {
      toast.error("Failed to delete reports");
    }
  };

  return (
    <Button
      color="red"
      onClick={handleBulkDelete}
      disabled={deleteManyMutation.isLoading || reportIds.length === 0}
    >
      Bulk Delete ({reportIds.length})
    </Button>
  );
}
```

## Sharing API

### Get Active Shares

```typescript
import { useReportShares } from "@/features/reports/api/report-api";

function ActiveSharesList({ tenantId, reportId }: { tenantId: string; reportId: string }) {
  const { data, isLoading } = useReportShares(tenantId, reportId);

  if (isLoading) return <LoadingSpinner />;
  if (!data?.shares) return <Text>No active shares</Text>;

  return (
    <List>
      {data.shares.map((share) => (
        <ShareItem key={share.id} share={share} />
      ))}
    </List>
  );
}
```

### Create Share Link

```typescript
import { useCreateShareLink } from "@/features/reports/api/report-api";

function ShareReportModal({ tenantId, reportId }: { tenantId: string; reportId: string }) {
  const createShareMutation = useCreateShareLink();
  const [expiration, setExpiration] = useState("24h");
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const handleCreateShare = async () => {
    try {
      const result = await createShareMutation.mutateAsync({
        tenantId,
        reportId,
        expiration,
      });

      setShareUrl(result.shareUrl);
      toast.success("Share link created");
    } catch (error) {
      toast.error("Failed to create share link");
    }
  };

  return (
    <Modal>
      <Select
        value={expiration}
        onChange={setExpiration}
        data={[
          { value: "1h", label: "1 hour" },
          { value: "24h", label: "24 hours" },
          { value: "7d", label: "7 days" },
          { value: "30d", label: "30 days" },
        ]}
      />
      <Button onClick={handleCreateShare} disabled={createShareMutation.isLoading}>
        {createShareMutation.isLoading ? "Creating..." : "Create Share Link"}
      </Button>

      {shareUrl && (
        <TextInput
          value={shareUrl}
          readOnly
          rightSection={<CopyButton value={shareUrl} />}
        />
      )}
    </Modal>
  );
}
```

### Revoke Share Link

```typescript
import { useRevokeShareLink } from "@/features/reports/api/report-api";

function RevokeShareButton({
  tenantId,
  reportId,
  shareId,
}: {
  tenantId: string;
  reportId: string;
  shareId: string;
}) {
  const revokeMutation = useRevokeShareLink();

  const handleRevoke = async () => {
    if (!confirm("Revoke this share link?")) {
      return;
    }

    try {
      await revokeMutation.mutateAsync({ tenantId, shareId });
      toast.success("Share link revoked");
    } catch (error) {
      toast.error("Failed to revoke share link");
    }
  };

  return (
    <Button color="red" onClick={handleRevoke} disabled={revokeMutation.isLoading}>
      Revoke
    </Button>
  );
}
```

## Audit Trail API

### Get Audit Trail

```typescript
import { useAuditTrail } from "@/features/insights/api/insight-api";

function AuditTrailTimeline({ tenantId, insightId }: { tenantId: string; insightId: string }) {
  const { data, isLoading } = useAuditTrail(tenantId, insightId);

  if (isLoading) return <LoadingSpinner />;
  if (!data?.events) return <Text>No audit trail available</Text>;

  return (
    <Timeline>
      {data.events.map((event) => (
        <TimelineItem key={event.id} event={event} />
      ))}
    </Timeline>
  );
}
```

### Filter Audit Trail by Event Type

```typescript
import { useAuditTrail } from "@/features/insights/api/insight-api";

function FilteredAuditTrail({
  tenantId,
  insightId,
  eventType,
}: {
  tenantId: string;
  insightId: string;
  eventType?: string;
}) {
  const { data, isLoading } = useAuditTrail(tenantId, insightId);

  if (isLoading) return <LoadingSpinner />;
  if (!data?.events) return null;

  const filteredEvents = eventType
    ? data.events.filter((event) => event.type === eventType)
    : data.events;

  return (
    <Timeline>
      {filteredEvents.map((event) => (
        <TimelineItem key={event.id} event={event} />
      ))}
    </Timeline>
  );
}
```

## Error Handling

### Using Error Translator

```typescript
import { useInsightList } from "@/features/insights/api/insight-api";
import { translateError } from "@/core/error-system";

function InsightListWithErrorHandling() {
  const { data, isLoading, isError, error } = useInsightList({});

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    const translatedError = translateError(error);
    return <ErrorMessage message={translatedError.userMessage} />;
  }

  return <InsightList data={data} />;
}
```

### Error Boundary

```typescript
import { ErrorBoundary } from "@/components/error-boundary";
import { useInsightList } from "@/features/insights/api/insight-api";

function InsightListWrapper() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <InsightListContent />
    </ErrorBoundary>
  );
}

function InsightListContent() {
  const { data, isLoading, isError } = useInsightList({});

  if (isLoading) return <LoadingSpinner />;
  if (isError) throw new Error("Failed to load insights");

  return <InsightList data={data} />;
}
```

## Best Practices

### 1. Always Handle Loading and Error States

```typescript
const { data, isLoading, isError } = useInsightList({});

if (isLoading) return <LoadingSpinner />;
if (isError) return <ErrorMessage />;
```

### 2. Use Optimistic Updates for Mutations

```typescript
const updateMutation = useInsightUpdate({
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["insight", id] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(["insight", id]);

    // Optimistically update
    queryClient.setQueryData(["insight", id], newData);

    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(["insight", id], context?.previous);
  },
});
```

### 3. Invalidate Queries on Mutation Success

```typescript
const createMutation = useInsightCreate({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["insights"] });
    queryClient.invalidateQueries({ queryKey: ["insight"] });
  },
});
```

### 4. Use Tenant Context from JWT

```typescript
// Tenant ID is automatically extracted from JWT
const { data } = useInsightById(tenantId, insightId);

// Don't hardcode tenant IDs
// ❌ const { data } = useInsightById("hardcoded-tenant", insightId);
```

### 5. Handle Empty States

```typescript
if (!data?.insights || data.insights.length === 0) {
  return <EmptyState onRefresh={() => refetch()} />;
}
```

### 6. Implement Retry Logic

```typescript
const { data, isLoading, isError, refetch } = useInsightList(
  {},
  {
    retry: (failureCount, error) => {
      // Retry on network errors, not on 4xx
      return failureCount < 3 && error.status !== 404;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
);
```

## Related Documentation

- [Router Navigation Guide](./router-navigation-guide.md)
- [Insights & Reports Routes](./insights-reports-routes.md)
- [Error System Guide](./error-system-guide.md)
- [React Query Best Practices](./react-query-guide.md)
