import eslint from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
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
      "coverage/**",
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
