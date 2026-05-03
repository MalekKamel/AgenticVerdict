export function resolveServerApiBaseUrls(
  req: Request,
  env: { vitePublicApiUrl?: string; apiUrl?: string; runtimeEnv?: string },
): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  const push = (value: string | null | undefined) => {
    if (!value) return;
    const normalized = value.replace(/\/$/, "");
    if (seen.has(normalized)) return;
    seen.add(normalized);
    candidates.push(normalized);
  };

  const runtimeEnv =
    env.runtimeEnv ?? process.env.AGENTICVERDICT_RUNTIME_ENV ?? process.env.NODE_ENV;
  const isProductionLike = runtimeEnv === "production" || runtimeEnv === "staging";

  /**
   * Server-side callers should prefer internal service discovery first (`API_URL`),
   * especially in containers where `VITE_PUBLIC_API_URL` commonly points to host-only
   * addresses (e.g. localhost) that are browser-facing, not server-facing.
   */
  push(env.apiUrl);
  push(env.vitePublicApiUrl);

  const hostHeader = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const [rawHost, rawPort] = hostHeader.split(":");
  const host = rawHost?.trim();
  const frontendPort = Number(rawPort);
  const hasFrontendPort = Number.isFinite(frontendPort) && frontendPort > 0;
  const mappedApiPort = hasFrontendPort ? frontendPort + 1000 : 4000;

  if (host && !isProductionLike) {
    // Keep local dev port pairing deterministic: 3000->4000, 3001->4001, etc.
    push(`${proto}://${host}:${mappedApiPort}`);
    push(`${proto}://${host}:4000`);
    if (mappedApiPort !== 4001) {
      push(`${proto}://${host}:4001`);
    }
  }

  if (!isProductionLike) {
    push("http://localhost:4000");
    push("http://localhost:4001");
  }

  return candidates;
}
