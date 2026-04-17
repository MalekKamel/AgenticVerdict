import { describe, expect, it } from "vitest";

import { TRPCClientError } from "@trpc/client";

import { shouldRetryTrpcMutation, shouldRetryTrpcQuery } from "./trpc-retry-policy";

function makeTrpcError(code: string, httpStatus?: number): TRPCClientError<never> {
  return TRPCClientError.from({
    error: {
      message: "x",
      code: -32_000,
      data: { code, httpStatus },
    },
  });
}

describe("shouldRetryTrpcQuery", () => {
  it("does not retry UNAUTHORIZED", () => {
    expect(shouldRetryTrpcQuery(0, makeTrpcError("UNAUTHORIZED", 401))).toBe(false);
  });

  it("retries INTERNAL_SERVER_ERROR", () => {
    expect(shouldRetryTrpcQuery(0, makeTrpcError("INTERNAL_SERVER_ERROR", 500))).toBe(true);
  });

  it("retries unknown non-tRPC errors (network)", () => {
    expect(shouldRetryTrpcQuery(0, new Error("fetch failed"))).toBe(true);
  });

  it("stops after max attempts", () => {
    expect(shouldRetryTrpcQuery(3, makeTrpcError("INTERNAL_SERVER_ERROR", 500))).toBe(false);
  });
});

describe("shouldRetryTrpcMutation", () => {
  it("does not retry 429", () => {
    expect(shouldRetryTrpcMutation(0, makeTrpcError("TOO_MANY_REQUESTS", 429))).toBe(false);
  });

  it("allows one retry for 503", () => {
    expect(shouldRetryTrpcMutation(0, makeTrpcError("INTERNAL_SERVER_ERROR", 503))).toBe(true);
    expect(shouldRetryTrpcMutation(1, makeTrpcError("INTERNAL_SERVER_ERROR", 503))).toBe(false);
  });
});
