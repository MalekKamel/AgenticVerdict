/**
 * Toast notification utilities using @mantine/notifications
 */

import { notifications } from "@mantine/notifications";

interface ShowNotificationOptions {
  title: string;
  message?: string;
  autoClose?: number | false;
}

const DEFAULT_AUTO_CLOSE = 5000;

/**
 * Show a success notification
 */
export function showSuccessNotification({
  title,
  message,
  autoClose = DEFAULT_AUTO_CLOSE,
}: ShowNotificationOptions) {
  return notifications.show({
    color: "green",
    title,
    message,
    autoClose,
  });
}

/**
 * Show an error notification
 */
export function showErrorNotification({
  title,
  message,
  autoClose = DEFAULT_AUTO_CLOSE,
}: ShowNotificationOptions) {
  return notifications.show({
    color: "red",
    title,
    message,
    autoClose,
  });
}

/**
 * Show an info notification
 */
export function showInfoNotification({
  title,
  message,
  autoClose = DEFAULT_AUTO_CLOSE,
}: ShowNotificationOptions) {
  return notifications.show({
    color: "blue",
    title,
    message,
    autoClose,
  });
}

/**
 * Show a warning notification
 */
export function showWarningNotification({
  title,
  message,
  autoClose = DEFAULT_AUTO_CLOSE,
}: ShowNotificationOptions) {
  return notifications.show({
    color: "yellow",
    title,
    message,
    autoClose,
  });
}

/**
 * Dismiss a notification by ID
 */
export function dismissNotification(id: string) {
  notifications.hide(id);
}

/**
 * Dismiss all notifications
 */
export function dismissAllNotifications() {
  notifications.clean();
}
