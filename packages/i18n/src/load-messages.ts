import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { AppLocale } from "./formatters";
import { APP_LOCALES } from "./formatters";

export type MessageDictionary = Readonly<Record<string, string>>;

const localeDir = join(dirname(fileURLToPath(import.meta.url)), "locales");

const cache = new Map<AppLocale, MessageDictionary>();

function isAppLocale(value: string): value is AppLocale {
  return (APP_LOCALES as readonly string[]).includes(value);
}

/**
 * Loads flat key → message map for a locale from `src/locales/{locale}.json`.
 */
export function loadMessagesSync(locale: AppLocale): MessageDictionary {
  const hit = cache.get(locale);
  if (hit) {
    return hit;
  }
  const raw = readFileSync(join(localeDir, `${locale}.json`), "utf8");
  const parsed = JSON.parse(raw) as Record<string, string>;
  const dict: MessageDictionary = Object.freeze({ ...parsed });
  cache.set(locale, dict);
  return dict;
}

export function resolveLocaleOrFallback(
  requested: string | undefined,
  fallback: AppLocale,
): AppLocale {
  if (requested && isAppLocale(requested)) {
    return requested;
  }
  return fallback;
}
