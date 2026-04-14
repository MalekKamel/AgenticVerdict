# Research Findings: UI Foundation

**Feature**: UI Foundation (001-ui-foundation)
**Date**: 2026-04-14
**Status**: Phase 0 Complete

---

## Executive Summary

This research document consolidates findings from the comprehensive UI architecture research documented in `/docs/architecture/ui/00-overview.md` and related research findings. All technical decisions are grounded in production best practices, accessibility standards, and the specific requirements of AgenticVerdict's multi-tenant, multi-domain analytics platform.

**Key Decision**: All research questions have been resolved through the existing UI architecture documentation. The technology stack (TanStack Start + Mantine v9) is validated, and implementation patterns are documented. No additional research or prototyping is required before Phase 1 design.

---

## Technology Stack Validation

### TanStack Start Framework

**Decision**: Use TanStack Start as the web framework with file-based routing and load & action pattern.

**Rationale**:
- Modern framework with excellent TypeScript support
- File-based routing with type-safe navigation
- Built-in data loading with `load` and `action` functions
- Seamless tRPC v11 integration for unified API
- Server-side rendering with streaming support
- Active development and community (2025)

**Alternatives Considered**:
- **Next.js App Router**: Rejected due to complexity and experimental features instability
- **Remix**: Solid alternative but TanStack Start provides better TypeScript inference and tRPC integration
- **Nuxt**: Vue-based, not aligned with React ecosystem

**References**: `/docs/architecture/ui/01-research-findings/technology-evaluation.md#framework-evaluation`

### Mantine UI v9 Component Library

**Decision**: Use Mantine v9 as the primary component library.

**Rationale**:
- Comprehensive component library with 100+ production-ready components
- Built-in RTL support (no manual mirroring required)
- CSS-in-JS via emotion (v7) or native CSS (v9) for theme integration
- Excellent accessibility out of the box (WCAG 2.1 AA compliant)
- Flexible theming system with CSS custom properties
- MIT license (permissive for commercial use)
- Strong TypeScript support
- Active community and regular releases

**Alternatives Considered**:
- **Radix UI-only approach**: Rejected due to requiring extensive custom styling and component assembly
- **Chakra UI**: Rejected due to smaller community and less frequent updates
- **Material-UI**: Rejected due to opinionated design language and heavier bundle size

**References**: `/docs/architecture/ui/01-research-findings/technology-evaluation.md#component-library-evaluation`

### CSS-in-JS Styling

**Decision**: Use Mantine v9's native CSS-in-JS with emotion integration for dynamic theming.

**Rationale**:
- Theme integration with CSS custom properties for runtime theming
- Automatic RTL handling (no manual directional properties needed)
- Server-side rendering compatible
- Zero-runtime CSS extraction for production builds
- Co-located styles with components for maintainability

**Alternatives Considered**:
- **Tailwind CSS**: Rejected due to utility-first approach conflicting with atomic design methodology
- **CSS Modules**: Rejected due to lack of dynamic theming support
- **Styled Components**: Rejected due to larger bundle size and slower performance

**References**: `/docs/architecture/ui/01-research-findings/technology-evaluation.md#styling-approach-evaluation`

### Internationalization Strategy

**Decision**: Use @tanstack/react-router i18n for file-based route internationalization with automatic RTL detection.

**Rationale**:
- File-based route organization for localized content (`$lang/` routes)
- Type-safe translation keys with TypeScript
- Automatic locale detection from URL or browser settings
- Integrated with TanStack Router's type system
- Supports date, number, and currency formatting per locale
- Pluralization and context-aware translations

**Alternatives Considered**:
- **next-intl**: Next.js specific, not compatible with TanStack Start
- **react-i18next**: Solid alternative but less integrated with file-based routing
- **formatjs**: Lower-level, requires more setup

**RTL Implementation**:
- DirectionProvider wraps the application and sets `dir="rtl"` or `dir="ltr"` on the root element
- All components use CSS logical properties (`margin-inline-start` instead of `margin-left`)
- Mantine v9 automatically handles layout mirroring for flexbox and grid
- Directional icons flipped via CSS transforms when `dir="rtl"`

**References**: `/docs/architecture/ui/01-research-findings/technology-evaluation.md#internationalization-evaluation`

### Component Documentation

**Decision**: Use Ladle for zero-config component documentation and development.

**Rationale**:
- Zero-configuration setup with Vite
- Built-in TypeScript support
- Hot module reloading for fast development
- Lightweight alternative to Storybook
- Supports MDX for rich documentation
- Integrates with Mantine components out of the box

**Alternatives Considered**:
- **Storybook**: Rejected due to complex configuration and slower build times
- **Component Docs**: Custom implementation rejected due to maintenance overhead

**References**: `/docs/architecture/ui/01-research-findings/technology-evaluation.md#documentation-tools-evaluation`

---

## Design Token System Architecture

### Three-Tier Token Structure

**Decision**: Implement three-tier design token system (global → brand → component) using CSS custom properties.

**Rationale**:
- **Global tokens** (tier 1): Brand-agnostic design decisions (spacing scale, color system, typography scale)
- **Brand tokens** (tier 2): Tenant-specific overrides (primary color, secondary color, font family, logo)
- **Component tokens** (tier 3): Composed from global and brand tokens using CSS custom property references

**Implementation Pattern**:

```css
/* Global tokens (brand-agnostic) */
:root {
  --av-color-blue-50: #e7f5ff;
  --av-color-blue-500: #228BE6;
  --av-color-blue-900: #101828;

  --av-spacing-xs: 0.25rem;
  --av-spacing-sm: 0.5rem;
  --av-spacing-md: 1rem;
  --av-spacing-lg: 1.5rem;
  --av-spacing-xl: 2rem;

  --av-radius-sm: 0.25rem;
  --av-radius-md: 0.5rem;
  --av-radius-lg: 0.75rem;

  --av-font-size-sm: 0.875rem;
  --av-font-size-md: 1rem;
  --av-font-size-lg: 1.125rem;
}

/* Brand tokens (tenant-specific, loaded dynamically) */
[data-theme="masafh"] {
  --brand-color-primary: #FF6B35;
  --brand-color-secondary: #4C6EF5;
  --brand-font-family: 'Inter', system-ui, sans-serif;
  --brand-logo-url: url(/logos/masafh.svg);
}

[data-theme="default"] {
  --brand-color-primary: var(--av-color-blue-500);
  --brand-color-secondary: var(--av-color-blue-900);
  --brand-font-family: system-ui, -apple-system, sans-serif;
  --brand-logo-url: url(/logos/agenticverdict.svg);
}

/* Component tokens (composed from global and brand) */
:root {
  --button-primary-bg: var(--brand-color-primary, var(--av-color-blue-500));
  --button-primary-text: #ffffff;
  --button-primary-hover: color-mix(in srgb, var(--button-primary-bg) 90%, black);

  --card-padding: var(--av-spacing-md);
  --card-radius: var(--av-radius-md);
  --card-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

**Benefits**:
- Single source of truth for design values
- Runtime theming without application rebuild
- Tenant isolation via data attributes
- CSS-level inheritance and composition
- Design tool synchronization ready (future Style Dictionary integration)

**References**: `/docs/architecture/ui/01-research-findings/design-system-landscape.md#token-architecture`

---

## Atomic Design Component Organization

### Five-Level Hierarchy

**Decision**: Organize components using atomic design methodology with five levels: atoms, molecules, organisms, templates, and pages.

**Rationale**:
- **Atoms** (level 1): Basic building blocks that cannot be broken down further (Button, Input, Icon)
- **Molecules** (level 2): Simple combinations of atoms with business logic (FormField, SearchInput, Card)
- **Organisms** (level 3): Complex sections composed of molecules and atoms (DataTable, DashboardCard, Navigation)
- **Templates** (level 4): Page layouts without content (DashboardLayout, AuthLayout)
- **Pages** (level 5): Complete views with content (Dashboard, Connectors, Reports)

**Component Catalog (Foundation Phase)**:

**Atoms (10 components)**:
1. Button - Variants: primary, secondary, ghost, danger, success, warning; Sizes: xs, sm, md, lg, xl
2. Input - Types: text, email, password, number, search; Sizes: sm, md, lg; States: error, warning, success
3. Checkbox - Boolean selection with indeterminate state
4. Radio - Single choice within a group
5. Switch - Toggle control for settings
6. Badge - Status indicators and labels
7. Icon - Icon wrapper with size and color props
8. Typography - Text components with semantic variants (h1-h6, p, span, code)
9. Link - Navigation and action links
10. Separator - Visual dividers
11. Spinner - Loading indicator

**Molecules (10 components)**:
1. FormField - Composed label + input + helper + error
2. SearchInput - Input with search icon and clear button
3. Card - Container with header, body, footer sections
4. Dropdown - Menu with keyboard navigation
5. Select - Dropdown selection with search
6. DatePicker - Date input with calendar popup
7. Tooltip - Hover or click information display
8. Popover - Positioned content container
9. Alert - Dismissible status messages
10. Toast - Notification system

**Organisms (5 components - Future Phase)**:
1. DataTable - Sortable, filterable data grid
2. DashboardCard - Metric display with trend
3. Navigation - Main navigation menu
4. Sidebar - Collapsible side panel
5. Header - Top bar with user menu

**Templates (3 layouts - Future Phase)**:
1. DashboardLayout - Main app layout with sidebar and header
2. AuthLayout - Centered authentication layout
3. ReportLayout - Full-width report viewing layout

**References**: `/docs/architecture/ui/01-research-findings/design-system-landscape.md#component-organization`

---

## RTL/LTR Layout Implementation

### Logical Properties Strategy

**Decision**: Use CSS logical properties exclusively for directional styling, enabling automatic RTL/LTR layout switching.

**Implementation Guidelines**:

| Directional Property | Logical Property | Notes |
|---------------------|------------------|-------|
| `margin-left` | `margin-inline-start` | Mirrors in RTL |
| `margin-right` | `margin-inline-end` | Mirrors in RTL |
| `padding-left` | `padding-inline-start` | Mirrors in RTL |
| `padding-right` | `padding-inline-end` | Mirrors in RTL |
| `text-align: left` | `text-align: start` | Respects direction |
| `text-align: right` | `text-align: end` | Respects direction |
| `border-left` | `border-inline-start` | Mirrors in RTL |
| `border-right` | `border-inline-end` | Mirrors in RTL |

**DirectionProvider Implementation**:

```typescript
// packages/ui/src/providers/DirectionProvider.tsx
import { createContext, useContext, useEffect } from 'react';

type Direction = 'ltr' | 'rtl';

interface DirectionContextValue {
  direction: Direction;
  setDirection: (dir: Direction) => void;
}

const DirectionContext = createContext<DirectionContextValue | undefined>(undefined);

export function DirectionProvider({ children, initialDir = 'ltr' }: {
  children: React.ReactNode;
  initialDir?: Direction;
}) {
  const [direction, setDirection] = useState<Direction>(initialDir);

  useEffect(() => {
    document.documentElement.setAttribute('dir', direction);
  }, [direction]);

  return (
    <DirectionContext.Provider value={{ direction, setDirection }}>
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

**Icon Mirroring**:

Directional icons (arrows, chevrons) must flip in RTL mode:

```css
/* Automatic icon flipping in RTL */
[dir="rtl"] .icon-arrow-left {
  transform: scaleX(-1);
}

/* Or use a CSS class for manual control */
.icon-mirror {
  transform: scaleX(-1);
}
```

**Mantine v9 RTL Support**:

Mantine v9 includes comprehensive RTL support:
- All components use logical properties internally
- Automatic layout mirroring for flexbox and grid
- RTL-aware components (Calendar, DatePicker, Stepper)
- Right-to-left text input handling

**References**: `/docs/architecture/ui/01-research-findings/accessibility-standards.md#rtl-implementation`

---

## Accessibility Implementation

### WCAG 2.1 AA Compliance Strategy

**Decision**: Embed accessibility into every component with automated testing via axe-core and manual testing with screen readers.

**Implementation Requirements**:

1. **Keyboard Accessibility**:
   - All interactive components reachable via Tab key
   - Visible focus indicators (2px solid outline with offset)
   - Enter and Space for activation (buttons, links)
   - Escape for closing modals and dropdowns
   - Arrow keys for navigation within components (dropdowns, tabs)

2. **Screen Reader Support**:
   - Semantic HTML elements (button, input, nav, main)
   - ARIA labels for icon-only buttons
   - ARIA described-by for error messages
   - ARIA live regions for dynamic content (toasts, alerts)
   - Proper heading hierarchy (h1 → h2 → h3)

3. **Color Contrast**:
   - 4.5:1 minimum for normal text (<18pt or <14pt bold)
   - 3:1 minimum for large text (≥18pt or ≥14pt bold)
   - 3:1 minimum for UI components and graphics
   - Never use color alone to convey information

4. **Touch Targets**:
   - Minimum 44×44 CSS pixels for all interactive elements
   - Spacing between adjacent targets (prevents accidental activation)

5. **Forms and Labels**:
   - All inputs have visible labels associated via `htmlFor`
   - Required fields indicated programmatically (aria-required)
   - Error messages announced via aria-describedby
   - Clear error messages that describe the issue and solution

**Testing Strategy**:

```typescript
// Vitest accessibility tests
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Button accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

**CI Integration**:

```yaml
# .github/workflows/accessibility.yml
name: Accessibility
on: [push, pull_request]
jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm test:a11y  # Run axe-core tests
```

**References**: `/docs/architecture/ui/01-research-findings/accessibility-standards.md`

---

## Performance Optimization Strategy

### Bundle Size Targets

**Decision**: Achieve <500KB initial bundle through strategic code splitting and lazy loading.

**Implementation Strategy**:

1. **Route-Based Code Splitting**:
   ```typescript
   // TanStack Start automatic splitting
   // routes/dashboard/index.tsx automatically split
   export default function Dashboard() {
     // Only loaded when navigating to /dashboard
   }
   ```

2. **Component Lazy Loading**:
   ```typescript
   // Lazy load heavy components (>50KB)
   const Chart = lazy(() => import('./Chart'));
   const DataTable = lazy(() => import('./DataTable'));
   ```

3. **Tree-Shakeable Imports**:
   ```typescript
   // Good: Tree-shakeable
   import { Button, Input } from '@agenticverdict/ui';

   // Bad: Imports entire library
   import * as UI from '@agenticverdict/ui';
   ```

4. **Virtual Scrolling**:
   ```typescript
   // For large lists (>100 items)
   import { useVirtualizer } from '@tanstack/react-virtual';

   function LargeList({ items }) {
     const parentRef = useRef();
     const virtualizer = useVirtualizer({
       count: items.length,
       getScrollElement: () => parentRef.current,
       estimateSize: () => 50,
     });
     // Render only visible items
   }
   ```

5. **Image Optimization**:
   ```typescript
   // TanStack Start image component with WebP/AVIF
   import { Image } from '@tanstack/start/image';

   <Image
     src="/hero.jpg"
     formats={['avif', 'webp', 'jpg']}
     sizes="(max-width: 768px) 100vw, 50vw"
   />
   ```

**Performance Budgets**:

```json
// .size-limit.json
{
  "limits": [
    {
      "path": "packages/ui/dist/index.js",
      "limit": "300 KB",
      "gzip": true
    },
    {
      "path": "apps/web/dist/index.js",
      "limit": "500 KB",
      "gzip": true
    }
  ]
}
```

**Monitoring**:

```typescript
// Core Web Vitals tracking
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

onCLS(console.log);
onFID(console.log);
onFCP(console.log);
onLCP(console.log);
onTTFB(console.log);
```

**References**: `/docs/architecture/ui/01-research-findings/performance-optimization.md`

---

## Multi-Tenant Theming Implementation

### Runtime Theme Switching

**Decision**: Load tenant themes at runtime via API, applying them through CSS custom properties without code changes or page reload.

**Implementation Pattern**:

```typescript
// packages/ui/src/providers/ThemeProvider.tsx
interface TenantTheme {
  id: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  logo: string;
}

export function ThemeProvider({ children, tenant }: {
  children: React.ReactNode;
  tenant: TenantTheme;
}) {
  useEffect(() => {
    // Apply tenant theme via CSS custom properties
    const root = document.documentElement;

    root.style.setProperty('--brand-color-primary', tenant.colors.primary);
    root.style.setProperty('--brand-color-secondary', tenant.colors.secondary);
    root.style.setProperty('--brand-color-accent', tenant.colors.accent);
    root.style.setProperty('--brand-font-primary', tenant.fonts.primary);
    root.style.setProperty('--brand-font-secondary', tenant.fonts.secondary);

    root.setAttribute('data-theme', tenant.id);
  }, [tenant]);

  return <MantineProvider theme={createTheme(tenant)}>{children}</MantineProvider>;
}
```

**Theme Validation**:

```typescript
// Validate theme configuration before applying
import { z } from 'zod';

const TenantThemeSchema = z.object({
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
    secondary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
  }),
  fonts: z.object({
    primary: z.string().min(1),
    secondary: z.string().min(1),
  }),
  logo: z.string().url(),
});

// Parse and validate theme from API
const theme = TenantThemeSchema.parse(response.data);
```

**Fallback Strategy**:

```css
/* Fallback values in component tokens */
:root {
  --button-primary-bg: var(--brand-color-primary, var(--av-color-blue-500));
  /* If brand token missing, use global token */
}

/* Default theme for unauthenticated pages */
[data-theme="default"] {
  --brand-color-primary: var(--av-color-blue-500);
  --brand-color-secondary: var(--av-color-blue-900);
}
```

**References**: `/docs/architecture/ui/01-research-findings/design-system-landscape.md#multi-tenant-theming`

---

## Testing Strategy

### Component Testing Approach

**Decision**: Multi-layered testing strategy with Vitest for unit tests, Playwright for E2E tests, and axe-core for accessibility.

**Unit Testing with Vitest**:

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

**Visual Regression Testing with Playwright**:

```typescript
// Button.visual.test.tsx
import { test, expect } from '@playwright/experimental-ct-react';

test('button visual variants', async ({ mount }) => {
  const component = await mount(<Button variant="primary">Primary</Button>);
  await expect(component).toHaveScreenshot('button-primary.png');
});
```

**Accessibility Testing with axe-core**:

```typescript
// Button.a11y.test.tsx
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';
import { Button } from './Button';

expect.extend(toHaveNoViolations);

describe('Button accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button>Accessible button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible name when icon-only', () => {
    render(<Button aria-label="Close dialog"><IconX /></Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close dialog');
  });
});
```

**RTL Testing**:

```typescript
// Button.rtl.test.tsx
import { render } from '@testing-library/react';
import { DirectionProvider } from '../providers/DirectionProvider';
import { Button } from './Button';

describe('Button RTL', () => {
  it('should mirror correctly in RTL', () => {
    render(
      <DirectionProvider initialDir="rtl">
        <Button leftIcon={<IconArrow />}>Button with icon</Button>
      </DirectionProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('dir', 'rtl');
  });
});
```

**Test Coverage Targets**:

- **Unit Tests**: 70%+ coverage for UI components
- **Business Logic Components**: 80%+ coverage
- **Accessibility Tests**: 100% of components tested with axe-core
- **Visual Tests**: 100% of components have screenshot baseline
- **RTL Tests**: 100% of components tested in both LTR and RTL

**References**: `/docs/02-planning-and-methodology/testing-strategy.md`

---

## Implementation Checklist

### Phase 1: Design & Contracts

- [ ] Define component prop interfaces with TypeScript
- [ ] Document design token structure and naming conventions
- [ ] Create component API contract documentation
- [ ] Define accessibility requirements for each component
- [ ] Specify RTL behavior for directional components

### Phase 2: Implementation

- [ ] Set up TanStack Start project structure
- [ ] Install and configure Mantine v9
- [ ] Implement DirectionProvider and ThemeProvider
- [ ] Create global design tokens (CSS custom properties)
- [ ] Implement atom components (Button, Input, etc.)
- [ ] Implement molecule components (FormField, Card, etc.)
- [ ] Write unit tests for all components
- [ ] Write accessibility tests with axe-core
- [ ] Write visual regression tests with Playwright
- [ ] Set up Ladle for component documentation

### Phase 3: Polish

- [ ] Document RTL patterns and guidelines
- [ ] Create component usage examples
- [ ] Performance optimization (bundle analysis, lazy loading)
- [ ] Accessibility audit with screen readers (NVDA, JAWS, VoiceOver)
- [ ] Multi-tenant theming validation with test themes

---

## Open Questions and Resolutions

| Question | Resolution | Reference |
|----------|------------|-----------|
| How to extend Mantine components while maintaining type safety? | Use Mantine's polymorphic component factory with `extendTheme` for customization | Technology Evaluation §4.2 |
| Best approach for three-tier token system with CSS variables? | Use CSS custom properties with var() fallbacks to global tokens | Design System Landscape §3.1 |
| How to handle icon flipping in RTL mode? | CSS transform scaleX(-1) with [dir="rtl"] selector or manual mirror class | Accessibility Standards §4.3 |
| Ladle vs Storybook for component documentation? | Ladle chosen for zero-config setup and Vite integration | Technology Evaluation §6.1 |
| How to integrate tRPC with TanStack Start i18n? | Use tRPC router with locale-aware procedures and @tanstack/react-router i18n | Architecture Overview §4.2 |
| Best pattern for Playwright visual regression testing? | Use Playwright CT component testing with screenshot comparison | Testing Strategy §3.3 |
| How to automate accessibility testing in CI? | Integrate axe-core with Vitest and GitHub Actions workflow | Accessibility Standards §5.2 |

**Status**: All open questions resolved. Ready to proceed to Phase 1: Design & Contracts.

---

## References

### Primary Documentation

- **UI Architecture Overview**: `/docs/architecture/ui/00-overview.md`
- **Design System Research**: `/docs/architecture/ui/01-research-findings/design-system-landscape.md`
- **Technology Evaluation**: `/docs/architecture/ui/01-research-findings/technology-evaluation.md`
- **Accessibility Standards**: `/docs/architecture/ui/01-research-findings/accessibility-standards.md`
- **Performance Optimization**: `/docs/architecture/ui/01-research-findings/performance-optimization.md`
- **Best Practices**: `/docs/architecture/ui/01-research-findings/best-practices.md`

### Related Architecture Documents

- **Technical Architecture**: `/docs/architecture/business/technical-architecture.md`
- **Implementation Guide**: `/docs/architecture/business/implementation-guide.md`
- **Testing Strategy**: `/docs/02-planning-and-methodology/testing-strategy.md`
- **Business Architecture**: `/docs/architecture/business/business-architecture.md`

### External Resources

- [TanStack Start Documentation](https://tanstack.com/start/latest)
- [Mantine UI Documentation](https://mantine.dev/)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_customize&levels=aaa)
- [CSS Logical Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties)
- [axe-core Documentation](https://www.deque.com/axe/)
