import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 60000,
    hookTimeout: 60000,
    teardownTimeout: 30000,
    include: ["test/**/*.test.ts"],
    /** Requires Docker; run `pnpm run test:integration` in this package. */
    exclude: ["**/node_modules/**", "test/**/*.integration.test.ts"],
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
