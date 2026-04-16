# Prompt: Align UI Foundation Spec Tasks With `.pen` Design Libraries

## Purpose

Direct implementation work so that **`/specs/01-ui/00-foundation/`** task definitions explicitly ground design creation in **Pencil `.pen` libraries** and the repo’s MCP-first design workflow—without changing the intent of the foundation phase.

## Objective

Update the foundation spec task list (and related task text where it references design deliverables) so that **design artifacts are authored in `.pen` files** using the shared atomic and molecular libraries.

## Design Library Sources

| Library   | Path                               | Role                                                                                    |
| --------- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| Atoms     | `/design/system/atoms.lib.pen`     | Atomic design primitives (tokens-level building blocks as defined in the design system) |
| Molecules | `/design/system/molecules.lib.pen` | Composite patterns built from atoms                                                     |

Treat these as the **canonical targets** for design work referenced by foundation tasks.

## Non-Negotiable Requirements

1. **Pencil MCP only for `.pen`** — Create, read, and update `.pen` files **exclusively** via Pencil MCP tools (for example `batch_get`, `batch_design`, and related helpers). Do not hand-edit `.pen` JSON except for validator-approved mechanical fixes, per repo policy.
2. **MCP-first workflow** — Follow the process and governance described in `/design/docs/DESIGN-SSOT.md` (design SSOT, validation, and agent workflow expectations).
3. **Layout and spacing** — Apply spacing, layout, and generation conventions from `/design/docs/generation/ui-generation-cheatsheet.md` when describing or implementing design steps tied to tasks.
4. **RTL/LTR** — Preserve **bidirectional layout** requirements: tasks and outcomes must remain compatible with the design system’s RTL/LTR rules (logical properties, direction-aware patterns—not hardcoded LTR-only assumptions).

## Deliverable

Edits confined to **`/specs/01-ui/00-foundation/`** (primarily `tasks.md` and any cross-references in the same folder that must stay consistent) so that reviewers can execute foundation work with a single, clear **`.pen`-first** design path.

## Out of Scope

- Redefining product scope or user stories for UI Foundation unless a task already requires it for consistency.
- Implementing application code outside what the spec tasks already require.
