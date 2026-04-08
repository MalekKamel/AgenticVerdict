import { buildMockPlatformServer } from "./index";

const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const host = process.env.HOST ?? "0.0.0.0";

const app = await buildMockPlatformServer();
await app.listen({ port, host });
app.log.info({ port, host }, "mock-platform-server listening");
