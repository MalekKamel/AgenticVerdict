const GATEWAY_PREFIX = "/__gw/";

/**
 * Rewrites vendor HTTPS URLs to the local mock gateway, preserving the original host in-path
 * so a single listener can multiplex Meta, Google, and TikTok traffic without collisions.
 */
export function rewriteToGateway(originalUrl: string, port: number): string {
  const u = new URL(originalUrl);
  const base = `http://127.0.0.1:${port}`;
  return `${base}${GATEWAY_PREFIX}${u.host}${u.pathname}${u.search}`;
}

export function createRewritingFetch(port: number): typeof fetch {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    const raw =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    return fetch(rewriteToGateway(raw, port), init);
  };
}
