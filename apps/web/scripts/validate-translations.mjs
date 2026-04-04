import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const messagesDir = join(__dirname, "..", "messages");

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

const en = JSON.parse(readFileSync(join(messagesDir, "en.json"), "utf8"));
const ar = JSON.parse(readFileSync(join(messagesDir, "ar.json"), "utf8"));

const enKeys = collectLeafKeys(en);
const arKeys = new Set(collectLeafKeys(ar));

const missingInAr = enKeys.filter((k) => !arKeys.has(k));
const missingInEn = [...arKeys].filter((k) => !enKeys.includes(k));

if (missingInAr.length > 0 || missingInEn.length > 0) {
  console.error("Translation key mismatch between en.json and ar.json.");
  if (missingInAr.length > 0) {
    console.error("Missing in ar:", missingInAr.join(", "));
  }
  if (missingInEn.length > 0) {
    console.error("Missing in en:", missingInEn.join(", "));
  }
  process.exit(1);
}

console.log(`Translation keys aligned (${enKeys.length} leaves).`);
