import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  showDownloadStartedNotification,
  showDownloadCompleteNotification,
  showDownloadFailedNotification,
  showBulkDownloadPreparingNotification,
} from "./notifications";
import * as notifications from "@/lib/notifications";

vi.mock("@/lib/notifications", () => ({
  showSuccessNotification: vi.fn(),
  showErrorNotification: vi.fn(),
  showInfoNotification: vi.fn(),
}));

vi.mock("@/lib/notifications-i18n", () => ({
  getNotificationTranslation: vi.fn((key: string) => {
    const translations: Record<string, string> = {
      "download.notifications.started.title": "Downloading report",
      "download.notifications.started.message": "{fileName} is being downloaded",
      "download.notifications.complete.title": "Download complete",
      "download.notifications.complete.message": "{fileName} downloaded successfully",
      "download.notifications.completeBulk.message": "{count} reports downloaded successfully",
      "download.notifications.failed.title": "Download failed",
      "download.notifications.failed.message": "{context}: {message}",
      "download.notifications.preparing.title": "Preparing download",
      "download.notifications.preparing.message": "Preparing {count} reports for download...",
      "errors.common.unknownError": "An unexpected error occurred",
    };
    return translations[key] || key;
  }),
}));

describe("download notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("showDownloadStartedNotification", () => {
    it("shows info notification with correct message", () => {
      showDownloadStartedNotification("Test Report");

      expect(notifications.showInfoNotification).toHaveBeenCalledWith({
        title: "Downloading report",
        message: "Test Report is being downloaded",
      });
    });
  });

  describe("showDownloadCompleteNotification", () => {
    it("shows success notification for single file", () => {
      showDownloadCompleteNotification("Test Report");

      expect(notifications.showSuccessNotification).toHaveBeenCalledWith({
        title: "Download complete",
        message: "Test Report downloaded successfully",
      });
    });

    it("shows bulk success notification for multiple files", () => {
      showDownloadCompleteNotification("reports", 5);

      expect(notifications.showSuccessNotification).toHaveBeenCalledWith({
        title: "Download complete",
        message: "5 reports downloaded successfully",
      });
    });
  });

  describe("showDownloadFailedNotification", () => {
    it("shows error notification with Error message", () => {
      const error = new Error("Test error");
      showDownloadFailedNotification(error, "Test Report");

      expect(notifications.showErrorNotification).toHaveBeenCalledWith({
        title: "Download failed",
        message: "Test Report: Test error",
      });
    });

    it("shows error notification with unknown error message for non-Error", () => {
      showDownloadFailedNotification({}, "Test Report");

      expect(notifications.showErrorNotification).toHaveBeenCalledWith({
        title: "Download failed",
        message: "Test Report: An unexpected error occurred",
      });
    });
  });

  describe("showBulkDownloadPreparingNotification", () => {
    it("shows info notification with count", () => {
      showBulkDownloadPreparingNotification(5);

      expect(notifications.showInfoNotification).toHaveBeenCalledWith({
        title: "Preparing download",
        message: "Preparing 5 reports for download...",
      });
    });
  });
});
