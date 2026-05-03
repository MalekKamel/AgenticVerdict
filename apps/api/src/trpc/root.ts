import { t } from "./init";
import { adminRouter } from "./routers/admin";
import { agencyRouter } from "./routers/agency";
import { authRouter } from "./routers/auth";
import { connectorRouter } from "./routers/connector";
import { dashboardRouter } from "./routers/dashboard";
import { tenantRouter } from "./routers/tenant";

export const appRouter = t.router({
  auth: authRouter,
  tenant: tenantRouter,
  admin: adminRouter,
  connector: connectorRouter,
  agency: agencyRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
