# UI foundation: Pencil `.pen` as single source of truth

## Objective

Treat the UI foundation specification at `/specs/01-ui/00-foundation` as **design-led**: Pencil `.pen` files are the **single source of truth** for the foundation layer. Implement atoms and molecules in the design system libraries first, then derive React implementation from those definitions.

## Scope and sequencing

1. **Design libraries (Pencil)** — Author and maintain the foundational component set in:
   - `/design/system/atoms.lib.pen` — atomic design tokens and primitive UI elements
   - `/design/system/molecules.lib.pen` — composite components built from atoms

2. **Tooling constraint** — Perform **all** create, read, update, and structural work on `.pen` files **exclusively** with **Pencil MCP** tools (for example `batch_get`, `batch_design`, and related MCP operations). Do not hand-edit `.pen` source except for validator-approved mechanical fixes, per repository policy.

3. **React implementation** — After the `.pen` libraries reflect the intended APIs and visuals, generate or implement React code under **`/packages/ui`** in alignment with the design artifacts and repo guidelines (MCP-first design-to-code workflow).

## Technical requirements

- **Pencil MCP only** for `.pen` file operations.
- **MCP-first workflow** — Follow `/design/docs/DESIGN-SSOT.md` for authoritative process and references.
- **Layout and spacing** — Apply patterns from `/design/docs/generation/ui-generation-cheatsheet.md` when translating design structure into implementation.
- **Internationalization** — Preserve **RTL/LTR** behavior as defined by the design system and tenant/theme configuration; use logical properties and configuration-driven direction, not hardcoded layout assumptions.

## Success criteria

- Atoms and molecules are fully represented and consistent in `atoms.lib.pen` and `molecules.lib.pen`.
- React code in `/packages/ui` reflects the `.pen` definitions and the documented generation guidelines without inventing tokens or spacing outside the SSOT workflow.
