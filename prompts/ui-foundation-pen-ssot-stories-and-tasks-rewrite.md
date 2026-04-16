# Prompt: Refactor UI Foundation Specs Around Pencil `.pen` as Design Source of Truth

## Purpose

Provide clear, authoritative instructions for revising **all user stories and tasks** under `/specs/01-ui/00-foundation/` so that **Pencil `.pen` libraries** are the **single source of truth** for UI design, and so that **React implementation** is explicitly derived from those designs using the repository’s **MCP-first** workflow.

## Objectives

1. **Rewrite** foundation-phase **stories and tasks** so design ownership, deliverables, and sequencing assume **`.pen`-first** authoring—not ad hoc screens or undocumented one-off layouts.
2. **Anchor** all foundation design work in the shared libraries:
   - `/design/system/atoms.lib.pen` — atomic design primitives (tokens-level building blocks as defined by the design system).
   - `/design/system/molecules.lib.pen` — molecular components composed from atoms.
3. **Tie** React work to **generated or mapped** implementation that follows the **structure, tokens, spacing, and layout** expressed in the `.pen` sources and in repo generation docs—without inventing visual values outside that chain of custody.

## Design and Implementation Workflow

| Layer             | Responsibility                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Design (SSOT)** | Author and evolve UI in `.pen` using **Pencil MCP** against `atoms.lib.pen` and `molecules.lib.pen`.                                 |
| **Specification** | Stories and tasks describe outcomes, acceptance criteria, and file touchpoints that respect the above SSOT.                          |
| **React**         | Implement screens and components following guidelines derived from the `.pen` design and from `/design/docs/` generation references. |

## Technical Requirements

### `.pen` file operations

- Use **Pencil MCP tools exclusively** for creating, reading, and updating `.pen` files (for example `batch_get`, `batch_design`, and related tools). Do not hand-edit `.pen` JSON except for validator-approved mechanical fixes, per repository policy.

### Process and governance

- Follow the **MCP-first workflow** and design-system rules in `/design/docs/DESIGN-SSOT.md`.
- Apply **spacing, layout, and generation** conventions from `/design/docs/generation/ui-generation-cheatsheet.md` when specifying or performing design-to-code steps.

### Internationalization

- **RTL/LTR** behavior must remain consistent with the design system: direction-aware layouts, logical properties, and tenant/theme configuration—not hardcoded left-to-right assumptions.

## Deliverables

- Updated **`/specs/01-ui/00-foundation/`** artifacts (stories, tasks, and any cross-references in the same scope that must stay consistent) such that:
  - Design is explicitly sourced from **`atoms.lib.pen`** and **`molecules.lib.pen`**.
  - Tasks distinguish **design (.pen via MCP)** from **React implementation** and link the two through the documented workflow.
  - Reviewers and implementers can execute the phase with **one coherent SSOT path** from `.pen` to code.

## Out of Scope (unless already required for consistency)

- Changing product scope or acceptance criteria unrelated to design SSOT and task clarity.
- Large application refactors outside what foundation stories and tasks already imply.
