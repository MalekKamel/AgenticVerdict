# UI Migration Guide

**Document Version:** 1.1
**Last Updated:** April 13, 2026
**Status:** Active Implementation Guide
**Component:** AgenticVerdict UI System

---

## Note: API Architecture

**AgenticVerdict uses tRPC v11 as the unified API layer** (see `/prompts/tanstack-start-full-stack-adoption.md`). No API migration is needed—we're building with tRPC from the start. This document covers **UI library migration** (Mantine, MUI, Chakra, etc.), styling, i18n, and testing.

---

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Component Migration](#component-migration)
3. [Styling Migration](#styling-migration)
4. [i18n Migration](#i18n-migration)
5. [Testing Migration](#testing-migration)
6. [Rollout Strategy](#rollout-strategy)
7. [Migration Checklist](#migration-checklist)

---

## 1. Migration Overview

### 1.1 What Needs Migration

The AgenticVerdict UI system migration typically involves one or more of these scenarios:

**New Projects (No Migration Needed)**

- Starting fresh with Next.js 15 + Mantine v7
- Follow patterns from [patterns.md](../02-design-system-specification/patterns.md)
- Use design tokens from [design-tokens.md](../02-design-system-specification/design-tokens.md)

**Migrating from Other UI Libraries**

- Material-UI (MUI)
- Chakra UI
- Ant Design
- React Bootstrap
- Custom component libraries

**Upgrading Within Mantine Ecosystem**

- Mantine v6 → v7
- Mantine hooks-only adoption → full component library
- Adding Radix UI primitives for accessibility gaps

**Adding Multi-Language Support**

- English-only → Arabic + English
- Adding RTL support to existing LTR layouts
- String externalization for i18n

### 1.2 Migration Priorities

**High Priority (Security & Accessibility)**

1. Accessibility compliance gaps (WCAG 2.1 AA)
2. RTL layout issues for Arabic users
3. Critical user paths (authentication, data export)
4. Keyboard navigation fixes

**Medium Priority (Developer Experience)**

1. Component consistency across the app
2. Design token adoption
3. Form validation patterns
4. Loading state standardization

**Low Priority (Enhancement)**

1. Visual polish and micro-interactions
2. Performance optimizations
3. Advanced patterns (virtual scrolling, lazy loading)
4. Documentation site setup

### 1.3 Risk Assessment

| Migration Type             | Risk Level | Time Estimate | Rollback Complexity           |
| -------------------------- | ---------- | ------------- | ----------------------------- |
| New components only        | 🟢 Low     | 1-2 days      | Simple (delete new files)     |
| Mantine v6 → v7            | 🟡 Medium  | 3-5 days      | Moderate (git revert)         |
| Other UI library → Mantine | 🟠 High    | 1-2 weeks     | Complex (feature flag needed) |
| Adding RTL support         | 🟠 High    | 1 week        | Moderate (CSS changes)        |
| String externalization     | 🟡 Medium  | 3-5 days      | Simple (revert commits)       |

**Risk Mitigation Strategies:**

- Create feature flags for major UI changes
- Migrate incrementally by route/feature
- Maintain parallel implementations during transition
- Comprehensive automated testing before rollout
- Beta testing with select users

---

## 2. Component Migration

### 2.1 Migrating from Other UI Libraries

#### Material-UI (MUI) → Mantine

**Button Migration**

```tsx
// ❌ Before (MUI)
import { Button } from "@mui/material";

<button variant="contained" color="primary" size="large">
  Click me
</button>;

// ✅ After (Mantine)
import { Button } from "@mantine/core";

<Button variant="filled" size="lg" onClick={handleClick}>
  Click me
</Button>;
```

**Input Field Migration**

```tsx
// ❌ Before (MUI)
import { TextField } from "@mui/material";

<TextField label="Email" variant="outlined" error={hasError} helperText={errorMessage} fullWidth />;

// ✅ After (Mantine)
import { TextInput } from "@mantine/core";

<TextInput
  label="Email"
  error={hasError ? errorMessage : undefined}
  description={hasError ? undefined : "Enter your email"}
  styles={{ input: { width: "100%" } }}
/>;
```

**Grid System Migration**

```tsx
// ❌ Before (MUI)
import { Grid, Paper } from "@mui/material";

<Grid container spacing={2}>
  <Grid item xs={12} md={6}>
    <Paper>Content</Paper>
  </Grid>
</Grid>;

// ✅ After (Mantine)
import { SimpleGrid, Paper } from "@mantine/core";

<SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
  <Paper withBorder p="md">
    Content
  </Paper>
</SimpleGrid>;
```

#### Chakra UI → Mantine

**Modal Migration**

```tsx
// ❌ Before (Chakra)
import { Modal, ModalOverlay, ModalContent } from "@chakra-ui/react";

<Modal isOpen={isOpen} onClose={onClose}>
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>Title</ModalHeader>
    <ModalBody>Content</ModalBody>
  </ModalContent>
</Modal>;

// ✅ After (Mantine)
import { Modal } from "@mantine/core";

<Modal opened={isOpen} onClose={onClose} title="Title">
  <Modal.Content>Content</Modal.Content>
</Modal>;
```

#### Ant Design → Mantine

**Table Migration**

```tsx
// ❌ Before (Ant Design)
import { Table } from "antd";

<Table dataSource={data} columns={columns} pagination={{ pageSize: 10 }} />;

// ✅ After (Mantine)
import { Table } from "@mantine/core";

<Table data={data} columns={columns} pageSize={10} />;
```

### 2.2 Migrating from Older Mantine Versions

**Mantine v6 → v7 Breaking Changes**

```tsx
// ❌ Mantine v6
import { TextInput, PasswordInput } from "@mantine/core";

<TextInput
  required
  label="Email"
  placeholder="your@email.com"
  styles={(theme) => ({
    input: {
      "&:focus-within": {
        borderColor: theme.colors.blue[5],
      },
    },
  })}
/>;

// ✅ Mantine v7
import { TextInput } from "@mantine/core";

<TextInput
  withAsterisk
  label="Email"
  placeholder="your@email.com"
  styles={{
    input: {
      "&:focus-within": {
        borderColor: "var(--mantine-color-blue-5)",
      },
    },
  }}
/>;
```

**Key Breaking Changes:**

1. `required` → `withAsterisk`
2. `theme.colors` → CSS custom properties
3. `useMantineTheme` hook removed (use CSS variables directly)
4. Global styles now use `Global` component
5. Provider props renamed (`withGlobalStyles` removed)

### 2.3 Breaking Changes Checklist

**Component Props**

- [ ] Update `required` → `withAsterisk` on form inputs
- [ ] Replace `styles` function with object syntax where applicable
- [ ] Update `size` prop values (sm/md/lg vs S/M/L)
- [ ] Check `variant` prop names for changes

**Styling**

- [ ] Convert theme function calls to CSS variables
- [ ] Update emotion-based styles to Mantine v7 syntax
- [ ] Remove deprecated `useMantineTheme` hooks
- [ ] Update global styles to use `Global` component

**Imports**

- [ ] Update import paths for moved components
- [ ] Remove deprecated `@mantine/hooks` imports (now in core)
- [ ] Update `@mantine/styles` imports (package removed)

**RTL**

- [ ] Test all components in RTL mode
- [ ] Replace directional CSS with logical properties
- [ ] Update icon mirroring for RTL

### 2.4 Migration Patterns

**Pattern 1: Thin Wrapper Pattern**

For consistent app-wide defaults:

```tsx
// apps/frontend/src/components/ui/AppButton.tsx
import { Button, type ButtonProps } from "@mantine/core";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type AppButtonProps = ButtonProps &
  Pick<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
    children: ReactNode;
  };

export function AppButton({ children, radius = "md", type = "button", ...props }: AppButtonProps) {
  return (
    <Button radius={radius} type={type} {...props}>
      {children}
    </Button>
  );
}
```

**Pattern 2: Composition Pattern**

For complex business components:

```tsx
// apps/frontend/src/components/organisms/ConnectorCard.tsx
import { AppCard } from "@/components/ui/AppCard";
import { AppButton } from "@/components/ui/AppButton";
import { Badge } from "@mantine/core";
import { useTranslations } from "next-intl";

export function ConnectorCard({ connector }: { connector: Connector }) {
  const t = useTranslations("Connectors");

  return (
    <AppCard>
      <Group justify="space-between">
        <Text fw={600}>{connector.name}</Text>
        <Badge color={connector.isConnected ? "green" : "gray"} variant="light">
          {t(connector.isConnected ? "connected" : "disconnected")}
        </Badge>
      </Group>
      <AppButton mt="md">{t("configure")}</AppButton>
    </AppCard>
  );
}
```

**Pattern 3: Accessibility Wrapper Pattern**

For enhanced accessibility beyond Mantine defaults:

```tsx
// apps/frontend/src/components/ui/AccessiblePopover.tsx
import { Popover } from "@mantine/core";
import * as RadixPopover from "@radix-ui/react-popover";

export function AccessiblePopover({ children, ...props }) {
  return (
    <RadixPopover.Root>
      <RadixPopover.Trigger asChild>
        <Popover.Trigger>{trigger}</Popover.Trigger>
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content align="start" sideOffset={8} aria-close-label="Close popover">
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
```

---

## 3. Styling Migration

### 3.1 Moving to Design Tokens

**Before: Hardcoded Values**

```tsx
// ❌ Before
<div
  style={{
    padding: "16px",
    borderRadius: "8px",
    backgroundColor: "#1976D2",
  }}
>
  Content
</div>
```

**After: Design Tokens**

```tsx
// ✅ After
import { Box } from "@mantine/core";

<Box p="md" radius="md" bg="primary">
  Content
</Box>;
```

**Three-Tier Token Usage**

```tsx
// Global token (brand-agnostic)
<Box bg="blue.7">Primary action</Box>

// Brand token (semantic, theme-aware)
<Box bg="primary">Primary action</Box>

// Component token (composed)
<Button colorScheme="brand">Submit</Button>
```

### 3.2 Theme Migration

**Migrate from Custom Theme to Mantine Theme**

```tsx
// ❌ Before: Custom theme object
const customTheme = {
  colors: {
    primary: "#1976D2",
    secondary: "#DC004E",
  },
  spacing: {
    sm: "8px",
    md: "16px",
  },
};

// ✅ After: Mantine theme
import { MantineProvider, createTheme } from "@mantine/core";

const theme = createTheme({
  colors: {
    primary: ["#1976D2", "#1565C0", "#0D47A1"],
    brand: ["#FF6B35", "#E85D2A", "#D14F20"],
  },
  spacing: {
    xs: "0.625rem", // 10px
    sm: "0.75rem", // 12px
    md: "1rem", // 16px
    lg: "1.25rem", // 20px
    xl: "1.5rem", // 24px
  },
  fontFamily: "Inter, sans-serif",
  borderRadius: {
    sm: "0.25rem", // 4px
    md: "0.5rem", // 8px
    lg: "0.75rem", // 12px
  },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <MantineProvider theme={theme}>{children}</MantineProvider>;
}
```

**CSS Custom Properties Integration**

```css
/* globals.css */
:root {
  /* Global tokens */
  --av-color-primary: #228be6;
  --av-spacing-md: 1rem;
  --av-radius-md: 0.5rem;

  /* Brand tokens (tenant-specific) */
  --brand-color-primary: #ff6b35;
  --brand-logo-url: /logos/masafh.svg;
}
```

```tsx
// Dynamic theme injection per tenant
import { useTenantConfig } from "@/hooks/useTenantConfig";

export function TenantThemeProvider({ children }) {
  const { config } = useTenantConfig();

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--brand-color-primary",
      config.branding.primaryColor,
    );
  }, [config]);

  return <>{children}</>;
}
```

### 3.3 RTL Considerations

**Before: Directional CSS**

```css
/* ❌ Before: LTR-specific */
.sidebar {
  margin-left: 20px;
  padding-left: 16px;
  border-left: 2px solid #ccc;
  text-align: left;
}

.arrow-icon {
  transform: rotate(0deg);
}

/* RTL override */
[dir="rtl"] .sidebar {
  margin-left: 0;
  margin-right: 20px;
  padding-left: 0;
  padding-right: 16px;
  border-left: none;
  border-right: 2px solid #ccc;
  text-align: right;
}

[dir="rtl"] .arrow-icon {
  transform: rotate(180deg);
}
```

**After: Logical Properties**

```css
/* ✅ After: RTL-agnostic */
.sidebar {
  margin-inline-start: 20px;
  padding-inline-start: 16px;
  border-inline-start: 2px solid #ccc;
  text-align: start;
}

.arrow-icon {
  /* Mantine handles icon mirroring automatically */
  /* or use logical icon components */
}

[data-mantine-direction="rtl"] .arrow-icon {
  transform: scaleX(-1);
}
```

**Mantine Automatic RTL Handling**

```tsx
import { DirectionProvider } from "@mantine/core";

// App-level direction provider
export function Providers({ children, locale }: { children: React.ReactNode; locale: string }) {
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <DirectionProvider initialDirection={direction}>
      <MantineProvider>{children}</MantineProvider>
    </DirectionProvider>
  );
}
```

**Component-Level RTL Testing**

```tsx
// Test components in both directions
import { render, screen } from "@testing-library/react";
import { DirectionProvider } from "@mantine/core";

describe("Component RTL", () => {
  it("renders correctly in LTR", () => {
    render(
      <DirectionProvider initialDirection="ltr">
        <MyComponent />
      </DirectionProvider>,
    );
    // LTR assertions
  });

  it("renders correctly in RTL", () => {
    render(
      <DirectionProvider initialDirection="rtl">
        <MyComponent />
      </DirectionProvider>,
    );
    // RTL assertions
  });
});
```

---

## 4. i18n Migration

### 4.1 String Externalization

**Before: Hardcoded Strings**

```tsx
// ❌ Before
function Dashboard() {
  return (
    <div>
      <h1>Marketing Dashboard</h1>
      <p>Welcome back, User</p>
      <button>View Reports</button>
    </div>
  );
}
```

**After: next-intl Integration**

```tsx
// ✅ After
import { useTranslations } from "next-intl";

function Dashboard() {
  const t = useTranslations("Dashboard");

  return (
    <div>
      <h1>{t("title")}</h1>
      <p>{t("welcome", { name: user.name })}</p>
      <button>{t("viewReports")}</button>
    </div>
  );
}
```

**Message Files Structure**

```json
// messages/en.json
{
  "Dashboard": {
    "title": "Marketing Dashboard",
    "welcome": "Welcome back, {name}",
    "viewReports": "View Reports"
  }
}

// messages/ar.json
{
  "Dashboard": {
    "title": "لوحة التسويق",
    "welcome": "مرحبًا بعودتك، {name}",
    "viewReports": "عرض التقارير"
  }
}
```

### 4.2 Language Switching

**Language Switcher Component**

```tsx
// components/layout/LanguageSwitcher.tsx
import { useRouter, usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { SegmentedControl } from "@mantine/core";

export function LanguageSwitcher() {
  const t = useTranslations("Common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (value: string) => {
    // Navigate to the same path with new locale
    router.replace(pathname, { locale: value });
  };

  return (
    <SegmentedControl
      value={locale}
      onChange={handleChange}
      data={[
        { label: "English", value: "en" },
        { label: "العربية", value: "ar" },
      ]}
    />
  );
}
```

### 4.3 RTL Layout Adaptation

**Automatic Direction Detection**

```tsx
// middleware.ts
import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["en", "ar"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

**Dynamic Direction in Layouts**

```tsx
// app/[locale]/layout.tsx
import { DirectionProvider } from "@mantine/core";
import { useLocale } from "next-intl";

export default function Layout({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={direction}>
      <body>
        <DirectionProvider initialDirection={direction}>{children}</DirectionProvider>
      </body>
    </html>
  );
}
```

**Date and Currency Formatting**

```tsx
import { useFormatter } from "next-intl";

function MetricCard({ value, currency, date }: MetricCardProps) {
  const format = useFormatter();

  return (
    <div>
      <div>{format.number(value, { style: "currency", currency })}</div>
      <div>
        {format.dateTime(date, {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>
    </div>
  );
}
```

---

## 5. Testing Migration

### 5.1 Converting Existing Tests

**Before: Enzyme Tests**

```tsx
// ❌ Before: Enzyme
import { mount } from "enzyme";

it("calls onClick when button is clicked", () => {
  const onClick = jest.fn();
  const wrapper = mount(<Button onClick={onClick}>Click</Button>);

  wrapper.find("button").simulate("click");

  expect(onClick).toHaveBeenCalledTimes(1);
});
```

**After: React Testing Library**

```tsx
// ✅ After: React Testing Library
import { render, screen, fireEvent } from "@testing-library/react";

it("calls onClick when button is clicked", () => {
  const onClick = jest.fn();
  render(<Button onClick={onClick}>Click</Button>);

  fireEvent.click(screen.getByRole("button", { name: "Click" }));

  expect(onClick).toHaveBeenCalledTimes(1);
});
```

**Vitest Migration from Jest**

```tsx
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
```

```tsx
// Button.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppButton } from "./AppButton";

describe("AppButton", () => {
  it("renders children correctly", () => {
    render(<AppButton>Click me</AppButton>);
    expect(screen.getByRole("button")).toHaveTextContent("Click me");
  });

  it("applies default radius", () => {
    render(<AppButton>Test</AppButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveStyle({ borderRadius: "0.5rem" });
  });
});
```

### 5.2 Adding Accessibility Tests

**Axe-Core Integration**

```tsx
// a11y.test.tsx
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("Accessibility", () => {
  it("should not have accessibility violations", async () => {
    const { container } = render(<AppButton>Submit</AppButton>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

**Playwright Accessibility Testing**

```tsx
// e2e/a11y-home.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Accessibility", () => {
  test("homepage meets accessibility standards", async ({ page }) => {
    await page.goto("/");

    // Run axe-core accessibility audit
    const violations = await page.accessibility.snapshot();

    // Assert no critical violations
    const criticalViolations = violations?.filter((v) => v.impact === "critical");
    expect(criticalViolations?.length).toBe(0);
  });
});
```

### 5.3 RTL Test Coverage

**Bi-directional Testing Pattern**

```tsx
// Component.test.tsx
import { render, screen } from "@testing-library/react";
import { DirectionProvider } from "@mantine/core";

describe("MyComponent (LTR/RTL)", () => {
  const renderWithDirection = (direction: "ltr" | "rtl") => {
    return render(
      <DirectionProvider initialDirection={direction}>
        <MyComponent />
      </DirectionProvider>,
    );
  };

  it("renders correctly in LTR", () => {
    const { container } = renderWithDirection("ltr");
    expect(container).toHaveAttribute("dir", "ltr");
    // LTR-specific assertions
  });

  it("renders correctly in RTL", () => {
    const { container } = renderWithDirection("rtl");
    expect(container).toHaveAttribute("dir", "rtl");
    // RTL-specific assertions (mirrored layout)
  });

  it("maintains accessibility in RTL", async () => {
    const { container } = renderWithDirection("rtl");
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

---

## 6. Rollout Strategy

### 6.1 Phased Migration Approach

**Phase 1: Foundation (Week 1)**

- Set up Mantine v7 with base theme
- Configure design token system
- Implement core atoms (Button, Input, Card)
- Set up RTL support infrastructure

**Phase 2: Component Migration (Week 2-3)**

- Migrate high-usage components (forms, navigation)
- Migrate business components (metrics cards, tables)
- Add accessibility enhancements
- Implement i18n for migrated components

**Phase 3: Feature Migration (Week 4-5)**

- Migrate feature by feature (routes, pages)
- Test in both LTR and RTL
- Gather feedback from users
- Fix bugs and refine patterns

**Phase 4: Polish & Hardening (Week 6)**

- Performance optimization
- Visual regression testing
- Documentation updates
- Rollback plan verification

### 6.2 Testing During Migration

**Pre-Migration Checklist**

- [ ] Baseline performance metrics recorded
- [ ] Critical user paths documented
- [ ] Accessibility audit completed
- [ ] RTL layout baseline established
- [ ] Automated test suite passing

**Migration Testing**

- [ ] All existing tests passing
- [ ] New RTL tests added
- [ ] Accessibility tests passing (axe-core)
- [ ] Visual regression tests passing
- [ ] Performance budgets maintained

**Post-Migration Validation**

- [ ] Manual testing in both languages
- [ ] Beta user testing
- [ ] Production monitoring setup
- [ ] Rollback plan tested

### 6.3 Rollback Plans

**Feature Flag Rollback**

```typescript
// middleware or config
export const featureFlags = {
  useNewUI: process.env.FEATURE_NEW_UI === 'true',
};

// Component usage
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

function Dashboard() {
  const { useNewUI } = useFeatureFlags();

  return useNewUI ? <NewDashboard /> : <LegacyDashboard />;
}
```

**Git-Based Rollback**

```bash
# Pre-migration commit
git commit -m "chore: baseline before UI migration"

# Migration work
git commit -m "feat: migrate to Mantine v7"

# If rollback needed
git revert HEAD
```

**Database-Driven Rollback**

```sql
-- Feature flags table
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT false,
  tenant_id UUID REFERENCES tenants(id)
);

-- Disable new UI for all tenants
UPDATE feature_flags SET enabled = false WHERE name = 'new_ui';
```

---

## 7. Migration Checklist

### Component Migration

- [ ] Audit existing components
- [ ] Create mapping of old → new components
- [ ] Update component imports
- [ ] Migrate component props
- [ ] Test component behavior
- [ ] Update component documentation

### Styling Migration

- [ ] Convert hardcoded values to design tokens
- [ ] Update theme configuration
- [ ] Replace directional CSS with logical properties
- [ ] Test in dark mode
- [ ] Verify RTL layouts
- [ ] Optimize bundle size

### i18n Migration

- [ ] Externalize all user-facing strings
- [ ] Create message files for all languages
- [ ] Implement language switcher
- [ ] Test RTL layouts
- [ ] Format dates/currencies correctly
- [ ] Test with screen readers in both languages

### Testing Migration

- [ ] Update unit tests to Vitest
- [ ] Add React Testing Library tests
- [ ] Implement accessibility tests
- [ ] Add RTL test coverage
- [ ] Create visual regression tests
- [ ] Update E2E tests for Playwright

### Rollout Readiness

- [ ] Feature flags implemented
- [ ] Rollback plan documented
- [ ] Performance metrics within targets
- [ ] Accessibility audit passed
- [ ] Beta testing completed
- [ ] Documentation updated
- [ ] Team training completed
- [ ] Production monitoring configured

---

## Appendix: Common Migration Issues

### Issue 1: Theme Function Breaks in v7

```tsx
// ❌ Before
styles={(theme) => ({ input: { color: theme.colors.blue[5] } })}

// ✅ After
styles={{ input: { color: 'var(--mantine-color-blue-5)' } }}
// or
styles={{ input: { color: 'blue.5' } }}
```

### Issue 2: RTL Layout Breaks

**Solution:** Use Mantine's `Group` and `Stack` components which handle RTL automatically:

```tsx
// ✅ Use these for automatic RTL support
import { Group, Stack } from "@mantine/core";

<Group gap="md">
  {" "}
  {/* Automatically reverses in RTL */}
  <Text>Item 1</Text>
  <Text>Item 2</Text>
</Group>;
```

### Issue 3: Icons Not Mirroring

**Solution:** Use `@tabler/icons-react` with Mantine's automatic icon mirroring:

```tsx
import { IconArrowRight } from '@tabler/icons-react';

<IconArrowRight size={24} />  {/* Automatically flips in RTL */}
```

### Issue 4: Form Validation Breaking

**Solution:** Update to Mantine v7 form validation pattern:

```tsx
// ✅ Mantine v7
import { useForm } from "@mantine/form";

const form = useForm({
  initialValues: { email: "" },
  validate: {
    email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
  },
});
```

---

**Document Status:** Active
**Next Review:** After Phase 2 completion (estimated 2 weeks)
**Maintainer:** Architecture Team
**Related Documents:**

- [Design Tokens Specification](../02-design-system-specification/design-tokens.md)
- [UI Patterns Specification](../02-design-system-specification/patterns.md)
- [Technology Evaluation](../01-research-findings/technology-evaluation.md)
- [Testing Strategy](/docs/02-planning-and-methodology/testing-strategy.md)
- [tRPC Unified API Specification](/prompts/tanstack-start-full-stack-adoption.md)
- [TanStack Start Migration Changelog](/changelog/2026-04-13-nextjs-to-tanstack-start-documentation-migration.md)
