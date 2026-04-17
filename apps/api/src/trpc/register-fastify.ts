import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import type { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import type { FastifyInstance } from "fastify";

import { createTrpcContext } from "./context";
import { appRouter } from "./root";

export async function registerTrpc(scope: FastifyInstance): Promise<void> {
  await scope.register(fastifyTRPCPlugin, {
    prefix: "/trpc",
    trpcOptions: {
      router: appRouter,
      createContext: ({ req, res }: CreateFastifyContextOptions) => createTrpcContext({ req, res }),
    },
  });
}
