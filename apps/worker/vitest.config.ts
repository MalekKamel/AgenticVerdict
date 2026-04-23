import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/tenant/**/*.ts", "src/queues/**/*.ts", "src/services/**/*.ts"],
      exclude: ["node_modules/", "**/*.test.ts", "**/*.integration.test.ts"],
      thresholds: {
        lines: 70,
        statements: 70,
        branches: 65,
        functions: 65,
      },
    },
  },
});
