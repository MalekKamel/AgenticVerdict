import { describe, expect, it } from "vitest";

import { DefaultReportGenerator } from "./base-report-generator";
import { createDefaultCompositeTemplateEngine } from "./composite-template-engine";
import { createStubFormatRegistry } from "./format-registry";
import { PlaceholderTemplateEngine } from "./template-engine";

describe("DefaultReportGenerator", () => {
  it("renders template then runs format generator", async () => {
    const engine = new PlaceholderTemplateEngine();
    const registry = createStubFormatRegistry();
    const gen = new DefaultReportGenerator(registry, engine);
    const bytes = await gen.generate(
      {
        tenantId: "tenant",
        reportId: "rep",
        locale: "ar",
        templateId: "t1",
      },
      { headline: "Q1" },
      "pdf",
    );
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain("format=pdf");
    expect(text).toContain("template=t1");
  });

  it("uses built-in executive template when templateId matches catalog", async () => {
    const engine = createDefaultCompositeTemplateEngine();
    const registry = createStubFormatRegistry();
    const gen = new DefaultReportGenerator(registry, engine);
    const bytes = await gen.generate(
      {
        tenantId: "tenant",
        reportId: "rep",
        locale: "en",
        templateId: "executive-summary",
      },
      { title: "Q1 Review", executiveSummary: "Strong quarter." },
      "pdf",
    );
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain("format=pdf");
    expect(text).toMatch(/renderedBytes=\d+/);
    expect(Number((text.match(/renderedBytes=(\d+)/) ?? ["", "0"])[1])).toBeGreaterThan(200);
  });
});
