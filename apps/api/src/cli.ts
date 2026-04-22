import { buildApiServer } from "./server";

const configuredPort = Number(process.env.API_PORT ?? process.env.PORT ?? 4000);
const host = process.env.API_HOST ?? "0.0.0.0";
const autoIncrementPort = process.env.API_PORT_AUTO_INCREMENT === "1";

const app = await buildApiServer();

async function listenWithPortFallback(): Promise<number> {
  let port = configuredPort;
  while (true) {
    try {
      await app.listen({ port, host });
      return port;
    } catch (error: unknown) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code?: unknown }).code === "string"
          ? (error as { code: string }).code
          : undefined;
      if (!autoIncrementPort || code !== "EADDRINUSE") {
        throw error;
      }
      port += 1;
    }
  }
}

const activePort = await listenWithPortFallback();
app.log.info(`Listening on http://${host}:${activePort}`);
