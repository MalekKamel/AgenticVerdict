import type { LocalizationConfig } from "@agenticverdict/config";

export const APP_LOCALES = ["en", "ar", "es", "fr", "zh"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export type LocalizationFormatConfig = Pick<LocalizationConfig, "region" | "timezone" | "currency">;

/** Native language names for each locale, used in UI and prompt context. */
export const LANGUAGE_NATIVE_NAMES: Record<AppLocale, string> = {
  en: "English",
  ar: "العربية",
  fr: "Français",
  es: "Español",
  zh: "中文",
};

/** Display metadata for each locale (currency, symbols, native name). */
export type LocaleDisplayMetadata = {
  name: string;
  currency: string;
  currencySymbol: string;
  currencySymbolPosition: "before" | "after";
};

export const LOCALE_DISPLAY_METADATA: Record<AppLocale, LocaleDisplayMetadata> = {
  en: { name: "English", currency: "USD", currencySymbol: "$", currencySymbolPosition: "before" },
  ar: { name: "العربية", currency: "SAR", currencySymbol: "ر.س", currencySymbolPosition: "after" },
  fr: { name: "Français", currency: "EUR", currencySymbol: "€", currencySymbolPosition: "after" },
  es: { name: "Español", currency: "EUR", currencySymbol: "€", currencySymbolPosition: "after" },
  zh: { name: "中文", currency: "CNY", currencySymbol: "¥", currencySymbolPosition: "before" },
};

/** Returns the native display name for a locale. */
export function getLocaleDisplayName(locale: AppLocale): string {
  return LOCALE_DISPLAY_METADATA[locale]?.name ?? locale;
}

/**
 * BCP 47 tag for Intl formatters, combining UI locale with tenant region (e.g. en-SA, ar-SA).
 */
export function intlLocaleTag(locale: AppLocale, region: string): string {
  const r = region.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(r)) {
    return `${locale}-${r}`;
  }
  switch (locale) {
    case "ar":
      return "ar-SA";
    case "es":
      return "es-ES";
    case "fr":
      return "fr-FR";
    case "zh":
      return "zh-CN";
    default:
      return "en-US";
  }
}

/**
 * Date, number, and currency formatters aligned with {@link LocalizationConfig} (timezone, currency, region).
 * Use the active UI locale (`next-intl`) for language; use tenant config for business formatting.
 */
export function createLocalizationFormatters(
  locale: AppLocale,
  localization: LocalizationFormatConfig,
) {
  const intlLocale = intlLocaleTag(locale, localization.region);

  return {
    intlLocale,

    formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
      return new Intl.DateTimeFormat(intlLocale, {
        timeZone: localization.timezone,
        ...options,
      }).format(date);
    },

    formatCurrency(amount: number): string {
      return new Intl.NumberFormat(intlLocale, {
        style: "currency",
        currency: localization.currency,
      }).format(amount);
    },

    formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
      return new Intl.NumberFormat(intlLocale, options).format(value);
    },

    /** LDML plural category for ICU-style pluralization in messages. */
    pluralCategory(count: number): Intl.LDMLPluralRule {
      return new Intl.PluralRules(intlLocale).select(count);
    },
  };
}
