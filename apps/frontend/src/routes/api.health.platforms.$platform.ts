import type { ConnectorType } from "@agenticverdict/types";
import { connectorTypeSchema } from "@agenticverdict/types";
import { createFileRoute } from "@tanstack/react-router";

import { getSharedAdapterInfrastructure } from "@/lib/adapter-infrastructure";

export const Route = createFileRoute("/api/health/platforms/$platform")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const parsed = connectorTypeSchema.safeParse(params.platform);
        if (!parsed.success) {
          return Response.json({ error: "unknown_platform" }, { status: 400 });
        }
        const platform = parsed.data as ConnectorType;
        const infra = getSharedAdapterInfrastructure();
        const report = await infra.getHealth();
        const row = report.connectors.find((p) => p.connector === platform);
        if (!row) {
          return Response.json({ error: "not_found" }, { status: 404 });
        }
        return Response.json(row);
      },
    },
  },
});
