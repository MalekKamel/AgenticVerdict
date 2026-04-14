# Design Tokens Specification

**Document Version:** 1.0.0  
**Last Updated:** April 11, 2026  
**Status:** Active Specification  
**Related Docs:** [Design System Landscape Research](../01-research-findings/design-system-landscape.md) | [Component Specification](./component-specification.md)

---

## Table of Contents

1. [Token Architecture Overview](#token-architecture-overview)
2. [Token Categories](#token-categories)
3. [Multi-Tenant Token System](#multi-tenant-token-system)
4. [Token Implementation Guide](#token-implementation-guide)
5. [Code Examples](#code-examples)
6. [Migration Guide](#migration-guide)

---

## 1. Token Architecture Overview

### 1.1 W3C Design Tokens Community Group Specification

AgenticVerdict design tokens follow the [W3C Design Tokens Community Group](https://www.design-tokens.org/) specification, ensuring interoperability and standardization. This approach provides:

- **Tool-agnostic format**: Tokens can be transformed to any target platform (CSS, Sass, JavaScript, Swift, etc.)
- **Hierarchical organization**: Supports token inheritance and composition
- **Type safety**: TypeScript integration ensures compile-time token validation
- **Runtime theming**: Dynamic token injection for multi-tenant scenarios

**Token Structure:**

```typescript
interface DesignToken {
  $value: string | number;
  $type?: "color" | "dimension" | "fontFamily" | "fontSize" | "duration" | "cubicBezier";
  $description?: string;
  $extensions?: Record<string, unknown>;
}
```

### 1.2 Three-Tier Token Hierarchy

The token system implements a three-tier hierarchy to balance consistency with flexibility:

```
Global Tokens (Primitives)
    ↓
Brand Tokens (Semantic)
    ↓
Component Tokens (Specific)
```

**Global Tokens** (Primitives):

- Raw values without semantic meaning
- Technology-agnostic
- Example: `#2196F3`, `1rem`, `500ms`

**Brand Tokens** (Semantic):

- Applied with semantic meaning
- Reflect brand personality
- Example: `primary`, `secondary`, `warning`

**Component Tokens** (Specific):

- Tailored to specific component needs
- Reference semantic tokens
- Example: `button-primary-bg`, `input-border-color`

### 1.3 CSS Custom Properties Approach

We use CSS custom properties (CSS variables) as the implementation mechanism:

**Benefits:**

- Runtime updates without page reload
- Cascade and inheritance support
- Browser dev tools inspection
- No build step required for token changes
- Native dark mode support

**Implementation:**

```css
:root {
  /* Global token */
  --color-blue-700: #1976d2;

  /* Brand token */
  --color-primary: var(--color-blue-700);

  /* Component token */
  --button-primary-bg: var(--color-primary);
}

[data-theme="dark"] {
  --color-primary: #64b5f6;
}
```

---

## 2. Token Categories

### 2.1 Color Tokens

Color tokens follow the WCAG 2.1 AA accessibility requirements (4.5:1 contrast ratio for normal text, 3:1 for large text).

**Global Color Palette:**

```typescript
// packages/ui/src/tokens/colors/global.ts
export const globalColorTokens = {
  blue: {
    50: "#E3F2FD",
    100: "#BBDEFB",
    200: "#90CAF9",
    300: "#64B5F6",
    400: "#42A5F5",
    500: "#2196F3",
    600: "#1E88E5",
    700: "#1976D2",
    800: "#1565C0",
    900: "#0D47A1",
  },
  gray: {
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#EEEEEE",
    300: "#E0E0E0",
    400: "#BDBDBD",
    500: "#9E9E9E",
    600: "#757575",
    700: "#616161",
    800: "#424242",
    900: "#212121",
  },
  red: {
    50: "#FFEBEE",
    100: "#FFCDD2",
    500: "#F44336",
    700: "#D32F2F",
  },
  green: {
    50: "#E8F5E9",
    100: "#C8E6C9",
    500: "#4CAF50",
    700: "#388E3C",
  },
  yellow: {
    50: "#FFFDE7",
    100: "#FFF9C4",
    500: "#FFC107",
    700: "#FFA000",
  },
} as const;
```

**Semantic Color Tokens:**

```typescript
// packages/ui/src/tokens/colors/semantic.ts
export const semanticColorTokens = {
  // Brand colors
  primary: {
    light: "var(--color-blue-600)",
    DEFAULT: "var(--color-blue-700)",
    dark: "var(--color-blue-800)",
    contrast: "#FFFFFF", // Text color on primary background
  },

  secondary: {
    light: "var(--color-gray-400)",
    DEFAULT: "var(--color-gray-600)",
    dark: "var(--color-gray-700)",
    contrast: "#FFFFFF",
  },

  // Feedback colors
  success: {
    light: "var(--color-green-500)",
    DEFAULT: "var(--color-green-700)",
    dark: "var(--color-green-800)",
    contrast: "#FFFFFF",
  },

  warning: {
    light: "var(--color-yellow-500)",
    DEFAULT: "var(--color-yellow-700)",
    dark: "var(--color-yellow-800)",
    contrast: "#212121",
  },

  error: {
    light: "var(--color-red-500)",
    DEFAULT: "var(--color-red-700)",
    dark: "var(--color-red-800)",
    contrast: "#FFFFFF",
  },

  info: {
    light: "var(--color-blue-400)",
    DEFAULT: "var(--color-blue-600)",
    dark: "var(--color-blue-800)",
    contrast: "#FFFFFF",
  },

  // Neutral colors
  background: {
    DEFAULT: "#FFFFFF",
    secondary: "var(--color-gray-50)",
    tertiary: "var(--color-gray-100)",
  },

  surface: {
    DEFAULT: "#FFFFFF",
    elevated: "var(--color-gray-50)",
    overlay: "rgba(0, 0, 0, 0.5)",
  },

  border: {
    DEFAULT: "var(--color-gray-200)",
    subtle: "var(--color-gray-100)",
    strong: "var(--color-gray-300)",
  },

  text: {
    primary: "var(--color-gray-900)",
    secondary: "var(--color-gray-600)",
    tertiary: "var(--color-gray-500)",
    disabled: "var(--color-gray-400)",
    inverse: "#FFFFFF",
  },
} as const;
```

**Dark Mode Tokens:**

```typescript
// packages/ui/src/tokens/colors/dark.ts
export const darkModeTokens = {
  primary: {
    light: "var(--color-blue-500)",
    DEFAULT: "var(--color-blue-400)",
    dark: "var(--color-blue-300)",
    contrast: "#212121",
  },

  background: {
    DEFAULT: "#1A1A1A",
    secondary: "#2D2D2D",
    tertiary: "#404040",
  },

  surface: {
    DEFAULT: "#2D2D2D",
    elevated: "#404040",
    overlay: "rgba(0, 0, 0, 0.7)",
  },

  border: {
    DEFAULT: "var(--color-gray-700)",
    subtle: "var(--color-gray-800)",
    strong: "var(--color-gray-600)",
  },

  text: {
    primary: "#FFFFFF",
    secondary: "var(--color-gray-300)",
    tertiary: "var(--color-gray-400)",
    disabled: "var(--color-gray-600)",
    inverse: "var(--color-gray-900)",
  },
} as const;
```

### 2.2 Typography Tokens

**Font Families:**

```typescript
// packages/ui/src/tokens/typography/fonts.ts
export const fontFamilyTokens = {
  // Primary font (Latin script)
  base: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica",
    "Arial",
    "sans-serif",
  ].join(", "),

  // Headings font (supports Arabic)
  heading: [
    "Cairo", // Arabic-friendly font
    "Inter",
    "-apple-system",
    "sans-serif",
  ].join(", "),

  // Monospace for code
  monospace: ["JetBrains Mono", "Fira Code", "Consolas", "Monaco", "monospace"].join(", "),
} as const;

// Arabic-specific font override
export const arabicFontOverride = {
  base: [
    "Tajawal", // Modern Arabic font
    "Cairo",
    "Arial",
    "sans-serif",
  ].join(", "),

  heading: ["Cairo", "Tajawal", "sans-serif"].join(", "),
} as const;
```

**Font Sizes (Type Scale):**

```typescript
// packages/ui/src/tokens/typography/sizes.ts
export const fontSizeTokens = {
  xs: "0.75rem", // 12px
  sm: "0.875rem", // 14px
  base: "1rem", // 16px
  lg: "1.125rem", // 18px
  xl: "1.25rem", // 20px
  "2xl": "1.5rem", // 24px
  "3xl": "1.875rem", // 30px
  "4xl": "2.25rem", // 36px
  "5xl": "3rem", // 48px
  "6xl": "3.75rem", // 60px
} as const;
```

**Font Weights:**

```typescript
export const fontWeightTokens = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;
```

**Line Heights:**

```typescript
export const lineHeightTokens = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
} as const;
```

**Letter Spacing:**

```typescript
export const letterSpacingTokens = {
  tighter: "-0.05em",
  tight: "-0.025em",
  normal: "0",
  wide: "0.025em",
  wider: "0.05em",
  widest: "0.1em",
} as const;
```

### 2.3 Spacing Tokens

**Spacing Scale (4px base unit):**

```typescript
// packages/ui/src/tokens/spacing/scale.ts
export const spacingScaleTokens = {
  0: "0",
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
  32: "8rem", // 128px
  40: "10rem", // 160px
  48: "12rem", // 192px
  56: "14rem", // 224px
  64: "16rem", // 256px
} as const;

// Semantic spacing aliases
export const spacingAliases = {
  xs: spacingScaleTokens[1], // 4px
  sm: spacingScaleTokens[2], // 8px
  md: spacingScaleTokens[4], // 16px
  lg: spacingScaleTokens[6], // 24px
  xl: spacingScaleTokens[8], // 32px
  "2xl": spacingScaleTokens[12], // 48px
  "3xl": spacingScaleTokens[16], // 64px
  "4xl": spacingScaleTokens[24], // 96px
} as const;
```

**RTL-Aware Spacing:**

```typescript
// Logical properties for RTL support
export const spacingLogical = {
  // Start (left in LTR, right in RTL)
  start: "var(--spacing-start)",

  // End (right in LTR, left in RTL)
  end: "var(--spacing-end)",

  // Block dimension (vertical in horizontal writing modes)
  block: "var(--spacing-block)",

  // Inline dimension (horizontal in horizontal writing modes)
  inline: "var(--spacing-inline)",
} as const;

// CSS implementation
/*
[dir="ltr"] {
  --spacing-start: var(--spacing-left);
  --spacing-end: var(--spacing-right);
}

[dir="rtl"] {
  --spacing-start: var(--spacing-right);
  --spacing-end: var(--spacing-left);
}
*/
```

### 2.4 Layout Tokens

**Breakpoints:**

```typescript
// packages/ui/src/tokens/layout/breakpoints.ts
export const breakpointTokens = {
  xs: "0px", // Mobile first
  sm: "640px", // Small tablets
  md: "768px", // Tablets
  lg: "1024px", // Small laptops
  xl: "1280px", // Desktops
  "2xl": "1536px", // Large screens
} as const;

// Mantine v9 breakpoint configuration
export const mantineBreakpoints = {
  xs: breakpointTokens.xs,
  sm: breakpointTokens.sm,
  md: breakpointTokens.md,
  lg: breakpointTokens.lg,
  xl: breakpointTokens.xl,
};
```

**Container Widths:**

```typescript
export const containerWidthTokens = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
  full: "100%",
} as const;
```

**Grid System:**

```typescript
export const gridTokens = {
  columns: 12,
  gutter: spacingScaleTokens[4], // 16px
  maxWidth: containerWidthTokens["2xl"],
} as const;
```

**Z-Index Scale:**

```typescript
export const zIndexTokens = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
  notification: 1700,
  max: 2147483647, // 32-bit integer max
} as const;
```

### 2.5 Border Tokens

**Border Radius:**

```typescript
// packages/ui/src/tokens/border/radius.ts
export const borderRadiusTokens = {
  none: "0",
  sm: "0.125rem", // 2px
  DEFAULT: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  "3xl": "1.5rem", // 24px
  full: "9999px", // Pill shape
} as const;
```

**Border Width:**

```typescript
export const borderWidthTokens = {
  none: "0",
  thin: "1px",
  DEFAULT: "1px",
  medium: "2px",
  thick: "3px",
} as const;
```

### 2.6 Shadow Tokens

**Elevation Scale:**

```typescript
// packages/ui/src/tokens/shadows/elevation.ts
export const shadowTokens = {
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  DEFAULT: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  md: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  lg: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  xl: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
  none: "none",
} as const;
```

**Brand-Specific Shadows (for multi-tenant theming):**

```typescript
export const brandShadowTokens = {
  primary: `0 4px 6px -1px rgba(var(--color-primary-rgb), 0.2)`,
  secondary: `0 4px 6px -1px rgba(var(--color-secondary-rgb), 0.2)`,
} as const;
```

### 2.7 Animation Tokens

**Duration:**

```typescript
// packages/ui/src/tokens/animation/duration.ts
export const durationTokens = {
  instant: "0ms",
  fast: "150ms",
  DEFAULT: "200ms",
  normal: "300ms",
  slow: "500ms",
  slower: "1000ms",
} as const;
```

**Easing Functions:**

```typescript
export const easingTokens = {
  linear: "linear",
  DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)", // ease-in-out
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  easeOut: "cubic-bezier(0, 0, 0.2, 1)",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
} as const;
```

**Common Animations:**

```typescript
export const animationTokens = {
  // Fade animations
  fadeIn: `fade-in ${durationTokens.DEFAULT} ${easingTokens.DEFAULT}`,
  fadeOut: `fade-out ${durationTokens.DEFAULT} ${easingTokens.DEFAULT}`,

  // Slide animations
  slideInUp: `slide-in-up ${durationTokens.normal} ${easingTokens.easeOut}`,
  slideInDown: `slide-in-down ${durationTokens.normal} ${easingTokens.easeOut}`,

  // Scale animations
  scaleIn: `scale-in ${durationTokens.fast} ${easingTokens.easeOut}`,
  scaleOut: `scale-out ${durationTokens.fast} ${easingTokens.easeIn}`,
} as const;
```

### 2.8 RTL-Specific Tokens

**Direction-Aware Properties:**

```typescript
// packages/ui/src/tokens/rtl/properties.ts
export const rtlTokens = {
  // Text alignment
  textAlignStart: "text-align-start", // left in LTR, right in RTL
  textAlignEnd: "text-align-end", // right in LTR, left in RTL

  // Physical to logical mapping
  marginStart: "margin-inline-start",
  marginEnd: "margin-inline-end",
  paddingStart: "padding-inline-start",
  paddingEnd: "padding-inline-end",

  // Border logical properties
  borderStart: "border-inline-start",
  borderEnd: "border-inline-end",

  // Position logical properties
  insetStart: "inset-inline-start",
  insetEnd: "inset-inline-end",
} as const;
```

**RTL Spacing Overrides:**

```typescript
// Arabic-specific spacing adjustments
export const arabicSpacingOverrides = {
  // Increase spacing for Arabic text (better readability)
  paragraph: "1.75rem", // vs 1.5rem for Latin
  heading: "1.25rem", // vs 1rem for Latin

  // Adjust letter spacing for Arabic
  letterSpacing: "0.02em",
} as const;
```

---

## 3. Multi-Tenant Token System

### 3.1 CompanyConfig Integration

The design token system integrates with `CompanyConfig` from `/packages/config/src/schemas/` to support multi-tenant theming:

```typescript
// packages/config/src/schemas/tenant-ui.schema.ts
import { z } from "zod";

export const TenantColorSchema = z.object({
  primary: z.string().regex(/^#[0-9A-F]{6}$/i),
  secondary: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  accent: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
});

export const TenantTypographySchema = z.object({
  fontFamily: z
    .object({
      base: z.string().optional(),
      heading: z.string().optional(),
    })
    .optional(),
  fontSize: z
    .object({
      base: z.string().optional(),
      heading: z.string().optional(),
    })
    .optional(),
});

export const TenantSpacingSchema = z.object({
  scale: z.record(z.string(), z.string()).optional(),
});

export const TenantBorderSchema = z.object({
  radius: z
    .object({
      sm: z.string().optional(),
      md: z.string().optional(),
      lg: z.string().optional(),
    })
    .optional(),
});

export const TenantUITokensSchema = z.object({
  colors: TenantColorSchema.optional(),
  typography: TenantTypographySchema.optional(),
  spacing: TenantSpacingSchema.optional(),
  borderRadius: TenantBorderSchema.optional(),
  customCSS: z.string().optional(),
});

export type TenantUITokens = z.infer<typeof TenantUITokensSchema>;

// Integration with CompanyConfig
export const CompanyConfigSchema = z.object({
  // ... existing fields
  ui: z
    .object({
      branding: z.object({
        logo: z.object({
          light: z.string().url(),
          dark: z.string().url(),
        }),
        favicon: z.string().url().optional(),
      }),
      tokens: TenantUITokensSchema.optional(),
    })
    .optional(),
});
```

### 3.2 Tenant-Specific Token Overrides

**Example: Masafh Theme Configuration:**

```typescript
// packages/config/src/tenants/masafh.theme.ts
import { TenantUITokens } from "./tenant-ui.schema";

export const masafhTokens: TenantUITokens = {
  colors: {
    primary: "#1E88E5", // Masafh blue
    secondary: "#43A047", // Green for success/fleet status
    accent: "#FFC107", // Warning color
  },
  typography: {
    fontFamily: {
      base: "Tajawal, sans-serif",
      heading: "Cairo, sans-serif",
    },
  },
  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
  },
  customCSS: `
    /* Masafh-specific adjustments */
    .dashboard-card {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(30, 136, 229, 0.15);
    }
  `,
};
```

**Example: Another Tenant Theme:**

```typescript
// packages/config/src/tenants/examplecorp.theme.ts
import { TenantUITokens } from "./tenant-ui.schema";

export const examplecorpTokens: TenantUITokens = {
  colors: {
    primary: "#FF5722", // Orange brand
    secondary: "#607D8B", // Blue-gray
    accent: "#00BCD4", // Cyan
  },
  typography: {
    fontFamily: {
      base: "Roboto, sans-serif",
      heading: "Montserrat, sans-serif",
    },
    fontSize: {
      base: "16px",
      heading: "18px",
    },
  },
  borderRadius: {
    sm: "2px",
    md: "4px",
    lg: "6px",
  },
};
```

### 3.3 Runtime Theme Injection

**Theme Loader Hook:**

```typescript
// apps/web/src/hooks/use-tenant-theme.ts
import { useQuery } from "@tanstack/react-query";
import { TenantUITokens } from "@agenticverdict/config";

export function useTenantTheme(tenantId: string) {
  return useQuery({
    queryKey: ["tenant-theme", tenantId],
    queryFn: async (): Promise<TenantUITokens> => {
      const response = await fetch(`/api/tenants/${tenantId}/theme`);
      if (!response.ok) {
        throw new Error("Failed to load tenant theme");
      }
      return response.json();
    },
    staleTime: Infinity, // Theme changes rarely
    cacheTime: Infinity,
  });
}
```

**Dynamic Theme Provider:**

```tsx
// apps/web/src/providers/dynamic-theme-provider.tsx
import { useEffect } from "react";
import { MantineProvider, MantineThemeOverride } from "@mantine/core";
import { useTenantTheme } from "../hooks/use-tenant-theme";
import { defaultTokens } from "@agenticverdict/ui/tokens";

interface DynamicThemeProviderProps {
  tenantId: string;
  children: React.ReactNode;
}

export function DynamicThemeProvider({ tenantId, children }: DynamicThemeProviderProps) {
  const { data: tenantTokens } = useTenantTheme(tenantId);

  useEffect(() => {
    if (!tenantTokens) return;

    // Apply CSS custom properties to root
    const root = document.documentElement;
    root.setAttribute("data-tenant", tenantId);

    // Apply custom CSS if provided
    if (tenantTokens.customCSS) {
      const styleId = "tenant-custom-css";
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;

      if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }

      styleElement.textContent = tenantTokens.customCSS;
    }
  }, [tenantTokens]);

  // Merge default tokens with tenant overrides
  const theme: MantineThemeOverride = {
    ...defaultTokens.mantineTheme,
    ...(tenantTokens?.colors && {
      colors: {
        brand: generateColorScale(tenantTokens.colors.primary),
      },
    }),
    ...(tenantTokens?.typography?.fontFamily && {
      fontFamily: tenantTokens.typography.fontFamily.base,
      headings: {
        fontFamily: tenantTokens.typography.fontFamily.heading,
      },
    }),
    ...(tenantTokens?.borderRadius && {
      radius: {
        xs: tenantTokens.borderRadius.sm,
        md: tenantTokens.borderRadius.md,
        lg: tenantTokens.borderRadius.lg,
      },
    }),
  };

  return <MantineProvider theme={theme}>{children}</MantineProvider>;
}

// Helper: Generate full color scale from primary color
function generateColorScale(primary: string): string[] {
  // Implementation uses color manipulation libraries
  // Returns array of 10 shades from light to dark
  return [
    lighten(primary, 0.5),
    lighten(primary, 0.4),
    lighten(primary, 0.3),
    lighten(primary, 0.2),
    lighten(primary, 0.1),
    primary,
    darken(primary, 0.1),
    darken(primary, 0.2),
    darken(primary, 0.3),
    darken(primary, 0.4),
  ];
}
```

### 3.4 White-Label Customization

**Logo Component:**

```tsx
// packages/ui/src/components/atoms/Logo/Logo.tsx
import { useTenantConfig } from "@agenticverdict/web/hooks/use-tenant-config";

interface LogoProps {
  variant?: "light" | "dark";
  height?: number;
  width?: number;
  className?: string;
}

export function Logo({ variant = "light", height = 32, className }: LogoProps) {
  const { branding } = useTenantConfig();
  const logoUrl = branding?.logo?.[variant] || `/logos/default-${variant}.svg`;

  return (
    <img
      src={logoUrl}
      alt="Company Logo"
      height={height}
      width={height * 2} // Assume 2:1 aspect ratio
      className={className}
    />
  );
}
```

**Favicon Injection:**

```tsx
// apps/web/src/routes/__root.tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useTenantConfig } from "../hooks/use-tenant-config";

export const Route = createFileRoute("/")({
  component: RootLayout,
});

function RootLayout() {
  const { branding } = useTenantConfig();

  return (
    <html>
      <head>
        <link rel="icon" href={branding?.favicon || "/favicon.ico"} />
      </head>
      <body>
        <Outlet />
      </body>
    </html>
  );
}
```

---

## 4. Token Implementation Guide

### 4.1 Mantine Theme Configuration

**Base Theme Configuration:**

```typescript
// packages/ui/src/tokens/mantine-theme.ts
import { MantineThemeOverride } from "@mantine/core";
import {
  fontFamilyTokens,
  fontSizeTokens,
  spacingScaleTokens,
  borderRadiusTokens,
  shadowTokens,
} from "./tokens";

export const mantineTheme: MantineThemeOverride = {
  // Color configuration
  colors: {
    brand: [
      "#E3F2FD", // 50
      "#BBDEFB", // 100
      "#90CAF9", // 200
      "#64B5F6", // 300
      "#42A5F5", // 400
      "#2196F3", // 500
      "#1E88E5", // 600
      "#1976D2", // 700
      "#1565C0", // 800
      "#0D47A1", // 900
    ],
    gray: [
      "#FAFAFA",
      "#F5F5F5",
      "#EEEEEE",
      "#E0E0E0",
      "#BDBDBD",
      "#9E9E9E",
      "#757575",
      "#616161",
      "#424242",
      "#212121",
    ],
  },

  // Primary color
  primaryColor: "brand",

  // Typography
  fontFamily: fontFamilyTokens.base,
  fontFamilyMonospace: fontFamilyTokens.monospace,
  headings: {
    fontFamily: fontFamilyTokens.heading,
    sizes: {
      h1: { fontSize: fontSizeTokens["5xl"], fontWeight: 700, lineHeight: 1.2 },
      h2: { fontSize: fontSizeTokens["4xl"], fontWeight: 700, lineHeight: 1.3 },
      h3: { fontSize: fontSizeTokens["3xl"], fontWeight: 600, lineHeight: 1.4 },
      h4: { fontSize: fontSizeTokens["2xl"], fontWeight: 600, lineHeight: 1.4 },
      h5: { fontSize: fontSizeTokens.xl, fontWeight: 600, lineHeight: 1.5 },
      h6: { fontSize: fontSizeTokens.lg, fontWeight: 600, lineHeight: 1.5 },
    },
  },

  // Spacing
  spacing: {
    xs: spacingScaleTokens[1], // 4px
    sm: spacingScaleTokens[2], // 8px
    md: spacingScaleTokens[4], // 16px
    lg: spacingScaleTokens[6], // 24px
    xl: spacingScaleTokens[8], // 32px
  },

  // Border radius
  radius: {
    xs: borderRadiusTokens.sm,
    sm: borderRadiusTokens.DEFAULT,
    md: borderRadiusTokens.md,
    lg: borderRadiusTokens.lg,
    xl: borderRadiusTokens.xl,
  },

  // Shadows
  shadowSizes: {
    xs: shadowTokens.xs,
    sm: shadowTokens.sm,
    md: shadowTokens.DEFAULT,
    lg: shadowTokens.lg,
    xl: shadowTokens.xl,
  },

  // Breakpoints
  breakpoints: {
    xs: "0px",
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
  },

  // Other settings
  defaultRadius: borderRadiusTokens.DEFAULT,
  cursorType: "pointer",
};
```

**Dark Mode Theme Override:**

```typescript
// packages/ui/src/tokens/mantine-theme-dark.ts
import { MantineThemeOverride } from "@mantine/core";
import { mantineTheme } from "./mantine-theme";
import { darkModeTokens } from "./tokens";

export const mantineDarkTheme: MantineThemeOverride = {
  ...mantineTheme,
  colors: {
    ...mantineTheme.colors,
    dark: [
      "#C1C2C5", // 50
      "#A6A7AB", // 100
      "#909296", // 200
      "#5C5F66", // 300
      "#373A40", // 400
      "#2C2E33", // 500
      "#25262B", // 600
      "#1A1B1E", // 700
      "#141517", // 800
      "#101113", // 900
    ],
  },

  // Dark mode specific overrides
  backgroundColor: darkModeTokens.background.DEFAULT,
  color: darkModeTokens.text.primary,
};
```

### 4.2 CSS Variable Usage

**Token to CSS Variable Mapping:**

```typescript
// packages/ui/src/tokens/css-variables.ts
import {
  globalColorTokens,
  semanticColorTokens,
  spacingScaleTokens,
  fontSizeTokens,
  borderRadiusTokens,
  shadowTokens,
} from "./tokens";

export function generateCSSVariables(): string {
  const variables: string[] = [];

  // Color tokens
  Object.entries(globalColorTokens).forEach(([colorName, shades]) => {
    Object.entries(shades).forEach(([shade, value]) => {
      variables.push(`--color-${colorName}-${shade}: ${value};`);
    });
  });

  // Semantic color tokens
  Object.entries(semanticColorTokens).forEach(([category, shades]) => {
    if (typeof shades === "object") {
      Object.entries(shades).forEach(([shade, value]) => {
        variables.push(`--color-${category}-${shade}: ${value};`);
      });
    } else {
      variables.push(`--color-${category}: ${shades};`);
    }
  });

  // Spacing tokens
  Object.entries(spacingScaleTokens).forEach(([key, value]) => {
    variables.push(`--spacing-${key}: ${value};`);
  });

  // Typography tokens
  Object.entries(fontSizeTokens).forEach(([key, value]) => {
    variables.push(`--font-size-${key}: ${value};`);
  });

  // Border radius tokens
  Object.entries(borderRadiusTokens).forEach(([key, value]) => {
    variables.push(`--radius-${key}: ${value};`);
  });

  // Shadow tokens
  Object.entries(shadowTokens).forEach(([key, value]) => {
    variables.push(`--shadow-${key}: ${value};`);
  });

  return `
:root {
  ${variables.join("\n  ")}
}
  `;
}
```

**Global Styles Import:**

```typescript
// packages/ui/src/styles/globals.css
:root {
  /* Colors */
  --color-blue-700: #1976D2;
  --color-primary: var(--color-blue-700);

  /* Spacing */
  --spacing-4: 1rem;

  /* Typography */
  --font-size-base: 1rem;

  /* Border radius */
  --radius-md: 0.25rem;

  /* Shadows */
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

  /* RTL support */
  --spacing-start: var(--spacing-left);
  --spacing-end: var(--spacing-right);
}

[dir="rtl"] {
  --spacing-start: var(--spacing-right);
  --spacing-end: var(--spacing-left);
}

[data-theme="dark"] {
  --color-primary: #64B5F6;
  --color-background: #1A1A1A;
  --color-surface: #2D2D2D;
  --color-text: #FFFFFF;
}

[data-tenant="masafh"] {
  --color-primary: #1E88E5;
  --color-secondary: #43A047;
  --font-family-heading: Cairo, sans-serif;
}
```

### 4.3 TypeScript Types for Tokens

**Token Type Definitions:**

```typescript
// packages/ui/src/tokens/types.ts
import { globalColorTokens, semanticColorTokens } from "./tokens";

export type ColorName = keyof typeof globalColorTokens;
export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export type SemanticColor = keyof typeof semanticColorTokens;

export type SpacingScale = keyof typeof spacingScaleTokens;
export type SpacingAlias = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

export type FontSize = keyof typeof fontSizeTokens;
export type FontWeight = "light" | "regular" | "medium" | "semibold" | "bold";

export type BorderRadius = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

export type Shadow = "xs" | "sm" | "md" | "lg" | "xl" | "inner" | "none";

// Token utility type
export type DesignTokens = {
  colors: {
    global: Record<ColorName, Record<ColorShade, string>>;
    semantic: Record<SemanticColor, string>;
  };
  spacing: {
    scale: Record<SpacingScale, string>;
    aliases: Record<SpacingAlias, string>;
  };
  typography: {
    fontSize: Record<FontSize, string>;
    fontWeight: Record<FontWeight, number>;
  };
  borderRadius: Record<BorderRadius, string>;
  shadows: Record<Shadow, string>;
};
```

**Token Getter Utilities:**

```typescript
// packages/ui/src/tokens/utils.ts
import {
  ColorName,
  ColorShade,
  SemanticColor,
  SpacingScale,
  SpacingAlias,
  FontSize,
  BorderRadius,
  Shadow,
} from "./types";
import {
  globalColorTokens,
  spacingScaleTokens,
  spacingAliases,
  fontSizeTokens,
  borderRadiusTokens,
  shadowTokens,
} from "./tokens";

export function getColor(color: ColorName, shade: ColorShade = 500): string {
  return globalColorTokens[color][shade];
}

export function getSpacing(scale: SpacingScale): string;
export function getSpacing(alias: SpacingAlias): string;
export function getSpacing(value: SpacingScale | SpacingAlias): string {
  if (value in spacingScaleTokens) {
    return spacingScaleTokens[value as SpacingScale];
  }
  return spacingAliases[value as SpacingAlias];
}

export function getFontSize(size: FontSize): string {
  return fontSizeTokens[size];
}

export function getBorderRadius(radius: BorderRadius): string {
  return borderRadiusTokens[radius];
}

export function getShadow(shadow: Shadow): string {
  return shadowTokens[shadow];
}

// CSS variable getter
export function getCSSVariable(name: string): string {
  return `var(--${name})`;
}
```

### 4.4 Token Naming Conventions

**Naming Pattern:**

```
[category]-[subcategory]-[variant]-[state]
```

**Examples:**

- `color-primary-DEFAULT`: Primary color in default state
- `color-success-hover`: Success color in hover state
- `spacing-md`: Medium spacing (16px)
- `font-size-lg`: Large font size (18px)
- `radius-md`: Medium border radius (6px)
- `shadow-lg`: Large shadow for elevation

**Reserved Keywords:**

- `DEFAULT`: Default variant
- `light`: Light mode variant
- `dark`: Dark mode variant
- `hover`: Hover state
- `active`: Active/pressed state
- `focus`: Focus state
- `disabled`: Disabled state

---

## 5. Code Examples

### 5.1 Button Component with Design Tokens

```tsx
// packages/ui/src/components/atoms/Button/Button.tsx
import { Button as MantineButton, ButtonProps as MantineButtonProps } from "@mantine/core";
import { getCSSVariable } from "@agenticverdict/ui/tokens";
import styles from "./Button.module.css";

interface ButtonProps extends MantineButtonProps {
  variant?: "primary" | "secondary" | "tertiary" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <MantineButton {...props} className={`${styles.button} ${styles[variant]} ${styles[size]}`} />
  );
}
```

```css
/* packages/ui/src/components/atoms/Button/Button.module.css */
.button {
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  transition: all var(--duration-normal) var(--easing-default);
}

/* Primary variant */
.button.primary {
  background-color: var(--color-primary);
  color: var(--color-primary-contrast);
  border: 1px solid var(--color-primary);
}

.button.primary:hover {
  background-color: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.button.primary:active {
  background-color: var(--color-primary-light);
  transform: translateY(1px);
}

/* Size variants */
.button.sm {
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-sm);
}

.button.md {
  padding: var(--spacing-3) var(--spacing-4);
  font-size: var(--font-size-base);
}

.button.lg {
  padding: var(--spacing-4) var(--spacing-6);
  font-size: var(--font-size-lg);
}

/* RTL support */
[dir="rtl"] .button {
  /* Logical properties automatically flip */
  padding-inline-start: var(--spacing-4);
  padding-inline-end: var(--spacing-4);
}
```

### 5.2 Card Component with Shadow Tokens

```tsx
// packages/ui/src/components/molecules/Card/Card.tsx
import { Card as MantineCard, CardProps as MantineCardProps } from "@mantine/core";
import { getShadow, getSpacing, getBorderRadius } from "@agenticverdict/ui/tokens";

interface CardProps extends MantineCardProps {
  elevation?: "none" | "sm" | "md" | "lg";
  padding?: "sm" | "md" | "lg";
}

export function Card({
  elevation = "md",
  padding = "md",
  children,
  className,
  ...props
}: CardProps) {
  return (
    <MantineCard
      {...props}
      shadow={elevation}
      p={padding}
      className={className}
      style={{
        borderRadius: getBorderRadius("lg"),
      }}
    >
      {children}
    </MantineCard>
  );
}
```

### 5.3 Typography Component with Font Tokens

```tsx
// packages/ui/src/components/atoms/Typography/Typography.tsx
import { Text as MantineText, TextProps as MantineTextProps } from "@mantine/core";
import { getFontSize, getCSSVariable } from "@agenticverdict/ui/tokens";

interface TypographyProps extends MantineTextProps {
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "body" | "caption";
  weight?: "light" | "regular" | "medium" | "semibold" | "bold";
  color?: "primary" | "secondary" | "tertiary";
}

export function Typography({
  variant = "body",
  weight = "regular",
  color = "primary",
  children,
  ...props
}: TypographyProps) {
  return (
    <MantineText
      {...props}
      style={{
        fontFamily: variant.startsWith("h")
          ? getCSSVariable("font-family-heading")
          : getCSSVariable("font-family-base"),
        fontSize: getFontSize(variant),
        fontWeight: getCSSVariable(`font-weight-${weight}`),
        color: getCSSVariable(`color-text-${color}`),
      }}
    >
      {children}
    </MantineText>
  );
}
```

### 5.4 Spacing Component with Scale Tokens

```tsx
// packages/ui/src/components/atoms/Spacing/Spacing.tsx
import { Box, BoxProps } from "@mantine/core";
import { getSpacing } from "@agenticverdict/ui/tokens";

interface SpacingProps extends BoxProps {
  space?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  direction?: "vertical" | "horizontal" | "all";
}

export function Spacing({ space = "md", direction = "vertical", ...props }: SpacingProps) {
  const spacingValue = getSpacing(space);

  const style = {
    ...(direction === "vertical" && {
      height: spacingValue,
      marginTop: spacingValue,
      marginBottom: spacingValue,
    }),
    ...(direction === "horizontal" && {
      width: spacingValue,
      marginLeft: spacingValue,
      marginRight: spacingValue,
    }),
    ...(direction === "all" && {
      padding: spacingValue,
    }),
  };

  return <Box style={style} {...props} />;
}
```

### 5.5 Multi-Tenant Theme Switcher

```tsx
// packages/ui/src/components/organisms/ThemeSwitcher/ThemeSwitcher.tsx
import { useMantineColorScheme } from "@mantine/core";
import { ActionIcon, Group, Tooltip } from "@mantine/core";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { useTenantTheme } from "@agenticverdict/web/hooks/use-tenant-theme";
import { useTenantContext } from "@agenticverdict/web/contexts/tenant-context";

export function ThemeSwitcher() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { tenantId } = useTenantContext();
  const { data: tenantTheme } = useTenantTheme(tenantId);

  return (
    <Group>
      <Tooltip label="Toggle dark mode">
        <ActionIcon
          onClick={() => toggleColorScheme()}
          variant="default"
          size="lg"
          radius="md"
          aria-label="Toggle color scheme"
        >
          {colorScheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
        </ActionIcon>
      </Tooltip>

      {/* Show tenant name for debugging */}
      {process.env.NODE_ENV === "development" && (
        <div
          style={{
            padding: "var(--spacing-2)",
            background: "var(--color-surface-elevated)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--font-size-sm)",
          }}
        >
          Tenant: {tenantId}
          {tenantTheme && " (Custom Theme)"}
        </div>
      )}
    </Group>
  );
}
```

---

## 6. Migration Guide

### 6.1 Migrating from Mantine v6 to v7

**Breaking Changes:**

1. **Theme Structure:**

   ```typescript
   // v6
   theme.primaryColor;

   // v7
   theme.colors.brand[6];
   ```

2. **Component Props:**

   ```typescript
   // v6
   <Button radius="lg" />

   // v7
   <Button radius="xl" /> // Different scale
   ```

**Migration Steps:**

1. Update theme configuration:

   ```typescript
   // Before (v6)
   const theme = {
     primaryColor: 'blue',
     colors: {
       blue: [...]
     }
   };

   // After (v7)
   const theme = {
     colors: {
       brand: [...], // Rename blue to brand
       blue: [...]  // Keep original for backward compatibility
     }
   };
   ```

2. Update component props:

   ```typescript
   // Before
   <Button radius="lg" size="md" />

   // After
   <Button radius="xl" size="md" /> // Update radius value
   ```

### 6.2 Adding New Design Tokens

**Process:**

1. Define token in appropriate category file:

   ```typescript
   // packages/ui/src/tokens/colors/global.ts
   export const globalColorTokens = {
     // ...existing tokens
     purple: {
       50: "#F3E5F5",
       // ... full scale
     },
   };
   ```

2. Add CSS variable:

   ```css
   /* packages/ui/src/styles/globals.css */
   :root {
     --color-purple-500: #9c27b0;
   }
   ```

3. Update TypeScript types:

   ```typescript
   // packages/ui/src/tokens/types.ts
   export type ColorName = keyof typeof globalColorTokens;
   // Now includes 'purple'
   ```

4. Document in this specification:
   ```markdown
   ## 2.1 Color Tokens

   ### Purple Palette

   - Primary purple: #9C27B0
   - Usage: Premium features, loyalty programs
   ```

### 6.3 Tenant Theme Migration

**Adding New Tenant Theme:**

1. Create theme configuration:

   ```typescript
   // packages/config/src/tenants/newclient.theme.ts
   export const newclientTokens: TenantUITokens = {
     colors: {
       primary: "#FF5722",
       secondary: "#607D8B",
     },
     typography: {
       fontFamily: {
         base: "Roboto, sans-serif",
       },
     },
   };
   ```

2. Register in theme registry:

   ```typescript
   // packages/ui/src/tokens/registry.ts
   import { newclientTokens } from "@agenticverdict/config/tenants/newclient.theme";

   export const themeRegistry = {
     // ...existing themes
     newclient: {
       id: "newclient",
       name: "NewClient",
       tokens: newclientTokens,
     },
   };
   ```

3. Test theme application:
   ```typescript
   // apps/web/src/routes/_test.tsx
   export default function TestTheme() {
     return (
       <DynamicThemeProvider tenantId="newclient">
         <Button variant="primary">Test Button</Button>
       </DynamicThemeProvider>
     );
   }
   ```

---

## Appendix: Token Reference Tables

### Color Token Reference

| Token Category   | Token Name | CSS Variable     | Default Value | Usage           |
| ---------------- | ---------- | ---------------- | ------------- | --------------- |
| Global Blue      | blue-500   | --color-blue-500 | #2196F3       | Primary actions |
| Global Gray      | gray-500   | --color-gray-500 | #9E9E9E       | Disabled states |
| Semantic Primary | primary    | --color-primary  | #1976D2       | Brand color     |
| Semantic Success | success    | --color-success  | #388E3C       | Success states  |
| Semantic Error   | error      | --color-error    | #D32F2F       | Error states    |

### Spacing Token Reference

| Scale | Alias | CSS Variable | Value (px) | Usage               |
| ----- | ----- | ------------ | ---------- | ------------------- |
| 1     | xs    | --spacing-1  | 4px        | Tight spacing       |
| 2     | sm    | --spacing-2  | 8px        | Small spacing       |
| 4     | md    | --spacing-4  | 16px       | Default spacing     |
| 6     | lg    | --spacing-6  | 24px       | Large spacing       |
| 8     | xl    | --spacing-8  | 32px       | Extra large spacing |

### Typography Token Reference

| Token              | CSS Variable         | Value           | Usage            |
| ------------------ | -------------------- | --------------- | ---------------- |
| Font Size Base     | --font-size-base     | 1rem (16px)     | Body text        |
| Font Size XL       | --font-size-xl       | 1.25rem (20px)  | Subheadings      |
| Font Size 3XL      | --font-size-3xl      | 1.875rem (30px) | Section headings |
| Font Weight Medium | --font-weight-medium | 500             | Emphasized text  |
| Font Weight Bold   | --font-weight-bold   | 700             | Headings         |

---

**Document End**

For implementation details, see [Component Specification](./component-specification.md)  
For research background, see [Design System Landscape](../01-research-findings/design-system-landscape.md)
