# Authentication Design System Integration with .pen Files

## Context

- All design components for the web application (`/apps/web`) must use `.pen` files as the single source of truth for the design system.
- The current UI foundation has been implemented according to the specifications at `/specs/01-ui/01-authentication`.

## Objective

Integrate the authentication UI components with the design system by leveraging `.pen` design files and the shared UI component library (`/packages/ui`). Ensure all authentication interfaces are consistent, reusable, and adhere to the established design tokens and patterns.

## Requirements

### 1. Update Specification Tasks

- Use the SpecKit command `/speckit-specify` as documented in `/docs/02-planning-and-methodology/speckit-commands-guide.md` to update the tasks at `/specs/01-ui/01-authentication`.
- Ensure tasks explicitly reference `.pen` files for design source and `@agenticverdict/ui` imports for reusable components.
- Align task descriptions with the design‑system‑first workflow (design → tokens → components → integration).

### 2. Implement Design System via Pencil.dev

- **Never sketch UI from memory** — all visual design must originate from `.pen` files, extracted with Pencil MCP (`batch_get`, `get_variables`, `get_screenshot`). Pencil MCP does not write `.tsx` files; follow [MCP-first design-to-code workflow](/design/docs/generation/ui-generation-cheatsheet.md#mcp-first-design-to-code-workflow-repo-ssot): load `get_guidelines` (**Code**; **Tailwind** when applicable) before editing React code.
- Follow the workflow documented in `/design/docs/generation/ui-generation-quick-reference.md` and the cheat sheet above.
- Extract design tokens, component structures, and layout specifications directly from the `.pen` files using the Pencil MCP tools.

### 3. Leverage Shared UI Components

- Reuse existing components from `/packages/ui` wherever possible (e.g., `Button`, `Input`, `Card`, `Alert`).
- When new reusable components are identified during implementation, add them to `/packages/ui` instead of duplicating logic in feature‑specific directories.
- Ensure new components follow the same atomic structure (atoms, molecules) and are fully typed, tested, and documented.

### 4. Use Pencil MCP Server for .pen Files

- All interactions with `.pen` files must be performed through the Pencil MCP server.
- **Never** attempt to read `.pen` files directly with `Read`, `Grep`, or other filesystem tools.
- The MCP server is configured as follows:

```json
{
  "name": "pencil",
  "transport": "stdio",
  "command": "/Applications/Pencil.app/Contents/Resources/app.asar.unpacked/out/mcp-server-darwin-x64",
  "args": ["--app", "desktop"],
  "env": {}
}
```

## Workflow Summary

1. **Analyze** the `.pen` files for authentication components (login form, registration form, password reset, etc.).
2. **Load guides** — `get_guidelines` (**Code**; **Tailwind** when using Tailwind) before writing UI code.
3. **Extract** design tokens (colors, spacing, typography) and component hierarchies using `batch_get`, `get_variables`, and `get_screenshot`.
4. **Update** the specification tasks to reflect the design‑system‑driven approach.
5. **Implement** components in the repo by translating `.pen` structures into React components, reusing `@agenticverdict/ui` where possible.
6. **Add** new reusable components to `/packages/ui` and export them via the package’s index.
7. **Validate** the implementation against the original `.pen` designs using visual verification tools (`get_screenshot`, `export_nodes`).

## Expected Output

- Updated `tasks.md` in `/specs/01-ui/01-authentication` that references `.pen` files and shared UI components.
- Authentication UI components built from the design system, not from manual styling.
- New reusable components added to `/packages/ui` (if needed) with proper TypeScript types, tests, and documentation.
- A fully integrated authentication flow that matches the `.pen` design files and leverages the shared design tokens.

## References

- `/docs/02-planning-and-methodology/speckit-commands-guide.md` – SpecKit command usage.
- `/design/docs/generation/ui-generation-cheatsheet.md#mcp-first-design-to-code-workflow-repo-ssot` – MCP-first design-to-code (repo SSOT).
- `/design/docs/generation/ui-generation-quick-reference.md` – Design‑to‑code workflow.
- `/design/README.md` – Design system overview and governance.
- `/packages/ui/README.md` – Shared UI component library documentation.
- `/changelog/2026-04-08-layered-runtime-config-docker-mock-adapters.md` – Context on mock‑friendly Docker stacks (relevant for local testing).
