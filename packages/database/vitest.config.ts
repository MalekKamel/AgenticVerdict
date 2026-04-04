import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 120_000,
    hookTimeout: 120_000,
    include: ["test/**/*.test.ts"],
    /** Requires Docker; run `pnpm run test:integration` in this package. */
    exclude: ["**/node_modules/**", "test/**/*.integration.test.ts"],
  },
});
