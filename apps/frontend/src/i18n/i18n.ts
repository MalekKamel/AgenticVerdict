/**
 * i18n configuration
 *
 * Thin adapter layer delegating to @agenticverdict/i18n for all locale logic.
 * Only framework-specific glue remains here.
 */

import { en, ar, fr, es, zh } from "@agenticverdict/i18n/locales";
import {
  detectPreferredBrowserLocale,
  normalizeToAppLocale,
} from "@agenticverdict/i18n/language-detection";
import {
  createLocalizationFormatters,
  type AppLocale as BaseAppLocale,
} from "@agenticverdict/i18n/formatters";
import { textDirection, type TextDirection } from "@agenticverdict/i18n/rtl";
import { getPreferredLocale } from "@agenticverdict/core/storage/locale-storage";
import { defaultLocale, isSupportedLocale, type LocaleCode } from "./locales";

const localeMessages: Record<string, Record<string, unknown>> = { en, ar, fr, es, zh };

// Re-exports from locales adapter
export { defaultLocale, getDirection, getLocaleName, supportedLocales } from "./locales";
export { textDirection, type TextDirection };
export { flattenMessages, type MessageDictionary } from "@agenticverdict/i18n/message-utils";
export {
  LANGUAGE_NATIVE_NAMES,
  intlLocaleTag,
  LOCALE_DISPLAY_METADATA,
} from "@agenticverdict/i18n/formatters";

/**
 * Detect user's preferred language (browser context).
 * Checks persisted preference first, then browser languages, then default.
 */
export function detectLocale(): LocaleCode {
  if (typeof window === "undefined") {
    return defaultLocale;
  }
  const persisted = getPreferredLocale();
  if (persisted && isSupportedLocale(persisted)) {
    return persisted as LocaleCode;
  }
  const detected = detectPreferredBrowserLocale(getPreferredLocale, defaultLocale as BaseAppLocale);
  return normalizeToAppLocale(detected, defaultLocale as BaseAppLocale) as LocaleCode;
}

/**
 * Load messages for a locale (sync, from package cache).
 * For next-intl, use the framework's message provider instead.
 */
export async function loadMessages(locale: LocaleCode): Promise<Record<string, unknown>> {
  return localeMessages[locale] ?? localeMessages[defaultLocale] ?? {};
}

/**
 * Create formatters bound to a locale and tenant localization config.
 * Usage: const formatters = createLocalizationFormatters(locale, tenant.localization);
 */
export { createLocalizationFormatters };
