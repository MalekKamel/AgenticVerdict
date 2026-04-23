import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    pool: "threads",
    passWithNoTests: true,
    fileParallelism: false,
    env: {
      VITEST: "true",
      TENANT_CONFIG_DIR: path.join(rootDir, "test-fixtures/tenant-configs"),
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "src/middleware/auth.ts",
        "src/middleware/jwt-tenant-context.ts",
        "src/middleware/tenant-route-als.ts",
        "src/startup/tenant-rls-startup-check.ts",
        "src/trpc/procedures.ts",
      ],
      exclude: ["node_modules/", "**/*.test.ts", "**/*.integration.test.ts"],
      thresholds: {
        lines: 75,
        statements: 75,
        branches: 70,
        functions: 70,
      },
    },
  },
});
