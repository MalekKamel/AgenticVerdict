import { describe, expect, it } from "vitest";

import { PlatformAuthError, PlatformError, PlatformRateLimitError } from "./errors";
import { isRetryableConnectorError } from "./error-classifier";

describe("isRetryableConnectorError", () => {
  it("treats auth failures as non-retryable", () => {
    expect(isRetryableConnectorError(new PlatformAuthError("meta", "bad"))).toBe(false);
  });

  it("retries rate limits and upstream errors", () => {
    expect(isRetryableConnectorError(new PlatformRateLimitError("meta", "slow"))).toBe(true);
    expect(isRetryableConnectorError(new PlatformError("ga4", "upstream_error", "x"))).toBe(true);
  });

  it("detects transient patterns in generic Errors", () => {
    expect(isRetryableConnectorError(new Error("timeout connecting"))).toBe(true);
    expect(isRetryableConnectorError(new Error("503 unavailable"))).toBe(true);
    expect(isRetryableConnectorError(new Error("400 bad request"))).toBe(false);
    expect(isRetryableConnectorError(new Error("HTTP 429"))).toBe(true);
  });

  it("classifies platform error codes for retry policy", () => {
    expect(isRetryableConnectorError(new PlatformError("ga4", "invalid_request", "x"))).toBe(false);
    expect(isRetryableConnectorError(new PlatformError("ga4", "not_found", "x"))).toBe(false);
    expect(isRetryableConnectorError(new PlatformError("ga4", "missing_tenant_id", "x"))).toBe(
      false,
    );
    expect(isRetryableConnectorError(new PlatformError("ga4", "circuit_open", "x"))).toBe(false);
    expect(isRetryableConnectorError(new PlatformError("ga4", "unknown", "x"))).toBe(true);
  });

  it("returns false for non-Error values", () => {
    expect(isRetryableConnectorError("boom")).toBe(false);
  });
});
