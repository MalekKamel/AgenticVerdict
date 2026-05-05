/**
 * Notification translation utilities
 *
 * Provides synchronous translation lookup for notification messages.
 * This is needed because notification hooks don't have access to React context.
 */

import { type AppLocale } from "@/i18n/routing";

let messages: Record<string, unknown> = {};

/**
 * Initialize notification translations
 * Call this during app initialization
 */
export function initializeNotificationTranslations(
  locale: AppLocale,
  localeMessages: Record<string, unknown>,
) {
  messages = localeMessages;
}

/**
 * Update the current locale
 */
export function setNotificationLocale(_locale: AppLocale) {
  // Locale update handled by app routing
  void _locale;
}

/**
 * Get nested value from messages object
 */
function getNestedValue(obj: Record<string, unknown>, path: string[]): string | null {
  let current: unknown = obj;
  for (const key of path) {
    if (typeof current !== "object" || current === null || !(key in current)) {
      return null;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : null;
}

/**
 * Get a translated notification message
 * Falls back to English if translation is missing
 */
export function getNotificationTranslation(
  key: string,
  localeMessages?: Record<string, unknown>,
): string {
  const keys = key.split(".");

  // Try current locale first
  const currentValue = getNestedValue(messages, keys);
  if (currentValue) {
    return currentValue;
  }

  // Fallback to provided locale messages (for SSR/hydration)
  if (localeMessages) {
    const fallbackValue = getNestedValue(localeMessages, keys);
    if (fallbackValue) {
      return fallbackValue;
    }
  }

  // Return key as last resort
  return key;
}

/**
 * Get notification title for create action
 */
export function getNotificationCreateTitle(): string {
  return getNotificationTranslation("insights.notifications.created.title") || "Insight created";
}

/**
 * Get notification message for create action
 */
export function getNotificationCreateMessage(): string {
  return (
    getNotificationTranslation("insights.notifications.created.message") ||
    "Your insight has been created successfully"
  );
}

/**
 * Get notification title for update action
 */
export function getNotificationUpdateTitle(): string {
  return getNotificationTranslation("insights.notifications.updated.title") || "Insight updated";
}

/**
 * Get notification message for update action
 */
export function getNotificationUpdateMessage(): string {
  return (
    getNotificationTranslation("insights.notifications.updated.message") ||
    "Your insight has been updated successfully"
  );
}

/**
 * Get notification title for delete action
 */
export function getNotificationDeleteTitle(): string {
  return getNotificationTranslation("insights.notifications.deleted.title") || "Insight deleted";
}

/**
 * Get notification message for delete action
 */
export function getNotificationDeleteMessage(): string {
  return (
    getNotificationTranslation("insights.notifications.deleted.message") ||
    "Your insight has been deleted successfully"
  );
}

/**
 * Get notification title for run action
 */
export function getNotificationRunTitle(): string {
  return getNotificationTranslation("insights.notifications.running.title") || "Insight running";
}

/**
 * Get notification message for run action
 */
export function getNotificationRunMessage(): string {
  return (
    getNotificationTranslation("insights.notifications.running.message") ||
    "Your insight is now generating a report"
  );
}

/**
 * Get error notification title for create action
 */
export function getNotificationCreateErrorTitle(): string {
  return (
    getNotificationTranslation("insights.notifications.failed.createTitle") ||
    "Failed to create insight"
  );
}

/**
 * Get error notification title for update action
 */
export function getNotificationUpdateErrorTitle(): string {
  return (
    getNotificationTranslation("insights.notifications.failed.updateTitle") ||
    "Failed to update insight"
  );
}

/**
 * Get error notification title for delete action
 */
export function getNotificationDeleteErrorTitle(): string {
  return (
    getNotificationTranslation("insights.notifications.failed.deleteTitle") ||
    "Failed to delete insight"
  );
}

/**
 * Get error notification title for run action
 */
export function getNotificationRunErrorTitle(): string {
  return (
    getNotificationTranslation("insights.notifications.failed.runTitle") || "Failed to run insight"
  );
}
