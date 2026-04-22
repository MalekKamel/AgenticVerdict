# Desktop release checklist

Use this before publishing a desktop build (beta/GA). Adjust steps for your signing and hosting setup.

## Build order

1. Set production **`VITE_PUBLIC_*`** values (especially **`VITE_PUBLIC_API_URL`**) for the target API — same as web production. Optionally prepare **`resources/desktop-runtime-config.json`** (or ship user-editable **`userData/desktop-runtime-config.json`**) for **`apiBaseUrl`** overrides without rebuilding the web bundle.
2. Optional: **`pnpm --filter @agenticverdict/desktop fetch-bundled-node`** and enable **`extraResources`** for **`resources/node`** in `electron-builder.yml` so end users do not need Node on `PATH`.
3. From the repo root: **`pnpm desktop:package`** (runs **`@agenticverdict/frontend` build** via Turbo, then **`copy-frontend-output`**, then **`electron-builder`**).
4. Confirm **`resources/frontend-output`** exists inside the packaged app (or your unpacked output dir) and contains **`server/index.mjs`**.

## Signing and distribution

- **macOS:** Plan Apple **Developer ID Application** signing and **notarization** for Gatekeeper; keep certificates and notary credentials out of git (CI secrets only).
- **Windows:** Plan **Authenticode** signing to reduce SmartScreen friction.
- **Linux:** If shipping AppImage/deb, apply the same embedded-server constraints (Node resolution, API URL) as other platforms.

## Verification

- Run **`pnpm --filter @agenticverdict/frontend build`** then **`pnpm --filter @agenticverdict/desktop-ipc test`**, **`pnpm --filter @agenticverdict/desktop test`**, and **`pnpm test:e2e:desktop`** (embedded Nitro smoke + locale/RTL; CI runs these).
- Optional: **`ELECTRON_PACKAGED_EXEC`** + **`pnpm --filter @agenticverdict/desktop test:e2e`** for unpacked-binary smoke (`e2e/packaged-smoke.spec.ts`).

## Known limitations (document in release notes)

- Embedded Nitro needs a **Node** binary via **`DESKTOP_NODE_BINARY`**, bundled **`resources/node`**, or **PATH** unless the app uses **`DESKTOP_RENDERER_URL`** for a hosted web app.
- **Auto-update** requires **`DESKTOP_UPDATES_URL`** at runtime plus a proper **`publish`** feed / `latest.yml` layout (see `apps/desktop/README.md`).
