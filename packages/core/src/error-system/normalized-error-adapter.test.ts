import { describe, expect, it } from "vitest";
import { TRPCClientError } from "@trpc/client";

import { normalizeFrontendError } from "./normalized-error-adapter";

function makeTrpcWithCanonical() {
  return TRPCClientError.from({
    error: {
      message: "boom",
      code: -32000,
      data: {
        code: "INTERNAL_SERVER_ERROR",
        httpStatus: 503,
        canonicalError: {
          code: "QUEUE_UNAVAILABLE",
          category: "dependency",
          retryable: true,
          surface: "trpc",
          details: {
            requestId: "req-123",
            retryAfterSeconds: 3,
            messageParams: {
              retryCount: 2,
              retryNow: true,
            },
          },
        },
      },
    },
  });
}

describe("normalizeFrontendError", () => {
  it("maps canonical tRPC payloads to normalized UI model", () => {
    const normalized = normalizeFrontendError(makeTrpcWithCanonical());
    expect(normalized.code).toBe("QUEUE_UNAVAILABLE");
    expect(normalized.messageKey).toBe("errors.common.tryAgain");
    expect(normalized.retryable).toBe(true);
    expect(normalized.retryAfterMs).toBe(3000);
    expect(normalized.correlationId).toBe("req-123");
    expect(normalized.messageParams).toEqual({
      retryCount: 2,
      retryNow: true,
    });
  });

  it("falls back to safe defaults for unknown canonical values", () => {
    const unknownCanonical = TRPCClientError.from({
      error: {
        message: "backend message should not control UI key",
        code: -32000,
        data: {
          code: "INTERNAL_SERVER_ERROR",
          httpStatus: 500,
          canonicalError: {
            code: "UNKNOWN_DOMAIN_ERROR",
            category: "unknown-category",
            retryable: false,
            surface: "unknown-surface",
          },
        },
      },
    });

    const normalized = normalizeFrontendError(unknownCanonical);
    expect(normalized.code).toBe("INTERNAL_ERROR");
    expect(normalized.category).toBe("internal");
    expect(normalized.surface).toBe("frontend");
    expect(normalized.messageKey).toBe("errors.common.unknownError");
  });

  it("uses safe fallback for unknown errors", () => {
    const normalized = normalizeFrontendError(new Error("sensitive details"));
    expect(normalized.code).toBe("INTERNAL_ERROR");
    expect(normalized.messageKey).toBe("errors.common.unknownError");
    expect(normalized.retryable).toBe(false);
  });
});
