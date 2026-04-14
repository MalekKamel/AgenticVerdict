# Generate UI Components from .pen Design Files

## Context

The design system foundation has been established using .pen files created with Pencil (pendil.dev). These design artifacts are located in the `design-system/` directory and follow the structure documented in `/design-system/README.md`.

The `.pen` format is an encrypted design file format that can only be accessed through the Pencil MCP server tools. These files contain the complete design specification including components, layouts, styling tokens, and design system foundations.

## Objective

Create comprehensive technical documentation for translating .pen design files into production-ready UI components for a TanStack Start application. This guide will serve as the authoritative reference for the design-to-code workflow outlined in `specs/01-ui/00-foundation`.

## Requirements

### 1. Design System Analysis

- Document the structure and contents of existing .pen files in `design-system/`
- Map .pen components to their corresponding React component implementations
- Identify design tokens (colors, typography, spacing, borders) that need extraction
- Catalog reusable components versus one-off design elements

### 2. Technical Architecture Documentation

- Specify the component library architecture (Mantine UI v9 as base)
- Define component naming conventions and file structure
- Document the integration pattern between Pencil MCP tools and the codebase
- Outline the TypeScript typing strategy for design-to-code translation

### 3. Implementation Guide

Provide step-by-step instructions for:

**Phase 1: Design Token Extraction**

```typescript
// Example pattern for token extraction
const designTokens = {
  colors: {
    /* from .pen variables */
  },
  typography: {
    /* from .pen text styles */
  },
  spacing: {
    /* from .pen layout values */
  },
};
```

**Phase 2: Component Generation**

- Using `mcp__pencil__batch_get` to read component structures
- Translating .pen node hierarchies to React JSX
- Mapping .pen properties to Mantine props
- Handling responsive layouts from .pen auto-layout

**Phase 3: Integration**

- Import/export patterns for the component library
- Storybook or component documentation setup
- Testing strategy for generated components

### 4. Tool Reference

Document the Pencil MCP server tool usage:

- `get_editor_state()` — Understanding current design context
- `batch_get()` — Reading component structures and patterns
- `batch_design()` — Making design modifications when needed
- `get_variables()` — Extracting design tokens
- `get_screenshot()` — Visual verification of components

### 5. Code Examples

Provide working examples for:

- Converting a .pen button component to React
- Implementing a responsive layout from .pen auto-layout
- Extracting and applying theme variables
- Handling RTL/LTR layouts from design tokens

## Deliverables

1. **Primary Documentation File**: `/prompts/ui-generation-guide.md`
   - Complete walkthrough from .pen to production code
   - Code snippets and TypeScript examples
   - Common patterns and anti-patterns

2. **Quick Reference**: `/prompts/ui-generation-quick-reference.md`
   - Command patterns for common operations
   - Tool usage cheat sheet
   - Troubleshooting common issues

3. **Example Implementations**: Sample components demonstrating the translation process

## Constraints & Guidelines

- **No Direct File Reading**: .pen files must be accessed exclusively through Pencil MCP tools
- **Mantine UI v9 Base**: Leverage existing Mantine components where possible
- **TypeScript Strict Mode**: All generated code must satisfy strict type checking
- **RTL/LTR Support**: Components must support bidirectional layouts per design tokens
- **Responsive Design**: Implement responsive behavior from .pen auto-layout specifications
- **Multi-Tenancy**: Design tokens must support tenant-specific theming via backend configuration

## Success Criteria

- [ ] Documentation enables a developer to convert any .pen component to React
- [ ] All design tokens are properly extracted and typed
- [ ] Generated components integrate seamlessly with TanStack Start
- [ ] RTL/LTR layouts render correctly from design specifications
- [ ] Code examples are copy-pasteable and functional
- [ ] Guide references all relevant specs and architecture documents

## References

- Design System Documentation: `/design-system/README.md`
- UI Foundation Spec: `specs/01-ui/00-foundation/`
- Pencil MCP Server Documentation: Available via `mcp__pencil__get_guidelines()`
- Technical Architecture: `/docs/architecture/business/technical-architecture.md`
- Component Requirements: `/docs/02-planning-and-methodology/testing-strategy.md`
