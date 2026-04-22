# Desktop–web parity: remaining work (implementation plan)

**Purpose:** Single place to track **outstanding** engineering work after Phases 0–4 in `desktop-frontend-lobechat-parity-implementation-plan.md`.  
**Baseline:** `apps/desktop` (Electron main/preload), embedded Nitro path, optional SPA build, deep links, Playwright embedded smoke, `electron-builder` wiring.  
**Audience:** Engineers planning sprints or CI; update this file when items ship.

**Status (2026-04-17):** Core backlog items are **implemented** in the monorepo (`@agenticverdict/desktop-ipc`, runtime API JSON, bundled Node fetch script, deep-link validation, SPA dashboard guard, CSP unit test, `electron-updater` wiring, main-process logging + Copy debug info, CI for desktop + desktop-ipc). Operational steps live in **`apps/desktop/README.md`**, **`desktop-release-checklist.md`**, and **ADR 0001**. Items below remain **product/ops** (tray, notifications, keychain storage, tenant-scoped E2E against a live API, Linux-specific CI packaging) unless the product reopens them.

---

## 1. Scope and principles

- **Do not duplicate** route or auth UI in `apps/desktop`; extend **`apps/frontend`** and thin bridges only.
- **Prefer** behavioral parity with the browser on the **same renderer bundle**; document intentional deltas (e.g. SPA-only session guards).
- **Ship in vertical slices:** each item below should have a **verification** step (manual checklist, automated test, or release note).

---

## 2. Runtime: Node and embedded server

| Priority | Work                                       | Rationale                                                                                                               | Acceptance criteria                                                                                                                                                                                                         |
| -------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | **Bundle or ship Node for production**     | ADR and `apps/desktop/README.md` state embedded Nitro requires **`node` on `PATH`** — unreliable for consumer installs. | Packaged app starts embedded server **without** a system-wide Node install (e.g. `resources/node` + `child_process.spawn` with explicit binary path, or documented **hard dependency** in installer if product accepts it). |
| P2       | **Graceful degradation when Node missing** | Today users see an error dialog; product may want a clearer UX.                                                         | Detect missing `node` before spawn; offer **“Open in browser”** or link to docs; log structured event for support.                                                                                                          |
| P3       | **Embedded server lifecycle**              | Long sessions, sleep/resume, multiple windows.                                                                          | Document and test: **single** server instance shared across windows (current `resolvedEntryHref` cache), clean **shutdown** on quit, no zombie processes on crash.                                                          |

**References:** `apps/desktop/src/embedded-web-server.ts`, `apps/desktop/src/main.ts`, `docs/architecture/desktop/adr-0001-desktop-production-renderer-hosting.md`.

---

## 3. Configuration and API discovery (packaged app)

| Priority | Work                                                               | Rationale                                                                          | Acceptance criteria                                                                                                                                     |
| -------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | **Stable `VITE_PUBLIC_API_URL` (and related) for packaged builds** | Plan §12.3: browser often uses dev proxy; desktop must target a **real** API base. | Build-time or runtime config (env file beside binary, remote config, or first-run wizard) is **documented** and **tested** end-to-end for login + tRPC. |
| P2       | **Cookie / `credentials: "include"` validation**                   | Electron `session` and secure cookies differ from Chromium defaults.               | Document `session` partition choice in `main.ts`; manual + optional automated check that **session** matches web for same API.                          |
| P3       | **Tenant headers**                                                 | Same as web: tenant resolution must not break in desktop.                          | Regression test or smoke step that hits a **tenant-scoped** route with expected headers.                                                                |

**References:** `apps/frontend/src/lib/api/trpc-client.ts`, `apps/desktop/src/main.ts` (`webPreferences`).

---

## 4. Parity matrix: SPA vs embedded Nitro

| Priority | Work                                      | Rationale                                                                                | Acceptance criteria                                                                                                                             |
| -------- | ----------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | **Decide production default per channel** | Two artifacts exist (`pnpm build` vs `build:spa`); ADR allows both.                      | Product + eng agree **default** for beta/GA; ADR or README updated with **when to use SPA**.                                                    |
| P2       | **Client-only session guards for SPA**    | Plan §6.2: `createServerFn` path differs in SPA; guards may need **client** equivalents. | If SPA is used for production desktop, protected routes have **no worse** security posture than agreed model (document FOUC, deep-link timing). |
| P3       | **CSP / nonce parity tests**              | Plan Phase 2 risk: CSP differs SSR vs static.                                            | Automated or scripted check that **critical** CSP rules hold for chosen artifact (or explicit waiver).                                          |

**References:** `apps/frontend/vite.config.ts`, `apps/frontend/src/start.ts`, `apps/frontend/src/lib/auth/protected-route-session.ts`.

---

## 5. Testing and CI

| Priority | Work                                         | Rationale                                                                                  | Acceptance criteria                                                                                                                                     |
| -------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | **Packaged-app E2E (or nightly)**            | Plan §10 stresses packaged verification; current smoke uses **dev-style** env + `.output`. | CI or scheduled job runs **Playwright against built installer or unpacked dir** (headful/VM as required), or documented **manual** gate before release. |
| P2       | **Extend coverage beyond embedded smoke**    | `embedded-smoke.spec.ts` is minimal.                                                       | At least: **locale/RTL** load, **one authenticated** path if test API available, or stubbed API.                                                        |
| P3       | **Root `pnpm test:e2e:desktop` in pipeline** | Ensure desktop tests run when `apps/desktop` changes.                                      | Turbo/CI matrix includes `test:e2e:desktop` with **prebuilt** `apps/frontend/.output` artifact caching.                                                 |

**References:** `apps/desktop/e2e/embedded-smoke.spec.ts`, root `package.json` scripts.

---

## 6. Distribution: updates, signing, channels

| Priority | Work                                                        | Rationale                                                                        | Acceptance criteria                                                                                            |
| -------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| P2       | **Auto-update**                                             | Plan Phase 4: deferred; README lists `electron-updater`.                         | When product requires it: **electron-updater** configured, **release channel** documented, **rollback** story. |
| P1       | **Code signing & notarization (macOS) / signing (Windows)** | `pnpm desktop:package` produces artifacts; users may hit Gatekeeper/SmartScreen. | Document **required** certs and CI secrets; optional **implementation** task in `electron-builder.yml`.        |
| P3       | **Linux packaging**                                         | May be out of scope for primary customer.                                        | If needed: AppImage/deb + CI; same embedded-server constraints as other platforms.                             |

**References:** `apps/desktop/electron-builder.yml`, `apps/desktop/README.md` (“Future hardening”).

---

## 7. Deep links and auth transport

| Priority | Work                       | Rationale                                                 | Acceptance criteria                                                                                                                                 |
| -------- | -------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2       | **OAuth / PKCE alignment** | Plan §7.3: future OAuth may need custom scheme callbacks. | When OAuth lands: **same** redirect URLs as web or documented mapping; **`DesktopDeepLinkBridge`** routes to correct **`/$locale/auth/...`** route. |
| P3       | **Deep link validation**   | Malformed or malicious `agenticverdict://` URLs.          | Whitelist hosts/paths or sanitize before `router.navigate`; unit tests for parser in `apps/desktop/src/deep-link.ts` if logic grows.                |

**References:** `apps/frontend/src/components/desktop/DesktopDeepLinkBridge.tsx`, `apps/desktop/src/deep-link.ts`.

---

## 8. IPC, types, and native features (optional scale-up)

| Priority | Work                               | Rationale                                         | Acceptance criteria                                                                                                                            |
| -------- | ---------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| P3       | **Shared IPC types package**       | Plan §7.4: extract when multiple consumers exist. | If preload surface grows beyond `agenticDesktop`, add **`packages/desktop-ipc`** (or similar) with **Zod** or TS types shared by main/preload. |
| P3       | **Secure storage / keychain**      | Some products store refresh tokens natively.      | Only if product requires: use **Electron** safe APIs; **no** secrets in `localStorage` without threat model.                                   |
| P3       | **Notifications, tray, shortcuts** | Lobe-style polish.                                | Product backlog; each feature behind **feature flags** in `CompanyConfig` or build flags.                                                      |

---

## 9. Observability and support

| Priority | Work                               | Rationale                                     | Acceptance criteria                                                                                                                                                           |
| -------- | ---------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P3       | **Desktop-specific diagnostics**   | Web telemetry may omit main-process failures. | Optional: minimal **main-process** logging (version, embedded server start/stop, deep link received) funneled to existing observability stack or file log with **PII** rules. |
| P3       | **User-visible “Copy debug info”** | Support requests for desktop.                 | Optional menu item: app version, OS, `VITE_PUBLIC_API_URL` presence (not value if sensitive), embedded vs remote renderer mode.                                               |

---

## 10. Documentation and developer experience

| Priority | Work                           | Rationale                                                | Acceptance criteria                                                                                                                   |
| -------- | ------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| P2       | **Single “release checklist”** | Operators need one page.                                 | Short doc: build order (`web` → `copy-frontend-output` → `electron-builder`), signing, smoke tests, known limitations (Node on PATH). |
| P3       | **Align Turbo pipeline**       | Plan §7.1: desktop packaging should depend on web build. | `turbo.json` / filter ensures **`desktop:package`** dependencies are explicit; no accidental stale `.output`.                         |

---

## 11. Suggested sequencing (milestones)

1. **M1 — Shippable installer:** API discovery for packaged app + signing/notarization docs + **one** packaged smoke path (manual or CI).
2. **M2 — Runtime hardening:** Bundled Node **or** explicit supported install story; improved error UX.
3. **M3 — Product features:** Auto-update, OAuth/deep-link hardening, optional secure storage.
4. **M4 — Polish:** Tray, notifications, richer E2E, desktop diagnostics.

Dependencies: **M1** blocks public beta; **M2** blocks “no Node installed” consumer story; **M3+** follow product priority.

---

## 12. Explicit exclusions (unless product reopens)

- Full **LobeChat** main-process feature parity (MCP, large native shells).
- Replacing **TanStack Start** as the web stack.

---

## 13. Progress log (engineering)

| Date                        | Items closed (summary)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-17 (initial)        | `resolveNodeExecutable`, missing-Node UX, Turbo `desktop:package`, embedded smoke + RTL, release checklist, ADR Node order.                                                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-04-17 (complete sweep) | **`@agenticverdict/desktop-ipc`**, `sanitizeDeepLinkUrl`, runtime **`desktop-runtime-config.json`** + preload **`getRuntimeConfig`**, tRPC **`getBaseUrl`** honors desktop + `VITE_PUBLIC_API_URL` in browser, SPA **`beforeLoad`** skip on dashboard, **`buildContentSecurityPolicy`** unit test, **`fetch-bundled-node`**, **`electron-updater`** + **`DESKTOP_UPDATES_URL`**, main menus + **Copy debug info**, structured logs, **`e2e/packaged-smoke.spec.ts`**, root Vitest project for desktop-ipc, CI desktop-ipc tests. |

_Document version: 2026-04-17. Maintainer: update when items close or when the production default (SPA vs embedded) changes._
