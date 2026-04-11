import { defineConfig } from "vitest/config";

/** Monorepo packages/apps that expose Vitest unit tests (integration tests stay package-local). */
const testProjects = [
  "tests/integration",
  "tests/orchestrator",
  "tests/utils",
  "packages/mock-platform-server",
  "packages/observability",
  "packages/config",
  "packages/core",
  "packages/database",
  "packages/i18n",
  "packages/testing",
  "packages/types",
  "packages/report-generator",
  "packages/agent-runtime",
  "packages/data-connectors",
  "apps/api",
  "apps/worker",
  "apps/web",
];

export default defineConfig({
  test: {
    projects: testProjects,
    coverage: {
      provider: "v8",
      reporter: process.env.CI
        ? ["text", "json-summary", "lcov"]
        : ["text", "html", "json-summary", "lcov"],
      reportsDirectory: "./coverage",
      include: ["packages/**/src/**/*.ts", "apps/**/src/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/*.integration.test.ts",
        "**/node_modules/**",
        "**/dist/**",
        "**/.next/**",
        // Stubs / shells — covered in later phases; keep coverage focused on exercised foundation code.
        // data-connectors + agent-runtime are Phase 7 foundation interfaces (included in coverage).
        "apps/api/**",
        "apps/worker/**",
        "apps/web/**",
        "packages/report-generator/**",
        "packages/types/**",
        // DB runtime wiring — integration tests excluded from unit coverage.
        "packages/database/src/client.ts",
        "packages/database/src/db-scoped.ts",
        "packages/database/src/redis.ts",
        "packages/database/src/tenant-lifecycle.ts",
        "packages/database/src/tenant-provisioning.ts",
      ],
      thresholds: {
        lines: 70,
        functions: 65,
        branches: 65,
        statements: 70,
      },
    },
  },
});
