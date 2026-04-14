# Repository-wide Vite migration (production bundles)

**Date:** 2026-04-15  
**Scope:** Align API/worker production bundling and the adapter-factory smoke script with **Vite**, consistent with `apps/web`, and update scripts, Turbo task names, CI labels, and documentation that referenced **esbuild** for these paths.

## Summary

- **Added** `tools/build/vite-node-cli.config.mjs` — shared Vite library config for Node CLI bundles (`dist/cli.mjs`), externalizing npm `dependencies` and `node:` built-ins, with `process.env.NODE_ENV` defined from the build environment.
- **Added** `apps/api/vite.config.mjs` and `apps/worker/vite.config.mjs` — thin wrappers around the shared factory.
- **Removed** `apps/api/esbuild.config.mjs` and `apps/worker/esbuild.config.mjs`.
- **Renamed scripts:** `build:esbuild` → **`build:vite`**, **`benchmark:esbuild`** → **`benchmark:vite-bundles`** (root `package.json`). **Turbo** task **`build:esbuild`** → **`build:vite`** (`turbo.json`).
- **Migrated** `tools/build/bundle-adapter-factory-smoke.mjs` from esbuild to **`vite` `build()`** (minified smoke artifact unchanged path: `packages/data-connectors/dist/adapter-factory.smoke.mjs`).
- **Root devDependencies:** `esbuild` removed; **`vite`** `^8.0.8` added (matches `apps/web`).
- **API/worker devDependencies:** `esbuild` replaced with **`vite`** `^8.0.8`.

## Breaking changes

- Scripts or automation that invoked **`build:esbuild`** or **`benchmark:esbuild`** must use **`build:vite`** and **`benchmark:vite-bundles`** instead.

## How to run locally

```bash
# Production bundle verification (same as CI “Production Vite bundles” step)
NODE_ENV=production pnpm run verify:production-bundle

# Timed API/worker bundle probes
pnpm benchmark:vite-bundles
```

Default **`pnpm run build`** (Turbo **`tsc --noEmit`** in packages/apps) is unchanged; **`build:vite`** remains additive for production bundle hardening and mock-code scans.
