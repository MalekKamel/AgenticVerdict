# Frontend authentication: deferred implementation plan

This document expands the **explicitly deferred** follow-ups from the localized auth production-readiness work (`apps/frontend/src/routes/$locale/auth` and related components). It is intended for product, legal, operations, and engineering leads to sequence work without blocking incremental shipping.

## Context (current state)

- **Legal and help surfaces exist** as locale-scaffolded routes: `/$locale/auth/terms`, `/$locale/auth/privacy`, `/$locale/auth/help`, wired from `AuthLayout` and registration copy. Message keys live under `auth.legal.*` and `auth.help` in `apps/frontend/messages/{en,ar,fr}.json`.
- **Copy is explicitly placeholder** (disclosed in strings) until counsel and operations publish canonical text and channels.
- **Auth routes render inside the standard app shell** (`AppShellLayout` via `$locale/route.tsx`): signed-out users still see global chrome (nav, command palette, etc.). A slimmer “auth-only” shell was deferred.
- **Route-level `<head>` meta** is inconsistent across auth screens (e.g. some titles reference “Masafh”, others “AgenticVerdict”). Unification was deferred.

---

## Track A — Canonical legal and support content

### A1. Terms of Service (final)

**Owner:** Legal + Product  
**Engineering touchpoints:** `auth.legal.terms` in locale JSON; optional future CMS or static MD pipeline if policies outgrow JSON.

| Step | Action                                                                                                                                                                                    | Output                                      |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| A1.1 | Legal drafts jurisdiction-aware Terms (KSA primary tenant, export if multi-region).                                                                                                       | Approved Terms document.                    |
| A1.2 | Product maps sections to existing UI structure (`title`, `lastUpdated`, `section1–3Title/Body`, `footerNote`, `backToSignIn`) or adjusts `AuthLegalDocument` for additional sections/TOC. | Spec for copy blocks vs. component changes. |
| A1.3 | Localization: professional `ar` (RTL) and `fr` (or drop `fr` if unsupported in production) translations; ICU placeholders if variables (effective date, version).                         | Updated `messages/*.json`.                  |
| A1.4 | Remove placeholder disclaimers from `lastUpdated` / body strings once approved.                                                                                                           | No “placeholder” language in prod builds.   |
| A1.5 | Add version or “effective date” surfaced in UI; consider deep links (`?version=`) if multiple versions must remain addressable.                                                           | UX + routing decision recorded.             |

**Acceptance criteria**

- [ ] No string states that the page is a placeholder in production builds (use build flag or env if staging must keep a banner).
- [ ] Content review sign-off documented (owner, date, revision id).
- [ ] `pnpm run i18n:validate` passes; RTL spot-check on `/ar/auth/terms`.

**Risks:** Legal lag blocks launch — mitigate with “minimum viable” jurisdiction-specific PDF linked from the same route until HTML is ready.

---

### A2. Privacy Policy (final)

Same pattern as A1, keyed under `auth.legal.privacy`.

| Step | Action                                                                                                                                                | Output                                       |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| A2.1 | Privacy program defines data categories, purposes, subprocessors, retention, cross-border transfers, and KSA/PDPL-relevant disclosures as applicable. | Approved Privacy document.                   |
| A2.2 | Align with actual product telemetry and backend data flows (inventory vs. marketing copy).                                                            | Data map appendix linked from internal wiki. |
| A2.3 | Engineering: replace placeholder bodies; add links to **cookie policy** / **subprocessor list** if required (new routes or anchors).                  | Routes or in-page sections.                  |

**Acceptance criteria**

- [ ] Privacy copy matches **implemented** data practices (connectors, auth, logs, support tools).
- [ ] Contact / DPO or regional equivalent per legal advice appears in copy or footer.

---

### A3. Help and support (operations-owned)

**Owner:** Operations / Customer success + Product  
**Engineering touchpoints:** `AuthHelpContent` in `apps/frontend/src/components/auth/AuthLegalDocument.tsx`, `auth.help` messages.

| Step | Action                                                                                                                                                                         | Output                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| A3.1 | Publish canonical support email, phone, hours, SLA tier matrix, and escalation path.                                                                                           | Single source of truth (e.g. internal ops doc + public values). |
| A3.2 | Replace `support@masafh.com` placeholder; consider `TenantConfig` or env (`VITE_PUBLIC_SUPPORT_EMAIL`) so white-label tenants differ without redeploying copy for each tenant. | Config contract + frontend read path.                           |
| A3.3 | Add links to **status page**, **knowledge base**, or **chat widget** if product provides them (auth-only shell may affect widget placement).                                   | Optional components behind feature flags.                       |
| A3.4 | Internationalize support instructions (Arabic/English minimum).                                                                                                                | Messages + RTL layout check on help page.                       |

**Acceptance criteria**

- [ ] Support channel is valid, monitored, and matches website/marketing.
- [ ] No hardcoded tenant-specific secrets; tenant-aware values flow from approved config layer.
- [ ] Help page lists legal links (already present) and any new operational links with accessible labels.

**Dependencies:** If support email becomes config-driven, coordinate with `@agenticverdict/config` / tenant bootstrap API so SSR and client agree.

---

## Track B — Dedicated unauthenticated (auth-only) shell

### Problem

Today `$locale/route.tsx` wraps all locale routes in `AppShellLayout`. Unauthenticated users on `/auth/*` see primary navigation, command palette, and shell bootstrap behavior that may be empty, confusing, or leak “signed-in UX” patterns.

### B1. Discovery and UX spec

| Step | Action                                                                                                       | Output                                             |
| ---- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| B1.1 | Product defines which chrome is allowed on auth pages (logo only vs. language + theme vs. marketing header). | Wireframe + accessibility notes.                   |
| B1.2 | Engineering audits what `AppShellLayout` provides today (skip links, nav, tenant hooks, analytics).          | List of required vs. removable behaviors for auth. |

### B2. Routing / layout refactor options

Choose one approach (document decision in ADR or short architecture note):

1. **Nested layout under `/$locale`:** Add `apps/frontend/src/routes/$locale/auth/route.tsx` that renders `AuthChromeLayout` + `<Outlet />`, and **exclude** `auth` subtree from `AppShellLayout` by restructuring so `AppShellLayout` only wraps non-auth segments (e.g. move shell to `dashboard`/`onboarding` layout routes). _Requires careful move of `Providers` / `I18nProvider` boundaries._
2. **Parallel branch layout:** Keep `$locale/route.tsx` minimal (providers + `dir`/`lang` only); introduce two child layout routes (`(app)` vs `(auth)`) if the router version supports pathless layout groups cleanly.
3. **Conditional shell in `AppShellLayout`:** If pathname matches `/auth`, render stripped chrome. _Fastest but easy to accumulate conditionals — prefer structural split if auth grows._

### B3. Implementation checklist

- [ ] Preserve **WCAG** skip link and **one logical `<main>`** per page.
- [ ] Preserve **RTL/LTR** from locale (`dir` on wrapper).
- [ ] Ensure **TenantProvider** / theme tokens still work if auth pages use tenant-themed colors.
- [ ] Re-run **Playwright** auth specs (`apps/frontend/e2e`, `apps/frontend/test/e2e/auth`) and **axe** suites against `/en/auth/login` (and `/ar/...`).
- [ ] Confirm **deep links** (password reset with `?token=`, verify email) still load without shell-only JS errors.

**Acceptance criteria**

- [ ] Auth pages do not show member navigation or command palette unless product explicitly wants them.
- [ ] No duplicate skip links or duplicate `main` landmarks unless intentionally designed (e.g. global + local — avoid).
- [ ] Shell analytics events do not fire misleading “navigation opened” events on auth-only layout unless instrumented separately.

---

## Track C — Unified auth route metadata (`<head>`)

### C1. Inventory

Enumerate all `createFileRoute` `head()` blocks under `apps/frontend/src/routes/$locale/auth/` (login, register, forgot-password, reset-password, verify-email, terms, privacy, help).

### C2. Single source for titles and descriptions

| Step | Action                                                                                                                                                                      | Output                            |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------- |
| C2.1 | Product defines brand string(s) per environment (e.g. customer-facing “Masafh” vs. platform “AgenticVerdict”) and SEO pattern: `{title}                                     | {brand}`.                         | Written rule. |
| C2.2 | Move meta strings into **i18n** (e.g. `auth.seo.loginTitle`) for at least `en` and `ar`, or generate `head` from `loader` + locale messages if SSR requires async messages. | Consistent titles across locales. |
| C2.3 | Align **Open Graph** / **Twitter** tags only if product requires sharing auth URLs (usually noindex — confirm SEO policy).                                                  | `robots` / `noindex` decision.    |

**Acceptance criteria**

- [ ] Every auth route exposes accurate `title` and `description` in `en` and `ar` (and `fr` if kept).
- [ ] No conflicting product names across auth routes unless intentionally differentiated (document exception).

---

## Cross-cutting verification (all tracks)

| Check                                                                          | When                                   |
| ------------------------------------------------------------------------------ | -------------------------------------- |
| `pnpm --filter @agenticverdict/frontend run i18n:validate`                     | After any message or SEO string change |
| `pnpm --filter @agenticverdict/frontend run typecheck`                         | After layout or config typing changes  |
| `pnpm --filter @agenticverdict/frontend run test`                              | CI parity                              |
| `pnpm --filter @agenticverdict/frontend run test:e2e` (or targeted Playwright) | After shell split or route changes     |
| Manual: keyboard through Terms → Privacy → Help → Login in **RTL**             | Before release                         |

---

## Suggested sequencing

1. **A3** (support contact + config) — low legal dependency, high user value.
2. **A1 + A2** (legal copy) — parallel with counsel; block “remove placeholder” launch gate.
3. **C** (head meta) — quick win once brand rule exists; can parallel A\*.
4. **B** (auth-only shell) — larger structural change; schedule after legal/support clarity if marketing wants a distinct auth marketing header.

---

## Ownership summary

| Track | DRI (suggested)        | Consulted                       |
| ----- | ---------------------- | ------------------------------- |
| A1–A2 | Legal                  | Product, Engineering (data map) |
| A3    | Operations             | Product, Engineering (config)   |
| B     | Engineering (frontend) | Product, Design, a11y           |
| C     | Product / Marketing    | Engineering                     |

---

## References in repo

- Auth routes: `apps/frontend/src/routes/$locale/auth/`
- Shared auth UI: `apps/frontend/src/components/auth/`
- Messages: `apps/frontend/messages/en.json` (keys `auth.layout`, `auth.legal`, `auth.help`)
- UI governance: `design-system/README.md`, `.cursor/rules/ui-guidelines.mdc`
- Original readiness prompt: `prompts/frontend-auth-production-readiness-prompt.md`
