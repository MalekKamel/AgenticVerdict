import { runWithTenantContext } from "@agenticverdict/core";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

/**
 * When {@link FastifyRequest#tenantContext} is set (after JWT + config resolution), runs the route
 * handler inside {@link runWithTenantContext} so `getTenantContext()` works for the full handler.
 */
export function registerTenantAlsRouteWrapping(scope: FastifyInstance): void {
  scope.addHook("onRoute", (routeOptions) => {
    const original = routeOptions.handler;
    if (typeof original !== "function") {
      return;
    }
    routeOptions.handler = function (
      this: FastifyInstance,
      request: FastifyRequest,
      reply: FastifyReply,
    ) {
      const ctx = request.tenantContext;
      if (!ctx) {
        return original.call(this, request, reply);
      }
      return runWithTenantContext(ctx, () => original.call(this, request, reply));
    };
  });
}
