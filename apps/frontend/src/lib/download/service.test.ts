import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadReport, bulkDownloadReports, downloadFromContent } from "./service";
import * as helpers from "./helpers";
import * as notifications from "./notifications";

vi.mock("@/lib/api/trpc-client", () => ({
  trpcClient: {
    report: {
      content: {
        query: vi.fn(),
      },
    },
  },
}));

vi.mock("./helpers", () => ({
  base64ToUint8Array: vi.fn(() => new Uint8Array([1, 2, 3])),
  triggerFileDownload: vi.fn(),
  detectFormatFromMetadata: vi.fn(() => "pdf"),
}));

vi.mock("./notifications", () => ({
  showDownloadStartedNotification: vi.fn(),
  showDownloadCompleteNotification: vi.fn(),
  showDownloadFailedNotification: vi.fn(),
  showBulkDownloadPreparingNotification: vi.fn(),
}));

const { trpcClient } = await import("@/lib/api/trpc-client");
const JSZip = (await import("jszip")).default;

describe("download service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("downloadReport", () => {
    it("successfully downloads a report", async () => {
      vi.mocked(trpcClient.report.content.query).mockResolvedValue({
        content: "base64content",
        contentType: "application/pdf",
      });

      const result = await downloadReport({
        reportId: "report-1",
        fileName: "Test Report",
        metadata: { format: "pdf" },
      });

      expect(notifications.showDownloadStartedNotification).toHaveBeenCalledWith("Test Report");
      expect(trpcClient.report.content.query).toHaveBeenCalledWith({
        id: "report-1",
        format: "pdf",
      });
      expect(helpers.triggerFileDownload).toHaveBeenCalled();
      expect(notifications.showDownloadCompleteNotification).toHaveBeenCalledWith("Test Report");
      expect(result).toEqual({ success: true, fileCount: 1, failureCount: 0 });
    });

    it("handles download failure", async () => {
      vi.mocked(trpcClient.report.content.query).mockRejectedValue(new Error("Network error"));

      const result = await downloadReport({
        reportId: "report-1",
        fileName: "Test Report",
      });

      expect(notifications.showDownloadFailedNotification).toHaveBeenCalled();
      expect(result).toEqual({ success: false, fileCount: 0, failureCount: 1 });
    });
  });

  describe("bulkDownloadReports", () => {
    it("rejects empty reports", async () => {
      const result = await bulkDownloadReports({ reports: [] });

      expect(result).toEqual({ success: false, fileCount: 0, failureCount: 0 });
    });

    it("rejects more than max count", async () => {
      const reports = Array.from({ length: 11 }, (_, i) => ({
        id: `report-${i}`,
        title: `Report ${i}`,
      }));

      const result = await bulkDownloadReports({ reports });

      expect(notifications.showDownloadFailedNotification).toHaveBeenCalled();
      expect(result).toEqual({ success: false, fileCount: 0, failureCount: 0 });
    });

    it("successfully downloads multiple reports", async () => {
      const reports = [
        { id: "report-1", title: "Report 1", metadata: { format: "pdf" } },
        { id: "report-2", title: "Report 2", metadata: { format: "pdf" } },
      ];

      vi.mocked(trpcClient.report.content.query).mockResolvedValue({
        content: "base64content",
        contentType: "application/pdf",
      });

      vi.spyOn(JSZip.prototype, "folder").mockReturnValue({
        file: vi.fn(),
      } as unknown as JSZip);

      vi.spyOn(JSZip.prototype, "generateAsync").mockResolvedValue(new Blob(["zip content"]));

      const result = await bulkDownloadReports({ reports });

      expect(notifications.showBulkDownloadPreparingNotification).not.toHaveBeenCalled();
      expect(trpcClient.report.content.query).toHaveBeenCalledTimes(2);
      expect(helpers.triggerFileDownload).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.fileCount).toBe(2);
    });

    it("handles partial failures", async () => {
      const reports = [
        { id: "report-1", title: "Report 1" },
        { id: "report-2", title: "Report 2" },
      ];

      vi.mocked(trpcClient.report.content.query)
        .mockResolvedValueOnce({
          content: "base64content",
          contentType: "application/pdf",
        })
        .mockRejectedValueOnce(new Error("Failed"));

      vi.spyOn(JSZip.prototype, "folder").mockReturnValue({
        file: vi.fn(),
      } as unknown as JSZip);

      vi.spyOn(JSZip.prototype, "generateAsync").mockResolvedValue(new Blob(["zip content"]));

      const result = await bulkDownloadReports({ reports });

      expect(result.success).toBe(true);
      expect(result.fileCount).toBe(1);
      expect(result.failureCount).toBe(1);
    });
  });

  describe("downloadFromContent", () => {
    it("downloads from pre-fetched content", () => {
      downloadFromContent({
        content: "base64content",
        contentType: "application/pdf",
        fileName: "Test Report",
        extension: "pdf",
      });

      expect(helpers.triggerFileDownload).toHaveBeenCalled();
    });
  });
});
