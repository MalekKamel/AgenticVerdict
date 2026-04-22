import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { app, BrowserWindow, clipboard, dialog, ipcMain, Menu, shell } from "electron";

import type { DesktopRuntimeConfig } from "@agenticverdict/desktop-ipc";
import { IPC_CHANNELS } from "@agenticverdict/desktop-ipc";

import { extractDeepLinkArg, registerProtocolClient, sendDeepLinkToWindow } from "./deep-link";
import { desktopLog } from "./desktop-log";
import { loadDesktopRuntimeConfig } from "./desktop-runtime-config";
import {
  getFreePort,
  nodeExecutableAvailable,
  resolveNodeExecutable,
  startEmbeddedWebServer,
  stopEmbeddedWebServer,
  waitForHttpReady,
} from "./embedded-web-server";
import { resolveWebOutputRoot } from "./resolve-frontend-output";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

/** Reuse one embedded dev server / explicit URL across extra windows (e.g. macOS activate). */
let resolvedEntryHref: string | null = null;

let cachedRuntimeConfig: DesktopRuntimeConfig = {};

type RendererMode = "embedded" | "remote" | "static" | "dev";
let rendererMode: RendererMode = "dev";

const isDev =
  process.env.NODE_ENV === "development" || process.env.DESKTOP_DEV === "1" || !app.isPackaged;

function toFileUrlHref(resolvedPath: string): string {
  const absolute = path.isAbsolute(resolvedPath)
    ? resolvedPath
    : path.resolve(process.cwd(), resolvedPath);
  return pathToFileURL(absolute).href;
}

function buildDebugSnapshot(): Record<string, unknown> {
  return {
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    platform: process.platform,
    arch: process.arch,
    packaged: app.isPackaged,
    rendererMode,
    runtimeApiBaseUrlConfigured: !!cachedRuntimeConfig.apiBaseUrl,
  };
}

function installMenus(): void {
  const copyDebug = (): void => {
    clipboard.writeText(JSON.stringify(buildDebugSnapshot(), null, 2));
    desktopLog("desktop.debug.copied");
  };

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(process.platform === "darwin"
      ? [{ role: "appMenu" as const }]
      : [
          {
            label: "File",
            submenu: [{ role: "quit" as const }],
          },
        ]),
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { type: "separator" },
        { label: "Copy debug info", click: copyDebug },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function registerIpc(): void {
  ipcMain.handle(IPC_CHANNELS.shellOpenExternal, async (_event, rawUrl: unknown) => {
    if (typeof rawUrl !== "string" || rawUrl.length === 0) {
      throw new TypeError("openExternal requires a non-empty string URL");
    }
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new TypeError("openExternal only allows http(s) URLs");
    }
    await shell.openExternal(parsed.href);
  });

  ipcMain.handle(IPC_CHANNELS.getDebugSnapshot, async () => buildDebugSnapshot());
}

function maybeConfigureAutoUpdater(): void {
  if (!app.isPackaged) {
    return;
  }
  const updaterUrl = process.env.DESKTOP_UPDATES_URL?.trim();
  if (!updaterUrl) {
    return;
  }
  void import("electron-updater")
    .then(({ autoUpdater }) => {
      autoUpdater.setFeedURL({ provider: "generic", url: updaterUrl });
      autoUpdater.autoDownload = false;
      desktopLog("desktop.updater.feed_configured", { url: updaterUrl });
      void autoUpdater.checkForUpdatesAndNotify();
    })
    .catch((e: unknown) => {
      console.error(JSON.stringify({ event: "desktop.updater.failed", message: String(e) }));
    });
}

async function resolveRendererHref(): Promise<string> {
  if (resolvedEntryHref) {
    return resolvedEntryHref;
  }

  const staticIndex = process.env.DESKTOP_RENDERER_STATIC;
  if (staticIndex && staticIndex.trim().length > 0) {
    rendererMode = "static";
    resolvedEntryHref = toFileUrlHref(staticIndex.trim());
    return resolvedEntryHref;
  }

  const explicit = process.env.DESKTOP_RENDERER_URL;
  if (explicit && explicit.trim().length > 0) {
    rendererMode = "remote";
    resolvedEntryHref = explicit.trim();
    return resolvedEntryHref;
  }

  const useEmbedded =
    process.env.DESKTOP_EMBEDDED_SERVER === "1" ||
    (app.isPackaged && process.env.DESKTOP_EMBEDDED_SERVER !== "0");

  const webOut = resolveWebOutputRoot(app, __dirname);

  if (useEmbedded && !webOut && app.isPackaged) {
    dialog.showErrorBox(
      "AgenticVerdict Desktop",
      "This build is missing resources/frontend-output (TanStack Start .output). Set DESKTOP_RENDERER_URL to a hosted web app or rebuild with copy-frontend-output.",
    );
    throw new Error("Missing packaged web output");
  }

  if (useEmbedded && webOut) {
    const resourcesPath = app.isPackaged ? process.resourcesPath : undefined;
    const nodeExecutable = resolveNodeExecutable(resourcesPath);
    if (!nodeExecutableAvailable(nodeExecutable)) {
      console.error(
        JSON.stringify({
          event: "desktop.embedded.node_missing",
          packaged: app.isPackaged,
          nodeExecutable,
        }),
      );
      const browserUrl = process.env.DESKTOP_FALLBACK_BROWSER_URL?.trim();
      const docsUrl = process.env.DESKTOP_DOCS_URL?.trim();
      const buttons: string[] = [];
      if (browserUrl) buttons.push("Open in browser");
      if (docsUrl) buttons.push("Open documentation");
      buttons.push("Quit");
      const { response } = await dialog.showMessageBox({
        type: "error",
        title: "AgenticVerdict Desktop",
        message:
          "Node.js is required to run the embedded web server. Install Node from https://nodejs.org, ship a binary under resources/node (see README), set DESKTOP_NODE_BINARY, or use DESKTOP_RENDERER_URL for a hosted app.",
        buttons,
        defaultId: 0,
        cancelId: buttons.length - 1,
      });
      let offset = 0;
      if (browserUrl) {
        if (response === offset) {
          await shell.openExternal(browserUrl);
          throw new Error("desktop_embedded_fallback_browser");
        }
        offset++;
      }
      if (docsUrl) {
        if (response === offset) {
          await shell.openExternal(docsUrl);
          throw new Error("desktop_embedded_fallback_docs");
        }
        offset++;
      }
      throw new Error("Node.js not available for embedded web server");
    }

    try {
      rendererMode = "embedded";
      const port = await getFreePort();
      startEmbeddedWebServer(webOut, port, nodeExecutable);
      await waitForHttpReady(port);
      resolvedEntryHref = `http://127.0.0.1:${port}/`;
      desktopLog("desktop.embedded.started", { port });
      return resolvedEntryHref;
    } catch (e) {
      dialog.showErrorBox(
        "AgenticVerdict Desktop",
        `Could not start the embedded web server. Ensure Node.js is available, set DESKTOP_RENDERER_URL, or build with \`resources/frontend-output\`.\n\n${String(e)}`,
      );
      throw e;
    }
  }

  rendererMode = "dev";
  resolvedEntryHref = "http://localhost:3000/";
  return resolvedEntryHref;
}

async function createWindow(): Promise<void> {
  const href = await resolveRendererHref();

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    // Default Electron session (no custom partition); cookie behavior matches a normal Chromium profile.
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow = win;

  void win.loadURL(href);

  if (isDev && process.env.DESKTOP_DISABLE_DEVTOOLS !== "1") {
    win.webContents.openDevTools({ mode: "detach" });
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        void shell.openExternal(parsed.href);
      }
    } catch {
      // ignore malformed URLs
    }
    return { action: "deny" };
  });
}

/** Playwright and some test harnesses spawn overlapping Electron processes; allow opt-out. */
const disableSingleInstance = process.env.DESKTOP_DISABLE_SINGLE_INSTANCE === "1";
const gotLock = disableSingleInstance ? true : app.requestSingleInstanceLock();

if (!disableSingleInstance && !gotLock) {
  app.quit();
} else {
  if (!disableSingleInstance) {
    app.on("second-instance", (_event, argv) => {
      const url = extractDeepLinkArg(argv);
      if (url) {
        sendDeepLinkToWindow(mainWindow, url);
      }
      const win = BrowserWindow.getAllWindows()[0];
      if (win) {
        if (win.isMinimized()) {
          win.restore();
        }
        win.focus();
      }
    });
  }

  app.whenReady().then(async () => {
    const devResourcesDir = path.join(__dirname, "..", "resources");
    cachedRuntimeConfig = loadDesktopRuntimeConfig(app, devResourcesDir);

    ipcMain.on(IPC_CHANNELS.getRuntimeConfigSync, (event) => {
      event.returnValue = JSON.stringify(cachedRuntimeConfig);
    });

    installMenus();
    registerIpc();
    registerProtocolClient(app);
    maybeConfigureAutoUpdater();

    desktopLog("desktop.app.ready", { packaged: app.isPackaged });

    if (process.platform === "darwin") {
      app.on("open-url", (event, url) => {
        event.preventDefault();
        sendDeepLinkToWindow(mainWindow, url);
      });
    }

    try {
      await createWindow();
      desktopLog("desktop.window.loaded", { rendererMode });

      const initialDeepLink = extractDeepLinkArg(process.argv);
      if (initialDeepLink) {
        sendDeepLinkToWindow(mainWindow, initialDeepLink);
      }
    } catch {
      app.quit();
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        void createWindow().catch(() => app.quit());
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("before-quit", () => {
    desktopLog("desktop.embedded.stopping");
    stopEmbeddedWebServer();
  });
}
