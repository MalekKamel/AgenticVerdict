import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Core Logic (exported for testing) ---

/**
 * Flatten nested JSON object to dot-notation keys.
 * Example: { auth: { login: { title: "Sign In" } } } → { "auth.login.title": "Sign In" }
 */
export function flattenJson(
  obj: Record<string, unknown>,
  prefix = "",
  result: Record<string, string> = {},
): Record<string, string> {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      result[fullKey] = value;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      flattenJson(value as Record<string, unknown>, fullKey, result);
    }
  }
  return result;
}

/**
 * Extract ICU placeholder names from a message string.
 * Handles: {name}, {count, plural, ...}, {gender, select, ...}
 * Returns sorted unique placeholder names.
 */
export function extractIcuPlaceholders(message: string): string[] {
  const placeholders = new Set<string>();
  let i = 0;

  while (i < message.length) {
    if (message[i] === "{") {
      // Find the end of this placeholder
      let depth = 1;
      let j = i + 1;
      while (j < message.length && depth > 0) {
        if (message[j] === "{") depth++;
        if (message[j] === "}") depth--;
        j++;
      }

      // Extract the placeholder name (first word before comma or closing brace)
      const inner = message.substring(i + 1, j - 1);
      const nameMatch = inner.match(/^(\w+)(?:\s*,|\s*$)/);
      if (nameMatch) {
        placeholders.add(nameMatch[1]);
      }

      i = j;
    } else {
      i++;
    }
  }

  return Array.from(placeholders).sort();
}

/**
 * Derive namespace from a dot-notation key.
 * Example: "auth.login.title" → "auth"
 */
export function getNamespace(key: string): string {
  return key.split(".")[0];
}

/**
 * Generate TypeScript types from flattened locale messages.
 */
export function generateTypes(flattened: Record<string, string>): string {
  const keys = Object.keys(flattened).sort();
  const namespaces = [...new Set(keys.map(getNamespace))].sort();

  // Build MessageKey union
  const messageKeyUnion = keys.map((key) => `  | "${key}"`).join("\n");

  // Build NamespaceType union
  const namespaceTypeUnion = namespaces.map((ns) => `  | "${ns}"`).join("\n");

  // Build PlaceholderMap
  const placeholderMapEntries = keys
    .map((key) => {
      const placeholders = extractIcuPlaceholders(flattened[key]);
      const valuesType =
        placeholders.length === 0 ? "never" : placeholders.map((p) => `"${p}"`).join(" | ");
      return `  "${key}": ${valuesType};`;
    })
    .join("\n");

  return `// Auto-generated — DO NOT EDIT MANUALLY
// Run: pnpm --filter @agenticverdict/i18n generate:types

/** Union of all valid translation keys (dot-notation). */
export type MessageKey =
${messageKeyUnion};

/** Union of top-level translation namespaces. */
export type NamespaceType =
${namespaceTypeUnion};

/** Keys within a specific namespace. */
export type NamespaceKeys<N extends NamespaceType> = Extract<MessageKey, \`\${N}.\${string}\`>;

/** ICU placeholder names extracted per message key. */
export type PlaceholderMap = {
${placeholderMapEntries}
};
`;
}

// --- Main Script ---

async function main() {
  const localesDir = path.resolve(__dirname, "../locales");
  const outputDir = path.resolve(__dirname, "../types");
  const enJsonPath = path.join(localesDir, "en.json");
  const outputPath = path.join(outputDir, "generated.ts");

  // Read en.json
  if (!fs.existsSync(enJsonPath)) {
    console.error(`Error: ${enJsonPath} not found`);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(enJsonPath, "utf-8");
  const parsed = JSON.parse(rawJson) as Record<string, unknown>;

  // Flatten and generate
  const flattened = flattenJson(parsed);
  const typesContent = generateTypes(flattened);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write output
  fs.writeFileSync(outputPath, typesContent, "utf-8");

  console.log(`Generated ${Object.keys(flattened).length} keys → ${outputPath}`);
}

// Run if executed directly
if (process.argv[1] === __filename) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
