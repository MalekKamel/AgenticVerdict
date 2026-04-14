# Design System Alignment and Distribution Refinement

## Context

The following design files require refinement for improved alignment, visual consistency, and professional presentation:

- `/design/features/auth.pen` — Authentication flow components
- `/design/system/atoms.lib.pen` — Atomic design system elements
- `/design/system/molecules.lib.pen` — Molecular design system components

Current issues include:

- Inconsistent component alignment
- Poor visual distribution across the canvas
- Lack of professional polish in component positioning
- Misalignment between system library files and feature implementations

## Objectives

1. **Achieve Perfect Alignment** — Ensure all components align to a consistent grid system with proper spacing
2. **Optimize Canvas Distribution** — Distribute components evenly across the canvas with appropriate padding and breathing room
3. **Modernize Visual Language** — Apply contemporary design principles while maintaining brand consistency
4. **Establish System Consistency** — Align `.lib.pen` components with feature implementations for reusability

## Technical Requirements

- Use Pencil MCP tools exclusively for all `.pen` file operations
- Follow the MCP-first workflow defined in `/design/docs/DESIGN-SSOT.md`
- Apply spacing and layout patterns from `/design/docs/generation/ui-generation-cheatsheet.md`
- Ensure WCAG 2.1 AA accessibility compliance
- Maintain RTL/LTR support as defined in the design system

## Success Criteria

- All components align to a consistent 4px/8px grid system
- Canvas layout demonstrates intentional distribution with clear visual hierarchy
- Component positioning follows professional design patterns (F-pattern, Z-pattern where appropriate)
- `.lib.pen` files serve as canonical references for feature implementations
- Design passes visual validation against `/design/README.md` guidelines

## Approach

1. Inspect existing design files using Pencil MCP `batch_get` tool
2. Load relevant design guidelines using `get_guidelines` (layout, spacing, alignment)
3. Refine component positioning using `batch_design` with update operations
4. Verify alignment and distribution using `snapshot_layout`
5. Export screenshots for visual validation

## Constraints

- Do not use Read/Grep tools on `.pen` files (content is encrypted)
- Do not alter component functionality or content — only adjust positioning, alignment, and distribution
- Maintain all existing tokens, variables, and component references
- Preserve any existing theming or variant structures
