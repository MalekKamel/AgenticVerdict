import { describe, expect, it } from "vitest";

import { reportBodyFontStack } from "./typography";

describe("reportBodyFontStack", () => {
  it("selects Arabic-friendly stacks", () => {
    expect(reportBodyFontStack("ar")).toContain("Naskh");
  });

  it("selects CJK stacks", () => {
    expect(reportBodyFontStack("zh-CN")).toContain("YaHei");
  });

  it("defaults to system UI stack", () => {
    expect(reportBodyFontStack("en")).toContain("system-ui");
  });
});
