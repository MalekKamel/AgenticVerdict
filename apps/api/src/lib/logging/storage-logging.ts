import type { Logger } from "@agenticverdict/observability";

export interface StorageUploadLogContext {
  tenantId: string;
  reportId?: string;
  storageKey: string;
  contentType?: string;
  bytesUploaded: number;
  sha256Hash: string;
  durationMs: number;
  requestId: string;
}

export interface StorageDownloadLogContext {
  tenantId: string;
  reportId?: string;
  storageKey: string;
  bytesDownloaded: number;
  sha256Hash: string;
  durationMs: number;
  requestId: string;
}

export interface StorageErrorLogContext {
  tenantId: string;
  reportId?: string;
  storageKey: string;
  operation: "upload" | "download" | "delete" | "exists";
  errorType: string;
  errorMessage: string;
  durationMs: number;
  requestId: string;
}

export function logStorageUpload(logger: Logger, context: StorageUploadLogContext): void {
  logger.info(
    {
      event: "storage_upload_completed",
      tenantId: context.tenantId,
      reportId: context.reportId,
      storageKey: context.storageKey,
      contentType: context.contentType,
      bytesUploaded: context.bytesUploaded,
      sha256Hash: context.sha256Hash,
      durationMs: context.durationMs,
      requestId: context.requestId,
    },
    "Storage upload completed",
  );
}

export function logStorageDownload(logger: Logger, context: StorageDownloadLogContext): void {
  logger.info(
    {
      event: "storage_download_completed",
      tenantId: context.tenantId,
      reportId: context.reportId,
      storageKey: context.storageKey,
      bytesDownloaded: context.bytesDownloaded,
      sha256Hash: context.sha256Hash,
      durationMs: context.durationMs,
      requestId: context.requestId,
    },
    "Storage download completed",
  );
}

export function logStorageError(logger: Logger, context: StorageErrorLogContext): void {
  logger.error(
    {
      event: "storage_operation_error",
      tenantId: context.tenantId,
      reportId: context.reportId,
      storageKey: context.storageKey,
      operation: context.operation,
      errorType: context.errorType,
      errorMessage: context.errorMessage,
      durationMs: context.durationMs,
      requestId: context.requestId,
    },
    "Storage operation error",
  );
}
