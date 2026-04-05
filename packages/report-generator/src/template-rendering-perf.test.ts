import { describe, expect, it } from "vitest";

import { createDefaultCompositeTemplateEngine } from "./composite-template-engine";
import type { ReportGenerationContext } from "./types";

describe("template rendering performance (TMP-5)", () => {
  it("renders a large detailed template many times within a modest time budget", async () => {
    const engine = createDefaultCompositeTemplateEngine();
    const ctx: ReportGenerationContext = {
      tenantId: "t",
      reportId: "r",
      locale: "en",
      templateId: "detailed-analysis",
    };
    const sections = Array.from({ length: 40 }, (_, i) => ({
      id: `section-${i}`,
      heading: `Section ${i}`,
      bodyText: "Lorem ipsum dolor sit amet. ".repeat(20),
    }));
    const rows = Array.from({ length: 80 }, (_, i) => ({ name: `row-${i}`, value: i }));
    const model = {
      title: "Stress",
      narrativeSections: sections,
      metrics: {
        columns: ["name", "value"],
        rows,
      },
      charts: [
        {
          kind: "line",
          title: "t",
          series: Array.from({ length: 12 }, (_, i) => ({ label: `d${i}`, value: i })),
        },
      ],
    };
    const iterations = 24;
    const t0 = performance.now();
    for (let i = 0; i < iterations; i += 1) {
      await engine.render(ctx, model);
    }
    const ms = performance.now() - t0;
    expect(ms).toBeLessThan(4000);
  });

  it("renders executive-summary template many times within a modest budget (Part 9 perf smoke)", async () => {
    const engine = createDefaultCompositeTemplateEngine();
    const ctx: ReportGenerationContext = {
      tenantId: "t",
      reportId: "r",
      locale: "en",
      templateId: "executive-summary",
    };
    const model = {
      title: "Executive perf",
      executiveSummary: "Summary ".repeat(30),
      keyMetrics: Array.from({ length: 12 }, (_, i) => ({ label: `K${i}`, value: String(i * 10) })),
    };
    const iterations = 36;
    const t0 = performance.now();
    for (let i = 0; i < iterations; i += 1) {
      await engine.render(ctx, model);
    }
    const ms = performance.now() - t0;
    expect(ms).toBeLessThan(2500);
  });
});
