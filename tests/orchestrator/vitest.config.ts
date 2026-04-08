import { defineConfig } from "vitest/config";

const junitOutput = process.env.VITEST_JUNIT_OUTPUT?.trim();
const reporters: Array<string | [string, Record<string, unknown>]> = ["default"];
if (junitOutput && junitOutput.length > 0) {
  reporters.push(["junit", { outputFile: junitOutput }]);
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    reporters,
  },
});
