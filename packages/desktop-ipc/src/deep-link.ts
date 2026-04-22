import { PROTOCOL } from "./protocol";

const MAX_LEN = 8192;

/**
 * Validates `agenticverdict://` URLs before navigation or IPC to the renderer.
 * Allows locale routes, `/auth/*`, and `host === "auth"` (OAuth-style callbacks).
 */
export function sanitizeDeepLinkUrl(raw: string): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_LEN) {
    return null;
  }
  try {
    const u = new URL(raw);
    if (u.protocol !== `${PROTOCOL}:`) {
      return null;
    }
    const path = u.pathname || "/";
    const host = u.hostname;
    if (host === "auth") {
      return raw;
    }
    if (/^\/(en|ar)(\/|$)/.test(path)) {
      return raw;
    }
    if (/^\/auth(\/|$)/.test(path)) {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}
