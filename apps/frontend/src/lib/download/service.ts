import { trpcClient } from "@/lib/api/trpc-client";
import { base64ToUint8Array, triggerFileDownload, detectFormatFromMetadata } from "./helpers";
import {
  showDownloadStartedNotification,
  showDownloadCompleteNotification,
  showDownloadFailedNotification,
  showBulkDownloadPreparingNotification,
} from "./notifications";
import type { DownloadReportParams, BulkDownloadParams, DownloadResult } from "./types";
import { FORMAT_EXTENSIONS } from "./types";
import JSZip from "jszip";

const BULK_MAX_COUNT = 10;

/**
 * Download a single report file (PDF or Excel)
 *
 * Flow: fetch content → decode base64 → create blob → trigger browser download
 */
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

    const blob = new Blob([base64ToUint8Array(data.content) as BlobPart], {
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

/**
 * Download multiple reports as a ZIP archive
 *
 * Flow: validate count → fetch each → add to JSZip → generate blob → trigger download
 */
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
}): void {
  const blob = new Blob([base64ToUint8Array(params.content) as BlobPart], {
    type: params.contentType,
  });
  triggerFileDownload(blob, `${params.fileName}.${params.extension}`);
}
