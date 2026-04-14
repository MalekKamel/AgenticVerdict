import type { ConnectorType } from "@agenticverdict/types";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { getSharedAdapterInfrastructure } from "@/lib/adapter-infrastructure";

const platformSchema = z.enum(["meta", "ga4", "gsc", "gbp", "tiktok"]);

export const Route = createFileRoute("/api/health/platforms/$platform")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const parsed = platformSchema.safeParse(params.platform);
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
