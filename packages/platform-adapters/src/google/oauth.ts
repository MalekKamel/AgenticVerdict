import type { PlatformType } from "@agenticverdict/types";

import { PlatformAuthError } from "../errors";

const TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";

export interface ValidateGoogleAccessTokenResult {
  readonly expiresInSeconds?: number;
  readonly audience?: string;
}

export interface RefreshGoogleAccessTokenInput {
  readonly platform: PlatformType;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly refreshToken: string;
  readonly fetchImpl?: typeof fetch;
}

export interface RefreshGoogleAccessTokenResult {
  readonly accessToken: string;
  readonly expiresInSeconds?: number;
}

function readJson(res: Response): Promise<unknown> {
  return res.text().then((text) => {
    if (text.length === 0) {
      return null;
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { _parseFailure: text.slice(0, 500) };
    }
  });
}

/**
 * Validates a Google OAuth access token (shared across GA4, GSC, GBP).
 */
export async function validateGoogleAccessTokenForPlatform(
  platform: PlatformType,
  accessToken: string,
  fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis),
): Promise<ValidateGoogleAccessTokenResult> {
  const url = new URL(TOKEN_INFO_URL);
  url.searchParams.set("access_token", accessToken);
  const res = await fetchImpl(url.toString());
  const body = await readJson(res);
  if (!res.ok) {
    const msg =
      typeof body === "object" && body !== null && "error_description" in body
        ? String((body as { error_description?: unknown }).error_description)
        : `Google tokeninfo responded with HTTP ${res.status}`;
    throw new PlatformAuthError(platform, msg, { cause: body });
  }
  if (typeof body !== "object" || body === null) {
    throw new PlatformAuthError(platform, "tokeninfo returned a non-object body", { cause: body });
  }
  const expires = (body as { expires_in?: unknown }).expires_in;
  const aud = (body as { aud?: unknown }).aud;
  return {
    expiresInSeconds:
      typeof expires === "string"
        ? Number(expires)
        : typeof expires === "number"
          ? expires
          : undefined,
    audience: typeof aud === "string" ? aud : undefined,
  };
}

/**
 * Exchanges a refresh token for a new access token (server-side OAuth).
 */
export async function refreshGoogleAccessTokenForPlatform(
  input: RefreshGoogleAccessTokenInput,
): Promise<RefreshGoogleAccessTokenResult> {
  const fetchFn = input.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const body = new URLSearchParams({
    client_id: input.clientId,
    client_secret: input.clientSecret,
    refresh_token: input.refreshToken,
    grant_type: "refresh_token",
  });
  const res = await fetchFn(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const json = await readJson(res);
  if (!res.ok) {
    const msg =
      typeof json === "object" && json !== null && "error_description" in json
        ? String((json as { error_description?: unknown }).error_description)
        : `Google OAuth token endpoint responded with HTTP ${res.status}`;
    throw new PlatformAuthError(input.platform, msg, { cause: json });
  }
  if (typeof json !== "object" || json === null) {
    throw new PlatformAuthError(input.platform, "token endpoint returned a non-object body", {
      cause: json,
    });
  }
  const token = (json as { access_token?: unknown }).access_token;
  if (typeof token !== "string" || token.length === 0) {
    throw new PlatformAuthError(input.platform, "token response missing access_token", {
      cause: json,
    });
  }
  const exp = (json as { expires_in?: unknown }).expires_in;
  return {
    accessToken: token,
    expiresInSeconds:
      typeof exp === "number" ? exp : typeof exp === "string" ? Number(exp) : undefined,
  };
}
