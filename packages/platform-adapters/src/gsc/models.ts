import type { DateRangeIso } from "../date-range";

export interface GscSearchAnalyticsRow {
  readonly keys?: readonly string[];
  readonly clicks?: number;
  readonly impressions?: number;
  readonly ctr?: number;
  readonly position?: number;
}

export interface GscSearchAnalyticsResponse {
  readonly responseAggregationType?: string;
  readonly rows?: readonly GscSearchAnalyticsRow[];
}

export interface GscSitemapEntry {
  readonly path?: string;
  readonly lastSubmitted?: string;
  readonly isPending?: boolean;
  readonly isSitemapsIndex?: boolean;
  readonly type?: string;
  readonly contents?: readonly { type?: string; submitted?: string; indexed?: string }[];
}

export interface GscSitemapsListResponse {
  readonly sitemap?: readonly GscSitemapEntry[];
}

/** Response shape from `urlInspection.index:inspect`. */
export interface GscUrlInspectionResponse {
  readonly inspectionResult?: {
    readonly indexStatusResult?: {
      readonly verdict?: string;
      readonly coverageState?: string;
      readonly robotsTxtState?: string;
      readonly indexingState?: string;
      readonly lastCrawlTime?: string;
      readonly pageFetchState?: string;
    };
    readonly mobileUsabilityResult?: {
      readonly verdict?: string;
      readonly issues?: readonly { issueType?: string; severity?: string }[];
    };
    readonly richResultsResult?: { verdict?: string };
  };
}

export interface GscRawMetricsPayload {
  readonly siteUrl: string;
  readonly fetchedAt: string;
  readonly requestedRange: DateRangeIso;
  readonly searchAnalytics: readonly GscSearchAnalyticsResponse[];
  readonly sitemaps: GscSitemapsListResponse | null;
  readonly urlInspection: GscUrlInspectionResponse | null;
  readonly dateRangeRejected?: string;
}
