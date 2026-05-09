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
