import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test, _electron as electron } from "@playwright/test";

const require = createRequire(import.meta.url);
const electronBin = require("electron") as string;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const webOutputRoot = path.resolve(projectRoot, "../frontend/.output");

const hasWebOutput = fs.existsSync(path.join(webOutputRoot, "server/index.mjs"));

test.skip(
  !hasWebOutput,
  "Run pnpm --filter @agenticverdict/frontend build to produce apps/frontend/.output before desktop e2e.",
);

async function waitForHttpPage(app: Awaited<ReturnType<typeof electron.launch>>) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    for (const page of app.windows()) {
      const u = page.url();
      if (u.startsWith("http://") || u.startsWith("https://")) {
        return page;
      }
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("Timed out waiting for an http(s) app window");
}

test("embedded Nitro window loads", async () => {
  const env = { ...process.env };
  delete env.NODE_OPTIONS;
  delete env.NODE_INSPECTOR_IPC;

  const app = await electron.launch({
    args: ["."],
    cwd: projectRoot,
    executablePath: electronBin,
    env: {
      ...env,
      DESKTOP_DISABLE_SINGLE_INSTANCE: "1",
      DESKTOP_DISABLE_DEVTOOLS: "1",
      DESKTOP_EMBEDDED_SERVER: "1",
      DESKTOP_WEB_OUTPUT_PATH: webOutputRoot,
      DESKTOP_DEV: "0",
      NODE_ENV: "production",
    },
  });

  const window = await waitForHttpPage(app);
  await window.waitForLoadState("domcontentloaded");
  await app.close();
});

test("embedded Nitro serves Arabic locale with RTL document direction", async () => {
  const env = { ...process.env };
  delete env.NODE_OPTIONS;
  delete env.NODE_INSPECTOR_IPC;

  const app = await electron.launch({
    args: ["."],
    cwd: projectRoot,
    executablePath: electronBin,
    env: {
      ...env,
      DESKTOP_DISABLE_SINGLE_INSTANCE: "1",
      DESKTOP_DISABLE_DEVTOOLS: "1",
      DESKTOP_EMBEDDED_SERVER: "1",
      DESKTOP_WEB_OUTPUT_PATH: webOutputRoot,
      DESKTOP_DEV: "0",
      NODE_ENV: "production",
    },
  });

  const window = await waitForHttpPage(app);
  await window.waitForLoadState("domcontentloaded");
  const base = await window.url();
  await window.goto(new URL("ar/", base).href);
  await window.waitForLoadState("domcontentloaded");
  const dir = await window.evaluate(
    () => document.querySelector("[dir]")?.getAttribute("dir") ?? null,
  );
  expect(dir).toBe("rtl");
  await app.close();
});
