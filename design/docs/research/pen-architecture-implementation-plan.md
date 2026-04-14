# Implementation plan: design system `.pen` architecture migration

**Version:** 1.1.0  
**Date:** 2026-04-15  
**Status:** Executed (2026-04-15, branch `chore/pen-architecture-migration`)  
**Based on:** [Research memo](./pen-architecture-research-memo.md) and [Target architecture](./target-architecture.md)

## 1. Overview

Phased migration from the prior layout (`designatoms/*.pen`, `designmolecules/*.pen`, `designtemplates/*.pen`, `designdesign-tokens.pen` at repo root) to **system/** / **features/** / **assets/** under `design` (migration executed 2026-04-15).

**Principles (from project prompt):**

| Principle             | Application                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------------- |
| Pre-production        | No backward compatibility requirement for old paths                                                       |
| Cutover               | Deliberate migration; avoid long-term parallel trees unless research dictates risk mitigation             |
| MCP-only `.pen` edits | All `.pen` changes via Pencil MCP (`batch_design`, etc.); run `pnpm run validate:pen-files` after changes |
| RTL/LTR + WCAG 2.1 AA | Preserved via shared tokens, logical layout in React (`@agenticverdict/ui`), and asset conventions        |

### 1.1 Path mapping (current → target)

| Current                                          | Target                                                                                               |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `designdesign-tokens.pen` (former root location) | `designsystem/design-tokens.lib.pen`                                                                 |
| `designatoms/*.pen`                              | Merged into `designsystem/atoms.lib.pen`                                                             |
| `designmolecules/*.pen`                          | Merged into `designsystem/molecules.lib.pen`                                                         |
| `designtemplates/*.pen`                          | `designfeatures/<domain>.pen` (e.g. `authentication.pen` → `auth.pen` or keep name—see naming below) |
| Scattered icons/images                           | `designassets/icons/`, `illustrations/`, `images/`                                                   |

### 1.2 Pencil `ref` semantics (migration-critical)

`type: "ref"` instances reference **`reusable` component definitions in the same `.pen` document** (see current `designfeatures/auth.pen`: reusable `Auth/Button/Base` and refs to its id). They do **not** automatically resolve across separate files.

**Implications:**

- **Within** `system/atoms.lib.pen` / `system/molecules.lib.pen`, use `ref` freely for internal variants.
- **Across** `features/auth.pen` and `system/atoms.lib.pen`, linked instances are **not** guaranteed by the JSON `ref` field alone. Reuse is enforced by **(1)** consolidated system libraries per document, **(2)** MCP copy/update workflows that preserve component structure, **(3)** **React SSOT** in `packages/ui` for the shipped UI, and **(4)** design review so feature files do not silently drift from primitives.

Re-evaluate this if Pencil adds first-class cross-document libraries; until then, docs and validators should not claim cross-file `ref` without product support.

## 2. Phase 1 — Preparation and infrastructure (week 1)

### 2.1 Directory scaffolding

Create (exact paths):

- `designsystem/`
- `designfeatures/`
- `designassets/icons/`
- `designassets/illustrations/`
- `designassets/images/`

Add READMEs: `designsystem/README.md`, `designfeatures/README.md`, `designassets/README.md` (scope, naming, links to this plan).

### 2.2 Backup

- Recommended: **`git checkout -b chore/pen-architecture-migration`** before moves.
- Optional local tarball or copy to a **gitignored** path (e.g. `design.migration-backup/`), not a committed `design-system-backup-*` tree.

### 2.3 Validator and CI

- Extend `design/scripts/validate-pen-files.py` to discover `.pen` files under `designsystem/`, `designfeatures/`, and legacy paths during transition—or switch glob once cutover is atomic.
- Keep `.github/workflows/ui-guidelines-enforcement.yml` in sync (already invokes `python3 designvalidate-pen-files.py`).

### 2.4 Documentation

- Update `designREADME.md` to describe the target tree and link here.
- Update `designdocs/generation/ui-generation-quick-reference.md` examples to new paths after file moves.

**Phase 1 exit:** Directories exist; validator strategy agreed; branch created; README updates drafted or merged.

## 3. Phase 2 — System consolidation (week 2)

### 3.1 `system/design-tokens.lib.pen`

- MCP: move or consolidate from `designsystem/design-tokens.lib.pen` into `designsystem/design-tokens.lib.pen`.
- Run `pnpm run validate:pen-files`.

### 3.2 `system/atoms.lib.pen`

Migrate atomic components from:

- `designsystem/atoms.lib.pen`, `input.pen`, `badge.pen`, `icon.pen`, `typography.pen`, `checkbox.pen`, `radio.pen`, `switch.pen`, `link.pen`, `separator.pen`, `spinner.pen`

into **one** `designsystem/atoms.lib.pen` with `reusable: true` components and consistent naming (`Button/...`, `Input/...`, etc.).

### 3.3 `system/molecules.lib.pen`

Migrate from:

- `designsystem/molecules.lib.pen`, `card.pen`, `dropdown.pen`, `form-field.pen`, `popover.pen`, `search-input.pen`, `select.pen`, `toast.pen`, `tooltip.pen`, `date-picker.pen`

into `designsystem/molecules.lib.pen`; use internal `ref` to atoms where appropriate **inside the same file**.

### 3.4 Visual QA

- Pencil MCP: `get_screenshot` / `snapshot_layout` on representative nodes after consolidation.

**Phase 2 exit:** `pnpm run validate:pen-files` passes; system `.pen` files list matches target architecture.

## 4. Phase 3 — Features (week 3)

### 4.1 Inventory

- Analyze `designfeatures/auth.pen` (and any other templates) and map screens to `features/<domain>.pen`.

### 4.2 Feature files

Create under `designfeatures/`:

- `auth.pen` — authentication flows
- `dashboard.pen` — dashboards (when designs exist)
- `profile.pen`, `reports.pen`, `data-connectors.pen`, `intelligence.pen` — as product work expands

**Naming:** Prefer **one file per domain**: `features/auth.pen`. Split only if file size or team parallelism requires it: e.g. `features/auth-onboarding.pen` (document the split in `features/README.md`).

### 4.3 Duplication policy

- Avoid re-defining atoms/molecules already in `system/`. Where Pencil cannot cross-reference another file, align layouts manually and track **parity** with system components; **code** must still import from `@agenticverdict/ui` once.

**Phase 3 exit:** Feature `.pen` files live under `features/`; validation passes; screenshots for critical flows reviewed.

## 5. Phase 4 — Assets and cutover (week 4)

### 5.1 Assets

- Move raster/SVG references into `designassets/` subfolders; standardize relative paths from each `.pen` (document root-relative convention in `assets/README.md`).
- RTL: mirror icons where semantics require directionality; document tenant/brand logos under `assets/images/logos/` with config-driven selection in app code—not hardcoded in components.

### 5.2 Remove legacy tree

After validation and sign-off:

- Remove old `designatoms/*.pen`, `designmolecules/*.pen`, `designtemplates/*.pen` (or archive in git history only).
- Update all doc references and MCP examples to new paths.

### 5.3 Final validation

```bash
pnpm run validate:pen-files
```

**Phase 4 exit:** Only target paths remain; docs updated; CI green.

## 6. `@agenticverdict/ui` alignment

Package layout under `packages/ui/src/` already follows atoms/molecules exports (see `packages/ui/src/index.ts`). After `.pen` moves:

| Responsibility     | Action                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| File paths in docs | Update generation guides to point to `designsystem/atoms.lib.pen`, etc.                             |
| Exports            | Keep **barrel** `packages/ui/src/index.ts` as SSOT; add exports only when new React components land |
| Tokens             | Keep `packages/ui/src/tokens/*` aligned with `design-tokens.pen` naming (three-tier model)          |

No mass rename of `packages/ui` folders is required **purely** for `.pen` restructuring—the mapping is **design path → existing** `atoms/*`, `molecules/*`.

## 7. Validation commands (owner checklist)

| Step                          | Command                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------- |
| `.pen` schema / repo rules    | `pnpm run validate:pen-files`                                                               |
| UI package (when touching TS) | `pnpm --filter @agenticverdict/ui build` (or `turbo run build --filter=@agenticverdict/ui`) |
| E2E a11y (optional gate)      | Uses Playwright a11y specs via existing web test scripts in `package.json`                  |

**2026-04-15:** `pnpm run validate:pen-files` passes on the **post-cutover** tree (**4** consolidated `.pen` files under `system/` and `features/`). Re-run after any `.pen` edit.

## 8. Acceptance criteria

### 8.1 Per phase

- **Phase 1:** Target dirs + README stubs + validator plan + branch.
- **Phase 2:** `system/*.pen` exist; validation passes.
- **Phase 3:** `features/*.pen` exist; no unmigrated critical templates left (unless explicitly deferred in `features/README.md`).
- **Phase 4:** Assets in place; legacy dirs removed; validation passes.

### 8.2 Final (prompt definition of done)

- [x] Research memo, target architecture, and this plan merged with **explicit paths** and **owner-ready** tasks.
- [x] `system/` / `features/` / `assets/` layout specified and mapped to `@agenticverdict/ui` consumption (see [target architecture](./target-architecture.md) §4).
- [x] Validation command(s) documented; **`pnpm run validate:pen-files`** passes on the **final** tree after cutover.
- [x] Migration checklist below completed (tick in PR).

## 9. Migration checklist (ordered)

### Pre-migration

- [x] Read [pen-architecture-research-memo.md](./pen-architecture-research-memo.md) and [target-architecture.md](./target-architecture.md).
- [x] Create migration branch.
- [ ] Capture baseline screenshots of key templates (optional).

### Infrastructure

- [x] Create `designsystem`, `designfeatures`, `designassets/{icons,illustrations,images}`.
- [x] Add README.md in each new subtree.
- [x] Plan `validate-pen-files.py` glob/update for new layout (`rglob` under `design`; script path is repo-relative).

### System `.pen`

- [x] `designsystem/design-tokens.lib.pen`
- [x] `designsystem/atoms.lib.pen` (all former `atoms/*.pen`)
- [x] `designsystem/molecules.lib.pen` (all former `molecules/*.pen`, **plus** atom children duplicated for same-document `ref` resolution — see `system/README.md`)
- [x] `pnpm run validate:pen-files`

### Features `.pen`

- [x] `designfeatures/auth.pen` (from former `templates/authentication.pen`)
- [ ] Additional `features/*.pen` per roadmap (dashboard, profile, … — as product work lands)
- [x] `pnpm run validate:pen-files`

### Assets

- [ ] Move media to `designassets/...` (structure + README in place; migrate binary/SVG files when referenced from `.pen`)
- [x] Update references + `assets/README.md`

### Code and docs

- [x] Update `designREADME.md`
- [x] Update `designdocs/generation/*.md` paths
- [x] Update `.cursor/rules` references if path examples are hardcoded (none found)
- [x] Confirm `packages/ui` exports still match component inventory

### Cutover cleanup

- [x] Delete legacy `designatoms/`, `designmolecules/`, `designtemplates/` `.pen` files (retain history in git).
- [x] Remove duplicate `design-tokens.pen` at old location if moved.
- [ ] Final `pnpm run validate:pen-files` on `main` after merge.

## 10. Risks and mitigations

| Risk                                       | Mitigation                                                                                   |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Large single `atoms.pen` / `molecules.pen` | Strict naming hierarchy; MCP `batch_get` filters; split only if tooling/performance requires |
| No cross-file `ref`                        | Same-document refs in system files; React SSOT; design QA between features and system        |
| Validator misses new paths                 | Update `validate-pen-files.py` and CI together                                               |
| Drift between `.pen` and React             | MCP-first workflow; token naming; reviews                                                    |

---

**Related:** [Target architecture](./target-architecture.md) · [Research memo](./pen-architecture-research-memo.md) · `/designREADME.md`
