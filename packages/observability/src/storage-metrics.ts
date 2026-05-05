import { Counter, Histogram } from "prom-client";

import { productionFlowTestRegistry } from "./registry";

const storageUploadDurationSeconds = new Histogram({
  name: "agenticverdict_storage_upload_duration_seconds",
  help: "Storage upload operation duration",
  labelNames: ["tenantId", "operation", "outcome"],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [productionFlowTestRegistry],
});

const storageDownloadDurationSeconds = new Histogram({
  name: "agenticverdict_storage_download_duration_seconds",
  help: "Storage download operation duration",
  labelNames: ["tenantId", "operation", "outcome"],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [productionFlowTestRegistry],
});

const storageBytesUploadedTotal = new Counter({
  name: "agenticverdict_storage_bytes_uploaded_total",
  help: "Total bytes uploaded to storage",
  labelNames: ["tenantId"],
  registers: [productionFlowTestRegistry],
});

const storageBytesDownloadedTotal = new Counter({
  name: "agenticverdict_storage_bytes_downloaded_total",
  help: "Total bytes downloaded from storage",
  labelNames: ["tenantId"],
  registers: [productionFlowTestRegistry],
});

const storageErrorsTotal = new Counter({
  name: "agenticverdict_storage_errors_total",
  help: "Storage operation errors",
  labelNames: ["tenantId", "error_type", "operation"],
  registers: [productionFlowTestRegistry],
});

export interface StorageUploadMetric {
  tenantId: string;
  operation: string;
  durationSeconds: number;
  outcome: "success" | "failure";
  bytesUploaded?: number;
  errorType?: string;
}

export interface StorageDownloadMetric {
  tenantId: string;
  operation: string;
  durationSeconds: number;
  outcome: "success" | "failure";
  bytesDownloaded?: number;
  errorType?: string;
}

export function recordStorageUploadCompleted(metric: StorageUploadMetric): void {
  if (!Number.isFinite(metric.durationSeconds) || metric.durationSeconds < 0) {
    return;
  }

  storageUploadDurationSeconds.observe(
    {
      tenantId: metric.tenantId,
      operation: metric.operation,
      outcome: metric.outcome,
    },
    metric.durationSeconds,
  );

  if (metric.bytesUploaded !== undefined && metric.bytesUploaded > 0) {
    storageBytesUploadedTotal.inc({ tenantId: metric.tenantId }, metric.bytesUploaded);
  }

  if (metric.outcome === "failure" && metric.errorType) {
    storageErrorsTotal.inc({
      tenantId: metric.tenantId,
      error_type: metric.errorType,
      operation: metric.operation,
    });
  }
}

export function recordStorageDownloadCompleted(metric: StorageDownloadMetric): void {
  if (!Number.isFinite(metric.durationSeconds) || metric.durationSeconds < 0) {
    return;
  }

  storageDownloadDurationSeconds.observe(
    {
      tenantId: metric.tenantId,
      operation: metric.operation,
      outcome: metric.outcome,
    },
    metric.durationSeconds,
  );

  if (metric.bytesDownloaded !== undefined && metric.bytesDownloaded > 0) {
    storageBytesDownloadedTotal.inc({ tenantId: metric.tenantId }, metric.bytesDownloaded);
  }

  if (metric.outcome === "failure" && metric.errorType) {
    storageErrorsTotal.inc({
      tenantId: metric.tenantId,
      error_type: metric.errorType,
      operation: metric.operation,
    });
  }
}
