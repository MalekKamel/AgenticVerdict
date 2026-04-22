"use client";

import { sanitizeDeepLinkUrl } from "@agenticverdict/desktop-ipc";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * When running inside Electron, maps `agenticverdict://` URLs from the main process
 * onto TanStack Router navigation (same route tree as the web app).
 */
export function DesktopDeepLinkBridge() {
  const router = useRouter();

  useEffect(() => {
    const desktop = window.agenticDesktop;
    if (!desktop?.onDeepLink) {
      return;
    }

    return desktop.onDeepLink((url) => {
      const safe = sanitizeDeepLinkUrl(url);
      if (!safe) {
        return;
      }
      try {
        const parsed = new URL(safe);
        const target = `${parsed.pathname}${parsed.search}${parsed.hash}`;
        if (target.length > 0) {
          router.navigate({ to: target });
        }
      } catch {
        // malformed custom URL
      }
    });
  }, [router]);

  return null;
}
