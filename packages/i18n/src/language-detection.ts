import { APP_LOCALES, type AppLocale } from "./formatters";
import { resolveLocaleOrFallback } from "./message-utils";

function parseAcceptLanguage(header: string): { tag: string; q: number }[] {
  return header
    .split(",")
    .map((part) => {
      const segments = part
        .trim()
        .split(";")
        .map((s) => s.trim());
      const tagPart = segments[0];
      const tag = (tagPart ?? "").toLowerCase();
      let q = 1;
      for (const p of segments.slice(1)) {
        const m = /^q=([0-9.]+)$/i.exec(p);
        if (m) {
          const n = Number(m[1]);
          if (!Number.isNaN(n)) {
            q = Math.min(1, Math.max(0, n));
          }
        }
      }
      return { tag, q };
    })
    .filter((x) => x.tag.length > 0)
    .sort((a, b) => b.q - a.q);
}

/**
 * Maps a BCP 47 tag (or bare language subtag) to a supported {@link AppLocale}, or null.
 */
export function appLocaleFromLanguageTag(tag: string): AppLocale | null {
  const base = tag.trim().toLowerCase().split("-")[0] ?? "";
  if ((APP_LOCALES as readonly string[]).includes(base)) {
    return base as AppLocale;
  }
  return null;
}

/**
 * Picks the best supported locale from an `Accept-Language` header (RFC 9110).
 */
export function detectPreferredAppLocale(
  header: string | undefined,
  fallback: AppLocale,
): AppLocale {
  if (!header?.trim()) {
    return fallback;
  }
  for (const { tag } of parseAcceptLanguage(header)) {
    const mapped = appLocaleFromLanguageTag(tag);
    if (mapped) {
      return mapped;
    }
  }
  return fallback;
}

/**
 * Normalizes arbitrary locale tags (`zh-CN`, `en_GB`) to a supported {@link AppLocale}.
 */
export function normalizeToAppLocale(tag: string | undefined, fallback: AppLocale): AppLocale {
  if (!tag?.trim()) {
    return fallback;
  }
  const base = tag.trim().toLowerCase().split("-")[0] ?? "";
  return resolveLocaleOrFallback(base, fallback);
}

/**
 * Detects the preferred locale from browser language settings, with a persisted preference fallback.
 */
export function detectPreferredBrowserLocale(
  getPreferredLocale: () => string | null,
  fallback: AppLocale,
): AppLocale {
  if (typeof window === "undefined") {
    return fallback;
  }

  const browserLocales = window.navigator.languages;
  if (browserLocales) {
    for (const tag of browserLocales) {
      const mapped = appLocaleFromLanguageTag(tag);
      if (mapped) {
        return mapped;
      }
    }
  }

  const persisted = getPreferredLocale();
  if (persisted) {
    return normalizeToAppLocale(persisted, fallback);
  }

  return fallback;
}
