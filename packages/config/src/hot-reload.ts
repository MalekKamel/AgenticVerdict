import { watch, type FSWatcher } from "node:fs";

import type { ConfigManager } from "./config-manager";

const HOT_RELOAD_ENV = "AGENTICVERDICT_CONFIG_HOT_RELOAD";

/**
 * Watches the manager's config directory and invalidates cache entries when `*.json` changes.
 * Enable with `AGENTICVERDICT_CONFIG_HOT_RELOAD=1` (no-op in production unless explicitly set).
 */
export function watchTenantConfigDirectory(
  manager: ConfigManager,
  options: { enabled?: boolean } = {},
): FSWatcher | undefined {
  const enabled =
    options.enabled ??
    (process.env[HOT_RELOAD_ENV] === "1" || process.env[HOT_RELOAD_ENV]?.toLowerCase() === "true");
  if (!enabled) {
    return undefined;
  }

  const dir = manager.getConfigDir();
  return watch(dir, (_event, filename) => {
    if (!filename || !filename.endsWith(".json")) {
      return;
    }
    const tenantId = filename.replace(/\.json$/i, "");
    manager.invalidate(tenantId);
  });
}
