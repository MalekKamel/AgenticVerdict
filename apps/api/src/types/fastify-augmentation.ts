import type { TenantContext } from "@agenticverdict/core";

declare module "fastify" {
  interface FastifyRequest {
    /** Populated after JWT + tenant resolution (see `middleware/jwt-tenant-context`). */
    tenantContext?: TenantContext;
  }
}

export {};
