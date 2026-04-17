import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/ready")({
  server: {
    handlers: {
      GET: () =>
        Response.json({
          status: "ready",
          service: "web",
        }),
    },
  },
});
