import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  getRuntimeTenantContext,
  requireRuntimeTenantContext,
  runWithRuntimeTenantContext,
  ensureTenantIsolation,
} from "./tenant-context";
import { AgentRuntimeError, AgentRuntimeErrorCode } from "../errors/AgentRuntimeError";
import {
  getTenantContext,
  requireTenantContext,
  runWithTenantContext,
  type TenantContext,
} from "@agenticverdict/core";

vi.mock("@agenticverdict/core", async () => {
  const actual = await vi.importActual("@agenticverdict/core");
  return {
    ...(actual as Record<string, unknown>),
    getTenantContext: vi.fn(),
    requireTenantContext: vi.fn(),
    runWithTenantContext: vi.fn(),
  };
});

describe("tenant-context", () => {
  const mockGetTenantContext = vi.mocked(getTenantContext);
  const mockRequireTenantContext = vi.mocked(requireTenantContext);
  const mockRunWithTenantContext = vi.mocked(runWithTenantContext);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getRuntimeTenantContext", () => {
    it("should return tenant context when available", () => {
      const mockContext: TenantContext = {
        tenantId: "tenant-123",
        tenantType: "direct_business",
        tenantStatus: "active",
        config: {},
        requestId: "req-456",
        userId: "user-789",
      };

      mockGetTenantContext.mockReturnValue(mockContext);

      const result = getRuntimeTenantContext();

      expect(result).toEqual({
        tenantId: "tenant-123",
        requestId: "req-456",
        userId: "user-789",
      });
      expect(getTenantContext).toHaveBeenCalledTimes(1);
    });

    it("should return undefined userId when not provided", () => {
      const mockContext: TenantContext = {
        tenantId: "tenant-123",
        tenantType: "direct_business",
        tenantStatus: "active",
        config: {},
        requestId: "req-456",
      };

      mockGetTenantContext.mockReturnValue(mockContext);

      const result = getRuntimeTenantContext();

      expect(result).toEqual({
        tenantId: "tenant-123",
        requestId: "req-456",
        userId: undefined,
      });
    });

    it("should throw TENANT_CONTEXT_MISSING error when context not found", () => {
      mockGetTenantContext.mockReturnValue(null);

      expect(() => getRuntimeTenantContext()).toThrow(AgentRuntimeError);

      const error = (() => {
        try {
          getRuntimeTenantContext();
        } catch (e) {
          return e as AgentRuntimeError;
        }
      })();

      expect(error.code).toBe(AgentRuntimeErrorCode.TENANT_CONTEXT_MISSING);
      expect(error.message).toContain("Tenant context not found");
    });
  });

  describe("requireRuntimeTenantContext", () => {
    it("should return tenant context from requireTenantContext", () => {
      const mockContext: TenantContext = {
        tenantId: "tenant-abc",
        tenantType: "direct_business",
        tenantStatus: "active",
        config: { language: "en" },
        requestId: "req-def",
        userId: "user-ghi",
      };

      mockRequireTenantContext.mockReturnValue(mockContext);

      const result = requireRuntimeTenantContext();

      expect(result).toEqual({
        tenantId: "tenant-abc",
        requestId: "req-def",
        userId: "user-ghi",
      });
      expect(requireTenantContext).toHaveBeenCalledTimes(1);
    });

    it("should throw error when requireTenantContext fails", () => {
      mockRequireTenantContext.mockImplementation(() => {
        throw new Error("Tenant context required");
      });

      expect(() => requireRuntimeTenantContext()).toThrow("Tenant context required");
    });
  });

  describe("runWithRuntimeTenantContext", () => {
    it("should wrap function with tenant context", () => {
      const testFn = vi.fn(() => "result");
      const config = { language: "en", kpis: ["revenue"] };

      mockRunWithTenantContext.mockImplementation((context, fn) => {
        expect(context).toEqual({
          tenantId: "tenant-123",
          tenantType: "direct_business",
          tenantStatus: "active",
          config,
          requestId: "req-456",
          userId: "user-789",
        });
        return fn();
      });

      const result = runWithRuntimeTenantContext(
        "tenant-123",
        "req-456",
        config,
        testFn,
        "user-789",
      );

      expect(result).toBe("result");
      expect(testFn).toHaveBeenCalledTimes(1);
      expect(runWithTenantContext).toHaveBeenCalledTimes(1);
    });

    it("should work without userId", () => {
      const testFn = vi.fn(() => "result");
      const config = {};

      mockRunWithTenantContext.mockImplementation((context, fn) => {
        expect(context.userId).toBeUndefined();
        return fn();
      });

      runWithRuntimeTenantContext("tenant-123", "req-456", config, testFn);

      expect(testFn).toHaveBeenCalledTimes(1);
    });

    it("should support async functions", async () => {
      const testFn = vi.fn(async () => "async-result");

      mockRunWithTenantContext.mockImplementation(async (context, fn) => {
        return await fn();
      });

      const result = await runWithRuntimeTenantContext("tenant-123", "req-456", {}, testFn);

      expect(result).toBe("async-result");
      expect(testFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("ensureTenantIsolation", () => {
    beforeEach(() => {
      const mockContext: TenantContext = {
        tenantId: "tenant-123",
        tenantType: "direct_business",
        tenantStatus: "active",
        config: {},
        requestId: "req-456",
      };

      mockGetTenantContext.mockReturnValue(mockContext);
    });

    it("should not throw when tenant IDs match", () => {
      expect(() => {
        ensureTenantIsolation("read", "tenant-123");
      }).not.toThrow();
    });

    it("should throw TENANT_CONTEXT_MISSING error when tenant IDs do not match", () => {
      expect(() => {
        ensureTenantIsolation("read", "tenant-456");
      }).toThrow(AgentRuntimeError);

      const error = (() => {
        try {
          ensureTenantIsolation("read", "tenant-456");
        } catch (e) {
          return e as AgentRuntimeError;
        }
      })();

      expect(error.code).toBe(AgentRuntimeErrorCode.TENANT_CONTEXT_MISSING);
      expect(error.message).toContain("Tenant isolation violation");
      expect(error.message).toContain("tenant-456");
      expect(error.message).toContain("tenant-123");
      expect(error.metadata).toEqual({
        operation: "read",
        resourceTenantId: "tenant-456",
      });
    });

    it("should include operation and resource tenant ID in error metadata", () => {
      const error = (() => {
        try {
          ensureTenantIsolation("delete", "tenant-789");
        } catch (e) {
          return e as AgentRuntimeError;
        }
      })();

      expect(error.metadata).toEqual({
        operation: "delete",
        resourceTenantId: "tenant-789",
      });
    });
  });
});
