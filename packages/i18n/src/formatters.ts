import type { LocalizationConfig } from "@agenticverdict/config";

export const APP_LOCALES = ["en", "ar"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export type LocalizationFormatConfig = Pick<LocalizationConfig, "region" | "timezone" | "currency">;

/**
 * BCP 47 tag for Intl formatters, combining UI locale with tenant region (e.g. en-SA, ar-SA).
 */
export function intlLocaleTag(locale: AppLocale, region: string): string {
  const r = region.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(r)) {
    return `${locale}-${r}`;
  }
  return locale === "ar" ? "ar-SA" : "en-US";
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
