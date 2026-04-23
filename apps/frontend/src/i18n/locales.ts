import localeConfig from "./locales.config.json";

export const defaultLocale = localeConfig.defaultLocale;
export const supportedLocales = localeConfig.shippingLocales;
export const draftLocales = localeConfig.draftLocales;
export const allConfiguredLocales = [...supportedLocales, ...draftLocales] as const;

export type AppLocale = (typeof supportedLocales)[number];
export type DraftLocale = (typeof draftLocales)[number];
export type LocaleCode = (typeof allConfiguredLocales)[number];
export type TextDirection = "ltr" | "rtl";

export type LocaleMeta = {
  name: string;
  direction: TextDirection;
  currency: string;
  currencySymbol: string;
  currencySymbolPosition: "before" | "after";
  intlLocale: string;
};

export const localeMeta = localeConfig.metadata as Record<LocaleCode, LocaleMeta>;

export function isSupportedLocale(value: string): value is AppLocale {
  return (supportedLocales as readonly string[]).includes(value);
}

export function isConfiguredLocale(value: string): value is LocaleCode {
  return (allConfiguredLocales as readonly string[]).includes(value);
}

export function getDirection(locale: LocaleCode): TextDirection {
  return localeMeta[locale]?.direction ?? "ltr";
}

export function getLocaleName(locale: LocaleCode): string {
  return localeMeta[locale]?.name ?? locale;
}

export function parseLocaleFromPathname(pathname: string): AppLocale {
  const segment = pathname.split("/").filter(Boolean)[0];
  if (segment && isSupportedLocale(segment)) {
    return segment;
  }
  return defaultLocale;
}
