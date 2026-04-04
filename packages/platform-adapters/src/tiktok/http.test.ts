import { describe, expect, it } from "vitest";

import { PlatformAuthError, PlatformError, PlatformRateLimitError } from "../errors";
import {
  assertTikTokSuccess,
  mapTikTokBusinessCode,
  mapTikTokHttpError,
  tiktokOpenApiOrigin,
  tiktokParseResponse,
} from "./http";

describe("mapTikTokBusinessCode", () => {
  it("maps known auth codes to PlatformAuthError", () => {
    const e = mapTikTokBusinessCode(40_102, "bad token", {});
    expect(e).toBeInstanceOf(PlatformAuthError);
    expect(e).toMatchObject({ platform: "tiktok", code: "auth_failed" });
  });

  it("maps rate-style codes to PlatformRateLimitError", () => {
    const e = mapTikTokBusinessCode(40_202, "limit", {});
    expect(e).toBeInstanceOf(PlatformRateLimitError);
  });

  it("maps retryable upstream codes to PlatformError upstream_error", () => {
    const e = mapTikTokBusinessCode(50_000, "try later", {});
    expect(e).toBeInstanceOf(PlatformError);
    expect(e).toMatchObject({ platform: "tiktok", code: "upstream_error" });
  });

  it("maps other 4xx business codes to invalid_request", () => {
    const e = mapTikTokBusinessCode(40_999, "bad arg", {});
    expect(e).toBeInstanceOf(PlatformError);
    expect(e).toMatchObject({ platform: "tiktok", code: "invalid_request" });
  });
});

describe("mapTikTokHttpError", () => {
  it("maps HTTP 429", () => {
    const e = mapTikTokHttpError(429, { code: 0, message: "slow down" });
    expect(e).toBeInstanceOf(PlatformRateLimitError);
  });

  it("maps HTTP 401 to auth", () => {
    const e = mapTikTokHttpError(401, { code: 0, message: "nope" });
    expect(e).toBeInstanceOf(PlatformAuthError);
  });

  it("maps HTTP 403 to auth", () => {
    const e = mapTikTokHttpError(403, {});
    expect(e).toBeInstanceOf(PlatformAuthError);
  });

  it("prefers business code in body for 4xx responses", () => {
    const e = mapTikTokHttpError(400, { code: 40_102, message: "token" });
    expect(e).toBeInstanceOf(PlatformAuthError);
  });

  it("maps unknown 5xx to upstream_error", () => {
    const e = mapTikTokHttpError(503, { code: 0, message: "down" });
    expect(e).toBeInstanceOf(PlatformError);
    expect(e).toMatchObject({ code: "upstream_error" });
  });

  it("maps 404-class client errors without business code to invalid_request", () => {
    const e = mapTikTokHttpError(404, { code: 0, message: "missing" });
    expect(e).toMatchObject({ code: "invalid_request" });
  });
});

describe("assertTikTokSuccess", () => {
  it("throws on missing envelope", () => {
    expect(() => assertTikTokSuccess(null)).toThrow(PlatformError);
  });

  it("throws on non-zero code", () => {
    expect(() => assertTikTokSuccess({ code: 40_999, message: "x" })).toThrow(PlatformError);
  });
});

describe("tiktokParseResponse", () => {
  it("parses ok responses", async () => {
    const res = new Response(JSON.stringify({ code: 0, message: "OK", data: { a: 1 } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    const env = await tiktokParseResponse(res);
    expect(env.data).toEqual({ a: 1 });
  });

  it("throws on non-JSON ok responses", async () => {
    const res = new Response("not-json", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    await expect(tiktokParseResponse(res)).rejects.toThrow(PlatformError);
  });
});

describe("tiktokOpenApiOrigin", () => {
  it("selects sandbox vs production host", () => {
    expect(tiktokOpenApiOrigin(true)).toContain("sandbox-ads");
    expect(tiktokOpenApiOrigin(false)).toContain("business-api");
  });
});
