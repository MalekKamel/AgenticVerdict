import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Vite library build for Node CLI entrypoints (API/worker): single ESM bundle,
 * npm dependencies externalized, NODE_ENV defined from the invoking environment.
 * @param {string} appRoot Absolute path to apps/api or apps/worker
 */
export function createNodeCliConfig(appRoot) {
  const pkg = JSON.parse(readFileSync(join(appRoot, "package.json"), "utf8"));
  const production = process.env.NODE_ENV === "production";

  return defineConfig({
    root: appRoot,
    define: {
      "process.env.NODE_ENV": JSON.stringify(production ? "production" : "development"),
    },
    build: {
      target: "node20",
      lib: {
        entry: join(appRoot, "src/cli.ts"),
        formats: ["es"],
        fileName: () => "cli",
      },
      outDir: join(appRoot, "dist"),
      emptyOutDir: true,
      sourcemap: true,
      minify: false,
      rollupOptions: {
        external: [...Object.keys(pkg.dependencies), /^node:/],
        output: {
          entryFileNames: "cli.mjs",
        },
      },
    },
  });
}
