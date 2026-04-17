import { t } from "./init";
import { adminRouter } from "./routers/admin";
import { authRouter } from "./routers/auth";
import { tenantRouter } from "./routers/tenant";

export const appRouter = t.router({
  auth: authRouter,
  tenant: tenantRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
