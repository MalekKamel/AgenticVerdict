import { TRPCError } from "@trpc/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TenantSecurityError, type TenantContext } from "@agenticverdict/core";

vi.mock("../middleware/auth", () => ({
  verifyBearerSessionFromRequest: vi.fn(),
}));

import { verifyBearerSessionFromRequest } from "../middleware/auth";
import { t } from "./init";
import { authedProcedure } from "./procedures";

const TENANT_A = "11111111-1111-4111-8111-111111111111";
const TENANT_B = "22222222-2222-4222-8222-222222222222";

function makeTenantContext(tenantId: string): TenantContext {
  return {
    tenantId,
    requestId: "req-authed-procedure-baseline",
    config: { tenantId } as TenantContext["config"],
  };
}

function makeCaller(args: {
  sessionTenantId: string | null;
  tenantContext: TenantContext | undefined;
}) {
  const mockedVerify = vi.mocked(verifyBearerSessionFromRequest);
  mockedVerify.mockResolvedValue(
    args.sessionTenantId
      ? {
          auth: {
            userId: "user-authed-procedure-baseline",
            tenantId: args.sessionTenantId,
            roles: ["analyst"],
          },
          sessionExpiresAt: null,
        }
      : null,
  );

  const router = t.router({
    probe: authedProcedure.query(({ ctx }) => ({
      tenantId: ctx.tenant.tenantId,
      userId: ctx.auth.userId,
    })),
  });

  return router.createCaller({
    req: { id: "req-authed-procedure-baseline" } as never,
    res: {} as never,
    tenant: args.tenantContext,
  });
}

describe("authedProcedure baseline contracts", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("rejects when no valid authenticated session exists", async () => {
    const caller = makeCaller({
      sessionTenantId: null,
      tenantContext: makeTenantContext(TENANT_A),
    });
    await expect(caller.probe()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  });

  it("rejects when session exists but tenant context is missing", async () => {
    const caller = makeCaller({ sessionTenantId: TENANT_A, tenantContext: undefined });

    await expect(caller.probe()).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Tenant context is required for this operation",
    });

    try {
      await caller.probe();
    } catch (error) {
      const trpc = error as TRPCError;
      const cause = trpc.cause as TenantSecurityError;
      expect(cause.code).toBe("TENANT_CONTEXT_REQUIRED");
    }
  });

  it("rejects when session tenant and resolved tenant context differ", async () => {
    const caller = makeCaller({
      sessionTenantId: TENANT_A,
      tenantContext: makeTenantContext(TENANT_B),
    });

    await expect(caller.probe()).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Session tenant does not match resolved tenant context",
    });

    try {
      await caller.probe();
    } catch (error) {
      const trpc = error as TRPCError;
      const cause = trpc.cause as TenantSecurityError;
      expect(cause.code).toBe("TENANT_MISMATCH");
    }
  });

  it("allows request when session and tenant context match", async () => {
    const caller = makeCaller({
      sessionTenantId: TENANT_A,
      tenantContext: makeTenantContext(TENANT_A),
    });
    await expect(caller.probe()).resolves.toEqual({
      tenantId: TENANT_A,
      userId: "user-authed-procedure-baseline",
    });
  });
});
