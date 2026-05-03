/* eslint-disable @typescript-eslint/no-explicit-any -- Test file with extensive mocking */
import { TRPCError } from "@trpc/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PERMISSIONS } from "@AgenticVerdict/types";

// Mock the RBAC service before importing middleware
vi.mock("@AgenticVerdict/database", () => ({
  getRbacService: vi.fn(),
}));

import { getRbacService } from "@AgenticVerdict/database";

const mockGetRbacService = vi.mocked(getRbacService);

const TENANT_A = "11111111-1111-4111-8111-111111111111";
const TENANT_B = "22222222-2222-4222-8222-222222222222";
const USER_ID = "user-rbac-middleware-test";

interface MockOpts {
  ctx: {
    req: unknown;
    res: unknown;
    tenant?: {
      tenantId: string;
      requestId: string;
      config: unknown;
    };
    auth?: {
      userId: string;
      tenantId: string;
      roles: string[];
    };
  };
  type: "query" | "mutation";
  path: string;
  input: unknown;
  getRawInput: () => Promise<unknown>;
  meta: unknown;
  signal: AbortSignal | undefined;
  batchIndex: number;
  next: (opts: { ctx: unknown }) => Promise<unknown>;
}

function createMockOpts(args: {
  userId?: string;
  tenantId?: string;
  roles?: string[];
  tenant?: { tenantId: string };
  nextCtx?: unknown;
}): MockOpts {
  return {
    ctx: {
      req: { id: "req-rbac-test" },
      res: {},
      tenant: args.tenant
        ? {
            tenantId: args.tenant.tenantId,
            requestId: "req-rbac-test",
            config: {},
          }
        : undefined,
      auth:
        args.userId && args.tenantId
          ? {
              userId: args.userId,
              tenantId: args.tenantId,
              roles: args.roles || [],
            }
          : undefined,
    },
    type: "query",
    path: "test",
    input: {},
    getRawInput: async () => ({}),
    meta: {},
    signal: undefined,
    batchIndex: 0,
    next: vi.fn().mockResolvedValue(args.nextCtx || {}),
  };
}

describe("requirePermission middleware", () => {
  const mockRbacService = {
    hasPermission: vi.fn(),
    getUserRoles: vi.fn(),
    getUserPermissions: vi.fn(),
    assignRole: vi.fn(),
    revokeRole: vi.fn(),
    getRoleByName: vi.fn(),
    getPermissionByName: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRbacService.mockReturnValue(mockRbacService as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("throws UNAUTHORIZED when user is not authenticated", async () => {
    const { requirePermission } = await import("./rbac-guard");
    const middleware = requirePermission(PERMISSIONS.REPORTS_READ);
    const opts = createMockOpts({});

    const middlewareFn = (middleware as any)._def.middlewares[0];

    try {
      await middlewareFn(opts);
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("UNAUTHORIZED");
      expect((error as TRPCError).message).toBe("Authentication required");
    }

    expect(mockRbacService.hasPermission).not.toHaveBeenCalled();
  });

  it("throws FORBIDDEN when user lacks the required permission", async () => {
    mockRbacService.hasPermission.mockResolvedValue(false);

    const { requirePermission } = await import("./rbac-guard");
    const middleware = requirePermission(PERMISSIONS.REPORTS_DELETE);
    const opts = createMockOpts({
      userId: USER_ID,
      tenantId: TENANT_A,
      roles: ["viewer"],
    });

    const middlewareFn = (middleware as any)._def.middlewares[0];

    try {
      await middlewareFn(opts);
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("FORBIDDEN");
      expect((error as TRPCError).message).toContain("Missing required permission:");
    }

    expect(mockRbacService.hasPermission).toHaveBeenCalledWith(
      USER_ID,
      TENANT_A,
      PERMISSIONS.REPORTS_DELETE,
    );
  });

  it("calls next with rbacContext when user has permission", async () => {
    mockRbacService.hasPermission.mockResolvedValue(true);

    const { requirePermission } = await import("./rbac-guard");
    const middleware = requirePermission(PERMISSIONS.REPORTS_WRITE);
    const opts = createMockOpts({
      userId: USER_ID,
      tenantId: TENANT_A,
      roles: ["editor"],
    });

    const middlewareFn = (middleware as any)._def.middlewares[0];
    await middlewareFn(opts);

    expect(opts.next).toHaveBeenCalled();
    const nextCtx = (opts.next as ReturnType<typeof vi.fn>).mock.calls[0][0].ctx;
    expect((nextCtx as any).rbacContext).toBeDefined();
    expect((nextCtx as any).rbacContext?.permission).toBe(PERMISSIONS.REPORTS_WRITE);
    expect((nextCtx as any).rbacContext?.userId).toBe(USER_ID);
    expect((nextCtx as any).rbacContext?.tenantId).toBe(TENANT_A);
  });

  it("throws INTERNAL_SERVER_ERROR when RBAC service throws non-TRPCError", async () => {
    mockRbacService.hasPermission.mockRejectedValue(new Error("Database connection failed"));

    const { requirePermission } = await import("./rbac-guard");
    const middleware = requirePermission(PERMISSIONS.REPORTS_READ);
    const opts = createMockOpts({
      userId: USER_ID,
      tenantId: TENANT_A,
      roles: ["admin"],
    });

    const middlewareFn = (middleware as any)._def.middlewares[0];

    try {
      await middlewareFn(opts);
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
      expect((error as TRPCError).message).toBe("Authorization service unavailable");
    }
  });

  it("re-throws TRPCError from RBAC service without modification", async () => {
    mockRbacService.hasPermission.mockRejectedValue(
      new TRPCError({
        code: "BAD_REQUEST",
        message: "Custom RBAC error",
      }),
    );

    const { requirePermission } = await import("./rbac-guard");
    const middleware = requirePermission(PERMISSIONS.REPORTS_READ);
    const opts = createMockOpts({
      userId: USER_ID,
      tenantId: TENANT_A,
      roles: ["admin"],
    });

    const middlewareFn = (middleware as any)._def.middlewares[0];

    try {
      await middlewareFn(opts);
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("BAD_REQUEST");
      expect((error as TRPCError).message).toBe("Custom RBAC error");
    }
  });
});

describe("requireRole middleware", () => {
  const mockRbacService = {
    hasPermission: vi.fn(),
    getUserRoles: vi.fn(),
    getUserPermissions: vi.fn(),
    assignRole: vi.fn(),
    revokeRole: vi.fn(),
    getRoleByName: vi.fn(),
    getPermissionByName: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRbacService.mockReturnValue(mockRbacService as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("throws UNAUTHORIZED when user is not authenticated", async () => {
    const { requireRole } = await import("./rbac-guard");
    const middleware = requireRole("admin");
    const opts = createMockOpts({});

    const middlewareFn = (middleware as any)._def.middlewares[0];

    try {
      await middlewareFn(opts);
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("UNAUTHORIZED");
      expect((error as TRPCError).message).toBe("Authentication required");
    }

    expect(mockRbacService.getUserRoles).not.toHaveBeenCalled();
  });

  it("throws FORBIDDEN when user lacks the required role", async () => {
    mockRbacService.getUserRoles.mockResolvedValue(["viewer"]);

    const { requireRole } = await import("./rbac-guard");
    const middleware = requireRole("admin");
    const opts = createMockOpts({
      userId: USER_ID,
      tenantId: TENANT_A,
      roles: ["viewer"],
    });

    const middlewareFn = (middleware as any)._def.middlewares[0];

    try {
      await middlewareFn(opts);
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("FORBIDDEN");
      expect((error as TRPCError).message).toBe("Missing required role: admin");
    }

    expect(mockRbacService.getUserRoles).toHaveBeenCalledWith(USER_ID);
  });

  it("calls next with rbacContext when user has role", async () => {
    mockRbacService.getUserRoles.mockResolvedValue(["admin"]);

    const { requireRole } = await import("./rbac-guard");
    const middleware = requireRole("admin");
    const opts = createMockOpts({
      userId: USER_ID,
      tenantId: TENANT_A,
      roles: ["admin"],
    });

    const middlewareFn = (middleware as any)._def.middlewares[0];
    await middlewareFn(opts);

    expect(opts.next).toHaveBeenCalled();
    const nextCtx = (opts.next as ReturnType<typeof vi.fn>).mock.calls[0][0].ctx;
    expect((nextCtx as any).rbacContext).toBeDefined();
    expect((nextCtx as any).rbacContext?.role).toBe("admin");
    expect((nextCtx as any).rbacContext?.userId).toBe(USER_ID);
    expect((nextCtx as any).rbacContext?.tenantId).toBe(TENANT_A);
  });

  it("uses database roles over JWT roles when available", async () => {
    mockRbacService.getUserRoles.mockResolvedValue(["editor"]);

    const { requireRole } = await import("./rbac-guard");
    const middleware = requireRole("editor");
    const opts = createMockOpts({
      userId: USER_ID,
      tenantId: TENANT_A,
      roles: ["viewer"], // JWT has viewer, but DB has editor
    });

    const middlewareFn = (middleware as any)._def.middlewares[0];
    await middlewareFn(opts);

    expect(opts.next).toHaveBeenCalled();
    expect(mockRbacService.getUserRoles).toHaveBeenCalledWith(USER_ID);
  });

  it("falls back to JWT roles when database returns empty array", async () => {
    mockRbacService.getUserRoles.mockResolvedValue([]);

    const { requireRole } = await import("./rbac-guard");
    const middleware = requireRole("admin");
    const opts = createMockOpts({
      userId: USER_ID,
      tenantId: TENANT_A,
      roles: ["admin"],
    });

    const middlewareFn = (middleware as any)._def.middlewares[0];
    await middlewareFn(opts);

    expect(opts.next).toHaveBeenCalled();
    expect(mockRbacService.getUserRoles).toHaveBeenCalledWith(USER_ID);
  });

  it("throws INTERNAL_SERVER_ERROR when RBAC service throws non-TRPCError", async () => {
    mockRbacService.getUserRoles.mockRejectedValue(new Error("Database connection failed"));

    const { requireRole } = await import("./rbac-guard");
    const middleware = requireRole("admin");
    const opts = createMockOpts({
      userId: USER_ID,
      tenantId: TENANT_A,
      roles: ["admin"],
    });

    const middlewareFn = (middleware as any)._def.middlewares[0];

    try {
      await middlewareFn(opts);
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("INTERNAL_SERVER_ERROR");
      expect((error as TRPCError).message).toBe("Authorization service unavailable");
    }
  });
});

describe("validateTenantContext middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("allows access when tenant context matches auth tenant", async () => {
    const { validateTenantContext } = await import("./rbac-guard");
    const middleware = validateTenantContext();
    const opts = createMockOpts({
      userId: USER_ID,
      tenantId: TENANT_A,
      roles: ["admin"],
      tenant: { tenantId: TENANT_A },
    });

    const middlewareFn = (middleware as any)._def.middlewares[0];
    await middlewareFn(opts);

    expect(opts.next).toHaveBeenCalled();
  });

  it("throws FORBIDDEN when tenant context is missing", async () => {
    const { validateTenantContext } = await import("./rbac-guard");
    const middleware = validateTenantContext();
    const opts = createMockOpts({
      userId: USER_ID,
      tenantId: TENANT_A,
      roles: ["admin"],
    });

    const middlewareFn = (middleware as any)._def.middlewares[0];

    try {
      await middlewareFn(opts);
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("FORBIDDEN");
      expect((error as TRPCError).message).toBe("Tenant context mismatch");
    }
  });

  it("throws FORBIDDEN when tenant context mismatches auth tenant", async () => {
    const { validateTenantContext } = await import("./rbac-guard");
    const middleware = validateTenantContext();
    const opts = createMockOpts({
      userId: USER_ID,
      tenantId: TENANT_A,
      roles: ["admin"],
      tenant: { tenantId: TENANT_B },
    });

    const middlewareFn = (middleware as any)._def.middlewares[0];

    try {
      await middlewareFn(opts);
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("FORBIDDEN");
      expect((error as TRPCError).message).toBe("Tenant context mismatch");
    }
  });

  it("throws FORBIDDEN when auth context is missing", async () => {
    const { validateTenantContext } = await import("./rbac-guard");
    const middleware = validateTenantContext();
    const opts = createMockOpts({
      tenant: { tenantId: TENANT_A },
    });

    const middlewareFn = (middleware as any)._def.middlewares[0];

    try {
      await middlewareFn(opts);
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("FORBIDDEN");
      expect((error as TRPCError).message).toBe("Tenant context required");
    }
  });
});
