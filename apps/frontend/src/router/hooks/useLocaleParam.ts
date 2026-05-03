import { useParams as useTanStackParams } from "@tanstack/react-router";

import { defaultLocale, isSupportedLocale, type AppLocale } from "@/i18n/locales";

export function useLocaleParam(): AppLocale {
  const params = useTanStackParams({ strict: false }) as { locale?: string };
  const locale = params.locale;
  if (locale && isSupportedLocale(locale)) {
    return locale as AppLocale;
  }
  return defaultLocale;
}
