import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/error-translators.ts"],
      thresholds: {
        lines: 80,
        functions: 90,
        branches: 40,
        statements: 80,
      },
    },
  },
});
