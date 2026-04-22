import { describe, expect, it } from "vitest";

import { sanitizeDeepLinkUrl } from "./deep-link";

describe("sanitizeDeepLinkUrl", () => {
  it("allows locale paths", () => {
    expect(sanitizeDeepLinkUrl("agenticverdict:///en/dashboard")).toBe(
      "agenticverdict:///en/dashboard",
    );
  });

  it("allows auth hostname (OAuth-style)", () => {
    expect(sanitizeDeepLinkUrl("agenticverdict://auth/callback?code=1")).toBe(
      "agenticverdict://auth/callback?code=1",
    );
  });

  it("rejects unknown paths", () => {
    expect(sanitizeDeepLinkUrl("agenticverdict:///evil")).toBeNull();
  });

  it("rejects non-protocol", () => {
    expect(sanitizeDeepLinkUrl("https://example.com/")).toBeNull();
  });
});
