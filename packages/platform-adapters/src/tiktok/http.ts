import { PlatformAuthError, PlatformError, PlatformRateLimitError } from "../errors";
import type { TikTokEnvelope } from "./models";

export const TIKTOK_OPEN_API_VERSION = "v1.3";

/** Retryable TikTok `code` values (see tap-tiktok-ads / marketing API docs). */
const RETRYABLE_TIKTOK_CODES = new Set<number>([
  40_100, 40_200, 40_201, 40_202, 40_700, 50_000, 50_002,
]);

const AUTH_TIKTOK_CODES = new Set<number>([40_001, 40_102, 40_105, 41_000, 41_001]);

export function tiktokOpenApiOrigin(sandbox: boolean): string {
  return sandbox ? "https://sandbox-ads.tiktok.com" : "https://business-api.tiktok.com";
}

export function tiktokOpenApiBaseUrl(sandbox: boolean): string {
  return `${tiktokOpenApiOrigin(sandbox)}/open_api/${TIKTOK_OPEN_API_VERSION}`;
}

async function readJsonBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (text.length === 0) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { _parseFailure: text.slice(0, 500) };
  }
}

function extractEnvelope(body: unknown): TikTokEnvelope | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  return body as TikTokEnvelope;
}

export function mapTikTokHttpError(status: number, body: unknown): Error {
  const env = extractEnvelope(body);
  const code = env?.code;
  const message = env?.message ?? `TikTok API responded with HTTP ${status}`;

  if (status === 429) {
    return new PlatformRateLimitError("tiktok", message, { cause: body });
  }
  if (status === 401 || status === 403) {
    return new PlatformAuthError("tiktok", message, { cause: body });
  }
  if (typeof code === "number" && code !== 0) {
    return mapTikTokBusinessCode(code, message, body);
  }
  if (status >= 400 && status < 500) {
    return new PlatformError("tiktok", "invalid_request", message, { cause: body });
  }
  return new PlatformError("tiktok", "upstream_error", message, { cause: body });
}

export function mapTikTokBusinessCode(code: number, message: string, body: unknown): Error {
  const msg = message.length > 0 ? message : `TikTok API error code ${code}`;

  if (AUTH_TIKTOK_CODES.has(code)) {
    return new PlatformAuthError("tiktok", msg, { cause: body });
  }
  if (code === 40_202 || code === 40_201) {
    return new PlatformRateLimitError("tiktok", msg, { cause: body });
  }
  if (RETRYABLE_TIKTOK_CODES.has(code)) {
    return new PlatformError("tiktok", "upstream_error", msg, { cause: body });
  }
  if (code >= 40_000 && code < 50_000) {
    return new PlatformError("tiktok", "invalid_request", msg, { cause: body });
  }
  return new PlatformError("tiktok", "upstream_error", msg, { cause: body });
}

/**
 * Throws when `code !== 0`; returns parsed JSON envelope otherwise.
 */
export function assertTikTokSuccess(body: unknown): TikTokEnvelope {
  const env = extractEnvelope(body);
  if (!env || typeof env.code !== "number") {
    throw new PlatformError("tiktok", "upstream_error", "Malformed TikTok API response", {
      cause: body,
    });
  }
  if (env.code !== 0) {
    throw mapTikTokBusinessCode(env.code, env.message ?? "", body);
  }
  return env;
}

export async function tiktokParseResponse(res: Response): Promise<TikTokEnvelope> {
  const body = await readJsonBody(res);
  if (!res.ok) {
    throw mapTikTokHttpError(res.status, body);
  }
  return assertTikTokSuccess(body);
}
