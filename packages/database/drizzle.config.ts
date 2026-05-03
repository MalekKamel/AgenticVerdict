import { defineConfig } from "drizzle-kit";

import { LOCAL_COMPOSE_POSTGRES_URL } from "./src/local-postgres-default-url";

export default defineConfig({
  schema: "./src/schema/index.ts",
  /** Optional SQL output for `drizzle-kit generate` (gitignored); schema apply uses `db:push`. */
  out: "./.drizzle-out",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? LOCAL_COMPOSE_POSTGRES_URL,
  },
});
