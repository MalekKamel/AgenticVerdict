import type { TenantContext } from "@agenticverdict/core";
import type { FastifyReply, FastifyRequest } from "fastify";

import "../types/fastify-augmentation";

export interface TrpcContext {
  req: FastifyRequest;
  res: FastifyReply;
  /**
   * Set when a valid session exists and `bindJwtTenantAsyncContext` loaded `TenantConfig`
   * (same as REST `request.tenantContext`).
   */
  tenant?: TenantContext;
}

export function createTrpcContext(opts: { req: FastifyRequest; res: FastifyReply }): TrpcContext {
  return { req: opts.req, res: opts.res, tenant: opts.req.tenantContext };
}
