import type { TikTokOAuthTokenData } from "./models";
import {
  assertTikTokSuccess,
  mapTikTokHttpError,
  tiktokOpenApiBaseUrl,
  tiktokParseResponse,
} from "./http";

export interface TikTokOAuthAccessTokenInput {
  readonly appId: string;
  readonly secret: string;
  readonly grantType: "authorization_code" | "refresh_token";
  /** Required when `grantType` is `authorization_code`. */
  readonly authCode?: string;
  /** Required when `grantType` is `refresh_token`. */
  readonly refreshToken?: string;
  readonly fetchImpl?: typeof fetch;
  readonly sandbox?: boolean;
}

export interface TikTokOAuthAccessTokenResult {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly expiresIn?: number;
}

/**
 * Exchanges an auth code or refresh token for a Marketing API access token.
 * POST `/open_api/v1.3/oauth2/access_token/`
 */
export async function tiktokOauth2AccessToken(
  input: TikTokOAuthAccessTokenInput,
): Promise<TikTokOAuthAccessTokenResult> {
  const fetchFn = input.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const base = tiktokOpenApiBaseUrl(input.sandbox ?? false);
  const url = `${base}/oauth2/access_token/`;

  const body: Record<string, string> = {
    app_id: input.appId,
    secret: input.secret,
    grant_type: input.grantType,
  };
  if (input.grantType === "authorization_code") {
    const code = input.authCode?.trim() ?? "";
    if (code.length === 0) {
      throw new Error("authCode is required for authorization_code grant");
    }
    body.auth_code = code;
  } else {
    const rt = input.refreshToken?.trim() ?? "";
    if (rt.length === 0) {
      throw new Error("refreshToken is required for refresh_token grant");
    }
    body.refresh_token = rt;
  }

  const res = await fetchFn(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const parsed = await tiktokParseResponse(res);
  const data = parsed.data as TikTokOAuthTokenData | undefined;
  const access = typeof data?.access_token === "string" ? data.access_token.trim() : "";
  if (access.length === 0) {
    throw new Error("TikTok OAuth response missing access_token");
  }
  return {
    accessToken: access,
    refreshToken:
      typeof data?.refresh_token === "string" && data.refresh_token.length > 0
        ? data.refresh_token
        : undefined,
    expiresIn: typeof data?.expires_in === "number" ? data.expires_in : undefined,
  };
}

/**
 * Validates a Marketing API access token via GET `user/info`.
 */
export async function validateTikTokAccessToken(
  accessToken: string,
  fetchImpl?: typeof fetch,
  sandbox?: boolean,
): Promise<void> {
  const fetchFn = fetchImpl ?? globalThis.fetch.bind(globalThis);
  const base = tiktokOpenApiBaseUrl(sandbox ?? false);
  const url = new URL(`${base}/user/info/`);
  const res = await fetchFn(url.toString(), {
    method: "GET",
    headers: {
      "Access-Token": accessToken,
      Accept: "application/json",
    },
  });
  const body = await res.text();
  let parsed: unknown = null;
  if (body.length > 0) {
    try {
      parsed = JSON.parse(body) as unknown;
    } catch {
      parsed = { _parseFailure: body.slice(0, 500) };
    }
  }
  if (!res.ok) {
    throw mapTikTokHttpError(res.status, parsed);
  }
  assertTikTokSuccess(parsed);
}
