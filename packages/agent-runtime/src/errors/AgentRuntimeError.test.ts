import { describe, it, expect } from "vitest";
import { AgentRuntimeError, AgentRuntimeErrorCode } from "../errors/AgentRuntimeError";

describe("AgentRuntimeError", () => {
  describe("constructor", () => {
    it("should create error with required properties", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.PROVIDER_NOT_FOUND,
        message: "Provider not found",
      });

      expect(error.name).toBe("AgentRuntimeError");
      expect(error.code).toBe(AgentRuntimeErrorCode.PROVIDER_NOT_FOUND);
      expect(error.message).toBe("Provider not found");
      expect(error.timestamp).toBeDefined();
      expect(typeof error.timestamp).toBe("number");
    });

    it("should create error with optional metadata", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.AUTHENTICATION_FAILED,
        message: "Invalid API key",
        providerId: "openai",
        tenantId: "tenant-123",
        statusCode: 401,
        metadata: {
          retryCount: 3,
          lastAttempt: new Date().toISOString(),
        },
      });

      expect(error.providerId).toBe("openai");
      expect(error.tenantId).toBe("tenant-123");
      expect(error.statusCode).toBe(401);
      expect(error.metadata.retryCount).toBe(3);
    });

    it("should accept cause for error chaining", () => {
      const cause = new Error("Underlying error");
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.INTERNAL_ERROR,
        message: "Internal error occurred",
        cause,
      });

      expect(error.cause).toBe(cause);
    });
  });

  describe("toJSON", () => {
    it("should serialize error to JSON object", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED,
        message: "Rate limit exceeded",
        providerId: "anthropic",
        tenantId: "tenant-456",
        statusCode: 429,
        metadata: {
          retryAfter: 60,
        },
      });

      const json = error.toJSON();

      expect(json).toEqual({
        name: "AgentRuntimeError",
        code: AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED,
        message: "Rate limit exceeded",
        providerId: "anthropic",
        tenantId: "tenant-456",
        statusCode: 429,
        metadata: {
          retryAfter: 60,
        },
        timestamp: expect.any(Number),
      });
    });

    it("should exclude undefined values from metadata", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.INVALID_CONFIG,
        message: "Invalid configuration",
      });

      const json = error.toJSON();

      expect(json.providerId).toBeUndefined();
      expect(json.tenantId).toBeUndefined();
      expect(json.statusCode).toBeUndefined();
    });
  });

  describe("isAgentRuntimeError", () => {
    it("should return true for AgentRuntimeError instances", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.PROVIDER_NOT_FOUND,
        message: "Test error",
      });

      expect(AgentRuntimeError.isAgentRuntimeError(error)).toBe(true);
    });

    it("should return false for regular Error", () => {
      const error = new Error("Regular error");
      expect(AgentRuntimeError.isAgentRuntimeError(error)).toBe(false);
    });

    it("should return false for non-Error objects", () => {
      expect(AgentRuntimeError.isAgentRuntimeError(null)).toBe(false);
      expect(AgentRuntimeError.isAgentRuntimeError({})).toBe(false);
      expect(AgentRuntimeError.isAgentRuntimeError("string")).toBe(false);
    });
  });

  describe("error codes", () => {
    it("should have all required error codes", () => {
      const expectedCodes = [
        "PROVIDER_NOT_FOUND",
        "PROVIDER_ALREADY_REGISTERED",
        "INVALID_CONFIG",
        "AUTHENTICATION_FAILED",
        "RATE_LIMIT_EXCEEDED",
        "REQUEST_TIMEOUT",
        "INVALID_REQUEST",
        "MODEL_NOT_FOUND",
        "CONTENT_FILTERED",
        "INSUFFICIENT_CREDITS",
        "INTERNAL_ERROR",
        "TENANT_CONTEXT_MISSING",
        "CREDENTIAL_NOT_FOUND",
        "CREDENTIAL_INVALID",
        "CIRCUIT_BREAKER_OPEN",
        "FAILOVER_EXHAUSTED",
        "BUDGET_EXCEEDED",
        "COMPLIANCE_VIOLATION",
      ];

      const actualCodes = Object.values(AgentRuntimeErrorCode);
      expect(actualCodes.length).toBe(expectedCodes.length);

      expectedCodes.forEach((code) => {
        expect(actualCodes).toContain(code);
      });
    });
  });

  describe("error stack trace", () => {
    it("should capture stack trace", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.INTERNAL_ERROR,
        message: "Test error for stack trace",
      });

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe("string");
      expect(error.stack).toContain("AgentRuntimeError");
    });
  });

  describe("error inheritance", () => {
    it("should be instance of Error", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.INVALID_CONFIG,
        message: "Invalid config",
      });

      expect(error).toBeInstanceOf(Error);
    });

    it("should have proper prototype chain", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.PROVIDER_NOT_FOUND,
        message: "Not found",
      });

      expect(error instanceof AgentRuntimeError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });
});

describe("Error mapping", () => {
  it("should map HTTP status codes to error codes", () => {
    const statusToCode: Record<number, AgentRuntimeErrorCode> = {
      401: AgentRuntimeErrorCode.AUTHENTICATION_FAILED,
      403: AgentRuntimeErrorCode.AUTHENTICATION_FAILED,
      404: AgentRuntimeErrorCode.MODEL_NOT_FOUND,
      429: AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED,
      500: AgentRuntimeErrorCode.INTERNAL_ERROR,
      502: AgentRuntimeErrorCode.INTERNAL_ERROR,
      503: AgentRuntimeErrorCode.INTERNAL_ERROR,
      504: AgentRuntimeErrorCode.REQUEST_TIMEOUT,
    };

    Object.entries(statusToCode).forEach(([status, expectedCode]) => {
      const error = new AgentRuntimeError({
        code: expectedCode,
        message: `Error for status ${status}`,
        statusCode: Number(status),
      });

      expect(error.statusCode).toBe(Number(status));
      expect(error.code).toBe(expectedCode);
    });
  });

  it("should include tenant context in all errors", () => {
    const tenantId = "test-tenant-123";

    const error = new AgentRuntimeError({
      code: AgentRuntimeErrorCode.CREDENTIAL_NOT_FOUND,
      message: "Credentials missing",
      tenantId,
      providerId: "openai",
    });

    expect(error.tenantId).toBe(tenantId);
    expect(error.providerId).toBe("openai");
    expect(error.code).toBe(AgentRuntimeErrorCode.CREDENTIAL_NOT_FOUND);
  });
});
