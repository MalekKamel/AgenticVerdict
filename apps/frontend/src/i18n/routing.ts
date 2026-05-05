import { defaultLocale, supportedLocales, type AppLocale } from "./locales";

/**
 * Locale routing configuration (TanStack Router + prefix).
 * Delegates locale source-of-truth to `locales.ts`.
 */
export const routing = {
  locales: supportedLocales,
  defaultLocale,
  localePrefix: "always" as const,
};

export type { AppLocale };
export { defaultLocale };
