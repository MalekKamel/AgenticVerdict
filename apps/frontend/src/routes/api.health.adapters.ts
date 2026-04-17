import { isMockEnabledForConnector, connectorAdapterTypes } from "@agenticverdict/data-connectors";
import { createFileRoute } from "@tanstack/react-router";

import { getSharedAdapterInfrastructure } from "@/lib/adapter-infrastructure";

export const Route = createFileRoute("/api/health/adapters")({
  server: {
    handlers: {
      GET: async () => {
        const infra = getSharedAdapterInfrastructure();
        const body = await infra.getHealth();
        const mockConnectors = connectorAdapterTypes.filter((connector) =>
          isMockEnabledForConnector(connector),
        );
        const withMockMetadata = {
          ...body,
          mockMode: mockConnectors.length > 0,
          mockConnectors,
          connectors: body.connectors.map((row) => ({
            ...row,
            adapterType: mockConnectors.includes(row.connector) ? "mock" : "production",
          })),
        };
        const status = body.status === "ok" ? 200 : 503;
        return Response.json(withMockMetadata, { status });
      },
    },
  },
});
