import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface KeyUsage {
  key: string;
  file: string;
  line: number;
}

interface ExtractionReport {
  totalKeys: number;
  byNamespace: Record<string, number>;
  dynamicKeyCount: number;
  fileReferences: { file: string; keyCount: number }[];
  allUsages: KeyUsage[];
}

/**
 * Extract i18n key usages with file locations from frontend source.
 */
export function extractKeysWithLocations(dir: string): KeyUsage[] {
  const usages: KeyUsage[] = [];

  function scan(currentDir: string) {
    if (!fs.existsSync(currentDir)) return;

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        scan(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
        const source = fs.readFileSync(fullPath, "utf-8");
        const lines = source.split("\n");

        lines.forEach((line, index) => {
          // Match useTranslations("namespace")
          const nsMatches = line.matchAll(/useTranslations\(\s*["']([^"']+)["']/g);
          for (const match of nsMatches) {
            usages.push({
              key: `${match[1]}.*`,
              file: fullPath,
              line: index + 1,
            });
          }

          // Match .t("key") patterns
          const tMatches = line.matchAll(/\.t\(\s*["']([^"']+)["']/g);
          for (const match of tMatches) {
            usages.push({
              key: match[1],
              file: fullPath,
              line: index + 1,
            });
          }

          // Match standalone t("key") patterns
          const standaloneMatches = line.matchAll(/(?<![.\w])t\(\s*["']([^"']+)["']/g);
          for (const match of standaloneMatches) {
            usages.push({
              key: match[1],
              file: fullPath,
              line: index + 1,
            });
          }
        });
      }
    }
  }

  scan(dir);
  return usages;
}

/**
 * Generate extraction report with namespace breakdown.
 */
export function generateReport(usages: KeyUsage[]): ExtractionReport {
  const byNamespace: Record<string, number> = {};
  const fileMap: Record<string, number> = {};
  let dynamicKeyCount = 0;

  for (const usage of usages) {
    // Extract namespace
    const ns = usage.key.split(".")[0];
    byNamespace[ns] = (byNamespace[ns] || 0) + 1;

    // Count per file
    fileMap[usage.file] = (fileMap[usage.file] || 0) + 1;

    // Count dynamic keys (wildcards)
    if (usage.key.endsWith(".*")) {
      dynamicKeyCount++;
    }
  }

  const fileReferences = Object.entries(fileMap)
    .map(([file, keyCount]) => ({ file, keyCount }))
    .sort((a, b) => b.keyCount - a.keyCount);

  return {
    totalKeys: usages.length,
    byNamespace,
    dynamicKeyCount,
    fileReferences,
    allUsages: usages,
  };
}

// --- Main Script ---

async function main() {
  const frontendSrc = path.resolve(__dirname, "..");
  const outputDir = path.resolve(__dirname, "../../.i18n-reports");

  console.log(`Scanning frontend source: ${frontendSrc}`);

  const usages = extractKeysWithLocations(frontendSrc);
  const report = generateReport(usages);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write report
  const reportPath = path.join(outputDir, "key-usage-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");

  // Print summary
  console.log(`\n=== i18n Key Extraction Report ===`);
  console.log(`Total key usages found: ${report.totalKeys}`);
  console.log(`Dynamic namespace usages: ${report.dynamicKeyCount}`);
  console.log(`Files with i18n usage: ${report.fileReferences.length}`);

  console.log("\nTop namespaces by usage:");
  Object.entries(report.byNamespace)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([ns, count]) => {
      console.log(`  ${ns}: ${count}`);
    });

  console.log(`\nReport saved to: ${reportPath}`);
}

// Run if executed directly
if (process.argv[1] === __filename) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
