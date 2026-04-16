Context:
The Pencil Design (`.pen`) files are the single source of truth for system UI, as documented in `/docs/architecture/ui/00-overview.md`.

Reusable design system assets:

- `/design/system/atoms.lib.pen` - Atomic design elements
- `/design/system/molecules.lib.pen` - Molecular design components
- `/design/system/design-tokens.lib.pen` - Design tokens

These assets are reusable across the codebase. React implementation must align with these `.pen` libraries through the Pencil MCP workflow.

You must follow all guidelines in `/design/docs/DESIGN-SSOT.md`.

Objective:
Create a comprehensive implementation plan for the reusable design system libraries:

- `/design/system/atoms.lib.pen`
- `/design/system/molecules.lib.pen`
- `/design/system/design-tokens.lib.pen`

Deliverable:
Produce a single written plan that defines:

- Scope and structure of each `.pen` library
- Component/token coverage required by the UI foundation
- Reusability strategy across the codebase
- Sequencing, dependencies, and implementation milestones
- Validation and governance steps for ongoing consistency

Mandatory Constraints:

- Include all UI foundation requirements documented in `/docs/architecture/ui/00-overview.md`.
- Create and update components only through the Pencil MCP server.
- Do not create or edit design system components manually outside Pencil MCP.
- Keep all recommendations fully aligned with `/design/docs/DESIGN-SSOT.md`.
