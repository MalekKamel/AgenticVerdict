import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

import type { MockGatewayChaosState } from "./chaos";

const GW = "/__gw/";

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function parseGatewayPath(pathname: string): { virtualHost: string; restPath: string } | null {
  if (!pathname.startsWith(GW)) {
    return null;
  }
  const stripped = pathname.slice(GW.length);
  const slash = stripped.indexOf("/");
  if (slash <= 0) {
    return null;
  }
  return {
    virtualHost: stripped.slice(0, slash),
    restPath: stripped.slice(slash),
  };
}

const metaCampaign = {
  id: "cmp_phase01",
  name: "Phase01 Campaign",
  status: "ACTIVE",
  objective: "OUTCOME_TRAFFIC",
  daily_budget: "1200",
  lifetime_budget: "0",
  account_id: "act_1",
};

const metaAdSet = {
  id: "as_1",
  name: "Ad set",
  status: "ACTIVE",
  campaign_id: "cmp_phase01",
  daily_budget: "600",
  lifetime_budget: "0",
};

const metaAd = {
  id: "ad_1",
  name: "Ad",
  status: "ACTIVE",
  adset_id: "as_1",
  campaign_id: "cmp_phase01",
};

const metaInsight = {
  campaign_id: "cmp_phase01",
  campaign_name: "Phase01 Campaign",
  impressions: "5000",
  clicks: "120",
  spend: "42.5",
  ctr: "2.4",
  cpc: "0.35",
  reach: "8000",
  actions: [{ action_type: "purchase", value: "3" }],
  date_start: "2025-01-01",
  date_stop: "2025-01-31",
};

function tiktokEnvelope<T>(data: T): { code: number; message: string; data: T } {
  return { code: 0, message: "OK", data };
}

export interface PlatformMockGateway {
  readonly port: number;
  readonly chaos: MockGatewayChaosState;
  close(): Promise<void>;
}

/**
 * Minimal multi-vendor HTTP fixture used by Phase 7 integration tests (mock API servers).
 */
export async function startPlatformMockGateway(
  chaos: MockGatewayChaosState,
): Promise<PlatformMockGateway> {
  const server: Server = createServer((req, res) => {
    void handleRequest(req, res, chaos).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      json(res, 500, { error: "gateway_error", message: msg });
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => resolve());
    server.on("error", reject);
  });

  const addr = server.address();
  if (addr === null || typeof addr === "string") {
    await new Promise<void>((r) => server.close(() => r()));
    throw new Error("mock gateway failed to bind");
  }

  return {
    port: addr.port,
    chaos,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((e) => (e ? reject(e) : resolve()));
      }),
  };
}

async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse,
  chaos: MockGatewayChaosState,
): Promise<void> {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const parsed = parseGatewayPath(url.pathname);
  if (!parsed) {
    json(res, 404, { error: "not_found" });
    return;
  }

  const { virtualHost, restPath } = parsed;
  const method = (req.method ?? "GET").toUpperCase();

  if (virtualHost === "graph.facebook.com") {
    await handleMeta(method, restPath, url, req, res, chaos);
    return;
  }

  if (virtualHost === "oauth2.googleapis.com") {
    await handleGoogleOAuth(method, restPath, url, req, res);
    return;
  }

  if (virtualHost === "www.googleapis.com") {
    await handleGoogleWebmasters(method, restPath, url, req, res);
    return;
  }

  if (virtualHost === "analyticsdata.googleapis.com") {
    await handleGa4(method, restPath, req, res);
    return;
  }

  if (virtualHost === "searchconsole.googleapis.com") {
    await handleSearchConsole(method, restPath, req, res);
    return;
  }

  if (virtualHost === "mybusinessaccountmanagement.googleapis.com") {
    await handleGbpAccounts(method, restPath, res);
    return;
  }

  if (virtualHost === "mybusinessbusinessinformation.googleapis.com") {
    await handleGbpLocations(method, restPath, res);
    return;
  }

  if (virtualHost === "mybusiness.googleapis.com") {
    await handleGbpReviews(method, restPath, res);
    return;
  }

  if (virtualHost === "businessprofileperformance.googleapis.com") {
    await handleGbpPerformance(method, restPath, req, res);
    return;
  }

  if (virtualHost === "sandbox-ads.tiktok.com" || virtualHost === "business-api.tiktok.com") {
    await handleTikTok(method, restPath, url, req, res);
    return;
  }

  json(res, 404, { error: "unknown_virtual_host", virtualHost });
}

async function handleMeta(
  method: string,
  restPath: string,
  url: URL,
  _req: IncomingMessage,
  res: ServerResponse,
  chaos: MockGatewayChaosState,
): Promise<void> {
  if (method !== "GET") {
    json(res, 405, { error: "method_not_allowed" });
    return;
  }

  const isProtectedAuth =
    chaos.protectMetaAuthPaths &&
    (/\/me$/i.test(restPath) || restPath.includes("/oauth/access_token"));

  if (chaos.metaGraph500Remaining > 0 && !isProtectedAuth) {
    chaos.metaGraph500Remaining -= 1;
    json(res, 500, { error: { message: "injected_meta_failure", code: 1 } });
    return;
  }

  if (restPath.includes("/oauth/access_token")) {
    json(res, 200, { access_token: "mock-long-lived", expires_in: 5_000_000 });
    return;
  }

  if (/\/me$/i.test(restPath)) {
    json(res, 200, { id: "meta-user-phase01" });
    return;
  }

  if (restPath.includes("/campaigns")) {
    json(res, 200, { data: [metaCampaign] });
    return;
  }
  if (restPath.includes("/adsets")) {
    json(res, 200, { data: [metaAdSet] });
    return;
  }
  if (restPath.includes("/insights")) {
    const timeRange = url.searchParams.get("time_range");
    void timeRange;
    json(res, 200, { data: [metaInsight] });
    return;
  }
  if (/\/ads\b/.test(restPath)) {
    json(res, 200, { data: [metaAd] });
    return;
  }

  json(res, 200, { data: [] });
}

async function handleGoogleOAuth(
  method: string,
  restPath: string,
  _url: URL,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (restPath === "/tokeninfo" || restPath.startsWith("/tokeninfo")) {
    json(res, 200, { expires_in: 3600, aud: "phase01.apps.googleusercontent.com" });
    return;
  }
  if (restPath === "/token" && method === "POST") {
    void (await readBody(req));
    json(res, 200, { access_token: "google-refreshed", expires_in: 3600, token_type: "Bearer" });
    return;
  }
  json(res, 404, { error: "oauth_route_not_found", restPath });
}

async function handleGoogleWebmasters(
  method: string,
  restPath: string,
  _url: URL,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (restPath.includes("/searchAnalytics/query") && method === "POST") {
    void (await readBody(req));
    json(res, 200, {
      rows: [
        {
          keys: ["fleet", "/pricing", "MOBILE", "sau"],
          clicks: 4,
          impressions: 80,
          ctr: 0.05,
          position: 4.2,
        },
      ],
    });
    return;
  }
  if (restPath.includes("/sitemaps") && method === "GET") {
    json(res, 200, { sitemap: [{ path: "https://example.com/s.xml", isPending: false }] });
    return;
  }
  json(res, 200, {});
}

async function handleGa4(
  method: string,
  restPath: string,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (method !== "POST") {
    json(res, 405, { error: { message: "POST only" } });
    return;
  }
  void (await readBody(req));
  if (restPath.includes(":runReport")) {
    json(res, 200, {
      dimensionHeaders: [{ name: "date" }],
      metricHeaders: [{ name: "sessions" }],
      rows: [],
    });
    return;
  }
  if (restPath.includes(":runRealtimeReport")) {
    json(res, 200, { rows: [], dimensionHeaders: [], metricHeaders: [] });
    return;
  }
  if (restPath.includes(":runFunnelReport")) {
    json(res, 200, { funnelTableData: { rows: [] } });
    return;
  }
  json(res, 200, {});
}

async function handleSearchConsole(
  method: string,
  restPath: string,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (restPath.includes("urlInspection") && method === "POST") {
    void (await readBody(req));
    json(res, 200, {
      inspectionResult: {
        indexStatusResult: { verdict: "PASS", coverageState: "Submitted and indexed" },
        mobileUsabilityResult: { verdict: "PASS", issues: [] },
      },
    });
    return;
  }
  json(res, 200, {});
}

async function handleGbpAccounts(
  method: string,
  restPath: string,
  res: ServerResponse,
): Promise<void> {
  if (method === "GET" && restPath.startsWith("/v1/accounts")) {
    json(res, 200, {
      accounts: [{ name: "accounts/phase01", accountName: "Phase01 Account" }],
    });
    return;
  }
  json(res, 200, {});
}

async function handleGbpLocations(
  method: string,
  restPath: string,
  res: ServerResponse,
): Promise<void> {
  if (method === "GET" && restPath.includes("/locations")) {
    json(res, 200, {
      locations: [
        {
          name: "accounts/phase01/locations/LOC1",
          title: "Riyadh HQ",
          websiteUri: "https://example.com",
        },
      ],
    });
    return;
  }
  json(res, 200, {});
}

async function handleGbpReviews(
  method: string,
  restPath: string,
  res: ServerResponse,
): Promise<void> {
  if (method === "GET" && restPath.includes("/reviews")) {
    json(res, 200, { reviews: [], averageRating: 4.6, totalReviewCount: 12 });
    return;
  }
  json(res, 200, {});
}

async function handleGbpPerformance(
  method: string,
  restPath: string,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (method === "POST" && restPath.includes("fetchMultiDailyMetricsTimeSeries")) {
    void (await readBody(req));
    json(res, 200, {
      multiDailyMetricTimeSeries: [
        {
          dailyMetricTimeSeries: [
            {
              dailyMetrics: [
                {
                  dailyMetric: "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
                  timeSeries: {
                    datedValues: [{ date: { year: 2025, month: 1, day: 15 }, value: "42" }],
                  },
                },
              ],
            },
          ],
        },
      ],
    });
    return;
  }
  json(res, 200, {});
}

async function handleTikTok(
  method: string,
  restPath: string,
  url: URL,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  if (restPath.includes("/oauth2/access_token/") && method === "POST") {
    void (await readBody(req));
    json(
      res,
      200,
      tiktokEnvelope({
        access_token: "tt_access",
        refresh_token: "tt_refresh",
        expires_in: 7200,
      }),
    );
    return;
  }

  if (restPath.includes("/user/info/") && method === "GET") {
    json(res, 200, tiktokEnvelope({ user_id: "u1" }));
    return;
  }

  if (restPath.includes("/advertiser/info/") && method === "GET") {
    const rawAdv = url.searchParams.get("advertiser_ids") ?? "1";
    const digits = rawAdv.match(/\d+/);
    const advertiserId = digits?.[0] ?? "1";
    json(
      res,
      200,
      tiktokEnvelope({
        list: [{ advertiser_id: advertiserId }],
      }),
    );
    return;
  }

  if (restPath.includes("/campaign/get/") && method === "GET") {
    json(
      res,
      200,
      tiktokEnvelope({
        list: [
          {
            campaign_id: "c1",
            campaign_name: "TikTok Phase01",
            operation_status: "ENABLE",
            objective_type: "TRAFFIC",
            budget: 100,
          },
        ],
        page_info: { total_number: 1, page: 1, page_size: 1000 },
      }),
    );
    return;
  }

  if (restPath.includes("/adgroup/get/") && method === "GET") {
    json(
      res,
      200,
      tiktokEnvelope({
        list: [{ adgroup_id: "ag1", adgroup_name: "AG", campaign_id: "c1" }],
        page_info: { total_number: 1, page: 1, page_size: 1000 },
      }),
    );
    return;
  }

  if (restPath.includes("/ad/get/") && method === "GET") {
    json(
      res,
      200,
      tiktokEnvelope({
        list: [{ ad_id: "a1", ad_name: "A", adgroup_id: "ag1" }],
        page_info: { total_number: 1, page: 1, page_size: 1000 },
      }),
    );
    return;
  }

  if (restPath.includes("/report/integrated/get/") && method === "GET") {
    json(
      res,
      200,
      tiktokEnvelope({
        list: [
          {
            metrics: {
              spend: "10",
              impressions: "1000",
              clicks: "25",
              cpc: "0.4",
              cpm: "10",
              ctr: "2.5",
            },
            dimensions: { campaign_id: "c1", stat_time_day: "2025-01-15 00:00:00" },
          },
        ],
        page_info: { total_number: 1, page: 1, page_size: 1000 },
      }),
    );
    return;
  }

  json(res, 200, tiktokEnvelope({}));
}
