import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@agenticverdict/database/repositories": path.resolve(__dirname, "src/repositories"),
      "@agenticverdict/database/schema": path.resolve(__dirname, "src/schema"),
    },
  },
  test: {
    environment: "node",
    testTimeout: 60000,
    hookTimeout: 60000,
    teardownTimeout: 30000,
    include: ["test/**/*.test.ts", "src/**/*.test.ts"],
    /** Requires Docker; run `pnpm run test:integration` in this package. */
    exclude: ["**/node_modules/**", "**/*.integration.test.ts"],
    forceExit: true,
    dangerouslyIgnoreUnhandledErrors: false,
    pool: "threads",
    poolOptions: {
      threads: {
        maxThreads: 2,
        minThreads: 1,
      },
    },
  },
});
