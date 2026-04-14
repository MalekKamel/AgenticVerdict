# Data Model: UI Foundation

**Feature**: UI Foundation (001-ui-foundation)
**Date**: 2026-04-14
**Status**: Phase 1 Complete

---

## Overview

This document describes the data model for the UI Foundation design system. Unlike backend data models that represent database entities, this model represents the component architecture, design tokens, and theming system that comprise the UI layer of AgenticVerdict.

**Key Entities**:
- **DesignToken**: Visual design values (colors, spacing, typography) at global, brand, and component levels
- **Component**: Reusable UI elements at atomic design levels (atom, molecule, organism)
- **Theme**: Collection of brand tokens for a specific tenant
- **Locale**: Language-region combination with RTL/LTR direction and translation strings
- **Variant**: Specific visual style of a component (e.g., button variants)
- **AccessibilityState**: Component accessibility attributes (ARIA, focus, announcements)

---

## Entity Definitions

### DesignToken

Represents a visual design value at any level of the three-tier token system.

```typescript
interface DesignToken {
  // Identification
  name: string;              // e.g., "color-primary", "spacing-md"
  category: TokenCategory;   // color, spacing, typography, radii, shadow, transition
  tier: TokenTier;           // global, brand, component

  // Value definition
  value: string | number;    // CSS value (e.g., "#228BE6", "1rem", "0.5rem")
  cssVariable: string;       // CSS custom property name (e.g., "--av-color-primary")

  // Composition (for component tokens)
  composedFrom?: DesignTokenReference[];  // References to parent tokens
  fallbackValue?: string | number;         // Fallback if parent token undefined

  // Metadata
  description?: string;      // Human-readable description
  deprecated?: boolean;
  deprecatedInFavorOf?: DesignToken['name'];
}

enum TokenCategory {
  COLOR = 'color',
  SPACING = 'spacing',
  TYPOGRAPHY = 'typography',
  RADIUS = 'radius',
  SHADOW = 'shadow',
  TRANSITION = 'transition',
  Z_INDEX = 'z-index',
}

enum TokenTier {
  GLOBAL = 'global',         // Brand-agnostic design decisions
  BRAND = 'brand',           // Tenant-specific overrides
  COMPONENT = 'component',   // Composed from global/brand tokens
}

interface DesignTokenReference {
  tokenName: string;
  transformation?: 'scale' | 'adjust' | 'mix';  // Optional value transformation
  factor?: number;           // For scale transformations
}
```

**Examples**:

```typescript
// Global token (brand-agnostic)
const primaryBlue: DesignToken = {
  name: 'color-blue-500',
  category: TokenCategory.COLOR,
  tier: TokenTier.GLOBAL,
  value: '#228BE6',
  cssVariable: '--av-color-blue-500',
  description: 'Primary blue color for neutral branding',
};

// Brand token (tenant-specific)
const masafhPrimary: DesignToken = {
  name: 'brand-color-primary',
  category: TokenCategory.COLOR,
  tier: TokenTier.BRAND,
  value: '#FF6B35',
  cssVariable: '--brand-color-primary',
  description: 'Masafh brand orange color',
};

// Component token (composed)
const buttonPrimaryBg: DesignToken = {
  name: 'button-primary-bg',
  category: TokenCategory.COLOR,
  tier: TokenTier.COMPONENT,
  value: 'var(--brand-color-primary, var(--av-color-blue-500))',
  cssVariable: '--button-primary-bg',
  composedFrom: [
    { tokenName: 'brand-color-primary' },
    { tokenName: 'color-blue-500' },
  ],
  fallbackValue: '#228BE6',
  description: 'Background color for primary buttons',
};
```

**Validation Rules**:
- Color tokens must be valid CSS color values (hex, rgb, hsl, or named color)
- Spacing tokens must be positive values (rem, px, em, or unitless)
- Typography tokens must use valid CSS font syntax
- Component tokens must reference valid parent tokens or provide fallback values

---

### Component

Represents a reusable UI element at any atomic design level.

```typescript
interface Component {
  // Identification
  name: string;              // Component name (PascalCase)
  level: AtomicDesignLevel;  // atom, molecule, organism, template, page

  // Component definition
  props: ComponentProps;     // TypeScript prop interface
  variants?: ComponentVariant[];  // Visual style variations
  sizes?: ComponentSize[];   // Size variations

  // Accessibility
  accessibility: ComponentAccessibility;

  // Styling
  styling: ComponentStyling;

  // Composition
  composedOf?: ComponentReference[];  // Child components for molecules/organisms

  // Testing
  tests: ComponentTests;

  // Documentation
  examples: ComponentExample[];

  // Metadata
  description: string;
  category: ComponentCategory;
  status: ComponentStatus;
  deprecated?: boolean;
  deprecatedInFavorOf?: Component['name'];
}

enum AtomicDesignLevel {
  ATOM = 'atom',             // Basic building blocks (Button, Input)
  MOLECULE = 'molecule',     // Simple combinations (FormField, Card)
  ORGANISM = 'organism',     // Complex sections (DataTable, Navigation)
  TEMPLATE = 'template',     // Page layouts (DashboardLayout)
  PAGE = 'page',             // Complete views (Dashboard)
}

enum ComponentCategory {
  FORM = 'form',             // Input-related components
  NAVIGATION = 'navigation', // Navigation components
  DATA_DISPLAY = 'data-display',  // Data visualization
  FEEDBACK = 'feedback',     // Alerts, toasts, spinners
  LAYOUT = 'layout',         // Layout containers
  TYPOGRAPHY = 'typography', // Text components
  OVERLAY = 'overlay',       // Modals, popovers, tooltips
}

enum ComponentStatus {
  STABLE = 'stable',         // Production-ready
  BETA = 'beta',             // Feature-complete but may change
  ALPHA = 'alpha',           // Experimental, may be removed
  DEPRECATED = 'deprecated', // Will be removed
}

interface ComponentProps {
  // Identification props
  id?: string;
  testId?: string;           // For testing

  // Visual props
  variant?: string;          // Visual style (e.g., "primary", "secondary")
  size?: string;             // Size (e.g., "sm", "md", "lg")

  // Behavior props
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;

  // Content props
  children?: React.ReactNode;
  label?: string;
  description?: string;

  // Accessibility props
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaErrorMessage?: string;

  // Event handlers
  onClick?: () => void;
  onChange?: (value: unknown) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

interface ComponentVariant {
  name: string;              // Variant identifier (e.g., "primary")
  description: string;       // Human-readable description
  semanticMeaning: string;   // Semantic meaning (e.g., "Primary action")
  styling: {
    backgroundColor?: DesignTokenReference;
    color?: DesignTokenReference;
    border?: DesignTokenReference;
    hover?: DesignTokenReference;
  };
}

interface ComponentSize {
  name: string;              // Size identifier (e.g., "md")
  description: string;       // Human-readable description
  dimensions: {
    padding?: DesignTokenReference;
    fontSize?: DesignTokenReference;
    minHeight?: string;
    minWidth?: string;
  };
}

interface ComponentAccessibility {
  // Keyboard navigation
  keyboardNavigable: boolean;
  focusable: boolean;
  tabbable: boolean;

  // ARIA attributes
  role?: string;             // ARIA role
  ariaAttributes: Record<string, string>;

  // Screen reader
  screenReaderAnnouncement?: string;

  // WCAG compliance
  wcagLevel: 'AA' | 'AAA';
  touchTargetMet: boolean;   // 44x44px minimum
  colorContrastMet: boolean;
}

interface ComponentStyling {
  // Design tokens used
  tokens: DesignTokenReference[];

  // CSS classes
  className?: string;
  classNames?: Partial<Record<string, string>>;  // Mantine-style

  // Dynamic styles
  styles?: Record<string, React.CSSProperties>;

  // RTL handling
  logicalProperties: boolean; // Use logical properties (margin-inline-start)
}

interface ComponentReference {
  component: Component['name'];
  quantity?: number;         // For multiple instances (e.g., list items)
  optional: boolean;         // Whether child is optional
}

interface ComponentTests {
  unit: boolean;             // Has unit tests
  accessibility: boolean;    // Has axe-core tests
  visual: boolean;           // Has screenshot tests
  rtl: boolean;              // Has RTL tests
  coverageTarget: number;    // Target coverage percentage (0-100)
}

interface ComponentExample {
  name: string;              // Example name
  description: string;       // What this example demonstrates
  code: string;              // Code snippet
  preview?: boolean;         // Show visual preview
}
```

**Example: Button Component**

```typescript
const ButtonComponent: Component = {
  name: 'Button',
  level: AtomicDesignLevel.ATOM,
  category: ComponentCategory.FORM,
  status: ComponentStatus.STABLE,
  description: 'Interactive button that triggers an action when clicked',

  props: {
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
    children: 'Click me',
    ariaLabel: undefined,
    onClick: () => {},
  },

  variants: [
    {
      name: 'primary',
      description: 'Primary action button',
      semanticMeaning: 'Primary or most important action',
      styling: {
        backgroundColor: { tokenName: '--button-primary-bg' },
        color: { tokenName: '--button-primary-text' },
        hover: { tokenName: '--button-primary-hover' },
      },
    },
    {
      name: 'secondary',
      description: 'Secondary action button',
      semanticMeaning: 'Secondary or less important action',
      styling: {
        backgroundColor: { tokenName: '--button-secondary-bg' },
        color: { tokenName: '--button-secondary-text' },
      },
    },
    {
      name: 'ghost',
      description: 'Ghost button with minimal styling',
      semanticMeaning: 'Low-emphasis action',
      styling: {
        backgroundColor: 'transparent',
        color: { tokenName: '--button-ghost-text' },
      },
    },
    {
      name: 'danger',
      description: 'Destructive action button',
      semanticMeaning: 'Destructive or dangerous action',
      styling: {
        backgroundColor: { tokenName: '--button-danger-bg' },
        color: { tokenName: '--button-danger-text' },
      },
    },
  ],

  sizes: [
    {
      name: 'xs',
      description: 'Extra small button',
      dimensions: {
        padding: { tokenName: '--spacing-xs' },
        fontSize: { tokenName: '--font-size-xs' },
        minHeight: '28px',
      },
    },
    {
      name: 'sm',
      description: 'Small button',
      dimensions: {
        padding: { tokenName: '--spacing-sm' },
        fontSize: { tokenName: '--font-size-sm' },
        minHeight: '32px',
      },
    },
    {
      name: 'md',
      description: 'Medium button (default)',
      dimensions: {
        padding: { tokenName: '--spacing-md' },
        fontSize: { tokenName: '--font-size-md' },
        minHeight: '40px',
      },
    },
    {
      name: 'lg',
      description: 'Large button',
      dimensions: {
        padding: { tokenName: '--spacing-lg' },
        fontSize: { tokenName: '--font-size-lg' },
        minHeight: '48px',
      },
    },
  ],

  accessibility: {
    keyboardNavigable: true,
    focusable: true,
    tabbable: true,
    role: 'button',
    ariaAttributes: {
      'aria-disabled': '{disabled}',
    },
    wcagLevel: 'AA',
    touchTargetMet: true,
    colorContrastMet: true,
  },

  styling: {
    tokens: [
      { tokenName: '--button-primary-bg' },
      { tokenName: '--button-primary-text' },
      { tokenName: '--spacing-md' },
      { tokenName: '--radius-md' },
    ],
    logicalProperties: true,
  },

  tests: {
    unit: true,
    accessibility: true,
    visual: true,
    rtl: true,
    coverageTarget: 80,
  },

  examples: [
    {
      name: 'Primary button',
      description: 'Default primary action button',
      code: '<Button variant="primary">Click me</Button>',
      preview: true,
    },
    {
      name: 'Loading button',
      description: 'Button in loading state',
      code: '<Button loading>Loading...</Button>',
      preview: true,
    },
  ],
};
```

---

### Theme

Represents a collection of brand tokens for a specific tenant.

```typescript
interface Theme {
  // Identification
  id: string;                // Unique theme identifier (e.g., "masafh", "default")
  name: string;              // Human-readable theme name
  description?: string;

  // Brand tokens (tenant-specific)
  colors: ThemeColors;
  typography: ThemeTypography;
  branding: ThemeBranding;

  // Validation
  validatedAt?: Date;        // Last validation timestamp
  valid: boolean;            // Whether theme passed validation

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;        // User or system that created theme
  version: number;           // Theme version for cache busting
}

interface ThemeColors {
  primary: string;           // Primary brand color (hex)
  secondary: string;         // Secondary brand color (hex)
  accent?: string;           // Accent color (hex)
  success?: string;          // Success state color (hex)
  warning?: string;          // Warning state color (hex)
  danger?: string;           // Danger/error state color (hex)

  // Semantic color mappings
  background?: string;
  foreground?: string;
  muted?: string;
}

interface ThemeTypography {
  fontFamily: {
    primary: string;         // Primary font family
    secondary?: string;      // Secondary font family
    mono?: string;           // Monospace font family
  };
  fontSize?: {
    base: string;            // Base font size
  };
}

interface ThemeBranding {
  logo: {
    url: string;             // Logo image URL
    width?: string;          // Logo display width
    height?: string;         // Logo display height
  };
  favicon?: string;          // Favicon URL
}
```

**Example: Masafh Theme**

```typescript
const masafhTheme: Theme = {
  id: 'masafh',
  name: 'Masafh Brand',
  description: 'Orange and blue theme for Masafh GPS tracking',

  colors: {
    primary: '#FF6B35',      // Masafh orange
    secondary: '#4C6EF5',    // Companion blue
    accent: '#FFD43B',
    success: '#51CF66',
    warning: '#FCC419',
    danger: '#FF6B6B',
    background: '#FFFFFF',
    foreground: '#101828',
    muted: '#868E96',
  },

  typography: {
    fontFamily: {
      primary: "'Inter', system-ui, -apple-system, sans-serif",
      mono: "'JetBrains Mono', 'Consolas', monospace",
    },
  },

  branding: {
    logo: {
      url: '/logos/masafh.svg',
      width: '150px',
      height: '40px',
    },
    favicon: '/favicons/masafh.ico',
  },

  valid: true,
  createdAt: new Date('2026-04-01'),
  updatedAt: new Date('2026-04-14'),
  version: 1,
};
```

**Validation Rules**:
- All color values must be valid hex colors (#RRGGBB or #RGB)
- Logo URLs must be valid URLs or relative paths
- Font family names must be valid CSS font-family syntax
- Primary and secondary colors are required; others optional

---

### Locale

Represents a language-region combination with direction and translations.

```typescript
interface Locale {
  // Identification
  code: string;              // Locale code (e.g., "ar-SA", "en-US")
  language: string;          // Language name (e.g., "Arabic", "English")
  region: string;            // Region code (e.g., "SA", "US")

  // Text direction
  direction: TextDirection;  // LTR or RTL

  // Formatting
  dateFormat: string;        // Date format string
  timeFormat: string;        // Time format string (12h or 24h)
  numberFormat: NumberFormat;
  currencyFormat: CurrencyFormat;

  // Translations
  translations: TranslationMessages;

  // Metadata
  isActive: boolean;         // Whether locale is active
  isDefault: boolean;        // Whether this is the default locale
}

enum TextDirection {
  LTR = 'ltr',              // Left-to-right (English, French, etc.)
  RTL = 'rtl',              // Right-to-left (Arabic, Hebrew, etc.)
}

interface NumberFormat {
  locale: string;            // Intl.NumberFormat locale
  decimals: number;          // Number of decimal places
  thousandsSeparator: string; // Thousands separator character
}

interface CurrencyFormat {
  currency: string;          // Currency code (e.g., "SAR", "USD")
  symbol: string;            // Currency symbol (e.g., "ر.س", "$")
  position: 'before' | 'after'; // Symbol position relative to value
}

interface TranslationMessages {
  // Translation keys map to translated strings
  [key: string]: string | TranslationMessages;  // Support nested keys
}
```

**Example: Arabic (Saudi Arabia) Locale**

```typescript
const arabicSaudiLocale: Locale = {
  code: 'ar-SA',
  language: 'Arabic',
  region: 'SA',
  direction: TextDirection.RTL,

  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  numberFormat: {
    locale: 'ar-SA',
    decimals: 2,
    thousandsSeparator: ',',
  },
  currencyFormat: {
    currency: 'SAR',
    symbol: 'ر.س',
    position: 'after',  // 100 ر.س
  },

  translations: {
    common: {
      appName: 'AgenticVerdict',
      welcome: 'مرحباً',
      loading: 'جاري التحميل...',
      error: 'خطأ',
      success: 'نجح',
    },
    navigation: {
      dashboard: 'لوحة التحكم',
      connectors: 'الموصلات',
      insights: 'الرؤى',
      reports: 'التقارير',
      settings: 'الإعدادات',
    },
    actions: {
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      create: 'إنشاء',
      search: 'بحث',
    },
  },

  isActive: true,
  isDefault: false,  // English is default
};

**Example: English (United States) Locale**

```typescript
const englishUSLocale: Locale = {
  code: 'en-US',
  language: 'English',
  region: 'US',
  direction: TextDirection.LTR,

  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  numberFormat: {
    locale: 'en-US',
    decimals: 2,
    thousandsSeparator: ',',
  },
  currencyFormat: {
    currency: 'USD',
    symbol: '$',
    position: 'before',  // $100
  },

  translations: {
    common: {
      appName: 'AgenticVerdict',
      welcome: 'Welcome',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
    },
    navigation: {
      dashboard: 'Dashboard',
      connectors: 'Connectors',
      insights: 'Insights',
      reports: 'Reports',
      settings: 'Settings',
    },
    actions: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search',
    },
  },

  isActive: true,
  isDefault: true,
};
```

**Validation Rules**:
- Locale code must be valid BCP 47 language tag
- Direction must be LTR or RTL
- Currency code must be valid ISO 4217 code
- Translation keys must be non-empty strings

---

### Variant

Represents a specific visual style of a component (extracted from Component entity for clarity).

```typescript
interface ComponentVariant {
  // Identification
  name: string;              // Variant identifier (e.g., "primary", "secondary")
  component: Component['name'];  // Parent component

  // Visual definition
  description: string;       // Human-readable description
  semanticMeaning: string;   // Semantic meaning (e.g., "Primary action")

  // Styling
  styling: VariantStyling;

  // Accessibility
  accessibilityNote?: string;  // Any accessibility considerations
}

interface VariantStyling {
  // Color tokens
  backgroundColor?: DesignTokenReference | string;
  color?: DesignTokenReference | string;
  borderColor?: DesignTokenReference | string;

  // State variations
  hover?: DesignTokenReference | string;
  active?: DesignTokenReference | string;
  focus?: DesignTokenReference | string;
  disabled?: DesignTokenReference | string;

  // Visual effects
  boxShadow?: DesignTokenReference | string;
  opacity?: number;
}

interface DesignTokenReference {
  tokenName: string;         // CSS custom property name (e.g., "--brand-color-primary")
}
```

**Example: Button Variants**

```typescript
const buttonVariants: ComponentVariant[] = [
  {
    name: 'primary',
    component: 'Button',
    description: 'Primary action button with solid background',
    semanticMeaning: 'Primary or most important action on the page',
    styling: {
      backgroundColor: { tokenName: '--button-primary-bg' },
      color: { tokenName: '--button-primary-text' },
      hover: { tokenName: '--button-primary-hover' },
      focus: { tokenName: '--button-primary-focus' },
      disabled: { tokenName: '--button-primary-disabled' },
    },
  },
  {
    name: 'secondary',
    component: 'Button',
    description: 'Secondary action button with outline style',
    semanticMeaning: 'Secondary or less important action',
    styling: {
      backgroundColor: 'transparent',
      color: { tokenName: '--button-secondary-text' },
      borderColor: { tokenName: '--button-secondary-border' },
      hover: { tokenName: '--button-secondary-hover' },
    },
    accessibilityNote: 'Ensure sufficient color contrast on hover state',
  },
  {
    name: 'ghost',
    component: 'Button',
    description: 'Minimal button with no border or background',
    semanticMeaning: 'Low-emphasis or tertiary action',
    styling: {
      backgroundColor: 'transparent',
      color: { tokenName: '--button-ghost-text' },
      hover: { tokenName: '--button-ghost-hover' },
    },
  },
  {
    name: 'danger',
    component: 'Button',
    description: 'Destructive action button',
    semanticMeaning: 'Destructive or dangerous action (delete, remove)',
    styling: {
      backgroundColor: { tokenName: '--button-danger-bg' },
      color: { tokenName: '--button-danger-text' },
      hover: { tokenName: '--button-danger-hover' },
    },
    accessibilityNote: 'Use sparingly and only for destructive actions',
  },
];
```

---

### AccessibilityState

Represents the accessibility state of a component instance.

```typescript
interface AccessibilityState {
  // Component identification
  component: Component['name'];
  instanceId?: string;       // Unique instance identifier

  // ARIA attributes
  role?: string;             // ARIA role
  ariaLabel?: string;        // Accessible name
  ariaDescribedBy?: string;  // References to descriptive elements
  ariaErrorMessage?: string; // Reference to error message element

  // State attributes
  expanded?: boolean;        // aria-expanded
  checked?: boolean | 'mixed'; // aria-checked
  pressed?: boolean;         // aria-pressed
  selected?: boolean;        // aria-selected
  hidden?: boolean;          // aria-hidden

  // Live regions
  live?: 'off' | 'polite' | 'assertive';  // aria-live
  atomic?: boolean;          // aria-atomic
  busy?: boolean;            // aria-busy

  // Keyboard interaction
  focusable: boolean;        // Can receive keyboard focus
  tabbable: boolean;         // Included in tab order
  hasFocusIndicator: boolean; // Visible focus indicator present

  // Screen reader
  screenReaderOnly?: boolean; // Component is screen reader only
  announceOnMount?: string;  // Announcement message on mount
  announceOnChange?: string; // Announcement message on state change

  // WCAG compliance
  wcagLevel: 'AA' | 'AAA' | 'Non-compliant';
  colorContrastRatio?: number;  // Actual contrast ratio measured
  touchTargetSize?: {       // Touch target dimensions
    width: number;
    height: number;
    meetsMinimum: boolean;  // Meets 44x44px minimum
  };

  // Validation
  validationErrors: AccessibilityValidationError[];
}

interface AccessibilityValidationError {
  category: 'contrast' | 'keyboard' | 'screen-reader' | 'touch-target' | 'semantic-html';
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
  message: string;          // Human-readable error message
  wcagCriterion?: string;   // Related WCAG criterion (e.g., "1.4.3 Contrast (Minimum)")
}
```

**Example: Button Accessibility State**

```typescript
const buttonAccessibilityState: AccessibilityState = {
  component: 'Button',
  role: 'button',
  ariaLabel: 'Submit form',
  focusable: true,
  tabbable: true,
  hasFocusIndicator: true,
  wcagLevel: 'AA',
  colorContrastRatio: 7.2,  // Exceeds 4.5:1 minimum
  touchTargetSize: {
    width: 44,
    height: 40,
    meetsMinimum: true,
  },
  validationErrors: [],     // No accessibility violations
};
```

**Example: Input with Error Accessibility State**

```typescript
const inputErrorAccessibilityState: AccessibilityState = {
  component: 'Input',
  role: undefined,  // No explicit role needed for input
  ariaLabel: 'Email address',
  ariaDescribedBy: 'email-helper email-error',
  ariaErrorMessage: 'email-error',
  focusable: true,
  tabbable: true,
  hasFocusIndicator: true,
  announceOnChange: 'Invalid email format',
  wcagLevel: 'AA',
  touchTargetSize: {
    width: 44,
    height: 44,
    meetsMinimum: true,
  },
  validationErrors: [],  // No accessibility violations if error is properly announced
};
```

---

## Entity Relationships

```
┌─────────────┐         ┌──────────────┐
│   Theme     │───────▶│ DesignToken  │
│ (tenant)    │  1:N   │ (brand tier) │
└─────────────┘         └──────────────┘
       │
       │ applies to
       ▼
┌─────────────────────────────────────────┐
│            Component                    │
│  (atoms, molecules, organisms, etc.)    │
├─────────────────────────────────────────┤
│ • uses DesignToken (global, brand)     │
│ • has ComponentVariant                 │
│ • has AccessibilityState               │
│ • composed of other Components         │
└─────────────────────────────────────────┘
       │
       │ renders in
       ▼
┌─────────────────────────────────────────┐
│           Template/Page                 │
│  (DashboardLayout, AuthLayout, etc.)    │
└─────────────────────────────────────────┘

┌─────────────┐         ┌──────────────────────┐
│   Locale    │───────▶│  TranslationMessages │
│ (lang/region)│  1:1  │  (i18n strings)      │
└─────────────┘         └──────────────────────┘
       │
       │ determines
       ▼
┌─────────────────────────────────────────┐
│        DirectionProvider                │
│  (sets dir="ltr" or dir="rtl")          │
└─────────────────────────────────────────┘
       │
       │ affects
       ▼
┌─────────────────────────────────────────┐
│            ALL Components               │
│  (mirrored layout in RTL mode)          │
└─────────────────────────────────────────┘
```

**Relationships Explained**:

1. **Theme → DesignToken**: A theme contains multiple brand-tier design tokens that override global tokens
2. **Component → DesignToken**: Components reference design tokens at all three tiers (global, brand, component)
3. **Component → Component**: Molecules compose atoms, organisms compose molecules (atomic design hierarchy)
4. **Component → ComponentVariant**: Components have multiple variants for different visual styles
5. **Component → AccessibilityState**: Each component instance has an accessibility state
6. **Locale → TranslationMessages**: A locale contains translation strings for that language
7. **Locale → DirectionProvider**: Locale determines the text direction (LTR or RTL)
8. **DirectionProvider → Component**: Direction affects layout rendering for all components

---

## State Transitions

### Component Lifecycle States

```
┌──────────┐   Mount   ┌──────────┐
│  Idle    │──────────▶│  Mounted │
└──────────┘           └──────────┘
                            │
                            │ User Interaction
                            ▼
                       ┌──────────┐
                       │ Focused  │◀─────────────────┐
                       └──────────┘                  │
                            │                        │
                            │ Input/Change           │ Blur
                            ▼                        │
                       ┌──────────┐                  │
                       │ Changed  │───────────────────┘
                       └──────────┘
                            │
                            │ Validation
                            ▼
                       ┌──────────┐
                       │ Valid    │
                       └──────────┘
                            │
                   ┌────────┴────────┐
                   ▼                 ▼
              ┌────────┐        ┌────────┐
              │ Success │        │  Error │
              └────────┘        └────────┘
                   │                 │
                   └────────┬────────┘
                            │
                            ▼
                       ┌──────────┐
                       │ Unmount  │
                       └──────────┘
```

### Theme Loading States

```
┌──────────────┐
│  No Theme    │ (Default theme applied)
└──────────────┘
       │
       │ API Call
       ▼
┌──────────────┐
│  Loading     │ (Show loading state)
└──────────────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌──────────────┐ ┌──────────────┐
│   Success    │ │    Error     │
│ (Apply theme)│ │ (Fallback to │
└──────────────┘ │  default)    │
       │         └──────────────┘
       │
       ▼
┌──────────────┐
│   Active     │ (Theme currently applied)
└──────────────┘
       │
       │ Tenant Switch
       ▼
┌──────────────┐
│  Unloading   │ (Remove theme, back to Loading)
└──────────────┘
```

### Locale Switching States

```
┌────────────────┐
│ Current Locale │ (e.g., English LTR)
└────────────────┘
       │
       │ User selects new locale
       ▼
┌────────────────┐
│  Switching     │ (Show transition state)
└────────────────┘
       │
       ├──────────────┐
       │              │
       ▼              ▼
┌────────────────┐ ┌────────────────┐
│ LTR → RTL      │ │ RTL → LTR      │
│ (mirror layout)│ │ (mirror back)  │
└────────────────┘ └────────────────┘
       │
       ▼
┌────────────────┐
│ New Locale     │ (e.g., Arabic RTL)
└────────────────┘
```

---

## Validation Rules Summary

### DesignToken Validation

- **Color tokens**: Must be valid CSS color values (hex, rgb, hsl, named color)
- **Spacing tokens**: Must be positive values (rem, px, em, unitless)
- **Typography tokens**: Must use valid CSS font syntax
- **Component tokens**: Must reference valid parent tokens or provide fallback values
- **CSS variable names**: Must start with `--` and use kebab-case

### Component Validation

- **Props**: All props must have TypeScript type definitions
- **Accessibility**: Must have role, label, and keyboard navigation where applicable
- **Styling**: Must use logical properties for directional styling
- **Testing**: Must have unit tests, accessibility tests, and visual tests
- **Documentation**: Must have description, examples, and usage notes

### Theme Validation

- **Colors**: Must be valid hex colors (#RRGGBB or #RGB)
- **URLs**: Must be valid URLs or relative paths
- **Font families**: Must use valid CSS font-family syntax
- **Required fields**: Primary and secondary colors are required

### Locale Validation

- **Locale code**: Must be valid BCP 47 language tag
- **Direction**: Must be LTR or RTL
- **Currency code**: Must be valid ISO 4217 code
- **Translations**: All keys must have non-empty string values

---

## Type Definitions (TypeScript)

All entities defined in this data model are implemented as TypeScript interfaces in the `@agenticverdict/ui` package:

```typescript
// packages/ui/src/types/entities.ts
export interface DesignToken { /* ... */ }
export interface Component { /* ... */ }
export interface Theme { /* ... */ }
export interface Locale { /* ... */ }
export interface ComponentVariant { /* ... */ }
export interface AccessibilityState { /* ... */ }

export enum TokenCategory { /* ... */ }
export enum TokenTier { /* ... */ }
export enum AtomicDesignLevel { /* ... */ }
export enum TextDirection { /* ... */ }
```

---

## References

- **UI Architecture Overview**: `/docs/architecture/ui/00-overview.md`
- **Design System Research**: `/docs/architecture/ui/01-research-findings/design-system-landscape.md`
- **Feature Specification**: `/specs/01-ui/00-foundation/spec.md`
- **Research Findings**: `/specs/01-ui/00-foundation/research.md`
