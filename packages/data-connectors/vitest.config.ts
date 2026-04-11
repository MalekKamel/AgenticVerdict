import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.integration.test.ts",
        "src/index.ts",
        "src/normalization/index.ts",
        "src/normalization/types.ts",
        "src/validation/index.ts",
        "src/validation/types.ts",
        "src/credentials.ts",
        "src/date-range.ts",
        "src/cache/types.ts",
        "src/test-utils.ts",
        "src/meta/models.ts",
        "src/ga4/models.ts",
        "src/gsc/models.ts",
        "src/gbp/models.ts",
        "src/tiktok/models.ts",
      ],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 85,
      },
    },
  },
});
