import { describe, expect, it } from "vitest";

import { PlatformAuthError, PlatformError, PlatformRateLimitError } from "../errors";
import { mapGoogleJsonApiHttpError, readGoogleApiJsonBody } from "./http";

describe("mapGoogleJsonApiHttpError", () => {
  it("maps 401 to PlatformAuthError", () => {
    const e = mapGoogleJsonApiHttpError("gbp", 401, {
      error: { message: "nope", status: "UNAUTHENTICATED" },
    });
    expect(e).toBeInstanceOf(PlatformAuthError);
  });

  it("maps 403 to PlatformAuthError", () => {
    const e = mapGoogleJsonApiHttpError("gsc", 403, { error: { message: "denied" } });
    expect(e).toBeInstanceOf(PlatformAuthError);
  });

  it("maps 429 to PlatformRateLimitError", () => {
    const e = mapGoogleJsonApiHttpError("gsc", 429, { error: { message: "slow down" } });
    expect(e).toBeInstanceOf(PlatformRateLimitError);
  });

  it("maps rate-like bodies on non-429 statuses", () => {
    const e = mapGoogleJsonApiHttpError("gbp", 400, {
      error: { message: "RESOURCE_EXHAUSTED", status: "RESOURCE_EXHAUSTED" },
    });
    expect(e).toBeInstanceOf(PlatformRateLimitError);
  });

  it("maps 404 to not_found", () => {
    const e = mapGoogleJsonApiHttpError("gsc", 404, { error: { message: "unknown site" } });
    expect(e).toBeInstanceOf(PlatformError);
    expect(e.code).toBe("not_found");
  });

  it("maps other 4xx to invalid_request", () => {
    const e = mapGoogleJsonApiHttpError("gsc", 412, { error: { message: "precondition" } });
    expect(e).toBeInstanceOf(PlatformError);
    expect(e.code).toBe("invalid_request");
  });

  it("maps 5xx to upstream_error", () => {
    const e = mapGoogleJsonApiHttpError("gsc", 503, { error: { message: "unavailable" } });
    expect(e).toBeInstanceOf(PlatformError);
    expect(e.code).toBe("upstream_error");
  });

  it("falls back to HTTP status text when error.message is empty", () => {
    const e = mapGoogleJsonApiHttpError("gbp", 500, null);
    expect(e).toBeInstanceOf(PlatformError);
    expect(String(e.message)).toContain("HTTP 500");
  });

  it("ignores non-object error fields in the body", () => {
    const e = mapGoogleJsonApiHttpError("gsc", 400, { error: null });
    expect(String(e.message)).toContain("HTTP 400");
  });

  it("treats non-string gRPC messages as empty", () => {
    const e = mapGoogleJsonApiHttpError("gsc", 418, { error: { message: 99 } });
    expect(String(e.message)).toContain("HTTP 418");
  });
});

describe("readGoogleApiJsonBody", () => {
  it("returns null when the body is empty", async () => {
    expect(await readGoogleApiJsonBody(new Response("", { status: 200 }))).toBeNull();
  });

  it("returns a wrapper object when JSON.parse fails", async () => {
    const v = await readGoogleApiJsonBody(new Response("not-json", { status: 200 }));
    expect(v).toEqual(expect.objectContaining({ _parseFailure: expect.any(String) }));
  });
});
