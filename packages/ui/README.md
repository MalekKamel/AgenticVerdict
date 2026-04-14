# @agenticverdict/ui

The design system for AgenticVerdict - a multi-business-domain intelligence platform.

## Overview

This package provides a comprehensive component library built with React, TypeScript, and Mantine v7. It implements atomic design principles with a three-tier design token system supporting multi-tenant theming.

## Installation

```bash
pnpm add @agenticverdict/ui
```

## Features

- **Three-Tier Design Token System**: Global → Brand → Component
- **Multi-Tenant Theming**: Runtime theme switching without code changes
- **RTL/LTR Support**: Full right-to-left layout support for Arabic and other RTL languages
- **WCAG 2.1 AA Compliance**: All components meet accessibility standards
- **TypeScript First**: Full type safety with strict mode enabled
- **Atomic Design**: Atoms → Molecules → Organisms architecture

## Quick Start

```tsx
import { UIProvider, Button, Card, FormField, Input } from "@agenticverdict/ui";

function App() {
  return (
    <UIProvider>
      <Card>
        <FormField label="Email" required>
          <Input type="email" placeholder="user@example.com" />
        </FormField>
        <Button variant="primary">Submit</Button>
      </Card>
    </UIProvider>
  );
}
```

## Components

### Atoms

Basic building blocks for constructing UIs:

- **Button** - Primary, secondary, ghost, danger, success, warning variants
- **Input** - Text inputs with validation states
- **Checkbox** - Checked, unchecked, indeterminate states
- **Badge** - Status indicators and labels
- **Typography** - Headings, body text, labels
- **Icon** - Icon wrapper component
- **Spinner** - Loading indicators
- **Separator** - Visual dividers

### Molecules

Combinations of atoms for common patterns:

- **Card** - Container with header, body, footer
- **FormField** - Input with label, helper text, error display
- **Alert** - Info, success, warning, error messages

## Theming

### Default Theme

```tsx
import { UIProvider } from "@agenticverdict/ui";

function App() {
  return <UIProvider>{/* ... */}</UIProvider>;
}
```

### Custom Theme

```tsx
import { UIProvider } from "@agenticverdict/ui";
import { BrandTokens } from "@agenticverdict/ui/tokens";

const customTheme: BrandTokens = {
  colors: {
    primary: "#FF6B35",
    secondary: "#6C757D",
    success: "#2E7D32",
    warning: "#ED6C02",
    danger: "#D32F2F",
    info: "#0288D1",
  },
  typography: {
    fontFamily: "Inter, sans-serif",
  },
  branding: {
    appName: "My App",
  },
};

function App() {
  return <UIProvider theme={{ initialTheme: customTheme }}>{/* ... */}</UIProvider>;
}
```

## RTL Support

```tsx
import { DirectionProvider } from "@agenticverdict/ui";

function App() {
  return <DirectionProvider initialLocale="ar">{/* Arabic RTL layout */}</DirectionProvider>;
}
```

## Accessibility

All components are built with WCAG 2.1 AA compliance in mind:

- Keyboard navigation support
- Proper ARIA attributes
- Focus indicators
- Color contrast ratios ≥ 4.5:1
- Touch targets ≥ 44×44px

## Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## Design Tokens

### Global Tokens

Brand-agnostic primitives like colors, spacing, and typography:

```css
--av-color-blue-600: #1976d2;
--av-spacing-4: 1rem;
--av-font-size-md: 1rem;
```

### Brand Tokens

Tenant-specific overrides:

```css
--brand-color-primary: #1976d2;
--brand-font-family: Inter;
```

### Component Tokens

Composed from global and brand tokens:

```css
--button-primary-bg: var(--brand-color-primary);
--button-primary-text: #ffffff;
```

## License

MIT

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Support

For issues and questions, please use the [issue tracker](https://github.com/agenticverdict/agenticverdict/issues).
