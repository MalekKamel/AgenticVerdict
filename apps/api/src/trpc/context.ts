import type { FastifyReply, FastifyRequest } from "fastify";

export interface TrpcContext {
  req: FastifyRequest;
  res: FastifyReply;
}

export function createTrpcContext(opts: { req: FastifyRequest; res: FastifyReply }): TrpcContext {
  return { req: opts.req, res: opts.res };
}
