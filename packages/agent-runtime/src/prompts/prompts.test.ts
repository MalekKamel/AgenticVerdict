import { describe, expect, it } from "vitest";

import { buildAbDecisionRecord, runPairedPromptAbTest, selectPromptAbWinner } from "./ab-testing";
import {
  assemblePromptLayers,
  buildTenantPromptContext,
  buildTenantPromptContextSections,
} from "./tenant-injection";
import { PRODUCTION_PROMPT_TEMPLATES, PRODUCTION_PROMPT_TEMPLATE_COUNT } from "./library";
import { getPromptTemplateHistory, listPromptTemplateIds, resolvePromptTemplate } from "./registry";
import {
  estimateApproximateTokenCount,
  listTemplatePlaceholders,
  renderPromptTemplate,
} from "./render";
import { promptTemplateRecordSchema } from "./types";
import type { TenantConfig } from "@agenticverdict/config";

const sampleTenant: TenantConfig = {
  tenantId: "00000000-0000-4000-8000-000000000001",
  tenantName: "Acme Fleet",
  localization: {
    language: "en",
    region: "SA",
    timezone: "Asia/Riyadh",
    currency: "SAR",
  },
  marketing: {
    channels: [
      { platform: "meta", enabled: true, label: "Primary" },
      { platform: "ga4", enabled: false },
    ],
    kpis: [{ id: "leads", name: "Qualified leads", unit: "count" }],
  },
  ai: { primaryModel: "claude-3-5-sonnet-20241022", provider: "anthropic" },
  features: { enableInsights: true, enableVerdict: true },
  business: {
    products: ["GPS tracking"],
    valueProps: ["Reliability"],
    differentiators: ["Local support"],
  },
};

describe("prompt template library", () => {
  it("ships at least ten production records and validates with Zod", () => {
    expect(PRODUCTION_PROMPT_TEMPLATE_COUNT).toBeGreaterThanOrEqual(10);
    for (const t of PRODUCTION_PROMPT_TEMPLATES) {
      expect(() => promptTemplateRecordSchema.parse(t)).not.toThrow();
    }
  });

  it("lists unique template ids including version history", () => {
    const ids = listPromptTemplateIds();
    expect(ids).toContain("analysis.cross_platform_overview");
    expect(ids.length).toBeGreaterThanOrEqual(10);
  });

  it("resolves latest semver for a template id with multiple versions", () => {
    const latest = resolvePromptTemplate("analysis.cross_platform_overview");
    expect(latest.version).toBe("1.1.0");
    expect(latest.variables).toContain("currency");

    const v1 = resolvePromptTemplate("analysis.cross_platform_overview", "1.0.0");
    expect(v1.version).toBe("1.0.0");
    expect(v1.variables).not.toContain("currency");
  });

  it("returns newest-first history", () => {
    const h = getPromptTemplateHistory("analysis.cross_platform_overview");
    expect(h.map((x) => x.version)).toEqual(["1.1.0", "1.0.0"]);
  });

  it("renders templates and matches golden output for a utility template", () => {
    const t = resolvePromptTemplate("utility.markdown_brief");
    const rendered = renderPromptTemplate(t, {
      title: "Weekly KPIs",
      audience: "Marketing lead",
      detailLevel: "short",
    });
    expect(rendered).toBe(
      `Draft a short markdown brief titled "Weekly KPIs" for audience: Marketing lead.\nUse headings, bullets, and bold sparingly; Phase 3 renderers will consume this structure.`,
    );
  });

  it("lists placeholders consistently", () => {
    const t = resolvePromptTemplate("analysis.trend_deep_dive");
    expect(listTemplatePlaceholders(t.template).sort()).toEqual([
      "dateRange",
      "granularity",
      "metricName",
    ]);
  });
});

describe("tenant prompt injection", () => {
  it("includes high-priority sections and drops low-priority under a tiny budget", () => {
    const full = buildTenantPromptContext(sampleTenant, { maxApproxTokens: 10_000 });
    expect(full.sectionsDropped).toEqual([]);
    expect(full.text).toContain("Acme Fleet");

    const tight = buildTenantPromptContext(sampleTenant, { maxApproxTokens: 12 });
    expect(tight.sectionsIncluded).toContain("identity");
    expect(tight.sectionsDropped.length).toBeGreaterThan(0);
  });

  it("exposes section blocks for inspection tests", () => {
    const sections = buildTenantPromptContextSections(sampleTenant);
    expect(sections.find((s) => s.key === "identity")?.text).toContain("Acme Fleet");
  });

  it("assembles layers and trims tool context before tenant context", () => {
    const longTool = "x".repeat(400);
    const assembled = assemblePromptLayers({
      systemPolicy: "Be concise.",
      tenantContext: "Tenant block here.",
      userTask: "Do the thing.",
      toolContext: longTool,
      maxApproxTokensTotal: 40,
    });
    expect(assembled.truncation.toolContextTrimmed).toBe(true);
    expect(assembled.systemMessage).toContain("Be concise.");
    expect(assembled.userMessage).toContain("Task:");
  });
});

describe("token estimator", () => {
  it("uses the documented char heuristic", () => {
    expect(estimateApproximateTokenCount("abcd")).toBe(1);
    expect(estimateApproximateTokenCount("")).toBe(0);
  });
});

describe("A/B harness", () => {
  it("runs paired comparison and can pick a winner with mock invoke", async () => {
    const fixtures = [
      { id: "f1", expectedSubstrings: ["alpha"] as const },
      { id: "f2", expectedSubstrings: ["beta"] as const },
    ];

    const report = await runPairedPromptAbTest(
      fixtures,
      {
        id: "A",
        buildPrompt: (f) => `prompt-A-${f.id}`,
      },
      {
        id: "B",
        buildPrompt: (f) => `prompt-B-${f.id}-extra-words-to-lower-efficiency`,
      },
      {
        invoke: async (f, variantId) => {
          const base = variantId === "A" ? 0.9 : 0.4;
          const text = variantId === "A" ? `alpha ok ${f.id}` : `beta weak ${f.id}`;
          return { responseText: text, latencyMs: variantId === "A" ? 10 : 20, qualityScore: base };
        },
      },
    );

    expect(report.rows).toHaveLength(4);
    expect(report.aggregates.find((a) => a.variantId === "A")!.meanQuality).toBeGreaterThan(
      report.aggregates.find((a) => a.variantId === "B")!.meanQuality,
    );

    const decision = selectPromptAbWinner(report, "A", "B", { minMeanQualityDelta: 0.01 });
    expect(decision.winner).toBe("A");

    const record = buildAbDecisionRecord(report, decision, {
      variantA: "analysis.cross_platform_overview@1.1.0",
      variantB: "analysis.cross_platform_overview@1.0.0",
    });
    expect(record.decisionWinner).toBe("A");
  });
});
