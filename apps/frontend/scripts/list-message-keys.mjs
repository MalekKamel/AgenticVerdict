import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const messagesDir = join(__dirname, "..", "messages");
const localeConfigPath = join(__dirname, "..", "src", "i18n", "locales.config.json");
const localeConfig = JSON.parse(readFileSync(localeConfigPath, "utf8"));

/**
 * @param {unknown} obj
 * @param {string} prefix
 * @returns {string[]}
 */
function collectLeafKeys(obj, prefix = "") {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return prefix ? [prefix] : [];
  }
  /** @type {string[]} */
  const keys = [];
  for (const k of Object.keys(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    const v = obj[k];
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...collectLeafKeys(v, p));
    } else {
      keys.push(p);
    }
  }
  return keys.sort();
}

const baseMessages = JSON.parse(
  readFileSync(join(messagesDir, `${localeConfig.defaultLocale}.json`), "utf8"),
);
const keys = collectLeafKeys(baseMessages);
console.log(keys.join("\n"));
