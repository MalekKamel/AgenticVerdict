import { createFeatureFlagService, dbScoped, type Database } from "@agenticverdict/database";
import { featureFlagAdminListOutputSchema } from "@agenticverdict/types";

import { requireTrpcDatabase } from "../database";
import { t } from "../init";
import { authedProcedure } from "../procedures";

export const adminRouter = t.router({
  featureFlags: t.router({
    list: authedProcedure.output(featureFlagAdminListOutputSchema).query(async ({ ctx }) => {
      const db = requireTrpcDatabase();
      return dbScoped(db, async (tx) => {
        const svc = createFeatureFlagService(tx as unknown as Database);
        return svc.listAdminSnapshot(ctx.auth.tenantId);
      });
    }),
  }),
});
