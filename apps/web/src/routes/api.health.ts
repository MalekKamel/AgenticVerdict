import { createFileRoute } from "@tanstack/react-router";

import { getSharedAdapterInfrastructure } from "@/lib/adapter-infrastructure";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        const infra = getSharedAdapterInfrastructure();
        const infrastructure = await infra.getHealth();
        const degraded = infrastructure.status !== "ok";
        return Response.json({
          status: degraded ? "degraded" : "ok",
          service: "web",
          infrastructure,
        });
      },
    },
  },
});
