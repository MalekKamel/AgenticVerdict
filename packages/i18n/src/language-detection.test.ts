import { describe, expect, it, vi, afterEach } from "vitest";

import {
  appLocaleFromLanguageTag,
  detectPreferredAppLocale,
  detectPreferredBrowserLocale,
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

describe("detectPreferredBrowserLocale", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns fallback when window is undefined", () => {
    vi.stubGlobal("window", undefined);
    expect(detectPreferredBrowserLocale(() => "en", "fr")).toBe("fr");
  });

  it("returns matched locale from navigator.languages", () => {
    vi.stubGlobal("window", { navigator: { languages: ["de", "fr", "en"] } });
    expect(detectPreferredBrowserLocale(() => null, "ar")).toBe("fr");
  });

  it("returns fallback when no browser language matches", () => {
    vi.stubGlobal("window", { navigator: { languages: ["de", "ja"] } });
    expect(detectPreferredBrowserLocale(() => null, "zh")).toBe("zh");
  });

  it("falls back to persisted preference when browser languages do not match", () => {
    vi.stubGlobal("window", { navigator: { languages: ["de"] } });
    expect(detectPreferredBrowserLocale(() => "es-MX", "ar")).toBe("es");
  });

  it("normalizes persisted preference via normalizeToAppLocale", () => {
    vi.stubGlobal("window", { navigator: { languages: ["ko"] } });
    expect(detectPreferredBrowserLocale(() => "EN-GB", "ar")).toBe("en");
  });

  it("returns fallback when persisted preference is null", () => {
    vi.stubGlobal("window", { navigator: { languages: ["pt"] } });
    expect(detectPreferredBrowserLocale(() => null, "zh")).toBe("zh");
  });

  it("uses first matching browser language by priority", () => {
    vi.stubGlobal("window", { navigator: { languages: ["zh-CN", "en-US", "es"] } });
    expect(detectPreferredBrowserLocale(() => null, "ar")).toBe("zh");
  });

  it("handles missing navigator.languages", () => {
    vi.stubGlobal("window", { navigator: {} });
    expect(detectPreferredBrowserLocale(() => "fr", "en")).toBe("fr");
  });
});
