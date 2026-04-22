#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(__dirname, "..");
const frontendOutput = path.resolve(desktopRoot, "../frontend/.output");
const dest = path.join(desktopRoot, "resources/frontend-output");

const serverEntry = path.join(frontendOutput, "server/index.mjs");
if (!fs.existsSync(serverEntry)) {
  console.error(
    "[copy-frontend-output] Missing apps/frontend/.output/server/index.mjs — run: pnpm --filter @agenticverdict/frontend build",
  );
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.cpSync(frontendOutput, dest, { recursive: true });
console.log(`[copy-frontend-output] Copied ${frontendOutput} -> ${dest}`);
