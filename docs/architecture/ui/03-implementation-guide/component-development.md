# Component Development Guide

**Document Version:** 1.0
**Last Updated:** 2026-04-11
**Status:** Active
**Target Audience:** UI Developers, Frontend Engineers

---

## Executive Summary

This guide provides comprehensive patterns, conventions, and best practices for developing components in the AgenticVerdict UI system. Built on Mantine UI v7 with TypeScript strict mode, our component library prioritizes accessibility (WCAG 2.1 AA), internationalization (RTL/LTR), and multi-tenant support while maintaining developer productivity and code quality.

**Key Principles:**

- **Accessibility First**: Every component must support keyboard navigation, screen readers, and high-contrast modes
- **RTL Native**: Components must work seamlessly in both LTR and RTL layouts
- **Type Safety**: Zero `any` types, comprehensive prop interfaces, proper TypeScript patterns
- **Test Coverage**: 70%+ minimum coverage (90%+ for business logic)
- **Performance**: Lazy load components >50KB, optimize renders, avoid prop drilling
- **Documentation**: Every component has Ladle stories with usage examples

---

## Table of Contents

1. [Component Creation Workflow](#1-component-creation-workflow)
2. [Component Best Practices](#2-component-best-practices)
3. [Using Mantine Components](#3-using-mantine-components)
4. [Component Testing](#4-component-testing)
5. [Documentation Requirements](#5-documentation-requirements)
6. [Code Examples](#6-code-examples)

---

## 1. Component Creation Workflow

### 1.1 Scaffolding a New Component

**Step 1: Determine Component Category**

Before creating a component, determine its level in the Atomic Design hierarchy:

- **Atom**: Basic building block (Button, Input, Badge) - wraps Mantine with minimal customization
- **Molecule**: Combination of 2-3 atoms (FormField, SearchBox, Dropdown) - adds business logic
- **Organism**: Complex, domain-specific component (DataTable, InsightCard, ConnectorStatus)

**Step 2: Create Component Directory**

```bash
# From repository root
mkdir -p packages/ui/src/components/{atoms,molecules,organisms}/ComponentName

# Example: Creating a new molecule
mkdir -p packages/ui/src/components/molecules/FormField
```

**Step 3: Create Component Files**

```bash
cd packages/ui/src/components/molecules/FormField

# Create all required files
touch FormField.tsx           # Main component
touch FormField.test.tsx      # Unit tests
touch FormField.stories.tsx   # Ladle stories
touch types.ts                # TypeScript types (if complex)
touch utils.ts                # Helper functions (if needed)
touch index.ts                # Public exports
```

**Step 4: Update Package Index**

```typescript
// packages/ui/src/index.ts
export * from "./components/atoms";
export * from "./components/molecules";
export * from "./components/organisms";
```

### 1.2 File Naming and Organization

**Naming Conventions:**

| Type            | Convention                     | Example                       |
| --------------- | ------------------------------ | ----------------------------- |
| Component Files | PascalCase                     | `Button.tsx`, `DataTable.tsx` |
| Component Names | PascalCase                     | `export function Button()`    |
| Utility Files   | kebab-case                     | `format-currency.ts`, `cn.ts` |
| Hook Files      | camelCase with `use` prefix    | `useTenantTheme.ts`           |
| Test Files      | ComponentName + `.test.tsx`    | `Button.test.tsx`             |
| Story Files     | ComponentName + `.stories.tsx` | `Button.stories.tsx`          |
| Type Files      | `types.ts` or inline           | Component-specific types      |

**Component Directory Structure:**

```typescript
ComponentName/
├── ComponentName.tsx          # Main component implementation
├── ComponentName.test.tsx     # Vitest unit tests
├── ComponentName.stories.tsx  # Ladle documentation stories
├── ComponentName.module.css   # Component-specific styles (optional)
├── types.ts                   # TypeScript types (if complex)
├── utils.ts                   # Helper functions (if needed)
├── hooks.ts                   # Component-specific hooks (if needed)
└── index.ts                   # Public API exports
```

### 1.3 Export Patterns

**Component Exports (index.ts):**

```typescript
// packages/ui/src/components/molecules/FormField/index.ts
export { FormField } from "./FormField";
export type { FormFieldProps, FormFieldSize } from "./types";
```

**Category Index (molecules/index.ts):**

```typescript
// packages/ui/src/components/molecules/index.ts
export * from "./FormField";
export * from "./SearchBox";
export * from "./DataTable";
// ... other molecules
```

**Root Package Index (src/index.ts):**

```typescript
// packages/ui/src/index.ts
export * from "./components/atoms";
export * from "./components/molecules";
export * from "./components/organisms";
export * from "./components/layouts";
export * from "./hooks";
export * from "./utils";
```

**Usage in Applications:**

```typescript
// Recommended: Barrel exports
import { Button, FormField, DataTable } from "@agenticverdict/ui";

// Alternative: Direct imports for bundle optimization
import { Button } from "@agenticverdict/ui/atoms/Button";
```

---

## 2. Component Best Practices

### 2.1 TypeScript Patterns

**Strict Type Safety:**

```typescript
// ✅ Good: Explicit types, no any
export interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  testId?: string;
}

// ❌ Bad: Using any
export interface ButtonProps {
  variant: any; // Never use any
  style?: any; // Use proper CSSProperties type
}
```

**Generic Components:**

```typescript
// Generic select component
export interface SelectProps<T> {
  options: readonly T[];
  value?: T;
  onChange: (value: T) => void;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
}

export function Select<T extends unknown>({
  options,
  value,
  onChange,
  getOptionLabel,
  getOptionValue,
}: SelectProps<T>) {
  // Implementation
}
```

**Type Guards and Discriminated Unions:**

```typescript
// Discriminated union for connector status
export type ConnectorStatus =
  | { status: "connected"; lastSync: Date }
  | { status: "disconnected"; reason?: string }
  | { status: "error"; error: Error };

export function getStatusMessage(status: ConnectorStatus): string {
  switch (status.status) {
    case "connected":
      return `Connected • Last sync ${status.lastSync.toLocaleString()}`;
    case "disconnected":
      return status.reason || "Disconnected";
    case "error":
      return `Error: ${status.error.message}`;
  }
}
```

### 2.2 Props Interface Design

**Component Props Best Practices:**

```typescript
// ✅ Good: Well-structured props interface
export interface CardProps {
  /** Card title - required for accessibility */
  title: string;
  /** Card subtitle - optional additional context */
  subtitle?: string;
  /** Card content - React node for flexibility */
  children: React.ReactNode;
  /** Visual variant */
  variant?: "default" | "bordered" | "elevated";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Test ID for QA */
  testId?: string;
  /** Click handler - makes card interactive */
  onClick?: () => void;
  /** Custom CSS class */
  className?: string;
}

// ❌ Bad: Poorly organized props
export interface CardProps {
  title?: any; // Unclear type
  text: string; // Redundant with children
  size?: string; // Should be union of specific values
  handleClick: () => void; // Inconsistent naming (use onClick)
}
```

**Props Composition Pattern:**

```typescript
// Split complex props into logical groups
export interface FormFieldProps {
  // Label props
  label?: string;
  labelFor?: string;
  required?: boolean;

  // Input props
  input: React.ComponentProps<"input">;

  // Error handling
  error?: string;
  hint?: string;

  // Layout
  orientation?: "horizontal" | "vertical";

  // Testing
  testId?: string;
}
```

**ForwardRef Pattern:**

```typescript
import { forwardRef } from 'react';

export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonStyles, className)}
        data-variant={variant}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button'; // Important for DevTools
```

### 2.3 Accessibility Requirements

**WCAG 2.1 AA Compliance Checklist:**

Every component must satisfy:

1. **Keyboard Navigation**: All interactive elements accessible via keyboard
2. **Focus Management**: Visible focus indicators, logical tab order
3. **Screen Reader Support**: Proper ARIA labels, roles, and live regions
4. **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
5. **Touch Targets**: Minimum 44×44 CSS pixels
6. **Semantic HTML**: Use appropriate HTML elements

**Accessible Component Pattern:**

```typescript
export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  testId?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      loading = false,
      loadingText = 'Loading...',
      icon,
      children,
      disabled,
      testId,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        data-testid={testId}
        {...props}
      >
        {loading && (
          <span aria-hidden="true">
            <Spinner size="sm" />
          </span>
        )}
        {loading && <span className="sr-only">{loadingText}</span>}
        {!loading && icon && <span aria-hidden="true">{icon}</span>}
        <span>{children}</span>
      </button>
    );
  }
);
```

**Screen Reader Only Text:**

```typescript
// Utility for screen reader only content
export function SrOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

// CSS for sr-only
// .sr-only {
//   position: absolute;
//   width: 1px;
//   height: 1px;
//   padding: 0;
//   margin: -1px;
//   overflow: hidden;
//   clip: rect(0, 0, 0, 0);
//   white-space: nowrap;
//   border-width: 0;
// }
```

**Focus Management:**

```typescript
import { useFocus } from './hooks/useFocus';

export function Modal({ onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus modal on mount
    if (modalRef.current) {
      modalRef.current.focus();
    }

    // Trap focus within modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        trapFocus(modalRef.current!, e);
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      {children}
    </div>
  );
}
```

### 2.4 RTL Considerations

**Logical Properties Pattern:**

```typescript
// ✅ Good: Use logical properties
export const cardStyles = {
  paddingInline: "1rem", // Works for both LTR and RTL
  paddingBlock: "0.75rem",
  marginInlineStart: "0.5rem", // Instead of marginLeft
  borderInlineStart: "2px solid blue",
};

// ❌ Bad: Physical properties
export const cardStyles = {
  paddingLeft: "1rem", // LTR only
  paddingRight: "1rem",
  marginLeft: "0.5rem",
  borderLeft: "2px solid blue",
};
```

**Direction-Aware Components:**

```typescript
import { useDirection } from '../../hooks/useDirection';

export function Breadcrumb({ items }: BreadcrumbProps) {
  const direction = useDirection(); // 'ltr' | 'rtl'

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            <Link href={item.href}>{item.label}</Link>
            {index < items.length - 1 && (
              <span
                aria-hidden="true"
                className={direction === 'rtl' ? 'rotate-180' : ''}
              >
                →
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

**Icon Mirroring:**

```typescript
// Icons that should flip in RTL
const RTL_FLIPPED_ICONS = ['arrow-left', 'arrow-right', 'chevron-left', 'chevron-right'];

export function Icon({ name, size = 'md' }: IconProps) {
  const direction = useDirection();
  const shouldFlip = direction === 'rtl' && RTL_FLIPPED_ICONS.includes(name);

  return (
    <svg
      className={shouldFlip ? 'rtl:scale-x-[-1]' : ''}
      width={sizeMap[size]}
      height={sizeMap[size]}
      aria-hidden="true"
    >
      <use href={`#icon-${name}`} />
    </svg>
  );
}
```

### 2.5 Performance Best Practices

**Code Splitting:**

```typescript
// Lazy load heavy components
const HeavyChart = lazy(() => import('./HeavyChart'));

export function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart data={data} />
    </Suspense>
  );
}
```

**Memoization:**

```typescript
import { memo, useMemo } from 'react';

// Memo expensive components
export const DataTable = memo(function DataTable({ data, columns }: DataTableProps) {
  // Memo expensive calculations
  const sortedData = useMemo(() => {
    return data.sort((a, b) => a.id.localeCompare(b.id));
  }, [data]);

  // Memo column definitions
  const columnDefs = useMemo(() => {
    return columns.map(col => ({
      ...col,
      header: col.header,
      cell: col.cell,
    }));
  }, [columns]);

  return <table>{/* render table */}</table>;
});
```

**Virtual Scrolling for Large Lists:**

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimated row height
    overscan: 5, // Render 5 extra items
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index].content}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 3. Using Mantine Components

### 3.1 When to Use vs. Wrap vs. Build

**Decision Tree:**

```
Need a component?
│
├─ Is it in Mantine core?
│  ├─ Yes → Use directly (atoms)
│  └─ No → Continue
│
├─ Is it in Mantine extensions/hooks?
│  ├─ Yes → Use as base for wrapping
│  └─ No → Continue
│
├─ Can it be composed from existing atoms?
│  ├─ Yes → Build molecule/organism
│  └─ No → Build custom component
```

**Use Mantine Directly:**

```typescript
// Use Mantine components directly for atoms
import { Button, TextInput, Stack } from '@mantine/core';

export function LoginForm() {
  return (
    <Stack gap="md">
      <TextInput label="Email" type="email" required />
      <TextInput label="Password" type="password" required />
      <Button type="submit">Login</Button>
    </Stack>
  );
}
```

**Wrap Mantine Components:**

```typescript
// Wrap when adding AgenticVerdict-specific behavior
import { TextInput as MantineTextInput } from '@mantine/core';
import { forwardRef } from 'react';

export interface TextInputProps extends React.ComponentPropsWithoutRef<typeof MantineTextInput> {
  variant?: 'default' | 'floating' | 'search';
  testId?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ variant = 'default', testId, ...props }, ref) => {
    return (
      <MantineTextInput
        ref={ref}
        variant={variant}
        data-testid={testId}
        {...props}
      />
    );
  }
);

TextInput.displayName = 'TextInput';
```

**Build Custom Components:**

```typescript
// Build custom when Mantine doesn't meet requirements
export function ConnectorStatusCard({ connector, status }: ConnectorStatusCardProps) {
  return (
    <Card className={cn(styles.card, styles[status])}>
      <div className="flex items-start gap-4">
        <Avatar src={connector.logo} alt={connector.name} size="lg" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{connector.name}</h3>
          <p className="text-sm text-gray-600">{connector.description}</p>
          <StatusBadge status={status} />
        </div>
        <ConnectorActions connector={connector} />
      </div>
    </Card>
  );
}
```

### 3.2 Theming Mantine Components

**Theme Extension:**

```typescript
// packages/ui/src/theme.ts
import { MantineProvider, MantineTheme } from "@mantine/core";

export const agenticVerdictTheme: MantineTheme = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontFamilyMonospace: "JetBrains Mono, monospace",
  primaryColor: "blue",
  colors: {
    brand: {
      0: "#E3F2FD",
      50: "#BBDEFB",
      // ... full color scale
      900: "#0D47A1",
      950: "#0A3D8E",
    },
  },
  components: {
    Button: {
      styles: (theme, params) => ({
        root: {
          // Custom button styles
          fontWeight: 600,
          borderRadius: theme.radius.md,
        },
      }),
    },
    Card: {
      styles: (theme) => ({
        root: {
          // Custom card styles
          boxShadow: theme.shadows.sm,
          "&:hover": {
            boxShadow: theme.shadows.md,
          },
        },
      }),
    },
  },
};
```

**Runtime Theme Switching:**

```typescript
import { useMantineColorScheme, useMantineTheme } from '@mantine/core';

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <button
      onClick={() => toggleColorScheme()}
      aria-label={`Switch to ${colorScheme === 'light' ? 'dark' : 'light'} mode`}
    >
      {colorScheme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

### 3.3 Extending Mantine Components

**Composition Pattern:**

```typescript
import { Group, ActionIcon, Tooltip } from '@mantine/core';
import { IconDots, IconPencil, IconTrash } from '@tabler/icons-react';

export function ActionMenu({ onEdit, onDelete }: ActionMenuProps) {
  return (
    <Group gap="xs">
      <Tooltip label="Edit">
        <ActionIcon
          onClick={onEdit}
          aria-label="Edit item"
          variant="subtle"
        >
          <IconDots size={16} />
        </ActionIcon>
      </Tooltip>

      <Tooltip label="Delete">
        <ActionIcon
          onClick={onDelete}
          aria-label="Delete item"
          color="red"
          variant="subtle"
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
}
```

**Custom Hooks with Mantine:**

```typescript
import { useDisclosure } from '@mantine/hooks';
import { Modal, Button } from '@mantine/core';

export function useConfirmModal() {
  const [opened, { open, close }] = useDisclosure(false);
  const [config, setConfig] = useState<ConfirmConfig>({});

  const confirm = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig({ title, message, onConfirm: () => resolve(true) });
      open();
    });
  };

  const ConfirmModal = () => (
    <Modal opened={opened} onClose={close} title={config.title}>
      <p>{config.message}</p>
      <Group gap="sm">
        <Button onClick={() => { config.onConfirm?.(); close(); }}>
          Confirm
        </Button>
        <Button variant="default" onClick={close}>
          Cancel
        </Button>
      </Group>
    </Modal>
  );

  return { confirm, ConfirmModal };
}
```

---

## 4. Component Testing

### 4.1 Unit Testing with Vitest

**Basic Component Test:**

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when loading', () => {
    render(<Button loading>Click me</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});
```

**Testing Accessibility:**

```typescript
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { FormField } from './FormField';

expect.extend(toHaveNoViolations);

describe('FormField Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(
      <FormField label="Email" required error="Invalid email">
        <input type="email" aria-invalid="true" aria-describedby="email-error" />
      </FormField>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('associates label with input', () => {
    render(
      <FormField label="Email" required>
        <input id="email" type="email" />
      </FormField>
    );

    const input = screen.getByLabelText(/email/i);
    expect(input).toBeInTheDocument();
  });
});
```

**Testing RTL Support:**

```typescript
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { Breadcrumb } from './Breadcrumb';

describe('Breadcrumb RTL', () => {
  const renderWithRTL = (component: React.ReactElement, locale: string) => {
    return render(
      <I18nextProvider i18n={i18n}>
        <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          {component}
        </div>
      </I18nextProvider>
    );
  };

  it('renders correctly in LTR', () => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Analytics', href: '/analytics' },
    ];

    renderWithRTL(<Breadcrumb items={items} />, 'en');

    const separator = screen.getByText('→');
    expect(separator).toHaveClass('ltr-separator');
  });

  it('renders correctly in RTL', () => {
    const items = [
      { label: 'الرئيسية', href: '/' },
      { label: 'التحليلات', href: '/analytics' },
    ];

    renderWithRTL(<Breadcrumb items={items} />, 'ar');

    const separator = screen.getByText('→');
    expect(separator).toHaveClass('rtl-separator');
  });
});
```

### 4.2 Accessibility Testing with jest-axe

**Setup jest-axe:**

```typescript
// vitest.setup.ts
import { expect } from "vitest";
import * as jestAxe from "jest-axe";

expect.extend(jestAxe);
```

**Accessibility Test Suite:**

```typescript
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { DataTable } from './DataTable';

describe('DataTable Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const data = [
      { id: 1, name: 'Item 1', status: 'Active' },
      { id: 2, name: 'Item 2', status: 'Inactive' },
    ];

    const { container } = render(
      <DataTable
        data={data}
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'status', label: 'Status' },
        ]}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper table semantics', () => {
    render(
      <table>
        <caption>User data</caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>John Doe</td>
            <td>Active</td>
          </tr>
        </tbody>
      </table>
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
  });
});
```

### 4.3 Visual Testing with Ladle

**Ladle Story Structure:**

```typescript
// Button.stories.tsx
import type { Story } from '@ladle/react';
import { Button } from './Button';

export default {
  title: 'Components/Button',
};

export const Primary: Story<ButtonProps> = (args) => <Button {...args} />;
Primary.args = {
  children: 'Primary Button',
  variant: 'primary',
};

export const Secondary: Story<ButtonProps> = (args) => <Button {...args} />;
Secondary.args = {
  children: 'Secondary Button',
  variant: 'secondary',
};

export const Loading: Story<ButtonProps> = (args) => <Button {...args} />;
Loading.args = {
  children: 'Loading',
  loading: true,
};

export const WithIcon: Story<ButtonProps> = (args) => (
  <Button {...args}>
    <Icon name="save" size="sm" />
    Save Changes
  </Button>
);
WithIcon.args = {
  variant: 'primary',
};
```

**Accessibility Story:**

```typescript
export const Accessibility: Story = () => (
  <div>
    <h2>Keyboard Navigation</h2>
    <Button>Tab to me</Button>

    <h2>Screen Reader Support</h2>
    <Button loading>
      <Spinner size="sm" aria-hidden="true" />
      <span className="sr-only">Loading...</span>
      Processing
    </Button>

    <h2>Focus Indicators</h2>
    <Button>Focus me</Button>
  </div>
);
```

### 4.4 Test Organization

**Test File Structure:**

```typescript
// ComponentName.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ComponentName } from "./ComponentName";

describe("ComponentName", () => {
  // Group related tests
  describe("Rendering", () => {
    it("renders correctly with default props", () => {
      // Test implementation
    });

    it("renders children correctly", () => {
      // Test implementation
    });
  });

  describe("User Interactions", () => {
    it("handles click events", () => {
      // Test implementation
    });

    it("handles keyboard events", () => {
      // Test implementation
    });
  });

  describe("Accessibility", () => {
    it("has no accessibility violations", () => {
      // Test implementation
    });

    it("supports keyboard navigation", () => {
      // Test implementation
    });
  });

  describe("Edge Cases", () => {
    it("handles empty state", () => {
      // Test implementation
    });

    it("handles loading state", () => {
      // Test implementation
    });
  });
});
```

**Test Utilities:**

```typescript
// packages/ui/src/test-utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MantineProvider } from '@mantine/core';
import i18n from './i18n';
import { agenticVerdictTheme } from './theme';

interface AllProvidersProps {
  children: React.ReactNode;
  locale?: string;
}

function AllProviders({ children, locale = 'en' }: AllProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <MantineProvider theme={agenticVerdictTheme}>
        <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          {children}
        </div>
      </MantineProvider>
    </I18nextProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { locale?: string }
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders locale={options?.locale}>{children}</AllProviders>
    ),
    ...options,
  });
}

// Re-export testing library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
```

---

## 5. Documentation Requirements

### 5.1 Ladle Story Format

**Complete Story Template:**

```typescript
// ComponentName.stories.tsx
import type { Story, StoryMeta } from '@ladle/react';
import { ComponentName } from './ComponentName';

/**
 * Meta information about the component
 */
export default {
  title: 'Molecules/ComponentName',
  description: 'Brief description of what this component does',
  meta: {
    componentName: 'ComponentName',
    category: 'molecules',
    tags: ['accessible', 'rtl-support'],
  },
} satisfies StoryMeta<ComponentNameProps>;

/**
 * Default story with minimal props
 */
export const Default: Story<ComponentNameProps> = (args) => (
  <ComponentName {...args} />
);
Default.args = {
  // Minimal required props
  prop: 'value',
};

/**
 * Common usage examples
 */
export const CommonUsage: Story<ComponentNameProps> = (args) => (
  <ComponentName {...args} />
);
CommonUsage.args = {
  prop: 'value',
  anotherProp: true,
};
CommonUsage.description = 'Most common use case for this component';

/**
 * Accessibility examples
 */
export const Accessibility: Story<ComponentNameProps> = (args) => (
  <div>
    <h3>Keyboard Navigation</h3>
    <ComponentName {...args} />

    <h3>Screen Reader Support</h3>
    <ComponentName {...args} aria-label="Accessible label" />
  </div>
);

/**
 * RTL examples
 */
export const RTL: Story<ComponentNameProps> = (args) => (
  <div dir="rtl">
    <ComponentName {...args} />
  </div>
);
RTL.description = 'Component rendered in RTL layout';
```

### 5.2 Props Documentation

**JSDoc Comments:**

````typescript
/**
 * Button component with multiple variants and sizes.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 *
 * @remarks
 * - Supports loading state with spinner
 * - Fully accessible with keyboard navigation
 * - Works in both LTR and RTL layouts
 *
 * @see {@link https://mantine.dev/core/button/|Mantine Button docs} for base component
 */
export interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  /**
   * Visual style variant of the button
   * @default 'primary'
   */
  variant?: "primary" | "secondary" | "ghost" | "danger";

  /**
   * Size of the button
   * @default 'md'
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";

  /**
   * Shows loading state with spinner
   * Disables button interactions
   * @default false
   */
  loading?: boolean;

  /**
   * Text to display while loading (screen reader only)
   * @default 'Loading...'
   */
  loadingText?: string;

  /**
   * Icon to display before the button text
   */
  icon?: React.ReactNode;

  /**
   * Test ID for QA automation
   */
  testId?: string;
}
````

### 5.3 Usage Examples

**Storybook-Style Examples:**

```typescript
export const Examples: Story = () => (
  <div>
    <h2>Basic Usage</h2>
    <Button>Click me</Button>

    <h2>With Icon</h2>
    <Button icon={<Icon name="save" />}>Save</Button>

    <h2>Loading State</h2>
    <Button loading>Loading</Button>

    <h2>All Variants</h2>
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="ghost">Ghost</Button>
    <Button variant="danger">Danger</Button>

    <h2>All Sizes</h2>
    <Button size="xs">Extra Small</Button>
    <Button size="sm">Small</Button>
    <Button size="md">Medium</Button>
    <Button size="lg">Large</Button>
    <Button size="xl">Extra Large</Button>
  </div>
);
```

### 5.4 Accessibility Notes

**Documenting Accessibility Features:**

```typescript
export const AccessibilityNotes: Story = () => (
  <div>
    <h2>Accessibility Features</h2>
    <ul>
      <li>✅ Keyboard navigation: Use Tab to focus, Enter/Space to activate</li>
      <li>✅ Screen reader support: Proper ARIA labels and roles</li>
      <li>✅ Focus indicators: Visible focus ring</li>
      <li>✅ Color contrast: WCAG 2.1 AA compliant</li>
      <li>✅ Touch targets: Minimum 44×44 pixels</li>
    </ul>

    <h2>Keyboard Interactions</h2>
    <table>
      <thead>
        <tr>
          <th>Key</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><kbd>Tab</kbd></td>
          <td>Focus button</td>
        </tr>
        <tr>
          <td><kbd>Enter</kbd> / <kbd>Space</kbd></td>
          <td>Activate button</td>
        </tr>
      </tbody>
    </table>

    <h2>Screen Reader</h2>
    <Button aria-label="Close dialog">
      <Icon name="close" aria-hidden="true" />
    </Button>

    <h2>Focus Management</h2>
    <Button>Focus me to see focus indicator</Button>
  </div>
);
```

---

## 6. Code Examples

### 6.1 Component Template

````typescript
// ComponentName.tsx
import { forwardRef } from 'react';
import { cn } from '../../utils/cn';
import type { ComponentNameProps } from './types';

/**
 * ComponentName - Brief description
 *
 * @example
 * ```tsx
 * <ComponentName prop="value">
 *   Children content
 * </ComponentName>
 * ```
 */
export const ComponentName = forwardRef<HTMLDivElement, ComponentNameProps>(
  (
    {
      prop,
      anotherProp,
      children,
      className,
      testId,
      ...props
    },
    ref
  ) => {
    // Component logic here

    return (
      <div
        ref={ref}
        className={cn(styles.base, className)}
        data-testid={testId}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ComponentName.displayName = 'ComponentName';

// ComponentName.module.css
.base {
  /* Component styles */
}
````

### 6.2 Wrapped Mantine Component

```typescript
// Button.tsx
import { Button as MantineButton } from '@mantine/core';
import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ComponentPropsWithoutRef<typeof MantineButton> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  testId?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      loading = false,
      loadingText = 'Loading...',
      icon,
      children,
      disabled,
      testId,
      className,
      ...props
    },
    ref
  ) => {
    const mantineVariant = variant === 'primary' ? 'filled' : variant;

    return (
      <MantineButton
        ref={ref}
        variant={mantineVariant}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        data-testid={testId}
        leftSection={loading ? <Spinner size="xs" /> : icon}
        className={cn(className)}
        {...props}
      >
        {loading && <span className="sr-only">{loadingText}</span>}
        {children}
      </MantineButton>
    );
  }
);

Button.displayName = 'Button';
```

### 6.3 Custom Component

```typescript
// ConnectorStatusCard.tsx
import { useState } from 'react';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';
import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { Icon } from '../atoms/Icon';
import { cn } from '../../utils/cn';

export interface Connector {
  id: string;
  name: string;
  description: string;
  logo?: string;
  type: 'meta' | 'ga4' | 'gsc' | 'gbp' | 'tiktok';
}

export type ConnectorStatus =
  | { status: 'connected'; lastSync: Date }
  | { status: 'disconnected'; reason?: string }
  | { status: 'error'; error: Error };

export interface ConnectorStatusCardProps {
  connector: Connector;
  status: ConnectorStatus;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onRetry?: () => void;
  testId?: string;
}

export function ConnectorStatusCard({
  connector,
  status,
  onConnect,
  onDisconnect,
  onRetry,
  testId,
}: ConnectorStatusCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusBadge = () => {
    switch (status.status) {
      case 'connected':
        return <Badge variant="success">Connected</Badge>;
      case 'disconnected':
        return <Badge variant="neutral">Disconnected</Badge>;
      case 'error':
        return <Badge variant="danger">Error</Badge>;
    }
  };

  const getStatusMessage = () => {
    switch (status.status) {
      case 'connected':
        return `Last sync ${status.lastSync.toLocaleString()}`;
      case 'disconnected':
        return status.reason || 'Not connected';
      case 'error':
        return status.error.message;
    }
  };

  return (
    <Card
      className={cn(
        'transition-shadow hover:shadow-md',
        isHovered && 'ring-2 ring-blue-500'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={testId}
    >
      <div className="flex items-start gap-4">
        <Avatar
          src={connector.logo}
          alt={connector.name}
          size="lg"
          fallback={connector.name[0]}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold truncate">{connector.name}</h3>
            {getStatusBadge()}
          </div>

          <p className="text-sm text-gray-600 mt-1">{connector.description}</p>

          <p className="text-xs text-gray-500 mt-2">{getStatusMessage()}</p>
        </div>

        <div className="flex gap-2">
          {status.status === 'disconnected' && onConnect && (
            <Button
              variant="primary"
              size="sm"
              onClick={onConnect}
              aria-label={`Connect ${connector.name}`}
            >
              Connect
            </Button>
          )}

          {status.status === 'connected' && onDisconnect && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDisconnect}
              aria-label={`Disconnect ${connector.name}`}
            >
              Disconnect
            </Button>
          )}

          {status.status === 'error' && onRetry && (
            <Button
              variant="primary"
              size="sm"
              onClick={onRetry}
              aria-label={`Retry connection to ${connector.name}`}
            >
              <Icon name="refresh" size="sm" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
```

### 6.4 Tenant-Aware Component

```typescript
// TenantCard.tsx
import { useTenantConfig } from '../../hooks/useTenantConfig';
import { useDirection } from '../../hooks/useDirection';
import { Card } from '../atoms/Card';
import { Badge } from '../atoms/Badge';

export interface TenantCardProps {
  tenantId: string;
  tenantName: string;
  status: 'active' | 'suspended' | 'trial';
  testId?: string;
}

export function TenantCard({
  tenantId,
  tenantName,
  status,
  testId,
}: TenantCardProps) {
  const { config, isLoading } = useTenantConfig(tenantId);
  const direction = useDirection();

  if (isLoading) {
    return <Card.Skeleton testId={testId} />;
  }

  return (
    <Card
      className={cn(
        'p-4',
        direction === 'rtl' && 'rtl-card'
      )}
      data-testid={testId}
    >
      <div className="flex items-start gap-4">
        {/* Use tenant logo from config */}
        {config?.branding?.logo && (
          <img
            src={config.branding.logo}
            alt={tenantName}
            className="w-12 h-12 object-contain"
          />
        )}

        <div className="flex-1">
          <h3 className="text-lg font-semibold">{tenantName}</h3>

          {/* Use tenant-specific currency */}
          {config?.localization?.currency && (
            <p className="text-sm text-gray-600">
              Currency: {config.localization.currency}
            </p>
          )}

          {/* Use tenant-specific language */}
          {config?.localization?.language && (
            <Badge variant="outline">
              {config.localization.language.toUpperCase()}
            </Badge>
          )}
        </div>

        <Badge variant={status === 'active' ? 'success' : 'warning'}>
          {status}
        </Badge>
      </div>
    </Card>
  );
}
```

---

## 7. Quick Reference

### 7.1 Component Development Checklist

Before marking a component as complete:

- [ ] Component follows Atomic Design hierarchy (atom/molecule/organism)
- [ ] All files created (component, test, story, styles, types, utils)
- [ ] Proper TypeScript types (no `any`, comprehensive interfaces)
- [ ] Accessibility requirements met (keyboard, screen reader, focus)
- [ ] RTL support tested (logical properties, direction awareness)
- [ ] Unit tests written (70%+ coverage, 90%+ for business logic)
- [ ] Ladle stories documented (usage examples, props, accessibility)
- [ ] Performance optimized (memo, lazy loading, virtual scrolling)
- [ ] Export patterns followed (barrel exports, public API)
- [ ] Code review approved

### 7.2 Common Patterns

| Pattern           | When to Use                       | Example                        |
| ----------------- | --------------------------------- | ------------------------------ |
| **forwardRef**    | Component needs ref from parent   | Button, Input                  |
| **useMemo**       | Expensive calculations            | Sorted data, filtered lists    |
| **useCallback**   | Function props passed to children | Event handlers                 |
| **memo**          | Prevent unnecessary re-renders    | List items, cards              |
| **lazy**          | Components >50KB                  | Charts, heavy modals           |
| **ErrorBoundary** | Component tree error handling     | Page layouts, async components |

### 7.3 Accessibility Checklist

- [ ] Semantic HTML (button, nav, main, article)
- [ ] ARIA labels (aria-label, aria-describedby)
- [ ] Keyboard navigation (Tab, Enter, Space, Escape)
- [ ] Focus indicators (visible focus ring)
- [ ] Screen reader support (roles, live regions)
- [ ] Color contrast (4.5:1 for text, 3:1 for large)
- [ ] Touch targets (44×44 pixels minimum)
- [ ] Form labels (associated labels, required indicators)
- [ ] Error messages (aria-invalid, aria-describedby)
- [ ] Loading states (aria-busy, progress indicators)

### 7.4 RTL Checklist

- [ ] Logical properties (margin-inline, padding-inline)
- [ ] Direction-aware icons (arrows flip in RTL)
- [ ] Text alignment (text-align: start)
- [ ] Layout testing (both LTR and RTL)
- [ ] Font support (Arabic font for RTL)
- [ ] Number formatting (locale-specific)
- [ ] Date formatting (locale-specific)
- [ ] URL handling (RTL-aware paths)

---

## 8. Resources

### 8.1 Internal Documentation

- [Component Library Specification](/docs/architecture/ui/02-design-system-specification/component-library.md)
- [Accessibility Standards](/docs/architecture/ui/01-research-findings/accessibility-standards.md)
- [Testing Strategy](/docs/02-planning-and-methodology/testing-strategy.md)
- [Technical Architecture](/docs/architecture/business/technical-architecture.md)

### 8.2 External Resources

- [Mantine Documentation](https://mantine.dev/)
- [Ladle Documentation](https://ladle.dev/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Testing Library](https://testing-library.com/react)
- [Vitest Documentation](https://vitest.dev/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)

### 8.3 Community

- Mantine Discord: https://discord.gg/TuZwraJqKp
- Ladle Discord: https://discord.gg/pWNz2KAwGv
- Testing Library Slack: http://testing-library.slack.com/

---

**Document Status:**

- **Version:** 1.0
- **Last Updated:** 2026-04-11
- **Status:** Active
- **Next Review:** After Phase 2 completion
- **Maintainer:** UI Development Team

**Change Log:**

- **2026-04-11:** Initial version created with comprehensive component development patterns
