# Prompt: Desktop app — full web parity (LobeChat-style)

**Purpose:** Instructions for producing a single implementation document.  
**Output artifact:** One markdown file containing a **comprehensive implementation plan** for the Electron desktop app.

---

## Background

Per **`/ignored/lobe-chat-desktop-comparative-analysis.md`**, LobeChat’s desktop strategy reuses the web application in the desktop shell with **full web route parity** (the desktop experience mirrors the web app’s routing and behavior rather than maintaining a parallel UI tree).

---

## Goal

Align **`apps/desktop`** with that model: **maximize reuse of `apps/frontend`** so the desktop client matches the web app’s routes and flows, consistent with LobeChat’s established approach.

---

## Task

Author an **implementation plan** (not a shallow checklist) that covers:

- **Architecture:** How the desktop shell loads and hosts the web app; boundaries between Electron main, preload, and renderer.
- **Parity:** What “full route parity” means for this monorepo (TanStack Start / `apps/frontend`), including dev vs production bundling and navigation.
- **Integration:** Build pipeline, asset loading, deep linking, and any IPC or bridge needed without duplicating UI logic in the desktop package.
- **Gaps and phases:** What must change vs what can stay as-is; ordered milestones with risks and mitigations.
- **Verification:** How to confirm parity (manual, automated, or both).

---

## Constraints

1. **Prefer proven patterns** — Treat **LobeChat’s typical desktop setup** as the reference implementation; mirror its intent (full web reuse, not a second frontend).
2. **Avoid reinvention** — Reuse existing tooling, shared packages, and `apps/frontend` as the single source of UI and routing where feasible.
3. **Stay scoped** — The deliverable is the **plan document**; do not implement code unless explicitly asked in a follow-up.

---

## Success criteria

The plan is adequate when a senior engineer can use it to implement desktop–web parity **without** guessing how LobeChat-style reuse maps onto `apps/frontend` and `apps/desktop`, and when scope, sequencing, and validation are explicit.
