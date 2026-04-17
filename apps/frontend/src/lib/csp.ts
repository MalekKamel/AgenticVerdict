/**
 * Production Content-Security-Policy for TanStack Start + Mantine (CSS-based).
 *
 * - **`script-src`** and **`style-src`** share the same per-request nonce (`src/start.ts`).
 * - **`style-src-attr 'unsafe-inline'`** allows React `style={{…}}` on DOM nodes; without it,
 *   inline style attributes are blocked when `style-src` omits `'unsafe-inline'` (CSP Level 3).
 */
export function buildContentSecurityPolicy(nonce: string): string {
  return [
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
    "connect-src 'self' https: wss:",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}
