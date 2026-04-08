#!/usr/bin/env node
/**
 * Live LLM Verdict launcher.
 * Keeps `node scripts/live-llm-verdict.mjs` working by delegating to tsx.
 */
import { spawnSync } from "node:child_process";

const result = spawnSync(
  "pnpm",
  ["exec", "tsx", "scripts/live-llm-verdict.ts", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: process.env,
  },
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
