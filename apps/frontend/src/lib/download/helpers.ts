import type { DownloadFormat } from "./types";

/** Decode base64 string to Uint8Array */
export function base64ToUint8Array(base64: string): Uint8Array {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Uint8Array(byteNumbers);
}

/** Create a Blob from base64 content with proper MIME type */
export function createBlobFromBase64(base64: string, contentType: string): Blob {
  return new Blob([base64ToUint8Array(base64) as BlobPart], { type: contentType });
}

/** Trigger browser file download via temporary <a> element */
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

/** Detect format from report metadata with safe fallback */
export function detectFormatFromMetadata(
  metadata?: Record<string, unknown> | null,
  fallback: DownloadFormat = "pdf",
): DownloadFormat {
  const format = (metadata as { format?: string })?.format;
  if (format === "pdf" || format === "excel") return format;
  return fallback;
}
