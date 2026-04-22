import { contextBridge, ipcRenderer } from "electron";

import type { AgenticDesktopApi } from "./agentic-desktop-api";
import { IPC_CHANNELS, type DesktopRuntimeConfig } from "@agenticverdict/desktop-ipc";

function loadRuntimeConfigSync(): DesktopRuntimeConfig {
  try {
    const raw = ipcRenderer.sendSync(IPC_CHANNELS.getRuntimeConfigSync, "") as string;
    return JSON.parse(raw) as DesktopRuntimeConfig;
  } catch {
    return {};
  }
}

const api: AgenticDesktopApi = {
  platform: "electron",
  getRuntimeConfig: () => loadRuntimeConfigSync(),
  openExternal: async (url: string) => {
    await ipcRenderer.invoke(IPC_CHANNELS.shellOpenExternal, url);
  },
  onDeepLink: (handler: (url: string) => void) => {
    const listener = (_event: unknown, rawUrl: string) => {
      handler(rawUrl);
    };
    ipcRenderer.on(IPC_CHANNELS.deepLinkToRenderer, listener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.deepLinkToRenderer, listener);
    };
  },
};

contextBridge.exposeInMainWorld("agenticDesktop", api);
