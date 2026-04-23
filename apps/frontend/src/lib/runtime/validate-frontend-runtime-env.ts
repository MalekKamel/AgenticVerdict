import { isTenantUuid } from "@agenticverdict/core";

export interface FrontendRuntimeEnvContractInput {
  runtimeEnv?: string;
  apiUrl?: string;
  vitePublicApiUrl?: string;
  vitePublicDefaultTenantId?: string;
  requireServerApiUrl?: boolean;
}

function isProductionLikeRuntime(runtimeEnv: string | undefined): boolean {
  return runtimeEnv === "production" || runtimeEnv === "staging";
}

function isValidAbsoluteUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateFrontendRuntimeEnvContract(
  input: FrontendRuntimeEnvContractInput = {},
): void {
  const runtimeEnv =
    input.runtimeEnv ?? process.env.AGENTICVERDICT_RUNTIME_ENV ?? process.env.NODE_ENV;

  if (!isProductionLikeRuntime(runtimeEnv)) {
    return;
  }

  const apiUrl = (input.apiUrl ?? process.env.API_URL ?? "").trim();
  const vitePublicApiUrl = (
    input.vitePublicApiUrl ??
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_PUBLIC_API_URL
      ? String(import.meta.env.VITE_PUBLIC_API_URL)
      : (process.env.VITE_PUBLIC_API_URL ?? ""))
  ).trim();
  const defaultTenantId = (
    input.vitePublicDefaultTenantId ??
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_PUBLIC_DEFAULT_TENANT_ID
      ? String(import.meta.env.VITE_PUBLIC_DEFAULT_TENANT_ID)
      : (process.env.VITE_PUBLIC_DEFAULT_TENANT_ID ?? ""))
  ).trim();

  const errors: string[] = [];
  const requireServerApiUrl =
    input.requireServerApiUrl ??
    !(typeof window !== "undefined" && typeof document !== "undefined");

  if (requireServerApiUrl) {
    if (!apiUrl) {
      errors.push("- Missing required `API_URL` (frontend SSR/internal API base URL).");
    } else if (!isValidAbsoluteUrl(apiUrl)) {
      errors.push(`- Invalid \`API_URL\` value "${apiUrl}" (must be an absolute http(s) URL).`);
    }
  }

  if (!vitePublicApiUrl) {
    errors.push("- Missing required `VITE_PUBLIC_API_URL` (browser-visible API base URL).");
  } else if (!isValidAbsoluteUrl(vitePublicApiUrl)) {
    errors.push(
      `- Invalid \`VITE_PUBLIC_API_URL\` value "${vitePublicApiUrl}" (must be an absolute http(s) URL).`,
    );
  }

  if (!defaultTenantId) {
    errors.push(
      "- Missing required `VITE_PUBLIC_DEFAULT_TENANT_ID` (required by /$locale home loader contract).",
    );
  } else if (!isTenantUuid(defaultTenantId)) {
    errors.push(
      `- Invalid \`VITE_PUBLIC_DEFAULT_TENANT_ID\` value "${defaultTenantId}" (must be a UUID).`,
    );
  }

  if (errors.length === 0) {
    return;
  }

  throw new Error(
    [
      "Frontend runtime env contract validation failed for production-like runtime.",
      requireServerApiUrl
        ? "Required variables: API_URL, VITE_PUBLIC_API_URL, VITE_PUBLIC_DEFAULT_TENANT_ID."
        : "Required variables: VITE_PUBLIC_API_URL, VITE_PUBLIC_DEFAULT_TENANT_ID.",
      ...errors,
    ].join("\n"),
  );
}
