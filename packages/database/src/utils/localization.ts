/**
 * Reusable localization utilities for resolving and validating
 * JSONB translation dictionaries stored on entity records.
 */

const DEFAULT_FALLBACK_LOCALE = "en";

/**
 * Resolve a locale-specific value from a translations dictionary.
 *
 * Fallback chain: requested locale → "en" → first available value → empty string.
 */
export function resolveLocale(
  translations: Record<string, string> | null | undefined,
  locale: string,
  fallbackLocale = DEFAULT_FALLBACK_LOCALE,
): string {
  if (!translations || typeof translations !== "object") {
    return "";
  }

  if (translations[locale]) {
    return translations[locale];
  }

  if (locale !== fallbackLocale && translations[fallbackLocale]) {
    return translations[fallbackLocale];
  }

  const firstKey = Object.keys(translations)[0];
  if (firstKey) {
    return translations[firstKey];
  }

  return "";
}

/**
 * Set or update a translation entry for a given locale.
 * Returns a new object (immutable).
 */
export function setTranslation(
  translations: Record<string, string>,
  locale: string,
  value: string,
): Record<string, string> {
  return { ...translations, [locale]: value };
}

/**
 * Validate that all keys in a translations object belong to the allowed locales.
 * Returns an array of invalid locale keys (empty = valid).
 */
export function validateTranslations(
  translations: Record<string, string>,
  allowedLocales: string[],
): string[] {
  const allowedSet = new Set(allowedLocales);
  const invalid: string[] = [];

  for (const key of Object.keys(translations)) {
    if (!allowedSet.has(key)) {
      invalid.push(key);
    }
  }

  return invalid;
}
