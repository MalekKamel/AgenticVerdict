import { describe, expect, it } from "vitest";

import { AppFault } from "./errors";
import {
  toHttpErrorResponse,
  toQueueFailure,
  toTrpcErrorCode,
  toTrpcErrorMeta,
  toWorkerFailure,
} from "./error-translators";
import { TenantSecurityError } from "./tenant-security-error";

describe("error translators", () => {
  it("translates faults for HTTP responses", () => {
    const translated = toHttpErrorResponse(
      new AppFault({
        code: "DB_CONFLICT",
        category: "conflict",
        httpStatus: 409,
        retryable: false,
        safeMessage: "Conflict while saving data.",
      }),
      "req-1",
    );

    expect(translated.statusCode).toBe(409);
    expect(translated.body.requestId).toBe("req-1");
    expect(translated.body.error.code).toBe("DB_CONFLICT");
  });

  it("translates unknown values to safe tRPC metadata", () => {
    const translated = toTrpcErrorMeta(new Error("internal failure"), {
      requestId: "req-123",
      correlationId: "corr-123",
      trpcPath: "dashboard.get",
    });

    expect(translated.code).toBe("INTERNAL_ERROR");
    expect(translated.category).toBe("internal");
    expect(translated.surface).toBe("trpc");
    expect(translated.details.requestId).toBe("req-123");
    expect(translated.details.correlationId).toBe("corr-123");
    expect(translated.details.trpcPath).toBe("dashboard.get");
  });

  it("maps tenant security status to tRPC error code", () => {
    const translated = toTrpcErrorCode(
      new TenantSecurityError("TENANT_CONTEXT_REQUIRED", "missing tenant context", 400),
    );
    expect(translated).toBe("BAD_REQUEST");
  });

  it("maps 409 and 504 statuses to richer tRPC transport codes", () => {
    const conflict = toTrpcErrorCode(
      new AppFault({
        code: "DB_CONFLICT",
        category: "conflict",
        httpStatus: 409,
        retryable: false,
        safeMessage: "Conflict.",
      }),
    );
    const timeout = toTrpcErrorCode(
      new AppFault({
        code: "RUNTIME_TIMEOUT",
        category: "timeout",
        httpStatus: 504,
        retryable: true,
        safeMessage: "Timed out.",
      }),
    );
    expect(conflict).toBe("CONFLICT");
    expect(timeout).toBe("TIMEOUT");
  });

  it("shapes queue and worker payloads from canonical fault", () => {
    const fault = new AppFault({
      code: "QUEUE_UNAVAILABLE",
      category: "dependency",
      httpStatus: 503,
      retryable: true,
      safeMessage: "Queue unavailable.",
    });

    const queuePayload = toQueueFailure(fault);
    const workerPayload = toWorkerFailure(fault);

    expect(queuePayload.code).toBe("QUEUE_UNAVAILABLE");
    expect(workerPayload.code).toBe("QUEUE_UNAVAILABLE");
    expect(queuePayload.details.surface).toBe("queue");
    expect(workerPayload.details.surface).toBe("worker");
  });
});
