import type { ConnectorType } from "@agenticverdict/types";

import { BaseConnectorAdapter, type BaseConnectorAdapterOptions } from "../adapter";
import type { ConnectorCredentials } from "../credentials";
import type { DateRangeIso } from "../date-range";
import { PlatformAuthError } from "../errors";
import type { NormalizedConnectorSnapshot } from "../normalization";
import { createConnectorTokenBucket } from "../platform-rate-config";
import type { TokenBucket } from "../token-bucket";
import {
  mergeGa4RunReports,
  normalizeGa4PropertyResourceId,
  runGa4CoreReportsForRange,
  runGa4FunnelReportSafe,
  runGa4RealtimeReport,
  type Ga4DataRequestOptions,
} from "./data-client";
import { splitInclusiveDateRange, trailingInclusiveWindow } from "./date-range-split";
import { Ga4DailyQuotaTracker, type Ga4DailyQuotaTrackerOptions } from "./daily-quota";
import type { Ga4RawMetricsPayload, Ga4RunReportResponse } from "./models";
import { refreshGoogleAccessToken, validateGoogleAccessToken } from "./oauth";
import { isRunReportSampled } from "./sampling";
import { normalizeGa4RawMetrics } from "./transformers";

export const ga4CredentialKeys = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  clientId: "clientId",
  clientSecret: "clientSecret",
  propertyId: "propertyId",
} as const;

const GA4_MAX_INCLUSIVE_DAYS_PER_REQUEST = 365;

export interface Ga4ConnectorAdapterOptions extends BaseConnectorAdapterOptions {
  fetchImpl?: typeof fetch;
  /** Defaults to {@link createConnectorTokenBucket}("ga4"). */
  requestTokenBucket?: TokenBucket | null;
  /** In-process daily Data API call budget (default 50_000 UTC day). */
  dailyQuota?: Ga4DailyQuotaTracker;
  dailyQuotaOptions?: Ga4DailyQuotaTrackerOptions;
}

/**
 * Google Analytics 4 Data API adapter: OAuth bearer validation/refresh, date-range splitting,
 * event and traffic reports, optional realtime + funnel, sampling metadata, and daily quota guard.
 */
export class Ga4ConnectorAdapter extends BaseConnectorAdapter {
  readonly connector: ConnectorType = "ga4";

  private accessToken: string | null = null;
  private propertyResourceId: string | null = null;
  private readonly fetchImpl: typeof fetch;
  private readonly perRequestBucket: TokenBucket | null;
  private readonly dailyQuota: Ga4DailyQuotaTracker;

  constructor(options: Ga4ConnectorAdapterOptions) {
    const { fetchImpl, requestTokenBucket, dailyQuota, dailyQuotaOptions, ...baseRest } = options;
    super("ga4", { ...baseRest, tokenBucket: null });
    this.fetchImpl = fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.perRequestBucket =
      requestTokenBucket !== undefined ? requestTokenBucket : createConnectorTokenBucket("ga4");
    this.dailyQuota = dailyQuota ?? new Ga4DailyQuotaTracker(dailyQuotaOptions);
  }

  private dataOptions(): Ga4DataRequestOptions {
    if (!this.accessToken) {
      throw new PlatformAuthError("ga4", "authenticate() must be called first");
    }
    return {
      accessToken: this.accessToken,
      fetchImpl: this.fetchImpl,
      beforeRequest: async () => {
        if (this.perRequestBucket) {
          await this.perRequestBucket.consume();
        }
        this.dailyQuota.consumeOrThrow();
      },
    };
  }

  protected async doAuthenticate(credentials: ConnectorCredentials): Promise<void> {
    const rawProp = credentials[ga4CredentialKeys.propertyId];
    if (typeof rawProp !== "string" || rawProp.trim().length === 0) {
      throw new PlatformAuthError("ga4", "propertyId is required in credentials");
    }
    this.propertyResourceId = normalizeGa4PropertyResourceId(rawProp.trim());

    const clientId =
      typeof credentials[ga4CredentialKeys.clientId] === "string"
        ? credentials[ga4CredentialKeys.clientId].trim()
        : "";
    const clientSecret =
      typeof credentials[ga4CredentialKeys.clientSecret] === "string"
        ? credentials[ga4CredentialKeys.clientSecret].trim()
        : "";
    const refreshToken =
      typeof credentials[ga4CredentialKeys.refreshToken] === "string"
        ? credentials[ga4CredentialKeys.refreshToken].trim()
        : "";

    let accessToken =
      typeof credentials[ga4CredentialKeys.accessToken] === "string"
        ? credentials[ga4CredentialKeys.accessToken].trim()
        : "";

    if (clientId.length > 0 && clientSecret.length > 0 && refreshToken.length > 0) {
      const refreshed = await refreshGoogleAccessToken({
        clientId,
        clientSecret,
        refreshToken,
        fetchImpl: this.fetchImpl,
      });
      accessToken = refreshed.accessToken;
    }

    if (accessToken.length === 0) {
      throw new PlatformAuthError(
        "ga4",
        "accessToken is required unless clientId, clientSecret, and refreshToken are provided",
      );
    }

    await validateGoogleAccessToken(accessToken, this.fetchImpl);
    this.accessToken = accessToken;
  }

  protected async fetchRawMetrics(dateRange: DateRangeIso): Promise<Ga4RawMetricsPayload> {
    const pid = this.propertyResourceId;
    if (!pid) {
      throw new PlatformAuthError("ga4", "authenticate() must be called first");
    }

    const opts = this.dataOptions();
    const chunks = splitInclusiveDateRange(dateRange, GA4_MAX_INCLUSIVE_DAYS_PER_REQUEST);

    const eventParts: Ga4RunReportResponse[] = [];
    const trafficParts: Ga4RunReportResponse[] = [];
    let calls = 0;

    for (const c of chunks) {
      const pair = await runGa4CoreReportsForRange({
        propertyResourceId: pid,
        startDate: c.startInclusive,
        endDate: c.endInclusive,
        options: opts,
      });
      calls += 2;
      eventParts.push(pair.eventReport);
      trafficParts.push(pair.trafficReport);
    }

    const eventReport = mergeGa4RunReports(eventParts);
    const trafficReport = mergeGa4RunReports(trafficParts);

    const realtimeReport = await runGa4RealtimeReport({ propertyResourceId: pid, options: opts });
    calls += 1;

    const funnelWindow = trailingInclusiveWindow(dateRange, GA4_MAX_INCLUSIVE_DAYS_PER_REQUEST);
    const funnelOutcome = await runGa4FunnelReportSafe({
      propertyResourceId: pid,
      startDate: funnelWindow.startInclusive,
      endDate: funnelWindow.endInclusive,
      options: opts,
    });
    calls += 1;

    let funnelReport: unknown = null;
    let funnelError: string | undefined;
    if ("error" in funnelOutcome) {
      funnelError = funnelOutcome.error;
    } else {
      funnelReport = funnelOutcome.report;
    }

    const samplingSources: string[] = [];
    if (isRunReportSampled(eventReport)) {
      samplingSources.push("eventReport");
    }
    if (isRunReportSampled(trafficReport)) {
      samplingSources.push("trafficReport");
    }
    if (isRunReportSampled(realtimeReport)) {
      samplingSources.push("realtimeReport");
    }

    return {
      propertyId: pid,
      fetchedAt: new Date().toISOString(),
      requestedRange: dateRange,
      eventReport,
      trafficReport,
      realtimeReport,
      funnelReport,
      funnelError,
      sampling: {
        sampled: samplingSources.length > 0,
        sources: samplingSources,
      },
      dataApiCalls: calls,
    };
  }

  normalizeData(rawData: unknown, dateRange: DateRangeIso): NormalizedConnectorSnapshot {
    return normalizeGa4RawMetrics(rawData, dateRange);
  }
}
