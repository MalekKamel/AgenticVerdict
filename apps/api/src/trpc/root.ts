import { t } from "./init";
import { adminRouter } from "./routers/admin";
import { agencyRouter } from "./routers/agency";
import { authRouter } from "./routers/auth";
import { connectorRouter } from "./routers/connector";
import { dashboardRouter } from "./routers/dashboard";
import { insightRouter } from "./routers/insights";
import { reportRouter } from "./routers/reports";
import { tenantRouter } from "./routers/tenant";

export const appRouter = t.router({
  auth: authRouter,
  tenant: tenantRouter,
  admin: adminRouter,
  connector: connectorRouter,
  agency: agencyRouter,
  dashboard: dashboardRouter,
  insight: insightRouter,
  report: reportRouter,
});

export type AppRouter = typeof appRouter;
