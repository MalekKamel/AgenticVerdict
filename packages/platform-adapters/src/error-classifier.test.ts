import { describe, expect, it } from "vitest";

import { PlatformAuthError, PlatformError, PlatformRateLimitError } from "./errors";
import { isRetryablePlatformError } from "./error-classifier";

describe("isRetryablePlatformError", () => {
  it("treats auth failures as non-retryable", () => {
    expect(isRetryablePlatformError(new PlatformAuthError("meta", "bad"))).toBe(false);
  });

  it("retries rate limits and upstream errors", () => {
    expect(isRetryablePlatformError(new PlatformRateLimitError("meta", "slow"))).toBe(true);
    expect(isRetryablePlatformError(new PlatformError("ga4", "upstream_error", "x"))).toBe(true);
  });

  it("detects transient patterns in generic Errors", () => {
    expect(isRetryablePlatformError(new Error("timeout connecting"))).toBe(true);
    expect(isRetryablePlatformError(new Error("503 unavailable"))).toBe(true);
    expect(isRetryablePlatformError(new Error("400 bad request"))).toBe(false);
    expect(isRetryablePlatformError(new Error("HTTP 429"))).toBe(true);
  });

  it("classifies platform error codes for retry policy", () => {
    expect(isRetryablePlatformError(new PlatformError("ga4", "invalid_request", "x"))).toBe(false);
    expect(isRetryablePlatformError(new PlatformError("ga4", "not_found", "x"))).toBe(false);
    expect(isRetryablePlatformError(new PlatformError("ga4", "missing_tenant_id", "x"))).toBe(
      false,
    );
    expect(isRetryablePlatformError(new PlatformError("ga4", "circuit_open", "x"))).toBe(false);
    expect(isRetryablePlatformError(new PlatformError("ga4", "unknown", "x"))).toBe(true);
  });

  it("returns false for non-Error values", () => {
    expect(isRetryablePlatformError("boom")).toBe(false);
  });
});
