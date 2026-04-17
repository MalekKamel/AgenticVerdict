import { createFeatureFlagService } from "@agenticverdict/database";
import { featureFlagAdminListOutputSchema } from "@agenticverdict/types";

import { requireTrpcDatabase } from "../database";
import { t } from "../init";
import { authedProcedure } from "../procedures";

export const adminRouter = t.router({
  featureFlags: t.router({
    list: authedProcedure.output(featureFlagAdminListOutputSchema).query(async ({ ctx }) => {
      const db = requireTrpcDatabase();
      const svc = createFeatureFlagService(db);
      return svc.listAdminSnapshot(ctx.auth.tenantId);
    }),
  }),
});
