# Implementation Plan: UI Scaffold (Phase 02)

**Branch**: `002-ui-scaffold` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/01-ui/02-scaffold/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

---

## Summary

Phase 02 (Scaffold) implements the core layout templates that provide the structural foundation for all authenticated and unauthenticated pages in the AgenticVerdict UI. The primary requirement is to build four layout templates (DashboardLayout, AuthLayout, ReportLayout, SettingsLayout) using TanStack Start file-based routing and Mantine v9 AppShell components, with full RTL/LTR support via the existing i18n infrastructure.

The technical approach extends the existing AppShellLayout component (currently a basic Mantine AppShell) into fully-featured layout templates with navigation, breadcrumbs, user menus, and responsive behavior. Navigation menu data will be fetched via tRPC procedures to ensure type safety and enable dynamic menu configuration based on user permissions and tenant settings.

---

## Technical Context

**Language/Version**: TypeScript 5.3+, React 18+
**Primary Dependencies**: TanStack Start (file-based routing), Mantine UI v9 (AppShell, components), next-intl (i18n), tRPC v11 (API layer)
**Storage**: N/A (client-side layouts; data fetched via tRPC)
**Testing**: Vitest (unit tests for layout components), Playwright (E2E for layout behavior across viewports and locales)
**Target Platform**: Web (responsive design for mobile, tablet, desktop)
**Project Type**: Web application (monorepo: Turborepo + pnpm workspaces)
**Performance Goals**: <1.5s FCP on mobile 4G, <200ms sidebar animation, <150ms mobile overlay
**Constraints**: Must support RTL/LTR layout mirroring, must maintain 100% type safety via tRPC, must achieve WCAG 2.1 AA compliance
**Scale/Scope**: 4 layout templates, navigation system with nested sections, breadcrumb system, responsive variants for mobile/tablet/desktop

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

✅ **No violations detected** - This phase implements pure UI layout templates using the existing tech stack (TanStack Start + Mantine v9) and does not introduce new frameworks, dependencies, or architectural patterns beyond those already established in Phase 00 and Phase 01.

---

## Project Structure

### Documentation (this feature)

```text
specs/01-ui/02-scaffold/
├── spec.md              # This file (functional requirements)
├── plan.md              # Technical implementation plan
└── tasks.md             # Implementation task list
```

### Source Code (repository root)

```text
apps/frontend/
├── src/
│   ├── routes/                          # TanStack Start file-based routing
│   │   ├── __root.tsx                   # Root layout (already exists)
│   │   ├── [locale]/                    # Localized routes
│   │   │   ├── layout.tsx               # Locale layout (already exists)
│   │   │   ├── dashboard.tsx            # Dashboard route (to be created)
│   │   │   ├── settings/                # Settings routes
│   │   │   │   ├── index.tsx            # Settings list page
│   │   │   │   └── [...slug]/tsx        # Settings detail pages
│   │   │   ├── reports/                 # Reports routes
│   │   │   │   └── $reportId.tsx        # Report detail page
│   │   │   ├── signin.tsx               # Sign in page (already exists)
│   │   │   ├── signup.tsx               # Sign up page (to be created)
│   │   │   └── forgot-password.tsx      # Forgot password page (to be created)
│   │   └── index.tsx                    # Home/landing page
│   │
│   ├── components/
│   │   ├── layout/                      # Layout components
│   │   │   ├── AppShellLayout.tsx       # Current basic layout (to be refactored)
│   │   │   ├── DashboardLayout.tsx      # New: Dashboard layout with sidebar, topbar, breadcrumbs
│   │   │   ├── AuthLayout.tsx           # New: Auth layout with centered card
│   │   │   ├── ReportLayout.tsx         # New: Report layout with TOC and viewer
│   │   │   └── SettingsLayout.tsx       # New: Settings layout with section nav
│   │   │
│   │   ├── navigation/                  # Navigation components
│   │   │   ├── Sidebar.tsx              # New: Collapsible sidebar with navigation
│   │   │   ├── Topbar.tsx               # New: Topbar with logo, user menu, actions
│   │   │   ├── Breadcrumb.tsx           # New: Breadcrumb trail component
│   │   │   ├── UserMenu.tsx             # New: User menu dropdown
│   │   │   ├── TenantSwitcher.tsx       # New: Tenant switcher (agency feature)
│   │   │   └── NavigationItems.tsx      # New: Navigation menu items renderer
│   │   │
│   │   └── report/                      # Report-specific components
│   │       ├── ReportViewer.tsx         # New: PDF/Excel document viewer wrapper
│   │       ├── ReportActions.tsx        # New: Export, print, share, fullscreen controls
│   │       └── TableOfContents.tsx      # New: Report TOC sidebar
│   │
│   ├── lib/
│   │   ├── navigation.ts                # New: Navigation menu configuration and helpers
│   │   └── breadcrumbs.ts               # New: Breadcrumb generation utilities
│   │
│   └── hooks/
│       ├── useLayout.ts                 # New: Layout state and behavior hook
│       └── useSidebar.ts                # New: Sidebar collapse/expand state hook
│
packages/
├── ui/                                   # Shared UI components (future package)
│   └── src/
│       └── templates/                   # Reusable layout templates (shared across apps)
│           ├── DashboardLayout/
│           ├── AuthLayout/
│           ├── ReportLayout/
│           └── SettingsLayout/
│
└── i18n/                                 # Internationalization (already exists)
    └── src/
        └── locales/
            ├── en/
            │   └── common.json          # English translations (add navigation keys)
            └── ar/
                └── common.json          # Arabic translations (add navigation keys)
```

**Structure Decision**: The monorepo structure with Turborepo is already established. Layout components are initially implemented in `apps/frontend/src/components/layout/` for rapid development, with the intent to extract reusable templates to `packages/ui/src/templates/` in future phases (Phase 13: Production Hardening) to enable code sharing with future mobile or desktop applications.

---

## Complexity Tracking

> **No complexity violations** - This phase implements standard layout patterns using established frameworks. No custom architectural patterns or advanced algorithms are required beyond responsive design and RTL layout mirroring, which are supported by Mantine v9 and next-intl.

---

## Technical Architecture

### Layout Component Hierarchy

```
[locale]/layout.tsx (root locale layout)
├── DirectionProvider (sets dir="ltr" or "rtl")
├── NextIntlClientProvider (i18n context)
└── Providers (Mantine, tRPC, etc.)
    └── Layout Route Components
        ├── AuthLayout (for auth routes: signin, signup, forgot-password)
        ├── DashboardLayout (for authenticated routes: dashboard, insights, connectors)
        ├── ReportLayout (for report detail pages)
        └── SettingsLayout (for settings pages)
```

### Data Fetching Strategy

Layout components fetch data via tRPC routers to ensure type safety and enable dynamic configuration:

```typescript
// tRPC router for layout data
export const layoutRouter = router({
  // Navigation menu structure
  getNavigationMenu: publicProcedure
    .input(z.object({
      locale: z.enum(['en', 'ar']),
      tenantId: z.string().uuid().optional(),
    }))
    .query(async ({ input }) => {
      return getNavigationMenu(input.locale, input.tenantId);
    }),

  // Tenant list for agency partners
  getTenants: publicProcedure
    .query(async ({ ctx }) => {
      return getTenantList(ctx.userId);
    }),

  // User profile for user menu
  getUserProfile: publicProcedure
    .query(async ({ ctx }) => {
      return getUserProfile(ctx.userId);
    }),
});
```

### Responsive Breakpoints

Using Mantine's default breakpoints with mobile-first approach:

| Breakpoint | Width | Use Case |
|------------|-------|----------|
| **xs** | 0px - 575px | Mobile phones |
| **sm** | 576px - 767px | Large phones, landscape phones |
| **md** | 768px - 991px | Tablets |
| **lg** | 992px - 1199px | Small desktops |
| **xl** | 1200px - 1399px | Desktops |
| **xxl** | 1400px+ | Large desktops |

### RTL/LTR Implementation

Layout mirroring is handled automatically by Mantine v9 and next-intl:

1. **Direction Detection**: `DirectionProvider` in root layout sets `dir="rtl"` for Arabic locale
2. **Logical Properties**: Mantine uses CSS logical properties (`margin-inline-start` vs `margin-left`)
3. **Layout Mirroring**: Flexbox and Grid automatically reverse direction in RTL
4. **Icon Mirroring**: Directional icons (arrows) flipped via CSS transforms
5. **Text Alignment**: Use `text-align: start` instead of `text-align: left`

No manual RTL adjustments are required in layout components.

### Navigation Structure

Navigation menu is hierarchical with support for nested sections:

```typescript
interface NavigationItem {
  id: string;
  label: string;              // Translation key
  href: string;
  icon: string | ReactNode;   // Icon name or component
  badge?: string | number;    // Optional badge (e.g., notification count)
  disabled?: boolean;
  children?: NavigationItem[]; // Nested navigation
  requiredPermission?: string; // Permission check for visibility
}
```

Example navigation structure:

```typescript
const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'common.nav.dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    id: 'insights',
    label: 'common.nav.insights',
    href: '/insights',
    icon: 'Lightbulb',
    children: [
      {
        id: 'marketing',
        label: 'common.nav.marketing',
        href: '/insights/marketing',
        icon: 'TrendingUp',
      },
      {
        id: 'finance',
        label: 'common.nav.finance',
        href: '/insights/finance',
        icon: 'DollarSign',
      },
    ],
  },
  // ... more items
];
```

### Breadcrumb Generation

Breadcrumbs are automatically generated from the route hierarchy:

```typescript
function generateBreadcrumbs(
  pathname: string,
  navigation: NavigationItem[]
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];

  // Match route segments to navigation items
  const segments = pathname.split('/').filter(Boolean);

  // Build breadcrumb trail
  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const navItem = findNavigationItem(currentPath, navigation);
    if (navItem) {
      breadcrumbs.push({
        label: navItem.label,
        href: currentPath,
      });
    }
  }

  return breadcrumbs;
}
```

---

## Component Specifications

### DashboardLayout

**File**: `apps/frontend/src/components/layout/DashboardLayout.tsx`

**Props**:
```typescript
interface DashboardLayoutProps {
  children: ReactNode;
  sidebar?: {
    items: NavigationItem[];
    activeItem?: string;
    collapsible?: boolean;
    tenantSwitcher?: boolean;
    tenants?: Tenant[];
    currentTenant?: string;
    onTenantChange?: (tenantId: string) => void;
  };
  header?: {
    title?: string;
    breadcrumb?: BreadcrumbItem[];
    actions?: ReactNode;
  };
  userMenu?: UserMenuItem[];
  onUserMenuClick?: (item: UserMenuItem) => void;
  showFooter?: boolean;
  footerContent?: ReactNode;
  loading?: boolean;
}
```

**Responsiveness**:
- Desktop (md+): Sidebar visible as left/right panel
- Tablet (sm): Sidebar hidden, hamburger menu in topbar
- Mobile (xs): Sidebar as full-screen overlay

**Accessibility**:
- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<footer>`
- Skip-to-content link
- ARIA landmarks for navigation and main content
- Focus trap in mobile sidebar overlay
- Keyboard navigation for all interactive elements

**RTL Behavior**:
- Sidebar: Left (LTR) / Right (RTL)
- Logo: Left (LTR) / Right (RTL)
- Breadcrumb: Left of title (LTR) / Right of title (RTL)
- Actions: Right (LTR) / Left (RTL)

### AuthLayout

**File**: `apps/frontend/src/components/layout/AuthLayout.tsx`

**Props**:
```typescript
interface AuthLayoutProps {
  children: ReactNode;
  logo?: ReactNode;
  productName?: string;
  title?: string;
  subtitle?: string;
  footerLinks?: AuthFooterLink[];
  backgroundImage?: string;
  backgroundColor?: string;
  size?: 'sm' | 'md' | 'lg';
}
```

**Size Variants**:
- sm: 400px width (forgot password)
- md: 480px width (sign in)
- lg: 560px width (sign up)

**Accessibility**:
- Single `<h1>` for page title
- Form labels associated with inputs
- ARIA alerts for errors
- Focus first input on mount

**RTL Behavior**:
- Logo and card centered
- Form text: Left-aligned (LTR) / Right-aligned (RTL)
- Footer links: Centered with direction-appropriate ordering

### ReportLayout

**File**: `apps/frontend/src/components/layout/ReportLayout.tsx`

**Props**:
```typescript
interface ReportLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  reportType: 'pdf' | 'excel';
  generatedAt: Date;
  documentUrl: string;
  documentPages?: number;
  tableOfContents?: TOCItem[];
  onExport?: (format: 'pdf' | 'excel') => void;
  onPrint?: () => void;
  onShare?: () => void;
  previousReport?: string;
  nextReport?: string;
  fullscreen?: boolean;
  onFullscreenToggle?: () => void;
  loading?: boolean;
  error?: string;
}
```

**Responsiveness**:
- Desktop (md+): TOC as sidebar, document viewer in main area
- Tablet (sm): TOC collapsible, document viewer full width
- Mobile (xs): TOC hidden with toggle button, drawer on open

**Accessibility**:
- Document viewer with proper ARIA labels
- Toolbar buttons with aria-label
- TOC navigation with keyboard support
- Page navigation with aria-label

**RTL Behavior**:
- TOC: Left sidebar (LTR) / Right sidebar (RTL)
- Document viewer: Right of TOC (LTR) / Left of TOC (RTL)
- Actions toolbar: Right (LTR) / Left (RTL)

### SettingsLayout

**File**: `apps/frontend/src/components/layout/SettingsLayout.tsx`

**Props**:
```typescript
interface SettingsLayoutProps {
  children: ReactNode;
  sections: SettingsSection[];
  activeSection: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: BreadcrumbItem[];
  loading?: boolean;
  saving?: boolean;
  error?: string;
  success?: string;
}
```

**Responsiveness**:
- Desktop (md+): Section nav as sidebar, form in main area
- Tablet (sm): Section nav as top horizontal tabs
- Mobile (xs): Section nav as collapsible drawer

**Accessibility**:
- Form structure with fieldsets and legends
- Error/success messages with ARIA alerts
- Focus management on error
- Keyboard navigation for sections

**RTL Behavior**:
- Section nav: Left sidebar (LTR) / Right sidebar (RTL)
- Section icons: Left of label (LTR) / Right of label (RTL)
- Form: Right of nav (LTR) / Left of nav (RTL)
- Actions: Right-aligned (LTR) / Left-aligned (RTL)

---

## Testing Strategy

### Unit Tests (Vitest)

Test layout components in isolation with mocked props:

```typescript
// Example: DashboardLayout.test.tsx
describe('DashboardLayout', () => {
  it('renders sidebar with navigation items', () => {
    const { getByText } = render(
      <DashboardLayout sidebar={{ items: mockNavItems }}>
        <div>Content</div>
      </DashboardLayout>
    );
    expect(getByText('Dashboard')).toBeInTheDocument();
  });

  it('displays breadcrumb trail', () => {
    const { getByText } = render(
      <DashboardLayout
        sidebar={{ items: mockNavItems }}
        header={{
          breadcrumb: [
            { label: 'Home', href: '/' },
            { label: 'Dashboard', href: '/dashboard' }
          ]
        }}
      >
        <div>Content</div>
      </DashboardLayout>
    );
    expect(getByText('Home')).toBeInTheDocument();
    expect(getByText('Dashboard')).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

Test layout behavior across viewports and locales:

```typescript
// Example: Dashboard layout E2E
test('dashboard layout displays correctly on desktop', async ({ page }) => {
  await page.goto('/en/dashboard');
  await expect(page.locator('nav[aria-label="Sidebar navigation"]')).toBeVisible();
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('main')).toBeVisible();
});

test('sidebar collapses on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/en/dashboard');
  await expect(page.locator('nav[aria-label="Sidebar navigation"]')).not.toBeVisible();
  await page.click('[aria-label="Open navigation"]');
  await expect(page.locator('nav[aria-label="Sidebar navigation"]')).toBeVisible();
});

test('RTL layout mirrors correctly', async ({ page }) => {
  await page.goto('/ar/dashboard');
  const sidebar = page.locator('nav[aria-label="Sidebar navigation"]');
  const computedStyle = await sidebar.evaluate(el => window.getComputedStyle(el));
  expect(computedStyle.direction).toBe('rtl');
});
```

### Accessibility Tests

Automated accessibility testing with axe-core:

```typescript
// Example: Accessibility test
test('dashboard layout meets WCAG AA standards', async ({ page }) => {
  await page.goto('/en/dashboard');
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});
```

---

## Migration Approach

Since Phase 02 builds upon the existing AppShellLayout, the migration approach is incremental:

1. **Phase 1**: Implement AuthLayout (lowest risk, isolated pages)
2. **Phase 2**: Implement DashboardLayout and refactor existing AppShellLayout
3. **Phase 3**: Implement SettingsLayout
4. **Phase 4**: Implement ReportLayout

Existing routes will be updated to use the new layouts incrementally:

```typescript
// Before (current)
<AppShellLayout>{children}</AppShellLayout>

// After (with DashboardLayout)
<DashboardLayout
  sidebar={{ items: navigationItems }}
  header={{ title: 'Dashboard' }}
>
  {children}
</DashboardLayout>
```

---

## Performance Considerations

1. **Code Splitting**: Each layout component is dynamically imported only when needed
2. **Image Optimization**: Use TanStack Start's Image component for logos and icons
3. **CSS-in-JS**: Mantine's CSS-in-JS generates minimal CSS with automatic purging
4. **Bundle Size**: Layout components together should be under 100KB gzipped
5. **Animation Performance**: Use CSS transforms (GPU-accelerated) for sidebar animations
6. **Lazy Loading**: Navigation data fetched via tRPC with React Query caching

---

## Internationalization Integration

Layout components use next-intl for translations:

```typescript
import { useTranslations } from 'next-intl';

function DashboardLayout() {
  const t = useTranslations('Layout');

  return (
    <nav aria-label={t('sidebarLabel')}>
      <a href="/dashboard">{t('nav.dashboard')}</a>
    </nav>
  );
}
```

Translation keys to add to `common.json`:

```json
{
  "Layout": {
    "sidebarLabel": "Sidebar navigation",
    "skipToContent": "Skip to main content",
    "openNav": "Open navigation",
    "closeNav": "Close navigation",
    "userMenu": "User menu"
  },
  "nav": {
    "dashboard": "Dashboard",
    "insights": "Insights",
    "connectors": "Connectors",
    "reports": "Reports",
    "settings": "Settings"
  }
}
```

---

## Dependencies on Other Phases

- **Phase 00 (Foundation)**: TanStack Start, Mantine v9, i18n infrastructure must be complete
- **Phase 01 (Authentication)**: Auth pages and auth flow must be implemented (AuthLayout depends on this)
- **Phase 03 (Connectors)**: Connector management pages will use DashboardLayout
- **Phase 04 (Insights)**: Insight pages will use DashboardLayout and ReportLayout
- **Phase 08 (Settings)**: Settings pages will use SettingsLayout

---

## Open Questions

1. **Tenant Switcher Timing**: Should the tenant switcher be implemented in Phase 02 or deferred to Phase 09 (Tenant Management)? → Decision: Implement the UI component in Phase 02 but wire it up to tRPC data fetching in Phase 09.

2. **Report Viewer Library**: Which library should be used for PDF and Excel viewing? → Decision: Use browser native PDF viewer for PDF files, and a simple HTML table renderer for Excel files. Native viewers are sufficient for MVP.

3. **Navigation Persistence**: Should sidebar collapse state persist across page navigations? → Decision: Yes, use localStorage to persist sidebar state for better UX.

4. **Breadcrumb Auto-Generation**: Should breadcrumbs be automatically generated from routes or manually configured? → Decision: Auto-generate from route hierarchy with manual override capability for complex cases.

---

## Success Criteria

Phase 02 is considered complete when:

1. All four layout templates (DashboardLayout, AuthLayout, ReportLayout, SettingsLayout) are implemented and functional
2. All layouts support RTL/LTR with automatic mirroring
3. All layouts are responsive with mobile-appropriate variants
4. All layouts achieve WCAG 2.1 AA compliance with zero axe-core violations
5. Navigation menu is dynamically fetched via tRPC and rendered correctly
6. Breadcrumb system accurately reflects page hierarchy
7. All user stories from spec.md have passing E2E tests
8. Unit test coverage exceeds 70% for layout components
9. Performance targets are met (<1.5s FCP on mobile 4G, <200ms animations)
10. All navigation labels have English and Arabic translations

---

## Document Status

**Version**: 1.0
**Last Updated**: 2026-04-14
**Status**: Draft
**Next Review**: After Phase 02 implementation begins
**Maintainer**: UI/UX Team
