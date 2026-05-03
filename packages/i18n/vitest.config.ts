import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    passWithNoTests: true,
    forceExit: true,
    dangerouslyIgnoreUnhandledErrors: false,
    teardownTimeout: 30000,
    testTimeout: 60000,
    hookTimeout: 60000,
  },
});
