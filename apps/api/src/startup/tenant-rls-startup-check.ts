import { verifyTenantRlsSessionBinding } from "@agenticverdict/database";
import { assertProductionSafeRuntimePolicy, resolveRuntimePolicy } from "@agenticverdict/config";

import { getTrpcDatabase } from "../trpc/database";

/**
 * Verifies DB tenant-session binding at API startup when database-backed mode is enabled.
 */
export async function runTenantRlsStartupCheck(): Promise<void> {
  assertProductionSafeRuntimePolicy(resolveRuntimePolicy(process.env));
  if (!process.env.DATABASE_URL) {
    return;
  }
  if (process.env.TENANT_RLS_STARTUP_CHECK === "false") {
    return;
  }
  const db = getTrpcDatabase();
  if (!db) {
    return;
  }
  await verifyTenantRlsSessionBinding(db);
}
