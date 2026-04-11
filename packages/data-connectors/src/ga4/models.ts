/**
 * Minimal GA4 Data API shapes used by the adapter (REST JSON).
 * @see https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/RunReportResponse
 */

import type { DateRangeIso } from "../date-range";

export interface Ga4DimensionHeader {
  readonly name?: string;
}

export interface Ga4MetricHeader {
  readonly name?: string;
  readonly type?: string;
}

export interface Ga4DimensionValue {
  readonly value?: string;
}

export interface Ga4MetricValue {
  readonly value?: string;
  readonly oneValue?: string;
}

export interface Ga4ReportRow {
  readonly dimensionValues?: readonly Ga4DimensionValue[];
  readonly metricValues?: readonly Ga4MetricValue[];
}

export interface Ga4SamplingMetadata {
  readonly samplesReadCount?: string;
  readonly samplingSpaceSize?: string;
}

export interface Ga4ResponseMetadata {
  readonly samplingMetadatas?: readonly Ga4SamplingMetadata[];
  readonly dataLossFromOtherReason?: boolean;
  readonly currencyCode?: string;
  readonly timeZone?: string;
}

export interface Ga4RunReportResponse {
  readonly dimensionHeaders?: readonly Ga4DimensionHeader[];
  readonly metricHeaders?: readonly Ga4MetricHeader[];
  readonly rows?: readonly Ga4ReportRow[];
  readonly rowCount?: number;
  readonly metadata?: Ga4ResponseMetadata;
  readonly kind?: string;
}

export interface Ga4ErrorBody {
  readonly error?: {
    readonly code?: number;
    readonly message?: string;
    readonly status?: string;
    readonly details?: unknown;
  };
}

export interface Ga4RawMetricsPayload {
  readonly propertyId: string;
  readonly fetchedAt: string;
  readonly requestedRange: DateRangeIso;
  /** One merged report: date × eventName × eventCount */
  readonly eventReport: Ga4RunReportResponse;
  /** One merged report: date × sessions, users, revenue-style metrics */
  readonly trafficReport: Ga4RunReportResponse;
  readonly realtimeReport: Ga4RunReportResponse | null;
  /** Raw funnel API JSON, or null when unavailable */
  readonly funnelReport: unknown;
  readonly funnelError?: string;
  readonly sampling: Ga4SamplingSummary;
  /** Total outbound Data API calls for this fetch (after date-range splitting) */
  readonly dataApiCalls: number;
}

export interface Ga4SamplingSummary {
  readonly sampled: boolean;
  readonly sources: readonly string[];
}
