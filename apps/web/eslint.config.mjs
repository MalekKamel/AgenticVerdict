import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".output/**",
      "dist/**",
      "build/**",
      "src/routeTree.gen.ts",
      "playwright-report/**",
      "test-results/**",
      "e2e/**",
      "test/**",
      "**/*.test.ts",
      "**/*.test.tsx",
    ],
  },
);
