import fs from "node:fs";
import path from "node:path";

import type { App } from "electron";

import { type DesktopRuntimeConfig, desktopRuntimeConfigSchema } from "@agenticverdict/desktop-ipc";

function readJsonFile(filePath: string): unknown | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/**
 * Merge order: packaged `resources/desktop-runtime-config.json` →
 * `userData/desktop-runtime-config.json` (user overrides).
 */
export function loadDesktopRuntimeConfig(app: App, devResourcesDir: string): DesktopRuntimeConfig {
  const packagedResources = app.isPackaged ? process.resourcesPath : devResourcesDir;
  const base = readJsonFile(path.join(packagedResources, "desktop-runtime-config.json"));
  const user = app.isPackaged
    ? readJsonFile(path.join(app.getPath("userData"), "desktop-runtime-config.json"))
    : null;

  const merged = {
    ...(typeof base === "object" && base !== null ? base : {}),
    ...(typeof user === "object" && user !== null ? user : {}),
  };
  const parsed = desktopRuntimeConfigSchema.safeParse(merged);
  if (!parsed.success) {
    console.error(
      JSON.stringify({
        event: "desktop.runtime_config.invalid",
        issues: parsed.error.flatten(),
      }),
    );
    return {};
  }
  return parsed.data;
}
