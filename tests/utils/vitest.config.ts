import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["**/*.integration.test.ts"],
    forceExit: true,
    dangerouslyIgnoreUnhandledErrors: false,
    teardownTimeout: 30000,
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
