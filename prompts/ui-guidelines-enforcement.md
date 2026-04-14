# UI Guidelines Enforcement for AI Agents

## Context

The AgenticVerdict platform requires strict adherence to established design system principles to maintain visual consistency, accessibility standards, and professional quality across all user interfaces. All AI-assisted development must follow centralized design governance.

## Objective

Establish and enforce comprehensive UI guidelines that govern how AI agents (Claude Code, Cursor, Qwen, etc.) contribute to frontend design and implementation within the AgenticVerdict ecosystem.

## Design System Authority

### Single Sources of Truth

1. **Design System Overview**
   - Path: `/design/README.md`
   - Contains: Component patterns, usage guidelines, and architectural principles

2. **UI Generation Reference**
   - Path: `/design/docs/generation/ui-generation-quick-reference.md`
   - Contains: Pencil.dev workflows and generation protocols

3. **Design System Documentation**
   - Path: `/design/docs/`
   - Contains: Comprehensive design specifications, tokens, and standards

## Mandatory Implementation Protocol

### 1. Design System Generation

**CRITICAL**: All design system implementations MUST use Pencil.dev via the Pencil MCP server. Manual implementation of design components is prohibited.

```typescript
// Required workflow for .pen file operations
import * as pencil from "pencil";

// Use pencil MCP tools for all design operations
// - batch_get() for reading design patterns
// - batch_design() for implementing components
// - Never manually code design system elements
```

### 2. Agent Compliance Requirements

AI agents contributing to UI development must:

- **Read** design system documentation before implementation
- **Use** Pencil MCP server for all `.pen` file operations
- **Follow** component patterns defined in `/design/README.md`
- **Validate** against accessibility standards (WCAG 2.1 AA minimum)
- **Maintain** consistency with established design tokens

### 3. File Structure Conventions

```
/design/
├── README.md                    # Design system entry point
├── components/                  # Reusable component specs
├── tokens/                      # Design tokens (colors, spacing, etc.)
└── patterns/                    # UX patterns and guidelines

/design/docs/
├── generation/                  # Pencil.dev workflows
└── specification/               # Detailed design specifications
```

## Enforcement Mechanisms

### Pre-Implementation Checklist

Before creating or modifying UI components:

- [ ] Consult `/design/README.md` for existing patterns
- [ ] Reference `ui-generation-quick-reference.md` and [MCP-first workflow](../design/docs/generation/ui-generation-cheatsheet.md#mcp-first-design-to-code-workflow-repo-ssot) for Pencil MCP usage
- [ ] Inspect the relevant `.pen` with MCP (`batch_get`, `get_variables`, `get_screenshot` as needed) and load `get_guidelines` (**Code**; **Tailwind** when using Tailwind) before editing UI code
- [ ] Verify no duplicate component implementations exist
- [ ] Ensure design access and extraction use Pencil MCP tools; application code is still edited in the workspace (MCP-first, not “MCP-only codegen”)

### Validation Criteria

All UI contributions must satisfy:

1. **Consistency**: Matches established design tokens and patterns
2. **Tooling**: Generated via Pencil.dev (no manual CSS/components)
3. **Documentation**: Includes usage documentation
4. **Accessibility**: Meets WCAG 2.1 AA standards
5. **Localization**: Supports RTL (Arabic) and LTR layouts

## References

- **Design System**: `/design/README.md`
- **UI Generation**: `/design/docs/generation/ui-generation-quick-reference.md`
- **Design Documentation**: `/design/docs/`

---

_Version: 1.0.0_
_Last Updated: 2026-04-15_
