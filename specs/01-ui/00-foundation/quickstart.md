# Quick Start: UI Foundation

**Feature**: UI Foundation (001-ui-foundation)
**Branch**: `001-ui-foundation`
**Last Updated**: 2026-04-14

---

## Overview

This guide gets you started with the AgenticVerdict UI Foundation design system. You'll learn how to set up the development environment, use components, implement theming, and follow our development conventions.

**What You'll Learn**:
1. Development environment setup
2. Component library usage
3. Multi-tenant theming
4. RTL/LTR internationalization
5. Accessibility requirements
6. Testing your components
7. Contributing guidelines

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 20+ LTS installed
- **pnpm** package manager installed (`npm install -g pnpm`)
- **Git** for version control
- Access to the AgenticVerdict monorepo
- Familiarity with TypeScript and React

---

## 1. Environment Setup

### 1.1 Clone and Install

```bash
# Clone the repository (if you haven't already)
git clone <repository-url>
cd AgenticVerdict

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

This starts:
- **TanStack Start** web app at `http://localhost:3000`
- **tRPC API** server at `http://localhost:3001`
- **Background worker** for job processing

### 1.2 Verify Setup

```bash
# Run tests to verify everything works
pnpm test

# Run type checking
pnpm typecheck

# Build all packages
pnpm build
```

---

## 2. Using Components

### 2.1 Import Components

All components are exported from `@agenticverdict/ui`:

```typescript
// Import individual components (recommended for tree-shaking)
import { Button, Input, Card, FormField } from '@agenticverdict/ui';

// Or import from specific paths
import { Button } from '@agenticverdict/ui/atoms';
import { FormField } from '@agenticverdict/ui/molecules';
```

### 2.2 Basic Button

```typescript
import { Button } from '@agenticverdict/ui';

function MyComponent() {
  return (
    <Button variant="primary" onClick={() => console.log('Clicked')}>
      Click me
    </Button>
  );
}
```

**Available Variants**: `primary`, `secondary`, `ghost`, `danger`, `success`, `warning`
**Available Sizes**: `xs`, `sm`, `md` (default), `lg`, `xl`

### 2.3 Form Field with Input

```typescript
import { FormField } from '@agenticverdict/ui/molecules';
import { Input } from '@agenticverdict/ui/atoms';

function SignupForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  return (
    <FormField
      label="Email"
      required
      error={error}
      description="We'll send you a confirmation link"
    >
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
    </FormField>
  );
}
```

### 2.4 Card Component

```typescript
import { Card, Typography, Button } from '@agenticverdict/ui';

function DashboardCard() {
  return (
    <Card variant="elevated" header={<h3>Metrics</h3>}>
      <Typography variant="body-md">
        Your analytics overview for this period.
      </Typography>
      <Button variant="secondary" size="sm">View Details</Button>
    </Card>
  );
}
```

---

## 3. Multi-Tenant Theming

### 3.1 Theme Structure

The three-tier token system:

```css
/* Global tokens (brand-agnostic) */
--av-color-primary: #228BE6;
--av-spacing-md: 1rem;

/* Brand tokens (tenant-specific) */
--brand-color-primary: #FF6B35;  /* Masafh orange */

/* Component tokens (composed) */
--button-primary-bg: var(--brand-color-primary, var(--av-color-primary));
```

### 3.2 Apply Tenant Theme

```typescript
import { ThemeProvider, useTheme } from '@agenticverdict/ui';

// At app root
function App() {
  const tenantTheme = {
    id: 'masafh',
    colors: {
      primary: '#FF6B35',
      secondary: '#4C6EF5',
    },
    typography: {
      fontFamily: {
        primary: "'Inter', system-ui, sans-serif",
      },
    },
    branding: {
      logo: '/logos/masafh.svg',
    },
  };

  return (
    <ThemeProvider theme={tenantTheme}>
      <AppContent />
    </ThemeProvider>
  );
}
```

### 3.3 Dynamic Theme Loading

```typescript
import { trpc } from '@agenticverdict/frontend/trpc';

function ThemeLoader({ children }: { children: React.ReactNode }) {
  const { data: theme } = trpc.tenants.getTheme.useQuery();

  if (!theme) return <Spinner />;

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
```

---

## 4. RTL/LTR Internationalization

### 4.1 Direction Provider

```typescript
import { DirectionProvider } from '@agenticverdict/ui';

function App() {
  const locale = 'ar-SA';  // Arabic = RTL

  return (
    <DirectionProvider initialDir={locale === 'ar-SA' ? 'rtl' : 'ltr'}>
      <AppContent />
    </DirectionProvider>
  );
}
```

### 4.2 Use Logical Properties

When writing custom CSS, always use logical properties:

```css
/* ❌ Don't use directional properties */
.button {
  margin-left: 1rem;
  padding-right: 0.5rem;
  text-align: left;
}

/* ✅ Use logical properties */
.button {
  margin-inline-start: 1rem;
  padding-inline-end: 0.5rem;
  text-align: start;
}
```

### 4.3 Mirror Directional Icons

```typescript
import { Icon } from '@agenticverdict/ui';

// Automatically flips in RTL
<Icon icon={IconArrowRight} mirror />

// Manual mirror class
<Icon icon={IconArrowLeft} className="icon-mirror" />
```

---

## 5. Accessibility Requirements

### 5.1 Keyboard Navigation

All interactive components must be keyboard accessible:

```typescript
// ✅ Good: Keyboard accessible
<button onClick={handleClick} tabIndex={0}>
  Click me
</button>

// ❌ Bad: Div with click handler (not keyboard accessible)
<div onClick={handleClick}>
  Click me
</div>
```

### 5.2 ARIA Labels

Icon-only buttons require labels:

```typescript
// ✅ Good: Has aria-label
<button aria-label="Close dialog">
  <Icon icon={IconX} />
</button>

// ❌ Bad: No accessible name
<button>
  <Icon icon={IconX} />
</button>
```

### 5.3 Form Labels

All inputs must have associated labels:

```typescript
// ✅ Good: Label associated via htmlFor
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ✅ Good: Using FormField component
<FormField label="Email">
  <Input type="email" />
</FormField>

// ❌ Bad: No label
<input type="email" placeholder="Email" />
```

### 5.4 Color Contrast

Ensure minimum contrast ratios:
- **Normal text**: 4.5:1
- **Large text (18pt+)**: 3:1
- **UI components**: 3:1

### 5.5 Test Accessibility

```bash
# Run accessibility tests
pnpm test:a11y

# Run axe-core manually
pnpm test:axe
```

---

## 6. Testing Components

### 6.1 Unit Tests with Vitest

```typescript
// Button.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('applies variant classes', () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('variant-primary');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### 6.2 Accessibility Tests

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';
import { Button } from './Button';

expect.extend(toHaveNoViolations);

describe('Button accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 6.3 RTL Tests

```typescript
import { render, screen } from '@testing-library/react';
import { DirectionProvider } from '../providers/DirectionProvider';
import { Button } from './Button';

describe('Button RTL', () => {
  it('should mirror correctly in RTL', () => {
    render(
      <DirectionProvider initialDir="rtl">
        <Button leftIcon={<IconArrow />}>Button</Button>
      </DirectionProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('dir', 'rtl');
  });
});
```

### 6.4 Run All Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

---

## 7. Component Development

### 7.1 Create a New Component

```typescript
// packages/ui/src/atoms/MyComponent/MyComponent.tsx
interface MyComponentProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function MyComponent({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
}: MyComponentProps) {
  return (
    <button
      className={`my-component variant-${variant} size-${size}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### 7.2 Export Component

```typescript
// packages/ui/src/atoms/MyComponent/index.ts
export { MyComponent } from './MyComponent';
export type { MyComponentProps } from './MyComponent';
```

### 7.3 Add to Package Index

```typescript
// packages/ui/src/index.ts
export { MyComponent } from './atoms/MyComponent';
```

### 7.4 Write Tests

```typescript
// packages/ui/src/atoms/MyComponent/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders children', () => {
    render(<MyComponent>Test</MyComponent>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### 7.5 Accessibility Checklist

Before submitting a component, ensure:

- [ ] Keyboard accessible (Tab, Enter, Escape work)
- [ ] Visible focus indicator
- [ ] ARIA labels where needed
- [ ] Color contrast ≥4.5:1
- [ ] Touch target ≥44×44px
- [ ] Screen reader compatible
- [ ] Logical properties used (not directional)
- [ ] RTL layout tested
- [ ] axe-core passes with zero violations

---

## 8. Common Patterns

### 8.1 Loading States

```typescript
function DataList() {
  const { data, isLoading } = trpc.data.getList.useQuery();

  if (isLoading) {
    return <Spinner />;
  }

  return <div>{/* render data */}</div>;
}
```

### 8.2 Error States

```typescript
function DataList() {
  const { data, error } = trpc.data.getList.useQuery();

  if (error) {
    return (
      <Alert variant="error" title="Error loading data">
        {error.message}
      </Alert>
    );
  }

  return <div>{/* render data */}</div>;
}
```

### 8.3 Empty States

```typescript
function DataList() {
  const { data } = trpc.data.getList.useQuery();

  if (!data || data.length === 0) {
    return (
      <Card>
        <Typography variant="body-md" align="center">
          No data found. Create your first item to get started.
        </Typography>
      </Card>
    );
  }

  return <div>{/* render data */}</div>;
}
```

### 8.4 Responsive Layouts

```typescript
function ResponsiveLayout() {
  const { isMobile } = useBreakpoint();

  if (isMobile) {
    return <MobileLayout />;
  }

  return <DesktopLayout />;
}
```

---

## 9. Troubleshooting

### 9.1 Component Not Found

```bash
# Ensure package is built
pnpm --filter @agenticverdict/ui build

# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 9.2 TypeScript Errors

```bash
# Regenerate types
pnpm typecheck

# Clear TypeScript cache
rm -rf packages/*/dist
pnpm build
```

### 9.3 Theme Not Applying

1. Check that ThemeProvider wraps your app
2. Verify CSS custom properties are set
3. Ensure theme object is valid (use Zod validation)
4. Check browser dev tools for CSS variables

### 9.4 RTL Not Working

1. Ensure DirectionProvider wraps your app
2. Check that `dir="rtl"` is set on document element
3. Verify components use logical properties
4. Test with both LTR and RTL locales

---

## 10. Next Steps

### Learn More

- **Component API**: `/specs/01-ui/00-foundation/contracts/component-api.md`
- **Data Model**: `/specs/01-ui/00-foundation/data-model.md`
- **Research Findings**: `/specs/01-ui/00-foundation/research.md`
- **UI Architecture**: `/docs/architecture/ui/00-overview.md`

### Explore Components

- **Atoms**: Button, Input, Checkbox, Radio, Switch, Badge, Icon, Typography, Link, Separator, Spinner
- **Molecules**: FormField, SearchInput, Card, Dropdown, Select, DatePicker, Tooltip, Popover, Alert, Toast
- **Providers**: ThemeProvider, DirectionProvider
- **Hooks**: useTheme, useDirection, useBreakpoint

### Contribute

1. Read the contributing guidelines (forthcoming)
2. Set up your development environment
3. Pick a good first issue from GitHub
4. Follow the component development checklist
5. Submit a pull request with tests

---

## 11. Reference

### Component Categories

| Category | Components | Description |
|----------|-----------|-------------|
| **Atoms** | Button, Input, Checkbox, Radio, Switch, Badge, Icon, Typography, Link, Separator, Spinner | Basic building blocks |
| **Molecules** | FormField, SearchInput, Card, Dropdown, Select, DatePicker, Tooltip, Popover, Alert, Toast | Simple combinations |
| **Organisms** | DataTable, DashboardCard, Navigation, Sidebar | Complex sections (Phase 2) |
| **Templates** | DashboardLayout, AuthLayout, ReportLayout | Page layouts (Phase 2) |

### Design Token Tiers

| Tier | Description | Example |
|------|-------------|---------|
| **Global** | Brand-agnostic design decisions | `--av-color-blue-500: #228BE6` |
| **Brand** | Tenant-specific overrides | `--brand-color-primary: #FF6B35` |
| **Component** | Composed from global/brand | `--button-primary-bg: var(--brand-color-primary, var(--av-color-blue-500))` |

### Accessibility Standards

| Requirement | Standard |
|-------------|----------|
| Color contrast (text) | 4.5:1 minimum |
| Color contrast (large text) | 3:1 minimum |
| Color contrast (UI components) | 3:1 minimum |
| Touch target size | 44×44px minimum |
| Keyboard navigation | All interactive elements |
| Screen reader support | NVDA, JAWS, VoiceOver |
| WCAG compliance | 2.1 Level AA |

---

**Last Updated**: 2026-04-14
**Maintainers**: AgenticVerdict Architecture Team
**Version**: 1.0.0
