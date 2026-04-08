#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** @param {string} dir */
function analyzeBundle(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  /** @type {{ file: string; size: number; mockHits: number; productionHits: number }[]} */
  const results = [];

  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...analyzeBundle(full));
    } else if (entry.isFile() && entry.name.endsWith(".mjs")) {
      const content = readFileSync(full, "utf8");
      const stats = statSync(full);
      const mockHits = (content.match(/MockPlatformAdapter|MockAdapterFactory/g) ?? []).length;
      const productionHits = (content.match(/MetaPlatformAdapter|Ga4PlatformAdapter/g) ?? [])
        .length;
      results.push({
        file: full,
        size: stats.size,
        mockHits,
        productionHits,
      });
    }
  }

  return results;
}

const dirs = process.argv.slice(2).filter(Boolean);
if (dirs.length === 0) {
  console.error("Usage: node analyze-bundles.mjs <dist-dir> [<dist-dir> ...]");
  process.exit(1);
}

/** @type {ReturnType<analyzeBundle>} */
let all = [];
for (const d of dirs) {
  all = all.concat(analyzeBundle(d));
}

const mockInProd = all.filter((b) => b.mockHits > 0);
if (mockInProd.length > 0) {
  console.error("Mock adapter symbols found in bundle output:", mockInProd);
  process.exit(1);
}

console.table(
  all.map(({ file, size, mockHits, productionHits }) => ({ file, size, mockHits, productionHits })),
);
console.info("analyze-bundles: no mock adapter symbols in scanned .mjs outputs.");
