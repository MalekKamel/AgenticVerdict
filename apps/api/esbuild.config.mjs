import * as esbuild from "esbuild";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
/** Externalize all declared deps so Playwright and other heavy transitive graphs stay in node_modules. */
const external = Object.keys(pkg.dependencies);

const production = process.env.NODE_ENV === "production";

await esbuild.build({
  absWorkingDir: dir,
  entryPoints: [join(dir, "src/cli.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: join(dir, "dist/cli.mjs"),
  sourcemap: true,
  external,
  define: {
    "process.env.NODE_ENV": JSON.stringify(production ? "production" : "development"),
  },
  logLevel: "info",
});
