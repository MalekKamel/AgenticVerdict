import { createPinoLogger, type Logger } from "@agenticverdict/observability";

export const dbLogger: Logger = createPinoLogger("database");
