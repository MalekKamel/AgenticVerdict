import { describe, expect, it } from "vitest";

import { TRPCClientError } from "@trpc/client";

import { getTrpcSafeUserMessage } from "./trpc-error-message";

describe("getTrpcSafeUserMessage", () => {
  it("returns a message for generic errors", () => {
    expect(getTrpcSafeUserMessage(new Error("boom"))).toBe("boom");
  });

  it("returns a fallback for non-Error values", () => {
    expect(getTrpcSafeUserMessage(undefined)).toBe("Something went wrong. Please try again.");
  });

  it("returns tRPC message for TRPCClientError", () => {
    const err = TRPCClientError.from({
      error: {
        message: "Not allowed",
        code: -32_000,
        data: { code: "FORBIDDEN", httpStatus: 403 },
      },
    });
    expect(getTrpcSafeUserMessage(err)).toContain("Not allowed");
  });
});
