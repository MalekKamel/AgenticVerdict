import { PlatformAuthError } from "../errors";
import { META_GRAPH_API_VERSION, META_GRAPH_ORIGIN, mapMetaGraphHttpError } from "./graph-client";

export interface ExchangeMetaLongLivedTokenParams {
  readonly appId: string;
  readonly appSecret: string;
  /** Short- or long-lived user token to exchange (fb_exchange_token). */
  readonly tokenToExchange: string;
  readonly fetchImpl?: typeof fetch;
}

export interface MetaLongLivedTokenResponse {
  readonly accessToken: string;
  readonly expiresInSeconds?: number;
}

interface OAuthTokenJson {
  access_token?: string;
  expires_in?: number;
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/**
 * Exchanges a short-lived user token for a long-lived token (typically ~60 days).
 * @see https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived
 */
export async function exchangeMetaLongLivedToken(
  params: ExchangeMetaLongLivedTokenParams,
): Promise<MetaLongLivedTokenResponse> {
  const fetchFn = params.fetchImpl ?? fetch;
  const url = new URL(`${META_GRAPH_ORIGIN}/${META_GRAPH_API_VERSION}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", params.appId);
  url.searchParams.set("client_secret", params.appSecret);
  url.searchParams.set("fb_exchange_token", params.tokenToExchange);

  const res = await fetchFn(url.toString());
  const body = await readJson(res);
  if (!res.ok) {
    throw mapMetaGraphHttpError(res.status, body);
  }

  if (body === null || typeof body !== "object") {
    throw new PlatformAuthError("meta", "Token exchange response was empty or not a JSON object");
  }

  const json = body as OAuthTokenJson;
  const accessToken = json.access_token;
  if (typeof accessToken !== "string" || accessToken.length === 0) {
    throw new PlatformAuthError("meta", "Token exchange response missing access_token");
  }
  return {
    accessToken,
    expiresInSeconds: typeof json.expires_in === "number" ? json.expires_in : undefined,
  };
}

/**
 * Lightweight token validation (Marketing API read scope implied by successful ad account reads).
 */
export async function validateMetaAccessToken(
  accessToken: string,
  fetchImpl?: typeof fetch,
): Promise<void> {
  const fetchFn = fetchImpl ?? fetch;
  const url = new URL(`${META_GRAPH_ORIGIN}/${META_GRAPH_API_VERSION}/me`);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("fields", "id");

  const res = await fetchFn(url.toString());
  const body = await readJson(res);
  if (!res.ok) {
    throw mapMetaGraphHttpError(res.status, body);
  }
}
