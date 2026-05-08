import type { FastifyInstance } from "fastify";

import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

const swaggerBaseOptions = {
  openapi: {
    openapi: "3.0.3" as const,
    info: {
      title: "AgenticVerdict API",
      description:
        "External REST API for insights, verdicts, analysis bundles, reports, and validation. JWT bearer auth required on `/api/v1/*` except as noted. Liveness: `GET /health` and `GET /api/health` (identical, no auth).",
      version: "1.0.0",
    },
    tags: [
      { name: "Health", description: "Service liveness" },
      {
        name: "Insights",
        description:
          "Generated domain-specific insights. Note: AI provider validation is dynamic - accepts any registered provider ID at runtime, validated against ProviderRegistry.",
      },
      { name: "Verdicts", description: "Unified Verdict payloads" },
      { name: "Analysis", description: "Full analysis results with provenance" },
      { name: "Validation", description: "Data quality validation for insights and verdicts" },
      {
        name: "Reports",
        description:
          "Report metadata, binary upload/download (each upload creates a new version), email delivery enqueue, share links, delivery metrics, archival, and compliance endpoints (tenant-scoped)",
      },
      {
        name: "Report schedules",
        description: "Cron-style BullMQ repeatable jobs that fan out report generation per tenant",
      },
      {
        name: "Report templates",
        description: "Built-in HTML templates, preview, and tenant-scoped versioned overrides",
      },
      {
        name: "Report history",
        description:
          "Report byte versioning, comparison metadata, archival, retention sweeps, and audit/compliance exports (tenant-scoped)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http" as const,
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "HS256 JWT with `sub`, `tenant_id` (UUID), optional `roles` array.",
        },
      },
    },
  },
};

/** Call before routes that define `schema` (collects OpenAPI paths). */
export async function registerSwagger(app: FastifyInstance): Promise<void> {
  await app.register(swagger, swaggerBaseOptions);
}

/** Call after all routes are registered. Serves UI at `/documentation` and JSON at `/documentation/json`. */
export async function registerSwaggerUi(app: FastifyInstance): Promise<void> {
  await app.register(swaggerUi, {
    routePrefix: "/documentation",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });
}
