export type FrontendAuthApiMode = "real" | "mock";

function readEnvMode(): string | undefined {
  const fromVite =
    typeof import.meta !== "undefined" && import.meta.env?.VITE_PUBLIC_AUTH_API_MODE
      ? String(import.meta.env.VITE_PUBLIC_AUTH_API_MODE)
      : undefined;
  return fromVite ?? process.env.VITE_PUBLIC_AUTH_API_MODE;
}

export function resolveFrontendAuthApiMode(): FrontendAuthApiMode {
  const explicit = readEnvMode()?.trim();
  if (!explicit) {
    return "real";
  }
  if (explicit === "real" || explicit === "mock") {
    return explicit;
  }
  throw new Error(`VITE_PUBLIC_AUTH_API_MODE must be "real" or "mock", received "${explicit}"`);
}

export function isFrontendAuthApiMockEnabled(): boolean {
  if (import.meta.env.PROD) {
    return false;
  }
  return resolveFrontendAuthApiMode() === "mock";
}
