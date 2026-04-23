/**
 * Production Content-Security-Policy for TanStack Start + Mantine (CSS-based).
 *
 * - **`script-src`** and **`style-src`** share the same per-request nonce (`src/start.ts`).
 * - **`style-src-attr 'unsafe-inline'`** allows React `style={{…}}` on DOM nodes; without it,
 *   inline style attributes are blocked when `style-src` omits `'unsafe-inline'` (CSP Level 3).
 */
function shouldEnableUpgradeInsecureRequests(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }

  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "https:") {
      return false;
    }
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1") {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

export function buildContentSecurityPolicy(
  nonce: string,
  options: { requestOrigin?: string } = {},
): string {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "manifest-src 'self'",
    "worker-src 'none'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    // Allow local API dev port pairing (frontend 300x -> api 400x).
    // `wss:` does not cover `ws:` — include common Vite HMR / tooling localhost ports.
    "connect-src 'self' https: wss: ws://localhost:3000 ws://127.0.0.1:3000 ws://localhost:8080 ws://127.0.0.1:8080 ws://localhost:8081 ws://127.0.0.1:8081 http://localhost:4000 http://127.0.0.1:4000 http://localhost:4001 http://127.0.0.1:4001",
    "object-src 'none'",
  ];

  if (shouldEnableUpgradeInsecureRequests(options.requestOrigin)) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}
