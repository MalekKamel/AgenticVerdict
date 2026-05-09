import { afterEach, describe, expect, it } from "vitest";

import { detectLocale } from "./i18n";

describe("detectLocale", () => {
  const originalLanguages = window.navigator.languages;

  afterEach(() => {
    window.localStorage.clear();
    Object.defineProperty(window.navigator, "languages", {
      configurable: true,
      value: originalLanguages,
    });
  });

  it("returns persisted locale when supported", () => {
    window.localStorage.setItem("preferred-locale", "fr");
    expect(detectLocale()).toBe("fr");
  });

  it("falls back to browser language when persisted locale is unsupported", () => {
    window.localStorage.setItem("preferred-locale", "de");
    Object.defineProperty(window.navigator, "languages", {
      configurable: true,
      value: ["ar-SA", "en-US"],
    });

    expect(detectLocale()).toBe("ar");
  });
});
