import type { PlatformType } from "@agenticverdict/types";

import { BasePlatformAdapter, type BasePlatformAdapterOptions } from "../adapter";
import type { PlatformCredentials } from "../credentials";
import type { DateRangeIso } from "../date-range";
import { PlatformAuthError } from "../errors";
import { splitInclusiveDateRange } from "../ga4/date-range-split";
import type { NormalizedPlatformSnapshot } from "../normalization";
import { createPlatformTokenBucket } from "../platform-rate-config";
import type { TokenBucket } from "../token-bucket";
import {
  tiktokFetchAllListPages,
  tiktokFetchIntegratedCampaignReport,
  tiktokMarketingGet,
  type TikTokApiRequestOptions,
} from "./api-client";
import type {
  TikTokAd,
  TikTokAdGroup,
  TikTokCampaign,
  TikTokIntegratedCampaignRow,
  TikTokListData,
} from "./models";
import { tiktokOauth2AccessToken, validateTikTokAccessToken } from "./oauth";
import { normalizeTikTokRawMetrics } from "./transformers";

/** `PlatformCredentials` keys consumed by {@link TikTokPlatformAdapter}. */
export const tiktokCredentialKeys = {
  accessToken: "accessToken",
  advertiserId: "advertiserId",
  appId: "appId",
  appSecret: "appSecret",
  /** OAuth refresh_token grant (or use {@link tiktokCredentialKeys.authCode}). */
  refreshToken: "refreshToken",
  /** One-time authorization code exchange (`grant_type=authorization_code`). */
  authCode: "authCode",
  /** When `"true"`, use `sandbox-ads.tiktok.com` hosts. */
  sandbox: "sandbox",
} as const;

const TIKTOK_REPORT_MAX_INCLUSIVE_DAYS = 30;

function parseSandboxFlag(credentials: PlatformCredentials): boolean {
  const raw = credentials[tiktokCredentialKeys.sandbox];
  return typeof raw === "string" && raw.trim().toLowerCase() === "true";
}

export interface TikTokPlatformAdapterOptions extends BasePlatformAdapterOptions {
  fetchImpl?: typeof fetch;
  /**
   * Per-HTTP-call limiter. Defaults to {@link createPlatformTokenBucket}("tiktok").
   * The base adapter's `tokenBucket` is forced off so each Marketing API call is metered here.
   */
  requestTokenBucket?: TokenBucket | null;
}

/**
 * TikTok Marketing API adapter: campaigns, ad groups, ads, and campaign-level integrated reports with pagination.
 */
export class TikTokPlatformAdapter extends BasePlatformAdapter {
  readonly platform: PlatformType = "tiktok";

  private accessToken: string | null = null;
  private advertiserId: string | null = null;
  private sandbox = false;
  private readonly fetchImpl: typeof fetch;
  private readonly perRequestBucket: TokenBucket | null;

  constructor(options: TikTokPlatformAdapterOptions) {
    const { fetchImpl, requestTokenBucket, ...baseRest } = options;
    super("tiktok", { ...baseRest, tokenBucket: null });
    this.fetchImpl = fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.perRequestBucket =
      requestTokenBucket !== undefined ? requestTokenBucket : createPlatformTokenBucket("tiktok");
  }

  private apiOptions(): TikTokApiRequestOptions {
    if (!this.accessToken) {
      throw new PlatformAuthError("tiktok", "authenticate() must be called first");
    }
    return {
      accessToken: this.accessToken,
      fetchImpl: this.fetchImpl,
      sandbox: this.sandbox,
      beforeRequest: async () => {
        if (this.perRequestBucket) {
          await this.perRequestBucket.consume();
        }
      },
    };
  }

  protected async doAuthenticate(credentials: PlatformCredentials): Promise<void> {
    this.sandbox = parseSandboxFlag(credentials);

    const rawAdv = credentials[tiktokCredentialKeys.advertiserId];
    if (typeof rawAdv !== "string" || rawAdv.trim().length === 0) {
      throw new PlatformAuthError("tiktok", "advertiserId is required in credentials");
    }

    const appId =
      typeof credentials[tiktokCredentialKeys.appId] === "string"
        ? credentials[tiktokCredentialKeys.appId].trim()
        : "";
    const secret =
      typeof credentials[tiktokCredentialKeys.appSecret] === "string"
        ? credentials[tiktokCredentialKeys.appSecret].trim()
        : "";
    const refreshToken =
      typeof credentials[tiktokCredentialKeys.refreshToken] === "string"
        ? credentials[tiktokCredentialKeys.refreshToken].trim()
        : "";
    const authCode =
      typeof credentials[tiktokCredentialKeys.authCode] === "string"
        ? credentials[tiktokCredentialKeys.authCode].trim()
        : "";

    let accessToken =
      typeof credentials[tiktokCredentialKeys.accessToken] === "string"
        ? credentials[tiktokCredentialKeys.accessToken].trim()
        : "";

    if (appId.length > 0 && secret.length > 0) {
      if (refreshToken.length > 0) {
        const exchanged = await tiktokOauth2AccessToken({
          appId,
          secret,
          grantType: "refresh_token",
          refreshToken,
          fetchImpl: this.fetchImpl,
          sandbox: this.sandbox,
        });
        accessToken = exchanged.accessToken;
      } else if (authCode.length > 0) {
        const exchanged = await tiktokOauth2AccessToken({
          appId,
          secret,
          grantType: "authorization_code",
          authCode,
          fetchImpl: this.fetchImpl,
          sandbox: this.sandbox,
        });
        accessToken = exchanged.accessToken;
      }
    }

    if (accessToken.length === 0) {
      throw new PlatformAuthError(
        "tiktok",
        "accessToken is required unless appId, appSecret, and refreshToken or authCode are provided",
      );
    }

    await validateTikTokAccessToken(accessToken, this.fetchImpl, this.sandbox);

    const advTrim = rawAdv.trim();
    await tiktokMarketingGet<TikTokListData<unknown>>(
      "advertiser/info/",
      { advertiser_ids: JSON.stringify([advTrim]) },
      {
        accessToken,
        fetchImpl: this.fetchImpl,
        sandbox: this.sandbox,
      },
    );

    this.accessToken = accessToken;
    this.advertiserId = advTrim;
  }

  protected async fetchRawMetrics(dateRange: DateRangeIso): Promise<unknown> {
    const opts = this.apiOptions();
    const adv = this.advertiserId;
    if (!adv) {
      throw new PlatformAuthError("tiktok", "authenticate() must be called first");
    }

    const [campaigns, adGroups, ads] = await Promise.all([
      tiktokFetchAllListPages<TikTokCampaign>("campaign/get/", adv, opts),
      tiktokFetchAllListPages<TikTokAdGroup>("adgroup/get/", adv, opts),
      tiktokFetchAllListPages<TikTokAd>("ad/get/", adv, opts),
    ]);

    const windows = splitInclusiveDateRange(dateRange, TIKTOK_REPORT_MAX_INCLUSIVE_DAYS);
    const integratedRows: TikTokIntegratedCampaignRow[] = [];
    for (const w of windows) {
      const chunk = await tiktokFetchIntegratedCampaignReport(
        adv,
        w.startInclusive,
        w.endInclusive,
        opts,
      );
      integratedRows.push(...chunk);
    }

    return {
      advertiserId: adv,
      campaigns,
      adGroups,
      ads,
      integratedRows,
      fetchedAt: new Date().toISOString(),
    };
  }

  normalizeData(rawData: unknown, dateRange: DateRangeIso): NormalizedPlatformSnapshot {
    return normalizeTikTokRawMetrics(rawData, dateRange);
  }
}
