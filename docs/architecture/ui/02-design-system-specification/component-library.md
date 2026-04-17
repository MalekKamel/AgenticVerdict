# Component Library Specification

**Document Version:** 1.0  
**Date:** 2026-04-11  
**Status:** Active Specification  
**Package:** `@agenticverdict/ui`

---

## Executive Summary

This specification defines the component library architecture for AgenticVerdict's UI system, built on Mantine UI v9 with TanStack Start and TypeScript. The library follows Atomic Design principles with ~70 components organized into atoms (primitives), molecules (composed components), and organisms (domain-specific components). All components support multi-tenancy, RTL/LTR layouts, accessibility (WCAG 2.1 AA), and comprehensive testing coverage.

**Key Decisions:**

- **Mantine v9** as the base component library (30+ components used directly)
- **Radix UI** augmentations for accessibility gaps (dialog, popover, tooltip)
- **Atomic Design** for component organization and hierarchy
- **Ladle** for component documentation (lighter than Storybook, works with TanStack Start)
- **Strict TypeScript** with zero `any` types and comprehensive prop interfaces

---

## Table of Contents

1. [Component Organization](#1-component-organization)
2. [Component Categories](#2-component-categories)
3. [Component API Standards](#3-component-api-standards)
4. [Component Development Guidelines](#4-component-development-guidelines)
5. [Mantine Integration Strategy](#5-mantine-integration-strategy)
6. [Code Examples](#6-code-examples)
7. [Component Migration Path](#7-component-migration-path)

---

## 1. Component Organization

### 1.1 Atomic Design Hierarchy

The component library follows the Atomic Design methodology with clear separation of concerns:

```
packages/ui/src/
├── atoms/                    # Basic building blocks (30 components)
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   ├── Button.stories.tsx
│   │   └── index.ts
│   ├── Input/
│   ├── Label/
│   ├── Badge/
│   ├── Avatar/
│   ├── Icon/
│   └── ...
├── molecules/                # Composed atoms (40 components)
│   ├── FormField/
│   │   ├── FormField.tsx
│   │   ├── FormField.test.tsx
│   │   ├── FormField.stories.tsx
│   │   └── index.ts
│   ├── Card/
│   ├── DataTable/
│   ├── SearchBox/
│   ├── Dropdown/
│   └── ...
├── organisms/                # Domain-specific components
│   ├── insights/
│   │   ├── InsightCard/
│   │   ├── InsightWizard/
│   │   └── MetricSelector/
│   ├── connectors/
│   │   ├── ConnectorStatusCard/
│   │   ├── OAuthButton/
│   │   └── HealthIndicator/
│   └── reports/
│       ├── ReportViewer/
│       └── ExportButton/
├── layouts/                  # Layout templates
│   ├── DashboardLayout/
│   ├── AuthLayout/
│   └── ReportLayout/
├── hooks/                    # Shared React hooks
│   ├── useTenantTheme.ts
│   ├── useDirection.ts
│   └── useBreakpoint.ts
├── utils/                    # Utilities
│   ├── cn.ts                 # className merger
│   ├── test-id.ts            # test ID generator
│   └── accessibility.ts      # a11y helpers
└── index.ts                  # Barrel exports
```

### 1.2 File Structure and Naming Conventions

**Component Directory Structure:**

```typescript
// Each component follows this structure
components/
├── ComponentName/
│   ├── ComponentName.tsx          # Main component
│   ├── ComponentName.test.tsx     # Vitest tests
│   ├── ComponentName.stories.tsx  # Ladle stories
│   ├── ComponentName.module.css   # Component styles (if needed)
│   ├── types.ts                   # TypeScript types (if complex)
│   ├── utils.ts                   # Component utilities (if needed)
│   └── index.ts                   # Public exports
```

**Naming Conventions:**

| Type                | Convention                     | Examples                               |
| ------------------- | ------------------------------ | -------------------------------------- |
| **Component Files** | PascalCase                     | `Button.tsx`, `DataTable.tsx`          |
| **Component Names** | PascalCase                     | `export function Button()`             |
| **Utility Files**   | kebab-case                     | `format-currency.ts`, `cn.ts`          |
| **Hook Files**      | camelCase with `use` prefix    | `useTenantTheme.ts`, `useDirection.ts` |
| **Test Files**      | ComponentName + `.test.tsx`    | `Button.test.tsx`                      |
| **Story Files**     | ComponentName + `.stories.tsx` | `Button.stories.tsx`                   |
| **Type Files**      | `types.ts` or inline           | Component types                        |

**Export Patterns:**

```typescript
// packages/ui/src/atoms/Button/index.ts
export { Button } from "./Button";
export type { ButtonProps, ButtonVariant } from "./Button";

// packages/ui/src/atoms/index.ts
export * from "./Button";
export * from "./Input";
export * from "./Label";
// ... other atoms

// packages/ui/src/index.ts (barrel exports)
export * from "./atoms";
export * from "./molecules";
export * from "./organisms";
export * from "./layouts";
export * from "./hooks";
export * from "./utils";
```

### 1.3 Barrel Export Patterns

**Recommended: Barrel Exports for Developer Experience**

```typescript
// Usage in apps/frontend
import { Button, Input, Card, DataTable } from "@agenticverdict/ui";

// Tree-shaking is preserved with ES modules
// package.json: "type": "module"
```

**Alternative: Direct Imports for Bundle Optimization**

```typescript
// For bundle-critical applications
import { Button } from "@agenticverdict/ui/atoms/Button";
import { Card } from "@agenticverdict/ui/molecules/Card";
```

**Path Aliases (Recommended for Development):**

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@ui/*": ["packages/ui/src/*"],
      "@ui/components/*": ["packages/ui/src/components/*"],
      "@ui/atoms": ["packages/ui/src/components/atoms"],
      "@ui/molecules": ["packages/ui/src/components/molecules"],
      "@ui/organisms": ["packages/ui/src/components/organisms"]
    }
  }
}
```

---

## 2. Component Categories

### 2.1 Atoms (30 Components)

Basic building blocks that cannot be broken down further. These are primarily wrappers around Mantine components with AgenticVerdict-specific styling and behavior.

| Component      | Mantine Base        | Customization                               | Status  |
| -------------- | ------------------- | ------------------------------------------- | ------- |
| **Button**     | `Button`            | Variants: primary, secondary, ghost, danger | ✅ Core |
| **Input**      | `TextInput`         | Floating labels, RTL support                | ✅ Core |
| **Textarea**   | `Textarea`          | Auto-resize, character count                | ✅ Core |
| **Select**     | `Select`            | Async loading, virtualization               | ✅ Core |
| **Checkbox**   | `Checkbox`          | Custom styling, indeterminate state         | ✅ Core |
| **Radio**      | `Radio`             | Custom styling, card options                | ✅ Core |
| **Switch**     | `Switch`            | Custom styling, sizes                       | ✅ Core |
| **Label**      | `Text` (component)  | Form label with required indicator          | ✅ Core |
| **Badge**      | `Badge`             | Status variants, dot indicator              | ✅ Core |
| **Avatar**     | `Avatar`            | Fallback initials, sizes                    | ✅ Core |
| **Icon**       | Mantine icons       | Icon wrapper with size consistency          | ✅ Core |
| **Tooltip**    | `Tooltip` (Mantine) | Position variants, delay                    | ✅ Core |
| **Progress**   | `Progress`          | Variants: linear, circular                  | ✅ Core |
| **Spinner**    | `Loader`            | Sizes, colors                               | ✅ Core |
| **Divider**    | `Divider`           | Vertical/horizontal, variants               | ✅ Core |
| **Link**       | `Anchor`            | External link icon, variants                | ✅ Core |
| **Text**       | `Text`              | Semantic variants (h1-h6, p, span)          | ✅ Core |
| **Code**       | `Code`              | Syntax highlighting, inline/block           | ✅ Core |
| **Alert**      | `Alert`             | Severity variants, icons                    | ✅ Core |
| **Card**       | `Paper`             | Base card component                         | ✅ Core |
| **Container**  | `Container`         | Max-width variants                          | ✅ Core |
| **Stack**      | `Stack`             | Spacing variants                            | ✅ Core |
| **Group**      | `Group`             | Horizontal spacing                          | ✅ Core |
| **Grid**       | `SimpleGrid`        | Responsive columns                          | ✅ Core |
| **Image**      | `Image`             | Lazy loading, placeholder                   | ✅ Core |
| **Chip**       | `Chip`              | Multi-select, filtering                     | ✅ Core |
| **Slider**     | `Slider`            | Range, marks, labels                        | ✅ Core |
| **DatePicker** | `DatePicker`        | Single/range, timezone support              | ✅ Core |
| **TimePicker** | `TimeInput`         | 12/24h formats                              | ✅ Core |
| **FileInput**  | `FileInput`         | Drag-drop, previews                         | ✅ Core |

**Atom Component Implementation Pattern:**

```typescript
// packages/ui/src/components/atoms/Button/Button.tsx
import { Button as MantineButton } from '@mantine/core';
import { forwardRef } from 'react';

export interface ButtonProps extends React.ComponentPropsWithoutRef<typeof MantineButton> {
  /** Variant determines visual style */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Test ID for QA */
  testId?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', testId, className, ...props }, ref) => {
    // Map AgenticVerdict variants to Mantine variants
    const mantineVariant = variant === 'primary' ? 'filled' : variant;

    return (
      <MantineButton
        ref={ref}
        variant={mantineVariant}
        className={className}
        data-testid={testId}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
```

### 2.2 Molecules (40 Components)

Combinations of atoms that form simple, reusable UI elements.

| Component           | Composed Of                    | Purpose            | Status  |
| ------------------- | ------------------------------ | ------------------ | ------- |
| **FormField**       | Label + Input + Error          | Form input wrapper | ✅ Core |
| **SearchBox**       | Input + Button + Icon          | Search interface   | ✅ Core |
| **DataTable**       | Table + Badge + Actions        | Data display       | ✅ Core |
| **Dropdown**        | Button + Popover + Menu        | Dropdown menu      | ✅ Core |
| **MenuItem**        | Icon + Text + Badge            | Menu item          | ✅ Core |
| **ToggleGroup**     | Button + Group                 | Segmented control  | ✅ Core |
| **DatePickerInput** | DatePicker + Input + Icon      | Date selection     | ✅ Core |
| **TimePickerInput** | TimePicker + Input + Icon      | Time selection     | ✅ Core |
| **DateTimePicker**  | DatePicker + TimePicker        | Combined picker    | ✅ Core |
| **CheckboxGroup**   | Checkbox + Stack + Label       | Multi-select       | ✅ Core |
| **RadioGroup**      | Radio + Stack + Label          | Single select      | ✅ Core |
| **SelectInput**     | Select + Label + Error         | Select wrapper     | ✅ Core |
| **TextareaInput**   | Textarea + Label + Error       | Textarea wrapper   | ✅ Core |
| **FileUpload**      | FileInput + Preview + Progress | File upload        | ✅ Core |
| **PasswordInput**   | Input + Toggle + Icon          | Password field     | ✅ Core |
| **NumberInput**     | Input + Buttons + Validation   | Number input       | ✅ Core |
| **CurrencyInput**   | Input + Format + Validation    | Currency field     | ✅ Core |
| **PhoneInput**      | Input + Format + Validation    | Phone field        | ✅ Core |
| **EmailInput**      | Input + Format + Validation    | Email field        | ✅ Core |
| **UrlInput**        | Input + Format + Validation    | URL field          | ✅ Core |
| **Autocomplete**    | Input + Menu + Options         | Autocomplete       | ✅ Core |
| **MultiSelect**     | Select + Chips + Search        | Multi-select       | ✅ Core |
| **TransferList**    | Lists + Actions + Search       | Transfer items     | ✅ Core |
| **SliderInput**     | Slider + Input + Label         | Slider with value  | ✅ Core |
| **RangeSlider**     | Slider + Inputs + Labels       | Range selection    | ✅ Core |
| **Rating**          | Icon + Interactive + Label     | Star rating        | ✅ Core |
| **Notification**    | Alert + Close + Actions        | Toast notification | ✅ Core |
| **Modal**           | Dialog + Overlay + Actions     | Modal dialog       | ✅ Core |
| **Drawer**          | Dialog + Overlay + Slide       | Side drawer        | ✅ Core |
| **Popover**         | Popover + Trigger + Content    | Popover content    | ✅ Core |
| **TooltipWrapper**  | Tooltip + Children             | Tooltip wrapper    | ✅ Core |
| **Accordion**       | Collapse + Icon + Header       | Accordion          | ✅ Core |
| **Tabs**            | Tabs + Panel + Content         | Tabbed interface   | ✅ Core |
| **Stepper**         | Steps + Content + Navigation   | Stepper            | ✅ Core |
| **Timeline**        | Items + Icons + Lines          | Timeline           | ✅ Core |
| **Breadcrumb**      | Items + Separators + Links     | Breadcrumb         | ✅ Core |
| **Pagination**      | Buttons + Info + Navigation    | Pagination         | ✅ Core |
| **SkeletonLoader**  | Skeleton + Animation           | Loading skeleton   | ✅ Core |
| **EmptyState**      | Icon + Text + Actions          | Empty state        | ✅ Core |
| **ErrorState**      | Icon + Text + Actions          | Error state        | ✅ Core |
| **LoadingState**    | Spinner + Text                 | Loading state      | ✅ Core |

**Molecule Component Implementation Pattern:**

```typescript
// packages/ui/src/components/molecules/FormField/FormField.tsx
import { Input } from '@agenticverdict/ui/atoms/Input';
import { Label } from '@agenticverdict/ui/atoms/Label';
import { Text } from '@agenticverdict/ui/atoms/Text';
import { Stack } from '@agenticverdict/ui/atoms/Stack';
import { forwardRef } from 'react';

export interface FormFieldProps {
  /** Field label */
  label: string;
  /** Error message */
  error?: string;
  /** Required indicator */
  required?: boolean;
  /** Helper text */
  helperText?: string;
  /** Test ID */
  testId?: string;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, required, helperText, testId, children }, ref) => {
    return (
      <Stack ref={ref} spacing="xs" data-testid={testId}>
        <Label required={required}>{label}</Label>
        {children}
        {error && (
          <Text size="sm" c="red">
            {error}
          </Text>
        )}
        {helperText && !error && (
          <Text size="sm" c="gray">
            {helperText}
          </Text>
        )}
      </Stack>
    );
  }
);

FormField.displayName = 'FormField';
```

### 2.3 Organisms (Domain-Specific Components)

Complex components composed of molecules and atoms, specific to AgenticVerdict business domains.

#### Insights Domain

| Component               | Purpose                       | Status     |
| ----------------------- | ----------------------------- | ---------- |
| **InsightCard**         | Display insight summary       | 🔜 Phase 2 |
| **InsightWizard**       | Multi-step insight creation   | 🔜 Phase 2 |
| **MetricSelector**      | Select metrics per connector  | 🔜 Phase 2 |
| **InsightList**         | List of insights with actions | 🔜 Phase 2 |
| **InsightDetail**       | Full insight view with charts | 🔜 Phase 2 |
| **InsightTemplateCard** | Template selection card       | 🔜 Phase 2 |
| **AISettingsPanel**     | AI model configuration        | 🔜 Phase 2 |

#### Connectors Domain

| Component           | Purpose                      | Status     |
| ------------------- | ---------------------------- | ---------- |
| **ConnectorCard**   | Connector status and actions | 🔜 Phase 1 |
| **ConnectorGrid**   | Grid of connector cards      | 🔜 Phase 1 |
| **OAuthButton**     | OAuth initiation button      | 🔜 Phase 1 |
| **HealthIndicator** | Health status indicator      | 🔜 Phase 1 |
| **ConnectorWizard** | Connector setup wizard       | 🔜 Phase 1 |
| **CredentialForm**  | OAuth/credential input       | 🔜 Phase 1 |

#### Reports Domain

| Component             | Purpose                   | Status     |
| --------------------- | ------------------------- | ---------- |
| **ReportViewer**      | PDF/Excel report viewer   | 🔜 Phase 3 |
| **ReportCard**        | Report summary card       | 🔜 Phase 3 |
| **ReportList**        | List of reports           | 🔜 Phase 3 |
| **ExportButton**      | Export format selector    | 🔜 Phase 3 |
| **SchedulePicker**    | Report schedule selector  | 🔜 Phase 3 |
| **RecipientSelector** | Email recipient selection | 🔜 Phase 3 |

#### Dashboard Domain

| Component           | Purpose                | Status     |
| ------------------- | ---------------------- | ---------- |
| **DashboardLayout** | Main dashboard layout  | 🔜 Phase 1 |
| **MetricCard**      | KPI display card       | 🔜 Phase 1 |
| **MetricTrend**     | Trend visualization    | 🔜 Phase 1 |
| **QuickActions**    | Quick action buttons   | 🔜 Phase 1 |
| **ActivityFeed**    | Recent activity stream | 🔜 Phase 2 |

#### Tenant Management

| Component          | Purpose                   | Status     |
| ------------------ | ------------------------- | ---------- |
| **TenantSwitcher** | Switch between tenants    | 🔜 Phase 1 |
| **TenantCard**     | Tenant summary card       | 🔜 Phase 2 |
| **TenantSelector** | Tenant selection dropdown | 🔜 Phase 2 |
| **TenantLogo**     | Dynamic tenant logo       | 🔜 Phase 1 |

**Organism Component Implementation Pattern:**

```typescript
// packages/ui/src/components/organisms/connectors/ConnectorCard/ConnectorCard.tsx
import { Card } from '@agenticverdict/ui/molecules/Card';
import { Badge } from '@agenticverdict/ui/atoms/Badge';
import { Button } from '@agenticverdict/ui/atoms/Button';
import { HealthIndicator } from '../HealthIndicator';
import { useTenantConfig } from '@agenticverdict/ui/hooks/useTenantConfig';

export interface ConnectorCardProps {
  /** Connector type (meta, ga4, gsc, etc.) */
  type: 'meta' | 'ga4' | 'gsc' | 'gbp' | 'tiktok';
  /** Connector name */
  name: string;
  /** Health status */
  health: 'healthy' | 'degraded' | 'error' | 'disconnected';
  /** Last sync timestamp */
  lastSync?: Date;
  /** On configure callback */
  onConfigure?: () => void;
  /** On disconnect callback */
  onDisconnect?: () => void;
  /** Test ID */
  testId?: string;
}

export function ConnectorCard({
  type,
  name,
  health,
  lastSync,
  onConfigure,
  onDisconnect,
  testId
}: ConnectorCardProps) {
  const { branding } = useTenantConfig();

  return (
    <Card testId={testId}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ConnectorIcon type={type} />
          <div>
            <h3 className="font-semibold">{name}</h3>
            <HealthIndicator status={health} lastSync={lastSync} />
          </div>
        </div>
        <div className="flex gap-2">
          {health !== 'disconnected' && (
            <Button variant="ghost" size="sm" onClick={onConfigure}>
              Configure
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onDisconnect}>
            {health === 'disconnected' ? 'Connect' : 'Disconnect'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

---

## 3. Component API Standards

### 3.1 Props Interface Conventions

All components must follow consistent prop interface standards:

```typescript
// Standard component props interface
export interface ComponentNameProps {
  // 1. Primary behavior props (required first)
  /** Primary content */
  children: React.ReactNode;

  // 2. Visual variants
  /** Visual style variant */
  variant?: "primary" | "secondary" | "ghost";
  /** Size variant */
  size?: "sm" | "md" | "lg";

  // 3. State and behavior
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Click handler */
  onClick?: () => void;

  // 4. Accessibility and testing
  /** ARIA label for screen readers */
  "aria-label"?: string;
  /** Test ID for QA automation */
  testId?: string;

  // 5. Styling overrides (last)
  /** Additional CSS classes */
  className?: string;
  /** Inline styles (rarely used) */
  style?: React.CSSProperties;

  // 6. HTML attributes (forwarded)
  /** Any other HTML attributes */
  [key: string]: any;
}
```

### 3.2 Required Props

All components must include these props:

| Prop           | Type     | Purpose           | Example                     |
| -------------- | -------- | ----------------- | --------------------------- |
| **testId**     | `string` | QA automation     | `testId="submit-button"`    |
| **className**  | `string` | Styling extension | `className="custom-class"`  |
| **aria-label** | `string` | Accessibility     | `aria-label="Close dialog"` |

```typescript
// Required props implementation
export const Button = ({ testId, className, 'aria-label': ariaLabel, ...props }: ButtonProps) => {
  return (
    <button
      data-testid={testId}
      className={cn(baseClasses, className)}
      aria-label={ariaLabel}
      {...props}
    />
  );
};
```

### 3.3 Localization Props

Components inherit localization from context via the `useDirection` hook:

```typescript
// packages/ui/src/hooks/useDirection.ts
import { useDirection as useMantineDirection } from '@mantine/core';

export function useDirection() {
  const dir = useMantineDirection();
  return {
    dir,
    isRTL: dir === 'rtl',
    isLTR: dir === 'ltr',
  };
}

// Usage in components
import { useDirection } from '@agenticverdict/ui/hooks/useDirection';

export function Component() {
  const { dir, isRTL } = useDirection();

  // Mantine automatically handles RTL mirroring
  // For custom CSS, use logical properties
  return (
    <div style={{
      paddingInlineStart: isRTL ? '1rem' : '0',  // Logical property
      paddingInlineEnd: isRTL ? '0' : '1rem'
    }}>
      {content}
    </div>
  );
}
```

### 3.4 Theme Support

Components automatically inherit theme from MantineProvider:

```typescript
// Theme-aware component
import { useMantineTheme } from '@mantine/core';

export function ThemedComponent() {
  const theme = useMantineTheme();

  return (
    <div style={{
      backgroundColor: theme.colors.brand[0],
      color: theme.colors.brand[9],
      padding: theme.spacing.md,
      borderRadius: theme.radius.md
    }}>
      Themed content
    </div>
  );
}
```

### 3.5 Accessibility Props

All components must support comprehensive accessibility:

```typescript
export interface AccessibleComponentProps {
  // ARIA attributes
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'dialog';
  'aria-selected'?: boolean;
  'aria-checked'?: boolean | 'mixed';
  'aria-disabled'?: boolean;
  'aria-pressed'?: boolean;
  'aria-hidden'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-controls'?: string;
  'aria-current'?: string | boolean;

  // Keyboard navigation
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onKeyUp?: (event: React.KeyboardEvent) => void;
  tabIndex?: number;

  // Screen reader only
  srOnly?: boolean;
}

// Implementation example
export function AccessibleButton({
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  srOnly,
  ...props
}: AccessibleComponentProps & React.ComponentProps<'button'>) {
  return (
    <button
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={srOnly ? 'sr-only' : ''}
      {...props}
    />
  );
}
```

---

## 4. Component Development Guidelines

### 4.1 TypeScript Strict Mode

All components must use strict TypeScript with no `any` types:

```typescript
// tsconfig.json for packages/ui
{
  "compilerOptions": {
    "strict": true,
    "noAny": true,
    "noUncheckedIndexedAccess": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

**Type Safety Patterns:**

```typescript
// ✅ Good: Explicit types
interface ButtonProps {
  variant: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

// ❌ Bad: Implicit any or loose types
interface ButtonProps {
  variant: any; // ❌
  size?: string; // ❌ Too loose
  onClick?: any; // ❌
}

// ✅ Good: Discriminated unions
type CardProps =
  | { type: "insight"; insight: InsightData; report?: never }
  | { type: "report"; report: ReportData; insight?: never };

// ❌ Bad: Optional all the things
interface CardProps {
  type?: string;
  insight?: InsightData;
  report?: ReportData;
}
```

### 4.2 Storybook/Ladle Documentation

Components must include Ladle stories for documentation:

```typescript
// packages/ui/src/components/atoms/Button/Button.stories.tsx
import type { Story } from '@ladle/react';
import { Button } from './Button';

export default {
  title: 'Atoms/Button',
  component: Button,
};

// Default story
export const Primary: Story<ButtonProps> = (args) => <Button {...args} />;
Primary.args = {
  children: 'Click me',
  variant: 'primary',
  size: 'md',
};

// All variants
export const Secondary: Story<ButtonProps> = (args) => <Button {...args} />;
Secondary.args = {
  ...Primary.args,
  variant: 'secondary',
};

export const Ghost: Story<ButtonProps> = (args) => <Button {...args} />;
Ghost.args = {
  ...Primary.args,
  variant: 'ghost',
};

export const Danger: Story<ButtonProps> = (args) => <Button {...args} />;
Danger.args = {
  ...Primary.args,
  variant: 'danger',
};

// All sizes
export const Small: Story<ButtonProps> = (args) => <Button {...args} />;
Small.args = {
  ...Primary.args,
  size: 'sm',
};

export const Large: Story<ButtonProps> = (args) => <Button {...args} />;
Large.args = {
  ...Primary.args,
  size: 'lg',
};

// States
export const Disabled: Story<ButtonProps> = (args) => <Button {...args} />;
Disabled.args = {
  ...Primary.args,
  disabled: true,
};

export const Loading: Story<ButtonProps> = (args) => <Button {...args} />;
Loading.args = {
  ...Primary.args,
  loading: true,
};

// RTL support
export const RTL: Story<ButtonProps> = (args) => (
  <div dir="rtl">
    <Button {...args} />
  </div>
);
RTL.args = {
  ...Primary.args,
};

// Interactive example
export const Interactive: Story<ButtonProps> = (args) => {
  const [count, setCount] = React.useState(0);
  return (
    <Button {...args} onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </Button>
  );
};
```

### 4.3 Unit Testing Requirements

All components must have comprehensive unit tests with 70%+ coverage:

```typescript
// packages/ui/src/components/atoms/Button/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button testId="test-button">Click me</Button>);
    expect(screen.getByTestId('test-button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button testId="test-button" onClick={handleClick}>Click</Button>);

    screen.getByTestId('test-button').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button testId="test-button" disabled>Click</Button>);
    expect(screen.getByTestId('test-button')).toBeDisabled();
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Button testId="test-button" variant="primary">Click</Button>);
    expect(screen.getByTestId('test-button')).toHaveClass('mantine-Button-filled');

    rerender(<Button testId="test-button" variant="secondary">Click</Button>);
    expect(screen.getByTestId('test-button')).toHaveClass('mantine-Button-outline');
  });

  it('applies custom className', () => {
    render(<Button testId="test-button" className="custom-class">Click</Button>);
    expect(screen.getByTestId('test-button')).toHaveClass('custom-class');
  });

  it('has correct accessibility attributes', () => {
    render(<Button testId="test-button" aria-label="Close dialog">X</Button>);
    expect(screen.getByTestId('test-button')).toHaveAttribute('aria-label', 'Close dialog');
  });

  it('renders loading state correctly', () => {
    render(<Button testId="test-button" loading>Loading</Button>);
    expect(screen.getByTestId('test-button')).toBeDisabled();
    expect(screen.getByRole('button')).toContainHTML('svg'); // Spinner icon
  });
});
```

**Coverage Targets by Component Type:**

| Component Type | Coverage Target | Rationale                         |
| -------------- | --------------- | --------------------------------- |
| **Atoms**      | 80%+            | Simple, testable, high reuse      |
| **Molecules**  | 75%+            | Medium complexity, business logic |
| **Organisms**  | 70%+            | Complex, integration-heavy        |
| **Hooks**      | 90%+            | Critical logic, high reuse        |
| **Utils**      | 95%+            | Pure functions, easy to test      |

### 4.4 Accessibility Testing

All components must pass accessibility tests:

```typescript
// packages/ui/src/components/atoms/Button/Button.a11y.test.tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from './Button';

expect.extend(toHaveNoViolations);

describe('Button accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button testId="test-button">Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should be keyboard accessible', () => {
    const handleClick = vi.fn();
    render(<Button testId="test-button" onClick={handleClick}>Click</Button>);

    const button = screen.getByTestId('test-button');
    button.focus();
    expect(button).toHaveFocus();

    // Enter key triggers click
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(handleClick).toHaveBeenCalled();
  });

  it('should have correct ARIA attributes', () => {
    render(
      <Button testId="test-button" aria-label="Close dialog" aria-expanded="false">
        X
      </Button>
    );

    const button = screen.getByTestId('test-button');
    expect(button).toHaveAttribute('aria-label', 'Close dialog');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
```

**Accessibility Checklist:**

- [ ] Keyboard navigation (Tab, Enter, Space, Arrow keys)
- [ ] Screen reader announcements (ARIA labels, roles, states)
- [ ] Focus management (visible focus indicators, logical focus order)
- [ ] Color contrast (4.5:1 for text, 3:1 for large text)
- [ ] Touch targets (minimum 44×44px)
- [ ] Semantic HTML (correct elements, headings, landmarks)
- [ ] Motion preferences (respect `prefers-reduced-motion`)
- [ ] RTL support (logical properties, mirroring)

---

## 5. Mantine Integration Strategy

### 5.1 Components to Use Directly

These Mantine components can be used directly with minimal customization:

| Mantine Component | Usage                | Notes                    |
| ----------------- | -------------------- | ------------------------ |
| `Stack`           | Vertical spacing     | Use spacing tokens       |
| `Group`           | Horizontal spacing   | Use spacing tokens       |
| `SimpleGrid`      | Responsive grid      | Mobile-first breakpoints |
| `Container`       | Max-width containers | Size variants            |
| `Paper`           | Card backgrounds     | Radius variants          |
| `Divider`         | Visual separators    | Orientation variants     |
| `Text`            | Typography           | Semantic variants        |
| `Title`           | Headings             | Order prop for hierarchy |
| `Loader`          | Loading indicators   | Size/color variants      |
| `ColorSwatch`     | Color display        | Color picker base        |
| `ScrollArea`      | Custom scrollbars    | Overflow handling        |

### 5.2 Components to Wrap

These Mantine components should be wrapped with AgenticVerdict-specific props and styling:

| Mantine Component | Wrapped As   | Customizations                    |
| ----------------- | ------------ | --------------------------------- |
| `Button`          | `Button`     | Primary/secondary/danger variants |
| `TextInput`       | `Input`      | Floating labels, error states     |
| `Textarea`        | `Textarea`   | Auto-resize, character count      |
| `Select`          | `Select`     | Async loading, virtualization     |
| `Checkbox`        | `Checkbox`   | Custom styling, indeterminate     |
| `Radio`           | `Radio`      | Card options, custom styling      |
| `Switch`          | `Switch`     | Size variants, custom styling     |
| `Badge`           | `Badge`      | Status variants, dot indicator    |
| `Avatar`          | `Avatar`     | Fallback initials, sizes          |
| `Progress`        | `Progress`   | Circular/linear variants          |
| `Alert`           | `Alert`      | Severity variants, icons          |
| `Image`           | `Image`      | Lazy loading, placeholder         |
| `Tooltip`         | `Tooltip`    | Position variants, delays         |
| `Popover`         | `Popover`    | Arrow variants, positioning       |
| `Modal`           | `Modal`      | Size variants, animations         |
| `Drawer`          | `Drawer`     | Position variants, animations     |
| `Menu`            | `Dropdown`   | Trigger variants, positioning     |
| `Accordion`       | `Accordion`  | Icon variants, animations         |
| `Tabs`            | `Tabs`       | Position variants, animations     |
| `Stepper`         | `Stepper`    | Icon variants, animations         |
| `Timeline`        | `Timeline`   | Icon variants, alignments         |
| `Breadcrumb`      | `Breadcrumb` | Separator variants                |
| `Pagination`      | `Pagination` | Size variants, boundaries         |
| `Chip`            | `Chip`       | Multi-select, filtering           |
| `Slider`          | `Slider`     | Range, marks, labels              |
| `DatePicker`      | `DatePicker` | Timezone support                  |
| `TimeInput`       | `TimeInput`  | 12/24h formats                    |
| `FileInput`       | `FileInput`  | Drag-drop, previews               |

### 5.3 Custom Components to Build

These components should be built from scratch using Mantine primitives:

| Component           | Reason            | Base Primitives                    |
| ------------------- | ----------------- | ---------------------------------- |
| `FormField`         | Business logic    | `Stack`, `Text`, `Input`           |
| `SearchBox`         | Composite pattern | `Input`, `Button`, `Icon`          |
| `DataTable`         | Data display      | `Table`, `Badge`, `Group`          |
| `ConnectorCard`     | Domain-specific   | `Card`, `Badge`, `HealthIndicator` |
| `InsightCard`       | Domain-specific   | `Card`, `Badge`, `Chart`           |
| `MetricCard`        | Domain-specific   | `Card`, `Trend`, `Badge`           |
| `TenantSwitcher`    | Multi-tenancy     | `Select`, `Avatar`, `Badge`        |
| `HealthIndicator`   | Domain-specific   | `Badge`, `Icon`, `Text`            |
| `OAuthButton`       | Domain-specific   | `Button`, `Icon`                   |
| `MetricSelector`    | Domain-specific   | `MultiSelect`, `Tree`              |
| `InsightWizard`     | Domain-specific   | `Stepper`, `Form`                  |
| `ReportViewer`      | Domain-specific   | `PDFViewer`, `Button`              |
| `ExportButton`      | Domain-specific   | `Menu`, `Button`, `Icon`           |
| `SchedulePicker`    | Domain-specific   | `Select`, `TimeInput`              |
| `RecipientSelector` | Domain-specific   | `MultiSelect`, `Chips`             |

### 5.4 Radix UI Augmentations

Use Radix UI for accessibility gaps in Mantine:

| Mantine Gap          | Radix Component                 | Usage                       |
| -------------------- | ------------------------------- | --------------------------- |
| Dialog accessibility | `@radix-ui/react-dialog`        | Modal accessibility wrapper |
| Popover positioning  | `@radix-ui/react-popover`       | Advanced positioning        |
| Tooltip positioning  | `@radix-ui/react-tooltip`       | Advanced positioning        |
| Dropdown menu        | `@radix-ui/react-dropdown-menu` | Menu accessibility          |
| Combobox             | `@radix-ui/react-collapsible`   | Expandable sections         |
| Slider accessibility | `@radix-ui/react-slider`        | Enhanced slider a11y        |
| Switch accessibility | `@radix-ui/react-switch`        | Enhanced switch a11y        |

```typescript
// Example: Radix Dialog for accessibility
import * as Dialog from '@radix-ui/react-dialog';
import { MantinePortal } from '@mantine/core';

export function AccessibleModal({ open, onClose, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <MantinePortal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {children}
          </Dialog.Content>
        </MantinePortal>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

---

## 6. Code Examples

### 6.1 Base Component Template

```typescript
// packages/ui/src/components/atoms/Button/Button.tsx
import { forwardRef } from 'react';
import { Button as MantineButton } from '@mantine/core';
import { useDirection } from '@agenticverdict/ui/hooks/useDirection';
import { cn } from '@agenticverdict/ui/utils/cn';
import { generateTestId } from '@agenticverdict/ui/utils/test-id';

export interface ButtonProps extends React.ComponentPropsWithoutRef<typeof MantineButton> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Loading state */
  loading?: boolean;
  /** Test ID for QA */
  testId?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    testId,
    className,
    disabled,
    children,
    ...props
  }, ref) => {
    const { dir } = useDirection();

    // Map variants to Mantine variants
    const mantineVariant: ButtonProps['variant'] =
      variant === 'primary' ? 'filled' :
      variant === 'secondary' ? 'outline' :
      variant === 'danger' ? 'filled' :
      variant;

    const mantineColor =
      variant === 'danger' ? 'red' :
      variant === 'primary' ? 'brand' :
      undefined;

    return (
      <MantineButton
        ref={ref}
        variant={mantineVariant}
        size={size}
        color={mantineColor}
        disabled={disabled || loading}
        loading={loading}
        loaderProps={{ type: 'dots' }}
        className={cn(
          // Base classes
          'font-medium transition-all',
          // Variant-specific classes
          variant === 'ghost' && 'hover:bg-gray-100',
          variant === 'primary' && 'hover:shadow-md',
          // Custom classes
          className
        )}
        data-testid={testId || generateTestId('button', children?.toString())}
        dir={dir}
        {...props}
      >
        {children}
      </MantineButton>
    );
  }
);

Button.displayName = 'Button';
```

### 6.2 Composed Component Example

```typescript
// packages/ui/src/components/molecules/SearchBox/SearchBox.tsx
import { forwardRef, useState } from 'react';
import { Input } from '@agenticverdict/ui/atoms/Input';
import { Button } from '@agenticverdict/ui/atoms/Button';
import { IconSearch } from '@tabler/icons-react';
import { Group } from '@agenticverdict/ui/atoms/Group';
import { useDirection } from '@agenticverdict/ui/hooks/useDirection';
import { cn } from '@agenticverdict/ui/utils/cn';

export interface SearchBoxProps {
  /** Search placeholder */
  placeholder?: string;
  /** On search callback */
  onSearch: (query: string) => void;
  /** Initial value */
  defaultValue?: string;
  /** Debounce delay (ms) */
  debounceMs?: number;
  /** Test ID */
  testId?: string;
  /** Additional classes */
  className?: string;
}

export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(
  ({
    placeholder = 'Search...',
    onSearch,
    defaultValue = '',
    debounceMs = 300,
    testId,
    className
  }, ref) => {
    const { dir } = useDirection();
    const [value, setValue] = useState(defaultValue);
    const [debouncedValue, setDebouncedValue] = useState(defaultValue);

    // Debounce effect
    useState(() => {
      const timer = setTimeout(() => {
        if (debouncedValue !== value) {
          setDebouncedValue(value);
          onSearch(value);
        }
      }, debounceMs);

      return () => clearTimeout(timer);
    }, [value, debounceMs, onSearch]);

    const handleSearch = () => {
      onSearch(value);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    };

    return (
      <Group className={cn('w-full', className)} data-testid={testId}>
        <Input
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          leftSection={<IconSearch size={16} />}
          dir={dir}
          className="flex-1"
        />
        <Button onClick={handleSearch} dir={dir}>
          Search
        </Button>
      </Group>
    );
  }
);

SearchBox.displayName = 'SearchBox';
```

### 6.3 Tenant-Aware Component Example

```typescript
// packages/ui/src/components/organisms/insights/InsightCard/InsightCard.tsx
import { Card } from '@agenticverdict/ui/molecules/Card';
import { Badge } from '@agenticverdict/ui/atoms/Badge';
import { Button } from '@agenticverdict/ui/atoms/Button';
import { Text, Title } from '@agenticverdict/ui/atoms/Text';
import { Group, Stack } from '@agenticverdict/ui/atoms/Group';
import { useTenantConfig } from '@agenticverdict/ui/hooks/useTenantConfig';
import { useTranslation } from '@agenticverdict/ui/hooks/useTranslation';
import { formatDistanceToNow } from 'date-fns';
import { useDirection } from '@agenticverdict/ui/hooks/useDirection';

export interface InsightCardProps {
  /** Insight data */
  insight: {
    id: string;
    title: string;
    summary: string;
    status: 'active' | 'paused' | 'draft';
    lastRunAt?: Date;
    nextRunAt?: Date;
    metrics: Array<{
      connector: string;
      metric: string;
    }>;
  };
  /** On view callback */
  onView?: () => void;
  /** On edit callback */
  onEdit?: () => void;
  /** Test ID */
  testId?: string;
}

export function InsightCard({ insight, onView, onEdit, testId }: InsightCardProps) {
  const { branding } = useTenantConfig();
  const { t } = useTranslation();
  const { dir, isRTL } = useDirection();

  const statusColor =
    insight.status === 'active' ? 'green' :
    insight.status === 'paused' ? 'yellow' :
    'gray';

  return (
    <Card testId={testId} className="hover:shadow-lg transition-shadow">
      <Stack spacing="md">
        {/* Header */}
        <Group justify="space-between">
          <Title order={3}>{insight.title}</Title>
          <Badge color={statusColor}>{t(`insights.status.${insight.status}`)}</Badge>
        </Group>

        {/* Summary */}
        <Text size="sm" c="dimmed">
          {insight.summary}
        </Text>

        {/* Metrics */}
        <Group>
          {insight.metrics.map((metric, index) => (
            <Badge key={index} variant="outline">
              {metric.connector}: {metric.metric}
            </Badge>
          ))}
        </Group>

        {/* Footer */}
        <Group justify="space-between">
          {insight.lastRunAt && (
            <Text size="xs" c="dimmed">
              {t('insights.lastRun', {
                time: formatDistanceToNow(insight.lastRunAt, { addSuffix: true })
              })}
            </Text>
          )}
          {insight.nextRunAt && (
            <Text size="xs" c="dimmed">
              {t('insights.nextRun', {
                time: formatDistanceToNow(insight.nextRunAt, { addSuffix: true })
              })}
            </Text>
          )}
        </Group>

        {/* Actions */}
        <Group dir={dir}>
          <Button variant="ghost" size="sm" onClick={onView}>
            {t('common.view')}
          </Button>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            {t('common.edit')}
          </Button>
        </Group>
      </Stack>
    </Card>
  );
}
```

### 6.4 Form Component Example

```typescript
// packages/ui/src/components/molecules/FormField/FormField.tsx
import { forwardRef, useState } from 'react';
import { Input } from '@agenticverdict/ui/atoms/Input';
import { Label } from '@agenticverdict/ui/atoms/Label';
import { Text } from '@agenticverdict/ui/atoms/Text';
import { Stack } from '@agenticverdict/ui/atoms/Stack';
import { useDirection } from '@agenticverdict/ui/hooks/useDirection';
import { cn } from '@agenticverdict/ui/utils/cn';

export interface FormFieldProps {
  /** Field label */
  label: string;
  /** Error message */
  error?: string;
  /** Required indicator */
  required?: boolean;
  /** Helper text */
  helperText?: string;
  /** Input component */
  children: React.ReactElement;
  /** Test ID */
  testId?: string;
  /** Additional classes */
  className?: string;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({
    label,
    error,
    required = false,
    helperText,
    children,
    testId,
    className
  }, ref) => {
    const { dir } = useDirection();
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);

    // Clone child to inject focus/blur handlers
    const enhancedChild = useState(children, (prev) => {
      if (prev.type === Input) {
        return {
          ...prev,
          props: {
            ...prev.props,
            onFocus: (e: React.FocusEvent) => {
              setIsFocused(true);
              prev.props.onFocus?.(e);
            },
            onBlur: (e: React.FocusEvent) => {
              setIsFocused(false);
              setHasValue(e.target.value.length > 0);
              prev.props.onBlur?.(e);
            },
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              setHasValue(e.target.value.length > 0);
              prev.props.onChange?.(e);
            },
            'aria-invalid': !!error,
            'aria-describedby': error ? `${testId}-error` : helperText ? `${testId}-helper` : undefined,
          }
        };
      }
      return prev;
    });

    return (
      <Stack
        ref={ref}
        spacing="xs"
        className={cn('w-full', className)}
        data-testid={testId}
        dir={dir}
      >
        <Label
          required={required}
          htmlFor={children.props.id}
          className={cn(
            'transition-colors',
            isFocused && 'text-brand-6',
            error && 'text-red-6'
          )}
        >
          {label}
        </Label>

        {enhancedChild}

        {error && (
          <Text
            size="sm"
            c="red"
            id={`${testId}-error`}
            role="alert"
            className="animate-in slide-in-from-top-1"
          >
            {error}
          </Text>
        )}

        {helperText && !error && (
          <Text
            size="sm"
            c="dimmed"
            id={`${testId}-helper`}
          >
            {helperText}
          </Text>
        )}
      </Stack>
    );
  }
);

FormField.displayName = 'FormField';
```

---

## 7. Component Migration Path

### 7.1 Phase 1: Foundation (Weeks 1-2)

**Priority: Core atoms and basic molecules**

- [ ] Core atoms: Button, Input, Label, Badge, Avatar, Icon
- [ ] Layout atoms: Stack, Group, Container, Grid
- [ ] Basic molecules: FormField, SearchBox, Card, DataTable
- [ ] Organisms: ConnectorCard, ConnectorGrid, TenantSwitcher, DashboardLayout
- [ ] Hooks: useDirection, useTenantTheme, useBreakpoint
- [ ] Utils: cn, generateTestId, accessibility helpers

### 7.2 Phase 2: Insights (Weeks 6-8)

**Priority: Insights domain components**

- [ ] Organisms: InsightCard, InsightWizard, MetricSelector, InsightList
- [ ] Molecules: Autocomplete, MultiSelect, TransferList, DatePickerInput
- [ ] Atoms: Chip, Slider, Rating, Accordion
- [ ] Charts integration with Mantine charts

### 7.3 Phase 3: Reports (Weeks 9-11)

**Priority: Reports domain components**

- [ ] Organisms: ReportViewer, ReportCard, ExportButton, SchedulePicker
- [ ] Molecules: FileUpload, RichTextEditor, ColorPicker
- [ ] PDF generation components
- [ ] Excel export components

### 7.4 Migration from Existing Code

**Step 1: Audit existing components**

```bash
# Find all UI components in apps/frontend
find apps/frontend/src/components -name "*.tsx" -o -name "*.ts"

# Categorize by complexity and reuse
# - High reuse: Migrate to @agenticverdict/ui
# - Low reuse: Keep in apps/frontend
# - Domain-specific: Consider organisms
```

**Step 2: Extract reusable components**

```typescript
// Before: apps/frontend/src/components/Button.tsx
export function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}

// After: packages/ui/src/components/atoms/Button/Button.tsx
export interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  testId?: string;
  className?: string;
}

export const Button = ({ onClick, children, testId, className }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={className}
    >
      {children}
    </button>
  );
};
```

**Step 3: Update imports in apps**

```typescript
// Before
import { Button } from "@/components/Button";

// After
import { Button } from "@agenticverdict/ui";
```

**Step 4: Delete old components**

```bash
# After verification and testing
rm apps/frontend/src/components/Button.tsx
```

---

## Appendix A: Component Checklist

Use this checklist when creating new components:

### Structure

- [ ] Component follows Atomic Design hierarchy
- [ ] File structure follows conventions
- [ ] Naming follows conventions (PascalCase for files)
- [ ] Exports are properly barrelled

### TypeScript

- [ ] No `any` types
- [ ] Props interface extends standard HTML attributes where applicable
- [ ] Generic types are properly constrained
- [ ] Types are exported for consumer use

### Props

- [ ] Required props: `testId`, `className`
- [ ] Accessibility props: `aria-label`, `aria-describedby`
- [ ] Variant props have sensible defaults
- [ ] ForwardRef implemented for interactive components

### Styling

- [ ] Uses Mantine theme tokens
- [ ] Logical properties for RTL support
- [ ] className prop supported
- [ ] Uses `cn()` utility for class merging

### Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader announcements
- [ ] Focus indicators visible
- [ ] ARIA attributes correct
- [ ] Color contrast meets WCAG AA

### Testing

- [ ] Unit tests with 70%+ coverage
- [ ] Accessibility tests pass
- [ ] Stories for Ladle documentation
- [ ] Interactive examples

### Documentation

- [ ] JSDoc comments for props
- [ ] Usage examples in stories
- [ ] Accessibility notes
- [ ] RTL examples

### Internationalization

- [ ] Uses translation hooks
- [ ] RTL layouts work
- [ ] Date/time formatting localized
- [ ] Number formatting localized

---

## Appendix B: Resources

### Mantine Documentation

- [Mantine v9 Docs](https://mantine.dev/)
- [Mantine Hooks](https://mantine.dev/hooks/getting-started/)
- [Mantine Theming](https://mantine.dev/theming/theming-functions/)

### Radix UI Documentation

- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Radix Icons](https://www.radix-ui.com/icons)

### Accessibility Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Testing Resources

- [Testing Library Docs](https://testing-library.com/)
- [Vitest Docs](https://vitest.dev/)
- [Jest Axe](https://github.com/nickcolley/jest-axe)

### Documentation Resources

- [Ladle Docs](https://ladle.dev/docs/)
- [Atomic Design by Brad Frost](http://atomicdesign.bradfrost.com/)

---

**Document Status:** ✅ Active Specification  
**Last Updated:** 2026-04-11  
**Maintainer:** UI/UX Architecture Team  
**Review Cycle:** Monthly during Phase 1, Quarterly thereafter
