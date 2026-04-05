import { describe, expect, it } from "vitest";

import { resolveReportTextDirection } from "./document-direction";

describe("resolveReportTextDirection", () => {
  it("uses locale when override is undefined", () => {
    expect(resolveReportTextDirection("ar", undefined)).toBe("rtl");
    expect(resolveReportTextDirection("en", undefined)).toBe("ltr");
  });

  it("honors explicit override", () => {
    expect(resolveReportTextDirection("ar", "ltr")).toBe("ltr");
    expect(resolveReportTextDirection("en", "rtl")).toBe("rtl");
  });
});
