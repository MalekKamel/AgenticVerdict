import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    passWithNoTests: true,
    include: ["src/**/*.{test,spec}.ts", "src/**/*.{test,spec}.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/test/", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "e2e/"],
    },
  },
  resolve: {
    // Vitest can resolve a different Vite major than apps/web; keep @ explicit for stable tests.
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
