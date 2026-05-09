import {
  LOCALE_DISPLAY_METADATA,
  type AppLocale as BaseAppLocale,
} from "@agenticverdict/i18n/formatters";
import { textDirection, type TextDirection } from "@agenticverdict/i18n/rtl";

// Default locale (matches @agenticverdict/i18n DEFAULT_APP_LOCALE)
const DEFAULT_APP_LOCALE = "en";

// App-specific shipping configuration (can be env-driven in future)
export const shippingLocales = ["en", "ar", "fr", "zh", "es"] as const;
export const draftLocales = [] as const;
export const allConfiguredLocales = [...shippingLocales, ...draftLocales] as const;

export type AppLocale = (typeof shippingLocales)[number];
export type DraftLocale = (typeof draftLocales)[number];
export type LocaleCode = (typeof allConfiguredLocales)[number];
export type { TextDirection };

export function isSupportedLocale(value: string): value is AppLocale {
  return (shippingLocales as readonly string[]).includes(value as AppLocale);
}

export function isConfiguredLocale(value: string): value is LocaleCode {
  return (allConfiguredLocales as readonly string[]).includes(value);
}

export function getDirection(locale: LocaleCode): TextDirection {
  return textDirection(locale);
}

export function getLocaleName(locale: LocaleCode): string {
  return LOCALE_DISPLAY_METADATA[locale as BaseAppLocale]?.name ?? locale;
}

export function parseLocaleFromPathname(pathname: string): AppLocale {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment && isSupportedLocale(segment)) {
    return segment as AppLocale;
  }
  return DEFAULT_APP_LOCALE as AppLocale;
}

export const defaultLocale: AppLocale = DEFAULT_APP_LOCALE as AppLocale;
export const supportedLocales = shippingLocales;
