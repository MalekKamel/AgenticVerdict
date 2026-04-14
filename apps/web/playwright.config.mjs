import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/test";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const e2ePort = 3333;
const e2eOrigin = `http://127.0.0.1:${e2ePort}`;

/** Cross-browser matrix in CI (browsers installed via `playwright install --with-deps`). Locally use Chromium only unless E2E_ALL_BROWSERS=1. */
const runAllBrowsers = process.env.CI === "true" || process.env.E2E_ALL_BROWSERS === "1";

export default defineConfig({
  testDir: path.join(rootDir, "e2e"),
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: e2eOrigin,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    ...(runAllBrowsers
      ? [
          { name: "firefox", use: { ...devices["Desktop Firefox"] } },
          { name: "webkit", use: { ...devices["Desktop Safari"] } },
        ]
      : []),
  ],
  webServer: {
    command: `pnpm exec vite build && PORT=${e2ePort} pnpm exec node .output/server/index.mjs`,
    cwd: rootDir,
    url: e2eOrigin,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      COMPANY_CONFIG_DIR: path.resolve(rootDir, "../../configs/companies"),
    },
  },
});
