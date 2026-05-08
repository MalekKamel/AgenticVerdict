import { t } from "./init";
import { adminRouter } from "./routers/admin";
import { agencyRouter } from "./routers/agency";
import { authRouter } from "./routers/auth";
import { connectorRouter } from "./routers/connector";
import { dashboardRouter } from "./routers/dashboard";
import { insightRouter } from "./routers/insights";
import { reportRouter } from "./routers/reports";
import { tenantRouter } from "./routers/tenant";
import { aiProvidersRouter } from "./routers/ai-providers";
import { aiDomainsRouter } from "./routers/ai-domains";
import { aiTemplatesRouter } from "./routers/ai-templates";
import { aiUsageRouter } from "./routers/ai-usage";
import { budgetAlertsRouter } from "./routers/budget-alerts";

export const appRouter = t.router({
  auth: authRouter,
  tenant: tenantRouter,
  admin: adminRouter,
  connector: connectorRouter,
  agency: agencyRouter,
  dashboard: dashboardRouter,
  insight: insightRouter,
  report: reportRouter,
  aiProviders: aiProvidersRouter,
  aiDomains: aiDomainsRouter,
  aiTemplates: aiTemplatesRouter,
  aiUsage: aiUsageRouter,
  budgetAlerts: budgetAlertsRouter,
});

export type AppRouter = typeof appRouter;
