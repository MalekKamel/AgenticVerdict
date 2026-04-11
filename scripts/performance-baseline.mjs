#!/usr/bin/env node
/**
 * Captures quick local build timings for regression notes (Phase 00 audit: clean / incremental targets).
 * Full `turbo run build` can take several minutes; esbuild slices are fast CI-friendly probes.
 */
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function timeCommand(label, command, options = {}) {
  const start = performance.now();
  execSync(command, { stdio: "inherit", cwd: root, ...options });
  const ms = Math.round(performance.now() - start);
  return { label, ms };
}

const rows = [
  timeCommand("API esbuild bundle", "pnpm --filter @agenticverdict/api build:esbuild"),
  timeCommand("Worker esbuild bundle", "pnpm --filter @agenticverdict/worker build:esbuild"),
  timeCommand(
    "Agent-runtime typecheck (tsc --noEmit)",
    "pnpm --filter @agenticverdict/agent-runtime exec tsc --noEmit",
  ),
  timeCommand(
    "Data-connectors Vitest (connector boundary + perf guardrails)",
    "pnpm --filter @agenticverdict/data-connectors test",
  ),
];

const stamp = new Date().toISOString();
const table = rows.map((r) => `| ${r.label} | ${r.ms} |`).join("\n");
const block = `
## Run ${stamp}

| Step | Duration (ms) |
|------|----------------|
${table}
`;

const outMd = join(root, "docs/06-reference/performance-baselines.md");
if (process.env.PERFBASELINE_WRITE === "1") {
  mkdirSync(dirname(outMd), { recursive: true });
  let existing = "";
  try {
    existing = readFileSync(outMd, "utf8");
  } catch {
    existing = `# Performance baselines (local)\n\nAppend-only log from \`node scripts/performance-baseline.mjs\` with \`PERFBASELINE_WRITE=1\`.\n`;
  }
  writeFileSync(outMd, `${existing.trimEnd()}\n${block}\n`);
  console.log(`Appended timings to ${outMd}`);
} else {
  console.log(block);
  console.log(
    "\nSet PERFBASELINE_WRITE=1 to append this block to docs/06-reference/performance-baselines.md",
  );
}
