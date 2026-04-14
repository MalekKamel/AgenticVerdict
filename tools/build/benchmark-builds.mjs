#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";

/** @param {string} root */
function dirSizeBytes(root) {
  let total = 0;
  const walk = (p) => {
    for (const name of readdirSync(p, { withFileTypes: true })) {
      const full = join(p, name.name);
      if (name.isDirectory()) {
        walk(full);
      } else if (name.isFile()) {
        total += statSync(full).size;
      }
    }
  };
  try {
    walk(root);
  } catch {
    return 0;
  }
  return total;
}

/**
 * @param {string} name
 * @param {string} command
 * @param {string} distDir
 */
function benchmark(name, command, distDir) {
  const start = performance.now();
  execSync(command, { stdio: "inherit" });
  const duration = performance.now() - start;
  const bundleSize = dirSizeBytes(distDir);
  return { name, durationMs: Math.round(duration), bundleSizeBytes: bundleSize };
}

const cwd = process.cwd();
const rows = [
  benchmark(
    "API Vite bundle (current NODE_ENV)",
    "pnpm --filter @agenticverdict/api build:vite",
    join(cwd, "apps/api/dist"),
  ),
  benchmark(
    "Worker Vite bundle (current NODE_ENV)",
    "pnpm --filter @agenticverdict/worker build:vite",
    join(cwd, "apps/worker/dist"),
  ),
];

console.table(rows);
