import { describe, it, expect } from "vitest";
import { resolveLocale, setTranslation, validateTranslations } from "./localization";

describe("resolveLocale", () => {
  it("returns value for requested locale when present", () => {
    const translations = { en: "Hello", ar: "مرحبا", fr: "Bonjour" };
    expect(resolveLocale(translations, "ar")).toBe("مرحبا");
  });

  it("falls back to English when requested locale is missing", () => {
    const translations = { en: "Hello", fr: "Bonjour" };
    expect(resolveLocale(translations, "es")).toBe("Hello");
  });

  it("falls back to first available value when English is also missing", () => {
    const translations = { es: "Hola", de: "Hallo" };
    expect(resolveLocale(translations, "zh")).toBe("Hola");
  });

  it("returns empty string for null/undefined translations", () => {
    expect(resolveLocale(null, "en")).toBe("");
    expect(resolveLocale(undefined, "en")).toBe("");
  });

  it("returns empty string for empty translations object", () => {
    expect(resolveLocale({}, "en")).toBe("");
  });

  it("uses custom fallback locale when provided", () => {
    const translations = { fr: "Bonjour", es: "Hola" };
    expect(resolveLocale(translations, "zh", "fr")).toBe("Bonjour");
  });
});

describe("setTranslation", () => {
  it("adds a new locale entry", () => {
    const original = { en: "Hello" };
    const result = setTranslation(original, "ar", "مرحبا");
    expect(result).toEqual({ en: "Hello", ar: "مرحبا" });
  });

  it("overwrites existing locale entry", () => {
    const original = { en: "Hello" };
    const result = setTranslation(original, "en", "Hi");
    expect(result).toEqual({ en: "Hi" });
  });

  it("does not mutate the original object", () => {
    const original = { en: "Hello" };
    setTranslation(original, "ar", "مرحبا");
    expect(original).toEqual({ en: "Hello" });
  });
});

describe("validateTranslations", () => {
  it("returns empty array for valid translations", () => {
    const translations = { en: "Hello", ar: "مرحبا" };
    expect(validateTranslations(translations, ["en", "ar", "fr"])).toEqual([]);
  });

  it("returns invalid locale keys", () => {
    const translations = { en: "Hello", xx: "Unknown", yy: "Also unknown" };
    expect(validateTranslations(translations, ["en", "ar", "fr"])).toEqual(["xx", "yy"]);
  });

  it("returns empty array for empty translations", () => {
    expect(validateTranslations({}, ["en", "ar"])).toEqual([]);
  });
});
