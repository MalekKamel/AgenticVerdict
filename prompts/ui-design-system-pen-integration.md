# UI Design System: .pen Files Integration and Component Architecture

**Prompt Version**: 1.0
**Last Updated**: 2026-04-14
**Target**: UI design system implementation using Pencil.dev and reusable component architecture

---

## Context

### Current State

- The authentication UI core (`/apps/web`) has been implemented according to specifications in `/specs/01-ui/01-authentication`
- A design system foundation exists but requires integration with `.pen` files as the single source of truth

### Design System Philosophy

- **.pen files are the authoritative source** for all design system definitions at `/apps/web`
- All design implementations must be generated from `.pen` files using Pencil.dev
- Manual design system implementation is prohibited to ensure consistency and maintainability

---

## Objective

Establish a unified design workflow that:

1. Uses `.pen` files as the single source of truth for all visual design
2. Leverages `/packages/ui` for reusable, shareable UI components
3. Eliminates code duplication across features through centralized component architecture

---

## Implementation Tasks

### Task 1: Update Authentication Specifications

**Action**: Update the tasks in `/specs/01-ui/01-authentication` to reference and utilize `.pen` files.

**Method**:

- Use the `/speckit-specify` command as documented in `/docs/02-planning-and-methodology/speckit-commands-guide.md`
- Ensure all authentication UI tasks include proper `.pen` file references
- Align acceptance criteria with `.pen`-based design validation

### Task 2: Design System Implementation via Pencil.dev

**Action**: Implement all design system components using Pencil.dev automation.

**Requirements**:

- Follow the workflow documented at `/design/docs/generation/ui-generation-quick-reference.md`
- **Never implement the design system manually**—all design tokens, components, and patterns must be generated from `.pen` files
- Use the Pencil MCP server for all `.pen` file operations

### Task 3: Component Architecture and Reusability

**Action**: Establish a component reuse pattern using `/packages/ui`.

**Guidelines**:

- Extract reusable components to `/packages/ui` whenever duplication is identified
- New components that have potential for reuse across features must be added to `/packages/ui`
- Feature-specific implementations in `/apps/web` should consume components from `/packages/ui`
- Maintain clear documentation for component props, variants, and usage patterns

---

## Technical Requirements

### Pencil MCP Server Configuration

```json
{
  "name": "pencil",
  "transport": "stdio",
  "command": "/Applications/Pencil.app/Contents/Resources/app.asar.unpacked/out/mcp-server-darwin-x64",
  "args": ["--app", "desktop"],
  "env": {}
}
```

### MCP Tool Usage

- **Reading `.pen` files**: Use `mcp__pencil__batch_get` or `mcp__pencil__get_editor_state`
- **Modifying `.pen` files**: Use `mcp__pencil__batch_design` for all design operations
- **Export**: Use `mcp__pencil__export_nodes` for generating assets
- **Screenshots**: Use `mcp__pencil__get_screenshot` for visual verification

**Critical**: Never use `Read` or `Grep` tools on `.pen` files—their contents are encrypted and only accessible via Pencil MCP tools.

---

## Reference Documentation

| Document                                                      | Purpose                                      |
| ------------------------------------------------------------- | -------------------------------------------- |
| `/design/docs/generation/ui-generation-quick-reference.md`    | Pencil.dev design system generation workflow |
| `/docs/02-planning-and-methodology/speckit-commands-guide.md` | SpecKit command usage (`/speckit-specify`)   |
| `/specs/01-ui/01-authentication`                              | Authentication UI specifications to update   |

---

## Success Criteria

1. All authentication UI specifications reference `.pen` files as design source
2. Design system is fully implemented via Pencil.dev with zero manual implementation
3. Reusable components are centralized in `/packages/ui`
4. No duplicate component code exists between `/apps/web` and `/packages/ui`
5. `.pen` files serve as the verifiable single source of truth for all design decisions

---

## Notes

- This prompt should be invoked when initiating any new UI feature or updating existing UI specifications
- Component extraction to `/packages/ui` should be done proactively, not as a separate refactoring phase
- All design changes must first be updated in `.pen` files before any code implementation
