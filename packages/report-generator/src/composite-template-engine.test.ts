import { describe, expect, it } from "vitest";

import {
  CompositeTemplateEngine,
  createDefaultCompositeTemplateEngine,
} from "./composite-template-engine";
import { PlaceholderTemplateEngine } from "./template-engine";
import type { TemplateHtmlOverrideSource } from "./template-override-source";
import { createBuiltInTemplateMap } from "./templates/built-in-registry";
import type { ReportGenerationContext } from "./types";

const ctx = (overrides: Partial<ReportGenerationContext> = {}): ReportGenerationContext => ({
  tenantId: "tenant-a",
  reportId: "rep-1",
  locale: "en",
  templateId: "executive-summary",
  ...overrides,
});

describe("CompositeTemplateEngine", () => {
  it("renders built-in template when no override exists", async () => {
    const engine = createDefaultCompositeTemplateEngine();
    const html = await engine.render(ctx(), { title: "T", executiveSummary: "S" });
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Executive overview");
    expect(html).toContain("T");
  });

  it("prefers tenant HTML override when provided", async () => {
    const overrides: TemplateHtmlOverrideSource = {
      async getLatestHtml(tenantId, templateId) {
        if (tenantId === "tenant-a" && templateId === "executive-summary") {
          return "<!DOCTYPE html><html><body>OVERRIDE</body></html>";
        }
        return null;
      },
    };
    const engine = createDefaultCompositeTemplateEngine(overrides);
    const html = await engine.render(ctx(), { title: "Ignored" });
    expect(html).toContain("OVERRIDE");
    expect(html).not.toContain("Ignored");
  });

  it("falls back to PlaceholderTemplateEngine for unknown template ids", async () => {
    const engine = new CompositeTemplateEngine(
      createBuiltInTemplateMap(),
      undefined,
      new PlaceholderTemplateEngine(),
    );
    const html = await engine.render(ctx({ templateId: "unknown-tpl" }), { a: 1 });
    expect(html).toContain("template:unknown-tpl");
  });
});
