import { describe, it, expect } from "vitest";
import { AppFault } from "@agenticverdict/core";

import { AgentRuntimeError, AgentRuntimeErrorCode } from "../errors/AgentRuntimeError";

import {
  toAgentRuntimeFault,
  isAgentRuntimeFault,
  getAgentRuntimeFaultCode,
  getAgentRuntimeFaultMessageKey,
  type AgentRuntimeFault,
} from "./core-integration";

describe("toAgentRuntimeFault", () => {
  describe("authentication errors", () => {
    it("should translate AUTHENTICATION_FAILED to core AppFault", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.AUTHENTICATION_FAILED,
        message: "Invalid API key",
        providerId: "openai",
        tenantId: "tenant-123",
        statusCode: 401,
      });

      const fault = toAgentRuntimeFault(error);

      expect(fault).toBeInstanceOf(AppFault);
      expect(fault.code).toBe("AUTH_UNAUTHORIZED");
      expect(fault.category).toBe("authentication");
      expect(fault.httpStatus).toBe(401);
      expect(fault.retryable).toBe(false);
      expect(fault.safeMessage).toBe("errors.provider.authenticationFailed");
      expect((fault as AgentRuntimeFault).providerId).toBe("openai");
      expect((fault as AgentRuntimeFault).tenantId).toBe("tenant-123");
      expect((fault as AgentRuntimeFault).runtimeCode).toBe(
        AgentRuntimeErrorCode.AUTHENTICATION_FAILED,
      );
    });
  });

  describe("rate limit errors", () => {
    it("should translate RATE_LIMIT_EXCEEDED to core AppFault", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED,
        message: "Rate limit exceeded",
        providerId: "anthropic",
        tenantId: "tenant-456",
        statusCode: 429,
      });

      const fault = toAgentRuntimeFault(error);

      expect(fault.code).toBe("RUNTIME_UNAVAILABLE");
      expect(fault.category).toBe("rate_limit");
      expect(fault.httpStatus).toBe(429);
      expect(fault.retryable).toBe(true);
      expect(fault.safeMessage).toBe("errors.provider.rateLimitExceeded");
      expect((fault as AgentRuntimeFault).providerId).toBe("anthropic");
      expect((fault as AgentRuntimeFault).runtimeCode).toBe(
        AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED,
      );
    });
  });

  describe("validation errors", () => {
    it("should translate INVALID_CONFIG to core AppFault", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.INVALID_CONFIG,
        message: "Invalid configuration",
        providerId: "openai",
      });

      const fault = toAgentRuntimeFault(error);

      expect(fault.code).toBe("VALIDATION_FAILED");
      expect(fault.category).toBe("validation");
      expect(fault.httpStatus).toBe(400);
      expect(fault.retryable).toBe(false);
    });

    it("should translate INVALID_REQUEST to core AppFault", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.INVALID_REQUEST,
        message: "Invalid request parameters",
      });

      const fault = toAgentRuntimeFault(error);

      expect(fault.code).toBe("VALIDATION_FAILED");
      expect(fault.category).toBe("validation");
      expect(fault.httpStatus).toBe(400);
    });
  });

  describe("not found errors", () => {
    it("should translate PROVIDER_NOT_FOUND to core AppFault", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.PROVIDER_NOT_FOUND,
        message: "Provider not found",
        providerId: "unknown-provider",
      });

      const fault = toAgentRuntimeFault(error);

      expect(fault.code).toBe("RESOURCE_NOT_FOUND");
      expect(fault.category).toBe("dependency");
      expect(fault.httpStatus).toBe(404);
    });

    it("should translate MODEL_NOT_FOUND to core AppFault", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.MODEL_NOT_FOUND,
        message: "Model not found",
      });

      const fault = toAgentRuntimeFault(error);

      expect(fault.code).toBe("RESOURCE_NOT_FOUND");
      expect(fault.category).toBe("data_access");
      expect(fault.httpStatus).toBe(404);
    });
  });

  describe("timeout errors", () => {
    it("should translate REQUEST_TIMEOUT to core AppFault", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.REQUEST_TIMEOUT,
        message: "Request timed out",
        providerId: "google",
        statusCode: 504,
      });

      const fault = toAgentRuntimeFault(error);

      expect(fault.code).toBe("RUNTIME_TIMEOUT");
      expect(fault.category).toBe("timeout");
      expect(fault.httpStatus).toBe(504);
      expect(fault.retryable).toBe(true);
    });
  });

  describe("internal errors", () => {
    it("should translate INTERNAL_ERROR to core AppFault", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.INTERNAL_ERROR,
        message: "Internal error occurred",
        providerId: "bedrock",
        tenantId: "tenant-789",
      });

      const fault = toAgentRuntimeFault(error);

      expect(fault.code).toBe("INTERNAL_ERROR");
      expect(fault.category).toBe("internal");
      expect(fault.httpStatus).toBe(500);
      expect(fault.retryable).toBe(false);
      expect((fault as AgentRuntimeFault).tenantId).toBe("tenant-789");
    });
  });

  describe("tenant context errors", () => {
    it("should translate TENANT_CONTEXT_MISSING to core AppFault", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.TENANT_CONTEXT_MISSING,
        message: "Tenant context is missing",
      });

      const fault = toAgentRuntimeFault(error);

      expect(fault.code).toBe("TENANT_CONTEXT_REQUIRED");
      expect(fault.category).toBe("tenant");
      expect(fault.httpStatus).toBe(400);
      expect(fault.safeMessage).toBe("errors.tenantRequired");
    });
  });

  describe("credential errors", () => {
    it("should translate CREDENTIAL_NOT_FOUND to core AppFault", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.CREDENTIAL_NOT_FOUND,
        message: "Credentials not found",
        tenantId: "tenant-abc",
      });

      const fault = toAgentRuntimeFault(error);

      expect(fault.code).toBe("RESOURCE_NOT_FOUND");
      expect(fault.category).toBe("data_access");
      expect(fault.httpStatus).toBe(404);
    });

    it("should translate CREDENTIAL_INVALID to core AppFault", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.CREDENTIAL_INVALID,
        message: "Invalid credentials",
      });

      const fault = toAgentRuntimeFault(error);

      expect(fault.code).toBe("VALIDATION_FAILED");
      expect(fault.category).toBe("validation");
      expect(fault.httpStatus).toBe(400);
    });
  });

  describe("resilience errors", () => {
    it("should translate CIRCUIT_BREAKER_OPEN to core AppFault", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.CIRCUIT_BREAKER_OPEN,
        message: "Circuit breaker is open",
        providerId: "openai",
      });

      const fault = toAgentRuntimeFault(error);

      expect(fault.code).toBe("RUNTIME_UNAVAILABLE");
      expect(fault.category).toBe("dependency");
      expect(fault.httpStatus).toBe(503);
      expect(fault.retryable).toBe(true);
    });

    it("should translate FAILOVER_EXHAUSTED to core AppFault", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.FAILOVER_EXHAUSTED,
        message: "All failover attempts exhausted",
      });

      const fault = toAgentRuntimeFault(error);

      expect(fault.code).toBe("RUNTIME_UNAVAILABLE");
      expect(fault.category).toBe("dependency");
      expect(fault.httpStatus).toBe(503);
      expect(fault.retryable).toBe(true);
    });
  });

  describe("budget and compliance errors", () => {
    it("should translate BUDGET_EXCEEDED to core AppFault", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.BUDGET_EXCEEDED,
        message: "Budget exceeded",
        tenantId: "tenant-budget",
      });

      const fault = toAgentRuntimeFault(error);

      expect(fault.code).toBe("AUTH_FORBIDDEN");
      expect(fault.category).toBe("authorization");
      expect(fault.httpStatus).toBe(403);
    });

    it("should translate COMPLIANCE_VIOLATION to core AppFault", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.COMPLIANCE_VIOLATION,
        message: "Compliance violation detected",
      });

      const fault = toAgentRuntimeFault(error);

      expect(fault.code).toBe("STORAGE_SECURITY_ERROR");
      expect(fault.category).toBe("security");
      expect(fault.httpStatus).toBe(403);
    });
  });

  describe("metadata preservation", () => {
    it("should include metadata in fault details", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED,
        message: "Rate limit exceeded",
        metadata: {
          retryAfter: 60,
          limitType: "requests_per_minute",
        },
      });

      const fault = toAgentRuntimeFault(error);

      expect(fault.details).toBeDefined();
      expect(fault.details?.metadata).toEqual({
        retryAfter: 60,
        limitType: "requests_per_minute",
      });
    });

    it("should include providerId and tenantId in details", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.AUTHENTICATION_FAILED,
        message: "Auth failed",
        providerId: "openai",
        tenantId: "tenant-xyz",
      });

      const fault = toAgentRuntimeFault(error);

      expect(fault.details?.providerId).toBe("openai");
      expect(fault.details?.tenantId).toBe("tenant-xyz");
    });

    it("should include runtimeCode in details", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.MODEL_NOT_FOUND,
        message: "Model not found",
      });

      const fault = toAgentRuntimeFault(error);

      expect(fault.details?.runtimeCode).toBe(AgentRuntimeErrorCode.MODEL_NOT_FOUND);
      expect(fault.details?.messageKey).toBe("errors.provider.modelNotFound");
    });
  });

  describe("context override", () => {
    it("should use context providerId when provided", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.INTERNAL_ERROR,
        message: "Error",
        providerId: "original-provider",
      });

      const fault = toAgentRuntimeFault(error, { providerId: "override-provider" });

      expect((fault as AgentRuntimeFault).providerId).toBe("override-provider");
      expect(fault.details?.providerId).toBe("override-provider");
    });

    it("should use context tenantId when provided", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.INTERNAL_ERROR,
        message: "Error",
        tenantId: "original-tenant",
      });

      const fault = toAgentRuntimeFault(error, { tenantId: "override-tenant" });

      expect((fault as AgentRuntimeFault).tenantId).toBe("override-tenant");
      expect(fault.details?.tenantId).toBe("override-tenant");
    });

    it("should use context surface when provided", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.INTERNAL_ERROR,
        message: "Error",
      });

      const fault = toAgentRuntimeFault(error, { surface: "http" });

      expect(fault.surface).toBe("http");
      expect(fault.details?.surface).toBe("http");
    });
  });

  describe("non-AgentRuntimeError handling", () => {
    it("should translate regular Error to INTERNAL_ERROR", () => {
      const error = new Error("Regular error");

      const fault = toAgentRuntimeFault(error);

      expect(fault.code).toBe("INTERNAL_ERROR");
      expect(fault.category).toBe("internal");
      expect(fault.httpStatus).toBe(500);
      expect(fault.safeMessage).toBe("errors.common.unknownError");
    });

    it("should handle non-Error objects", () => {
      const error = { message: "Plain object error" };

      const fault = toAgentRuntimeFault(error);

      expect(fault.code).toBe("INTERNAL_ERROR");
      expect(fault.safeMessage).toBe("errors.common.unknownError");
    });

    it("should handle null/undefined", () => {
      const faultNull = toAgentRuntimeFault(null);
      expect(faultNull.code).toBe("INTERNAL_ERROR");

      const faultUndefined = toAgentRuntimeFault(undefined);
      expect(faultUndefined.code).toBe("INTERNAL_ERROR");
    });
  });

  describe("idempotency", () => {
    it("should return AgentRuntimeFault unchanged", () => {
      const error = new AgentRuntimeError({
        code: AgentRuntimeErrorCode.RATE_LIMIT_EXCEEDED,
        message: "Rate limit",
        providerId: "openai",
        tenantId: "tenant-123",
      });

      const fault1 = toAgentRuntimeFault(error);
      const fault2 = toAgentRuntimeFault(fault1);

      expect(fault2).toBe(fault1);
    });
  });
});

describe("isAgentRuntimeFault", () => {
  it("should return true for AgentRuntimeFault", () => {
    const error = new AgentRuntimeError({
      code: AgentRuntimeErrorCode.PROVIDER_NOT_FOUND,
      message: "Not found",
    });
    const fault = toAgentRuntimeFault(error);

    expect(isAgentRuntimeFault(fault)).toBe(true);
  });

  it("should return false for regular AppFault", () => {
    const fault = new AppFault({
      code: "INTERNAL_ERROR",
      category: "internal",
      httpStatus: 500,
      retryable: false,
      safeMessage: "error",
    });

    expect(isAgentRuntimeFault(fault)).toBe(false);
  });

  it("should return false for regular Error", () => {
    const error = new Error("Regular error");
    expect(isAgentRuntimeFault(error)).toBe(false);
  });

  it("should return false for non-Error objects", () => {
    expect(isAgentRuntimeFault(null)).toBe(false);
    expect(isAgentRuntimeFault({})).toBe(false);
  });
});

describe("getAgentRuntimeFaultCode", () => {
  it("should return the runtime code from AgentRuntimeFault", () => {
    const error = new AgentRuntimeError({
      code: AgentRuntimeErrorCode.CONTENT_FILTERED,
      message: "Content filtered",
    });
    const fault = toAgentRuntimeFault(error);

    expect(getAgentRuntimeFaultCode(fault)).toBe(AgentRuntimeErrorCode.CONTENT_FILTERED);
  });
});

describe("getAgentRuntimeFaultMessageKey", () => {
  it("should return the message key for the runtime code", () => {
    const error = new AgentRuntimeError({
      code: AgentRuntimeErrorCode.BUDGET_EXCEEDED,
      message: "Budget exceeded",
    });
    const fault = toAgentRuntimeFault(error);

    expect(getAgentRuntimeFaultMessageKey(fault)).toBe("errors.provider.budgetExceeded");
  });

  it("should handle all error codes", () => {
    const codes = Object.values(AgentRuntimeErrorCode);

    codes.forEach((code) => {
      const error = new AgentRuntimeError({
        code,
        message: "Test",
      });
      const fault = toAgentRuntimeFault(error);
      const messageKey = getAgentRuntimeFaultMessageKey(fault);

      expect(messageKey).toBeDefined();
      expect(typeof messageKey).toBe("string");
    });
  });
});
