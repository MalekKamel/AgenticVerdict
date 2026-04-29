import { TRPCError } from "@trpc/server";
import { TenantSecurityError } from "@agenticverdict/core";

import { verifyBearerSessionFromRequest } from "../middleware/auth";
import { t } from "./init";

/**
 * Session JWT required, plus a resolved `TenantContext` (ALS + RLS) consistent with the JWT
 * (Phase 3 — C-ALS-2, §9 Q-1).
 */
export const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const session = await verifyBearerSessionFromRequest(ctx.req);
  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "errors.auth.unauthorized" });
  }
  if (!ctx.tenant) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "errors.tenantRequired",
      cause: new TenantSecurityError(
        "TENANT_CONTEXT_REQUIRED",
        "Authenticated tRPC call did not establish tenant context",
        403,
      ),
    });
  }
  if (ctx.tenant.tenantId !== session.auth.tenantId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "errors.tenantMismatch",
      cause: new TenantSecurityError(
        "TENANT_MISMATCH",
        "JWT tenant does not match tRPC tenant context",
        403,
      ),
    });
  }
  return next({
    ctx: {
      ...ctx,
      auth: session.auth,
      tenant: ctx.tenant,
    },
  });
});
