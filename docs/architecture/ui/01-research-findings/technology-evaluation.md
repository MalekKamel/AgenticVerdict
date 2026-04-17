# UI Technology Evaluation: AgenticVerdict Component System

**Document Version:** 1.0  
**Date:** 2026-04-11  
**Status:** Research Complete  
**Author:** Architecture Team

---

## Executive Summary

This document provides a comprehensive evaluation of UI technology options for AgenticVerdict, building upon the existing TanStack Start + Mantine UI v9 foundation. The research focuses on headless UI components, styling solutions, documentation tools, design token management, and internationalization strategies—all through the lens of RTL requirements and Mantine UI compatibility.

**Key Recommendation:** **Augment Mantine UI v9 with Radix UI primitives** for components requiring maximum accessibility customization, maintain CSS-in-JS for styling power users, implement Ladle for lightweight component documentation, and build a custom design token system on top of Mantine's theme architecture.

---

## 1. Headless UI Component Libraries

### 1.1 Evaluation Criteria

| Criterion                 | Weight | Description                                     |
| ------------------------- | ------ | ----------------------------------------------- |
| **Mantine Compatibility** | 30%    | Integration ease with existing Mantine v9 setup |
| **Accessibility**         | 25%    | WCAG 2.1 AA compliance out of box               |
| **Developer Experience**  | 20%    | API design, TypeScript support, documentation   |
| **Bundle Size**           | 15%    | Impact on initial load and runtime performance  |
| **RTL Support**           | 10%    | First-class RTL language support                |

### 1.2 Comparison Matrix

| Feature                 | **Radix UI**            | **Headless UI**         | **Shadcn UI**         | **Mantine UI v9**      |
| ----------------------- | ----------------------- | ----------------------- | --------------------- | ---------------------- |
| **Architecture**        | Unstyled primitives     | Unstyled components     | Copy-paste components | Full component library |
| **Bundle Size**         | Tree-shakeable, minimal | Tree-shakeable, minimal | N/A (copy-paste)      | Larger, but optimized  |
| **Accessibility**       | ⭐⭐⭐⭐⭐ Excellent    | ⭐⭐⭐⭐ Very Good      | ⭐⭐⭐⭐⭐ Excellent  | ⭐⭐⭐⭐⭐ Excellent   |
| **Mantine Integration** | ⭐⭐⭐⭐ Complementary  | ⭐⭐⭐ Possible         | ⭐⭐ Conflict risk    | ⭐⭐⭐⭐⭐ Native      |
| **RTL Support**         | ⭐⭐⭐⭐⭐ Built-in     | ⭐⭐⭐ Manual           | ⭐⭐⭐⭐ Via Tailwind | ⭐⭐⭐⭐⭐ Built-in    |
| **TypeScript**          | ⭐⭐⭐⭐⭐ First-class  | ⭐⭐⭐⭐ Good           | ⭐⭐⭐⭐⭐ Excellent  | ⭐⭐⭐⭐⭐ First-class |
| **Learning Curve**      | Moderate                | Low                     | Low                   | Low                    |
| **Maintenance**         | Low                     | Low                     | High (manual updates) | Low                    |

### 1.3 Detailed Analysis

#### Radix UI

**Pros:**

- **Unmatched Accessibility**: Each component built with ARIA attributes, keyboard navigation, and screen reader optimization
- **Composable Primitives**: Build exactly what you need without fighting predefined styles
- **Mantine v9 Complementary**: Fills gaps in Mantine v9's component catalog (e.g., complex menus, tooltips)
- **React Server Components**: RSC-ready architecture aligns with TanStack Start
- **Strong TypeScript**: Excellent type inference and generic component patterns
- **Active Development**: Regular updates, strong community momentum

**Cons:**

- **Styling Required**: Must build all styles from scratch
- **API Complexity**: More verbose than full component libraries
- **Bundle Fragmentation**: Multiple packages to install and manage

**Best Use Cases for AgenticVerdict:**

- Complex form controls (multi-select, date pickers with custom calendars)
- Advanced tooltips and popovers with positioning challenges
- Accessible command palette (future enhancement)
- Custom data grid components (if needed beyond Mantine v9 Table)

#### Headless UI

**Pros:**

- **Simple API**: Straightforward props and composition patterns
- **Alpine.js Synergy**: If future needs require Alpine, same API
- **Lightweight**: Smaller bundle than Radix for comparable components
- **Good Documentation**: Clear examples and use cases

**Cons:**

- **No Native RTL**: Requires manual direction handling
- **Less Composable**: More opinionated than Radix primitives
- **Fewer Components**: Smaller component catalog
- **Framework Lock-in**: Tied to React ecosystem

**Verdict:** Not recommended for AgenticVerdict due to lack of first-class RTL support and stronger Mantine v9 overlap.

#### Shadcn UI

**Pros:**

- **High Customization**: Full control over component code
- **Modern Aesthetics**: Contemporary design patterns
- **Strong Community**: Large ecosystem, many examples
- **Radix Foundation**: Leverages Radix's accessibility

**Cons:**

- **Mantine v9 Conflict**: Significant architectural overlap
- **Maintenance Burden**: Manual updates for all components
- **Copy-Paste Model**: No package updates, security patches manual
- **Tailwind Dependency**: Requires Tailwind migration
- **RTL Complexity**: Requires Tailwind RTL plugin

**Verdict:** **Not recommended**. Shadcn UI would compete with Mantine v9 rather than complement it, requiring a full migration that doesn't align with the "don't reinvent the wheel" principle.

### 1.4 Recommendations

**Primary Strategy: Augment Mantine v9 with Radix UI**

```typescript
// Install only specific Radix primitives for gaps in Mantine v9
pnpm add @radix-ui/react-popover @radix-ui/react-tooltip @radix-ui/react-dropdown-menu

// Wrap Radix components with Mantine v9 styling
import { Popover as RadixPopover } from '@radix-ui/react-popover';
import { MantineProvider } from '@mantine/core';

function MantinePopover({ children, ...props }) {
  return (
    <MantineProvider>
      <RadixPopover {...props}>
        {/* Mantine v9-styled content */}
      </RadixPopover>
    </MantineProvider>
  );
}
```

**When to Use Each:**

| Scenario                        | Use            | Rationale                              |
| ------------------------------- | -------------- | -------------------------------------- |
| Standard forms, buttons, inputs | **Mantine v9** | Built-in styling, consistent theme     |
| Complex tooltips/popovers       | **Radix UI**   | Superior positioning and accessibility |
| Advanced menus                  | **Radix UI**   | Better keyboard navigation             |
| Data tables                     | **Mantine v9** | Full-featured Table component          |
| Custom dialogs                  | **Radix UI**   | More flexible focus management         |

**Migration Path:**

1. **Phase 1 (Current):** Pure Mantine v9 implementation
2. **Phase 2 (As Needed):** Add Radix primitives for specific gaps
3. **Phase 3 (Future):** Evaluate custom component needs

---

## 2. Styling Solutions

### 2.1 Evaluation Matrix

| Criterion                | CSS-in-JS (Mantine)       | Tailwind CSS                      | CSS Modules               |
| ------------------------ | ------------------------- | --------------------------------- | ------------------------- |
| **Mantine Integration**  | ⭐⭐⭐⭐⭐ Native         | ⭐⭐⭐ Requires adapter           | ⭐⭐⭐⭐ Compatible       |
| **Runtime Performance**  | ⭐⭐⭐⭐ Good (cached)    | ⭐⭐⭐⭐⭐ Excellent (build-time) | ⭐⭐⭐⭐⭐ Excellent      |
| **Developer Experience** | ⭐⭐⭐⭐⭐ Dynamic styles | ⭐⭐⭐⭐ Rapid prototyping        | ⭐⭐⭐ Scoped but verbose |
| **RTL Support**          | ⭐⭐⭐⭐⭐ Automatic      | ⭐⭐⭐ Requires plugin            | ⭐⭐⭐ Manual CSS         |
| **Bundle Size**          | ⭐⭐⭐ ~40KB              | ⭐⭐ Variable (purge needed)      | ⭐⭐⭐⭐⭐ Zero runtime   |
| **Theming**              | ⭐⭐⭐⭐⭐ Powerful       | ⭐⭐⭐ Limited                    | ⭐⭐⭐ Requires work      |

### 2.2 Detailed Analysis

#### CSS-in-JS (Mantine's Default)

**Architecture:**

```typescript
// Mantine's CSS-in-JS uses PostCSS with runtime styling
import { createStyles } from "@mantine/core";

const useStyles = createStyles((theme, _params, getRef) => ({
  container: {
    backgroundColor: theme.colors.blue[0],
    color: theme.colors.blue[9],
    // Automatic RTL support
    [theme.dir === "rtl" ? "marginRight" : "marginLeft"]: theme.spacing.md,
  },
}));
```

**Pros:**

- **Perfect Mantine v9 Integration**: Native theming, colors, spacing
- **Automatic RTL**: Direction-aware properties handled automatically
- **Dynamic Styling**: Theme variables, responsive props, color functions
- **Type Safety**: Full TypeScript support for theme access
- **Component Scoping**: Zero CSS conflicts
- **Critical CSS**: Automatic CSS extraction for SSR

**Cons:**

- **Runtime Overhead**: ~2-5ms per component (mitigated by caching)
- **Learning Curve**: New API for CSS developers
- **Debugging**: Harder to inspect styles in browser

**Performance Reality Check:**

- Mantine v9's CSS-in-JS is heavily optimized with caching
- Runtime cost is negligible for typical dashboards (<100 components)
- SSR extracts CSS, eliminating FOUC

#### Tailwind CSS

**Architecture:**

```typescript
// Requires tailwind.config.js and Mantine adapter
<div className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600">
  Content
</div>
```

**Pros:**

- **Build-Time Optimization**: Zero runtime CSS generation
- **Rapid Prototyping**: Fast UI iteration
- **Consistent Design**: Spacing, colors, typography standardized
- **Small Bundle**: Tree-shake unused styles (with proper purging)

**Cons:**

- **Mantine v9 Integration**: Requires significant configuration
- **RTL Complexity**: Needs `tailwindcss-rtl` plugin
- **Theming Limits**: Hard to dynamic theme switching
- **Utility Bloat**: HTML becomes verbose
- **Migration Cost**: Rewrite all existing components

**Migration Complexity for AgenticVerdict:**

```bash
# Required packages
pnpm add tailwindcss @tailwindcss/rtl autoprefixer
pnpm add @mantine/core@latest # Need Tailwind-compatible version

# Configuration changes
- Replace all Mantine v9 style props with Tailwind classes
- Rebuild theme system using Tailwind config
- Test all components for RTL behavior
# Estimated effort: 2-3 weeks for full migration
```

#### CSS Modules

**Architecture:**

```css
/* Component.module.css */
.container {
  background-color: var(--mantine-color-blue-0);
  /* Manual RTL handling */
  margin-inline-start: var(--mantine-spacing-md);
}
```

**Pros:**

- **Zero Runtime**: Pure CSS, no JS overhead
- **Perfect Scoping**: Hashed class names prevent conflicts
- **Familiar**: Standard CSS syntax
- **Framework Agnostic**: Works with any React framework

**Cons:**

- **Mantine v9 Theme**: Manual theme variable integration
- **RTL Manual**: Must use logical properties or conditional CSS
- **Dynamic Styles**: Limited for responsive/conditional styling
- **Verbose**: More code than CSS-in-JS

### 2.3 Recommendations

**Primary Strategy: CSS-in-JS with Selective CSS Modules**

**When to Use CSS-in-JS (Mantine v9):**

- Component-specific styles (95% of cases)
- Dynamic theming requirements
- Complex responsive layouts
- Components using Mantine v9 theme variables

**When to Use CSS Modules:**

- Global styles (reset, base typography)
- Critical CSS for above-the-fold content
- Animation keyframes
- Third-party component overrides

**Hybrid Approach:**

```typescript
// Component uses CSS-in-JS for component styles
import { createStyles } from "@mantine/core";

// Global styles use CSS Modules
import globalStyles from "./global.module.css";

// Animation keyframes in CSS Modules
import animations from "./animations.module.css";
```

**Do Not Adopt Tailwind CSS:**

- Migration cost exceeds benefits
- Mantine v9's CSS-in-JS is production-ready
- RTL support is superior in Mantine v9
- Build-time benefits are marginal for this use case

---

## 3. Component Documentation Tools

### 3.1 Evaluation Criteria

| Criterion                        | Weight | Description                                   |
| -------------------------------- | ------ | --------------------------------------------- |
| **TanStack Start Compatibility** | 30%    | Works with TanStack Start and RSC             |
| **Mantine Integration**          | 25%    | Easy integration with Mantine v9 components   |
| **Bundle Size**                  | 20%    | Impact on development and production builds   |
| **Setup Complexity**             | 15%    | Time to get running                           |
| **Multi-Language Support**       | 10%    | Can document components in multiple languages |

### 3.2 Comparison Matrix

| Feature                    | **Ladle**                   | **Storybook**              | **Docz**        |
| -------------------------- | --------------------------- | -------------------------- | --------------- |
| **Bundle Size**            | ⭐⭐⭐⭐⭐ 2MB              | ⭐⭐ 20MB+                 | ⭐⭐⭐ 8MB      |
| **Setup Time**             | ⭐⭐⭐⭐⭐ 5 min            | ⭐⭐ 30+ min               | ⭐⭐⭐ 15 min   |
| **TanStack Start Support** | ⭐⭐⭐⭐⭐ Excellent        | ⭐⭐⭐ Good (with config)  | ⭐⭐ Fair       |
| **Mantine v9 Integration** | ⭐⭐⭐⭐⭐ Works out of box | ⭐⭐⭐ Requires decorators | ⭐⭐⭐ Works    |
| **RSC Support**            | ⭐⭐⭐⭐⭐ Native           | ⭐⭐⭐ Experimental        | ⭐⭐ Limited    |
| **TypeScript**             | ⭐⭐⭐⭐⭐ Excellent        | ⭐⭐⭐⭐ Good              | ⭐⭐⭐⭐ Good   |
| **Multi-Language Docs**    | ⭐⭐⭐ Via MDX              | ⭐⭐⭐⭐ Built-in i18n     | ⭐⭐⭐ Via MDX  |
| **Performance**            | ⭐⭐⭐⭐⭐ Fast HMR         | ⭐⭐⭐ Slower rebuilds     | ⭐⭐⭐⭐ Fast   |
| **Addons Ecosystem**       | ⭐⭐⭐ Limited              | ⭐⭐⭐⭐⭐ Extensive       | ⭐⭐⭐ Moderate |

### 3.3 Detailed Analysis

#### Ladle

**Architecture:**

```typescript
// stories/Button.stories.tsx
import type { Story } from '@ladle/react';
import { Button } from './Button';

export default {
  title: 'Components/Button',
};

export const Primary: Story<ButtonProps> = (args) => <Button {...args} />;
Primary.args = {
  children: 'Click me',
  variant: 'filled',
};
```

**Pros:**

- **Zero-Config**: Works with TanStack Start and Vite out of box
- **Minimal Bundle**: 2MB vs Storybook's 20MB+
- **Fast HMR**: Built on Vite, instant updates
- **RSC Ready**: Designed for React Server Components
- **Mantine v9 Compatible**: No decorators or wrappers needed
- **Simple API**: One file per story, no boilerplate
- **TypeScript First**: Excellent type inference

**Cons:**

- **Smaller Ecosystem**: Fewer addons than Storybook
- **Limited Docs**: Less documentation and examples
- **Younger Project**: Smaller community than Storybook
- **No Visual Testing**: Needs external tool (e.g., Chromatic)

**Setup for AgenticVerdict:**

```bash
# Install Ladle
pnpm add -D @ladle/react

# Create stories directory
mkdir -p packages/ui/stories

# Configure Ladle (optional, usually not needed)
echo 'export default { stories: "packages/ui/stories/**/*.stories.tsx" }' > ladle.config.ts

# Add to package.json scripts
"ui-docs": "ladle serve --port 6100"
"ui-docs:build": "ladle build"
```

#### Storybook

**Architecture:**

```typescript
// stories/Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: "Click me",
    variant: "filled",
  },
};
```

**Pros:**

- **Mature Ecosystem**: 10+ years of development
- **Extensive Addons**: A11y, testing, docs, theme switching
- **Enterprise Features**: Visual testing, design kits
- **Strong Community**: Large user base, lots of examples
- **Multi-Language Docs**: Built-in i18n for documentation

**Cons:**

- **Heavy Bundle**: 20MB+ for basic setup
- **Complex Setup**: Requires configuration for TanStack Start
- **Slower Rebuilds**: Older architecture, slower HMR
- **RSC Challenges**: Experimental support, requires config
- **Mantine v9 Decorator**: Needs wrapper for theming

**Setup Complexity for AgenticVerdict:**

```bash
# Install Storybook
pnpm dlx storybook@latest init

# Manual configuration needed
- Configure for TanStack Start
- Add Mantine v9 decorator for theming
- Set up RTL addon
- Configure RSC support (experimental)

# Estimated setup time: 2-4 hours
```

#### Docz

**Architecture:**

```typescript
// Button.mdx
import { Button } from './Button';

# Button

<Button>Click me</Button>

## Props
...
```

**Pros:**

- **MDX-Based**: Write docs in Markdown with JSX
- **Gatsby Powered**: Fast builds, good performance
- **Simple Setup**: Easier than Storybook
- **Themeable**: Customizable themes

**Cons:**

- **Less Active**: Smaller community, fewer updates
- **Gatsby Dependency**: Adds Gatsby to build pipeline
- **RSC Limitations**: Not designed for Server Components
- **Mantine v9 Integration**: Requires manual configuration

**Verdict:** Not recommended due to RSC limitations and smaller ecosystem.

### 3.4 Recommendations

**Primary Choice: Ladle**

**Rationale:**

- Perfect alignment with TanStack Start and Vite
- Minimal bundle size (2MB vs 20MB+)
- Zero-config setup with Mantine v9
- Designed for modern React (RSC-ready)
- Fast HMR for development speed

**When to Consider Storybook:**

- Need visual regression testing (Chromatic integration)
- Require extensive addon ecosystem
- Building enterprise component library with many consumers
- Need built-in multi-language documentation

**Implementation Plan:**

```typescript
// packages/ui/stories/ThemeProvider.stories.tsx
import { MantineProvider, DirectionProvider } from '@mantine/core';
import type { ReactNode } from 'react';

// Wrapper for Mantine v9 theming in Ladle
export function MantineWrapper({ children }: { children: ReactNode }) {
  return (
    <MantineProvider defaultColorScheme="auto">
      <DirectionProvider initialDirection="ltr">
        {children}
      </DirectionProvider>
    </MantineProvider>
  );
}

// Use in stories
export const decorators = [
  (Story) => (
    <MantineWrapper>
      <Story />
    </MantineWrapper>
  ),
];
```

**Multi-Language Documentation:**

```typescript
// Support Arabic and English documentation
export const ArabicDocs: Story = {
  name: 'المستندات العربية',
  render: () => <div>Arabic documentation here</div>,
};
```

---

## 4. Design Token Management

### 4.1 Evaluation Criteria

| Criterion                 | Weight | Description                                |
| ------------------------- | ------ | ------------------------------------------ |
| **Mantine Integration**   | 35%    | Works with Mantine v9's theme system       |
| **Build-Time vs Runtime** | 25%    | Preference for build-time generation       |
| **Multi-Brand Support**   | 20%    | Ability to support tenant-specific theming |
| **Developer Experience**  | 15%    | Easy to author and maintain tokens         |
| **RTL Support**           | 5%     | Handles RTL-specific token variations      |

### 4.2 Comparison Matrix

| Feature                    | **Style Dictionary**       | **Tokens Studio**      | **Custom Mantine v9** |
| -------------------------- | -------------------------- | ---------------------- | --------------------- |
| **Mantine v9 Integration** | ⭐⭐⭐ Requires adapter    | ⭐⭐⭐ Requires export | ⭐⭐⭐⭐⭐ Native     |
| **Build-Time Generation**  | ⭐⭐⭐⭐⭐ Excellent       | ⭐⭐⭐⭐ Good          | ⭐⭐⭐ Manual         |
| **Multi-Brand**            | ⭐⭐⭐⭐⭐ Designed for it | ⭐⭐⭐⭐ Good          | ⭐⭐⭐ Requires work  |
| **TypeScript Support**     | ⭐⭐⭐⭐ Generated types   | ⭐⭐⭐ Via plugins     | ⭐⭐⭐⭐⭐ Native     |
| **RTL Tokens**             | ⭐⭐⭐⭐ Conditional       | ⭐⭐⭐ Via plugins     | ⭐⭐⭐⭐⭐ Automatic  |
| **Setup Complexity**       | ⭐⭐⭐ Moderate            | ⭐⭐ High              | ⭐⭐⭐⭐⭐ Simple     |
| **Maintenance**            | ⭐⭐⭐ JSON config         | ⭐⭐ Figma dependency  | ⭐⭐⭐⭐ Code-based   |

### 4.3 Detailed Analysis

#### Style Dictionary

**Architecture:**

```json
// tokens/color.json
{
  "color": {
    "primary": {
      "base": {
        "value": "#228BE6",
        "type": "color"
      }
    }
  }
}
```

```javascript
// style-dictionary.config.js
module.exports = {
  source: ["tokens/**/*.json"],
  platforms: {
    ts: {
      transformGroup: "ts",
      buildPath: "src/styles/",
      files: [
        {
          destination: "tokens.ts",
          format: "typescript/es6-declarations",
        },
      ],
    },
  },
};
```

**Pros:**

- **Build-Time Generation**: Compiles tokens to multiple formats (TS, CSS, SCSS)
- **Multi-Platform**: Generates for web, iOS, Android from single source
- **Multi-Brand**: Built-in support for themes/brands
- **Extensible**: Custom transforms and formats
- **Industry Standard**: Battle-tested at large companies

**Cons:**

- **Mantine v9 Mismatch**: Doesn't generate Mantine v9 theme format
- **Complex Setup**: Requires configuration and custom transformers
- **JSON Authoring**: Less developer-friendly than code
- **Maintenance Overhead**: Additional build step
- **RTL Handling**: Manual conditional tokens

**Integration with Mantine v9:**

```typescript
// Need custom transformer
import { createTheme } from "@mantine/core";
import tokens from "./styles/tokens";

const mantineTheme = createTheme({
  colors: {
    // Map Style Dictionary tokens to Mantine v9 format
    primary: tokens.color.primary.value,
  },
});
```

#### Tokens Studio (Figma Plugin)

**Architecture:**

- Design tokens created in Figma
- Exported via plugin to code
- Synchronized design-dev workflow

**Pros:**

- **Designer-Friendly**: Non-developers can author tokens
- **Figma Integration**: Direct sync from design source
- **Visual Editor**: GUI for token management
- **Multi-Format**: Exports to various formats

**Cons:**

- **Figma Dependency**: Requires Figma and plugin
- **Version Control**: Harder to track changes in Git
- **Mantine v9 Format**: Doesn't export Mantine v9 theme natively
- **Build Process**: Additional export step
- **Cost**: Enterprise features require paid plan
- **RTL Complexity**: Limited support for RTL variants

#### Custom Mantine v9 Theme

**Architecture:**

```typescript
// packages/ui/src/theme/tokens.ts
export const designTokens = {
  colors: {
    primary: {
      50: "#e7f5ff",
      100: "#bee3f8",
      // ... Mantine v9 color palette format
    },
  },
  spacing: {
    xs: "0.625rem",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.25rem",
    xl: "1.5rem",
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
  },
};

// Convert to Mantine v9 theme
import { createTheme } from "@mantine/core";

export const theme = createTheme({
  colors: designTokens.colors,
  spacing: designTokens.spacing,
  fontSizes: designTokens.fontSize,
});
```

**Pros:**

- **Native Mantine v9**: Perfect integration, no adapters
- **TypeScript**: Full type safety and autocomplete
- **Simple**: No additional build steps
- **RTL Automatic**: Inherits Mantine v9's RTL handling
- **Flexible**: Easy to extend and customize
- **Git-Friendly**: Changes tracked in code

**Cons:**

- **Manual Work**: No visual editor or design tool sync
- **Single-Brand**: Multi-brand requires more work
- **Not Universal**: Tied to Mantine v9 ecosystem

### 4.4 Recommendations

**Primary Strategy: Custom Mantine v9 Theme with TypeScript**

**Architecture:**

```typescript
// packages/ui/src/theme/index.ts
export const baseTheme = {
  colors: {
    brand: {
      blue: {
        50: "#f0f9ff",
        100: "#e0f2fe",
        200: "#bae6fd",
        300: "#7dd3fc",
        400: "#38bdf8",
        500: "#0ea5e9",
        600: "#0284c7",
        700: "#0369a1",
        800: "#075985",
        900: "#0c4a6e",
        950: "#082f49",
      },
    },
    semantic: {
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    },
  },
  spacing: {
    xs: "0.5rem", // 8px
    sm: "0.75rem", // 12px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    xxl: "3rem", // 48px
  },
  typography: {
    fontFamily: {
      sans: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      arabic: "IBM Plex Sans Arabic, sans-serif",
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  breakpoints: {
    xs: "36em", // 576px
    sm: "48em", // 768px
    md: "62em", // 992px
    lg: "75em", // 1200px
    xl: "88em", // 1408px
  },
  radii: {
    xs: "0.125rem",
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    full: "9999px",
  },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },
  zIndex: {
    base: 1,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modal: 1300,
    popover: 1400,
    tooltip: 1500,
  },
};

// Multi-brand support
export const brandThemes = {
  default: baseTheme,
  agency: {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      brand: {
        blue: {
          // Agency-specific blue
          500: "#1d4ed8",
        },
      },
    },
  },
  // Future: tenant-specific themes
};

// RTL-aware theme
export function createLocalizedTheme(locale: "en" | "ar") {
  return {
    ...baseTheme,
    fontFamily:
      locale === "ar"
        ? baseTheme.typography.fontFamily.arabic
        : baseTheme.typography.fontFamily.sans,
    dir: locale === "ar" ? "rtl" : "ltr",
  };
}

// Mantine v9 theme creator
import { createTheme } from "@mantine/core";

export function createMantineTheme(brand?: keyof typeof brandThemes, locale?: "en" | "ar") {
  const brandTheme = brand ? brandThemes[brand] : baseTheme;
  const localizedTheme = locale ? createLocalizedTheme(locale) : {};

  return createTheme({
    ...brandTheme,
    ...localizedTheme,
    primaryShade: { light: 6, dark: 7 },
  });
}
```

**Multi-Brand Strategy:**

```typescript
// Tenant-specific theme from CompanyConfig
export function getTenantTheme(config: CompanyConfig) {
  return createMantineTheme(
    config.brandId as keyof typeof brandThemes,
    config.localization.language
  );
}

// Usage in app
import { getTenantTheme } from '@agenticverdict/ui/theme';

function App({ tenantConfig }) {
  return (
    <MantineProvider theme={getTenantTheme(tenantConfig)}>
      {/* App content */}
    </MantineProvider>
  );
}
```

**When to Consider Style Dictionary:**

- Building multi-platform app (web + mobile + desktop)
- Large design team requiring Figma sync
- Need to export tokens to CSS/Sass for non-React consumers
- Complex token inheritance and aliases

**For AgenticVerdict: Custom Mantine v9 theme is sufficient because:**

- Single-platform (TanStack Start web app)
- Existing Mantine v9 foundation
- Multi-brand needs are simple (2-3 themes max)
- No mobile app planned (Phase 3+)

---

## 5. Internationalization and RTL

### 5.1 Current Implementation

AgenticVerdict already has a solid i18n foundation:

```typescript
// packages/i18n/src/config.ts
export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export const rtlLocales: Locale[] = ["ar"];

export function isRTLLocale(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

// Extensible: Add new locales without code changes
// Example: export const locales = ['en', 'ar', 'fr', 'es', 'ur', 'he'] as const;
```

```typescript
// apps/frontend/src/components/Providers.tsx
import { DirectionProvider, MantineProvider } from '@mantine/core';
import { useLocale } from 'next-intl';

export function Providers({ children }) {
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

### 5.2 RTL Implementation Patterns

#### Logical Properties (Modern Approach)

**CSS Logical Properties:**

```css
/* Use logical properties instead of directional ones */
.container {
  /* Instead of margin-left */
  margin-inline-start: 1rem;

  /* Instead of padding-right */
  padding-inline-end: 1rem;

  /* Instead of border-left */
  border-inline-start: 1px solid #ccc;

  /* Instead of text-align: left */
  text-align: start;
}
```

**Mantine v9 Automatic Handling:**

```typescript
import { createStyles } from "@mantine/core";

const useStyles = createStyles((theme) => ({
  container: {
    // Mantine v9 automatically handles RTL
    paddingLeft: theme.spacing.md, // Becomes paddingRight in RTL
    // Or use logical properties explicitly
    marginInlineStart: theme.spacing.md,
  },
}));
```

#### Layout Mirroring Strategies

**1. CSS Flexbox (Automatic):**

```css
/* Flexbox naturally reverses in RTL */
.flex-container {
  display: flex;
  /* No changes needed - flex items reverse automatically in RTL */
}
```

**2. Grid Layout (Automatic):**

```css
/* Grid also respects RTL */
.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  /* Columns reverse automatically in RTL */
}
```

**3. Explicit Mirroring (When Needed):**

```typescript
// For layouts that need explicit RTL handling
import { useDirection } from '@mantine/v9';

function Component() {
  const { dir } = useDirection();

  return (
    <div style={{
      transform: dir === 'rtl' ? 'scaleX(-1)' : 'none',
    }}>
      {/* Content that needs explicit mirroring */}
    </div>
  );
}
```

### 5.3 Bidirectional Text Handling

**Mixed LTR/RTL Content:**

```typescript
// Use Unicode bidirectional isolation
function MixedLanguageText() {
  return (
    <div>
      <span>English text </span>
      <span dir="rtl" lang="ar">نص عربي</span>
      <span> more English</span>
    </div>
  );
}

// Or use Mantine v9's Text component with dir prop
import { Text } from '@mantine/core';

<Text dir="rtl" lang="ar">
  نص عربي
</Text>
```

**URLs and Paths in RTL:**

```typescript
// URLs should always be LTR, even in RTL context
function RTLContent() {
  return (
    <div dir="rtl">
      <p>محتوى عربي</p>
      <a href="https://example.com" dir="ltr">
        https://example.com
      </a>
    </div>
  );
}
```

### 5.4 Testing RTL Layouts

**Visual Regression Testing:**

```typescript
// Playwright tests for RTL
import { test, expect } from "@playwright/test";

test.describe("RTL Layout", () => {
  test("Arabic layout mirrors correctly", async ({ page }) => {
    await page.goto("/ar");

    // Test layout direction
    const dir = await page.locator("html").getAttribute("dir");
    expect(dir).toBe("rtl");

    // Test mirrored layout
    const sidebar = page.locator('[data-testid="sidebar"]');
    const position = await sidebar.boundingBox();

    // Sidebar should be on the right in RTL
    expect(position.x).toBeGreaterThan(800); // Adjust threshold
  });

  test("Mixed LTR/RTL content renders correctly", async ({ page }) => {
    await page.goto("/ar");

    // Test URLs remain LTR in RTL context
    const url = page.locator('a[href*="http"]');
    await expect(url).toHaveAttribute("dir", "ltr");
  });
});
```

**Accessibility Testing:**

```typescript
// Test screen reader announcements
test("RTL screen reader announces correct language", async ({ page }) => {
  await page.goto("/ar");

  // Check lang attribute
  const html = page.locator("html");
  await expect(html).toHaveAttribute("lang", "ar");

  // Check ARIA attributes
  const ariaLabel = page.locator("[aria-label]");
  await expect(ariaLabel).toHaveAttribute("dir", "rtl");
});
```

### 5.5 Recommendations

**Current Implementation is Solid:**

- ✅ next-intl for translations
- ✅ Mantine v9's DirectionProvider for RTL
- ✅ Automatic layout mirroring via Flexbox/Grid
- ✅ Extensible locale system

**Enhancements Needed:**

1. **Add More RTL Test Coverage:**

```typescript
// Add to E2E test suite
test.describe("RTL Scenarios", () => {
  test("Dashboard layout in Arabic", async ({ page }) => {
    /* ... */
  });
  test("Form validation in RTL", async ({ page }) => {
    /* ... */
  });
  test("Modal/dialog positioning in RTL", async ({ page }) => {
    /* ... */
  });
  test("Dropdown/popover positioning in RTL", async ({ page }) => {
    /* ... */
  });
});
```

2. **Document RTL Patterns:**

````markdown
# RTL Guidelines

## DO: Use logical properties

```css
margin-inline-start: 1rem;
```
````

## DON'T: Use directional properties

```css
margin-left: 1rem;
```

## Test RTL layouts

- Always test critical components in Arabic
- Use Playwright for visual regression
- Check screen reader announcements

````

3. **Create RTL Component Checklist:**
```typescript
// Component RTL checklist
export const rtlChecklist = {
  layoutMirrored: false,
  logicalProperties: false,
  textDirection: false,
  urlsHandled: false,
  testedInArabic: false,
};
````

---

## 6. Final Recommendations Summary

### 6.1 Technology Stack

| Area                  | Recommendation                                            | Rationale                                                                                              |
| --------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Component Library** | **Mantine UI v9 (primary)** + **Radix UI (supplemental)** | Mantine v9 provides comprehensive component library with excellent RTL; Radix fills accessibility gaps |
| **Styling**           | **CSS-in-JS (Mantine v9 default)**                        | Perfect integration, automatic RTL, minimal runtime cost                                               |
| **Documentation**     | **Ladle**                                                 | Zero-config with TanStack Start, minimal bundle, RSC-ready                                             |
| **Design Tokens**     | **Custom Mantine v9 theme**                               | Native integration, full TypeScript support, simple maintenance                                        |
| **i18n/RTL**          | **next-intl + Mantine v9 DirectionProvider**              | Existing implementation is solid, minor enhancements needed                                            |

### 6.2 Implementation Roadmap

**Phase 1: Foundation (Current)**

- ✅ Mantine UI v9 setup
- ✅ next-intl for i18n
- ✅ RTL support via DirectionProvider
- ✅ Base component library

**Phase 2: Enhancement (1-2 weeks)**

- [ ] Add Ladle for component documentation
- [ ] Create custom design token system
- [ ] Add Radix UI for specific gaps (tooltips, popovers)
- [ ] Expand RTL test coverage

**Phase 3: Polish (1 week)**

- [ ] Document RTL patterns and guidelines
- [ ] Create component development guide
- [ ] Set up visual regression testing
- [ ] Performance optimization

### 6.3 Migration Considerations

**No Major Migrations Needed:**

- ✅ Keep Mantine UI v9
- ✅ Keep CSS-in-JS
- ✅ Keep next-intl

**New Additions:**

- Ladle for docs (no migration, parallel tool)
- Radix UI (supplemental, no migration)
- Custom tokens (authoring system, not migration)

**Estimated Effort:**

- Ladle setup: 2-4 hours
- Radix integration: 4-8 hours (as needed)
- Design token system: 8-12 hours
- RTL test coverage: 8-12 hours
- **Total: ~3-5 weeks for full enhancement**

### 6.4 Risk Assessment

| Risk                            | Impact | Mitigation                                   |
| ------------------------------- | ------ | -------------------------------------------- |
| Radix UI integration complexity | Medium | Start with 1-2 components, validate approach |
| Ladle documentation gaps        | Low    | Simple API, Mantine works out of box         |
| Design token maintenance        | Low    | TypeScript-based, Git-friendly               |
| RTL layout bugs                 | Medium | Comprehensive E2E test coverage              |
| Performance regressions         | Low    | CSS-in-JS is optimized, monitoring in place  |

---

## 7. Integration Patterns

### 7.1 Component Development Workflow

```typescript
// 1. Design tokens (TypeScript)
import { designTokens } from '@agenticverdict/ui/theme';

// 2. Component with CSS-in-JS
import { createStyles } from '@mantine/core';

const useStyles = createStyles((theme) => ({
  container: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.brand.blue[50],
    // Automatic RTL handling
    marginInlineStart: theme.spacing.sm,
  },
}));

// 3. Component with optional Radix enhancement
import { Popover as RadixPopover } from '@radix-ui/react-popover';

function Popover({ children }) {
  const { classes } = useStyles();
  return (
    <RadixPopover>
      <RadixPopover.PopoverTrigger className={classes.trigger}>
        {children}
      </RadixPopover.PopoverTrigger>
      <RadixPopover.PopoverContent className={classes.content}>
        Content
      </RadixPopover.PopoverContent>
    </RadixPopover>
  );
}

// 4. Ladle documentation
// stories/Popover.stories.tsx
export default {
  title: 'Components/Popover',
};

export const Default = {
  render: () => <Popover>Trigger</Popover>,
};

// 5. RTL test
test('Popover positions correctly in RTL', async ({ page }) => {
  await page.goto('/ar');
  await page.click('[data-testid="popover-trigger"]');
  // Assert position
});
```

### 7.2 Multi-Brand Theme Architecture

```typescript
// Tenant-specific theme from CompanyConfig
export class ThemeManager {
  constructor(private config: CompanyConfig) {}

  getTheme() {
    const brandTheme = brandThemes[this.config.brandId || "default"];
    const localizedTheme = createLocalizedTheme(this.config.localization.language);

    return createMantineTheme({
      ...brandTheme,
      ...localizedTheme,
    });
  }

  // Or build-time theme generation
  static generateStaticThemes() {
    return {
      default: createMantineTheme(brandThemes.default, "en"),
      defaultAr: createMantineTheme(brandThemes.default, "ar"),
      agency: createMantineTheme(brandThemes.agency, "en"),
      agencyAr: createMantineTheme(brandThemes.agency, "ar"),
    };
  }
}
```

---

## 8. Performance Considerations

### 8.1 Bundle Size Analysis

**Current Stack:**

- Mantine UI: ~40KB gzipped (tree-shakeable)
- next-intl: ~10KB gzipped
- React: ~42KB gzipped
- **Total UI core: ~92KB gzipped**

**With Recommended Additions:**

- Ladle: 2MB (dev only, not in production)
- Radix UI: +5-10KB (only used components)
- **Total UI core: ~100KB gzipped**

**Verdict:** Minimal bundle impact, well within targets.

### 8.2 Runtime Performance

**CSS-in-JS Performance:**

- Mantine v9: ~2-5ms per component (cached)
- For typical dashboard (50 components): ~100-250ms total
- Acceptable for initial render
- Negligible for interactions (cached styles)

**Monitoring:**

```typescript
// Add performance monitoring
import { performance } from "perf_hooks";

function measureRender(componentName: string) {
  const start = performance.now();
  return () => {
    const end = performance.now();
    if (end - start > 16) {
      // >1 frame
      console.warn(`Slow render: ${componentName} took ${end - start}ms`);
    }
  };
}
```

---

## 9. Conclusion

The existing AgenticVerdict UI foundation (TanStack Start + Mantine UI v9) is solid and production-ready. The recommended enhancements provide incremental value without requiring disruptive migrations:

**Key Takeaways:**

1. **Augment, don't replace** Mantine v9 with Radix UI for specific gaps
2. **Keep CSS-in-JS** for perfect Mantine v9 integration and RTL support
3. **Add Ladle** for lightweight, zero-config component documentation
4. **Build custom tokens** on top of Mantine v9's theme system
5. **Expand RTL testing** to ensure Arabic layout quality

**Implementation effort is moderate (~3-5 weeks)** and can be done incrementally alongside feature development. No major architectural changes are needed.

---

## Appendix A: Quick Reference

### Package Installation

```bash
# Core (already installed)
pnpm add @mantine/core@^7.15.2 next-intl@^3.26.3

# Recommended additions
pnpm add @radix-ui/react-popover @radix-ui/react-tooltip @radix-ui/react-dropdown-menu
pnpm add -D @ladle/react
```

### File Structure

```
packages/ui/
├── src/
│   ├── theme/
│   │   ├── tokens.ts          # Design tokens
│   │   ├── theme.ts           # Mantine theme
│   │   └── brands.ts          # Multi-brand themes
│   ├── components/
│   │   ├── button/            # Mantine-based
│   │   ├── popover/           # Radix-based
│   │   └── ...
│   └── lib/
│       └── rtl-utils.ts       # RTL helpers
├── stories/                   # Ladle stories
│   ├── button.stories.tsx
│   └── popover.stories.tsx
└── package.json
```

### Configuration Files

```typescript
// ladle.config.ts
export default {
  stories: ["packages/ui/stories/**/*.stories.tsx"],
  vite: {
    css: {
      postcss: {
        plugins: [require("postcss-preset-mantine")],
      },
    },
  },
};
```

---

**Document Status:** ✅ Research Complete  
**Next Steps:** Present to architecture team for approval  
**Maintainer:** Architecture Team  
**Review Date:** 2026-04-25 (after Phase 1 UI foundation completion)

---

_This evaluation builds on the existing UI system foundation documented in [`BUSINESS_REQUIREMENTS.md`](./BUSINESS_REQUIREMENTS.md) and [`UI_IMPLEMENTATION_DETAILS.md`](./UI_IMPLEMENTATION_DETAILS.md)._
