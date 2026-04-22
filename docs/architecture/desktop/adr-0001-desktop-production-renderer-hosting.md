# ADR 0001: Desktop production renderer hosting (SPA vs embedded Nitro)

**Status:** Accepted (2026-04-17)  
**Context:** `/docs/architecture/desktop/desktop-frontend-lobechat-parity-implementation-plan.md` §6.2

## Context

`apps/frontend` ships as **TanStack Start + Nitro** with SSR and `createServerFn` for protected-route session probes. Electron can load the **dev server** (`http://localhost:3000`) for parity without extra work. Production requires an explicit strategy: static client bundle vs running the same Nitro server inside or beside Electron.

## Decision

1. **Development (immediate):** Load the web app via **`DESKTOP_RENDERER_URL`** (default `http://localhost:3000/`). The Vite dev server keeps HMR and the same route modules as the browser.

2. **Production (implemented path):** **Embedded Nitro** — the desktop main process spawns **`node apps/frontend/.output/server/index.mjs`** (copied to `resources/frontend-output` for installers) on **127.0.0.1** and loads `http://127.0.0.1:<port>/`. This preserves **`createServerFn`** / SSR behavior without rewriting route guards. The main process resolves Node in this order: **`DESKTOP_NODE_BINARY`**, a **bundled** binary under **`resources/node`** (optional `extraResources`; see `resolveNodeExecutable` in `apps/desktop`), otherwise **`node` on `PATH`**.

3. **Alternative retained:** **TanStack Start SPA mode** (`pnpm --filter @agenticverdict/frontend build:spa`) for CDN-style static hosting when cookie/session tradeoffs and server-function behavior are acceptable; see `vite.config.ts` when `mode === "spa"`.

4. **Default for desktop beta/GA installers:** **Embedded Nitro** using the same **`pnpm --filter @agenticverdict/frontend build`** artifact as a typical web deployment. **SPA** is reserved for intentional static-only scenarios (smaller surface, different session model); dashboard **`beforeLoad`** skips SSR session probes in `import.meta.env.MODE === "spa"` and relies on **`useRequireAuth`** client-side (expect possible FOUC vs SSR).

## Consequences

- Production work must update **CSP, base asset URLs, and CI** for the chosen artifact (static vs server).
- Session parity between web and desktop must be **tested** on packaged builds (see implementation plan §10).

## Links

- Route source of truth: `apps/frontend/src/routes/`
- Protected route server function: `apps/frontend/src/lib/auth/protected-route-session.ts`
