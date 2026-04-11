import type { ConnectorType } from "@agenticverdict/types";

import { BaseConnectorAdapter, type BaseConnectorAdapterOptions } from "../adapter";
import type { ConnectorCredentials } from "../credentials";
import type { DateRangeIso } from "../date-range";
import { PlatformAuthError } from "../errors";
import {
  refreshGoogleAccessTokenForConnector,
  validateGoogleAccessTokenForConnector,
} from "../google/oauth";
import type { NormalizedConnectorSnapshot } from "../normalization";
import { createConnectorTokenBucket } from "../platform-rate-config";
import type { TokenBucket } from "../token-bucket";
import {
  encodeGscSiteUrl,
  gscUrlInspectionPost,
  gscWebmastersGet,
  gscWebmastersPost,
  type GscRequestOptions,
} from "./api-client";
import { assertGscSearchAnalyticsDateRange } from "./date-range-guard";
import type {
  GscRawMetricsPayload,
  GscSearchAnalyticsResponse,
  GscSitemapsListResponse,
} from "./models";
import { normalizeGscRawMetrics } from "./transformers";

export const gscCredentialKeys = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  clientId: "clientId",
  clientSecret: "clientSecret",
  siteUrl: "siteUrl",
  inspectionUrl: "inspectionUrl",
} as const;

export interface GscConnectorAdapterOptions extends BaseConnectorAdapterOptions {
  fetchImpl?: typeof fetch;
  /** Defaults to {@link createConnectorTokenBucket}("gsc") (~5 QPS). */
  requestTokenBucket?: TokenBucket | null;
  /** Cap per searchAnalytics request (max 25_000). */
  searchAnalyticsRowLimit?: number;
}

const MAX_SEARCH_ANALYTICS_ROW_LIMIT = 25_000;

export class GscConnectorAdapter extends BaseConnectorAdapter {
  readonly connector: ConnectorType = "gsc";

  private accessToken: string | null = null;
  private siteUrl: string | null = null;
  private inspectionUrl: string | null = null;
  private readonly fetchImpl: typeof fetch;
  private readonly perRequestBucket: TokenBucket | null;
  private readonly searchAnalyticsRowLimit: number;

  constructor(options: GscConnectorAdapterOptions) {
    const { fetchImpl, requestTokenBucket, searchAnalyticsRowLimit, ...baseRest } = options;
    super("gsc", { ...baseRest, tokenBucket: null });
    this.fetchImpl = fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.perRequestBucket =
      requestTokenBucket !== undefined ? requestTokenBucket : createConnectorTokenBucket("gsc");
    const cap =
      typeof searchAnalyticsRowLimit === "number" && searchAnalyticsRowLimit > 0
        ? Math.min(searchAnalyticsRowLimit, MAX_SEARCH_ANALYTICS_ROW_LIMIT)
        : MAX_SEARCH_ANALYTICS_ROW_LIMIT;
    this.searchAnalyticsRowLimit = cap;
  }

  private gscOpts(): GscRequestOptions {
    if (!this.accessToken) {
      throw new PlatformAuthError("gsc", "authenticate() must be called first");
    }
    return {
      accessToken: this.accessToken,
      fetchImpl: this.fetchImpl,
      connector: "gsc",
      beforeRequest: async () => {
        if (this.perRequestBucket) {
          await this.perRequestBucket.consume();
        }
      },
    };
  }

  protected async doAuthenticate(credentials: ConnectorCredentials): Promise<void> {
    const rawSite = credentials[gscCredentialKeys.siteUrl];
    if (typeof rawSite !== "string" || rawSite.trim().length === 0) {
      throw new PlatformAuthError("gsc", "siteUrl is required in credentials");
    }
    this.siteUrl = rawSite.trim();

    const rawInspect = credentials[gscCredentialKeys.inspectionUrl];
    this.inspectionUrl =
      typeof rawInspect === "string" && rawInspect.trim().length > 0 ? rawInspect.trim() : null;

    const clientId =
      typeof credentials[gscCredentialKeys.clientId] === "string"
        ? credentials[gscCredentialKeys.clientId].trim()
        : "";
    const clientSecret =
      typeof credentials[gscCredentialKeys.clientSecret] === "string"
        ? credentials[gscCredentialKeys.clientSecret].trim()
        : "";
    const refreshToken =
      typeof credentials[gscCredentialKeys.refreshToken] === "string"
        ? credentials[gscCredentialKeys.refreshToken].trim()
        : "";

    let accessToken =
      typeof credentials[gscCredentialKeys.accessToken] === "string"
        ? credentials[gscCredentialKeys.accessToken].trim()
        : "";

    if (clientId.length > 0 && clientSecret.length > 0 && refreshToken.length > 0) {
      const refreshed = await refreshGoogleAccessTokenForConnector({
        connector: "gsc",
        clientId,
        clientSecret,
        refreshToken,
        fetchImpl: this.fetchImpl,
      });
      accessToken = refreshed.accessToken;
    }

    if (accessToken.length === 0) {
      throw new PlatformAuthError(
        "gsc",
        "accessToken is required unless clientId, clientSecret, and refreshToken are provided",
      );
    }

    await validateGoogleAccessTokenForConnector("gsc", accessToken, this.fetchImpl);
    this.accessToken = accessToken;
  }

  protected async fetchRawMetrics(dateRange: DateRangeIso): Promise<GscRawMetricsPayload> {
    assertGscSearchAnalyticsDateRange(dateRange);
    const site = this.siteUrl;
    if (!site) {
      throw new PlatformAuthError("gsc", "authenticate() must be called first");
    }

    const enc = encodeGscSiteUrl(site);
    const opts = this.gscOpts();

    const searchAnalytics: GscSearchAnalyticsResponse[] = [];
    let startRow = 0;
    while (true) {
      const page = await gscWebmastersPost<GscSearchAnalyticsResponse>(
        `/sites/${enc}/searchAnalytics/query`,
        {
          startDate: dateRange.startInclusive,
          endDate: dateRange.endInclusive,
          dimensions: ["query", "page", "device", "country"],
          rowLimit: this.searchAnalyticsRowLimit,
          startRow,
          aggregationType: "auto",
        },
        opts,
      );
      searchAnalytics.push(page);
      const n = page.rows?.length ?? 0;
      if (n < this.searchAnalyticsRowLimit) {
        break;
      }
      startRow += this.searchAnalyticsRowLimit;
    }

    const sitemaps = await gscWebmastersGet<GscSitemapsListResponse>(
      `/sites/${enc}/sitemaps`,
      opts,
    );

    let urlInspection: GscRawMetricsPayload["urlInspection"] = null;
    if (this.inspectionUrl) {
      urlInspection = await gscUrlInspectionPost(
        { inspectionUrl: this.inspectionUrl, siteUrl: site },
        opts,
      );
    }

    return {
      siteUrl: site,
      fetchedAt: new Date().toISOString(),
      requestedRange: dateRange,
      searchAnalytics,
      sitemaps,
      urlInspection,
    };
  }

  normalizeData(rawData: unknown, dateRange: DateRangeIso): NormalizedConnectorSnapshot {
    return normalizeGscRawMetrics(rawData, dateRange);
  }
}
