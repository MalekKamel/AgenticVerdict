import { TRPCError } from "@trpc/server";

import { verifyBearerSessionFromRequest } from "../middleware/auth";
import { t } from "./init";

export const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const session = await verifyBearerSessionFromRequest(ctx.req);
  if (!session) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({
    ctx: {
      ...ctx,
      auth: session.auth,
    },
  });
});
