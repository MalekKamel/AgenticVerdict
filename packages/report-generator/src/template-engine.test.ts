import { describe, expect, it } from "vitest";

import { PlaceholderTemplateEngine } from "./template-engine";

describe("PlaceholderTemplateEngine", () => {
  it("escapes HTML in serialized model preview", async () => {
    const html = await new PlaceholderTemplateEngine().render(
      { tenantId: "t", reportId: "r", locale: "en", templateId: "x" },
      { a: "<script>" },
    );
    expect(html).toContain("template:x");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
