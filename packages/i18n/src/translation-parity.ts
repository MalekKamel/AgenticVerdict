import type { AppLocale } from "./formatters";
import { APP_LOCALES } from "./formatters";
import { loadMessagesSync } from "./load-messages";

/**
 * Returns sorted message keys for a locale bundle (for QA parity checks across locales).
 */
export function messageKeysForLocale(locale: AppLocale): string[] {
  return Object.keys(loadMessagesSync(locale)).sort();
}

/**
 * Lists keys present in the reference locale but missing from another locale file.
 */
export function missingKeysComparedTo(reference: AppLocale, other: AppLocale): string[] {
  const ref = new Set(messageKeysForLocale(reference));
  const oth = new Set(messageKeysForLocale(other));
  const missing: string[] = [];
  for (const k of ref) {
    if (!oth.has(k)) {
      missing.push(k);
    }
  }
  return missing;
}

/**
 * Validates that every {@link APP_LOCALES} bundle defines the same keys as `reference`.
 */
export function assertAllLocalesHaveSameKeys(reference: AppLocale = "en"): void {
  for (const loc of APP_LOCALES) {
    if (loc === reference) {
      continue;
    }
    const missing = missingKeysComparedTo(reference, loc);
    if (missing.length > 0) {
      throw new Error(`Locale "${loc}" missing keys vs "${reference}": ${missing.join(", ")}`);
    }
    const extra = missingKeysComparedTo(loc, reference);
    if (extra.length > 0) {
      throw new Error(`Locale "${loc}" has extra keys vs "${reference}": ${extra.join(", ")}`);
    }
  }
}
