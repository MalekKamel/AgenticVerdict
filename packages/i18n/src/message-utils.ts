import type { AppLocale } from "./formatters";
import { APP_LOCALES } from "./formatters";

export type { AppLocale };
export type MessageDictionary = Readonly<Record<string, string>>;

function isAppLocale(value: string): value is AppLocale {
  return (APP_LOCALES as readonly string[]).includes(value);
}

/**
 * Recursively flatten a nested message object into dot-notation keys.
 * e.g. { auth: { login: { title: "Hi" } } } → { "auth.login.title": "Hi" }
 */
export function flattenMessages(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenMessages(value as Record<string, unknown>, path));
    } else if (typeof value === "string") {
      result[path] = value;
    }
  }
  return result;
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
