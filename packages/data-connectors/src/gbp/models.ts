import type { DateRangeIso } from "../date-range";

export interface GbpAccount {
  readonly name?: string;
  readonly accountName?: string;
}

export interface GbpListAccountsResponse {
  readonly accounts?: readonly GbpAccount[];
  readonly nextPageToken?: string;
}

export interface GbpLocation {
  readonly name?: string;
  readonly title?: string;
  readonly websiteUri?: string;
}

export interface GbpListLocationsResponse {
  readonly locations?: readonly GbpLocation[];
  readonly nextPageToken?: string;
}

export interface GbpReview {
  readonly starRating?: string;
  readonly comment?: string;
  readonly createTime?: string;
  readonly reviewId?: string;
}

export interface GbpListReviewsResponse {
  readonly reviews?: readonly GbpReview[];
  readonly averageRating?: number;
  readonly totalReviewCount?: number;
  readonly nextPageToken?: string;
}

export interface GbpDailyMetricTimeSeries {
  readonly dailyMetric?: string;
  readonly timeSeries?: {
    readonly datedValues?: readonly {
      date?: { year?: number; month?: number; day?: number };
      value?: string;
    }[];
  };
}

export interface GbpPerformanceResponse {
  readonly multiDailyMetricTimeSeries?: readonly GbpDailyMetricTimeSeries[];
}

export interface GbpLocationBundle {
  readonly accountName: string;
  readonly location: GbpLocation;
  readonly reviews: GbpListReviewsResponse | null;
  readonly performance: GbpPerformanceResponse | null;
  readonly performanceError?: string;
}

export interface GbpRawMetricsPayload {
  readonly fetchedAt: string;
  readonly requestedRange: DateRangeIso;
  readonly accounts: readonly GbpAccount[];
  readonly locations: readonly GbpLocationBundle[];
}
