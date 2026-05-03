import { type AppLocale } from "@/i18n/locales";

import { supportedLocales } from "@/i18n/locales";

export function withLocalePrefix(locale: AppLocale, path: string): string {
  if (!path || path.length === 0) {
    return `/${locale}`;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (normalized === "/") {
    return `/${locale}`;
  }

  const existingLocaleSegment = normalized.split("/")[1];
  const hasExistingLocale = (supportedLocales as readonly string[]).includes(existingLocaleSegment);

  if (hasExistingLocale) {
    if (existingLocaleSegment === locale) {
      return normalized;
    }
    const pathWithoutLocale = normalized.replace(/^\/[^/]+/, "");
    return `/${locale}${pathWithoutLocale || "/"}`;
  }

  return `/${locale}${normalized}`;
}

export function stripLocalePrefix(pathname: string, locale: AppLocale): string {
  const prefix = `/${locale}`;
  if (pathname === prefix || pathname === `${prefix}/`) {
    return "/";
  }
  if (pathname.startsWith(`${prefix}/`)) {
    const rest = pathname.slice(prefix.length);
    return rest || "/";
  }
  return pathname;
}
