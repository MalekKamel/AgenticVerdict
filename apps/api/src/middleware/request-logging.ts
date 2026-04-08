import type { FastifyInstance } from "fastify";

/**
 * Structured HTTP access logs (Pino via Fastify) with correlation IDs already on `request.log`.
 */
export function registerRequestAccessLogging(scope: FastifyInstance): void {
  scope.addHook("onResponse", (request, reply, done) => {
    request.log.info({
      event: "http_access",
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTimeMs: reply.elapsedTime,
    });
    done();
  });
}
