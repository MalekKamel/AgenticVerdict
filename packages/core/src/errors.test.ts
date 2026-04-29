import { describe, expect, it } from "vitest";

import { AppFault, assertRegisteredErrorCode, isAppFault, toAppFault } from "./errors";

describe("errors core", () => {
  it("creates AppFault with canonical primitives", () => {
    const fault = new AppFault({
      code: "TENANT_CONTEXT_REQUIRED",
      category: "tenant",
      httpStatus: 400,
      retryable: false,
      safeMessage: "Tenant context is required.",
      details: { source: "request" },
      surface: "http",
    });

    expect(fault).toBeInstanceOf(Error);
    expect(fault.code).toBe("TENANT_CONTEXT_REQUIRED");
    expect(fault.category).toBe("tenant");
    expect(fault.httpStatus).toBe(400);
    expect(fault.retryable).toBe(false);
    expect(fault.safeMessage).toBe("Tenant context is required.");
    expect(fault.details).toEqual({ source: "request" });
    expect(fault.surface).toBe("http");
  });

  it("detects canonical faults through type guard", () => {
    const appFault = new AppFault({
      code: "VALIDATION_FAILED",
      category: "validation",
      httpStatus: 422,
      retryable: false,
      safeMessage: "Validation failed.",
    });

    expect(isAppFault(appFault)).toBe(true);
    expect(isAppFault(new Error("plain"))).toBe(false);
    expect(isAppFault("not-an-error")).toBe(false);
  });

  it("normalizes unknown errors with deterministic defaults", () => {
    const original = new Error("sensitive");
    const normalized = toAppFault(original, { surface: "worker" });

    expect(normalized.code).toBe("INTERNAL_ERROR");
    expect(normalized.category).toBe("internal");
    expect(normalized.httpStatus).toBe(500);
    expect(normalized.retryable).toBe(false);
    expect(normalized.safeMessage).toBe("errors.common.unknownError");
    expect(normalized.surface).toBe("worker");
    expect(normalized.cause).toBe(original);
  });

  it("returns the same instance when already canonical", () => {
    const appFault = new AppFault({
      code: "QUEUE_UNAVAILABLE",
      category: "dependency",
      httpStatus: 503,
      retryable: true,
      safeMessage: "Queue unavailable.",
    });

    expect(toAppFault(appFault)).toBe(appFault);
  });

  it("throws when unregistered code guard fails", () => {
    expect(() => assertRegisteredErrorCode("NOT_REGISTERED")).toThrow(
      expect.objectContaining({
        name: "AppFault",
        code: "INTERNAL_ERROR",
      }),
    );
  });
});
