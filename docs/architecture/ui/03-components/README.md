# UI Component Catalog

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [00-overview.md](../00-overview.md) - Design system overview
- [best-practices.md](../01-research-findings/best-practices.md) - B2B SaaS patterns
- [accessibility-standards.md](../01-research-findings/accessibility-standards.md) - WCAG 2.1 AA
- [business-architecture.md](../../business/business-architecture.md) - Business entities

---

## Overview

The AgenticVerdict UI component catalog is organized using **Atomic Design** principles, providing a systematic approach to building interfaces from basic building blocks to complete page layouts. This organization ensures component reusability, maintainability, and consistency across the multi-business-domain intelligence platform.

**Design Philosophy:**

- **Accessibility First**: WCAG 2.1 AA compliance with AAA aspirations for critical paths
- **Internationalization Built-In**: Full Arabic RTL support from day one
- **Progressive Disclosure**: Show key information first with drill-down capabilities
- **Multi-Tenant Flexible**: Theme tokens support white-label customization
- **Performance Conscious**: Components optimized for <500KB initial bundle

---

## Component Organization

### Atomic Design Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│ PAGES                                                   │
│ Complete user interfaces (Insights Dashboard, Settings) │
└─────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────┐
│ TEMPLATES                                               │
│ Page-level layouts (DashboardLayout, AuthLayout)        │
└─────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────┐
│ ORGANISMS                                               │
│ Complex UI sections (DataTable, Sidebar, ConnectorCard) │
└─────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────┐
│ MOLECULES                                               │
│ Composite components (FormField, Card, SearchInput)     │
└─────────────────────────────────────────────────────────┘
                            ↑
┌─────────────────────────────────────────────────────────┐
│ ATOMS                                                   │
│ Basic UI elements (Button, Input, Badge, Icon)         │
└─────────────────────────────────────────────────────────┘
```

### Component Index by Category

#### Atoms ([atoms.md](./atoms.md))

Basic building blocks that cannot be broken down further.

| Component      | Purpose                | Variants                              | Status         |
| -------------- | ---------------------- | ------------------------------------- | -------------- |
| **Button**     | Primary action trigger | primary, secondary, tertiary, danger  | ✅ Implemented |
| **Input**      | Text data entry        | text, email, password, number, search | ✅ Implemented |
| **Badge**      | Status/label display   | status, count, label, dot             | ✅ Implemented |
| **Icon**       | Visual symbol          | icon set, sizes, accessibility        | ✅ Implemented |
| **Typography** | Text styling           | headings, body, captions              | ✅ Implemented |
| **Loader**     | Loading indication     | spinner, skeleton, progress bar       | ✅ Implemented |

#### Molecules ([molecules.md](./molecules.md))

Simple combinations of atoms that serve specific business functions.

| Component         | Purpose                       | Variants                               | Status         |
| ----------------- | ----------------------------- | -------------------------------------- | -------------- |
| **FormField**     | Labeled input with validation | required, optional, error states       | ✅ Implemented |
| **SearchInput**   | Search with filters           | basic, with filters, with autocomplete | 🔄 Phase 2     |
| **Card**          | Content container             | basic, interactive, collapsible        | ✅ Implemented |
| **Dropdown**      | Single/multi select           | single, multi, searchable              | 🔄 Phase 2     |
| **DatePicker**    | Date selection                | single, range, timezone-aware          | 🔄 Phase 2     |
| **Toggle/Switch** | Boolean input                 | default, compact, with label           | ✅ Implemented |
| **Select**        | Option selection              | platform, domain, tenant               | ✅ Implemented |

#### Organisms ([organisms.md](./organisms.md))

Complex, reusable UI sections that combine molecules and atoms.

| Component              | Purpose                | Key Features                        | Status         |
| ---------------------- | ---------------------- | ----------------------------------- | -------------- |
| **DataTable**          | Tabular data display   | Sorting, filtering, pagination, RTL | 🔄 Phase 2     |
| **Navigation**         | Primary/secondary nav  | Hierarchical, breadcrumbs, mobile   | ✅ Implemented |
| **Sidebar**            | Collapsible navigation | Tenant switcher, agencies, domains  | 🔄 Phase 2     |
| **ConnectorCard**      | Connector status       | Health, metrics, actions, errors    | 🔄 Phase 2     |
| **InsightCard**        | Insight summary        | Metrics, trends, drill-down, export | 🔄 Phase 2     |
| **MetricCard**         | Single metric display  | Value, trend, sparkline, comparison | 🔄 Phase 2     |
| **ChartContainer**     | Data visualization     | Line, bar, pie, funnel, RTL support | 🔄 Phase 2     |
| **EmptyState**         | No data/success states | Illustrations, actions, messaging   | 🔄 Phase 2     |
| **Notification/Toast** | Alert messages         | Types, positions, auto-dismiss      | ✅ Implemented |

#### Templates ([templates.md](./templates.md))

Page-level layouts that define structure without content.

| Template            | Purpose              | Sections                                  | Status         |
| ------------------- | -------------------- | ----------------------------------------- | -------------- |
| **DashboardLayout** | Main app layout      | Sidebar, header, content area, responsive | ✅ Implemented |
| **AuthLayout**      | Authentication pages | Centered card, minimal branding           | ✅ Implemented |
| **ReportLayout**    | Report viewing       | Document viewer, export controls          | 🔄 Phase 2     |
| **SettingsLayout**  | Settings pages       | Navigation sidebar, form sections         | 🔄 Phase 2     |

#### Patterns ([patterns.md](./patterns.md))

Reusable interaction patterns for complex user flows.

| Pattern                | Purpose              | Use Cases                                     | Status     |
| ---------------------- | -------------------- | --------------------------------------------- | ---------- |
| **Modal/Dialog**       | Focused interactions | Confirmations, forms, detailed views          | 🔄 Phase 2 |
| **Drawer**             | Side panel content   | Filters, details, context                     | 🔄 Phase 2 |
| **Tooltip**            | Contextual help      | Icon explanations, field hints                | 🔄 Phase 2 |
| **ConfirmationDialog** | Destructive actions  | Delete, disconnect, archive                   | 🔄 Phase 2 |
| **ProgressStepper**    | Multi-step workflows | Onboarding, insight creation, connector setup | 🔄 Phase 2 |
| **ActionBar**          | Sticky actions       | Long forms, bulk operations                   | 🔄 Phase 2 |
| **FilterPanel**        | Collapsible filters  | Data tables, charts, reports                  | 🔄 Phase 2 |

---

## Component Development Guidelines

### When to Create New Components

**Create a new component when:**

1. **Reusability**: The UI pattern appears 3+ times across the application
2. **Complexity**: The component has internal state, validation, or business logic
3. **Abstraction**: The component hides implementation details from consumers
4. **Consistency**: Multiple instances need synchronized behavior and styling

**Do NOT create new components when:**

1. **One-off UI**: The pattern appears only once (inline it instead)
2. **Presentational Only**: Pure CSS without behavior (use utility classes)
3. **Over-abstraction**: Creating components for trivial variations

### Component Naming Conventions

```
✅ GOOD:
- ConnectorCard.tsx      (PascalCase, descriptive)
- MetricCard.tsx         (PascalCase, descriptive)
- useConnectorStatus.ts  (camelCase, hooks prefix)

❌ BAD:
- Card.tsx               (Too generic)
- connector.tsx          (Wrong case, unclear purpose)
- utils.ts               (Too vague)
```

### Component File Structure

```
packages/ui/src/
├── atoms/
│   ├── Button/
│   │   ├── Button.tsx           # Main component
│   │   ├── Button.test.tsx      # Unit tests
│   │   ├── Button.stories.tsx   # Ladle stories (Phase 2)
│   │   └── index.ts             # Export barrel
│   ├── Input/
│   └── ...
├── molecules/
│   ├── FormField/
│   │   ├── FormField.tsx
│   │   ├── FormField.test.tsx
│   │   └── index.ts
│   └── ...
├── organisms/
│   ├── DataTable/
│   │   ├── DataTable.tsx
│   │   ├── DataTable.test.tsx
│   │   ├── DataTable.types.ts   # Complex type definitions
│   │   └── index.ts
│   └── ...
└── index.ts                     # Public API exports
```

### Component Specification Template

Every component in this catalog follows this specification structure:

```markdown
## [Component Name]

### Purpose

Clear description of what the component does and when to use it.

### Props/Inputs

TypeScript interface with all properties, types, and descriptions.

### Outputs/Events

Callback props with event signatures and descriptions.

### Variants

Visual/functional variations (size, color, style).

### States

All possible states (default, hover, active, disabled, error, loading, empty).

### Composition Rules

What children/components can be nested inside.

### Accessibility Requirements

ARIA attributes, keyboard navigation, screen reader support.

### RTL/LTR Behavior

Layout mirroring, icon flipping, text alignment differences.

### Multi-Language Support

Translation keys for all user-facing strings.

### Usage Examples

Code examples showing common use cases.

### Related Components

Links to related components in the catalog.

### Related Entities/Pages

Links to business entities and where this component is used.
```

---

## Design Token Integration

All components consume design tokens from the three-tier system:

```typescript
// Global tokens (brand-agnostic)
--av-color-primary: #228BE6;
--av-spacing-md: 1rem;
--av-radius-md: 0.5rem;

// Brand tokens (tenant-specific)
--brand-color-primary: #FF6B35;  // Masafh orange
--brand-logo-url: /logos/masafh.svg;

// Component tokens (composed from global/brand)
--button-primary-bg: var(--brand-color-primary, var(--av-color-primary));
--card-padding: var(--av-spacing-md);
```

**Usage in Components:**

```tsx
import { useMantineTheme } from "@mantine/core";

function Button({ variant = "primary" }) {
  const theme = useMantineTheme();

  return (
    <button
      style={{
        backgroundColor:
          variant === "primary"
            ? theme.colors.brand[6] // Uses brand token
            : theme.colors.gray[1], // Uses global token
        // Direction-aware spacing
        paddingInline: theme.spacing.md,
        marginInlineStart: theme.spacing.sm,
      }}
    >
      {children}
    </button>
  );
}
```

---

## Testing Requirements

### Unit Tests (70%+ Coverage Target)

Every component must have:

1. **Rendering Tests**: Verify component renders without errors
2. **Variant Tests**: Test all visual/functional variants
3. **State Tests**: Test all states (hover, disabled, error, loading)
4. **Event Tests**: Verify callbacks fire correctly
5. **Accessibility Tests**: Test ARIA attributes, keyboard navigation

```tsx
// Example: Button.test.tsx
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    screen.getByRole("button").click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("has correct ARIA label for icon-only buttons", () => {
    render(<Button icon="refresh" aria-label="Refresh data" />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Refresh data");
  });
});
```

### Accessibility Tests (Automated in CI)

```tsx
// Automated a11y tests using axe-core
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("Button accessibility", () => {
  it("should not have accessibility violations", async () => {
    const { container } = render(<Button>Submit</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Visual Regression Tests (Phase 2)

```tsx
// Visual regression using Chromatic or Percy
describe("Button visual regression", () => {
  it("matches snapshot for all variants", () => {
    const variants = ["primary", "secondary", "tertiary", "danger"];
    variants.forEach((variant) => {
      const { container } = render(<Button variant={variant}>Click</Button>);
      expect(container).toMatchSnapshot();
    });
  });
});
```

### RTL Layout Tests

```tsx
// Test component behavior in both LTR and RTL
import { render } from "@testing-library/react";
import { DirectionProvider } from "@mantine/core";

describe("Button RTL behavior", () => {
  const renderWithDirection = (ui, direction = "ltr") => {
    return render(<DirectionProvider initialDirection={direction}>{ui}</DirectionProvider>);
  };

  it("mirrors padding in RTL", () => {
    const { container: ltrContainer } = renderWithDirection(<Button>LTR</Button>, "ltr");
    const { container: rtlContainer } = renderWithDirection(<Button>RTL</Button>, "rtl");

    // Verify logical properties work in both directions
    const ltrButton = ltrContainer.querySelector("button");
    const rtlButton = rtlContainer.querySelector("button");

    expect(ltrButton).toHaveStyle({ paddingInlineStart: "1rem" });
    expect(rtlButton).toHaveStyle({ paddingInlineStart: "1rem" });
  });
});
```

---

## Component Status Legend

| Status             | Description                  | Next Steps              |
| ------------------ | ---------------------------- | ----------------------- |
| **✅ Implemented** | Component exists in codebase | Document, test, refine  |
| **🔄 Phase 2**     | Planned for next phase       | Design, implement, test |
| **📋 Planned**     | Future consideration         | Evaluate, prioritize    |
| **⚠️ Deprecated**  | No longer recommended        | Migrate to replacement  |

---

## Related Documentation

### Architecture Documents

- [Technical Architecture](../../business/technical-architecture.md) - System architecture, components, data flow
- [Implementation Guide](../../business/implementation-guide.md) - Current status, patterns, conventions
- [Business Architecture](../../business/business-architecture.md) - Domain entities, multi-tenancy model

### UI Research Documents

- [Design System Landscape](../01-research-findings/design-system-landscape.md) - Component organization, token architecture
- [Best Practices](../01-research-findings/best-practices.md) - Modern B2B SaaS patterns
- [Accessibility Standards](../01-research-findings/accessibility-standards.md) - WCAG 2.1 AA compliance
- [Performance Optimization](../01-research-findings/performance-optimization.md) - Bundle optimization, lazy loading

### Implementation Documents

- [Component Development Workflow](../01-research-findings/technology-evaluation.md#component-development-workflow) - Step-by-step guide
- [Testing Strategy](../../../../docs/02-planning-and-methodology/testing-strategy.md) - Coverage targets, test types

---

## Contributing to the Component Catalog

### Adding New Components

1. **Check existing components first** - Avoid duplication
2. **Create component file** - Follow file structure conventions
3. **Write specification** - Document using component template
4. **Implement component** - Use Mantine v9 as base, add customization
5. **Write tests** - Unit tests, accessibility tests, visual tests
6. **Create stories** - Ladle stories for documentation (Phase 2)
7. **Update catalog** - Add to appropriate category index

### Updating Existing Components

1. **Identify change scope** - Breaking vs. non-breaking
2. **Update specification** - Document new props, variants, behavior
3. **Update tests** - Add test cases for new functionality
4. **Update stories** - Add new variants to documentation
5. **Changelog entry** - Document change in changelog/

---

## Document Status

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After Phase 2 completion
**Maintainer:** UI/UX Team

**Related Specifications:**

- [atoms.md](./atoms.md) - Basic UI elements
- [molecules.md](./molecules.md) - Composite components
- [organisms.md](./organisms.md) - Complex UI sections
- [templates.md](./templates.md) - Page layout templates
- [patterns.md](./patterns.md) - Reusable interaction patterns
