import { describe, expect, it } from "vitest";

import { AuthMutationError } from "./usePasswordReset";

describe("AuthMutationError", () => {
  it("normalizes numeric retry-after details", () => {
    const error = new AuthMutationError("auth.errors.rateLimitExceeded", "RATE_LIMIT_EXCEEDED", {
      retryAfter: 42,
    });
    expect(error.retryAfterSeconds).toBe(42);
  });

  it("normalizes string retry-after details", () => {
    const error = new AuthMutationError("auth.errors.rateLimitExceeded", "RATE_LIMIT_EXCEEDED", {
      retryAfter: "15",
    });
    expect(error.retryAfterSeconds).toBe(15);
  });

  it("returns null retry-after when unavailable", () => {
    const error = new AuthMutationError("auth.errors.internalError", "INTERNAL_ERROR");
    expect(error.retryAfterSeconds).toBeNull();
  });
});
