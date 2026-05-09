import type { AppLocale } from "./formatters";
import type { TextDirection } from "@agenticverdict/types";

export type { TextDirection };

const RTL_APP_LOCALES: ReadonlySet<AppLocale> = new Set<AppLocale>(["ar"]);

/** BCP 47 or app locale tag — treats Arabic script locales as RTL. */
export function isRtlLocale(locale: string): boolean {
  const normalized = locale.trim().toLowerCase();
  if (normalized === "ar" || normalized.startsWith("ar-")) {
    return true;
  }
  if (
    normalized === "he" ||
    normalized.startsWith("he-") ||
    normalized === "fa" ||
    normalized.startsWith("fa-") ||
    normalized === "ur" ||
    normalized.startsWith("ur-")
  ) {
    return true;
  }
  return RTL_APP_LOCALES.has(normalized as AppLocale);
}

export function textDirection(locale: string): TextDirection {
  return isRtlLocale(locale) ? "rtl" : "ltr";
}
