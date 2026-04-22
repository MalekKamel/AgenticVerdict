/**
 * IPC channel names shared between main and preload (renderer must never import Node modules).
 */
export const IPC_CHANNELS = {
  shellOpenExternal: "desktop:shell:openExternal",
  /** Main process → renderer (`webContents.send`); not used with `ipcMain.handle`. */
  deepLinkToRenderer: "desktop:deep-link",
  /** Synchronous config read from preload (`ipcRenderer.sendSync` → `event.returnValue`). */
  getRuntimeConfigSync: "desktop:runtime-config-sync",
  /** Async: copy-friendly debug snapshot (main + optional renderer fields). */
  getDebugSnapshot: "desktop:debug-snapshot",
} as const;
