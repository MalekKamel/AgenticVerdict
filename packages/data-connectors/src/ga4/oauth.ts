import {
  refreshGoogleAccessTokenForConnector,
  validateGoogleAccessTokenForConnector,
  type RefreshGoogleAccessTokenResult,
  type ValidateGoogleAccessTokenResult,
} from "../google/oauth";

export type { RefreshGoogleAccessTokenResult, ValidateGoogleAccessTokenResult };

export interface RefreshGoogleAccessTokenInput {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly refreshToken: string;
  readonly fetchImpl?: typeof fetch;
}

/**
 * Validates a Google OAuth access token (AC-1.2.1 evidence path for GA4 bearer tokens).
 */
export async function validateGoogleAccessToken(
  accessToken: string,
  fetchImpl?: typeof fetch,
): Promise<ValidateGoogleAccessTokenResult> {
  return validateGoogleAccessTokenForConnector("ga4", accessToken, fetchImpl);
}

/**
 * Exchanges a refresh token for a new access token (server-side OAuth).
 */
export async function refreshGoogleAccessToken(
  input: RefreshGoogleAccessTokenInput,
): Promise<RefreshGoogleAccessTokenResult> {
  return refreshGoogleAccessTokenForConnector({ ...input, connector: "ga4" });
}
