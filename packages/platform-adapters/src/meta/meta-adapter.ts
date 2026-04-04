import type { PlatformType } from "@agenticverdict/types";

import { BasePlatformAdapter, type BasePlatformAdapterOptions } from "../adapter";
import type { PlatformCredentials } from "../credentials";
import type { DateRangeIso } from "../date-range";
import { PlatformAuthError } from "../errors";
import type { NormalizedPlatformSnapshot } from "../normalization";
import { createPlatformTokenBucket } from "../platform-rate-config";
import type { TokenBucket } from "../token-bucket";
import { metaGraphGetAllPages, type MetaGraphRequestOptions } from "./graph-client";
import type {
  MetaAd,
  MetaAdSet,
  MetaCampaign,
  MetaInsightRow,
  MetaRawMetricsPayload,
} from "./models";
import { exchangeMetaLongLivedToken, validateMetaAccessToken } from "./oauth";
import { normalizeMetaRawMetrics } from "./transformers";

/** `PlatformCredentials` keys consumed by {@link MetaPlatformAdapter}. */
export const metaCredentialKeys = {
  accessToken: "accessToken",
  adAccountId: "adAccountId",
  appId: "appId",
  appSecret: "appSecret",
  /** Alias for OAuth exchange input (`fb_exchange_token`). */
  refreshToken: "refreshToken",
  tokenToExchange: "tokenToExchange",
} as const;

const CAMPAIGN_FIELDS = "id,name,status,objective,daily_budget,lifetime_budget,account_id";
const ADSET_FIELDS = "id,name,status,campaign_id,daily_budget,lifetime_budget";
const AD_FIELDS = "id,name,status,adset_id,campaign_id";
const INSIGHT_FIELDS =
  "campaign_id,campaign_name,impressions,clicks,spend,ctr,cpc,reach,actions,date_start,date_stop";

export function normalizeMetaAdAccountId(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("act_")) {
    return t;
  }
  if (/^\d+$/.test(t)) {
    return `act_${t}`;
  }
  return t;
}

export interface MetaPlatformAdapterOptions extends BasePlatformAdapterOptions {
  /** Injected fetch (tests); defaults to global `fetch`. */
  fetchImpl?: typeof fetch;
  /**
   * Per Graph HTTP request limiter. Defaults to {@link createPlatformTokenBucket}("meta") (~200/hour).
   * The base adapter's `tokenBucket` is forced off so each Graph call is metered here.
   */
  requestTokenBucket?: TokenBucket | null;
}

/**
 * Meta Marketing API adapter: campaigns, ad sets, ads, and campaign-level insights with cursor pagination.
 */
export class MetaPlatformAdapter extends BasePlatformAdapter {
  readonly platform: PlatformType = "meta";

  private accessToken: string | null = null;
  private adAccountId: string | null = null;
  private readonly fetchImpl: typeof fetch;
  private readonly perRequestBucket: TokenBucket | null;

  constructor(options: MetaPlatformAdapterOptions) {
    const { fetchImpl, requestTokenBucket, ...baseRest } = options;
    super("meta", { ...baseRest, tokenBucket: null });
    this.fetchImpl = fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.perRequestBucket =
      requestTokenBucket !== undefined ? requestTokenBucket : createPlatformTokenBucket("meta");
  }

  private graphOptions(): MetaGraphRequestOptions {
    if (!this.accessToken) {
      throw new PlatformAuthError("meta", "authenticate() must be called first");
    }
    return {
      accessToken: this.accessToken,
      fetchImpl: this.fetchImpl,
      beforeRequest: async () => {
        if (this.perRequestBucket) {
          await this.perRequestBucket.consume();
        }
      },
    };
  }

  protected async doAuthenticate(credentials: PlatformCredentials): Promise<void> {
    const rawAd = credentials[metaCredentialKeys.adAccountId];
    if (typeof rawAd !== "string" || rawAd.trim().length === 0) {
      throw new PlatformAuthError("meta", "adAccountId is required in credentials");
    }

    const appId =
      typeof credentials[metaCredentialKeys.appId] === "string"
        ? credentials[metaCredentialKeys.appId].trim()
        : "";
    const appSecret =
      typeof credentials[metaCredentialKeys.appSecret] === "string"
        ? credentials[metaCredentialKeys.appSecret].trim()
        : "";
    const exchangeInput =
      (typeof credentials[metaCredentialKeys.tokenToExchange] === "string"
        ? credentials[metaCredentialKeys.tokenToExchange].trim()
        : "") ||
      (typeof credentials[metaCredentialKeys.refreshToken] === "string"
        ? credentials[metaCredentialKeys.refreshToken].trim()
        : "");

    let accessToken =
      typeof credentials[metaCredentialKeys.accessToken] === "string"
        ? credentials[metaCredentialKeys.accessToken].trim()
        : "";

    if (appId.length > 0 && appSecret.length > 0 && exchangeInput.length > 0) {
      const exchanged = await exchangeMetaLongLivedToken({
        appId,
        appSecret,
        tokenToExchange: exchangeInput,
        fetchImpl: this.fetchImpl,
      });
      accessToken = exchanged.accessToken;
    }

    if (accessToken.length === 0) {
      throw new PlatformAuthError(
        "meta",
        "accessToken is required unless appId, appSecret, and refreshToken (or tokenToExchange) are provided for exchange",
      );
    }

    await validateMetaAccessToken(accessToken, this.fetchImpl);
    this.accessToken = accessToken;
    this.adAccountId = normalizeMetaAdAccountId(rawAd.trim());
  }

  protected async fetchRawMetrics(dateRange: DateRangeIso): Promise<MetaRawMetricsPayload> {
    const opts = this.graphOptions();
    const act = this.adAccountId;
    if (!act) {
      throw new PlatformAuthError("meta", "authenticate() must be called first");
    }

    const timeRange = JSON.stringify({
      since: dateRange.startInclusive,
      until: dateRange.endInclusive,
    });

    const campaigns = await metaGraphGetAllPages<MetaCampaign>(
      `${act}/campaigns`,
      { fields: CAMPAIGN_FIELDS, limit: "500" },
      opts,
    );
    const adSets = await metaGraphGetAllPages<MetaAdSet>(
      `${act}/adsets`,
      { fields: ADSET_FIELDS, limit: "500" },
      opts,
    );
    const ads = await metaGraphGetAllPages<MetaAd>(
      `${act}/ads`,
      { fields: AD_FIELDS, limit: "500" },
      opts,
    );
    const insights = await metaGraphGetAllPages<MetaInsightRow>(
      `${act}/insights`,
      {
        fields: INSIGHT_FIELDS,
        level: "campaign",
        time_range: timeRange,
        limit: "500",
      },
      opts,
    );

    return {
      adAccountId: act,
      campaigns,
      adSets,
      ads,
      insights,
      fetchedAt: new Date().toISOString(),
    };
  }

  normalizeData(rawData: unknown, dateRange: DateRangeIso): NormalizedPlatformSnapshot {
    return normalizeMetaRawMetrics(rawData, dateRange);
  }
}
