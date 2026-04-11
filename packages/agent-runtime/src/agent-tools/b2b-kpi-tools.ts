import { requireTenantContext } from "@agenticverdict/core";
import { parseNormalizedConnectorSnapshot } from "@agenticverdict/data-connectors";

import type { AgentInvocationContext, ITool } from "../interfaces";
import { computeB2bMarketingKpisFromNormalizedSnapshots } from "../b2b-funnel-from-snapshots";
import { defineTool } from "../tools";
import { AgentToolError } from "./agent-tool-error";
import { computeB2bKpisFromSnapshotsInputSchema, parseToolArgs } from "./agent-tool-schemas";

export function createB2bKpiTools(): ITool[] {
  return [
    defineTool({
      name: "compute_b2b_kpis_from_snapshots",
      description:
        "Aggregate B2B funnel KPIs (CPQL, lead-quality mix, language engagement) from normalized platform snapshots using the active tenant's marketing.b2bKpiProfile mapping.",
      execute: async (args, ctx: AgentInvocationContext) => {
        void ctx;
        const input = parseToolArgs(computeB2bKpisFromSnapshotsInputSchema, args);
        const tenant = requireTenantContext();
        const snapshots = [];
        for (let i = 0; i < input.snapshots.length; i++) {
          const raw = input.snapshots[i];
          const parsed = parseNormalizedConnectorSnapshot(raw);
          if (!parsed.success) {
            const msg = parsed.error.issues.map((issue) => issue.message).join("; ");
            throw new AgentToolError(
              "validation_failed",
              `snapshots[${i}] is not a valid normalized platform snapshot: ${msg}`,
              { cause: parsed.error },
            );
          }
          snapshots.push(parsed.data);
        }
        return computeB2bMarketingKpisFromNormalizedSnapshots(snapshots, tenant.config);
      },
    }),
  ];
}
