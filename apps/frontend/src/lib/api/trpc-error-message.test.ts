import { describe, expect, it } from "vitest";

import { TRPCClientError } from "@trpc/client";

import { getTrpcSafeUserMessage } from "./trpc-error-message";

describe("getTrpcSafeUserMessage", () => {
  it("returns a safe fallback for generic errors", () => {
    expect(getTrpcSafeUserMessage(new Error("boom"))).toBe("errors.common.unknownError");
  });

  it("returns a fallback for non-Error values", () => {
    expect(getTrpcSafeUserMessage(undefined)).toBe("errors.common.unknownError");
  });

  it("does not leak raw tRPC message in user-facing fallback", () => {
    const err = TRPCClientError.from({
      error: {
        message: "Not allowed",
        code: -32_000,
        data: { code: "FORBIDDEN", httpStatus: 403 },
      },
    });
    expect(getTrpcSafeUserMessage(err)).toBe("errors.auth.forbidden");
  });
});
