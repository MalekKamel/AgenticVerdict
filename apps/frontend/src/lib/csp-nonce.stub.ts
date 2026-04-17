/**
 * Client bundle: read the nonce from TanStack Router’s hydration tag (same value as CSP).
 * SSR uses `csp-nonce.server.ts` (AsyncLocalStorage).
 */
export function getCspNonce(): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }
  const meta = document.querySelector('meta[property="csp-nonce"]');
  const content = meta?.getAttribute("content");
  return content && content.length > 0 ? content : undefined;
}
