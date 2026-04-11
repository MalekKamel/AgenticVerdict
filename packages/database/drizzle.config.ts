import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  /** Optional SQL output for `drizzle-kit generate` (gitignored); schema apply uses `db:push`. */
  out: "./.drizzle-out",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/agenticverdict",
  },
});
