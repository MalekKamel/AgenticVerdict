import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    testTimeout: 60000,
    hookTimeout: 60000,
    teardownTimeout: 30000,
    fileParallelism: false,
    forceExit: true,
    dangerouslyIgnoreUnhandledErrors: false,
    sequence: {
      concurrent: false,
    },
  },
});
