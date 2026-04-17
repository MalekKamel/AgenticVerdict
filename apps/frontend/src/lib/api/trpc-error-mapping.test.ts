import { describe, expect, it } from "vitest";

import { TRPCClientError } from "@trpc/client";

import { trpcClientErrorToAppError } from "./trpc-error-mapping";

function makeTrpc(code: string, httpStatus?: number, message = "m"): TRPCClientError<never> {
  return TRPCClientError.from({
    error: {
      message,
      code: -32_000,
      data: { code, httpStatus },
    },
  });
}

describe("trpcClientErrorToAppError", () => {
  it("returns null for non-tRPC errors", () => {
    expect(trpcClientErrorToAppError(new Error("x"))).toBeNull();
  });

  it("maps UNAUTHORIZED to auth", () => {
    const app = trpcClientErrorToAppError(makeTrpc("UNAUTHORIZED", 401));
    expect(app?.type).toBe("auth");
  });

  it("maps 503 to server service unavailable", () => {
    const app = trpcClientErrorToAppError(makeTrpc("INTERNAL_SERVER_ERROR", 503));
    expect(app?.type).toBe("server");
    if (app && app.type === "server") {
      expect(app.code).toBe("SERVER_SERVICE_UNAVAILABLE");
    }
  });
});
