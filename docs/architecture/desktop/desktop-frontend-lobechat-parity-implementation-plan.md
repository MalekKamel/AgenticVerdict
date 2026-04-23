# Desktop–web parity implementation plan (LobeChat-style)

**Status:** Phases 0–4 implemented in-repo (see `apps/desktop`, `apps/frontend` desktop bridge, ADR).  
**Audience:** Senior engineers implementing or reviewing Electron desktop work.  
**Related analysis:** `/ignored/lobe-chat-desktop-comparative-analysis.md`  
**Web application source:** `apps/frontend/` (npm package **`@agenticverdict/frontend`**) — TanStack Start + TanStack Router + Nitro.  
**Desktop shell:** **`apps/desktop`** (Electron). At the time this plan was written, the desktop app may exist only on a branch or as a stub; treat paths below as the **target layout** aligned with the comparative analysis and monorepo conventions.

---

## 1. Goal and success criteria

### 1.1 Goal

Align **`apps/desktop`** with a **LobeChat-style** model: **one primary UI and routing graph** — the same application consumers get in the browser — hosted inside the Electron **renderer**, with platform-specific code confined to **main**, **preload**, and thin **bridges**. The desktop experience should **mirror web routes and flows** (`/$locale/...`, auth, dashboard, etc.) instead of maintaining a parallel, hand-wired route tree that only imports fragments from the web package.

### 1.2 What “adequate plan” means

A senior engineer can:

- Map **Lobe’s intent** (full web reuse, desktop route slice or same router) onto **`apps/frontend`** and **`apps/desktop`** without guessing framework boundaries.
- Choose **dev vs production** loading strategies and know **what must run** (renderer only vs Node SSR vs API).
- Sequence work into **milestones** with **risks, mitigations**, and **verification** (manual + automated).

---

## 2. Naming and repository facts

| Name in docs / prompts                           | Actual location or package                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/frontend`                                  | Present; implements the web app. Package name in `package.json`: **`@agenticverdict/frontend`**.                                                                                                                                                                                                                           |
| `apps/frontend`                                  | Older docs may say `apps/frontend`; the **current** app path is **`apps/frontend`**.                                                                                                                                                                                                                                       |
| `packages/frontend` / `@agenticverdict/frontend` | Referenced in the comparative analysis as a **shared feature** layer. This repo’s **routing and TanStack Start shell** live under **`apps/frontend`**, not a separate `packages/frontend` UI router. Parity work should **anchor on `apps/frontend`** unless product explicitly standardizes on a different package split. |
| `apps/desktop`                                   | Intended Electron app; may not be checked in on every branch.                                                                                                                                                                                                                                                              |

---

## 3. Reference model (LobeChat) — intent to mirror

From the comparative analysis (read-only reference tree), LobeChat’s desktop stack:

- Uses **electron-vite** with a **renderer root** that includes the **same large SPA sources** as the web product.
- Desktop entry (e.g. `entry.desktop.tsx`) mounts **React Router** with **desktop-specific routes** while reusing shared modules and aliases.
- **Production** often serves the renderer via a **custom protocol** (e.g. `app://renderer`) and a **RendererUrlManager**; **development** uses a **renderer URL** (Vite dev server) unless forced static.
- **IPC** is structured (client/server packages) at scale; preload exposes a **narrow, typed** surface.

**Intent for AgenticVerdict:** Reuse **the same route modules and UI** as `apps/frontend` in the Electron renderer, and **avoid** a second bespoke router that duplicates auth/dashboard flows — **without** blindly copying Lobe’s main-process size or every service (updater, MCP, file search, etc.).

---

## 4. Current web stack (what parity must attach to)

### 4.1 Routing and locales

- File-based routes under `apps/frontend/src/routes/` with a generated **`routeTree.gen.ts`** (typically **gitignored**; produced by the TanStack Router Vite plugin during `pnpm dev` / `pnpm build`).
- User-facing UI is under **`/$locale/...`** (see `$locale/route.tsx`); supported locales and prefix behavior come from `src/i18n/routing.ts` (e.g. `en`, `ar`, **locale prefix always**).
- **RTL/LTR** is set per locale in the layout (e.g. `ar` → `rtl`).

### 4.2 Server-side behavior (critical for parity design)

The web app is **not** a pure static SPA today:

| Mechanism                  | Role                                                                                                                                                                                      | Desktop impact                                                                                                                                                        |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TanStack Start + Nitro** | SSR pipeline, middleware (e.g. CSP nonce in `src/start.ts`), **`pnpm start`** → `node .output/server/index.mjs`                                                                           | Loading “the web app” in Electron is **not** the same as loading a single `index.html` unless you introduce an **SPA-only** or **embedded server** strategy (see §6). |
| **`createServerFn`**       | e.g. `fetchProtectedRouteSession` in `src/lib/auth/protected-route-session.ts` — uses `getRequest()`, forwards cookies/headers to **Fastify tRPC** `auth.getSession` for protected routes | Requires a **request context** in SSR; in a pure static renderer, behavior must be **replaced or replicated** (client-only guard + same API calls).                   |
| **Dev auth mock**          | `VITE_PUBLIC_AUTH_API_MODE=mock` — SSR guard skipped in dev when mock enabled                                                                                                             | Desktop dev must align env so **session semantics** match web (see §8.2).                                                                                             |
| **File routes** `api.*.ts` | e.g. `/api/ready`, `/api/health` served by the Start/Nitro app                                                                                                                            | Desktop “health” story must clarify **Start app** vs **Fastify API** (port `3001` by default).                                                                        |
| **Vite dev proxy**         | `vite.config.ts` proxies `/api` → `http://localhost:3001`                                                                                                                                 | Browser may hit Fastify via proxy; **Electron** must use explicit base URLs for tRPC and avoid assuming same-origin unless the window origin is set up accordingly.   |

### 4.3 Client and API

- **tRPC** client (`src/lib/api/trpc-client.ts`) uses **`/api/v1/trpc`** with **`credentials: "include"`** and tenant headers from `authStore` / tenant resolution.
- **Backend** is the **Fastify** app (`@agenticverdict/api`), not optional for real sessions.

---

## 5. Architecture: Electron main, preload, renderer

### 5.1 Division of responsibility

| Layer        | Responsibility                                                                                                                                                                                                                                                              | Parity-focused notes                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Main**     | `BrowserWindow`, lifecycle, **single-instance** lock, **custom protocol** (if used for `file://` limitations), **deep links** / protocol handlers, **session partition** for cookie isolation, optional **child process** if the chosen strategy runs Nitro beside Electron | Keep **thin**: no business UI. Optionally run **local** Start server in dev or embed static assets in prod per §6. |
| **Preload**  | `contextBridge` exposing **`window.*`** API: typed **`invoke`**, optional **auth deep-link** subscription, **telemetry**, **shell** openExternal                                                                                                                            | Mirror Lobe’s **small surface**: avoid passing raw `ipcRenderer` to the renderer.                                  |
| **Renderer** | **Same React tree as web** (target state): TanStack Router, providers (`Providers.tsx`), layouts, pages                                                                                                                                                                     | **No duplicate** auth/dashboard implementations — only **environment adapters** (see §8).                          |

### 5.2 Loading strategies (choose explicitly)

**A. Remote URL (development parity — fastest to ship)**

- `mainWindow.loadURL(process.env.DESKTOP_RENDERER_URL ?? 'http://localhost:3000')` (port from `apps/frontend` dev server).
- **Pros:** Instant alignment with web HMR; no duplicate bundle.
- **Cons:** Requires **network stack** and the **Start dev server** running; not representative of packaged assets.

**B. Bundled static renderer (production-like)**

- Build `apps/frontend` for **client-only** output suitable for `loadFile` or **`custom protocol`** + `index.html` (depends on §6 SPA mode).
- **Pros:** Offline-capable UI shell; closer to shipped app.
- **Cons:** Must solve **SSR / server functions** (§6) and **asset paths** (relative vs `app://`).

**C. Hybrid (recommended for mature teams)**

- **Dev:** Strategy A.
- **Prod:** Strategy B with **SPA mode** or **in-process/static** server as decided in §6.
- Document **`DESKTOP_RENDERER_URL`** and **`DESKTOP_RENDERER_STATIC`** (or equivalent) flags mirroring Lobe’s **RendererUrlManager** intent.

---

## 6. Parity: TanStack Start / routing vs Electron constraints

### 6.1 What “full route parity” means here

| Dimension      | Definition                                                                                                                                                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **URL space**  | Same **logical** routes as the browser: `/$locale`, `/$locale/auth/*`, `/$locale/dashboard`, etc. **Hash vs history** may differ in `file://` contexts (legacy approach: hash router); **preferred** long-term is **history API** with a **custom protocol** or **`loadURL` to `http://127.0.0.1:<embedded>`** so routes match the web literally. |
| **Components** | Same route components, layouts, and providers as `apps/frontend` — **not** a second `DesktopRootRouter` that reimplements flows.                                                                                                                                                                                                                  |
| **Data**       | Same **tRPC** + React Query behavior against the same API contract; **tenant** and **session** headers consistent with web.                                                                                                                                                                                                                       |
| **i18n**       | Same locale list and **RTL/LTR** behavior; desktop may add a **default locale** or OS-locale detection but should not fork translation keys.                                                                                                                                                                                                      |

### 6.2 The SSR / server-function gap (must be resolved for true parity)

**Problem:** Protected routes use **`fetchProtectedRouteSession`** (`createServerFn`) which expects a **server request** in the Start runtime. A naive static export **does not** execute that the same way.

**Mitigation paths (pick one primary; others as fallbacks):**

1. **TanStack Start SPA mode**
   - Investigate official **SPA mode** (`tanstackStart` plugin `spa` options) so the desktop build produces a **client-only** bundle.
   - **Then:** Move or duplicate **session gating** for protected routes into **client `beforeLoad`** / `useRequireAuth` patterns that call the **same** `auth.getSession` semantics as the server function, with careful **security review** (flash of unauthenticated content, deep links).
   - **Track:** upstream issues around SPA bundles still containing unnecessary SSR code; adjust expectations for CI bundle size.

2. **Embedded Nitro server**
   - Run the **same** `.output/server` (or a slim variant) as a **child process** started from **main**, then `loadURL('http://127.0.0.1:<port>')`.
   - **Pros:** Behavioral parity with web SSR and `createServerFn` without rewriting guards.
   - **Cons:** Packaging, port selection, shutdown, security surface, and installer size.

3. **Desktop-only route wrapper**
   - Smaller scope than (1)/(2): keep **one** shared router but **replace** specific `beforeLoad` server functions in a desktop entry with **client-only** equivalents (feature flag or build-time alias).
   - **Cons:** Risk of **divergence** if not tightly tested; use only as a **transition** toward (1) or (2).

**Recommendation for planning:** Phase work so **development parity** (§5.2A) lands first; **production parity** explicitly selects (1) or (2) with a written ADR.

---

## 7. Integration: build, assets, deep linking, IPC

### 7.1 Build pipeline (monorepo)

- **Turbo:** `build` outputs include **`.output/**`** for the web app (`turbo.json`); desktop tasks should **`dependOn`** `^build` for the web app when packaging a bundled renderer.
- **electron-vite** (Lobe style) vs **esbuild triple-bundle** (minimal style):
  - **electron-vite** aligns with **shared Vite config** and a **monorepo root** as renderer root — closer to Lobe.
  - **esbuild-only renderer** is possible but fights TanStack Start’s **Vite plugin** and **generated route tree**; expect **pain** unless the renderer is prebuilt by `apps/frontend` and only **copied** into `apps/desktop/dist`.

**Suggested pattern:**

- **`apps/frontend`:** `pnpm build` produces **web** artifacts (Nitro + client chunks).
- **`apps/desktop`:** Script copies **client** assets appropriate for SPA mode **or** orchestrates **embedded server** startup; **main/preload** built with **esbuild** or **electron-vite**’s main/preload channels.

### 7.2 Environment and configuration

- Standardize on **`VITE_PUBLIC_*`** (per `CLAUDE.md`), not `NEXT_PUBLIC_*`.
- **Desktop-specific:** `VITE_PUBLIC_API_URL` must point to a **reachable** Fastify base (often `https://...` or `http://127.0.0.1:3001` for local).
- **Cookies:** `credentials: "include"` requires **same-site** or **explicit** cookie domain strategy; **Electron** `session` partition and **secure** cookie flags must be validated for each environment.

### 7.3 Deep linking and auth callbacks

- Register **custom URL schemes** in **electron-builder** (see comparative analysis).
- **Main** receives protocol URLs → forwards to **preload** subscription (`authDeepLink`-style) → **renderer** navigates with **TanStack Router** (`navigate`) to the correct **`/$locale/auth/...`** route.
- Align with **PKCE / OAuth** flows if added later; **do not** fork auth UI — only **transport**.

### 7.4 IPC and “no duplicated UI logic”

- **Keep IPC narrow:** filesystem, **shell.openExternal**, **notifications**, **updates**, **native** dialogs, **secure storage** tokens if needed.
- **Do not** reimplement **forms, validation, or dashboard** in main.
- If IPC surface grows, extract **typed shared types** (`packages/desktop-ipc` or similar) — optional until multiple consumers exist.

### 7.5 Optional Lobe patterns (selective)

- **Preload route / link interception** — external links open in **system browser**, in-app navigations stay in the **router** (useful when marketing links appear in content).
- **Custom `app://` protocol** for production assets — avoids `file://` quirks and enables **cleaner** history API.

---

## 8. Platform adapters (renderer vs main)

Today’s comparative analysis mentions **platform adapters** (storage, navigation). For parity:

- **Renderer** uses the same **React** patterns as web; **Electron-specific** APIs stay behind **`window.agenticDesktop`** (or similar) injected in preload.
- **Navigation:** Prefer **router navigation**; use **IPC** only when opening **OS** UI or **external** URLs.

---

## 9. Gaps, phases, risks, and mitigations

### Phase 0 — Preconditions

- [x] Confirm **`apps/desktop`** package exists and is wired in **pnpm workspace** (`apps/*`; package **`@agenticverdict/desktop`**).
- [x] ADR: **SPA mode vs embedded Nitro** for production (§6.2) — see **`adr-0001-desktop-production-renderer-hosting.md`**.
- [x] Document **single source of truth** for routes: **`apps/frontend/src/routes/`** (see **`apps/desktop/README.md`**).

### Phase 1 — Development parity

- [x] **Load dev server** in Electron (`DESKTOP_RENDERER_URL` optional; default `http://localhost:3000/`).
- [x] Align **env** (`VITE_PUBLIC_API_URL`, auth mock flags) with web — documented in **`apps/desktop/README.md`** (same variables as `apps/frontend`).
- [x] Smoke-test **locale**, **RTL**, **auth**, **dashboard** — **manual** checklist in §10.1; **automated** embedded-server smoke via **`apps/desktop/e2e/embedded-smoke.spec.ts`**.

**Risks:** Team assumes dev parity equals prod parity — **mitigate** with a **checklist** that includes **packaged** build.

### Phase 2 — Production renderer bundle

- [x] Implement **SPA mode** (`pnpm --filter @agenticverdict/frontend build:spa`) **and** **embedded Nitro** (`DESKTOP_EMBEDDED_SERVER` + `.output` copy) per ADR.
- [x] **Asset loading:** embedded server uses **http://127.0.0.1** origin (history API); optional **`DESKTOP_RENDERER_STATIC`** for `file://` experiments.
- [x] **electron-builder**: `electron-builder.yml` + `copy-frontend-output` + `extraResources` for `frontend-output`.

**Risks:** **CSP / nonce** (`src/start.ts`, `csp.ts`) differs between SSR and static — **mitigate** with env-specific CSP tests.  
**Risks:** **Server functions** behave differently — **mitigate** with **E2E** on **packaged** app (see §10).

### Phase 3 — Deep links and shell polish

- [x] Protocol registration (`agenticverdict://`) + renderer navigation via **`DesktopDeepLinkBridge`**.
- [x] **Window open** handler sends external **http(s)** links to the system browser (in-app navigation stays in the router).

### Phase 4 — Hardening

- [x] **Auto-update** — documented as **future** (`electron-updater`); not enabled by default.
- [x] **Observability** — same web bundle in embedded/dev mode reuses **web** client telemetry; no separate desktop fork required.

---

## 10. Verification

### 10.1 Manual

| Check              | Pass criteria                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Route map          | Every primary web route reachable in desktop with **same layout** (modulo window chrome).  |
| Locale / RTL       | `ar` shows **RTL**; switching locale updates **router** and **i18n**.                      |
| Auth               | Login, logout, protected **dashboard** redirect behavior matches web **for the same API**. |
| Deep link          | Custom protocol opens **correct** auth or post-login route.                                |
| Offline / API down | Graceful errors consistent with web (no silent failures).                                  |

### 10.2 Automated

- **Playwright (desktop):** `apps/desktop/e2e/embedded-smoke.spec.ts` launches Electron with **`DESKTOP_EMBEDDED_SERVER=1`** (requires `pnpm --filter @agenticverdict/frontend build` first). Root: **`pnpm test:e2e:desktop`**.
- **Playwright (web):** Existing **`apps/frontend`** e2e specs remain the place for full **auth + locale** flows in Chromium; extend with Electron when CI has a display or headful runner.
- **CI:** `turbo run build` includes **`apps/frontend`** and **`apps/desktop`** main/preload bundles; **`pnpm desktop:package`** produces installers when signing/notarization is configured.
- **Contract tests:** tRPC **session** + **tenant** headers unchanged between web and desktop clients (same renderer bundle + API).

---

## 11. Explicit non-goals (this plan)

- Porting **Lobe’s** entire main process (MCP, file search, large menu systems) — **not required** for route parity.
- Replacing **TanStack Start** with a different framework — **out of scope**.
- Shipping a **portable Node runtime** inside the desktop installer — **optional** future work (embedded server currently expects **Node on `PATH`**).

---

## 12. Quick decision checklist (for implementers)

1. **Production hosting:** SPA static in renderer **vs** **embedded Nitro** — **which ADR?**
2. **Navigation API:** hash **vs** history + **custom protocol** — **which for v1?**
3. **API base:** How does **packaged** app discover **`VITE_PUBLIC_API_URL`** (env file, build-time, remote config)?
4. **Session parity:** How are **`createServerFn`** guards **replaced or preserved** on desktop?
5. **Verification:** Minimum **Playwright** coverage for **desktop** artifact in CI?

---

_Document version: 2026-04-17. Update when `apps/desktop` lands or when TanStack Start SPA/SSR behavior changes._
