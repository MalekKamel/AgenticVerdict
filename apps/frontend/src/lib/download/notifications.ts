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
