import { afterEach, describe, expect, it, vi } from "vitest";

import { createAppShellPreferencesStorageKey, storageKeys } from "./keys";
import { getStorageJson, getStorageItem, removeStorageItem, setStorageItem } from "./core";

describe("local-storage utility", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("reads and writes plain values", () => {
    expect(setStorageItem(storageKeys.preferredLocale, "fr")).toBe(true);
    expect(getStorageItem(storageKeys.preferredLocale)).toBe("fr");
  });

  it("returns fallback for malformed JSON", () => {
    window.localStorage.setItem("invalid-json", "{broken");
    const fallback = { desktopNavCollapsed: false };

    const value = getStorageJson("invalid-json", fallback);
    expect(value).toEqual(fallback);
  });

  it("returns fallback when validation fails", () => {
    window.localStorage.setItem("prefs", JSON.stringify({ desktopNavCollapsed: "yes" }));

    const value = getStorageJson(
      "prefs",
      { desktopNavCollapsed: false },
      {
        validate: (parsed): parsed is { desktopNavCollapsed: boolean } =>
          typeof parsed === "object" &&
          parsed !== null &&
          typeof (parsed as { desktopNavCollapsed?: unknown }).desktopNavCollapsed === "boolean",
      },
    );

    expect(value).toEqual({ desktopNavCollapsed: false });
  });

  it("fails safely when localStorage access throws", () => {
    const failingStorage = {
      getItem: vi.fn(() => {
        throw new Error("blocked");
      }),
      setItem: vi.fn(() => {
        throw new Error("blocked");
      }),
      removeItem: vi.fn(() => {
        throw new Error("blocked");
      }),
    };

    vi.stubGlobal("window", { localStorage: failingStorage });

    expect(getStorageItem("x")).toBeNull();
    expect(setStorageItem("x", "y")).toBe(false);
    expect(removeStorageItem("x")).toBe(false);
  });

  it("builds tenant/user scoped preference keys", () => {
    expect(createAppShellPreferencesStorageKey("tenant-a", "user-b")).toBe(
      "app-shell-preferences:tenant-a:user-b",
    );
    expect(createAppShellPreferencesStorageKey(undefined, undefined)).toBe(
      "app-shell-preferences:anonymous-tenant:anonymous-user",
    );
  });
});
