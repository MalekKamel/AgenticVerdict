#!/usr/bin/env node
import * as esbuild from "esbuild";
import process from "node:process";

const watch = process.argv.includes("--watch");

const mainCtx = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "dist/electron-main.mjs",
  external: ["electron"],
  sourcemap: true,
  target: "node20",
});

const preloadCtx = await esbuild.context({
  entryPoints: ["src/preload.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "dist/preload.mjs",
  external: ["electron"],
  sourcemap: true,
  target: "node20",
});

if (watch) {
  await Promise.all([mainCtx.watch(), preloadCtx.watch()]);
} else {
  await Promise.all([mainCtx.rebuild(), preloadCtx.rebuild()]);
  await Promise.all([mainCtx.dispose(), preloadCtx.dispose()]);
}
