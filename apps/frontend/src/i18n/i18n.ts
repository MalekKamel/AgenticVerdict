/**
 * i18n configuration
 *
 * Internationalization setup for the web application.
 * Configures language detection, fallbacks, and message loading.
 */

import {
  defaultLocale,
  getDirection,
  getLocaleName,
  isSupportedLocale,
  localeMeta,
  supportedLocales,
  type LocaleCode,
} from "./locales";
import { getPreferredLocale } from "@/lib/storage/locale-storage";

/**
 * Get direction for a locale
 */
export { defaultLocale, getDirection, getLocaleName, supportedLocales };

export async function loadMessages(locale: LocaleCode): Promise<Record<string, unknown>> {
  try {
    // JSON lives at `apps/frontend/messages/`; this module is under `src/i18n/`.
    const mod = await import(`../../messages/${locale}.json`);
    const messages = mod.default ?? mod;
    return messages as Record<string, unknown>;
  } catch {
    // Fallback to default locale
    if (locale !== defaultLocale) {
      return loadMessages(defaultLocale);
    }
    return {};
  }
}

/**
 * Detect user's preferred language
 */
export function detectLocale(): LocaleCode {
  if (typeof window === "undefined") {
    return defaultLocale;
  }

  const persistedLocale = getPreferredLocale();
  if (persistedLocale && isSupportedLocale(persistedLocale)) {
    return persistedLocale;
  }

  const browserLanguages = navigator.languages || [navigator.language];

  for (const lang of browserLanguages) {
    const code = lang.split("-")[0] as LocaleCode;
    if (isSupportedLocale(code)) {
      return code;
    }
  }

  return defaultLocale;
}

/**
 * Format date according to locale
 */
export function formatDate(
  date: Date,
  locale: LocaleCode,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(localeMeta[locale]?.intlLocale ?? "en-US", options).format(date);
}

/**
 * Format number according to locale
 */
export function formatNumber(
  value: number,
  locale: LocaleCode,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(localeMeta[locale]?.intlLocale ?? "en-US", options).format(value);
}

/**
 * Format currency according to locale
 */
export function formatCurrency(value: number, locale: LocaleCode, currency?: string): string {
  const localeConfig = localeMeta[locale];
  const curr = currency ?? localeConfig.currency;
  const symbol = localeConfig.currencySymbol;
  const position = localeConfig.currencySymbolPosition;

  const formatted = new Intl.NumberFormat(localeConfig.intlLocale, {
    style: "currency",
    currency: curr,
  }).format(value);

  // If the symbol is already included, return as-is
  if (formatted.includes(symbol)) {
    return formatted;
  }

  // Add symbol according to position
  return position === "before" ? `${symbol}${formatted}` : `${formatted} ${symbol}`;
}
