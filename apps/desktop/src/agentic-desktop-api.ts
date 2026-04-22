import type { DesktopRuntimeConfig } from "@agenticverdict/desktop-ipc";

/**
 * Surface exposed to the renderer via `contextBridge` (see `preload.ts`).
 * The web app may read `window.agenticDesktop` when running inside Electron.
 */
export type AgenticDesktopApi = {
  readonly platform: "electron";
  /**
   * Open a URL in the system browser (never use for in-app navigation).
   */
  openExternal: (url: string) => Promise<void>;
  /**
   * Subscribe to custom protocol URLs (`agenticverdict://...`) forwarded from the main process.
   * Returns an unsubscribe function.
   */
  onDeepLink: (handler: (url: string) => void) => () => void;
  /**
   * Runtime config merged from `resources/desktop-runtime-config.json` and
   * `userData/desktop-runtime-config.json` (see `desktop-runtime-config.ts`).
   */
  getRuntimeConfig: () => DesktopRuntimeConfig;
};
