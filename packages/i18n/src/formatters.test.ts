import { describe, expect, it } from "vitest";

import { createLocalizationFormatters, intlLocaleTag } from "./formatters";

describe("intlLocaleTag", () => {
  it("combines locale and ISO region", () => {
    expect(intlLocaleTag("en", "sa")).toBe("en-SA");
    expect(intlLocaleTag("ar", "SA")).toBe("ar-SA");
  });

  it("falls back when region is not two letters", () => {
    expect(intlLocaleTag("en", "")).toBe("en-US");
    expect(intlLocaleTag("ar", "invalid")).toBe("ar-SA");
  });
});

describe("createLocalizationFormatters", () => {
  const base = {
    region: "SA",
    timezone: "Asia/Riyadh",
    currency: "SAR",
  } as const;

  it("formats currency using tenant currency", () => {
    const { formatCurrency } = createLocalizationFormatters("en", base);
    const out = formatCurrency(1_234.5);
    expect(out).toMatch(/1/);
    expect(out).toMatch(/234/);
  });

  it("formats dates in tenant timezone", () => {
    const { formatDate } = createLocalizationFormatters("en", base);
    const d = new Date("2026-01-15T21:00:00.000Z");
    const s = formatDate(d, { dateStyle: "short" });
    expect(s.length).toBeGreaterThan(4);
  });

  it("returns plural categories", () => {
    const { pluralCategory } = createLocalizationFormatters("ar", base);
    expect(["zero", "one", "two", "few", "many", "other"]).toContain(pluralCategory(0));
  });
});
