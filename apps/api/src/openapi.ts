import type { FastifyInstance } from "fastify";

import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

const swaggerBaseOptions = {
  openapi: {
    openapi: "3.0.3" as const,
    info: {
      title: "AgenticVerdict API",
      description:
        "External REST API for insights, verdicts, analysis bundles, and validation. JWT bearer auth required on `/api/v1/*` except as noted.",
      version: "1.0.0",
    },
    tags: [
      { name: "Health", description: "Service liveness" },
      { name: "Insights", description: "Generated marketing insights" },
      { name: "Verdicts", description: "Unified MarketingVerdict payloads" },
      { name: "Analysis", description: "Full analysis results with provenance" },
      { name: "Validation", description: "Data quality validation for insights and verdicts" },
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
