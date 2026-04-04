import { assertTikTokSuccess, mapTikTokHttpError, tiktokOpenApiBaseUrl } from "./http";
import type { TikTokIntegratedCampaignRow, TikTokListData } from "./models";

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

export interface TikTokApiRequestOptions {
  readonly accessToken: string;
  readonly fetchImpl?: typeof fetch;
  readonly beforeRequest?: () => void | Promise<void>;
  readonly sandbox?: boolean;
}

const DEFAULT_PAGE_SIZE = "1000";

/**
 * Authenticated GET to Marketing Open API (`path` relative to `/open_api/v1.3/`, e.g. `campaign/get/`).
 */
export async function tiktokMarketingGet<TData = unknown>(
  path: string,
  searchParams: Record<string, string>,
  options: TikTokApiRequestOptions,
): Promise<TData> {
  if (options.beforeRequest) {
    await options.beforeRequest();
  }
  const fetchFn = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const base = tiktokOpenApiBaseUrl(options.sandbox ?? false);
  const url = new URL(`${base}/${path.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(searchParams)) {
    if (v.length > 0) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetchFn(url.toString(), {
    method: "GET",
    headers: {
      "Access-Token": options.accessToken,
      Accept: "application/json",
    },
  });

  const body = await readJsonBody(res);
  if (!res.ok) {
    throw mapTikTokHttpError(res.status, body);
  }
  const env = assertTikTokSuccess(body);
  return (env.data ?? null) as TData;
}

export async function tiktokFetchAdvertiserListPage<TItem>(
  path: string,
  advertiserId: string,
  page: number,
  options: TikTokApiRequestOptions,
  extraParams: Record<string, string> = {},
): Promise<TikTokListData<TItem>> {
  return tiktokMarketingGet<TikTokListData<TItem>>(
    path,
    {
      advertiser_id: advertiserId,
      page_size: DEFAULT_PAGE_SIZE,
      page: String(page),
      ...extraParams,
    },
    options,
  );
}

/**
 * Paginates TikTok list endpoints (`data.list` + `data.page_info.total_number`).
 */
export async function tiktokFetchAllListPages<TItem>(
  path: string,
  advertiserId: string,
  options: TikTokApiRequestOptions,
  extraParams: Record<string, string> = {},
): Promise<TItem[]> {
  const out: TItem[] = [];
  let page = 1;
  let total = 0;

  while (out.length < total || page === 1) {
    const data = await tiktokFetchAdvertiserListPage<TItem>(
      path,
      advertiserId,
      page,
      options,
      extraParams,
    );
    const chunk = data.list ?? [];
    total = data.page_info?.total_number ?? chunk.length;
    out.push(...chunk);
    page += 1;
    if (chunk.length === 0) {
      break;
    }
  }

  return out;
}

const INTEGRATED_BASIC_METRICS = JSON.stringify([
  "spend",
  "impressions",
  "clicks",
  "cpc",
  "cpm",
  "ctr",
  "reach",
  "conversion",
]);

const INTEGRATED_CAMPAIGN_DIMENSIONS = JSON.stringify(["campaign_id", "stat_time_day"]);

/**
 * Fetches all pages of `report/integrated/get/` for AUCTION / BASIC / AUCTION_CAMPAIGN within one date span (≤30 days recommended).
 */
export async function tiktokFetchIntegratedCampaignReport(
  advertiserId: string,
  startDate: string,
  endDate: string,
  options: TikTokApiRequestOptions,
): Promise<TikTokIntegratedCampaignRow[]> {
  const out: TikTokIntegratedCampaignRow[] = [];
  let page = 1;
  let total = 0;

  while (out.length < total || page === 1) {
    const data = await tiktokMarketingGet<TikTokListData<TikTokIntegratedCampaignRow>>(
      "report/integrated/get/",
      {
        advertiser_id: advertiserId,
        service_type: "AUCTION",
        report_type: "BASIC",
        data_level: "AUCTION_CAMPAIGN",
        dimensions: INTEGRATED_CAMPAIGN_DIMENSIONS,
        metrics: INTEGRATED_BASIC_METRICS,
        query_lifetime: "false",
        start_date: startDate,
        end_date: endDate,
        page_size: DEFAULT_PAGE_SIZE,
        page: String(page),
      },
      options,
    );

    const chunk = data.list ?? [];
    total = data.page_info?.total_number ?? chunk.length;
    out.push(...chunk);
    page += 1;
    if (chunk.length === 0) {
      break;
    }
  }

  return out;
}
