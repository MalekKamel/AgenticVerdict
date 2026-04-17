# UI Generation Guide: From .pen Files to Production React Components

**Version**: 1.0.0  
**Last Updated**: 2026-04-14  
**Status**: Active Implementation Guide

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Design Token Extraction](#phase-1-design-token-extraction)
3. [Phase 2: Component Generation](#phase-2-component-generation)
4. [Phase 3: Integration](#phase-3-integration)
5. [Common Patterns & Anti-Patterns](#common-patterns--anti-patterns)
6. [Checklists](#checklists)
7. [References](#references)

---

## Overview

This guide provides a comprehensive, step-by-step approach to translating design files from Pencil (.pen) format into production-ready React components for TanStack Start with Mantine UI v9. The process ensures adherence to AgenticVerdict's design system specifications, WCAG 2.1 AA accessibility requirements, and multi-tenant theming support.

### Technology Stack

- **Framework**: TanStack Start (file-based routing, type-safe navigation)
- **UI Library**: Mantine v9 (component primitives, theming system)
- **Language**: TypeScript 5.3+ (strict mode, no `any` types)
- **Styling**: CSS custom properties (three-tier token system)
- **Testing**: Vitest (unit), Playwright (E2E), jest-axe (accessibility)
- **Design Tool**: Pencil MCP Server (.pen file format)

### Three-Tier Design Token System

```
Global Tokens (--av-*) → Brand Tokens (--brand-*) → Component Tokens (--component-*)
```

**Example**:

```css
/* Global: Brand-agnostic primitive */
--av-color-blue-500: #228be6;

/* Brand: Tenant-specific override */
--brand-color-primary: #ff6b35; /* Masafh orange */

/* Component: Composed from global/brand */
--button-primary-bg: var(--brand-color-primary, var(--av-color-blue-500));
```

### Key Requirements

- **Accessibility**: WCAG 2.1 AA compliance (4.5:1 contrast ratio, keyboard navigation, screen reader support)
- **RTL/LTR**: Full right-to-left layout support using CSS logical properties
- **Multi-Tenant**: Runtime theming without page reload
- **Type Safety**: Strict TypeScript mode, zero `any` types
- **Performance**: Route-based code splitting, lazy loading for components >50KB

---

## Phase 1: Design Token Extraction

### Objective

Extract design tokens from .pen files and transform them into CSS custom properties organized according to the three-tier token system (global, brand, component).

### Step 1.1: Extract Variables Using Pencil MCP

Use the `mcp__pencil__get_variables()` tool to extract all design variables from a .pen file.

```typescript
import pencil from "@pencil/mcp-server";

// Example: Extract tokens from design-tokens.pen
async function extractDesignTokens(filePath: string) {
  const variables = await pencil.get_variables({ filePath });

  // Variables are returned as:
  // {
  //   "variable-name": {
  //     "type": "color" | "number" | "string",
  //     "value": string | number
  //   }
  // }

  return variables;
}
```

**Example Output**:

```json
{
  "badge-bg-color": { "type": "color", "value": "#E3F2FD" },
  "badge-font-size-md": { "type": "number", "value": 14 },
  "badge-padding-md": { "type": "number", "value": 8 },
  "badge-radius": { "type": "number", "value": 9999 }
}
```

### Step 1.2: Map Variables to Token Tiers

Organize extracted variables into the three-tier hierarchy:

```typescript
// packages/ui/src/tokens/token-mapper.ts

interface TokenMapping {
  global: Record<string, DesignToken>;
  brand: Record<string, DesignToken>;
  component: Record<string, DesignToken>;
}

function mapVariablesToTokens(variables: Record<string, unknown>): TokenMapping {
  const mapping: TokenMapping = {
    global: {},
    brand: {},
    component: {},
  };

  for (const [name, definition] of Object.entries(variables)) {
    const token = createDesignToken(name, definition);

    // Determine tier based on naming convention
    if (name.startsWith("av-") || isPrimitiveToken(name)) {
      mapping.global[name] = token;
    } else if (name.startsWith("brand-")) {
      mapping.brand[name] = token;
    } else {
      mapping.component[name] = token;
    }
  }

  return mapping;
}

function createDesignToken(name: string, definition: unknown): DesignToken {
  const { type, value } = definition as { type: string; value: string | number };

  return {
    name,
    category: inferCategory(type, name),
    tier: inferTier(name),
    value,
    cssVariable: `--${name}`,
    description: generateDescription(name, type),
  };
}

function inferCategory(type: string, name: string): TokenCategory {
  if (type === "color") return TokenCategory.COLOR;
  if (name.includes("spacing") || name.includes("padding") || name.includes("gap")) {
    return TokenCategory.SPACING;
  }
  if (name.includes("font") || name.includes("text")) {
    return TokenCategory.TYPOGRAPHY;
  }
  if (name.includes("radius")) return TokenCategory.RADIUS;
  if (name.includes("shadow")) return TokenCategory.SHADOW;

  return TokenCategory.SPACING; // Default
}
```

### Step 1.3: Generate CSS Custom Properties

Convert mapped tokens into CSS custom properties with proper fallbacks:

```css
/* packages/ui/src/tokens/global.css */
:root {
  /* Global Color Tokens */
  --av-color-blue-50: #e3f2fd;
  --av-color-blue-100: #bbdefb;
  --av-color-blue-200: #90caf9;
  --av-color-blue-300: #64b5f6;
  --av-color-blue-400: #42a5f5;
  --av-color-blue-500: #228be6;
  --av-color-blue-600: #1976d2;
  --av-color-blue-700: #1565c0;
  --av-color-blue-800: #0d47a1;

  /* Global Spacing Tokens (4px base unit) */
  --av-spacing-0: 0;
  --av-spacing-1: 0.25rem; /* 4px */
  --av-spacing-2: 0.5rem; /* 8px */
  --av-spacing-3: 0.75rem; /* 12px */
  --av-spacing-4: 1rem; /* 16px */
  --av-spacing-5: 1.25rem; /* 20px */
  --av-spacing-6: 1.5rem; /* 24px */
  --av-spacing-8: 2rem; /* 32px */

  /* Global Typography Tokens */
  --av-font-size-xs: 0.75rem; /* 12px */
  --av-font-size-sm: 0.875rem; /* 14px */
  --av-font-size-md: 1rem; /* 16px */
  --av-font-size-lg: 1.125rem; /* 18px */
  --av-font-size-xl: 1.25rem; /* 20px */

  /* Global Radius Tokens */
  --av-radius-sm: 0.25rem; /* 4px */
  --av-radius-md: 0.5rem; /* 8px */
  --av-radius-lg: 0.75rem; /* 12px */
  --av-radius-xl: 1rem; /* 16px */
  --av-radius-full: 9999px; /* Pill shape */
}

/* Brand Tokens (tenant-specific overrides) */
:root {
  --brand-color-primary: var(--av-color-blue-700);
  --brand-color-secondary: var(--av-color-gray-600);
  --brand-color-success: var(--av-color-green-700);
  --brand-color-warning: var(--av-color-yellow-700);
  --brand-color-danger: var(--av-color-red-700);
}

/* Component Tokens (composed from global/brand) */
:root {
  /* Button Tokens */
  --button-primary-bg: var(--brand-color-primary, var(--av-color-blue-700));
  --button-primary-text: #ffffff;
  --button-primary-hover: var(--brand-color-primary, var(--av-color-blue-800));
  --button-primary-disabled: var(--av-color-gray-300);

  /* Badge Tokens */
  --badge-bg-light: var(--av-color-blue-50);
  --badge-text-light: var(--av-color-blue-700);
  --badge-bg-filled: var(--av-color-blue-700);
  --badge-text-filled: #ffffff;
  --badge-radius: var(--av-radius-full);
}
```

### Step 1.4: Create TypeScript Types for Tokens

Generate TypeScript interfaces for type-safe token access:

```typescript
// packages/ui/src/tokens/types.ts

interface DesignToken {
  name: string;
  category: TokenCategory;
  tier: TokenTier;
  value: string | number;
  cssVariable: string;
  description?: string;
}

enum TokenCategory {
  COLOR = "color",
  SPACING = "spacing",
  TYPOGRAPHY = "typography",
  RADIUS = "radius",
  SHADOW = "shadow",
  TRANSITION = "transition",
}

enum TokenTier {
  GLOBAL = "global",
  BRAND = "brand",
  COMPONENT = "component",
}

// Token value types for type-safe access
interface GlobalTokens {
  color: {
    blue: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
  };
  spacing: {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    8: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

interface BrandTokens {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
}

// Hook for accessing tokens
function useDesignTokens() {
  return {
    global: {
      color: {
        blue: {
          50: "var(--av-color-blue-50)",
          // ...
        },
      },
    },
    brand: {
      primary: "var(--brand-color-primary)",
    },
  };
}
```

### Step 1.5: Handle Theme Variables and Multi-Tenant Overrides

Implement runtime theme switching with tenant-specific overrides:

```typescript
// packages/ui/src/providers/ThemeProvider.tsx

import { createContext, useContext, useState, useEffect } from 'react';

interface Theme {
  id: string;
  colors: {
    primary: string;
    secondary: string;
    success?: string;
    warning?: string;
    danger?: string;
  };
  typography: {
    fontFamily: {
      primary: string;
      secondary?: string;
      mono?: string;
    };
  };
  branding: {
    logo: {
      url: string;
      width?: string;
      height?: string;
    };
  };
}

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(theme);

  useEffect(() => {
    // Apply theme via CSS custom properties
    const root = document.documentElement;

    // Set brand token overrides
    root.style.setProperty('--brand-color-primary', currentTheme.colors.primary);
    root.style.setProperty('--brand-color-secondary', currentTheme.colors.secondary);

    if (currentTheme.colors.success) {
      root.style.setProperty('--brand-color-success', currentTheme.colors.success);
    }

    if (currentTheme.colors.warning) {
      root.style.setProperty('--brand-color-warning', currentTheme.colors.warning);
    }

    if (currentTheme.colors.danger) {
      root.style.setProperty('--brand-color-danger', currentTheme.colors.danger);
    }

    // Set font family
    root.style.setProperty('--brand-font-family', currentTheme.typography.fontFamily.primary);
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setTheme: setCurrentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### Phase 1 Checklist

- [ ] Extract all variables from .pen files using `mcp__pencil__get_variables()`
- [ ] Map variables to global, brand, and component tiers
- [ ] Generate CSS custom properties in `global.css`
- [ ] Create TypeScript types for token categories and values
- [ ] Implement ThemeProvider with runtime theme switching
- [ ] Test token fallbacks (brand → global)
- [ ] Verify CSS variables in browser dev tools
- [ ] Document token naming conventions

---

## Phase 2: Component Generation

### Objective

Translate .pen node hierarchies into React components using Mantine v9 primitives, ensuring accessibility, RTL support, and type safety.

### Step 2.1: Read Component Structures Using Pencil MCP

Use `mcp__pencil__batch_get()` to retrieve component definitions and their node hierarchies.

```typescript
import pencil from "@pencil/mcp-server";

async function readComponentStructure(filePath: string) {
  // Get all reusable components (atoms, molecules)
  const components = await pencil.batch_get({
    filePath,
    patterns: [{ reusable: true }],
    readDepth: 3, // Read component and its direct children
    resolveInstances: true, // Expand component instances
  });

  return components;
}

// Example: Read Button component
const buttonComponents = await readComponentStructure("atoms/button.pen");

// Returns array of nodes:
// [
//   {
//     id: "button-base",
//     type: "frame",
//     reusable: true,
//     children: [
//       { id: "button-text", type: "text", content: "Button" },
//       { id: "button-icon", type: "frame", ... }
//     ],
//     padding: 12,
//     gap: 8,
//     cornerRadius: 8,
//     ...
//   },
//   {
//     id: "button-primary",
//     type: "ref",
//     ref: "button-base",
//     descendants: {
//       "button-base": { fill: "#1976D2" }
//     }
//   }
// ]
```

### Step 2.2: Translate .pen Node Hierarchy to React JSX

Map .pen frame structures to React component composition:

```typescript
// packages/ui/src/atoms/Button/Button.tsx

import { forwardRef } from 'react';
import { UnstyledButton, UnstyledButtonProps } from '@mantine/core';
import { useDirection } from '../../providers/DirectionProvider';
import clsx from 'clsx';

interface ButtonProps extends UnstyledButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  testId?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      leftIcon,
      rightIcon,
      loading = false,
      disabled,
      children,
      className,
      ariaLabel,
      ariaDescribedBy,
      testId,
      ...rest
    },
    ref
  ) => {
    const { isRTL } = useDirection();

    // Build component classes
    const classes = clsx(
      'av-button',
      `av-button--variant-${variant}`,
      `av-button--size-${size}`,
      {
        'av-button--full-width': fullWidth,
        'av-button--loading': loading,
        'av-button--disabled': disabled,
      },
      className
    );

    return (
      <UnstyledButton
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        data-testid={testId}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-busy={loading}
        // Mantine props
        variant="unstyled"
        {...rest}
      >
        {leftIcon && <span className="av-button__icon av-button__icon--left">{leftIcon}</span>}

        <span className="av-button__content">
          {children}
        </span>

        {rightIcon && <span className="av-button__icon av-button__icon--right">{rightIcon}</span>}

        {loading && (
          <span className="av-button__spinner" aria-hidden="true">
            <Spinner size="sm" />
          </span>
        )}
      </UnstyledButton>
    );
  }
);

Button.displayName = 'Button';
```

### Step 2.3: Map .pen Properties to Mantine Props

Translate .pen frame properties to Mantine component props:

```typescript
// .pen property → Mantine prop mapping
interface PenToMantineMapping {
  // Layout properties
  padding?: number | string;
  gap?: number;
  cornerRadius?: number;
  fill?: string;
  stroke?: { fill: string; thickness: number };

  // Auto-layout properties
  layoutMode?: "horizontal" | "vertical";
  primaryAxisSizingMode?: "fixed" | "auto";
  counterAxisSizingMode?: "fixed" | "auto";
  primaryAxisAlignItems?: "min" | "center" | "max" | "space-between";
  counterAxisAlignItems?: "min" | "center" | "max";
}

function mapPenToMantineProps(penProps: PenToMantineMapping) {
  return {
    // Spacing
    p: penProps.padding,
    gap: penProps.gap,
    radius: penProps.cornerRadius,

    // Colors
    bg: penProps.fill,
    c: penProps.fill, // Text color

    // Borders
    border: penProps.stroke
      ? `${penProps.stroke.thickness}px solid ${penProps.stroke.fill}`
      : undefined,

    // Layout
    display: "flex",
    flexDirection: penProps.layoutMode === "horizontal" ? "row" : "column",
    alignItems: mapAlignment(penProps.counterAxisAlignItems),
    justifyContent: mapAlignment(penProps.primaryAxisAlignItems),
  };
}

function mapAlignment(alignment?: string) {
  switch (alignment) {
    case "min":
      return "flex-start";
    case "center":
      return "center";
    case "max":
      return "flex-end";
    case "space-between":
      return "space-between";
    default:
      return undefined;
  }
}
```

### Step 2.4: Handle Responsive Layouts from .pen Auto-Layout

Extract responsive breakpoints from .pen adaptive layouts:

```typescript
// .pen auto-layout → Responsive CSS
function generateResponsiveStyles(penNode: PenNode) {
  const styles: Record<string, React.CSSProperties> = {};

  // Base styles (mobile-first)
  styles.base = {
    display: 'flex',
    flexDirection: penNode.layoutMode === 'horizontal' ? 'row' : 'column',
    padding: penNode.padding,
    gap: penNode.gap,
  };

  // Responsive breakpoints (if adaptive layout is defined)
  if (penNode.adaptiveLayout) {
    styles['@media (min-width: 640px)'] = {
      flexDirection: penNode.adaptiveLayout.sm?.layoutMode === 'horizontal' ? 'row' : 'column',
      gap: penNode.adaptiveLayout.sm?.gap,
    };

    styles['@media (min-width: 1024px)'] = {
      flexDirection: penNode.adaptiveLayout.lg?.layoutMode === 'horizontal' ? 'row' : 'column',
      gap: penNode.adaptiveLayout.lg?.gap,
    };
  }

  return styles;
}

// Usage in component
function Card({ children, adaptiveLayout }: CardProps) {
  const responsiveStyles = generateResponsiveStyles(adaptiveLayout);

  return (
    <div style={responsiveStyles.base}>
      {children}
    </div>
  );
}
```

### Step 2.5: Implement Accessibility (ARIA, Keyboard Navigation)

Add accessibility attributes and keyboard navigation support:

```typescript
// packages/ui/src/atoms/Button/Button.tsx (accessibility additions)

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    // ... existing code

    return (
      <UnstyledButton
        ref={ref}
        // ARIA attributes
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-describedby={ariaDescribedBy}
        aria-disabled={disabled}
        aria-busy={loading}

        // Keyboard navigation
        tabIndex={disabled ? -1 : 0}

        // Mantine props
        component="button"
        variant="unstyled"
        // ... other props
      >
        {/* ... content */}
      </UnstyledButton>
    );
  }
);

// Accessibility requirements:
// 1. All interactive elements must be keyboard accessible (Tab, Enter, Space)
// 2. Icon-only buttons require aria-label
// 3. Loading state communicated via aria-busy
// 4. Disabled state via aria-disabled
// 5. Focus indicator must be visible (2px solid outline)
```

**Keyboard Navigation Implementation**:

```typescript
// packages/ui/src/molecules/Dropdown/Dropdown.tsx

import { useClickOutside, useFocusTrap } from '@mantine/hooks';

export function Dropdown({ trigger, items, open, onOpenChange }: DropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const focusTrapRef = useFocusTrap(open);

  // Close on click outside
  useClickOutside(() => {
    if (open) onOpenChange?.(false);
  }, dropdownRef);

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        onOpenChange?.(false);
        triggerRef.current?.focus();
        break;

      case 'ArrowDown':
        event.preventDefault();
        // Focus next item
        focusNextItem();
        break;

      case 'ArrowUp':
        event.preventDefault();
        // Focus previous item
        focusPreviousItem();
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        // Activate focused item
        activateFocusedItem();
        break;

      case 'Tab':
        // Allow tab navigation but close dropdown
        onOpenChange?.(false);
        break;
    }
  };

  return (
    <div ref={dropdownRef} className="av-dropdown">
      <button
        ref={triggerRef}
        onClick={() => onOpenChange?.(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {trigger}
      </button>

      {open && (
        <div
          ref={focusTrapRef}
          role="menu"
          aria-orientation="vertical"
          onKeyDown={handleKeyDown}
          className="av-dropdown__menu"
        >
          {items.map((item) => (
            <div
              key={item.key}
              role="menuitem"
              tabIndex={item.disabled ? -1 : 0}
              aria-disabled={item.disabled}
              onClick={item.disabled ? undefined : item.onClick}
              className={clsx('av-dropdown__item', {
                'av-dropdown__item--disabled': item.disabled,
                'av-dropdown__item--danger': item.danger,
              })}
            >
              {item.icon && <span className="av-dropdown__item-icon">{item.icon}</span>}
              <span className="av-dropdown__item-label">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Step 2.6: Add RTL Support with Logical Properties

Implement RTL-aware layouts using CSS logical properties:

```typescript
// packages/ui/src/providers/DirectionProvider.tsx

interface DirectionContextValue {
  direction: 'ltr' | 'rtl';
  setDirection: (dir: 'ltr' | 'rtl') => void;
  isRTL: boolean;
}

const DirectionContext = createContext<DirectionContextValue | undefined>(undefined);

export function DirectionProvider({
  initialDir = 'ltr',
  children
}: {
  initialDir?: 'ltr' | 'rtl';
  children: React.ReactNode;
}) {
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(initialDir);

  useEffect(() => {
    // Set dir attribute on document element
    document.documentElement.setAttribute('dir', direction);
  }, [direction]);

  return (
    <DirectionContext.Provider value={{ direction, setDirection, isRTL: direction === 'rtl' }}>
      {children}
    </DirectionContext.Provider>
  );
}

export function useDirection() {
  const context = useContext(DirectionContext);
  if (!context) {
    throw new Error('useDirection must be used within DirectionProvider');
  }
  return context;
}
```

**CSS with Logical Properties**:

```css
/* packages/ui/src/atoms/Button/Button.css */

/* ✅ Use logical properties for RTL support */
.av-button {
  /* Spacing */
  padding-inline-start: var(--button-padding-inline);
  padding-inline-end: var(--button-padding-inline);
  padding-block: var(--button-padding-block);

  /* Layout */
  display: inline-flex;
  flex-direction: row;
  gap: var(--button-gap);

  /* Alignment */
  align-items: center;
  justify-content: center;

  /* Text */
  text-align: start;
}

/* ❌ Don't use directional properties */
.av-button--old {
  margin-left: var(--spacing-md); /* Won't flip in RTL */
  padding-right: var(--spacing-sm); /* Won't flip in RTL */
  text-align: left; /* Won't flip in RTL */
}

/* Icon mirroring in RTL */
.av-button__icon--left {
  /* In RTL, this icon appears on the right */
}

[dir="rtl"] .av-button__icon--mirror {
  transform: scaleX(-1);
}
```

**Component-Level RTL Handling**:

```typescript
// Icon component with automatic mirroring
import { useDirection } from '../../providers/DirectionProvider';

interface IconProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  size?: number;
  mirror?: boolean; // Flip horizontally in RTL
  ariaLabel?: string;
}

export function Icon({ icon: IconComponent, size = 24, mirror, ariaLabel }: IconProps) {
  const { isRTL } = useDirection();

  return (
    <span
      className={clsx('av-icon', {
        'av-icon--mirrored': mirror && isRTL,
      })}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
      role={ariaLabel ? 'img' : undefined}
    >
      <IconComponent size={size} />
    </span>
  );
}
```

### Phase 2 Checklist

- [ ] Read component structures using `mcp__pencil__batch_get()`
- [ ] Map .pen node hierarchy to React JSX
- [ ] Translate .pen properties to Mantine props
- [ ] Implement responsive layouts from auto-layout
- [ ] Add ARIA attributes for accessibility
- [ ] Implement keyboard navigation (Tab, Enter, Escape, Arrow keys)
- [ ] Add RTL support with logical properties
- [ ] Mirror directional icons in RTL mode
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Run axe-core accessibility audit
- [ ] Verify color contrast ratios (4.5:1 minimum)

---

## Phase 3: Integration

### Objective

Integrate generated components into the component library, establish import/export patterns, set up documentation, and implement testing strategies.

### Step 3.1: Import/Export Patterns for Component Library

Establish a clear import/export structure for the component library:

```typescript
// packages/ui/src/index.ts (barrel export)

// Atoms
export { Button } from "./atoms/Button";
export type { ButtonProps } from "./atoms/Button";

export { Input } from "./atoms/Input";
export type { InputProps } from "./atoms/Input";

export { Checkbox } from "./atoms/Checkbox";
export type { CheckboxProps } from "./atoms/Checkbox";

// Molecules
export { FormField } from "./molecules/FormField";
export type { FormFieldProps } from "./molecules/FormField";

export { Card } from "./molecules/Card";
export type { CardProps } from "./molecules/Card";

// Providers
export { ThemeProvider } from "./providers/ThemeProvider";
export { DirectionProvider } from "./providers/DirectionProvider";

// Hooks
export { useTheme } from "./providers/ThemeProvider";
export { useDirection } from "./providers/DirectionProvider";
export { useBreakpoint } from "./hooks/useBreakpoint";

// Types
export type { Theme, DesignToken, ComponentVariant } from "./types";

// Tokens
export { globalTokens, brandTokens, componentTokens } from "./tokens";
```

**Component Exports**:

```typescript
// packages/ui/src/atoms/Button/index.ts
export { Button } from "./Button";
export type { ButtonProps } from "./Button";

// Usage in apps
import { Button } from "@agenticverdict/ui";
// or
import { Button } from "@agenticverdict/ui/atoms";
```

### Step 3.2: Storybook or Component Documentation Setup

Set up Storybook for component documentation and visual testing:

```typescript
// packages/ui/stories/Button.stories.tsx

import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@agenticverdict/ui';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Interactive button component with variant and size support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger', 'success', 'warning'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button interaction',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// Basic button
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

// All variants
export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
    </div>
  ),
};

// All sizes
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
};

// With icons
export const WithIcons: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Button leftIcon={<IconPlus />}>Add Item</Button>
      <Button rightIcon={<IconArrowRight />}>Continue</Button>
      <Button leftIcon={<IconDownload />} rightIcon={<IconExternalLink />}>
        Download
      </Button>
    </div>
  ),
};

// States
export const States: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Button>Default</Button>
      <Button disabled>Disabled</Button>
      <Button loading>Loading</Button>
    </div>
  ),
};

// RTL example
export const RTL: Story = {
  render: () => (
    <div dir="rtl">
      <Button leftIcon={<IconPlus />} rightIcon={<IconArrowRight />}>
        زر أساسي
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Button automatically mirrors layout in RTL mode.',
      },
    },
  },
};
```

### Step 3.3: Testing Strategy (Unit, Accessibility, Visual)

Implement comprehensive testing for all components:

```typescript
// packages/ui/src/atoms/Button/Button.test.tsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from './Button';
import { DirectionProvider } from '../../providers/DirectionProvider';
import { ThemeProvider } from '../../providers/ThemeProvider';

expect.extend(toHaveNoViolations);

describe('Button', () => {
  // Unit tests
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('applies variant classes', () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('av-button--variant-primary');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows loading state when loading prop is true', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('av-button--loading');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button disabled onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  // Accessibility tests
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has visible focus indicator', () => {
    render(<Button>Button</Button>);
    const button = screen.getByRole('button');

    // Check for focus styles in CSS
    expect(button).toHaveClass('av-button');
  });

  it('icon-only button requires aria-label', () => {
    render(<Button ariaLabel="Close dialog"><IconX /></Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Close dialog');
  });

  it('icon-only button without aria-label fails a11y', async () => {
    const { container } = render(<Button><IconX /></Button>);
    const results = await axe(container);

    // Should have violation for missing accessible name
    expect(results.violations.length).toBeGreaterThan(0);
  });

  // Keyboard navigation tests
  it('activates on Enter key', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button');
    button.focus();
    await user.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('activates on Space key', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button');
    button.focus();
    await user.keyboard(' ');

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // RTL tests
  it('mirrors correctly in RTL mode', () => {
    render(
      <DirectionProvider initialDir="rtl">
        <Button leftIcon={<IconPlus />} rightIcon={<IconArrowRight />}>
          زر
        </Button>
      </DirectionProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('dir', 'rtl');
  });

  it('left icon appears on right in RTL', () => {
    render(
      <DirectionProvider initialDir="rtl">
        <Button leftIcon={<IconPlus />}>زر</Button>
      </DirectionProvider>
    );

    const leftIcon = screen.getByText('Plus').parentElement;
    expect(leftIcon).toHaveClass('av-button__icon--left');
  });

  // Variant and size tests
  describe('variants', () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger', 'success', 'warning'] as const;

    variants.forEach((variant) => {
      it(`renders ${variant} variant`, () => {
        render(<Button variant={variant}>{variant}</Button>);
        expect(screen.getByRole('button')).toHaveClass(`av-button--variant-${variant}`);
      });
    });
  });

  describe('sizes', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

    sizes.forEach((size) => {
      it(`renders ${size} size`, () => {
        render(<Button size={size}>{size}</Button>);
        expect(screen.getByRole('button')).toHaveClass(`av-button--size-${size}`);
      });
    });
  });
});
```

**Visual Regression Testing**:

```typescript
// packages/ui/src/atoms/Button/Button.visual.test.tsx

import { test, expect } from "@playwright/test";

test.describe("Button visual tests", () => {
  test("matches snapshot for primary variant", async ({ page }) => {
    await page.goto("/iframe.html?id=atoms-button--primary");

    const button = page.locator("button").first();
    await expect(button).toHaveScreenshot("button-primary.png");
  });

  test("matches snapshot for all variants", async ({ page }) => {
    await page.goto("/iframe.html?id=atoms-button--all-variants");

    const container = page.locator(".av-button").first();
    await expect(container).toHaveScreenshot("button-all-variants.png");
  });

  test("matches snapshot in RTL mode", async ({ page }) => {
    await page.goto("/iframe.html?id=atoms-button--rtl");

    const container = page.locator('[dir="rtl"]').first();
    await expect(container).toHaveScreenshot("button-rtl.png");
  });

  test("matches snapshot for interactive states", async ({ page }) => {
    await page.goto("/iframe.html?id=atoms-button--states");

    const button = page.locator("button").first();

    // Hover state
    await button.hover();
    await expect(button).toHaveScreenshot("button-hover.png");

    // Focus state
    await button.focus();
    await expect(button).toHaveScreenshot("button-focus.png");
  });
});
```

### Step 3.4: Multi-Tenant Theme Integration

Implement dynamic theme loading and application:

```typescript
// apps/frontend/src/providers/AppProviders.tsx

import { trpc } from '@agenticverdict/web/trpc';
import { ThemeProvider, DirectionProvider } from '@agenticverdict/ui';
import { Spinner } from '@agenticverdict/ui';

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Load tenant theme from API
  const { data: theme, isLoading: themeLoading } = trpc.tenants.getTheme.useQuery();

  // Load user locale
  const { data: locale, isLoading: localeLoading } = trpc.users.getLocale.useQuery();

  if (themeLoading || localeLoading) {
    return <Spinner ariaLabel="Loading application" />;
  }

  const direction = locale?.code === 'ar-SA' ? 'rtl' : 'ltr';

  return (
    <ThemeProvider theme={theme || defaultTheme}>
      <DirectionProvider initialDir={direction}>
        {children}
      </DirectionProvider>
    </ThemeProvider>
  );
}

// apps/frontend/src/routes/__root.tsx

import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppProviders } from '../providers/AppProviders';

export const Route = createRootRoute({
  component: () => (
    <AppProviders>
      <Outlet />
    </AppProviders>
  ),
});
```

**Theme Switching**:

```typescript
// apps/frontend/src/components/admin/ThemeSwitcher.tsx

import { trpc } from '@agenticverdict/web/trpc';
import { useTheme } from '@agenticverdict/ui';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const { data: availableThemes } = trpc.admin.listThemes.useQuery();

  return (
    <select
      value={theme.id}
      onChange={(e) => {
        const selectedTheme = availableThemes?.find(t => t.id === e.target.value);
        if (selectedTheme) {
          setTheme(selectedTheme);
        }
      }}
    >
      {availableThemes?.map((themeOption) => (
        <option key={themeOption.id} value={themeOption.id}>
          {themeOption.name}
        </option>
      ))}
    </select>
  );
}
```

### Phase 3 Checklist

- [ ] Set up barrel exports (packages/ui/src/index.ts)
- [ ] Create Storybook stories for all components
- [ ] Write unit tests with Vitest (80%+ coverage)
- [ ] Add accessibility tests with jest-axe
- [ ] Implement visual regression tests with Playwright
- [ ] Test RTL layouts for all components
- [ ] Integrate ThemeProvider in app root
- [ ] Integrate DirectionProvider in app root
- [ ] Load tenant themes dynamically from API
- [ ] Verify theme switching without page reload
- [ ] Document component props and usage
- [ ] Create component examples and templates

---

## Common Patterns & Anti-Patterns

### Pattern 1: Component Composition

**✅ Correct** - Compose atoms into molecules:

```typescript
// FormField molecule composes Input atom
export function FormField({ label, error, children }: FormFieldProps) {
  const id = useId();

  return (
    <div className="av-form-field">
      <label htmlFor={id} className="av-form-field__label">
        {label}
      </label>
      {React.cloneElement(children as React.ReactElement, { id })}
      {error && (
        <span id={`${id}-error`} className="av-form-field__error">
          {error}
        </span>
      )}
    </div>
  );
}

// Usage
<FormField label="Email" error="Invalid email">
  <Input type="email" />
</FormField>
```

**❌ Incorrect** - Duplicate implementation:

```typescript
// FormField re-implements input functionality
export function FormField({ label, error, value, onChange }: FormFieldProps) {
  return (
    <div>
      <label>{label}</label>
      <input value={value} onChange={onChange} /> {/* Should use Input atom */}
      {error && <span>{error}</span>}
    </div>
  );
}
```

### Pattern 2: Design Token Usage

**✅ Correct** - Reference CSS custom properties:

```css
.av-button {
  background-color: var(--button-primary-bg);
  color: var(--button-primary-text);
  padding: var(--button-padding);
  border-radius: var(--button-radius);
}
```

**❌ Incorrect** - Hardcode values:

```css
.av-button {
  background-color: #228be6; /* Hardcoded, won't update with theme */
  color: #ffffff;
  padding: 12px;
  border-radius: 8px;
}
```

### Pattern 3: RTL Layouts

**✅ Correct** - Use logical properties:

```css
.av-button {
  padding-inline-start: 1rem; /* Left in LTR, right in RTL */
  padding-inline-end: 1rem; /* Right in LTR, left in RTL */
  text-align: start; /* Left in LTR, right in RTL */
}
```

**❌ Incorrect** - Use directional properties:

```css
.av-button {
  padding-left: 1rem; /* Won't flip in RTL */
  padding-right: 1rem; /* Won't flip in RTL */
  text-align: left; /* Won't flip in RTL */
}
```

### Pattern 4: Accessibility

**✅ Correct** - Semantic HTML with ARIA:

```typescript
<button
  aria-label="Close dialog"
  aria-describedby="dialog-description"
  disabled={disabled}
>
  <IconX />
</button>
```

**❌ Incorrect** - Div with click handler:

```typescript
<div
  onClick={handleClose}
  className="button"
  role="button"  // Adding role doesn't make it accessible
  tabIndex={0}
>
  <IconX />
</div>
```

### Pattern 5: TypeScript Types

**✅ Correct** - Strict types with no `any`:

```typescript
interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
}
```

**❌ Incorrect** - Using `any` types:

```typescript
interface ButtonProps {
  variant: any; // Loses type safety
  size: any;
  children: any;
  onClick: any;
}
```

### Pattern 6: Component Testing

**✅ Correct** - Test behavior, not implementation:

```typescript
it('calls onClick when clicked', async () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click</Button>);

  await userEvent.click(screen.getByRole('button'));

  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

**❌ Incorrect** - Test implementation details:

```typescript
it("sets internal state to true on click", () => {
  const button = new Button({ onClick: handleClick });
  button.handleClick();
  expect(button.internalState).toBe(true); // Tests implementation
});
```

---

## Checklists

### Phase 1 Checklist: Design Token Extraction

- [ ] Extract all variables from .pen files using `mcp__pencil__get_variables()`
- [ ] Categorize variables into global, brand, and component tiers
- [ ] Generate CSS custom properties in `global.css`
- [ ] Create TypeScript types for token categories
- [ ] Implement fallback values (brand → global)
- [ ] Set up ThemeProvider with runtime theme switching
- [ ] Test theme application in browser dev tools
- [ ] Verify token naming follows conventions (--av-_, --brand-_, --component-\*)
- [ ] Document token structure and usage
- [ ] Validate color tokens (hex format)
- [ ] Validate spacing tokens (rem/px units)
- [ ] Validate typography tokens (font syntax)

### Phase 2 Checklist: Component Generation

- [ ] Read component structures using `mcp__pencil__batch_get()`
- [ ] Map .pen nodes to React JSX
- [ ] Translate .pen properties to Mantine props
- [ ] Implement responsive layouts from auto-layout
- [ ] Add ARIA attributes (role, aria-label, aria-describedby)
- [ ] Implement keyboard navigation (Tab, Enter, Escape, Arrow keys)
- [ ] Use CSS logical properties (margin-inline-start, not margin-left)
- [ ] Mirror directional icons in RTL mode
- [ ] Add visible focus indicator (2px solid outline)
- [ ] Ensure minimum touch target size (44×44px)
- [ ] Verify color contrast ratios (4.5:1 text, 3:1 UI components)
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Run axe-core accessibility audit
- [ ] Test in both LTR and RTL modes
- [ ] Verify all states (default, hover, focus, disabled, loading, error)

### Phase 3 Checklist: Integration

- [ ] Set up barrel exports (packages/ui/src/index.ts)
- [ ] Create Storybook stories for all components
- [ ] Document component props with TypeScript types
- [ ] Provide usage examples for common patterns
- [ ] Write unit tests with Vitest (80%+ coverage target)
- [ ] Add accessibility tests with jest-axe
- [ ] Implement visual regression tests with Playwright
- [ ] Test RTL layouts for all components
- [ ] Integrate ThemeProvider in app root
- [ ] Integrate DirectionProvider in app root
- [ ] Load tenant themes dynamically from API
- [ ] Verify theme switching without page reload
- [ ] Create component examples and templates
- [ ] Add JSDoc comments for complex components
- [ ] Verify bundle size (<500KB gzipped target)

### Accessibility Checklist (WCAG 2.1 AA)

- [ ] All interactive elements keyboard accessible (Tab, Enter, Space)
- [ ] Visible focus indicator on all interactive elements
- [ ] Color contrast ≥4.5:1 for normal text
- [ ] Color contrast ≥3:1 for large text (18pt+) and UI components
- [ ] Touch target size ≥44×44px for all interactive elements
- [ ] All images have alt text or are marked decorative
- [ ] All form inputs have associated labels
- [ ] Error messages announced via aria-describedby
- [ ] Required fields marked programmatically and visually
- [ ] Icon-only buttons have aria-label
- [ ] Screen reader compatibility verified (NVDA, JAWS, VoiceOver)
- [ ] axe-core audit passes with zero violations
- [ ] Supports browser and OS high contrast mode
- [ ] Respects prefers-reduced-motion for animations

### TypeScript Checklist

- [ ] No `any` types in component code
- [ ] All props have TypeScript interfaces
- [ ] Strict mode enabled in tsconfig.json
- [ ] All components exported with types
- [ ] Generic types properly constrained
- [ ] Event handlers properly typed
- [ ] CSS properties use correct types
- [ ] No implicit any violations
- [ ] No unused variables
- [ ] No type assertions (as) unless necessary

### Performance Checklist

- [ ] Route-based code splitting implemented
- [ ] Components >50KB lazy-loaded
- [ ] Bundle size under 500KB gzipped
- [ ] First Contentful Paint <1.5s on mobile 4G
- [ ] Time to Interactive <3s on 3G connection
- [ ] Cumulative Layout Shift <0.1
- [ ] Images optimized and lazy-loaded
- [ ] CSS minified in production
- [ ] Tree-shaking working correctly
- [ ] No unnecessary re-renders (React.memo where needed)

---

## References

### Architecture Documentation

- **Business Architecture**: `/docs/architecture/business/business-architecture.md`
- **Technical Architecture**: `/docs/architecture/business/technical-architecture.md`
- **Design Tokens Specification**: `/docs/architecture/ui/02-design-system-specification/design-tokens.md`
- **Design System Landscape**: `/docs/architecture/ui/01-research-findings/design-system-landscape.md`

### Specification Documents

- **UI Foundation Spec**: `/specs/01-ui/00-foundation/spec.md`
- **Component API Contracts**: `/specs/01-ui/00-foundation/contracts/component-api.md`
- **Data Model**: `/specs/01-ui/00-foundation/data-model.md`
- **Quick Start**: `/specs/01-ui/00-foundation/quickstart.md`
- **Requirements**: `/specs/01-ui/00-foundation/checklists/requirements.md`

### Technology Documentation

- **TanStack Start**: https://tanstack.com/start/latest
- **Mantine v9**: https://mantine.dev/
- **Pencil MCP Server**: Available via MCP tools
- **TypeScript 5.3**: https://www.typescriptlang.org/docs/
- **Vitest**: https://vitest.dev/
- **Playwright**: https://playwright.dev/
- **jest-axe**: https://github.com/nickcolley/jest-axe

### Accessibility Standards

- **WCAG 2.1 AA**: https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_customize&levels=aa
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/
- **CSS Logical Properties**: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties
- **RTL Styling Guide**: https://rtlstyling.com/

### Code Examples

See the `design-system/` directory for .pen file examples:

- `atoms/button.pen` - Button component variants
- `atoms/input.pen` - Input component states
- `molecules/card.pen` - Card component layout
- `molecules/form-field.pen` - Form field composition

---

## Troubleshooting

### Issue: CSS Variables Not Applying

**Symptom**: Design tokens not appearing in browser dev tools.

**Solutions**:

1. Check that `global.css` is imported in app root
2. Verify CSS variable names match token names (case-sensitive)
3. Ensure ThemeProvider wraps application
4. Check for CSS specificity conflicts

### Issue: RTL Layout Not Mirroring

**Symptom**: Layout doesn't flip when switching to Arabic.

**Solutions**:

1. Ensure DirectionProvider wraps application
2. Check for directional properties (left, right) instead of logical (inline-start, inline-end)
3. Verify `dir="rtl"` is set on document element
4. Test with directional icons that have `mirror` prop

### Issue: Accessibility Test Failures

**Symptom**: axe-core reports violations.

**Common Fixes**:

- Add `aria-label` to icon-only buttons
- Associate labels with form inputs
- Ensure color contrast ≥4.5:1
- Add visible focus indicators
- Use semantic HTML (button, not div)

### Issue: TypeScript Type Errors

**Symptom**: Type errors in generated components.

**Solutions**:

1. Ensure all props are typed in interfaces
2. Extend proper React prop types (e.g., `React.ComponentProps<'button'>`)
3. Use proper generic constraints
4. Enable strict mode in tsconfig.json

### Issue: Bundle Size Too Large

**Symptom**: Initial bundle exceeds 500KB gzipped.

**Solutions**:

1. Enable route-based code splitting
2. Lazy-load components >50KB
3. Tree-shake unused exports
4. Minify CSS in production
5. Use dynamic imports for heavy dependencies

---

**End of Guide**

For questions or issues, refer to the architecture documentation or contact the UI Foundation team.
