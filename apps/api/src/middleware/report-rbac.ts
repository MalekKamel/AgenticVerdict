import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * After {@link jwtAuth}, requires the caller to have at least one of the listed roles.
 */
export function requireAnyRole(...allowed: string[]) {
  return async function requireRoleMiddleware(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const roles = request.auth?.roles ?? [];
    if (!allowed.some((r) => roles.includes(r))) {
      await reply.status(403).send({
        error: {
          code: "forbidden",
          message: "errors.auth.forbidden",
          details: {},
        },
        requestId: request.id,
      });
      return;
    }
  };
}
