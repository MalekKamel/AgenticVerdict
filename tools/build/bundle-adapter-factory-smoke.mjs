#!/usr/bin/env node
/**
 * Bundles platform adapter factory alone with NODE_ENV=production so the bundler can
 * drop the mock branch; fails if mock adapter symbols remain in output.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const pkgDir = join(root, "packages/data-connectors");
const pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
/** Keep @agenticverdict/config inlined so `process.env.NODE_ENV` define folds `IS_PRODUCTION`. */
const external = [
  ...Object.keys(pkg.dependencies).filter((name) => name !== "@agenticverdict/config"),
  /^node:/,
];
const outfile = join(pkgDir, "dist/adapter-factory.smoke.mjs");

await build({
  configFile: false,
  root: pkgDir,
  mode: "production",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    target: "node20",
    lib: {
      entry: join(pkgDir, "src/adapter-factory.ts"),
      formats: ["es"],
      fileName: () => "adapter-factory.smoke",
    },
    outDir: join(pkgDir, "dist"),
    emptyOutDir: false,
    minify: true,
    sourcemap: false,
    rollupOptions: {
      external,
      output: {
        entryFileNames: "adapter-factory.smoke.mjs",
      },
    },
  },
});

const content = readFileSync(outfile, "utf8");
const mockHits = (content.match(/MockPlatformAdapter|MockAdapterFactory/g) ?? []).length;
if (mockHits > 0) {
  console.error("adapter-factory smoke bundle still contains mock symbols:", mockHits);
  process.exit(1);
}
console.info("adapter-factory smoke bundle OK (no mock symbols):", outfile);
