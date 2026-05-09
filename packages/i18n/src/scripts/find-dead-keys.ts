import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Core Logic (exported for testing) ---

/**
 * Extract i18n key usages from source code.
 * Matches patterns: i18n.t("key"), t("key"), useTranslations("namespace")
 */
export function extractKeysFromSource(source: string): string[] {
  const keys: string[] = [];

  // Match useTranslations("namespace") - these are namespace-first
  const useTranslationsRegex = /useTranslations\(\s*["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = useTranslationsRegex.exec(source)) !== null) {
    // Namespace-first, keys would be like "namespace.key"
    keys.push(`${match[1]}.*`);
  }

  // Match .t("...") patterns (covers i18n.t(), manager.t(), etc.)
  const tCallRegex = /\.t\(\s*["']([^"']+)["']/g;
  while ((match = tCallRegex.exec(source)) !== null) {
    keys.push(match[1]);
  }

  // Match t("...") when it's likely a translation call (after useTranslations)
  // This catches: const title = t("login.title")
  const standaloneTRegex = /(?<![.\w])t\(\s*["']([^"']+)["']/g;
  while ((match = standaloneTRegex.exec(source)) !== null) {
    keys.push(match[1]);
  }

  return keys;
}

/**
 * Scan files and extract all i18n key usages.
 */
export function scanFilesForKeys(
  dir: string,
  extensions = [".ts", ".tsx"],
): { file: string; keys: string[] }[] {
  const results: { file: string; keys: string[] }[] = [];

  function scan(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and .git
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        scan(fullPath);
      } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
        const source = fs.readFileSync(fullPath, "utf-8");
        const keys = extractKeysFromSource(source);
        if (keys.length > 0) {
          results.push({ file: fullPath, keys });
        }
      }
    }
  }

  scan(dir);
  return results;
}

/**
 * Find dead keys: keys in locale files that are never used in code.
 */
export function findDeadKeys(localeKeys: string[], usedKeys: string[]): string[] {
  // Build set of used key patterns (supporting wildcards for namespace-first)
  const usedPatterns = usedKeys.filter((k) => k.endsWith(".*"));
  const usedExact = new Set(usedKeys.filter((k) => !k.endsWith(".*")));

  return localeKeys.filter((key) => {
    // Check exact match
    if (usedExact.has(key)) return false;

    // Check namespace pattern match
    const namespace = key.split(".")[0];
    if (usedPatterns.some((pattern) => pattern.startsWith(namespace))) {
      return false;
    }

    return true;
  });
}

/**
 * Get all keys from a locale JSON file.
 */
export function getLocaleKeys(filePath: string): string[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw) as Record<string, unknown>;

  // Flatten to dot-notation
  function flatten(obj: Record<string, unknown>, prefix = ""): string[] {
    const keys: string[] = [];
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === "string") {
        keys.push(fullKey);
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        keys.push(...flatten(value as Record<string, unknown>, fullKey));
      }
    }
    return keys;
  }

  return flatten(parsed);
}

// --- Main Script ---

async function main() {
  const rootDir = path.resolve(__dirname, "../../../..");
  const localesDir = path.resolve(__dirname, "../locales");
  const enJsonPath = path.join(localesDir, "en.json");

  // Get all locale keys
  const localeKeys = getLocaleKeys(enJsonPath);
  console.log(`Found ${localeKeys.length} keys in en.json`);

  // Scan packages and apps for key usages
  const scanDirs = [
    path.join(rootDir, "packages"),
    path.join(rootDir, "apps/frontend/src"),
    path.join(rootDir, "apps/api/src"),
    path.join(rootDir, "apps/worker/src"),
  ];

  const allUsedKeys: string[] = [];
  for (const dir of scanDirs) {
    const fileResults = scanFilesForKeys(dir);
    for (const result of fileResults) {
      allUsedKeys.push(...result.keys);
    }
  }

  console.log(`Found ${allUsedKeys.length} key usages across scanned files`);

  // Find dead keys
  const deadKeys = findDeadKeys(localeKeys, allUsedKeys);

  if (deadKeys.length === 0) {
    console.log("\nNo dead keys found! All locale keys are used in code.");
  } else {
    console.log(`\nFound ${deadKeys.length} dead keys (defined but not used in code):\n`);

    // Group by namespace
    const byNamespace: Record<string, string[]> = {};
    for (const key of deadKeys) {
      const ns = key.split(".")[0];
      if (!byNamespace[ns]) byNamespace[ns] = [];
      byNamespace[ns].push(key);
    }

    for (const [ns, keys] of Object.entries(byNamespace).sort()) {
      console.log(`  ${ns} (${keys.length} keys):`);
      for (const key of keys.slice(0, 5)) {
        console.log(`    - ${key}`);
      }
      if (keys.length > 5) {
        console.log(`    ... and ${keys.length - 5} more`);
      }
    }
  }

  // Exit with 0 (informational, not blocking)
  process.exit(0);
}

// Run if executed directly
if (process.argv[1] === __filename) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
