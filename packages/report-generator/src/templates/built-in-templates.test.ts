import { describe, expect, it } from "vitest";

import { createDefaultCompositeTemplateEngine } from "../composite-template-engine";
import { getBuiltInTemplateCatalog } from "./built-in-registry";
import type { ReportGenerationContext } from "../types";

const baseCtx = (templateId: string): ReportGenerationContext => ({
  tenantId: "t1",
  reportId: "r1",
  locale: "ar",
  templateId,
});

describe("built-in template catalog", () => {
  it("exposes three canonical template ids", () => {
    const cat = getBuiltInTemplateCatalog();
    expect(cat.map((c) => c.id).sort()).toEqual(
      ["detailed-analysis", "executive-summary", "technical-appendix"].sort(),
    );
  });
});

describe("built-in template rendering", () => {
  const engine = createDefaultCompositeTemplateEngine();

  it("renders executive-summary with RTL locale attribute when locale is Arabic", async () => {
    const html = await engine.render(baseCtx("executive-summary"), {
      title: "تقرير",
      executiveSummary: "ملخص",
      keyFindings: ["نقطة"],
    });
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("الملخص");
    expect(html).toContain("تقرير");
  });

  it("allows manual LTR override while keeping Arabic lang", async () => {
    const html = await engine.render(
      { ...baseCtx("executive-summary"), textDirection: "ltr" },
      { title: "تقرير", executiveSummary: "ملخص" },
    );
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="ltr"');
  });

  it("uses CJK font stack hints for Chinese locales", async () => {
    const html = await engine.render(
      { ...baseCtx("executive-summary"), locale: "zh" },
      { title: "报告", executiveSummary: "摘要" },
    );
    expect(html).toContain('lang="zh"');
    expect(html).toMatch(/Microsoft YaHei|Noto Sans SC/);
  });

  it("renders detailed-analysis with narrative sections and charts", async () => {
    const html = await engine.render(baseCtx("detailed-analysis"), {
      title: "Deep dive",
      narrativeSections: [{ id: "sec-1", heading: "Channel mix", bodyText: "Meta + Search" }],
      charts: [
        { kind: "bar", title: "Spend", series: [{ label: "A", value: 5 }] },
        { kind: "scatter", title: "Quality", points: [{ x: 1, y: 2 }] },
      ],
      metrics: { columns: ["k"], rows: [{ k: "v" }] },
    });
    expect(html).toContain("Channel mix");
    expect(html).toContain("<svg");
    expect(html).toContain("detailed-metrics");
  });

  it("renders technical-appendix with preformatted blocks", async () => {
    const html = await engine.render(baseCtx("technical-appendix"), {
      title: "Appendix A",
      appendixSections: [{ heading: "Definitions", content: "CTR = clicks / impressions" }],
    });
    expect(html).toContain("Definitions");
    expect(html).toContain("CTR = clicks / impressions");
  });
});
