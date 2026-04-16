## Context

The design system implementation baseline is documented at `/design/docs/research/refined-design-system-implementation-plan.md`.

The following references define architecture, UI standards, and implementation guidance:

- `/docs/architecture/ui/00-overview.md`
- `/design/docs/DESIGN-SSOT.md`

The reusable `.pen` design system libraries are:

- `/design/system/design-tokens.lib.pen`
- `/design/system/atoms.lib.pen`
- `/design/system/molecules.lib.pen`

## Objective

Produce a new, comprehensive design system specification that details all required design tokens, atoms, and modules needed to support each `.pen` design across the product.

## Task

Conduct a thorough analysis of `/docs/architecture/ui/00-overview.md` and relevant design-system governance documents. Then write a new implementation-spec file that:

- Enumerates required token categories and token definitions.
- Defines all reusable atom and module components required by current and planned `.pen` designs.
- Explains component responsibilities, variants, states, composition rules, and reuse boundaries.
- Maps dependencies between tokens, atoms, and modules.
- Identifies gaps, priorities, and rollout sequencing needed for complete product-wide reuse.

## Deliverable Requirements

The output file must:

- Be structured, professional, and implementation-ready.
- Cover all reusable components necessary for consistent design system usage across the product.
- Be explicit enough to guide both design-library creation and UI implementation work.
- Align fully with the established design system governance and SSOT documentation.

## Constraints

- Treat `.pen` files as the UI source of truth.
- Use Pencil MCP workflows for `.pen`-related design operations.
- Do not rely on ad hoc or one-off component definitions outside the design system.
