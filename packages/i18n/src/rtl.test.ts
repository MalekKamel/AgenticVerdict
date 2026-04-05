import { describe, expect, it } from "vitest";

import { isRtlLocale, textDirection } from "./rtl";

describe("rtl helpers", () => {
  it("detects Urdu as RTL", () => {
    expect(isRtlLocale("ur")).toBe(true);
    expect(isRtlLocale("ur-PK")).toBe(true);
  });

  it("detects Arabic locales", () => {
    expect(isRtlLocale("ar")).toBe(true);
    expect(isRtlLocale("ar-SA")).toBe(true);
    expect(textDirection("ar")).toBe("rtl");
  });

  it("treats English as LTR", () => {
    expect(isRtlLocale("en")).toBe(false);
    expect(textDirection("en")).toBe("ltr");
  });
});
