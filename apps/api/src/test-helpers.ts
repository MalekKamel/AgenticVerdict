import { type FastifyInstance } from "fastify";
import type { Redis } from "ioredis";
import { cleanupFastify } from "@agenticverdict/testing";

const activeServers: FastifyInstance[] = [];
const activeRedisClients: Redis[] = [];

export async function cleanupTestResources(): Promise<void> {
  const cleanupPromises: Promise<void>[] = [];

  while (activeServers.length > 0) {
    const server = activeServers.pop();
    if (server) {
      cleanupPromises.push(cleanupFastify(server));
    }
  }

  while (activeRedisClients.length > 0) {
    const client = activeRedisClients.pop();
    if (client) {
      cleanupPromises.push(
        import("@agenticverdict/testing").then(({ cleanupRedis }) => cleanupRedis(client)),
      );
    }
  }

  await Promise.all(cleanupPromises);
}

export function registerTestServer(app: FastifyInstance): FastifyInstance {
  activeServers.push(app);
  return app;
}

export function registerTestRedis(client: Redis): Redis {
  activeRedisClients.push(client);
  return client;
}

export { cleanupFastify };
