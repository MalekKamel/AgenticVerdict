import { bindTenantContextAsyncContinuation } from "@agenticverdict/core";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import type { FastifyInstance } from "fastify";

import { attachTrpcRequestAuth } from "../middleware/auth";
import { bindJwtTenantAsyncContext } from "../middleware/jwt-tenant-context";
import { createTrpcContext } from "./context";
import { appRouter } from "./root";

/**
 * tRPC is mounted only under this plugin so session + tenant pre-handlers do not run on REST routes.
 */
export async function registerTrpc(scope: FastifyInstance): Promise<void> {
  await scope.register(
    async (trpc: FastifyInstance) => {
      trpc.addHook("preHandler", async (req, reply) => {
        await attachTrpcRequestAuth()(req);
        if (reply.sent) {
          return;
        }
        await bindJwtTenantAsyncContext()(req, reply);
        if (reply.sent) {
          return;
        }
        if (req.tenantContext) {
          bindTenantContextAsyncContinuation(req.tenantContext);
        }
      });
      await trpc.register(fastifyTRPCPlugin, {
        trpcOptions: {
          router: appRouter,
          createContext: ({ req, res }: CreateFastifyContextOptions) =>
            createTrpcContext({ req, res }),
        },
      });
    },
    { prefix: "/trpc" },
  );
}
