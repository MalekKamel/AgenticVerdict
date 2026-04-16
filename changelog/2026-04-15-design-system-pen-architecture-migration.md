# Design system Pencil (`.pen`) architecture migration

**Date:** 2026-04-15  
**Scope:** Consolidate scattered Pencil design files under `design/` into **`system/`**, **`features/`**, and **`assets/`**, aligned with [pen-architecture-implementation-plan.md](../design/docs/research/pen-architecture-implementation-plan.md) and [target-architecture.md](../design/docs/research/target-architecture.md). Markdown blueprints under `design/atoms/` and `design/molecules/` (implementation docs) are unchanged; only **encrypted `.pen` sources** and references to them moved.

## Summary

- **System library (`design/system/`):**
  - **`design-tokens.pen`** — Former root `design/design-tokens.pen` relocated here (three-tier token variables unchanged in role).
  - **`atoms.pen`** — Single document merging all former `design/atoms/*.pen` children and merged `variables`.
  - **`molecules.pen`** — Merges molecule specs **and duplicates atom `children`** from `atoms.pen` in the same file so Pencil `type: "ref"` links (e.g. molecules → atom masters) resolve **within one document**; cross-file `ref` is not a product guarantee.
- **Features (`design/features/`):**
  - **`auth.pen`** — Cutover from `design/templates/authentication.pen` (one file per domain naming).
- **Assets (`design/assets/`):**
  - Scaffolded `icons/`, `illustrations/`, `images/` with README conventions; binary/SVG migration into these folders is **on demand** when `.pen` files reference files.
- **Removed** legacy `.pen` trees: `design/atoms/*.pen`, `design/molecules/*.pen`, `design/templates/authentication.pen`, and root `design/design-tokens.pen` (history remains in git).
- **Documentation and references** — Updated across `design/README.md`, generation guides, specs, prompts, and code comments (for example auth components and `authPenDesign.ts`) to point at `system/`, `features/`, and `assets/` paths.
- **Helper script** — `design/scripts/merge-pen-system-layout.py` documents the mechanical merge strategy (merge variables, concatenate `children`, duplicate atoms into `molecules.pen`).

## Rationale (short)

Pencil **`ref` instances resolve to `reusable` masters in the same `.pen` file**, not across files. The prior layout split atoms and molecules into many files, which broke or obscured internal references when treated as separate documents. Consolidating system primitives into **`atoms.pen`** and **`molecules.pen`** restores predictable same-file `ref` behavior; shipped UI parity remains **`@agenticverdict/ui`** as the SSOT.

## Breaking changes

- Any bookmark, script, or doc that pointed at:
  - `design/design-tokens.pen`
  - `design/atoms/<name>.pen`
  - `design/molecules/<name>.pen`
  - `design/templates/authentication.pen`  
    must use the new paths under **`design/system/`** and **`design/features/`** (see table in the implementation plan).

Expect validation over the consolidated set of `.pen` files under `design/system/` and `design/features/` (count depends on cutover state).

## Follow-up (not blocking this changelog)

- Optional baseline screenshots for key templates via Pencil MCP (`get_screenshot`, `snapshot_layout`).
- Additional `features/*.pen` files as product work adds domains (dashboard, profile, reports, …).
- Copy real media into `design/assets/...` when file references are added to designs.

## References

- [Implementation plan](../design/docs/research/pen-architecture-implementation-plan.md)
- [Research memo](../design/docs/research/pen-architecture-research-memo.md)
- [Target architecture](../design/docs/research/target-architecture.md)
- [Design system README](../design/README.md)
