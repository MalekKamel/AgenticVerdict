import { describe, expect, it } from "vitest";

import {
  appLocaleFromLanguageTag,
  detectPreferredAppLocale,
  normalizeToAppLocale,
} from "./language-detection";

describe("detectPreferredAppLocale", () => {
  it("returns fallback when header is empty", () => {
    expect(detectPreferredAppLocale(undefined, "ar")).toBe("ar");
    expect(detectPreferredAppLocale("", "fr")).toBe("fr");
  });

  it("respects quality values and order", () => {
    expect(detectPreferredAppLocale("fr;q=0.8, en;q=0.9", "zh")).toBe("en");
    expect(detectPreferredAppLocale("es-ES, en;q=0.5", "en")).toBe("es");
  });

  it("maps Chinese and Spanish subtags", () => {
    expect(detectPreferredAppLocale("zh-Hans-CN", "en")).toBe("zh");
    expect(detectPreferredAppLocale("es-MX", "en")).toBe("es");
  });
});

describe("appLocaleFromLanguageTag", () => {
  it("returns null for unsupported bases", () => {
    expect(appLocaleFromLanguageTag("de")).toBeNull();
    expect(appLocaleFromLanguageTag("")).toBeNull();
  });
});

describe("normalizeToAppLocale", () => {
  it("strips region and script", () => {
    expect(normalizeToAppLocale("zh-CN", "en")).toBe("zh");
    expect(normalizeToAppLocale("EN-gb", "ar")).toBe("en");
  });
});
