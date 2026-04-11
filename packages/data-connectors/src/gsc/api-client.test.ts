import { describe, expect, it, vi } from "vitest";

import { PlatformAuthError } from "../errors";
import {
  encodeGscSiteUrl,
  gscUrlInspectionPost,
  gscWebmastersGet,
  gscWebmastersPost,
} from "./api-client";

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("encodeGscSiteUrl", () => {
  it("percent-encodes site URLs for path segments", () => {
    expect(encodeGscSiteUrl("https://example.com/")).toContain("%3A");
  });
});

describe("gscWebmastersGet", () => {
  it("maps HTTP errors through Google error helper", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(jsonResponse({ error: { message: "Forbidden" } }, 403));
    await expect(
      gscWebmastersGet("/sites/foo/sitemaps", {
        accessToken: "t",
        fetchImpl,
        connector: "gsc",
      }),
    ).rejects.toThrow(PlatformAuthError);
  });
});

describe("gscWebmastersPost", () => {
  it("maps HTTP errors for search analytics", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ error: { message: "Bad" } }, 400));
    await expect(
      gscWebmastersPost(
        "/sites/foo/searchAnalytics/query",
        { startDate: "2025-01-01", endDate: "2025-01-02" },
        { accessToken: "t", fetchImpl },
      ),
    ).rejects.toThrow();
  });
});

describe("gscUrlInspectionPost", () => {
  it("maps HTTP errors", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ error: { message: "Nope" } }, 404));
    await expect(
      gscUrlInspectionPost(
        { siteUrl: "https://a.com/", inspectionUrl: "https://a.com/x" },
        {
          accessToken: "t",
          fetchImpl,
        },
      ),
    ).rejects.toThrow();
  });
});
