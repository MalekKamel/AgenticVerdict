import { initTRPC } from "@trpc/server";
import superjson from "superjson";

import { TenantSecurityError } from "@agenticverdict/core";
import { recordTenantSecurityEvent } from "@agenticverdict/observability";

import { getHttpAccessLogTenantId } from "../middleware/request-logging";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error, path, ctx }) {
    if (error.cause instanceof TenantSecurityError) {
      recordTenantSecurityEvent("trpc", error.cause.code);
      if (ctx?.req) {
        ctx.req.log?.warn({
          event: "trpc_tenant_security",
          surface: "trpc",
          code: error.cause.code,
          trpcPath: path,
          requestId: ctx.req.id,
          tenantId: getHttpAccessLogTenantId(ctx.req),
        });
      }
      return {
        ...shape,
        data: {
          ...shape.data,
          tenantSecurityCode: error.cause.code,
        },
      };
    }
    return shape;
  },
});

export { t };
