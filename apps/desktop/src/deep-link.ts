import path from "node:path";

import type { App, BrowserWindow } from "electron";

import { IPC_CHANNELS, PROTOCOL, sanitizeDeepLinkUrl } from "@agenticverdict/desktop-ipc";

export { PROTOCOL, sanitizeDeepLinkUrl } from "@agenticverdict/desktop-ipc";

export function registerProtocolClient(app: App): void {
  if (process.env.DESKTOP_DISABLE_DEEP_LINK === "1") {
    return;
  }
  try {
    const proc = process as NodeJS.Process & { defaultApp?: boolean };
    if (proc.defaultApp) {
      if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [
          path.resolve(process.argv[1] ?? ""),
        ]);
      }
    } else {
      app.setAsDefaultProtocolClient(PROTOCOL);
    }
  } catch {
    // Dev / sandboxed environments may reject registration; deep links remain optional.
  }
}

export function extractDeepLinkArg(argv: string[]): string | undefined {
  return argv.find((a) => a.startsWith(`${PROTOCOL}://`));
}

export function sendDeepLinkToWindow(win: BrowserWindow | null, url: string): void {
  if (!win || win.isDestroyed()) {
    return;
  }
  const safe = sanitizeDeepLinkUrl(url);
  if (!safe) {
    console.error(JSON.stringify({ event: "desktop.deeplink.rejected", length: url.length }));
    return;
  }
  win.webContents.send(IPC_CHANNELS.deepLinkToRenderer, safe);
}
