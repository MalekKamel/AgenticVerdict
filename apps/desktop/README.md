# AgenticVerdict desktop (Electron)

Thin shell that loads the **same** web application as the browser (`@agenticverdict/frontend` in `apps/frontend`). UI, routing, and i18n live in the frontend; this package only contains **main process**, **preload**, and IPC bridges.

## Route parity

All routes are defined under **`apps/frontend/src/routes/`** (file-based TanStack Router). Do not add a second router here.

## Development (HMR)

1. Start API (default `http://localhost:3001`) and web dev server: `pnpm --filter @agenticverdict/frontend dev` (port **3000**).
2. From the repo root:

```bash
pnpm desktop:dev
```

The window loads **`DESKTOP_RENDERER_URL`** if set; otherwise **`http://localhost:3000/`**. The Vite dev proxy forwards `/api` to Fastify like the browser.

### Align env with the web app

Use the **same** `VITE_PUBLIC_*` variables as `apps/frontend` (e.g. in `apps/frontend/.env.local`). Relevant examples:

| Variable                    | Role                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| `VITE_PUBLIC_API_URL`       | Fastify base when not using same-origin proxy (required for many static/offline builds). |
| `VITE_PUBLIC_AUTH_API_MOCK` | Set to `"false"` when exercising real auth against the API (matches web).                |

Electron-specific:

| Variable                          | Role                                                                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DESKTOP_RENDERER_URL`            | Override renderer URL (e.g. `http://127.0.0.1:3000/`).                                                                                              |
| `DESKTOP_RENDERER_STATIC`         | Path to an `index.html` for static experiments (`file://`).                                                                                         |
| `DESKTOP_EMBEDDED_SERVER`         | `1` to spawn the TanStack/Nitro `.output` server (see below).                                                                                       |
| `DESKTOP_WEB_OUTPUT_PATH`         | Absolute path to `apps/frontend/.output` when using embedded server.                                                                                |
| `DESKTOP_DISABLE_SINGLE_INSTANCE` | `1` for Playwright or overlapping dev processes (disables single-instance lock).                                                                    |
| `DESKTOP_DISABLE_DEEP_LINK`       | `1` to skip `agenticverdict://` protocol registration.                                                                                              |
| `DESKTOP_DISABLE_DEVTOOLS`        | `1` to avoid opening detached DevTools when `isDev` is true (e.g. Playwright).                                                                      |
| `DESKTOP_NODE_BINARY`             | Absolute path to `node` when not using PATH or bundled `resources/node`.                                                                            |
| `DESKTOP_FALLBACK_BROWSER_URL`    | When Node is missing for the embedded server, error dialog can offer **Open in browser** (https URL).                                               |
| `DESKTOP_DOCS_URL`                | Optional second button **Open documentation** on the same dialog.                                                                                   |
| `DESKTOP_UPDATES_URL`             | When set in a **packaged** build, enables **`electron-updater`** generic feed checks (host must publish `latest.yml` + artifacts next to that URL). |

## Runtime API URL (optional JSON)

Besides **`VITE_PUBLIC_*` at build time**, operators can ship **`resources/desktop-runtime-config.json`** (packaged app) and/or **`userData/desktop-runtime-config.json`** (user override) with:

```json
{ "apiBaseUrl": "https://api.example.com" }
```

The preload exposes this to the renderer via **`window.agenticDesktop.getRuntimeConfig()`**; **`userData`** wins over **`resources`**. See `resources/desktop-runtime-config.example.json`.

## Embedded Nitro (production-style)

After `pnpm --filter @agenticverdict/frontend build`, the main process can spawn:

`apps/frontend/.output/server/index.mjs`

on **127.0.0.1** with a random port and open `http://127.0.0.1:<port>/`. This keeps **SSR + `createServerFn`** behavior aligned with the browser.

- **Development:** `DESKTOP_EMBEDDED_SERVER=1` and optional `DESKTOP_WEB_OUTPUT_PATH` (defaults to `../../frontend/.output` from `dist/`).
- **Packaged:** copy `.output` into `resources/frontend-output` (`pnpm copy-frontend-output`) so `electron-builder` ships it as an `extraResource`. **Node** is resolved in order: `DESKTOP_NODE_BINARY` → bundled **`resources/node`** (see `electron-builder.yml` comments) → **`node` on `PATH`**.

### Packaged app API URL (`VITE_PUBLIC_*` + runtime JSON)

Browser dev often uses the Vite proxy; **installers** usually bake a real API base into the frontend bundle (`VITE_PUBLIC_API_URL` in `apps/frontend/.env.production` or CI env). The renderer also honors **`getRuntimeConfig().apiBaseUrl`** when present (see JSON above), which is useful when the API endpoint changes without rebuilding the web bundle.

### Bundled Node (no system Node on PATH)

```bash
pnpm --filter @agenticverdict/desktop fetch-bundled-node
# optional: NODE_BUNDLE_VERSION=20.18.1
```

Then uncomment **`extraResources`** for `resources/node` in `electron-builder.yml` and package. **`resources/node/`** is gitignored (large binaries).

## Deep links

`agenticverdict://host/path...` is registered when supported by the OS. The main process and **`DesktopDeepLinkBridge`** validate URLs with **`sanitizeDeepLinkUrl`** (`@agenticverdict/desktop-ipc`) before navigation — locale routes **`/en`**, **`/ar`**, **`/auth/*`**, and **`host === "auth"`** (OAuth-style callbacks). When OAuth flows land in the product, keep redirect targets aligned with web (same path/query shape); map to **`/$locale/auth/...`** in the SPA.

## Packaging

```bash
pnpm desktop:package
```

Runs **`turbo`** so **`@agenticverdict/frontend` `build`** completes before **`copy-frontend-output`** and **`electron-builder`** (see root `turbo.json` `package` task). See `electron-builder.yml`.

### Code signing and notarization (release)

Installers are unsigned by default. For macOS distribution outside the dev team, plan for **Apple Developer ID** signing + **notarization**, and for Windows **Authenticode** / SmartScreen. Store **certificates and secrets only in CI** or secure release machines; document thumbprints and which GitHub Actions secrets feed `electron-builder`. Details belong in **`/docs/architecture/desktop/desktop-release-checklist.md`**.

## Tests

```bash
pnpm --filter @agenticverdict/frontend build   # produces apps/frontend/.output
pnpm --filter @agenticverdict/desktop build # main/preload bundle (run after changing apps/desktop/src before e2e)
pnpm --filter @agenticverdict/desktop test    # unit (Vitest)
pnpm --filter @agenticverdict/desktop test:e2e
pnpm --filter @agenticverdict/desktop-ipc test
```

Optional **unpacked installer smoke:** build with `electron-builder --dir`, set **`ELECTRON_PACKAGED_EXEC`** to the main binary, run `pnpm --filter @agenticverdict/desktop test:e2e` (includes `e2e/packaged-smoke.spec.ts`).

**Support:** **Edit → Copy debug info** pastes JSON (version, OS, renderer mode, whether runtime `apiBaseUrl` is set — not the secret value).

## SPA static build (optional)

For a client-only Vite artifact (TanStack Start SPA mode):

```bash
pnpm --filter @agenticverdict/frontend build:spa
```

See `vite.config.ts` (`mode === "spa"`). Evaluate CSP, cookies, and `createServerFn` tradeoffs before using this for production desktop.

## pnpm 10 and Electron

The workspace root **`package.json`** lists **`electron`** (and **`esbuild`**) under **`pnpm.onlyBuiltDependencies`**. If Electron fails at runtime, run **`pnpm install`** from the repo root.

## Production strategy

See **`/docs/architecture/desktop/adr-0001-desktop-production-renderer-hosting.md`**.

## Implemented / backlog

- **Auto-update:** `electron-updater` runs when **`DESKTOP_UPDATES_URL`** is set on packaged builds; configure **`publish`** in `electron-builder.yml` for release hosts. **Rollback:** reinstall a previous version from your release archive (same channel).
- **Ship Node:** `pnpm fetch-bundled-node` + optional `extraResources` (see above).
- **Shared IPC:** `@agenticverdict/desktop-ipc` (channels, runtime config schema, deep-link sanitizer).
- **Deeper product features** (tray, notifications, secure storage) remain configuration-driven backlog items — see `desktop-remaining-work-implementation-plan.md` if reopened.
