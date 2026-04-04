import { buildApiServer } from "./server";

const port = Number(process.env.API_PORT ?? process.env.PORT ?? 4000);
const host = process.env.API_HOST ?? "0.0.0.0";

const app = await buildApiServer();
await app.listen({ port, host });
app.log.info(`Listening on http://${host}:${port}`);
