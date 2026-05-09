# Download Logic Consolidation — Implementation Plan

## 1. Analysis Summary

### 1.1 Current State

Download logic is duplicated across **4 files** with **3 distinct patterns**:

| File                                                              | Pattern                            | Lines Duplicated |
| ----------------------------------------------------------------- | ---------------------------------- | ---------------- |
| `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx` | Single + Bulk (tRPC base64 → Blob) | ~70              |
| `apps/frontend/src/features/reports/pages/ReportListPage.tsx`     | Single + Bulk (tRPC base64 → Blob) | ~70              |
| `apps/frontend/src/features/reports/pages/ReportViewerPage.tsx`   | Single (data URI)                  | ~10              |
| `apps/frontend/src/features/reports/pages/SharedReportPage.tsx`   | Single (data URI)                  | ~10              |

### 1.2 Duplicated Logic Identified

**Single-file download** (repeated 4×):

1. Show "downloading" info notification
2. Fetch content via tRPC (`trpcClient.report.content.query` or pre-fetched `reportContent`)
3. Decode base64 content (`atob`) → `Uint8Array` → `Blob`
4. Create temporary `<a>` element with `URL.createObjectURL`
5. Set `download` attribute with filename + extension
6. Trigger click, cleanup DOM element, revoke object URL
7. Show success/error notification

**Bulk download** (repeated 2×, near-identical):

1. Validate max 10 files
2. Show "preparing" info notification for 3+ files
3. Create `JSZip` instance with `reports/` folder
4. Loop: fetch each report via tRPC, decode base64, add to zip
5. Generate zip blob, create download link, trigger, cleanup
6. Show success/error notification

### 1.3 Divergent Behavior

| Aspect               | Variation                                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Content source**   | tRPC query (InsightDetail, ReportList) vs. pre-fetched query data (ReportViewer, SharedReport)                    |
| **Filename source**  | `report.title` (all)                                                                                              |
| **Format detection** | `metadata.format` fallback `"pdf"` (InsightDetail, ReportList) vs. hardcoded `"pdf"` (ReportViewer, SharedReport) |
| **Error handling**   | `getReportErrorMessage()` (InsightDetail, ReportList) vs. no error handling (ReportViewer, SharedReport)          |
| **Notification**     | Full info→success/error flow (InsightDetail, ReportList) vs. success-only (ReportViewer) vs. none (SharedReport)  |
| **Bulk limit**       | 10 reports (both implementations)                                                                                 |

### 1.4 Shared Dependencies

- `JSZip` — bulk zip creation
- `trpcClient` from `@/lib/api/trpc-client` — content fetching
- `showSuccessNotification`, `showErrorNotification`, `showInfoNotification` from `@/lib/notifications`
- `getReportErrorMessage` from feature-level error translators
- `ReportListItem` type from `@/features/reports/types`
- `ReportContent` type from `@/features/reports/types`

---

## 2. Service Architecture

### 2.1 File Structure

```
apps/frontend/src/lib/download/
├── service.ts              # Core download service (pure functions)
├── types.ts                # TypeScript interfaces
├── helpers.ts              # Base64 decoding, blob creation, file trigger
├── notifications.ts        # Download-specific notification helpers
└── index.ts                # Public API exports
```

### 2.2 Module Location Rationale

Placed under `apps/frontend/src/lib/download/` (not feature-scoped) because:

- Download logic is **domain-agnostic** — any feature may need file downloads
- Follows existing `lib/` patterns (`lib/notifications`, `lib/tenant-context`, etc.)
- Avoids circular dependencies between features
- Enables future reuse beyond reports (e.g., insight exports, connector data dumps)

### 2.3 Multi-Tenant Considerations

The service itself is **tenant-agnostic** — tenant scoping is handled at the tRPC layer. The service receives already-scoped data from tRPC queries. No additional tenant handling is needed within the download service.

---

## 3. API Contract

### 3.1 TypeScript Interfaces

```typescript
// apps/frontend/src/lib/download/types.ts

/** Supported report formats for download */
export type DownloadFormat = "pdf" | "excel";

/** File extension mapping for supported formats */
export const FORMAT_EXTENSIONS: Record<DownloadFormat, string> = {
  pdf: "pdf",
  excel: "xlsx",
};

/** Parameters for a single report download */
export interface DownloadReportParams {
  /** Report ID for tRPC content fetch */
  reportId: string;
  /** Display name for the downloaded file (without extension) */
  fileName: string;
  /** Output format (detected from metadata if not provided) */
  format?: DownloadFormat;
  /** Optional metadata object for format auto-detection */
  metadata?: Record<string, unknown> | null;
}

/** Parameters for bulk report download (ZIP) */
export interface BulkDownloadParams {
  /** Array of report objects with required fields */
  reports: Array<{
    id: string;
    title: string;
    metadata?: Record<string, unknown> | null;
  }>;
  /** Maximum number of reports allowed in a single bulk download */
  maxCount?: number;
}

/** Result of a download operation */
export interface DownloadResult {
  /** Whether the download succeeded */
  success: boolean;
  /** Number of files successfully downloaded (1 for single, N for bulk) */
  fileCount: number;
  /** Number of files that failed (0 for single downloads) */
  failureCount: number;
}
```

### 3.2 Core Service API

```typescript
// apps/frontend/src/lib/download/service.ts

/**
 * Download a single report file (PDF or Excel)
 *
 * Flow: fetch content → decode base64 → create blob → trigger browser download
 */
export async function downloadReport(params: DownloadReportParams): Promise<DownloadResult>;

/**
 * Download multiple reports as a ZIP archive
 *
 * Flow: validate count → fetch each → add to JSZip → generate blob → trigger download
 */
export async function bulkDownloadReports(params: BulkDownloadParams): Promise<DownloadResult>;

/**
 * Download from pre-fetched content (for ReportViewerPage, SharedReportPage patterns)
 *
 * Flow: use existing base64 content → create blob → trigger browser download
 */
export function downloadFromContent(params: {
  content: string;
  contentType: string;
  fileName: string;
  extension: string;
}): void;
```

### 3.3 Helper Functions

```typescript
// apps/frontend/src/lib/download/helpers.ts

/** Decode base64 string to Uint8Array */
export function base64ToUint8Array(base64: string): Uint8Array;

/** Create a Blob from base64 content with proper MIME type */
export function createBlobFromBase64(base64: string, contentType: string): Blob;

/** Trigger browser file download via temporary <a> element */
export function triggerFileDownload(blob: Blob, fileName: string): void;

/** Detect format from report metadata with safe fallback */
export function detectFormatFromMetadata(
  metadata?: Record<string, unknown> | null,
  fallback?: DownloadFormat,
): DownloadFormat;
```

### 3.4 Notification Helpers

The notification helpers use the existing `getNotificationTranslation` pattern from `@/lib/notifications-i18n` to support all locales (en, ar, fr, es, zh).

**Required i18n keys** (add to all locale files in `packages/i18n/src/locales/*.json`):

```json
{
  "download.notifications.started.title": "Downloading report",
  "download.notifications.started.message": "{fileName} is being downloaded",
  "download.notifications.complete.title": "Download complete",
  "download.notifications.complete.message": "{fileName} downloaded successfully",
  "download.notifications.completeBulk.message": "{count} reports downloaded successfully",
  "download.notifications.failed.title": "Download failed",
  "download.notifications.failed.message": "{context}: {message}",
  "download.notifications.preparing.title": "Preparing download",
  "download.notifications.preparing.message": "Preparing {count} reports for download..."
}
```

```typescript
// apps/frontend/src/lib/download/notifications.ts

import {
  showSuccessNotification,
  showErrorNotification,
  showInfoNotification,
} from "@/lib/notifications";
import { getNotificationTranslation } from "@/lib/notifications-i18n";

export function showDownloadStartedNotification(fileName: string): string | undefined {
  return showInfoNotification({
    title: getNotificationTranslation("download.notifications.started.title"),
    message: getNotificationTranslation("download.notifications.started.message")?.replace(
      "{fileName}",
      fileName,
    ),
  });
}

export function showDownloadCompleteNotification(fileName: string, count?: number): void {
  if (count && count > 1) {
    showSuccessNotification({
      title: getNotificationTranslation("download.notifications.complete.title"),
      message: getNotificationTranslation("download.notifications.completeBulk.message")?.replace(
        "{count}",
        String(count),
      ),
    });
  } else {
    showSuccessNotification({
      title: getNotificationTranslation("download.notifications.complete.title"),
      message: getNotificationTranslation("download.notifications.complete.message")?.replace(
        "{fileName}",
        fileName,
      ),
    });
  }
}

export function showDownloadFailedNotification(error: unknown, context: string): void {
  const message =
    error instanceof Error
      ? error.message
      : getNotificationTranslation("errors.common.unknownError");
  showErrorNotification({
    title: getNotificationTranslation("download.notifications.failed.title"),
    message: getNotificationTranslation("download.notifications.failed.message")
      ?.replace("{context}", context)
      .replace("{message}", message),
  });
}

export function showBulkDownloadPreparingNotification(count: number): void {
  showInfoNotification({
    title: getNotificationTranslation("download.notifications.preparing.title"),
    message: getNotificationTranslation("download.notifications.preparing.message")?.replace(
      "{count}",
      String(count),
    ),
  });
}
```

---

## 4. Implementation Details

### 4.1 `helpers.ts` — Pure Utility Functions

```typescript
export function base64ToUint8Array(base64: string): Uint8Array {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Uint8Array(byteNumbers);
}

export function createBlobFromBase64(base64: string, contentType: string): Blob {
  return new Blob([base64ToUint8Array(base64)], { type: contentType });
}

export function triggerFileDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function detectFormatFromMetadata(
  metadata?: Record<string, unknown> | null,
  fallback: DownloadFormat = "pdf",
): DownloadFormat {
  const format = (metadata as { format?: string })?.format;
  if (format === "pdf" || format === "excel") return format;
  return fallback;
}
```

### 4.2 `service.ts` — Core Download Logic

```typescript
import { trpcClient } from "@/lib/api/trpc-client";
import { base64ToUint8Array, triggerFileDownload, detectFormatFromMetadata } from "./helpers";
import {
  showDownloadStartedNotification,
  showDownloadCompleteNotification,
  showDownloadFailedNotification,
  showBulkDownloadPreparingNotification,
} from "./notifications";
import type {
  DownloadReportParams,
  BulkDownloadParams,
  DownloadResult,
  DownloadFormat,
} from "./types";
import { FORMAT_EXTENSIONS } from "./types";
import JSZip from "jszip";

const BULK_MAX_COUNT = 10;

export async function downloadReport(params: DownloadReportParams): Promise<DownloadResult> {
  const format = detectFormatFromMetadata(params.metadata, params.format);
  const extension = FORMAT_EXTENSIONS[format];
  const fileName = `${params.fileName}.${extension}`;

  showDownloadStartedNotification(params.fileName);

  try {
    const data = await trpcClient.report.content.query({
      id: params.reportId,
      format,
    });

    const blob = new Blob([base64ToUint8Array(data.content)], {
      type: data.contentType,
    });

    triggerFileDownload(blob, fileName);
    showDownloadCompleteNotification(params.fileName);

    return { success: true, fileCount: 1, failureCount: 0 };
  } catch (error) {
    showDownloadFailedNotification(error, params.fileName);
    return { success: false, fileCount: 0, failureCount: 1 };
  }
}

export async function bulkDownloadReports(params: BulkDownloadParams): Promise<DownloadResult> {
  const maxCount = params.maxCount ?? BULK_MAX_COUNT;
  const { reports } = params;

  if (reports.length === 0) {
    return { success: false, fileCount: 0, failureCount: 0 };
  }

  if (reports.length > maxCount) {
    showDownloadFailedNotification(
      new Error(`Please select at most ${maxCount} reports for bulk download`),
      "Bulk download",
    );
    return { success: false, fileCount: 0, failureCount: 0 };
  }

  if (reports.length >= 3) {
    showBulkDownloadPreparingNotification(reports.length);
  }

  const zip = new JSZip();
  const reportsFolder = zip.folder("reports");
  let failureCount = 0;

  for (const report of reports) {
    try {
      const format = detectFormatFromMetadata(report.metadata);
      const extension = FORMAT_EXTENSIONS[format];

      const data = await trpcClient.report.content.query({
        id: report.id,
        format,
      });

      const byteArray = base64ToUint8Array(data.content);
      reportsFolder?.file(`${report.title}.${extension}`, byteArray);
    } catch (error) {
      console.error(`Failed to download report ${report.id}:`, error);
      failureCount++;
    }
  }

  try {
    const content = await zip.generateAsync({ type: "blob" });
    const zipFileName = `reports-${new Date().toISOString().split("T")[0]}.zip`;
    triggerFileDownload(content, zipFileName);

    const successCount = reports.length - failureCount;
    showDownloadCompleteNotification("reports", successCount);

    return {
      success: successCount > 0,
      fileCount: successCount,
      failureCount,
    };
  } catch (error) {
    showDownloadFailedNotification(error, "Bulk download");
    return { success: false, fileCount: 0, failureCount: reports.length };
  }
}

export function downloadFromContent(params: {
  content: string;
  contentType: string;
  fileName: string;
  extension: string;
}): void {
  const blob = new Blob([base64ToUint8Array(params.content)], {
    type: params.contentType,
  });
  triggerFileDownload(blob, `${params.fileName}.${params.extension}`);
}
```

### 4.3 `notifications.ts` — Notification Helpers

```typescript
import {
  showSuccessNotification,
  showErrorNotification,
  showInfoNotification,
} from "@/lib/notifications";

export function showDownloadStartedNotification(fileName: string): string | undefined {
  return showInfoNotification({
    title: "Downloading report",
    message: `${fileName} is being downloaded`,
  });
}

export function showDownloadCompleteNotification(fileName: string, count?: number): void {
  if (count && count > 1) {
    showSuccessNotification({
      title: "Download complete",
      message: `${count} reports downloaded successfully`,
    });
  } else {
    showSuccessNotification({
      title: "Download complete",
      message: `${fileName} downloaded successfully`,
    });
  }
}

export function showDownloadFailedNotification(error: unknown, context: string): void {
  const message = error instanceof Error ? error.message : "An unexpected error occurred";
  showErrorNotification({
    title: "Download failed",
    message: `${context}: ${message}`,
  });
}

export function showBulkDownloadPreparingNotification(count: number): void {
  showInfoNotification({
    title: "Preparing download",
    message: `Preparing ${count} reports for download...`,
  });
}
```

### 4.4 `index.ts` — Public API

```typescript
export { downloadReport, bulkDownloadReports, downloadFromContent } from "./service";
export {
  showDownloadStartedNotification,
  showDownloadCompleteNotification,
  showDownloadFailedNotification,
  showBulkDownloadPreparingNotification,
} from "./notifications";
export {
  base64ToUint8Array,
  createBlobFromBase64,
  triggerFileDownload,
  detectFormatFromMetadata,
} from "./helpers";
export type {
  DownloadFormat,
  DownloadReportParams,
  BulkDownloadParams,
  DownloadResult,
} from "./types";
export { FORMAT_EXTENSIONS } from "./types";
```

---

## 5. Migration Strategy

### 5.1 Phase 1: Create the Service (No Behavior Changes)

**Step 1.0:** Add i18n keys for download notifications to all locale files:

Add the following keys to each file in `packages/i18n/src/locales/*.json` (en, ar, fr, es, zh):

| Key                                           | English (en)                              | Arabic (ar)                          | French (fr)                                               | Spanish (es)                                  | Chinese (zh)                     |
| --------------------------------------------- | ----------------------------------------- | ------------------------------------ | --------------------------------------------------------- | --------------------------------------------- | -------------------------------- |
| `download.notifications.started.title`        | Downloading report                        | جاري تنزيل التقرير                   | Téléchargement du rapport                                 | Descargando informe                           | 正在下载报告                     |
| `download.notifications.started.message`      | {fileName} is being downloaded            | جاري تنزيل {fileName}                | {fileName} est en cours de téléchargement                 | {fileName} se está descargando                | 正在下载 {fileName}              |
| `download.notifications.complete.title`       | Download complete                         | اكتمل التنزيل                        | Téléchargement terminé                                    | Descarga completa                             | 下载完成                         |
| `download.notifications.complete.message`     | {fileName} downloaded successfully        | تم تنزيل {fileName} بنجاح            | {fileName} téléchargé avec succès                         | {fileName} descargado correctamente           | {fileName} 下载成功              |
| `download.notifications.completeBulk.message` | {count} reports downloaded successfully   | تم تنزيل {count} تقارير بنجاح        | {count} rapports téléchargés avec succès                  | {count} informes descargados correctamente    | {count} 个报告下载成功           |
| `download.notifications.failed.title`         | Download failed                           | فشل التنزيل                          | Échec du téléchargement                                   | Error de descarga                             | 下载失败                         |
| `download.notifications.failed.message`       | {context}: {message}                      | {context}: {message}                 | {context}: {message}                                      | {context}: {message}                          | {context}: {message}             |
| `download.notifications.preparing.title`      | Preparing download                        | جاري تحضير التنزيل                   | Préparation du téléchargement                             | Preparando descarga                           | 正在准备下载                     |
| `download.notifications.preparing.message`    | Preparing {count} reports for download... | جاري تحضير {count} تقارير للتنزيل... | Préparation de {count} rapports pour le téléchargement... | Preparando {count} informes para descargar... | 正在准备 {count} 个报告以下载... |

**Verification:** Run `pnpm --filter @agenticverdict/i18n test` to ensure translation parity across all locales.

**Step 1.1:** Create `apps/frontend/src/lib/download/` directory with all files:

- `types.ts`
- `helpers.ts`
- `notifications.ts`
- `service.ts`
- `index.ts`

**Step 1.2:** Add unit tests for pure functions:

- `helpers.test.ts` — test `base64ToUint8Array`, `createBlobFromBase64`, `detectFormatFromMetadata`
- `service.test.ts` — mock `trpcClient` and test `downloadReport`, `bulkDownloadReports` flows
- `notifications.test.ts` — mock `getNotificationTranslation` and verify correct key usage

**Verification:** `pnpm run typecheck` passes, tests pass.

### 5.2 Phase 2: Migrate ReportListPage

**Step 2.1:** Replace `handleDownloadReport` in `ReportListPage.tsx`:

```typescript
// Before: ~35 lines of inline logic
// After:
import { downloadReport } from "@/lib/download";

const handleDownloadReport = async (report: (typeof reports)[0]) => {
  await downloadReport({
    reportId: report.id,
    fileName: report.title,
    metadata: report.metadata,
  });
};
```

**Step 2.2:** Replace `handleBulkDownload` in `ReportListPage.tsx`:

```typescript
// Before: ~60 lines of inline logic
// After:
import { bulkDownloadReports } from "@/lib/download";

const handleBulkDownload = async () => {
  const selectedIds = Array.from(selectedReports);
  const selectedReportObjects = reports.filter((r) => selectedIds.includes(r.id));

  await bulkDownloadReports({ reports: selectedReportObjects });
};
```

**Step 2.3:** Remove unused imports:

- Remove `JSZip` import
- Remove `trpcClient` import (if no longer used elsewhere)
- Remove `showInfoNotification`, `showSuccessNotification`, `showErrorNotification` imports (if no longer used)

**Verification:** Manual testing — download single report, bulk download 2 reports, bulk download 5 reports, verify error handling with invalid report ID.

### 5.3 Phase 3: Migrate InsightDetailPage

**Step 3.1:** Replace `handleDownloadReport` in `InsightDetailPage.tsx`:

```typescript
import { downloadReport } from "@/lib/download";

const handleDownloadReport = async (report: ReportListItem) => {
  await downloadReport({
    reportId: report.id,
    fileName: report.title,
    metadata: report.metadata,
  });
};
```

**Step 3.2:** Replace `handleBulkDownload` in `InsightDetailPage.tsx`:

```typescript
import { bulkDownloadReports } from "@/lib/download";

const handleBulkDownload = async (reports: ReportListItem[]) => {
  if (reports.length === 0) return;
  await bulkDownloadReports({ reports });
};
```

**Step 3.3:** Remove unused imports (same as Phase 2.3).

**Verification:** Manual testing — navigate to insight detail page, download report from overview tab, download from reports tab, verify bulk download.

### 5.4 Phase 4: Migrate ReportViewerPage

**Step 4.1:** Replace `handleDownload` in `ReportViewerPage.tsx`:

```typescript
import { downloadFromContent, detectFormatFromMetadata } from "@/lib/download";
import { FORMAT_EXTENSIONS } from "@/lib/download/types";

const handleDownload = () => {
  if (!reportContent?.content) return;

  const format = detectFormatFromMetadata(report.metadata);
  downloadFromContent({
    content: reportContent.content,
    contentType: reportContent.contentType,
    fileName: report.title,
    extension: FORMAT_EXTENSIONS[format],
  });

  showSuccessNotification({ title: "Download started" });
};
```

**Verification:** Open report viewer, click download, verify file downloads with correct name and extension.

### 5.5 Phase 5: Migrate SharedReportPage

**Step 5.1:** Replace `handleDownload` in `SharedReportPage.tsx`:

```typescript
import { downloadFromContent } from "@/lib/download";

const handleDownload = () => {
  if (!reportContent?.content) return;

  downloadFromContent({
    content: reportContent.content,
    contentType: reportContent.contentType,
    fileName: report.title,
    extension: "pdf",
  });
};
```

**Verification:** Open shared report link, click download, verify file downloads.

### 5.6 Phase 6: Cleanup & Verification

**Step 6.1:** Run full typecheck: `pnpm run typecheck`
**Step 6.2:** Run lint: `pnpm run lint`
**Step 6.3:** Run frontend tests: `pnpm run test:unit --filter frontend`
**Step 6.4:** Run E2E tests for reports: `pnpm exec playwright test reports`
**Step 6.5:** Verify no remaining duplicated download logic via grep:

```bash
grep -r "atob(data.content)" apps/frontend/src/
grep -r "URL.createObjectURL" apps/frontend/src/
grep -r "URL.revokeObjectURL" apps/frontend/src/
```

All matches should only exist in `lib/download/helpers.ts`.

---

## 6. Testing Approach

### 6.1 Unit Tests (lib/download/)

**`helpers.test.ts`:**

- `base64ToUint8Array` — verify correct byte conversion
- `createBlobFromBase64` — verify blob type and size
- `detectFormatFromMetadata` — test all cases: `pdf`, `excel`, `null`, `undefined`, invalid format, fallback
- `triggerFileDownload` — mock `document.createElement`, `URL.createObjectURL`, verify DOM manipulation

**`service.test.ts`:**

- `downloadReport` — mock `trpcClient.report.content.query`, verify success path
- `downloadReport` — mock tRPC error, verify error handling returns `{ success: false }`
- `bulkDownloadReports` — mock multiple reports, verify zip generation
- `bulkDownloadReports` — test max count validation (>10 reports)
- `bulkDownloadReports` — test partial failure (some reports fail, some succeed)
- `downloadFromContent` — verify direct content download

### 6.2 Integration Verification

- **ReportListPage:** Single download, bulk download (2, 5, 10 reports), error state
- **InsightDetailPage:** Download from overview tab, download from reports tab
- **ReportViewerPage:** Download from viewer
- **SharedReportPage:** Download from shared view

### 6.3 E2E Test Updates

Update existing E2E tests in `apps/frontend/e2e/reports-critical-paths.spec.ts`:

- `should download a report` — verify still triggers download event
- `should bulk download selected reports` — verify zip download

No E2E test changes needed since the service preserves existing behavior.

---

## 7. Rollout Plan

### 7.1 Backward Compatibility

The service is designed for **zero behavior changes**:

- Same notification messages
- Same file naming conventions
- Same error handling patterns
- Same bulk download limit (10)
- Same format detection logic

### 7.2 Rollback Strategy

Each phase migrates one file independently. If any phase introduces issues:

1. Revert the specific file's changes via git
2. The service files remain in place (no harm)
3. Other migrated files are unaffected

### 7.3 Rollout Order

| Phase | Target            | Risk Level | Rollback Impact        |
| ----- | ----------------- | ---------- | ---------------------- |
| 1     | Create service    | Low        | Delete `lib/download/` |
| 2     | ReportListPage    | Medium     | Revert single file     |
| 3     | InsightDetailPage | Medium     | Revert single file     |
| 4     | ReportViewerPage  | Low        | Revert single file     |
| 5     | SharedReportPage  | Low        | Revert single file     |
| 6     | Cleanup           | None       | N/A                    |

---

## 8. Success Criteria

| Criterion                                   | Verification Method                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------ |
| All existing download logic is consolidated | Grep for `atob(data.content)`, `URL.createObjectURL` — only in `lib/download/` |
| Service API is clear, typed, and extensible | All interfaces exported, JSDoc documented, no `any` types                      |
| Migration steps are explicit and ordered    | This plan document                                                             |
| No regression risk after consolidation      | E2E tests pass, manual testing checklist complete                              |
| Zero duplicated download code               | `lib/download/` is the single source of truth                                  |
| All notification strings are localized      | All download notification keys exist in en, ar, fr, es, zh locale files        |
| Translation parity across locales           | `pnpm --filter @agenticverdict/i18n test` passes with no missing keys          |
| Error handling uses canonical error system  | `normalizeFrontendError` via `getReportErrorMessage` pattern                   |

---

## 9. Future Extensibility

The service design supports these future enhancements without API changes:

1. **Progress tracking** — Add optional `onProgress` callback to `DownloadReportParams`
2. **Cancellation** — Return `AbortController` from download functions
3. **Retry logic** — Add `maxRetries` parameter with exponential backoff
4. **Non-report downloads** — Generic `downloadFile` function for any blob/content
5. **Download queue** — Sequential download processing for large bulk operations
