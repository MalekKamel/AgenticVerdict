import { PlatformError } from "../errors";
import { mapGoogleJsonApiHttpError, readGoogleApiJsonBody } from "../google/http";
import type {
  GbpAccount,
  GbpListAccountsResponse,
  GbpListLocationsResponse,
  GbpListReviewsResponse,
  GbpLocation,
  GbpPerformanceResponse,
} from "./models";

export const GBP_ACCOUNT_MGMT_ORIGIN = "https://mybusinessaccountmanagement.googleapis.com/v1";
export const GBP_BUSINESS_INFO_ORIGIN = "https://mybusinessbusinessinformation.googleapis.com/v1";
export const GBP_PERFORMANCE_ORIGIN = "https://businessprofileperformance.googleapis.com/v1";
export const GBP_MYBUSINESS_V4_ORIGIN = "https://mybusiness.googleapis.com/v4";

export interface GbpRequestOptions {
  readonly accessToken: string;
  readonly fetchImpl: typeof fetch;
  readonly beforeRequest?: () => void | Promise<void>;
}

async function beforeOpt(opts: GbpRequestOptions): Promise<void> {
  if (opts.beforeRequest) {
    await opts.beforeRequest();
  }
}

export async function gbpGetJson<T>(url: string, options: GbpRequestOptions): Promise<T> {
  await beforeOpt(options);
  const res = await options.fetchImpl(url, {
    headers: { Authorization: `Bearer ${options.accessToken}` },
  });
  const body = await readGoogleApiJsonBody(res);
  if (!res.ok) {
    throw mapGoogleJsonApiHttpError("gbp", res.status, body);
  }
  return body as T;
}

export async function gbpPostJson<T>(
  url: string,
  jsonBody: unknown,
  options: GbpRequestOptions,
): Promise<T> {
  await beforeOpt(options);
  const res = await options.fetchImpl(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jsonBody),
  });
  const body = await readGoogleApiJsonBody(res);
  if (!res.ok) {
    throw mapGoogleJsonApiHttpError("gbp", res.status, body);
  }
  return body as T;
}

export function isoDateToGoogleCalendar(iso: string): { year: number; month: number; day: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) {
    throw new PlatformError("gbp", "invalid_request", `Invalid date (expected YYYY-MM-DD): ${iso}`);
  }
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

export function locationIdFromResourceName(locationName: string): string | null {
  const parts = locationName.split("/");
  const idx = parts.indexOf("locations");
  if (idx >= 0 && idx + 1 < parts.length) {
    return parts[idx + 1] ?? null;
  }
  return null;
}

export async function gbpListAllAccounts(options: GbpRequestOptions): Promise<GbpAccount[]> {
  const out: GbpAccount[] = [];
  let pageToken: string | undefined;
  do {
    const q = new URL(`${GBP_ACCOUNT_MGMT_ORIGIN}/accounts`);
    if (pageToken) {
      q.searchParams.set("pageToken", pageToken);
    }
    q.searchParams.set("pageSize", "100");
    const res = await gbpGetJson<GbpListAccountsResponse>(q.toString(), options);
    for (const a of res.accounts ?? []) {
      out.push(a);
    }
    pageToken =
      typeof res.nextPageToken === "string" && res.nextPageToken.length > 0
        ? res.nextPageToken
        : undefined;
  } while (pageToken);
  return out;
}

export async function gbpListAllLocationsForAccount(
  accountResourceName: string,
  options: GbpRequestOptions,
): Promise<GbpLocation[]> {
  const out: GbpLocation[] = [];
  let pageToken: string | undefined;
  do {
    const q = new URL(`${GBP_BUSINESS_INFO_ORIGIN}/${accountResourceName}/locations`);
    q.searchParams.set("pageSize", "100");
    q.searchParams.set("readMask", "name,title,websiteUri");
    if (pageToken) {
      q.searchParams.set("pageToken", pageToken);
    }
    const res = await gbpGetJson<GbpListLocationsResponse>(q.toString(), options);
    for (const loc of res.locations ?? []) {
      out.push(loc);
    }
    pageToken =
      typeof res.nextPageToken === "string" && res.nextPageToken.length > 0
        ? res.nextPageToken
        : undefined;
  } while (pageToken);
  return out;
}

export async function gbpListReviewsForLocation(
  locationResourceName: string,
  options: GbpRequestOptions,
): Promise<GbpListReviewsResponse> {
  const q = new URL(`${GBP_MYBUSINESS_V4_ORIGIN}/${locationResourceName}/reviews`);
  q.searchParams.set("pageSize", "50");
  return gbpGetJson<GbpListReviewsResponse>(q.toString(), options);
}

const PERFORMANCE_METRICS = [
  "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
  "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
  "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
  "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  "BUSINESS_CONVERSATIONS",
  "BUSINESS_DIRECTION_REQUESTS",
  "CALL_CLICKS",
  "WEBSITE_CLICKS",
] as const;

export async function gbpFetchPerformanceForLocation(
  locationId: string,
  startInclusive: string,
  endInclusive: string,
  options: GbpRequestOptions,
): Promise<GbpPerformanceResponse> {
  const url = `${GBP_PERFORMANCE_ORIGIN}/locations/${encodeURIComponent(locationId)}:fetchMultiDailyMetricsTimeSeries`;
  const body = {
    dailyMetrics: [...PERFORMANCE_METRICS],
    dailyRange: {
      start_date: isoDateToGoogleCalendar(startInclusive),
      end_date: isoDateToGoogleCalendar(endInclusive),
    },
  };
  return gbpPostJson<GbpPerformanceResponse>(url, body, options);
}
