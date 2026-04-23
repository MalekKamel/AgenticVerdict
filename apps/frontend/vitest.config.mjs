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
      /**
       * Phase 3 scoped gate: tRPC client surface, tenant resolution, auth/MFA helpers, primary auth guard.
       * Broader `src/lib/**` is covered incrementally; global monorepo Vitest still excludes `apps/frontend/**`.
       */
      include: [
        "src/hooks/useRequireAuth.ts",
        "src/lib/api/trpc-client.ts",
        "src/lib/api/trpc-error-mapping.ts",
        "src/lib/api/trpc-error-message.ts",
        "src/lib/api/trpc-retry-policy.ts",
        "src/lib/auth/auth-access-policy.ts",
        "src/lib/auth/mfa-readiness.ts",
        "src/lib/auth/protected-route-session.ts",
        "src/lib/feature-flags/feature-flags-readiness.ts",
        "src/lib/observability/client-log.ts",
        "src/lib/observability/telemetry-ingest.ts",
        "src/lib/observability/telemetry-sample-rate.ts",
        "src/lib/observability/web-vitals.ts",
        "src/lib/onboarding/onboarding-readiness.ts",
        "src/routes/$locale/dashboard.tsx",
        "src/routes/$locale/onboarding.tsx",
        "src/lib/tenant/tenant-branding.ts",
        "src/lib/tenant/tenant-resolution.ts",
      ],
      exclude: ["node_modules/", "src/test/", "**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "e2e/"],
      thresholds: {
        lines: 78,
        statements: 78,
        branches: 70,
        functions: 70,
      },
    },
  },
  resolve: {
    // Vitest can resolve a different Vite major than apps/frontend; keep @ explicit for stable tests.
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
