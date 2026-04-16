## Context

The global design variables should be defined in `/design/system/globals.css` and must be reusable across the design system libraries:

- `/design/system/atoms.lib.pen`
- `/design/system/molecules.lib.pen`

All `.pen` file operations must use the Pencil MCP server.

## Objective

Create a comprehensive, implementation-ready plan for establishing a single shared variable system by mapping global CSS variables into Pencil variables.

## Task

Write a plan document that defines how to:

- Validate and structure all global variables in `/design/system/globals.css`.
- Create corresponding Pencil variables from `/design/system/globals.css` using the Pencil MCP workflow.
- Ensure these variables are shared consistently across `/design/system/atoms.lib.pen` and `/design/system/molecules.lib.pen`.

## Deliverable Requirements

The implementation plan must:

- Include a clear variable-mapping strategy (CSS variable -> Pencil variable) with naming conventions and grouping.
- Define sequencing, dependencies, and milestones for implementation.
- Specify validation steps to confirm variable consistency and reuse across both `.pen` libraries.
- Include governance guidance to keep `globals.css` and Pencil variables synchronized over time.
- Be professionally written, structured, and actionable for execution.

## Constraints

- Treat `/design/system/globals.css` as the source for global variable definitions.
- Create/update Pencil variables only through Pencil MCP tools.
- Do not use ad hoc variable definitions outside the shared global system.
