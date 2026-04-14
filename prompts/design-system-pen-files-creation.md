# Prompt: Create Design System .pen Files

**Document Version:** 1.0
**Created:** 2026-04-14
**Status:** Active
**Context:** Based on comprehensive implementation blueprints at `/design-system/`

---

## Objective

Create the actual `.pen` files for the AgenticVerdict Design System using Pencil MCP tools, following the implementation blueprints documented in `/design-system/`. The implementation must support multi-tenant theming, RTL/LTR internationalization, and WCAG 2.1 AA accessibility compliance.

---

## Context

### Design System Overview

The AgenticVerdict Design System is a comprehensive, accessible, and internationalized component library for a multi-tenant SaaS platform. Built on **Mantine v9** and **TanStack Start**, it follows **Atomic Design methodology** with a three-tier design token architecture.

### Prerequisites

**Required Reading:**

1. `/design-system/README.md` — Comprehensive design system documentation
2. `/design-system/design-tokens-implementation.md` — Three-tier token system specification
3. `/design-system/accessibility-verification.md` — WCAG 2.1 AA requirements
4. `/prompts/ui-foundation-pen-files-implementation-plan.md` — Full implementation workflow

**Implementation Blueprints (Atoms):**

1. `/design-system/atoms/button-implementation.md` — Button (6 variants × 5 sizes × 5 states)
2. `/design-system/atoms/input-implementation.md` — Input (5 types × 3 sizes × 6 states)
3. `/design-system/atoms/form-controls-implementation.md` — Checkbox, Radio, Switch
4. `/design-system/atoms/display-implementation.md` — Badge, Icon, Typography
5. `/design-system/atoms/remaining-implementation.md` — Link, Separator, Spinner

**Implementation Blueprints (Molecules):**

1. `/design-system/molecules/form-field-search-card-implementation.md` — FormField, SearchInput, Card
2. `/design-system/molecules/remaining-implementation.md` — Dropdown, Select, DatePicker, Tooltip, Popover, Alert, Toast

### Technology Stack

- **Design Tool:** Pencil MCP server with `.pen` file format
- **UI Framework:** Mantine v9 (primary component library)
- **Application Framework:** TanStack Start (file-based routing)
- **Language:** TypeScript 5.3+ (strict mode)

---

## Task Requirements

### 1. Design Token System

Create a comprehensive three-tier design token system:

**Tier 1: Global Tokens (`--av-*`)**

- Colors: 10-color scale (blue, gray, semantic colors)
- Spacing: 7-point scale (4px base: xs, sm, md, lg, xl, 2xl, 3xl)
- Typography: 8 font sizes (12px-36px), 4 weights, 3 line heights
- Effects: 6 border radii, 4 shadows, 3 transitions
- Z-index: 7 levels (base to modal)

**Tier 2: Brand Tokens (`--brand-*`)**

- Primary, secondary, accent colors
- Font family
- Logo URL and dimensions
- Default theme configuration
- Masafh tenant theme example

**Tier 3: Component Tokens (`--component-*`)**

- Button tokens (25+)
- Input tokens (15+)
- Card tokens (7+)
- Alert tokens (12+)
- Other component-specific tokens

### 2. Component Creation Standards

**All components MUST:**

- Use design tokens exclusively (NO hardcoded values)
- Support RTL/LTR layouts via CSS logical properties
- Include all variants, sizes, and states per blueprint
- Demonstrate keyboard accessibility
- Meet WCAG 2.1 AA color contrast requirements
- Use 44×44px minimum touch targets
- Include proper ARIA attributes
- Follow naming convention: `Component/Category/Variant`
- Be marked as `reusable: true`

**Critical Implementation Detail:**
Use CSS logical properties instead of directional properties:

- Use `padding-inline-start` instead of `padding-left`
- Use `margin-inline-end` instead of `margin-right`
- Use `text-align: start` instead of `text-align: left`
- Use `border-inline-start` instead of `border-left`

### 3. File Organization

Create the following `.pen` files:

```
/design-system/
├── design-tokens.pen              # All three-tier tokens
├── atoms/
│   ├── button.pen                 # All button variants
│   ├── input.pen                  # All input types
│   ├── checkbox.pen               # Checkbox states
│   ├── radio.pen                  # Radio states
│   ├── switch.pen                 # Switch states
│   ├── badge.pen                  # Badge variants
│   ├── icon.pen                   # Icon sizes
│   ├── typography.pen             # Typography styles
│   ├── link.pen                   # Link variants
│   ├── separator.pen              # Separator styles
│   └── spinner.pen                # Spinner sizes
├── molecules/
│   ├── form-field.pen             # FormField variants
│   ├── search-input.pen           # SearchInput states
│   ├── card.pen                   # Card variants
│   ├── dropdown.pen               # Dropdown states
│   ├── select.pen                 # Select component
│   ├── date-picker.pen            # DatePicker component
│   ├── tooltip.pen                # Tooltip positions
│   ├── popover.pen                # Popover component
│   ├── alert.pen                  # Alert variants
│   └── toast.pen                  # Toast variants
```

### 4. Implementation Workflow

For each component:

**Step 1: Read the Implementation Blueprint**

- Use the `Read` tool to review the component's blueprint
- Understand the hierarchy, variants, and tokens required
- Note accessibility requirements and RTL considerations

**Step 2: Initialize/Create .pen File**

- Use `mcp__pencil__open_document` to create a new .pen file
- Set up the design system frame structure

**Step 3: Define Component Structure**

- Use `mcp__pencil__batch_design` to create the component
- Follow the blueprint's hierarchy exactly
- Create all variants, sizes, and states

**Step 4: Apply Design Tokens**

- Use `mcp__pencil__set_variables` to define component tokens
- Reference global and brand tokens (no hardcoded values)

**Step 5: Verify with Screenshots**

- Use `mcp__pencil__get_screenshot` to verify appearance
- Check spacing, alignment, colors, and RTL mirroring

**Step 6: Export for Documentation**

- Use `mcp__pencil__export_nodes` to create component images
- Save to `/design-system/exports/` for documentation

### 5. Quality Verification

**For each component, verify:**

- [ ] All variants are created per blueprint
- [ ] All states are defined (default, hover, active, disabled)
- [ ] Design tokens are used (no hardcoded values)
- [ ] RTL/LTR layouts mirror correctly
- [ ] Keyboard accessibility is demonstrable
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 normal, 3:1 large)
- [ ] Touch targets are ≥44×44px
- [ ] Component is marked `reusable: true`
- [ ] Naming convention is followed
- [ ] ARIA attributes are included

---

## Implementation Sequence

### Phase 1: Design Token System

1. Create `design-tokens.pen` with all three-tier tokens
2. Configure theme axes (device, direction, mode, density)
3. Verify token propagation and theming

### Phase 2: Atom Components (Week 1)

1. **Interactive Atoms:** button.pen, input.pen, form-controls (checkbox, radio, switch)
2. **Display Atoms:** badge.pen, icon.pen, typography.pen
3. **Navigation Atoms:** link.pen, separator.pen, spinner.pen

### Phase 3: Molecule Components (Week 2)

1. **Form Molecules:** form-field.pen, search-input.pen
2. **Layout Molecules:** card.pen
3. **Interactive Molecules:** dropdown.pen, select.pen, date-picker.pen
4. **Feedback Molecules:** tooltip.pen, popover.pen, alert.pen, toast.pen

### Phase 4: Verification (Week 3)

1. Generate screenshots for all components
2. Verify accessibility compliance
3. Test RTL/LTR layouts
4. Test theme switching (default vs. Masafh)

---

## Success Criteria

**Completion Metrics:**

- [ ] All 21 components created as .pen files (11 atoms + 10 molecules)
- [ ] All 120+ design tokens defined
- [ ] All components marked as `reusable: true`
- [ ] Screenshot exports generated for all components

**Quality Metrics:**

- [ ] Zero hardcoded values (100% token usage)
- [ ] All components support RTL/LTR
- [ ] All interactive components keyboard accessible
- [ ] All color contrast ratios meet WCAG 2.1 AA
- [ ] All touch targets meet 44×44px minimum

---

## Handoff Requirements

The task is complete when:

1. All .pen files are created per file organization structure
2. Design tokens are defined for all three tiers
3. All components are reusable and follow atomic design hierarchy
4. Screenshots are exported for all components
5. Accessibility compliance is verified
6. RTL/LTR support is validated
7. Multi-tenant theming is demonstrated (at least 2 themes)

---

## Tools Required

Use only Pencil MCP server tools:

- `mcp__pencil__get_editor_state` — Get current document state
- `mcp__pencil__open_document` — Create/open .pen files
- `mcp__pencil__get_guidelines` — Load design guides
- `mcp__pencil__batch_get` — Read/search nodes
- `mcp__pencil__batch_design` — Create/modify designs
- `mcp__pencil__get_screenshot` — Visual verification
- `mcp__pencil__export_nodes` — Export to images
- `mcp__pencil__get_variables` — Read design tokens
- `mcp__pencil__set_variables` — Define design tokens

**DO NOT use Read or Grep tools on .pen files** — their contents are encrypted.

---

## References

- `/design-system/README.md` — Design system overview
- `/docs/architecture/business/design-system/pen-files-guide.md` — Pencil MCP guide
- `/specs/01-ui/00-foundation/spec.md` — UI foundation specification
- WCAG 2.1 AA Guidelines — Accessibility standard
- Atomic Design Methodology — Design system structure

---

**Document End**
