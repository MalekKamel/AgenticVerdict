import { PlatformAuthError, PlatformError, PlatformRateLimitError } from "../errors";
import type { Ga4ErrorBody, Ga4RunReportResponse } from "./models";
import { mergeSamplingFlags } from "./sampling";

export const GA4_DATA_API_ORIGIN = "https://analyticsdata.googleapis.com";

export interface Ga4DataRequestOptions {
  readonly accessToken: string;
  readonly fetchImpl?: typeof fetch;
  readonly beforeRequest?: () => void | Promise<void>;
}

function extractGoogleError(body: unknown): Ga4ErrorBody["error"] | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  return (body as Ga4ErrorBody).error ?? null;
}

export function mapGa4DataApiHttpError(status: number, body: unknown): Error {
  const ge = extractGoogleError(body);
  const message = ge?.message ?? `Google Analytics Data API responded with HTTP ${status}`;

  if (status === 401 || status === 403) {
    return new PlatformAuthError("ga4", message, { cause: body });
  }
  if (status === 429 || /RESOURCE_EXHAUSTED|RATE_LIMIT/i.test(message) || /quota/i.test(message)) {
    return new PlatformRateLimitError("ga4", message, { cause: body });
  }
  if (status === 404) {
    return new PlatformError("ga4", "not_found", message, { cause: body });
  }
  if (status >= 400 && status < 500) {
    return new PlatformError("ga4", "invalid_request", message, { cause: body });
  }
  return new PlatformError("ga4", "upstream_error", message, { cause: body });
}

async function readJsonBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (text.length === 0) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { _parseFailure: text.slice(0, 500) };
  }
}

export async function ga4DataApiPost<T = unknown>(
  path: string,
  jsonBody: unknown,
  options: Ga4DataRequestOptions,
): Promise<T> {
  if (options.beforeRequest) {
    await options.beforeRequest();
  }
  const fetchFn = options.fetchImpl ?? fetch;
  const url = `${GA4_DATA_API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetchFn(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jsonBody),
  });
  const body = await readJsonBody(res);
  if (!res.ok) {
    throw mapGa4DataApiHttpError(res.status, body);
  }
  return body as T;
}

export function normalizeGa4PropertyResourceId(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("properties/")) {
    return t.slice("properties/".length).split("/")[0] ?? t;
  }
  return t;
}

function dimension(name: string): { name: string } {
  return { name };
}

function metric(name: string): { name: string } {
  return { name };
}

export interface RunGa4CoreReportsInput {
  readonly propertyResourceId: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly options: Ga4DataRequestOptions;
}

/**
 * Event-level report (AC-1.2.2) and aggregate traffic metrics (AC-1.2.3) for one date span.
 */
export async function runGa4CoreReportsForRange(
  input: RunGa4CoreReportsInput,
): Promise<{ eventReport: Ga4RunReportResponse; trafficReport: Ga4RunReportResponse }> {
  const pid = input.propertyResourceId;
  const dateRanges = [{ startDate: input.startDate, endDate: input.endDate }];

  const eventReport = await ga4DataApiPost<Ga4RunReportResponse>(
    `/v1beta/properties/${encodeURIComponent(pid)}:runReport`,
    {
      dateRanges,
      dimensions: [dimension("date"), dimension("eventName")],
      metrics: [metric("eventCount")],
      limit: "100000",
    },
    input.options,
  );

  const trafficReport = await ga4DataApiPost<Ga4RunReportResponse>(
    `/v1beta/properties/${encodeURIComponent(pid)}:runReport`,
    {
      dateRanges,
      dimensions: [dimension("date")],
      metrics: [metric("sessions"), metric("totalUsers"), metric("newUsers")],
      limit: "100000",
    },
    input.options,
  );

  return { eventReport, trafficReport };
}

export interface RunGa4RealtimeReportInput {
  readonly propertyResourceId: string;
  readonly options: Ga4DataRequestOptions;
}

/** Realtime report slice (Task 2.2 / AC evidence). */
export async function runGa4RealtimeReport(
  input: RunGa4RealtimeReportInput,
): Promise<Ga4RunReportResponse> {
  const pid = input.propertyResourceId;
  return ga4DataApiPost<Ga4RunReportResponse>(
    `/v1beta/properties/${encodeURIComponent(pid)}:runRealtimeReport`,
    {
      dimensions: [dimension("unifiedScreenName")],
      metrics: [metric("activeUsers"), metric("screenPageViews")],
      limit: "100",
    },
    input.options,
  );
}

export interface RunGa4FunnelReportInput {
  readonly propertyResourceId: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly options: Ga4DataRequestOptions;
}

/**
 * Funnel exploration via Data API v1alpha. Returns `null` if the funnel call fails (optional capability).
 */
export async function runGa4FunnelReportSafe(
  input: RunGa4FunnelReportInput,
): Promise<{ report: unknown } | { error: string }> {
  const pid = input.propertyResourceId;
  const body = {
    dateRange: { startDate: input.startDate, endDate: input.endDate },
    funnel: {
      steps: [
        {
          name: "session_start",
          filterExpression: {
            funnelEventFilter: { eventName: "session_start" },
          },
        },
        {
          name: "page_view",
          filterExpression: {
            funnelEventFilter: { eventName: "page_view" },
          },
        },
      ],
    },
    funnelVisualizationType: "FUNNEL_VISUALIZATION_TYPE_STANDARD",
  };

  try {
    const report = await ga4DataApiPost<unknown>(
      `/v1alpha/properties/${encodeURIComponent(pid)}:runFunnelReport`,
      body,
      input.options,
    );
    return { report };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg };
  }
}

export function mergeGa4RunReports(reports: readonly Ga4RunReportResponse[]): Ga4RunReportResponse {
  if (reports.length === 0) {
    return {};
  }
  const first = reports[0]!;
  if (reports.length === 1) {
    return first;
  }
  const rows = reports.flatMap((r) => [...(r.rows ?? [])]);
  const sampled = mergeSamplingFlags(reports);
  return {
    dimensionHeaders: first.dimensionHeaders,
    metricHeaders: first.metricHeaders,
    rows,
    rowCount: rows.length,
    metadata: sampled
      ? {
          ...first.metadata,
          dataLossFromOtherReason: first.metadata?.dataLossFromOtherReason === true || sampled,
        }
      : first.metadata,
    kind: first.kind,
  };
}
