# AgenticVerdict Design System

**Version:** 1.1.0
**Last Updated:** 2026-04-15
**Status:** Active

---

## Overview

The AgenticVerdict Design System provides a comprehensive, accessible, and internationalized component library for the multi-tenant SaaS platform. Built on **Mantine v9** and **TanStack Start**, it follows **Atomic Design methodology** with three-tier design token architecture.

### Key Features

- **WCAG 2.1 AA Compliant:** All components meet accessibility standards
- **RTL/LTR Support:** Full Arabic/English layout mirroring
- **Multi-Tenant Theming:** Runtime brand customization without rebuilds
- **Type-Safe:** Full TypeScript support with strict mode
- **Atomic Design:** Organized in atoms → molecules → organisms → templates

---

## Quick Start

### Installation

```bash
pnpm add @agenticverdict/ui
```

### Basic Usage

```tsx
import { Button, Input, Card } from "@agenticverdict/ui";

function App() {
  return (
    <Card variant="elevated">
      <Input label="Email" type="email" required />
      <Button variant="primary">Submit</Button>
    </Card>
  );
}
```

---

## Directory Structure

Conventions also include top-level **`tokens/`**, **`patterns/`**, and **`components/`** entrypoints (see each `README.md`) alongside implementation markdown under **`docs/`**.

**Pencil (`.pen`) layout** follows [pen-architecture-implementation-plan.md](docs/research/pen-architecture-implementation-plan.md): consolidated system libraries, feature compositions, and shared assets.

```
design/
├── system/                          # Authoritative .pen libraries
│   ├── design-tokens.pen            # Three-tier tokens
│   ├── atoms.pen                    # All atomic components (single document)
│   ├── molecules.pen                # Atoms + molecules (same doc for in-file refs)
│   └── README.md
├── features/                        # Domain screens (e.g. auth.pen)
│   └── README.md
├── assets/                          # icons/, illustrations/, images/
│   └── README.md
├── docs/                            # Implementation documentation and guides
│   ├── design-tokens-implementation.md   # Three-tier token system
│   ├── button-implementation.md          # Button (6 variants × 5 sizes × 5 states)
│   ├── input-implementation.md           # Input (5 types × 3 sizes × 6 states)
│   ├── form-controls-implementation.md   # Checkbox, Radio, Switch
│   ├── display-implementation.md         # Badge, Icon, Typography
│   ├── form-field-search-card-implementation.md  # FormField, SearchInput, Card
│   ├── remaining-implementation.md       # Dropdown, Tooltip, Alert, Toast (molecules)
│   ├── research/                         # Architecture plans and research
│   └── generation/                       # UI generation guides and cheatsheets
├── tokens/                          # Entry: links to token .pen + docs
├── patterns/                        # Entry: UX patterns + doc links (planned)
├── components/                      # Entry: maps atoms/molecules → packages/ui (planned)
└── scripts/                         # Validation and utility scripts
    ├── validate-feature-pen-reuse.py
    ├── validate-pen-files.py # Schema validation for .pen files
    └── merge-pen-system-layout.py
```

## /scripts

## Design Tokens

### Three-Tier Architecture

| Tier      | Prefix       | Purpose                    | Example                 |
| --------- | ------------ | -------------------------- | ----------------------- |
| Global    | `--av-*`     | Brand-agnostic primitives  | `--av-color-blue-700`   |
| Brand     | `--brand-*`  | Tenant-specific overrides  | `--brand-color-primary` |
| Component | `--button-*` | Composed from global/brand | `--button-primary-bg`   |

### Token Categories

**Colors:**

```
Global:    --av-color-blue-700: #1976D2
Brand:     --brand-color-primary: var(--av-color-blue-700)
Component: --button-primary-bg: var(--brand-color-primary)
```

**Spacing (4px base):**

```
--av-spacing-xs: 4px    --av-spacing-sm: 8px    --av-spacing-md: 16px
--av-spacing-lg: 24px   --av-spacing-xl: 32px
```

**Typography:**

```
--av-font-size-xs: 12px    --av-font-size-sm: 14px    --av-font-size-base: 16px
--av-font-size-lg: 18px    --av-font-size-xl: 20px
```

### Theme Configuration

Tenant themes are applied at runtime via the `CompanyConfig` interface:

```typescript
interface CompanyConfig {
  localization: {
    language: "ar" | "en" | "fr";
    direction: "rtl" | "ltr";
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    fontFamily: string;
  };
}
```

---

## Components

### Atoms (11 Components)

| Component      | Variants                                                | Sizes                  | States                                                   | Documentation                                                           |
| -------------- | ------------------------------------------------------- | ---------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Button**     | 6 (primary, secondary, ghost, danger, success, warning) | 5 (xs, sm, md, lg, xl) | 5 (default, hover, active, disabled, loading)            | [button-implementation.md](docs/button-implementation.md)               |
| **Input**      | 5 (text, email, password, number, search)               | 3 (sm, md, lg)         | 6 (default, error, warning, success, disabled, readonly) | [input-implementation.md](docs/input-implementation.md)                 |
| **Checkbox**   | 4 (unchecked, checked, indeterminate, disabled)         | -                      | -                                                        | [form-controls-implementation.md](docs/form-controls-implementation.md) |
| **Radio**      | 3 (unselected, selected, disabled)                      | -                      | -                                                        | [form-controls-implementation.md](docs/form-controls-implementation.md) |
| **Switch**     | 3 (off, on, disabled)                                   | 3 (sm, md, lg)         | -                                                        | [form-controls-implementation.md](docs/form-controls-implementation.md) |
| **Badge**      | 4 (default, filled, light, outline)                     | 4 (xs, sm, md, lg)     | -                                                        | [display-implementation.md](docs/display-implementation.md)             |
| **Icon**       | -                                                       | 5 (xs, sm, md, lg, xl) | -                                                        | [display-implementation.md](docs/display-implementation.md)             |
| **Typography** | 17 (h1-h6, display, body, label, caption)               | -                      | -                                                        | [display-implementation.md](docs/display-implementation.md)             |
| **Link**       | 3 (primary, secondary, gray)                            | -                      | -                                                        | [remaining-implementation.md](docs/remaining-implementation.md)         |
| **Separator**  | 3 (solid, dashed, dotted)                               | 5 (xs, sm, md, lg, xl) | -                                                        | [remaining-implementation.md](docs/remaining-implementation.md)         |
| **Spinner**    | -                                                       | 5 (xs, sm, md, lg, xl) | 3 (slow, normal, fast)                                   | [remaining-implementation.md](docs/remaining-implementation.md)         |

### Molecules (10 Components)

| Component       | Variants                                                                   | Composed Of                | Documentation                                                                             |
| --------------- | -------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------- |
| **FormField**   | 6 (default, required, error, warning, success, disabled)                   | Input + Typography         | [form-field-search-card-implementation.md](docs/form-field-search-card-implementation.md) |
| **SearchInput** | 4 (default, with value, focus, disabled)                                   | Input + Icon + Button      | [form-field-search-card-implementation.md](docs/form-field-search-card-implementation.md) |
| **Card**        | 7 (default, elevated, outlined, filled, withHeader, withFooter, clickable) | Typography + Button        | [form-field-search-card-implementation.md](docs/form-field-search-card-implementation.md) |
| **Dropdown**    | 3 (default, open, withIcons)                                               | Button + Menu              | [remaining-implementation.md](docs/remaining-implementation.md)                           |
| **Select**      | -                                                                          | Dropdown + Input           | [remaining-implementation.md](docs/remaining-implementation.md)                           |
| **DatePicker**  | -                                                                          | Input + Calendar           | (future)                                                                                  |
| **Tooltip**     | 4 (top, bottom, left, right)                                               | Trigger + Content          | [remaining-implementation.md](docs/remaining-implementation.md)                           |
| **Popover**     | -                                                                          | Trigger + Content          | [remaining-implementation.md](docs/remaining-implementation.md)                           |
| **Alert**       | 4 (info, success, warning, error)                                          | Icon + Typography + Button | [remaining-implementation.md](docs/remaining-implementation.md)                           |
| **Toast**       | 4 (default, success, error, withAction)                                    | Icon + Typography + Button | [remaining-implementation.md](docs/remaining-implementation.md)                           |

---

## Accessibility (WCAG 2.1 AA)

### Compliance Checklist

All components meet the following requirements:

| Requirement               | Standard                              | Implementation                                   |
| ------------------------- | ------------------------------------- | ------------------------------------------------ |
| **Color Contrast**        | Normal text: ≥4.5:1, Large text: ≥3:1 | Verified for all variant/state combinations      |
| **Touch Targets**         | 44×44px minimum                       | All interactive elements meet minimum            |
| **Keyboard Navigation**   | Tab, Enter, Space, Escape             | All interactive components accessible            |
| **Focus Indicators**      | Visible 2px outline                   | `--focus-ring-color` on all interactive elements |
| **Screen Reader Support** | ARIA attributes, live regions         | Proper roles, labels, and descriptions           |
| **Reduced Motion**        | Respects `prefers-reduced-motion`     | Animations slow/stop for affected users          |
| **High Contrast Mode**    | Compatible with OS high contrast      | No color-only information                        |

### Keyboard Navigation

| Key          | Action                                                |
| ------------ | ----------------------------------------------------- |
| `Tab`        | Move focus to next interactive element                |
| `Shift+Tab`  | Move focus to previous interactive element            |
| `Enter`      | Activate button, link, or select option               |
| `Space`      | Toggle checkbox, switch, or activate button           |
| `Escape`     | Close dropdown, tooltip, popover, modal               |
| `Arrow Keys` | Navigate within radio groups, dropdowns, date pickers |

### ARIA Attributes

| Component | ARIA Attributes                                                          |
| --------- | ------------------------------------------------------------------------ |
| Button    | `aria-disabled`, `aria-label` (icon-only), `aria-live` (loading)         |
| Input     | `aria-invalid`, `aria-required`, `aria-errormessage`, `aria-describedby` |
| Checkbox  | `aria-checked` ("true", "false", "mixed")                                |
| Radio     | `aria-checked`, group with `aria-labelledby`                             |
| Switch    | `role="switch"`, `aria-checked`                                          |
| Dropdown  | `aria-expanded`, `aria-haspopup`, `role="listbox/menu"`                  |
| Tooltip   | `role="tooltip"`, `aria-describedby`                                     |
| Alert     | `role="alert"`, `aria-live` ("polite" or "assertive")                    |

---

## Internationalization (RTL/LTR)

### Text Direction

The platform automatically detects the user's language preference and sets the document direction:

```html
<!-- LTR (English) -->
<html dir="ltr" lang="en">
  <!-- RTL (Arabic) -->
  <html dir="rtl" lang="ar"></html>
</html>
```

### Logical Properties

All components use CSS logical properties instead of directional properties:

| Instead Of          | Use                    |
| ------------------- | ---------------------- |
| `margin-left`       | `margin-inline-start`  |
| `margin-right`      | `margin-inline-end`    |
| `padding-left`      | `padding-inline-start` |
| `padding-right`     | `padding-inline-end`   |
| `text-align: left`  | `text-align: start`    |
| `text-align: right` | `text-align: end`      |
| `border-left`       | `border-inline-start`  |
| `border-right`      | `border-inline-end`    |

### RTL Icon Mirroring

Directional icons (arrows, chevrons) automatically flip in RTL mode:

```tsx
<Icon icon={IconArrowRight} mirror />  <!-- Flips in RTL -->
```

---

## Multi-Tenant Theming

### How It Works

1. **User authenticates** → System retrieves tenant context
2. **Tenant theme loaded** → Brand tokens overridden at runtime
3. **Components update** → All components using brand tokens reflect changes
4. **No rebuild required** → Theme changes applied via CSS custom properties

### Creating a Custom Theme

```typescript
const customTheme = {
  colors: {
    primary: "#FF6B35",
    secondary: "#4C6EF5",
    accent: "#FFD43B",
  },
  typography: {
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  branding: {
    logo: { url: "/logos/custom.svg" },
  },
};

// Apply theme
await applyTheme(customTheme);
```

### Theme Isolation

Each tenant's theme is completely isolated:

- Theme A cannot affect Theme B's components
- Invalid values fall back to defaults
- Themes cached for performance

---

## .pen Files Guide

### What Are .pen Files?

`.pen` files are Pencil.dev's encrypted design file format containing:

- Component hierarchies and relationships
- Design tokens (colors, spacing, typography)
- Layout systems and responsive behaviors
- Component instances and overrides
- Theme configurations

### Working with .pen Files

**Only Pencil MCP server tools can read/modify .pen files:**

| Tool               | Purpose                                                        |
| ------------------ | -------------------------------------------------------------- |
| `get_editor_state` | Get current document state                                     |
| `open_document`    | Create/open .pen files                                         |
| `batch_get`        | Read/search nodes                                              |
| `batch_design`     | Create/modify designs                                          |
| `get_guidelines`   | Load Code / Tailwind guides before implementing UI in the repo |
| `get_screenshot`   | Visual verification                                            |
| `export_nodes`     | Export to images                                               |

### MCP-first design-to-code workflow

Pencil MCP **does not** emit `.tsx` or other application source files. Before changing React/UI code for a `.pen`-backed screen, follow the repo SSOT: [MCP-first design-to-code workflow](docs/generation/ui-generation-cheatsheet.md#mcp-first-design-to-code-workflow-repo-ssot) (inspect design with MCP, load **Code** / **Tailwind** guidelines, map tokens from `batch_get` / `get_variables`, then implement in the workspace).

### Implementation Blueprints

This repository contains comprehensive implementation blueprints for each component. These blueprints document:

- Component hierarchy structure
- Pencil MCP operations needed
- Design token references
- RTL/LTR considerations
- Accessibility requirements
- Pseudo-code for `batch_design` operations

To create actual `.pen` files, use the Pencil MCP tools following the patterns documented in each blueprint.

---

## Development Workflow

### Creating New Components

1. **Check existing components** → Use `batch_get` to verify no duplicates
2. **Create implementation blueprint** → Document hierarchy, tokens, accessibility
3. **Implement in .pen file** → Use `batch_design` following blueprint
4. **Verify with screenshots** → Use `get_screenshot` to validate appearance
5. **Export for documentation** → Use `export_nodes` for design handoff
6. **Implement in code** → After MCP inspection and `get_guidelines` (Code / Tailwind as needed), implement React components matching `.pen` specifications ([workflow](docs/generation/ui-generation-cheatsheet.md#mcp-first-design-to-code-workflow-repo-ssot))

### Quality Checklist

Before submitting a component for review:

- [ ] Component follows atomic design hierarchy
- [ ] All variants and states are created
- [ ] Design tokens used (no hardcoded values)
- [ ] RTL/LTR layouts work correctly
- [ ] Keyboard accessibility demonstrated
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Touch targets meet 44×44px minimum
- [ ] Component marked as `reusable: true`
- [ ] Naming convention followed: `Component/Category/Variant`
- [ ] Documentation complete with screenshots

---

## File Organization

```
design/
├── system/                    # .pen: tokens, atoms.pen, molecules.pen
├── features/                  # .pen: domain compositions (e.g. auth.pen)
├── assets/                    # Shared media for .pen references
├── docs/                      # Implementation documentation and guides
│   ├── design-tokens-implementation.md
│   ├── button-implementation.md
│   ├── input-implementation.md
│   ├── form-controls-implementation.md
│   ├── display-implementation.md
│   ├── remaining-implementation.md
│   ├── form-field-search-card-implementation.md
│   ├── research/
│   └── generation/
├── tokens/                    # Entry: links to token .pen + docs
└── scripts/                   # Validation and utility scripts
      └── validate-pen-files.py      # Schema validation for .pen files
```

---

## References

### Internal Documentation

- [UI Foundation Spec](/specs/01-ui/00-foundation/spec.md)
- [Data Model](/specs/01-ui/00-foundation/data-model.md)
- [Component API Contracts](/specs/01-ui/00-foundation/contracts/component-api.md)
- **Design System Documentation:**
  - [Design Tokens Implementation](docs/design-tokens-implementation.md)
  - [Component Implementation Guides](docs/) - All component blueprints
  - [Research & Architecture Plans](docs/research/) - Pencil .pen architecture
  - [UI Generation Guides](docs/generation/) - MCP-first workflows

### External Standards

- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Atomic Design Methodology](https://atomicdesign.bradfrost.com/)
- [Mantine v9 Documentation](https://mantine.dev/)
- [TanStack Start Documentation](https://tanstack.com/start)

---

## Enforcement (AI agents & CI)

- **Agent policy:** `/prompts/ui-guidelines-enforcement.md`
- **Cursor rules:** `.cursor/rules/ui-guidelines.mdc`, `.cursor/rules/design-system-pen.mdc`
- **Gap analysis / roadmap:** See research plans in `docs/research/`
- **Validation:** `pnpm run validate:pen-files` runs `design/scripts/validate-pen-files.py` (schema) and `design/scripts/validate-feature-pen-reuse.py --strict` (feature reusable naming heuristics; Phase B in [pen-feature-ref-reusability-implementation-plan.md](docs/research/pen-feature-ref-reusability-implementation-plan.md))
- **CI:** `.github/workflows/ui-guidelines-enforcement.yml` runs on changes under `design/`
- **PR template:** When opening a PR that touches `design/**`, use `.github/PULL_REQUEST_TEMPLATE/design_system.md` where applicable

## Contributing

1. Read the `.pen` architecture plan at `docs/research/pen-architecture-implementation-plan.md`, the feature reuse plan at `docs/research/pen-feature-ref-reusability-implementation-plan.md`, and the UI foundation plan at `/prompts/ui-foundation-pen-files-implementation-plan.md`
2. Follow the patterns in this README
3. Create implementation blueprints before coding
4. Verify accessibility compliance
5. Test RTL/LTR layouts
6. Document all components with examples

---

## License

Internal use only - AgenticVerdict Platform

---

**Document End**
