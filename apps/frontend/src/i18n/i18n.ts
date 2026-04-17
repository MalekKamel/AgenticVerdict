/**
 * i18n configuration
 *
 * Internationalization setup for the web application.
 * Configures language detection, fallbacks, and message loading.
 */

import { LOCALES, type LocaleCode, type TextDirection } from "./types";

/**
 * Supported locales
 */
export const supportedLocales: LocaleCode[] = ["en", "ar"];

/**
 * Default locale
 */
export const defaultLocale: LocaleCode = "en";

/**
 * Get direction for a locale
 */
export function getDirection(locale: LocaleCode): TextDirection {
  return LOCALES[locale]?.direction ?? "ltr";
}

/**
 * Get locale display name
 */
export function getLocaleName(locale: LocaleCode): string {
  return LOCALES[locale]?.name ?? locale;
}

/**
 * Load messages for a locale
 */
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

  const browserLanguages = navigator.languages || [navigator.language];

  for (const lang of browserLanguages) {
    const code = lang.split("-")[0] as LocaleCode;
    if (supportedLocales.includes(code)) {
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
  const localeMap: Record<LocaleCode, string> = {
    en: "en-US",
    ar: "ar-SA",
  };
  return new Intl.DateTimeFormat(localeMap[locale], options).format(date);
}

/**
 * Format number according to locale
 */
export function formatNumber(
  value: number,
  locale: LocaleCode,
  options?: Intl.NumberFormatOptions,
): string {
  const localeMap: Record<LocaleCode, string> = {
    en: "en-US",
    ar: "ar-SA",
  };
  return new Intl.NumberFormat(localeMap[locale], options).format(value);
}

/**
 * Format currency according to locale
 */
export function formatCurrency(value: number, locale: LocaleCode, currency?: string): string {
  const localeConfig = LOCALES[locale];
  const curr = currency ?? localeConfig.currencyFormat.currency;
  const symbol = localeConfig.currencyFormat.symbol;
  const position = localeConfig.currencyFormat.position;

  const localeMap: Record<LocaleCode, string> = {
    en: "en-US",
    ar: "ar-SA",
  };

  const formatted = new Intl.NumberFormat(localeMap[locale], {
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
