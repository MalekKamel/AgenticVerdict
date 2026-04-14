# Create a Comprehensive Guide for Pixel‑Perfect UI Generation from .pen Design Templates

## Context

The authentication UI components at `/apps/web/src/routes/$locale/auth` currently deviate from the design system’s single source of truth (`/design/features/auth.pen`). This discrepancy arises from manual implementation rather than systematic extraction from the .pen templates.

## Objective

Produce a comprehensive, step‑by‑step guide that enables developers to generate UI components from .pen templates with **100% visual fidelity**, eliminating manual styling and ensuring design‑system consistency.

## Scope

The guide should cover the entire workflow from .pen template analysis to production‑ready React components, with a focus on the authentication UI as a concrete example. The guide must be reusable for any .pen template in the design system.

## Key Sections

### 1. Design System Analysis

- Using Pencil MCP tools (`batch_get`, `get_variables`, `get_editor_state`, `get_guidelines` for **Code** / **Tailwind**) to inspect .pen files and load implementation rules before coding.
- Extracting design tokens (colors, typography, spacing, borders, shadows).
- Cataloging component hierarchies and reusable patterns.
- Documenting layout specifications (auto‑layout, constraints, RTL/LTR flags).

### 2. Token Extraction

- Converting .pen variables into typed design tokens (TypeScript interfaces).
- Integrating tokens with the multi‑tenant theming system (backend‑driven `CompanyConfig`).
- Generating CSS custom properties or theme objects for Mantine UI v9.

### 3. Component Mapping

- Translating .pen nodes into React component structures.
- Leveraging the existing `@agenticverdict/ui` library where possible.
- Creating new reusable components in `/packages/ui` when needed.
- Mapping .pen properties (fill, stroke, corner radius, etc.) to component props.

### 4. Layout Implementation

- Converting .pen auto‑layout structures into responsive CSS/JSX layouts.
- Handling RTL/LTR flipping based on design‑token language settings.
- Ensuring pixel‑accurate spacing and alignment.

### 5. Validation Workflow

- Using Pencil MCP’s visual verification tools (`get_screenshot`, `export_nodes`) to compare generated UI with the original design.
- Setting up automated visual regression checks (optional).
- Manual inspection checklist for common mismatches.

### 6. Integration Patterns

- Injecting generated components into the TanStack Start application.
- Ensuring proper TypeScript typing and import/export hygiene.
- Wiring tenant‑specific theming via the backend configuration service.

### 7. Troubleshooting

- Common pitfalls (unit mismatches, missing tokens, RTL flipping errors) and how to resolve them.
- Debugging Pencil MCP tool calls.
- Handling design updates (synchronizing .pen changes with code).

## Constraints

- **No direct reading of .pen files** – all access must go through the Pencil MCP server.
- **MCP-first design-to-code (repo SSOT)** – document that Pencil MCP does not emit `.tsx` files; the workflow is MCP inspection (`batch_get`, `get_variables`, `get_screenshot`, …) plus `get_guidelines` (**Code**, **Tailwind** when applicable) plus workspace implementation. Canonical checklist: `/design/docs/generation/ui-generation-cheatsheet.md#mcp-first-design-to-code-workflow-repo-ssot`.
- **Multi‑tenancy first** – design tokens must support tenant‑specific theming via backend configuration.
- **TypeScript strict mode** – all generated code must satisfy strict type checking.
- **Pre‑production development** – backward compatibility is **not** required; the guide can assume a clean slate.
- **RTL/LTR support** – components must render correctly for both left‑to‑right and right‑to‑left languages per the design tokens.

## Deliverables

1. **Primary Guide**: `/design/docs/generation/ui-generation-pixel-perfect-guide.md`
   - Complete walkthrough with concrete commands and code snippets.
   - Links to relevant project documentation and existing prompts.
   - Success criteria and verification steps.

2. **Quick‑Reference Cheat Sheet**: `/design/docs/generation/ui-generation-cheatsheet.md`
   - Condensed list of Pencil MCP commands for UI generation.
   - Common patterns (button, form field, card) with example mappings.
   - Troubleshooting table.

3. **Example Code Snippets** (embedded in the primary guide):
   - Translating a .pen button component to a React button.
   - Translating a .pen form‑field component to a React input with validation.
   - Extracting and applying a color palette from .pen variables.

## Success Criteria

- A developer unfamiliar with the design system can follow the guide to produce UI that matches the .pen template within visual inspection.
- The guide references all relevant project documentation (CLAUDE.md, design‑system README, technical architecture).
- The guide includes concrete commands and code that can be copied and adapted.
- The authentication UI components (`/apps/web/src/routes/$locale/auth`) can be regenerated using this guide to achieve 100% visual match with `/design/features/auth.pen`.

## References

- Design system documentation: `/design/README.md`
- Pencil MCP server tool definitions (available via `mcp__pencil__get_guidelines`)
- Existing UI generation prompt: `/prompts/generate-ui-from-pen-files.md`
- Authentication design system integration prompt: `/prompts/authentication-design-system-pen-integration.md`
- Technical architecture: `/docs/architecture/business/technical-architecture.md`
- Multi‑tenancy configuration: `/docs/architecture/business/implementation-guide.md` (CompanyConfig section)
