import { describe, expect, it } from "vitest";

import {
  toHttpErrorResponse,
  toQueueFailure,
  toTrpcErrorCode,
  toTrpcErrorMeta,
  toWorkerFailure,
} from "./error-translators";
import { AppFault } from "./errors";
import { TenantSecurityError } from "./tenant-security-error";

describe("error boundary integration coverage", () => {
  it("maps tenant security failures across tRPC code and metadata", () => {
    const tenantError = new TenantSecurityError("TENANT_CONTEXT_REQUIRED", "tenant required", 400);
    expect(toTrpcErrorCode(tenantError)).toBe("BAD_REQUEST");

    const tenantFault = new AppFault({
      code: "TENANT_CONTEXT_REQUIRED",
      category: "tenant",
      httpStatus: 400,
      retryable: false,
      safeMessage: "Tenant context is required.",
      surface: "trpc",
    });
    const translated = toTrpcErrorMeta(tenantFault);
    expect(translated.code).toBe("TENANT_CONTEXT_REQUIRED");
    expect(translated.category).toBe("tenant");
  });

  it("maps validation failures for HTTP boundaries", () => {
    const translated = toHttpErrorResponse(
      new AppFault({
        code: "VALIDATION_FAILED",
        category: "validation",
        httpStatus: 422,
        retryable: false,
        safeMessage: "Validation failed.",
        surface: "http",
      }),
      "req-validation",
    );
    expect(translated.statusCode).toBe(422);
    expect(translated.body.error.code).toBe("VALIDATION_FAILED");
  });

  it("maps queue unavailable failures for queue boundaries", () => {
    const translated = toQueueFailure(
      new AppFault({
        code: "QUEUE_UNAVAILABLE",
        category: "dependency",
        httpStatus: 503,
        retryable: true,
        safeMessage: "Queue infrastructure is unavailable.",
        surface: "queue",
      }),
    );
    expect(translated.code).toBe("QUEUE_UNAVAILABLE");
    expect(translated.retryable).toBe(true);
  });

  it("maps DB conflicts for HTTP boundaries", () => {
    const translated = toHttpErrorResponse(
      new AppFault({
        code: "DB_CONFLICT",
        category: "conflict",
        httpStatus: 409,
        retryable: false,
        safeMessage: "Database conflict.",
        surface: "http",
      }),
    );
    expect(translated.statusCode).toBe(409);
    expect(translated.body.error.code).toBe("DB_CONFLICT");
  });

  it("maps connector failures for worker boundaries", () => {
    const translated = toWorkerFailure(
      new AppFault({
        code: "CONNECTOR_UPSTREAM_FAILURE",
        category: "dependency",
        httpStatus: 502,
        retryable: true,
        safeMessage: "Connector upstream failure.",
        surface: "worker",
      }),
    );
    expect(translated.code).toBe("CONNECTOR_UPSTREAM_FAILURE");
    expect(translated.details.surface).toBe("worker");
  });
});
