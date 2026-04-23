# Theming Specification: AgenticVerdict Multi-Brand Theme System

**Document Version:** 1.0  
**Date:** 2026-04-11  
**Status:** Active  
**Prepared For:** Development Team, Design Team, Architecture Team

---

## Executive Summary

This document defines the comprehensive theming architecture for AgenticVerdict, supporting light/dark modes, multi-brand white-label customization, RTL/LTR layouts, and multi-tenant theming. Built on Mantine UI v9's powerful theming system, our architecture enables agency partners to customize branding while maintaining consistency across the platform.

**Key Capabilities:**

- **Light/Dark Modes**: Automatic system preference detection with manual override
- **Multi-Brand Theming**: TenantConfig-driven branding for white-label agency partners
- **RTL/LTR Support**: Direction-aware theming with automatic layout mirroring
- **CSS Custom Properties**: Runtime theme switching without page reload
- **Component-Level Customization**: Granular theme overrides per component
- **Accessibility First**: WCAG 2.1 AA compliant color contrast in all themes

### Framework Implementation Note

**TanStack Start (React Framework):** This theming implementation uses TanStack Start as the React framework. Unlike Next.js, TanStack Start is client-side by default and does not require "use client" directives for client-side components. The examples in this document may include "use client" comments to indicate client-side intent, but these are optional in TanStack Start implementations. All theming components work seamlessly in TanStack Start's client-first architecture.

---

## 1. Theme Architecture

### 1.1 Mantine Theme System Overview

Mantine v9 uses a sophisticated theme system built on CSS custom properties (CSS variables) and TypeScript-based theme definitions. The theme is composed of multiple layers:

```typescript
// Theme composition layers
interface MantineTheme {
  // Core colors
  colors: Record<string, ColorsTuple>;

  // Semantic color mappings
  primaryColor: string;
  primaryShade: ShadeNumber | { light: ShadeNumber; dark: ShadeNumber };

  // Typography
  fontFamily: string;
  fontFamilyMonospace: string;
  headings: { fontFamily: string } & FontSizes;

  // Spacing & Layout
  spacing: Record<string, number>;
  containerSizes: Record<string, number>;

  // Breakpoints
  breakpoints: Record<string, number>;

  // Direction
  dir: "ltr" | "rtl";

  // Other settings
  radius: Record<string, number>;
  lineHeight: Record<string, number>;
  shadows: Record<string, string>;
  zIndex: Record<string, number>;
  cursorType: "pointer" | "default";
}
```

### 1.2 CSS Custom Properties Approach

Mantine v9 generates CSS custom properties for all theme values, enabling runtime theme switching:

```css
/* Generated CSS variables (simplified) */
:root {
  --mantine-primary-color-0: #e7f5ff;
  --mantine-primary-color-1: #bee3f8;
  --mantine-primary-color-2: #90cdf4;
  /* ... more shades ... */
  --mantine-spacing-xs: 10px;
  --mantine-spacing-sm: 12px;
  --mantine-spacing-md: 16px;
  --mantine-radius-sm: 4px;
  --mantine-radius-md: 8px;
  --mantine-font-family: "Inter", sans-serif;
}

/* Dark mode overrides */
[data-mantine-color-scheme="dark"] {
  --mantine-primary-color-0: #001f3f;
  --mantine-primary-color-1: #003366;
  /* ... darker shades ... */
}
```

**Benefits for AgenticVerdict:**

- **Zero Flicker**: Theme changes via CSS variables don't cause React re-renders
- **SSR Compatible**: No hydration mismatches
- **Performance**: Browser-optimized property updates
- **Debugging**: Easy inspection in browser DevTools

### 1.3 Theme Inheritance and Composition

Our theming architecture uses a three-tier inheritance model:

```
1. Base Theme (packages/ui/src/theme/base.ts)
   ├── Global design tokens
   ├── Core color palettes
   └── Foundation settings

2. Mode Theme (packages/ui/src/theme/modes/)
   ├── light.ts  → Inherits base, overrides for light mode
   └── dark.ts   → Inherits base, overrides for dark mode

3. Brand Theme (packages/ui/src/theme/brands/)
   ├── default.ts     → AgenticVerdict default branding
   ├── masafh.ts      → Client-specific branding
   └── agency-{id}.ts → Agency partner white-label themes
```

**Composition Example:**

```typescript
// Base theme foundation
import { baseTheme } from "./base";

// Light mode extends base
export const lightTheme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    // Light-specific color overrides
  },
};

// Masafh brand extends light mode
export const masafhLightTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primaryBrand: ["#FF6B35", "#F7931E", "#FFB347"], // Masafh orange
  },
  primaryColor: "primaryBrand",
};
```

### 1.4 Runtime Theme Switching

Theme switching occurs through Mantine's `useMantineColorScheme` hook combined with our multi-brand registry:

```typescript
// Theme switching flow
function AppProviders({ children, tenantConfig }: Props) {
  const initialScheme = useStoredColorScheme(); // 'light' | 'dark' | 'auto'
  const brandTheme = useBrandTheme(tenantConfig.brandId); // Brand-specific overrides

  return (
    <MantineProvider
      theme={brandTheme}
      defaultColorScheme={initialScheme}
    >
      {children}
    </MantineProvider>
  );
}
```

**Runtime Performance:**

- Theme changes: <16ms (60fps)
- Zero React re-renders for CSS property changes
- LocalStorage persistence for user preferences
- Tenant theme cached in memory (5-minute TTL)

---

## 2. Light/Dark Mode

### 2.1 Theme Definitions

Our light and dark themes are defined with careful attention to WCAG 2.1 AA contrast requirements:

```typescript
// packages/ui/src/theme/modes/light.ts
export const lightTheme = {
  ...baseTheme,
  colors: {
    // Primary blue palette (lighter shades for light mode)
    blue: [
      "#e7f5ff", // 0: Lightest
      "#bee3f8", // 1
      "#90cdf4", // 2
      "#63b3ed", // 3
      "#4299e1", // 4
      "#3182ce", // 5: Primary shade (WCAG AA compliant)
      "#2b6cb0", // 6
      "#2c5282", // 7
      "#2a4365", // 8
      "#1a365d", // 9: Darkest
    ],

    // Neutral grays for text
    gray: [
      "#f7fafc", // 0: Background
      "#edf2f7", // 1: Card background
      "#e2e8f0", // 2: Border
      "#cbd5e0", // 3
      "#a0aec0", // 4: Disabled text
      "#718096", // 5
      "#4a5568", // 6: Secondary text
      "#2d3748", // 7
      "#1a202c", // 8
      "#171923", // 9: Primary text
    ],
  },

  primaryColor: "blue",
  primaryShade: { light: 6, dark: 4 }, // WCAG AA: 4.5:1 contrast

  // Light mode specific settings
  backgroundColor: "var(--mantine-color-gray-0)",
  textColor: "var(--mantine-color-gray-9)",
};

// packages/ui/src/theme/modes/dark.ts
export const darkTheme = {
  ...baseTheme,
  colors: {
    // Primary blue palette (adjusted for dark backgrounds)
    blue: [
      "#001f3f", // 0: Darkest (for dark backgrounds)
      "#003366", // 1
      "#004080", // 2
      "#0059b3", // 3
      "#0073e6", // 4
      "#1a75ff", // 5: Primary shade (brighter for dark mode)
      "#4d94ff", // 6
      "#80b3ff", // 7
      "#b3d9ff", // 8
      "#e6f2ff", // 9: Lightest (for dark mode text)
    ],

    // Dark mode grays (inverted logic)
    gray: [
      "#171923", // 0: Background (dark)
      "#1a202c", // 1: Card background
      "#2d3748", // 2: Border
      "#4a5568", // 3
      "#718096", // 4: Disabled text
      "#a0aec0", // 5: Secondary text
      "#cbd5e0", // 6
      "#e2e8f0", // 7
      "#edf2f7", // 8
      "#f7fafc", // 9: Primary text (light)
    ],
  },

  primaryColor: "blue",
  primaryShade: { light: 6, dark: 5 }, // Brighter shade for dark mode

  // Dark mode specific settings
  backgroundColor: "var(--mantine-color-gray-9)",
  textColor: "var(--mantine-color-gray-0)",
};
```

### 2.2 Automatic System Preference Detection

The system automatically detects user's OS-level color scheme preference:

```typescript
// apps/frontend/src/components/Providers.tsx
import { useMantineColorScheme, useComputedColorScheme } from '@mantine/core';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const colorScheme = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  });

  // 'auto' respects system preference
  return (
    <MantineProvider defaultColorScheme="auto">
      {children}
    </MantineProvider>
  );
}
```

**Detection Priority:**

1. User's saved preference (localStorage)
2. System preference (prefers-color-scheme)
3. Default: 'light'

### 2.3 Manual Toggle Implementation

Manual toggle with smooth transitions:

```typescript
// apps/frontend/src/components/layout/ColorSchemeToggle.tsx
import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';

export function ColorSchemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <ActionIcon
      onClick={() => toggleColorScheme()}
      variant="default"
      size="lg"
      radius="md"
      aria-label={colorScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {colorScheme === 'dark' ? (
        <IconSun size={20} stroke={1.5} />
      ) : (
        <IconMoon size={20} stroke={1.5} />
      )}
    </ActionIcon>
  );
}
```

**Transition Animation:**

```css
/* Smooth theme transitions */
* {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Disable transition during initial page load */
.no-transition * {
  transition: none !important;
}
```

### 2.4 Mode Persistence

User's color scheme preference persists across sessions:

```typescript
// LocalStorage persistence
const COLOR_SCHEME_KEY = "agenticverdict-color-scheme";

export function useStoredColorScheme() {
  const [storedScheme, setStoredScheme] = useState<ColorScheme>("auto");

  useEffect(() => {
    const saved = localStorage.getItem(COLOR_SCHEME_KEY);
    if (saved && ["light", "dark", "auto"].includes(saved)) {
      setStoredScheme(saved as ColorScheme);
    }
  }, []);

  const setScheme = useCallback((scheme: ColorScheme) => {
    setStoredScheme(scheme);
    localStorage.setItem(COLOR_SCHEME_KEY, scheme);
  }, []);

  return [storedScheme, setScheme] as const;
}
```

---

## 3. Multi-Brand Theming

### 3.1 Brand Theme Registry

Brand themes are registered in a centralized registry with tenant-specific overrides:

```typescript
// packages/ui/src/theme/brands/registry.ts
export interface BrandTheme {
  id: string;
  name: string;
  logo?: {
    light: string;
    dark: string;
  };
  colors: {
    primary?: string[];
    secondary?: string[];
    accent?: string[];
  };
  primaryColor?: string;
  radius?: Partial<typeof baseTheme.radius>;
  fontFamily?: string;
}

export const brandRegistry: Record<string, BrandTheme> = {
  default: {
    id: "default",
    name: "AgenticVerdict",
    colors: {
      primary: blueColors, // From base theme
    },
    primaryColor: "blue",
  },

  masafh: {
    id: "masafh",
    name: "Masafh",
    logo: {
      light: "/brands/masafh-logo-light.svg",
      dark: "/brands/masafh-logo-dark.svg",
    },
    colors: {
      primary: [
        "#fff5ed", // 0
        "#fed7aa", // 1
        "#fdba74", // 2
        "#fb923c", // 3
        "#f97316", // 4
        "#ea580c", // 5: Primary (Masafh orange)
        "#c2410c", // 6
        "#9a3412", // 7
        "#7c2d12", // 8
        "#431407", // 9
      ],
    },
    primaryColor: "primary",
    radius: {
      DEFAULT: 8, // More rounded for Masafh brand
      lg: 16,
      xl: 24,
    },
  },

  // Agency partner themes generated dynamically
  "agency-partner-123": {
    id: "agency-partner-123",
    name: "Partner XYZ Agency",
    colors: {
      primary: purpleColors,
      secondary: greenColors,
    },
    primaryColor: "primary",
  },
};
```

### 3.2 TenantConfig-Driven Branding

Branding is driven by the tenant's TenantConfig:

```typescript
// packages/config/src/schemas/tenant-config.ts
export interface TenantConfig {
  tenantId: string;
  localization: {
    language: "ar" | "en" | "fr" | "es" | "ur" | "he"; // Extensible
    region: string;
    timezone: string;
    currency: string;
  };
  branding: {
    themeId: string; // References brandRegistry
    customColors?: {
      primary?: string[];
      secondary?: string[];
      accent?: string[];
    };
    logoUrl?: string;
    faviconUrl?: string;
  };
  // ... other config
}

// Theme resolution from TenantConfig
export function resolveTheme(config: TenantConfig): MantineTheme {
  const baseBrand = brandRegistry[config.branding.themeId] || brandRegistry.default;
  const mode = useMantineColorScheme().colorScheme === "dark" ? darkTheme : lightTheme;

  return {
    ...mode,
    ...(config.branding.customColors && {
      colors: {
        ...mode.colors,
        ...config.branding.customColors,
      },
    }),
    ...baseBrand,
  };
}
```

### 3.3 Logo and Color Customization

Brands can customize logos and color schemes:

```typescript
// Logo component with brand-aware rendering
export function BrandLogo({
  tenantId,
  variant = 'full'
}: {
  tenantId: string;
  variant?: 'full' | 'icon' | 'wordmark';
}) {
  const config = useTenantConfig();
  const colorScheme = useMantineColorScheme().colorScheme;

  // Use custom logo if provided, otherwise default
  const logoUrl = config.branding.logoUrl ||
    (colorScheme === 'dark'
      ? '/logos/agenticverdict-dark.svg'
      : '/logos/agenticverdict-light.svg'
    );

  return (
    <Image
      src={logoUrl}
      alt={`${config.tenantName} logo`}
      height={variant === 'icon' ? 32 : 40}
      width={variant === 'icon' ? 32 : 160}
    />
  );
}

// Color customization helper
export function useBrandColors() {
  const config = useTenantConfig();
  const { getColorScheme } = useMantineTheme();

  return {
    primary: getColorScheme(config.branding.customColors?.primary || blueColors),
    secondary: getColorScheme(config.branding.customColors?.secondary || grayColors),
    accent: getColorScheme(config.branding.customColors?.accent || greenColors),
  };
}
```

### 3.4 White-Label Support for Agencies

Agency partners can white-label the platform for their clients:

```typescript
// Agency partner white-label configuration
interface AgencyWhiteLabelConfig {
  agencyId: string;
  clientOverrides: Record<string, {
    branding: {
      hideAgenticVerdictBranding: boolean;
      customFooter?: string;
      customSupportUrl?: string;
      customPrivacyPolicy?: string;
    };
  }>;
}

// Example: Agency partner "XYZ Agency" with 3 clients
const xyzAgencyConfig: AgencyWhiteLabelConfig = {
  agencyId: 'agency-xyz',
  clientOverrides: {
    'client-1': {
      branding: {
        hideAgenticVerdictBranding: true,
        customFooter: '© 2026 Client 1 - Powered by XYZ Agency',
        customSupportUrl: 'https://xyz-agency.com/support',
      },
    },
    'client-2': {
      branding: {
        hideAgenticVerdictBranding: true,
        customFooter: '© 2026 Client 2 - Managed by XYZ Agency',
      },
    },
    'client-3': {
      branding: {
        hideAgenticVerdictBranding: false, // Show co-branding
      },
    },
  },
};

// White-label footer component
export function AppFooter() {
  const config = useTenantConfig();
  const agencyConfig = useAgencyConfig();

  if (agencyConfig?.clientOverrides[config.tenantId]?.branding.hideAgenticVerdictBranding) {
    return (
      <footer>
        {agencyConfig.clientOverrides[config.tenantId].branding.customFooter}
      </footer>
    );
  }

  return (
    <footer>
      © 2026 AgenticVerdict - All rights reserved
    </footer>
  );
}
```

---

## 4. RTL/LTR Theming

### 4.1 Direction-Aware Theming

Mantine's `DirectionProvider` automatically handles text direction changes:

```typescript
// apps/frontend/src/components/Providers.tsx
import { DirectionProvider } from '@mantine/core';
import { useLocale } from 'next-intl';

export function Providers({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <DirectionProvider initialDirection={dir}>
      <MantineProvider theme={theme}>
        {children}
      </MantineProvider>
    </DirectionProvider>
  );
}
```

### 4.2 Spacing and Layout Adjustments

Mantine automatically handles spacing and layout for RTL:

```typescript
// Automatic RTL support - no manual adjustments needed
import { Group, Stack, Paper } from '@mantine/core';

function ExampleComponent() {
  return (
    <Group gap="md"> {/* Automatically reverses in RTL */}
      <Icon />
      <Text>Text</Text>
    </Group>
  );
}

// Mantine's RTL support includes:
// - margin/padding logical properties (margin-inline-start instead of margin-left)
// - flex/grid direction reversal
// - text-align reversal
// - transform and animation mirroring
```

**Manual RTL Adjustments (when needed):**

```typescript
import { useMantineTheme } from '@mantine/core';

function CustomComponent() {
  const { dir } = useMantineTheme();

  return (
    <div style={{
      // Use logical properties instead of physical ones
      paddingInlineStart: dir === 'rtl' ? '20px' : '10px', // Automatically flips
      marginInlineEnd: '10px',
    }}>
      Content
    </div>
  );
}
```

### 4.3 Icon and Asset Mirroring

Directional icons automatically mirror in RTL:

```typescript
// Mantine icons automatically mirror
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';

function NavigationExample() {
  return (
    <Group>
      {/* These icons automatically flip in RTL */}
      <IconArrowLeft />
      <IconArrowRight />
    </Group>
  );
}

// For custom SVG icons, use transform
function CustomArrowIcon() {
  const { dir } = useMantineTheme();

  return (
    <svg
      style={{
        transform: dir === 'rtl' ? 'scaleX(-1)' : 'scaleX(1)',
      }}
    >
      {/* SVG path */}
    </svg>
  );
}
```

**Image Asset Organization:**

```
public/
├── images/
│   ├── shared/           # Direction-neutral images
│   │   └── logo.svg
│   ├── ltr/              # LTR-specific images
│   │   ├── arrow-left.svg
│   │   └── arrow-right.svg
│   └── rtl/              # RTL-specific images
│       ├── arrow-left.svg
│       └── arrow-right.svg

// Helper to load direction-specific assets
function useDirectionalAsset(assetName: string) {
  const { dir } = useMantineTheme();
  return `/images/${dir}/${assetName}`;
}
```

### 4.4 Font Selection for Arabic

Arabic typography requires specific font considerations:

```typescript
// packages/ui/src/theme/typography.ts
export const typography = {
  // Font families with Arabic support
  fontFamily: `
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    'Roboto',
    'Oxygen',
    'Ubuntu',
    'Cantarell',
    'Fira Sans',
    'Droid Sans',
    'Helvetica Neue',
    'Arial',
    sans-serif,
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'Noto Sans Arabic', // Fallback for Arabic
    'Tajawal', // Modern Arabic font
  `.trim(),

  // Arabic-specific font weights
  fontFamilyArabic: `
    'Tajawal',
    'Noto Sans Arabic',
    'Arial',
    sans-serif
  `.trim(),
};

// Apply Arabic font for RTL locales
export function createLocalizedTheme(locale: string) {
  const isArabic = locale === "ar";

  return {
    fontFamily: isArabic ? typography.fontFamilyArabic : typography.fontFamily,
    headings: {
      fontFamily: isArabic ? typography.fontFamilyArabic : typography.fontFamily,
    },
  };
}
```

**Arabic Font Optimization:**

```typescript
// Font loading strategy
export function useLocalizedFonts() {
  const locale = useLocale();

  useEffect(() => {
    // Load Tajawal font for Arabic
    if (locale === "ar") {
      const link = document.createElement("link");
      link.href = "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  }, [locale]);
}
```

---

## 5. Theme Customization API

### 5.1 Theme Override Mechanism

Mantine provides multiple ways to override the theme:

**1. Global Theme Override (Provider Level):**

```typescript
// apps/frontend/src/components/Providers.tsx
import { createTheme, MantineProvider } from '@mantine/core';

const customTheme = createTheme({
  colors: {
    customBlue: ['#E7F5FF', '#BEE3F8', '#90CDF4', '#63B3ED'],
  },
  primaryColor: 'customBlue',
  fontFamily: 'Inter, sans-serif',
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={customTheme}>
      {children}
    </MantineProvider>
  );
}
```

**2. Component-Level Override:**

```typescript
import { Button, Paper } from '@mantine/core';

function Example() {
  return (
    <>
      {/* Override styles for specific component instances */}
      <Button
        styles={(theme) => ({
          root: {
            backgroundColor: theme.colors.blue[6],
            '&:hover': {
              backgroundColor: theme.colors.blue[7],
            },
          },
        })}
      >
        Custom Button
      </Button>

      {/* Use styles API for component instances */}
      <Paper
        shadow="md"
        p="md"
        styles={{
          root: {
            border: '2px solid red',
          },
        }}
      >
        Custom Paper
      </Paper>
    </>
  );
}
```

**3. Style Props Override:**

```typescript
// Mantine's style props API for inline styling
import { Box, Container, Text } from '@mantine/core';

function StylePropsExample() {
  return (
    <Box
      m="xl"
      p="lg"
      bg="blue.0"
      c="blue.9"
    >
      <Text
        size="xl"
        weight={700}
        ta="center"
      >
        Styled Text
      </Text>
    </Box>
  );
}
```

### 5.2 Component-Level Theme Customization

Use Mantine's Styles API for component-level customization:

```typescript
import { Button } from '@mantine/core';

// Define custom button variants
export const PrimaryButton = ({ children, ...props }: ButtonProps) => {
  const { classes, cx } = useStyles();

  return (
    <Button
      classNames={{
        root: classes.primaryButton,
        leftIcon: classes.icon,
        label: classes.label,
      }}
      {...props}
    >
      {children}
    </Button>
  );
};

const useStyles = createStyles((theme) => ({
  primaryButton: {
    backgroundColor: theme.colors.blue[6],
    '&:hover': {
      backgroundColor: theme.colors.blue[7],
    },
    '&:active': {
      backgroundColor: theme.colors.blue[8],
    },
  },
  icon: {
    marginRight: theme.spacing.md,
  },
  label: {
    fontWeight: 600,
  },
}));
```

### 5.3 Slot-Based Customization

Mantine's Slots API provides fine-grained control over component internals:

```typescript
// Advanced customization using Slots API
import { Input } from '@mantine/core';

function CustomInput() {
  return (
    <Input
      placeholder="Custom input"
      styles={(theme) => ({
        input: {
          '&:focus': {
            borderColor: theme.colors.blue[5],
          },
        },
        rightSection: {
          backgroundColor: theme.colors.gray[0],
        },
        wrapper: {
          marginBottom: theme.spacing.md,
        },
      })}
      rightSection={<IconSearch size={16} />}
    />
  );
}

// All available slots for Input:
// - wrapper: Outer wrapper element
// - input: The input element itself
// - section: Left/right sections
// - error: Error message container
// - description: Description text container
// - label: Label element
```

### 5.4 Theme Generator Utilities

Create utility functions for generating theme variants:

```typescript
// packages/ui/src/theme/generators.ts
export function generateBrandTheme(config: {
  primaryColor: string[];
  secondaryColor?: string[];
  borderRadius?: number;
  fontFamily?: string;
}): MantineTheme {
  const { primaryColor, secondaryColor, borderRadius, fontFamily } = config;

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      brand: primaryColor,
      ...(secondaryColor && { brandSecondary: secondaryColor }),
    },
    primaryColor: "brand",
    radius: {
      ...baseTheme.radius,
      ...(borderRadius && {
        DEFAULT: borderRadius,
        sm: borderRadius * 0.5,
        lg: borderRadius * 1.5,
        xl: borderRadius * 2,
      }),
    },
    ...(fontFamily && {
      fontFamily,
      headings: { fontFamily },
    }),
  };
}

// Usage
const masafhTheme = generateBrandTheme({
  primaryColor: orangePalette,
  secondaryColor: bluePalette,
  borderRadius: 12,
  fontFamily: "Tajawal, sans-serif",
});

// Dark mode theme generator
export function generateDarkTheme(baseTheme: MantineTheme): MantineTheme {
  return {
    ...baseTheme,
    colors: Object.entries(baseTheme.colors).reduce(
      (acc, [name, shades]) => ({
        ...acc,
        [name]: shades.map((shade) => adjustBrightness(shade, -20)),
      }),
      {},
    ),
  };
}
```

---

## 6. Implementation Guide

### 6.1 MantineProvider Configuration

Complete provider setup with all theme options:

```typescript
// apps/frontend/src/components/Providers.tsx
// Note: "use client" directive is optional in TanStack Start (client-side by default)

import {
  createTheme,
  MantineProvider,
  MantineTheme,
  DirectionProvider,
  CSSVariablesResolver,
} from '@mantine/core';
import { useLocale } from 'next-intl';
import { useTenantConfig } from '@agenticverdict/config';
import type { ReactNode } from 'react';

// CSS variables resolver for custom properties
const cssVariablesResolver: CSSVariablesResolver = {
  variables: {
    'my-custom-variable': 'value',
  },
  dark: {
    'my-custom-variable': 'dark-value',
  },
  light: {
    'my-custom-variable': 'light-value',
  },
};

// Create theme with all customizations
export function createAppTheme(brandTheme?: MantineTheme) {
  return createTheme({
    // Primary colors with WCAG AA contrast
    primaryShade: { light: 6, dark: 5 },

    // Font family with Arabic support
    fontFamily: `
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'Fira Sans',
      'Droid Sans',
      'Helvetica Neue',
      'Arial',
      sans-serif,
      'Apple Color Emoji',
      'Segoe UI Emoji',
      'Segoe UI Symbol',
      'Noto Sans Arabic',
      'Tajawal',
    `.trim(),

    // Headings font family
    headings: {
      fontFamily: `
        -apple-system,
        BlinkMacSystemFont,
        'Segoe UI',
        'Roboto',
        'Oxygen',
        'Ubuntu',
        'Cantarell',
        'Fira Sans',
        'Droid Sans',
        'Helvetica Neue',
        'Arial',
        sans-serif,
        'Noto Sans Arabic',
        'Tajawal',
      `.trim(),
      sizes: {
        h1: { fontSize: '34px', fontWeight: 700, lineHeight: 1.3 },
        h2: { fontSize: '26px', fontWeight: 700, lineHeight: 1.35 },
        h3: { fontSize: '22px', fontWeight: 700, lineHeight: 1.4 },
        h4: { fontSize: '18px', fontWeight: 700, lineHeight: 1.45 },
        h5: { fontSize: '16px', fontWeight: 600, lineHeight: 1.5 },
        h6: { fontSize: '14px', fontWeight: 600, lineHeight: 1.5 },
      },
    },

    // Border radius scale
    radius: {
      xs: 2,
      sm: 4,
      md: 8,
      lg: 16,
      xl: 32,
    },

    // Spacing scale
    spacing: {
      xs: 10,
      sm: 12,
      md: 16,
      lg: 20,
      xl: 24,
    },

    // Breakpoints
    breakpoints: {
      xs: '36em',
      sm: '48em',
      md: '62em',
      lg: '75em',
      xl: '88em',
    },

    // Cursor type
    cursorType: 'pointer',

    // Merge with brand theme if provided
    ...brandTheme,
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const config = useTenantConfig();
  const theme = createAppTheme(config.branding.theme);

  return (
    <DirectionProvider initialDirection={dir}>
      <MantineProvider
        theme={theme}
        defaultColorScheme="auto"
        cssVariablesResolver={cssVariablesResolver}
        withGlobalStyles
        withNormalizeCSS
      >
        {children}
      </MantineProvider>
    </DirectionProvider>
  );
}
```

### 6.2 DirectionProvider Setup

Complete RTL/LTR setup with locale detection:

```typescript
// apps/frontend/src/i18n/config.ts
export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// RTL language mapping (extensible for future RTL languages)
export const rtlLocales: Locale[] = ['ar', 'he', 'ur', 'fa']; // Hebrew, Urdu, Persian

export function isRTLLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

// Direction resolution
export function getDirection(locale: Locale): 'ltr' | 'rtl' {
  return isRTLLocale(locale) ? 'rtl' : 'ltr';
}

// apps/frontend/src/components/Providers.tsx (enhanced)
export function Providers({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const dir = getDirection(locale as Locale);
  const config = useTenantConfig();
  const theme = createAppTheme(config.branding.theme);

  return (
    <DirectionProvider initialDirection={dir}>
      <MantineProvider theme={theme} defaultColorScheme="auto">
        {children}
      </MantineProvider>
    </DirectionProvider>
  );
}
```

### 6.3 Theme CSS Variables

Mantine generates CSS variables automatically, but you can add custom ones:

```css
/* apps/frontend/src/styles/theme.css */
:root {
  /* Custom brand colors */
  --brand-primary: #3182ce;
  --brand-secondary: #718096;
  --brand-accent: #38b2ac;

  /* Custom spacing */
  --spacing-section-vertical: 80px;
  --spacing-section-horizontal: 120px;

  /* Custom animations */
  --transition-fast: 150ms;
  --transition-normal: 200ms;
  --transition-slow: 300ms;

  /* Custom z-indexes */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}

/* Dark mode overrides */
[data-mantine-color-scheme="dark"] {
  --brand-primary: #4d94ff;
  --brand-secondary: #a0aec0;
  --brand-accent: #4fd1c5;
}

/* RTL-specific adjustments */
[dir="rtl"] {
  --spacing-inline-start: 16px;
  --spacing-inline-end: 16px;
}

[dir="ltr"] {
  --spacing-inline-start: 16px;
  --spacing-inline-end: 16px;
}
```

**Using Custom CSS Variables in Components:**

```typescript
import { Box } from '@mantine/core';

function CustomBox() {
  return (
    <Box
      sx={(theme) => ({
        backgroundColor: 'var(--brand-primary)',
        padding: 'var(--spacing-section-vertical)',
        transition: `all var(--transition-normal) ease-in-out`,
      })}
    >
      Content
    </Box>
  );
}
```

### 6.4 Theme Switching Implementation

Complete theme switching with persistence:

```typescript
// apps/frontend/src/hooks/use-theme.ts
import { useMantineColorScheme } from '@mantine/core';
import { useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'agenticverdict-theme';
const BRAND_STORAGE_KEY = 'agenticverdict-brand-theme';

export function useTheme() {
  const mantineColorScheme = useMantineColorScheme();
  const [customBrand, setCustomBrand] = useState<string | null>(null);

  // Load custom brand theme on mount
  useEffect(() => {
    const savedBrand = localStorage.getItem(BRAND_STORAGE_KEY);
    if (savedBrand) {
      setCustomBrand(savedBrand);
    }
  }, []);

  const setColorScheme = (scheme: 'light' | 'dark' | 'auto') => {
    mantineColorScheme.setColorScheme(scheme);
    localStorage.setItem(THEME_STORAGE_KEY, scheme);
  };

  const setBrandTheme = (brandId: string) => {
    setCustomBrand(brandId);
    localStorage.setItem(BRAND_STORAGE_KEY, brandId);
  };

  const resetBrandTheme = () => {
    setCustomBrand(null);
    localStorage.removeItem(BRAND_STORAGE_KEY);
  };

  return {
    colorScheme: mantineColorScheme.colorScheme,
    setColorScheme,
    brandTheme: customBrand,
    setBrandTheme,
    resetBrandTheme,
  };
}

// Usage in component
export function ThemeSwitcher() {
  const { colorScheme, setColorScheme } = useTheme();

  return (
    <Group>
      <Button onClick={() => setColorScheme('light')}>Light</Button>
      <Button onClick={() => setColorScheme('dark')}>Dark</Button>
      <Button onClick={() => setColorScheme('auto')}>Auto</Button>
    </Group>
  );
}
```

**Theme Switching with Animation:**

```typescript
// apps/frontend/src/components/layout/ThemeSwitcher.tsx
import {
  ActionIcon,
  useMantineColorScheme,
  useMantineTheme,
  Tooltip
} from '@mantine/core';
import { IconSun, IconMoon, IconContrast } from '@tabler/icons-react';

export function ThemeSwitcher() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  const icons = {
    light: <IconSun size={18} stroke={1.5} />,
    dark: <IconMoon size={18} stroke={1.5} />,
    auto: <IconContrast size={18} stroke={1.5} />,
  };

  return (
    <Tooltip label={`Current: ${colorScheme} mode`}>
      <ActionIcon
        variant="default"
        size="lg"
        radius="md"
        onClick={() => {
          const nextScheme = colorScheme === 'light' ? 'dark' : 'light';
          setColorScheme(nextScheme);
        }}
        styles={(theme) => ({
          root: {
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          },
        })}
      >
        {icons[colorScheme]}
      </ActionIcon>
    </Tooltip>
  );
}
```

---

## 7. Code Examples (Mantine v9)

### 7.1 Complete Theme Setup

```typescript
// packages/ui/src/theme/index.ts
import { createTheme, MantineColorsTuple } from "@mantine/core";

// Define color palette
const blue: MantineColorsTuple = [
  "#e7f5ff",
  "#bee3f8",
  "#90cdf4",
  "#63b3ed",
  "#4299e1",
  "#3182ce",
  "#2b6cb0",
  "#2c5282",
  "#2a4365",
  "#1a365d",
];

const orange: MantineColorsTuple = [
  "#fff5ed",
  "#fed7aa",
  "#fdba74",
  "#fb923c",
  "#f97316",
  "#ea580c",
  "#c2410c",
  "#9a3412",
  "#7c2d12",
  "#431407",
];

// Base theme
const baseTheme = createTheme({
  colors: {
    blue,
    orange,
  },
  primaryColor: "blue",
  fontFamily: "Inter, sans-serif",
});

// Light mode theme
export const lightTheme = createTheme(baseTheme, {
  primaryShade: { light: 6, dark: 4 },
});

// Dark mode theme
export const darkTheme = createTheme(baseTheme, {
  primaryShade: { light: 6, dark: 5 },
});

// Brand themes
export const masafhTheme = createTheme(lightTheme, {
  colors: {
    brand: orange,
  },
  primaryColor: "brand",
});

export default {
  light: lightTheme,
  dark: darkTheme,
  masafh: masafhTheme,
};
```

### 7.2 Multi-Tenant Theme Integration

```typescript
// packages/ui/src/hooks/use-tenant-theme.ts
import { useMantineTheme } from '@mantine/core';
import { useTenantConfig } from '@agenticverdict/config';

export function useTenantTheme() {
  const mantineTheme = useMantineTheme();
  const config = useTenantConfig();

  // Get brand-specific colors
  const getBrandColor = (shade: number) => {
    const brandColor = config.branding.customColors?.primary;
    if (brandColor) {
      return brandColor[shade];
    }
    return mantineTheme.colors.blue[shade];
  };

  // Get brand-specific logo
  const getBrandLogo = () => {
    const colorScheme = mantineTheme.colorScheme;
    if (config.branding.logoUrl) {
      return config.branding.logoUrl;
    }
    return colorScheme === 'dark'
      ? '/logos/default-dark.svg'
      : '/logos/default-light.svg';
  };

  return {
    getBrandColor,
    getBrandLogo,
    themeId: config.branding.themeId,
  };
}

// Usage in component
export function BrandHeader() {
  const { getBrandLogo } = useTenantTheme();

  return (
    <header>
      <img src={getBrandLogo()} alt="Brand Logo" />
    </header>
  );
}
```

### 7.3 Arabic RTL Theming

```typescript
// packages/ui/src/components/ArabicText.tsx
import { Text, useMantineTheme } from '@mantine/core';
import { useLocale } from 'next-intl';

export function ArabicText({ children, ...props }: TextProps) {
  const theme = useMantineTheme();
  const locale = useLocale();
  const isArabic = locale === 'ar';

  return (
    <Text
      {...props}
      sx={(theme) => ({
        fontFamily: isArabic
          ? `'Tajawal', 'Noto Sans Arabic', ${theme.fontFamily}`
          : theme.fontFamily,
        direction: isArabic ? 'rtl' : 'ltr',
        textAlign: isArabic ? 'right' : 'left',
        fontWeight: isArabic ? 500 : 400, // Arabic fonts need more weight
        lineHeight: isArabic ? 1.6 : 1.4, // Arabic needs more line height
      })}
    >
      {children}
    </Text>
  );
}
```

### 7.4 Dynamic Theme Switching

```typescript
// apps/frontend/src/components/DynamicThemeProvider.tsx
// Note: "use client" directive is optional in TanStack Start (client-side by default)

import {
  MantineProvider,
  createTheme,
  useMantineColorScheme,
  CSSVariablesResolver
} from '@mantine/core';
import { useTenantConfig } from '@agenticverdict/config';
import { useEffect } from 'react';

// Custom CSS variables resolver
const themeResolver: CSSVariablesResolver = {
  variables: {
    '--app-font-size': '16px',
    '--app-border-radius': '8px',
  },
  dark: {
    '--app-font-size': '16px',
    '--app-border-radius': '8px',
  },
  light: {
    '--app-font-size': '16px',
    '--app-border-radius': '8px',
  },
};

export function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme } = useMantineColorScheme();
  const config = useTenantConfig();

  // Create dynamic theme based on tenant config
  const theme = createTheme({
    colors: {
      ...config.branding.customColors,
    },
    primaryColor: config.branding.themeId,
    fontFamily: config.localization.language === 'ar'
      ? `'Tajawal', sans-serif`
      : `'Inter', sans-serif`,
  });

  // Apply CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--app-primary-color',
      config.branding.customColors?.primary?.[6] || '#3182ce'
    );
  }, [config]);

  return (
    <MantineProvider
      theme={theme}
      defaultColorScheme={colorScheme}
      cssVariablesResolver={themeResolver}
    >
      {children}
    </MantineProvider>
  );
}
```

---

## 8. Migration Guide

### 8.1 Migrating from v6 to v7

If you're upgrading from Mantine v6 to v7, note these theme changes:

**Breaking Changes:**

```typescript
// v6 (deprecated)
const theme = {
  primaryColor: "blue",
  colorScheme: "light",
  fontFamily: "sans-serif",
};

// v7 (current)
const theme = createTheme({
  primaryColor: "blue",
  defaultColorScheme: "light",
  fontFamily: "sans-serif",
});
```

**Color Palette Changes:**

```typescript
// v6: Colors were objects
theme.colors.blue.light = "#90cdf4";
theme.colors.blue.dark = "#2c5282";

// v7: Colors are arrays (10 shades)
theme.colors.blue[2] = "#90cdf4";
theme.colors.blue[7] = "#2c5282";
```

**Primary Shade Configuration:**

```typescript
// v6: Single shade
primaryShade: 6,

// v7: Separate shades for light/dark
primaryShade: { light: 6, dark: 5 },
```

### 8.2 Adding New Languages

To add new language support with RTL:

```typescript
// 1. Add locale to i18n config
export const locales = ["en", "ar", "he"] as const; // Add Hebrew

// 2. Update RTL mapping
export const rtlLocales: Locale[] = ["ar", "he"]; // Add Hebrew

// 3. Add translation file
packages / i18n / src / locales / he / common.json;

// 4. Add Hebrew-specific font if needed
const hebrewTheme = createTheme({
  fontFamily: `'Heebo', ${theme.fontFamily}`,
});

// 5. No code changes needed in components - RTL is automatic
```

---

## 9. Best Practices

### 9.1 Theme Organization

1. **Keep themes modular**: Separate base, mode, and brand themes
2. **Use TypeScript**: Type-safe theme definitions prevent errors
3. **Document custom colors**: Add comments explaining color usage
4. **Version control**: Track theme changes with semantic versioning

### 9.2 Performance Optimization

1. **Lazy load brand themes**: Load only the tenant's theme
2. **Cache theme computations**: Memoize expensive theme calculations
3. **Use CSS variables**: Leverage browser optimizations
4. **Avoid inline styles**: Use Mantine's Styles API instead

### 9.3 Accessibility

1. **Maintain contrast**: Ensure WCAG AA compliance (4.5:1 minimum)
2. **Test with tools**: Use axe DevTools and Lighthouse
3. **Support keyboard navigation**: Ensure all components are keyboard accessible
4. **Respect user preferences**: Support prefers-reduced-motion

### 9.4 Multi-Tenant Considerations

1. **Isolate themes**: Prevent tenant themes from leaking
2. **Validate colors**: Ensure tenant colors meet contrast standards
3. **Provide defaults**: Always have fallback theme values
4. **Document customization**: Guide partners on theme customization

---

## 10. Troubleshooting

### 10.1 Common Issues

**Issue: Theme not updating after TenantConfig change**

```typescript
// Solution: Force theme remount
const key = `${config.tenantId}-${config.branding.themeId}`;
<MantineProvider key={key} theme={theme}>
  {children}
</MantineProvider>
```

**Issue: RTL layout broken**

```typescript
// Solution: Ensure DirectionProvider wraps MantineProvider
<DirectionProvider initialDirection={dir}>
  <MantineProvider>
    {children}
  </MantineProvider>
</DirectionProvider>
```

**Issue: Dark mode flickering on page load**

```typescript
// Solution: Add no-transition class initially
useEffect(() => {
  document.body.classList.add("no-transition");
  // ... apply theme
  requestAnimationFrame(() => {
    document.body.classList.remove("no-transition");
  });
}, []);
```

---

## Appendix A: Theme Configuration Reference

### A.1 Complete Theme Options

```typescript
interface FullThemeOptions {
  // Colors
  colors: Record<string, MantineColorsTuple>;
  primaryColor: string;
  primaryShade: number | { light: number; dark: number };

  // Typography
  fontFamily: string;
  fontFamilyMonospace: string;
  headings: {
    fontFamily: string;
    sizes: Record<string, { fontSize: string; fontWeight: number; lineHeight: number }>;
  };

  // Spacing
  spacing: Record<string, number>;

  // Breakpoints
  breakpoints: Record<string, string | number>;

  // Border radius
  radius: Record<string, number>;

  // Line heights
  lineHeight: Record<string, number>;

  // Shadows
  shadows: Record<string, string>;

  // Z-indexes
  zIndex: Record<string, number>;

  // Other
  dir: "ltr" | "rtl";
  cursorType: "pointer" | "default";
  respectReducedMotion: boolean;
  focusRing: "auto" | "always" | "never";
  defaultGradient: Record<string, any>;
}
```

### A.2 Brand Theme Schema

```typescript
interface BrandThemeConfig {
  id: string;
  name: string;

  // Visual identity
  logo?: {
    light: string;
    dark: string;
    icon?: string;
  };

  // Colors
  colors: {
    primary: MantineColorsTuple;
    secondary?: MantineColorsTuple;
    accent?: MantineColorsTuple;
    success?: MantineColorsTuple;
    warning?: MantineColorsTuple;
    error?: MantineColorsTuple;
  };

  // Typography
  fontFamily?: string;
  headingFont?: string;

  // Spacing
  scale?: number; // Multiplier for spacing

  // Border radius
  borderRadius?: Partial<typeof baseTheme.radius>;

  // White-label options
  whiteLabel?: {
    hideDefaultBranding: boolean;
    customFooter?: string;
    customSupportUrl?: string;
  };
}
```

---

## Appendix B: Resources

### B.1 Official Documentation

- **Mantine v9 Theming**: https://mantine.dev/theming/theming-provider/
- **Mantine v9 Styles API**: https://mantine.dev/styles/styles-api/
- **Mantine v9 CSS Variables**: https://mantine.dev/theming/css-variables/
- **Mantine v9 RTL Support**: https://mantine.dev/guides/rtl/

### B.2 Design System Resources

- **W3C Design Tokens**: https://tr.designtokens.org/
- **WCAG 2.1 Contrast Guidelines**: https://www.w3.org/WAG/WCAG21/Understanding/contrast-minimum.html
- **Material Design Color Tool**: https://material.io/resources/color/
- **Adobe Color**: https://color.adobe.com/

### B.3 Related Specifications

- **Design Tokens**: `/docs/architecture/ui/02-design-system-specification/design-tokens.md`
- **Technology Evaluation**: `/docs/architecture/ui/01-research-findings/technology-evaluation.md`
- **Implementation Details**: `/docs/architecture/ui/UI_IMPLEMENTATION_DETAILS.md`
- **Business Requirements**: `/docs/architecture/ui/BUSINESS_REQUIREMENTS.md`

---

**Document Status**: ✅ Active  
**Next Review**: After UI foundation phase completion  
**Maintainer**: UI/UX Team  
**Contributors**: Architecture Team, Development Team

---

_This theming specification is part of the AgenticVerdict Design System. For component-level implementation, refer to the component documentation in Storybook (when implemented)._
