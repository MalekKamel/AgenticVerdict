import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    passWithNoTests: true,
    fileParallelism: false,
    env: {
      VITEST: "true",
      COMPANY_CONFIG_DIR: path.join(rootDir, "test-fixtures/company-configs"),
    },
  },
});
