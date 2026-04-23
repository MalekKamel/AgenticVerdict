import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import IntlMessageFormat from "intl-messageformat";

const __dirname = dirname(fileURLToPath(import.meta.url));
const messagesDir = join(__dirname, "..", "messages");
const localeConfigPath = join(__dirname, "..", "src", "i18n", "locales.config.json");
const localeConfig = JSON.parse(readFileSync(localeConfigPath, "utf8"));
const validationLocales = [...localeConfig.shippingLocales, ...localeConfig.draftLocales];
const baseLocale = localeConfig.defaultLocale;

/**
 * @param {unknown} obj
 * @param {string} prefix
 * @returns {string[]}
 */
function collectLeafEntries(obj, prefix = "") {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return prefix ? [[prefix, obj]] : [];
  }
  /** @type {[string, unknown][]} */
  const entries = [];
  for (const k of Object.keys(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    const v = obj[k];
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      entries.push(...collectLeafEntries(v, p));
    } else {
      entries.push([p, v]);
    }
  }
  return entries.sort(([a], [b]) => a.localeCompare(b));
}

/**
 * Very small placeholder extractor for ICU-style `{token}` references.
 * Keeps plural/select variable names (e.g. `{count, plural, ...}` -> `count`).
 * @param {string} message
 * @returns {Set<string>}
 */
function extractPlaceholders(message) {
  const placeholders = new Set();
  const tokenRegex = /{([a-zA-Z_]\w*)(?:\s*,|})/g;
  for (const match of message.matchAll(tokenRegex)) {
    placeholders.add(match[1]);
  }
  return placeholders;
}

/** @type {Record<string, Record<string, unknown>>} */
const catalogs = {};
for (const locale of validationLocales) {
  catalogs[locale] = JSON.parse(readFileSync(join(messagesDir, `${locale}.json`), "utf8"));
}

const baseEntries = new Map(collectLeafEntries(catalogs[baseLocale]));
const baseKeys = [...baseEntries.keys()];

/** @type {string[]} */
const errors = [];

for (const locale of validationLocales) {
  const localeEntries = new Map(collectLeafEntries(catalogs[locale]));
  const localeKeys = [...localeEntries.keys()];
  const localeKeySet = new Set(localeKeys);
  const baseKeySet = new Set(baseKeys);

  const missingInLocale = baseKeys.filter((k) => !localeKeySet.has(k));
  const extraInLocale = localeKeys.filter((k) => !baseKeySet.has(k));

  if (missingInLocale.length > 0) {
    errors.push(`[${locale}] Missing keys: ${missingInLocale.join(", ")}`);
  }
  if (extraInLocale.length > 0) {
    errors.push(`[${locale}] Extra keys: ${extraInLocale.join(", ")}`);
  }

  for (const key of baseKeys) {
    const baseValue = baseEntries.get(key);
    const localeValue = localeEntries.get(key);
    if (typeof baseValue !== "string" || typeof localeValue !== "string") {
      continue;
    }

    try {
      // Parse validation for ICU syntax correctness.

      new IntlMessageFormat(localeValue, locale);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`[${locale}] ICU parse error at "${key}": ${message}`);
      continue;
    }

    const expectedPlaceholders = extractPlaceholders(baseValue);
    const actualPlaceholders = extractPlaceholders(localeValue);
    const missingPlaceholders = [...expectedPlaceholders].filter((p) => !actualPlaceholders.has(p));
    const extraPlaceholders = [...actualPlaceholders].filter((p) => !expectedPlaceholders.has(p));
    if (missingPlaceholders.length > 0 || extraPlaceholders.length > 0) {
      errors.push(
        `[${locale}] Placeholder mismatch at "${key}" (missing: ${missingPlaceholders.join("|") || "-"}, extra: ${extraPlaceholders.join("|") || "-"})`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error(`Translation validation failed for locales: ${validationLocales.join(", ")}.`);
  for (const issue of errors) {
    console.error(`- ${issue}`);
  }
  process.exit(1);
}

console.log(
  `Translation validation passed (${validationLocales.join(", ")}): ${baseKeys.length} keys with ICU and placeholder parity.`,
);
