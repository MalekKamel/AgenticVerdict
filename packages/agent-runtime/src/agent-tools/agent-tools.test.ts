import { runWithTenantContext, type TenantContext } from "@agenticverdict/core";
import {
  createSyntheticAdapter,
  MockPlatformAdapter,
  testAdapterTenantId,
} from "@agenticverdict/platform-adapters";
import { describe, expect, it } from "vitest";

import type { AgentInvocationContext } from "../interfaces";
import { ToolRegistry } from "../tools";
import { AgentToolError } from "./agent-tool-error";
import { parseToolArgs, queryHistoricalMetricsInputSchema } from "./agent-tool-schemas";
import {
  analyzeTrendsFromStore,
  comparePeriodsFromStore,
  type MarketingMetricsRow,
  type MarketingMetricsStore,
} from "./marketing-metrics-store";
import { TenantScopedTtlCache } from "./company-context-tools";
import { createPhase4ToolRegistry, registerPhase4AgentTools } from "./phase4-tool-registry";
import { fetchNormalizedSnapshotsForPlatformsParallel } from "./platform-fetch-tools";

const TENANT: TenantContext = {
  tenantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  requestId: "req-test",
  config: {
    companyId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    companyName: "Fixture Co",
    localization: {
      language: "en",
      region: "SA",
      timezone: "Asia/Riyadh",
      currency: "SAR",
    },
    marketing: {
      channels: [
        { platform: "meta", enabled: true, label: "Meta" },
        { platform: "ga4", enabled: true },
      ],
      kpis: [{ id: "leads", name: "Leads", unit: "count" }],
      b2bKpiProfile: {
        enabled: true,
        funnelMetricMapping: {
          totalLeadMetricSuffixes: ["mock.conversions"],
          qualifiedLeadMetricSuffixes: ["mock.qualified_conversions"],
          spendMetricSuffixes: ["mock.spend"],
          decisionMakerLeadMetricSuffixes: ["mock.leads_dm"],
          fleetQualifiedLeadMetricSuffixes: ["mock.leads_fleet"],
          regionalQualifiedLeadMetricSuffixes: ["mock.leads_regional"],
          regionalDimension: { key: "region", value: "SA" },
          sessionsMetricSuffixes: ["mock.sessions"],
          sessionLanguageDimensionKey: "language",
        },
        targetCpql: { maxAmount: 10_000, currencyCode: "SAR" },
      },
    },
    ai: { primaryModel: "claude-3-5-sonnet-20241022", provider: "anthropic" },
    features: { enableInsights: true, enableVerdict: true },
    business: {
      products: ["Fleet GPS"],
      valueProps: ["Reliability"],
      differentiators: ["Local support"],
    },
  },
};

const INVOCATION: AgentInvocationContext = {
  runId: "run-1",
  tenantId: TENANT.tenantId,
  requestId: TENANT.requestId,
};

function memoryMetricsStore(rows: MarketingMetricsRow[]): MarketingMetricsStore {
  return {
    async queryHistorical({ startDate, endDate, platform, limit }) {
      let r = rows.filter((x) => x.metricDate >= startDate && x.metricDate <= endDate);
      if (platform !== undefined) {
        r = r.filter((x) => x.platform === platform);
      }
      if (limit !== undefined) {
        r = r.slice(0, limit);
      }
      return r;
    },
  };
}

describe("Phase 4 agent tools", () => {
  it("exposes eighteen registered tools via createPhase4ToolRegistry", () => {
    const store = memoryMetricsStore([]);
    const registry = createPhase4ToolRegistry({
      metricsStore: store,
      platform: {
        getAdapter: (platform) =>
          new MockPlatformAdapter(platform, {
            tenantId: testAdapterTenantId,
            records: [
              {
                metricKey: "spend",
                value: 1,
                capturedAt: "2026-01-01T00:00:00.000Z",
              },
            ],
          }),
        authenticateAdapter: async (adapter) => {
          await adapter.authenticate({});
        },
      },
    });
    expect(registry.list()).toHaveLength(18);
    expect(registry.get("fetch_meta_metrics")).toBeDefined();
    expect(registry.get("query_historical_metrics")).toBeDefined();
    expect(registry.get("generate_summary")).toBeDefined();
    expect(registry.get("calculate_metrics")).toBeDefined();
    expect(registry.get("get_company_profile")).toBeDefined();
    expect(registry.get("compute_b2b_kpis_from_snapshots")).toBeDefined();
  });

  it("compute_b2b_kpis_from_snapshots uses tenant config and snapshots", async () => {
    const registry = createPhase4ToolRegistry({
      metricsStore: memoryMetricsStore([]),
      platform: {
        getAdapter: (p) => new MockPlatformAdapter(p, { tenantId: testAdapterTenantId }),
      },
    });
    const tool = registry.get("compute_b2b_kpis_from_snapshots")!;
    const snapshot = {
      platform: "meta",
      dateRange: { startInclusive: "2026-01-01", endInclusive: "2026-01-07" },
      records: [
        {
          metricKey: "meta.mock.conversions",
          value: 100,
          capturedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          metricKey: "meta.mock.qualified_conversions",
          value: 80,
          capturedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          metricKey: "meta.mock.spend",
          value: 8000,
          capturedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          metricKey: "meta.mock.leads_dm",
          value: 60,
          capturedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          metricKey: "meta.mock.leads_fleet",
          value: 55,
          capturedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          metricKey: "meta.mock.leads_regional",
          value: 40,
          dimensions: { region: "SA" },
          capturedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          metricKey: "meta.mock.sessions",
          value: 500,
          dimensions: { language: "ar" },
          capturedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          metricKey: "meta.mock.sessions",
          value: 300,
          dimensions: { language: "en" },
          capturedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    };
    const out = await runWithTenantContext(TENANT, () =>
      tool.execute({ snapshots: [snapshot] }, INVOCATION),
    );
    expect(out).toMatchObject({
      kpis: expect.objectContaining({ profileApplied: true }),
      funnel: expect.objectContaining({ totalLeads: 100, qualifiedLeads: 80 }),
    });
  });

  it("fetch_meta_metrics rejects inverted date ranges", async () => {
    const registry = createPhase4ToolRegistry({
      metricsStore: memoryMetricsStore([]),
      platform: {
        getAdapter: (p) => new MockPlatformAdapter(p, { tenantId: testAdapterTenantId }),
      },
    });
    await expect(
      registry
        .get("fetch_meta_metrics")!
        .execute({ startInclusive: "2026-02-01", endInclusive: "2026-01-01" }, INVOCATION),
    ).rejects.toMatchObject({ code: "validation_failed" });
  });

  it("fetch_meta_metrics wraps invalid normalized snapshots", async () => {
    const registry = createPhase4ToolRegistry({
      metricsStore: memoryMetricsStore([]),
      platform: {
        getAdapter: () =>
          createSyntheticAdapter("meta", {
            normalizeImpl: () => ({
              platform: "meta",
              dateRange: { startInclusive: "2026-01-01", endInclusive: "2026-01-02" },
              records: [{ metricKey: "x", value: Number.NaN, capturedAt: "2026-01-01T00:00:00Z" }],
            }),
          }),
        authenticateAdapter: async (a) => {
          await a.authenticate({});
        },
      },
    });
    await expect(
      registry
        .get("fetch_meta_metrics")!
        .execute({ startInclusive: "2026-01-01", endInclusive: "2026-01-02" }, INVOCATION),
    ).rejects.toMatchObject({ code: "execution_failed" });
  });

  it("fetch_ga4_metrics returns a validated normalized snapshot", async () => {
    const registry = createPhase4ToolRegistry({
      metricsStore: memoryMetricsStore([]),
      platform: {
        getAdapter: (platform) =>
          new MockPlatformAdapter(platform, {
            tenantId: testAdapterTenantId,
            records: [
              {
                metricKey: "sessions",
                value: 120,
                capturedAt: "2026-01-10T00:00:00.000Z",
              },
            ],
          }),
        authenticateAdapter: async (a) => {
          await a.authenticate({});
        },
      },
    });
    const tool = registry.get("fetch_ga4_metrics");
    expect(tool).toBeDefined();
    const out = await tool!.execute(
      { startInclusive: "2026-01-01", endInclusive: "2026-01-07" },
      INVOCATION,
    );
    expect(out).toMatchObject({
      platform: "ga4",
      records: [{ metricKey: "sessions", value: 120 }],
    });
  });

  it("query_historical_metrics maps store failures to execution_failed", async () => {
    const failingStore: MarketingMetricsStore = {
      async queryHistorical() {
        throw new Error("simulated db failure");
      },
    };
    const registry = createPhase4ToolRegistry({
      metricsStore: failingStore,
      platform: {
        getAdapter: (p) => new MockPlatformAdapter(p, { tenantId: testAdapterTenantId }),
      },
    });
    await expect(
      registry
        .get("query_historical_metrics")!
        .execute({ startDate: "2026-01-01", endDate: "2026-01-31" }, INVOCATION),
    ).rejects.toMatchObject({ code: "execution_failed" });
  });

  it("analyze_trends rejects inverted ranges", async () => {
    const registry = createPhase4ToolRegistry({
      metricsStore: memoryMetricsStore([]),
      platform: {
        getAdapter: (p) => new MockPlatformAdapter(p, { tenantId: testAdapterTenantId }),
      },
    });
    await expect(
      registry
        .get("analyze_trends")!
        .execute({ startDate: "2026-02-01", endDate: "2026-01-01" }, INVOCATION),
    ).rejects.toMatchObject({ code: "validation_failed" });
  });

  it("query_historical_metrics rejects invalid dates", async () => {
    const registry = createPhase4ToolRegistry({
      metricsStore: memoryMetricsStore([]),
      platform: {
        getAdapter: (p) => new MockPlatformAdapter(p, { tenantId: testAdapterTenantId }),
      },
    });
    const tool = registry.get("query_historical_metrics");
    await expect(
      tool!.execute({ startDate: "not-a-date", endDate: "2026-01-02" }, INVOCATION),
    ).rejects.toMatchObject({ code: "validation_failed" });
  });

  it("analyze_trends aggregates row volume and payload sums", async () => {
    const rows: MarketingMetricsRow[] = [
      { platform: "meta", metricDate: "2026-01-01", payload: {} },
      { platform: "meta", metricDate: "2026-01-01", payload: {} },
      { platform: "meta", metricDate: "2026-01-02", payload: { value: 5 } },
    ];
    const store = memoryMetricsStore(rows);
    const vol = await analyzeTrendsFromStore(store, {
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      platform: "meta",
      mode: "row_volume",
    });
    expect(vol.series.find((s) => s.date === "2026-01-01")?.value).toBe(2);
    const sums = await analyzeTrendsFromStore(store, {
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      mode: "payload_sum",
    });
    expect(sums.series.find((s) => s.date === "2026-01-02")?.value).toBe(5);
  });

  it("compare_periods computes deltas", async () => {
    const rows: MarketingMetricsRow[] = [
      { platform: "ga4", metricDate: "2026-01-01", payload: { value: 10 } },
      { platform: "ga4", metricDate: "2026-01-02", payload: { value: 10 } },
      { platform: "ga4", metricDate: "2026-02-01", payload: { value: 5 } },
    ];
    const store = memoryMetricsStore(rows);
    const cmp = await comparePeriodsFromStore(store, {
      periodA: { startDate: "2026-01-01", endDate: "2026-01-15" },
      periodB: { startDate: "2026-02-01", endDate: "2026-02-15" },
      platform: "ga4",
      mode: "payload_sum",
    });
    expect(cmp.periodA.total).toBe(20);
    expect(cmp.periodB.total).toBe(5);
    expect(cmp.deltaAbs).toBe(-15);
  });

  it("generate_summary and format_report produce markdown", async () => {
    const registry = createPhase4ToolRegistry({
      metricsStore: memoryMetricsStore([]),
      platform: {
        getAdapter: (p) => new MockPlatformAdapter(p, { tenantId: testAdapterTenantId }),
      },
    });
    const summary = await registry
      .get("generate_summary")!
      .execute({ title: "Q1", bullets: ["A", "B"], tone: "executive" }, INVOCATION);
    expect(summary).toMatchObject({ bulletCount: 2, tone: "executive" });
    expect(String((summary as { markdown: string }).markdown)).toContain("Q1");

    const formatted = await registry.get("format_report")!.execute(
      {
        locale: "en",
        sections: [{ heading: "Intro", bodyMarkdown: "Hello **world**" }],
      },
      INVOCATION,
    );
    expect((formatted as { markdown: string }).markdown).toContain("Intro");
  });

  it("prepare_chart_data normalizes series stats", async () => {
    const registry = createPhase4ToolRegistry({
      metricsStore: memoryMetricsStore([]),
      platform: {
        getAdapter: (p) => new MockPlatformAdapter(p, { tenantId: testAdapterTenantId }),
      },
    });
    const chart = await registry.get("prepare_chart_data")!.execute(
      {
        chartKind: "line",
        series: [
          {
            id: "s1",
            label: "One",
            points: [
              { x: "a", y: 1 },
              { x: "b", y: 3 },
            ],
          },
        ],
      },
      INVOCATION,
    );
    expect(chart).toMatchObject({
      chartKind: "line",
      series: [{ stats: { minY: 1, maxY: 3, pointCount: 2 } }],
    });
  });

  it("calculate_metrics handles growth_rate division by zero", async () => {
    const registry = createPhase4ToolRegistry({
      metricsStore: memoryMetricsStore([]),
      platform: {
        getAdapter: (p) => new MockPlatformAdapter(p, { tenantId: testAdapterTenantId }),
      },
    });
    const out = await registry
      .get("calculate_metrics")!
      .execute({ values: [0, 2, 4], operations: ["growth_rate", "mean"] }, INVOCATION);
    expect(out).toEqual({
      valuesCount: 3,
      results: { growth_rate: null, mean: 2 },
    });
  });

  it("statistical_analysis rejects mismatched series lengths", async () => {
    const registry = createPhase4ToolRegistry({
      metricsStore: memoryMetricsStore([]),
      platform: {
        getAdapter: (p) => new MockPlatformAdapter(p, { tenantId: testAdapterTenantId }),
      },
    });
    await expect(
      registry
        .get("statistical_analysis")!
        .execute({ x: [1, 2], y: [1], analyses: ["variance"] }, INVOCATION),
    ).rejects.toMatchObject({ code: "validation_failed" });
  });

  it("statistical_analysis detects z-score outliers", async () => {
    const registry = createPhase4ToolRegistry({
      metricsStore: memoryMetricsStore([]),
      platform: {
        getAdapter: (p) => new MockPlatformAdapter(p, { tenantId: testAdapterTenantId }),
      },
    });
    const xs = [1, 1, 1, 1, 100];
    const ys = [2, 2, 2, 2, 2];
    const out = (await registry.get("statistical_analysis")!.execute(
      {
        x: xs,
        y: ys,
        analyses: ["outlier_zscore", "pearson_correlation"],
        zscoreThreshold: 1.5,
      },
      INVOCATION,
    )) as { outliersX: { index: number }[]; pearsonCorrelation: number };
    expect(out.outliersX.length).toBeGreaterThan(0);
    expect(typeof out.pearsonCorrelation).toBe("number");
  });

  it("normalize_metrics supports z_score scaling", async () => {
    const registry = createPhase4ToolRegistry({
      metricsStore: memoryMetricsStore([]),
      platform: {
        getAdapter: (p) => new MockPlatformAdapter(p, { tenantId: testAdapterTenantId }),
      },
    });
    const out = await registry
      .get("normalize_metrics")!
      .execute({ values: [0, 2, 4], method: "z_score" }, INVOCATION);
    expect(out).toMatchObject({ method: "z_score" });
    expect((out as { normalized: number[] }).normalized).toHaveLength(3);
  });

  it("normalize_metrics min_max collapses when flat", async () => {
    const registry = createPhase4ToolRegistry({
      metricsStore: memoryMetricsStore([]),
      platform: {
        getAdapter: (p) => new MockPlatformAdapter(p, { tenantId: testAdapterTenantId }),
      },
    });
    const out = await registry
      .get("normalize_metrics")!
      .execute({ values: [3, 3, 3], method: "min_max" }, INVOCATION);
    expect(out).toEqual({ method: "min_max", normalized: [0, 0, 0] });
  });

  it("get_company_profile rejects tenant id mismatch", async () => {
    const registry = createPhase4ToolRegistry({
      metricsStore: memoryMetricsStore([]),
      platform: {
        getAdapter: (p) => new MockPlatformAdapter(p, { tenantId: testAdapterTenantId }),
      },
    });
    await runWithTenantContext(TENANT, async () => {
      await expect(
        registry
          .get("get_company_profile")!
          .execute({}, { ...INVOCATION, tenantId: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb" }),
      ).rejects.toMatchObject({ code: "execution_failed" });
    });
  });

  it("company context tools require matching tenant context", async () => {
    const cache = new TenantScopedTtlCache<unknown>({
      ttlMs: 60_000,
      maxEntries: 10,
    });
    const registry = createPhase4ToolRegistry({
      metricsStore: memoryMetricsStore([]),
      platform: {
        getAdapter: (p) => new MockPlatformAdapter(p, { tenantId: testAdapterTenantId }),
      },
      companyContext: { configCache: cache },
    });
    await runWithTenantContext(TENANT, async () => {
      const profile = await registry.get("get_company_profile")!.execute({}, INVOCATION);
      expect(profile).toMatchObject({
        companyName: "Fixture Co",
        localization: { currency: "SAR" },
      });

      const rules = await registry.get("get_business_rules")!.execute({}, INVOCATION);
      expect((rules as { kpis: unknown[] }).kpis).toHaveLength(1);

      const cfg1 = await registry.get("get_config")!.execute({ section: "ai" }, INVOCATION);
      expect(cfg1).toMatchObject({ section: "ai", cached: false });
      const cfg2 = await registry.get("get_config")!.execute({ section: "ai" }, INVOCATION);
      expect(cfg2).toMatchObject({ section: "ai", cached: true });
    });
  });

  it("get_company_profile fails outside tenant scope", async () => {
    const registry = createPhase4ToolRegistry({
      metricsStore: memoryMetricsStore([]),
      platform: {
        getAdapter: (p) => new MockPlatformAdapter(p, { tenantId: testAdapterTenantId }),
      },
    });
    await expect(
      registry.get("get_company_profile")!.execute({}, INVOCATION),
    ).rejects.toMatchObject({
      code: "tenant_context_required",
    });
  });

  it("registerPhase4AgentTools refuses duplicate tool names", () => {
    const registry = new ToolRegistry();
    registerPhase4AgentTools(registry, {
      metricsStore: memoryMetricsStore([]),
      platform: {
        getAdapter: (p) => new MockPlatformAdapter(p, { tenantId: testAdapterTenantId }),
      },
    });
    expect(() =>
      registerPhase4AgentTools(registry, {
        metricsStore: memoryMetricsStore([]),
        platform: {
          getAdapter: (p) => new MockPlatformAdapter(p, { tenantId: testAdapterTenantId }),
        },
      }),
    ).toThrow(/already registered/);
  });

  it("parseToolArgs surfaces zod issues as AgentToolError", () => {
    expect(() => parseToolArgs(queryHistoricalMetricsInputSchema, { startDate: "x" })).toThrow(
      AgentToolError,
    );
  });

  it("compare_periods rejects inverted sub-ranges", async () => {
    const registry = createPhase4ToolRegistry({
      metricsStore: memoryMetricsStore([]),
      platform: {
        getAdapter: (p) => new MockPlatformAdapter(p, { tenantId: testAdapterTenantId }),
      },
    });
    await expect(
      registry.get("compare_periods")!.execute(
        {
          periodA: { startDate: "2026-02-01", endDate: "2026-01-01" },
          periodB: { startDate: "2026-03-01", endDate: "2026-03-31" },
        },
        INVOCATION,
      ),
    ).rejects.toMatchObject({ code: "validation_failed" });
  });

  it("generate_summary supports technical tone", async () => {
    const registry = createPhase4ToolRegistry({
      metricsStore: memoryMetricsStore([]),
      platform: {
        getAdapter: (p) => new MockPlatformAdapter(p, { tenantId: testAdapterTenantId }),
      },
    });
    const out = await registry
      .get("generate_summary")!
      .execute({ title: "T", bullets: ["x"], tone: "technical" }, INVOCATION);
    expect(String((out as { markdown: string }).markdown)).toContain("Technical");
  });

  it("TenantScopedTtlCache evicts oldest entry at maxEntries", () => {
    const c = new TenantScopedTtlCache<number>({ ttlMs: 60_000, maxEntries: 2 });
    c.set("t1", "a", 1);
    c.set("t1", "b", 2);
    c.set("t1", "c", 3);
    expect(c.get("t1", "a")).toBeUndefined();
    expect(c.get("t1", "c")).toBe(3);
  });

  it("fetchNormalizedSnapshotsForPlatformsParallel returns all platforms", async () => {
    const range = { startInclusive: "2026-01-01", endInclusive: "2026-01-07" };
    const out = await fetchNormalizedSnapshotsForPlatformsParallel(["meta", "ga4"], range, {
      getAdapter: (platform) =>
        new MockPlatformAdapter(platform, {
          tenantId: testAdapterTenantId,
          records: [
            {
              metricKey: "spend",
              value: platform === "meta" ? 10 : 20,
              capturedAt: "2026-01-01T00:00:00.000Z",
            },
          ],
        }),
      authenticateAdapter: async (adapter) => {
        await adapter.authenticate({});
      },
    });
    expect(out).toHaveLength(2);
    expect(out.map((x) => x.platform).sort()).toEqual(["ga4", "meta"]);
  });
});
