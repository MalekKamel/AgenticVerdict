import type { AgenticDesktopApi } from "./agentic-desktop-api";

declare global {
  interface Window {
    /** Present when the renderer is hosted inside `apps/desktop` (Electron preload). */
    agenticDesktop?: AgenticDesktopApi;
  }
}

export {};
