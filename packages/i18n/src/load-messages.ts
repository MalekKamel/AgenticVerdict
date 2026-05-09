/**
 * Server-only message loader. Uses Node.js fs to read locale JSON files.
 * For client-side usage, import `flattenMessages` from `./message-utils` instead.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { AppLocale, MessageDictionary } from "./message-utils";
import { flattenMessages, resolveLocaleOrFallback } from "./message-utils";

export { flattenMessages, resolveLocaleOrFallback };
export type { AppLocale, MessageDictionary };

const localeDir = join(dirname(fileURLToPath(import.meta.url)), "locales");

const cache = new Map<AppLocale, MessageDictionary>();

/**
 * Loads messages for a locale from `src/locales/{locale}.json`.
 * Supports both flat dot-notation and nested object formats; always returns a flat dictionary.
 * Server-only — do not import in client code.
 */
export function loadMessagesSync(locale: AppLocale): MessageDictionary {
  const hit = cache.get(locale);
  if (hit) {
    return hit;
  }
  const raw = readFileSync(join(localeDir, `${locale}.json`), "utf8");
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const flat = flattenMessages(parsed);
  const dict: MessageDictionary = Object.freeze(flat);
  cache.set(locale, dict);
  return dict;
}
