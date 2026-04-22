import fs from "node:fs";
import path from "node:path";

import type { App } from "electron";

/**
 * Resolve the TanStack Start / Nitro `.output` directory (contains `server/index.mjs`).
 */
export function resolveWebOutputRoot(app: App, electronMainDir: string): string | null {
  const explicit = process.env.DESKTOP_WEB_OUTPUT_PATH;
  if (explicit && explicit.trim().length > 0) {
    const resolved = path.resolve(explicit.trim());
    if (hasServerEntry(resolved)) {
      return resolved;
    }
    return null;
  }

  if (app.isPackaged) {
    const packaged = path.join(process.resourcesPath, "frontend-output");
    if (hasServerEntry(packaged)) {
      return packaged;
    }
    return null;
  }

  const devGuess = path.resolve(electronMainDir, "../../../frontend/.output");
  if (hasServerEntry(devGuess)) {
    return devGuess;
  }

  return null;
}

function hasServerEntry(outputRoot: string): boolean {
  return fs.existsSync(path.join(outputRoot, "server/index.mjs"));
}
