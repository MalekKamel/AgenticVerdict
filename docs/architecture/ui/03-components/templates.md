# Templates - Page Layout Templates

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [README.md](./README.md) - Component catalog overview
- [organisms.md](./organisms.md) - Complex UI sections (used in templates)
- [00-overview.md](../00-overview.md) - Design system architecture

---

## Overview

**Templates** are page-level layouts that define the structure of complete pages. They combine organisms, molecules, and atoms to provide consistent page structures across the application. Templates are opinionated about layout but agnostic about specific content.

**Design Principles:**

- **Consistent Layout**: Standardized page structures
- **Responsive Design**: Mobile-first, desktop-enhanced
- **Accessibility**: WCAG 2.1 AA compliant navigation and landmarks
- **Performance**: Optimized for fast page loads
- **RTL Support**: Automatic layout mirroring for Arabic

---

## Template Catalog

| Template            | Purpose              | Status         | Specification                            |
| ------------------- | -------------------- | -------------- | ---------------------------------------- |
| **DashboardLayout** | Main app layout      | ✅ Implemented | [DashboardLayout Spec](#dashboardlayout) |
| **AuthLayout**      | Authentication pages | ✅ Implemented | [AuthLayout Spec](#authlayout)           |
| **ReportLayout**    | Report viewing       | 🔄 Phase 2     | [ReportLayout Spec](#reportlayout)       |
| **SettingsLayout**  | Settings pages       | 🔄 Phase 2     | [SettingsLayout Spec](#settingslayout)   |

---

## DashboardLayout

### Purpose

Main application layout with sidebar, header, and content area. Used for the primary application interface after authentication.

### Props/Inputs

```typescript
interface DashboardLayoutProps {
  // Content
  children: React.ReactNode;

  // Sidebar
  sidebar?: {
    items: NavigationItem[];
    activeItem?: string;
    collapsible?: boolean;
    tenantSwitcher?: boolean;
    tenants?: Tenant[];
    currentTenant?: string;
    onTenantChange?: (tenantId: string) => void;
  };

  // Header
  header?: {
    title?: string;
    breadcrumb?: BreadcrumbItem[];
    actions?: React.ReactNode;
  };

  // User menu
  userMenu?: UserMenuItem[];
  onUserMenuClick?: (item: UserMenuItem) => void;

  // Footer
  showFooter?: boolean;
  footerContent?: React.ReactNode;

  // States
  loading?: boolean;

  // Responsive
  mobileSidebar?: boolean;       // Overlay mode on mobile
  onMobileSidebarClose?: () => void;

  // Accessibility
  ariaLabel?: string;
}

// Example usage:
<DashboardLayout
  sidebar={{
    items: navItems,
    activeItem: 'dashboard',
    collapsible: true,
  }}
  header={{
    title: 'Dashboard',
    breadcrumb: [{ label: 'Home', href: '/' }, { label: 'Dashboard' }],
  }}
>
  <PageContent />
</DashboardLayout>
```

### Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Header (Logo, Breadcrumb, Title, Actions, User Menu)         │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                  │
│ Sidebar  │ Main Content Area                                │
│ (Nav,    │ - Page Heading                                   │
│  Tenant, │ - Content                                        │
│  User)   │ - Actions                                        │
│          │                                                  │
│          │                                                  │
└──────────┴──────────────────────────────────────────────────┘
│ Footer (optional)                                           │
└─────────────────────────────────────────────────────────────┘
```

### Variants

| Variant       | Use Case          | Sidebar Position                         |
| ------------- | ----------------- | ---------------------------------------- |
| **default**   | Desktop layout    | Left sidebar (LTR) / Right sidebar (RTL) |
| **collapsed** | Collapsed sidebar | Icon-only sidebar                        |
| **mobile**    | Mobile layout     | Full-screen overlay                      |

### States

| State                     | Appearance          | Behavior                      |
| ------------------------- | ------------------- | ----------------------------- |
| **default**               | Sidebar expanded    | Full navigation visible       |
| **sidebar-collapsed**     | Narrow sidebar      | Icons only, tooltips on hover |
| **mobile-sidebar-open**   | Full-screen overlay | Sidebar overlay on mobile     |
| **mobile-sidebar-closed** | Sidebar hidden      | Hamburger menu visible        |

### Composition Rules

```tsx
// ✅ Allowed compositions
<DashboardLayout sidebar={{ items }}>
  <PageContent />
</DashboardLayout>

<DashboardLayout
  sidebar={{ items, activeItem }}
  header={{ title: 'Dashboard' }}
>
  <PageContent />
</DashboardLayout>

// ❌ Invalid compositions
<DashboardLayout><div>Missing sidebar prop</div></DashboardLayout>
```

### Accessibility Requirements

- **Semantic HTML**: Use `<header>`, `<nav>`, `<main>`, `<footer>` elements
- **Landmarks**: Proper ARIA landmarks for navigation, main, contentinfo
- **Skip Links**: Provide skip-to-content link
- **Focus Management**: Focus trap in mobile sidebar
- **Keyboard Navigation**: Full keyboard navigation
- **Screen Reader**: Announce page title, breadcrumb, current section

**ARIA Pattern:**

```tsx
<div className="dashboard-layout">
  <a href="#main-content" className="skip-link">
    Skip to main content
  </a>

  <header role="banner">
    <Logo />
    <nav aria-label="Breadcrumb">{breadcrumb}</nav>
    <div className="actions">{headerActions}</div>
  </header>

  <div className="layout-body">
    <aside role="complementary" aria-label="Sidebar navigation">
      <Navigation items={sidebarItems} />
    </aside>

    <main id="main-content" role="main" tabIndex={-1}>
      {children}
    </main>
  </div>

  <footer role="contentinfo">{footerContent}</footer>
</div>
```

### RTL/LTR Behavior

| Element          | LTR              | RTL             |
| ---------------- | ---------------- | --------------- |
| **Sidebar**      | Left side        | Right side      |
| **Logo**         | Left side        | Right side      |
| **Breadcrumb**   | Left of title    | Right of title  |
| **Actions**      | Right side       | Left side       |
| **Content area** | Right of sidebar | Left of sidebar |

### Multi-Language Support

**Translation Keys:**

- `common.layout.skipToContent`: Skip to main content
- `common.layout.sidebar.toggle`: Toggle sidebar
- `common.layout.mobileMenu`: Menu
- `common.layout.userMenu`: User menu

### Usage Examples

```tsx
// Basic dashboard
<DashboardLayout
  sidebar={{ items: navItems, activeItem: 'dashboard' }}
>
  <DashboardContent />
</DashboardLayout>

// With header
<DashboardLayout
  sidebar={{ items: navItems, activeItem: 'insights' }}
  header={{
    title: 'Marketing Insights',
    breadcrumb: [
      { label: 'Home', href: '/' },
      { label: 'Insights', href: '/insights' },
      { label: 'Marketing', href: '/insights/marketing' },
    ],
  }}
>
  <InsightDetail />
</DashboardLayout>

// With tenant switcher (agency)
<DashboardLayout
  sidebar={{
    items: navItems,
    tenantSwitcher: true,
    tenants: clientTenants,
    currentTenant: currentClientId,
    onTenantChange: switchTenant,
  }}
>
  <ClientDashboard />
</DashboardLayout>

// With user menu
<DashboardLayout
  sidebar={{ items: navItems }}
  userMenu={[
    { id: 'profile', label: 'Profile', onClick: goToProfile },
    { id: 'settings', label: 'Settings', onClick: goToSettings },
    { id: 'logout', label: 'Sign out', onClick: signOut, dangerous: true },
  ]}
>
  <Content />
</DashboardLayout>
```

### Related Components

- [Sidebar](./organisms.md#sidebar) - Collapsible sidebar
- [Navigation](./organisms.md#navigation) - Primary navigation
- [Card](./molecules.md#card) - Content cards

### Related Entities/Pages

- **Dashboard**: Main dashboard page
- **Insights**: Insight list and detail pages
- **Connectors**: Connector management pages
- **Settings**: Settings pages

---

## AuthLayout

### Purpose

Centered card layout for authentication pages (sign in, sign up, forgot password). Minimal branding, focused on authentication form.

### Props/Inputs

```typescript
interface AuthLayoutProps {
  // Content
  children: React.ReactNode;

  // Branding
  logo?: React.ReactNode;
  productName?: string;

  // Header
  title?: string;
  subtitle?: string;

  // Footer
  footerLinks?: AuthFooterLink[];

  // Background
  backgroundImage?: string;
  backgroundColor?: string;

  // Size
  size?: 'sm' | 'md' | 'lg';

  // Accessibility
  ariaLabel?: string;
}

interface AuthFooterLink {
  label: string;
  href: string;
}

// Example usage:
<AuthLayout
  title="Sign in to your account"
  subtitle="Enter your credentials to access your insights"
>
  <SignInForm />
</AuthLayout>
```

### Structure

```
┌─────────────────────────────────────────────────────────────┐
│                                                         [Logo] │
│                                                             │
│                    ┌───────────────────┐                    │
│                    │                   │                    │
│                    │   Auth Card       │                    │
│                    │                   │                    │
│                    │   [Title]         │                    │
│                    │   [Subtitle]      │                    │
│                    │                   │                    │
│                    │   [Form]          │                    │
│                    │                   │                    │
│                    │   [Actions]       │                    │
│                    │                   │                    │
│                    │   [Footer Links]  │                    │
│                    │                   │                    │
│                    └───────────────────┘                    │
│                                                             │
│                                                    [Footer] │
└─────────────────────────────────────────────────────────────┘
```

### Variants

| Variant | Use Case                            | Card Width |
| ------- | ----------------------------------- | ---------- |
| **sm**  | Simple forms (forgot password)      | 400px      |
| **md**  | Standard auth forms                 | 480px      |
| **lg**  | Complex forms (sign up with fields) | 560px      |

### States

| State       | Appearance        | Behavior       |
| ----------- | ----------------- | -------------- |
| **default** | Centered card     | Normal display |
| **loading** | Card with spinner | Form disabled  |
| **error**   | Error message     | Error display  |

### Composition Rules

```tsx
// ✅ Allowed compositions
<AuthLayout title="Sign in">
  <SignInForm />
</AuthLayout>

<AuthLayout
  title="Create account"
  subtitle="Start your 14-day free trial"
  footerLinks={[{ label: 'Already have an account?', href: '/signin' }]}
>
  <SignUpForm />
</AuthLayout>

// ❌ Invalid compositions
<AuthLayout><div>Missing title</div></AuthLayout>
```

### Accessibility Requirements

- **Semantic HTML**: Use `<main>`, `<h1>`, `<form>` elements
- **Heading Hierarchy**: Single `<h1>` for page title
- **Form Labels**: All inputs have associated labels
- **Error Handling**: ARIA alerts for errors
- **Focus Management**: Focus first input on mount
- **Screen Reader**: Announce page title, form instructions

**ARIA Pattern:**

```tsx
<main role="main" aria-label="Authentication">
  <div className="auth-card">
    <h1>{title}</h1>
    {subtitle && <p className="subtitle">{subtitle}</p>}

    <form aria-label={title} onSubmit={handleSubmit}>
      {formFields}
    </form>

    {error && (
      <div role="alert" aria-live="assertive">
        {error}
      </div>
    )}
  </div>
</main>
```

### RTL/LTR Behavior

| Element          | LTR                     | RTL                     |
| ---------------- | ----------------------- | ----------------------- |
| **Logo**         | Top-center              | Top-center              |
| **Card**         | Centered                | Centered                |
| **Form**         | Left-aligned text       | Right-aligned text      |
| **Footer links** | Centered, left-to-right | Centered, right-to-left |

### Multi-Language Support

**Translation Keys:**

- `common.auth.signin.title`: Sign in to your account
- `common.auth.signin.subtitle`: Enter your credentials to access your insights
- `common.auth.signup.title`: Create your account
- `common.auth.signup.subtitle`: Start your 14-day free trial
- `common.auth.forgotPassword.title`: Reset your password
- `common.auth.noAccount`: Don't have an account?
- `common.auth.haveAccount`: Already have an account?

### Usage Examples

```tsx
// Sign in
<AuthLayout
  title="Sign in to your account"
  subtitle="Enter your credentials to access your insights"
>
  <SignInForm />
</AuthLayout>

// Sign up
<AuthLayout
  title="Create your account"
  subtitle="Start your 14-day free trial"
  footerLinks={[
    { label: 'Already have an account? Sign in', href: '/signin' },
  ]}
>
  <SignUpForm />
</AuthLayout>

// Forgot password
<AuthLayout
  title="Reset your password"
  subtitle="Enter your email address and we'll send you a reset link"
  size="sm"
>
  <ForgotPasswordForm />
</AuthLayout>

// With branding
<AuthLayout
  logo={<Logo />}
  productName="AgenticVerdict"
  title="Sign in"
>
  <SignInForm />
</AuthLayout>
```

### Related Components

- [Card](./molecules.md#card) - Auth card container
- [FormField](./molecules.md#formfield) - Form fields
- [Button](./atoms.md#button) - Submit buttons
- [Input](./atoms.md#input) - Email/password inputs

### Related Entities/Pages

- **Authentication**: Sign in, sign up, forgot password
- **Invitation**: Accept invitation
- **Verification**: Email verification

---

## ReportLayout

### Purpose

Document viewer layout for reports with export controls, table of contents, and fullscreen mode. Used for viewing PDF and Excel reports.

### Props/Inputs

```typescript
interface ReportLayoutProps {
  // Content
  children: React.ReactNode;

  // Report info
  title: string;
  description?: string;
  reportType: 'pdf' | 'excel';
  generatedAt: Date;

  // Document viewer
  documentUrl: string;
  documentPages?: number;

  // Table of contents
  tableOfContents?: TOCItem[];

  // Actions
  onExport?: (format: 'pdf' | 'excel') => void;
  onPrint?: () => void;
  onShare?: () => void;

  // Navigation
  previousReport?: string;
  nextReport?: string;

  // Fullscreen
  fullscreen?: boolean;
  onFullscreenToggle?: () => void;

  // States
  loading?: boolean;
  error?: string;

  // Accessibility
  ariaLabel?: string;
}

interface TOCItem {
  id: string;
  label: string;
  page?: number;
  children?: TOCItem[];
}

// Example usage:
<ReportLayout
  title="Marketing Performance Report"
  description="Monthly insights for January 2026"
  reportType="pdf"
  documentUrl="/reports/marketing-jan-2026.pdf"
  generatedAt={new Date('2026-01-31')}
  onExport={handleExport}
  onPrint={handlePrint}
>
  <ReportViewer />
</ReportLayout>
```

### Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Header (Title, Description, Export, Print, Share, Fullscreen) │
├─────────────────────────────────────────────────────────────┤
│                    ┌───────────────────┐                    │
│ Table of Contents  │                   │                    │
│ (collapsible)      │   Document Viewer │                    │
│                    │                   │                    │
│ - Overview         │   [Report Pages]  │                    │
│ - Metrics          │                   │                    │
│ - Trends           │                   │                    │
│ - Recommendations  │                   │                    │
│                    │                   │                    │
│                    │                   │                    │
│                    └───────────────────┘                    │
├─────────────────────────────────────────────────────────────┤
│ Footer (Page navigation, Generated date)                     │
└─────────────────────────────────────────────────────────────┘
```

### Variants

| Variant        | Use Case        | TOC Position                             |
| -------------- | --------------- | ---------------------------------------- |
| **default**    | Desktop viewing | Left sidebar (LTR) / Right sidebar (RTL) |
| **fullscreen** | Fullscreen mode | Hidden TOC                               |
| **mobile**     | Mobile viewing  | Collapsible TOC drawer                   |

### States

| State             | Appearance          | Behavior                |
| ----------------- | ------------------- | ----------------------- |
| **default**       | Document visible    | Normal viewing          |
| **loading**       | Loading spinner     | Document loading        |
| **error**         | Error message       | Document failed to load |
| **fullscreen**    | Fullscreen document | No header/footer        |
| **toc-collapsed** | TOC hidden          | Show TOC button         |

### Composition Rules

```tsx
// ✅ Allowed compositions
<ReportLayout
  title="Marketing Report"
  reportType="pdf"
  documentUrl="/reports/marketing.pdf"
  generatedAt={new Date()}
>
  <ReportViewer />
</ReportLayout>

<ReportLayout
  title="Finance Report"
  reportType="excel"
  documentUrl="/reports/finance.xlsx"
  generatedAt={new Date()}
  tableOfContents={tocItems}
  onExport={handleExport}
>
  <ReportViewer />
</ReportLayout>

// ❌ Invalid compositions
<ReportLayout title="Report"><div>Missing required props</div></ReportLayout>
```

### Accessibility Requirements

- **Semantic HTML**: Use `<header>`, `<nav>`, `<main>`, `<footer>` elements
- **Document Landmarks**: Proper ARIA landmarks for TOC, main content
- **Keyboard Navigation**: Navigate TOC, zoom controls, page navigation
- **Focus Management**: Focus document viewer on mount
- **Screen Reader**: Announce report title, page number, navigation options

**ARIA Pattern:**

```tsx
<div className="report-layout">
  <header role="banner">
    <h1>{title}</h1>
    <p>{description}</p>
    <div role="toolbar" aria-label="Report actions">
      <button aria-label="Export as PDF">Export</button>
      <button aria-label="Print report">Print</button>
    </div>
  </header>

  <div className="report-body">
    <nav aria-label="Table of contents">
      <ul>{tocItems}</ul>
    </nav>

    <main role="main" aria-label="Report content">
      <DocumentViewer url={documentUrl} />
    </main>
  </div>

  <footer role="contentinfo">
    <p>Generated on {formatDate(generatedAt)}</p>
    <div role="navigation" aria-label="Page navigation">
      <button aria-label="Previous page">Previous</button>
      <button aria-label="Next page">Next</button>
    </div>
  </footer>
</div>
```

### RTL/LTR Behavior

| Element             | LTR           | RTL           |
| ------------------- | ------------- | ------------- |
| **TOC**             | Left sidebar  | Right sidebar |
| **Document viewer** | Right of TOC  | Left of TOC   |
| **Actions toolbar** | Right side    | Left side     |
| **Page navigation** | Right-aligned | Left-aligned  |

### Multi-Language Support

**Translation Keys:**

- `common.report.export`: Export
- `common.report.print`: Print
- `common.report.share`: Share
- `common.report.fullscreen`: Fullscreen
- `common.report.exitFullscreen`: Exit fullscreen
- `common.report.tableOfContents`: Table of contents
- `common.report.generatedAt`: Generated on {date}
- `common.report.page`: Page {current} of {total}

### Usage Examples

```tsx
// PDF report
<ReportLayout
  title="Marketing Performance Report"
  description="Monthly insights for January 2026"
  reportType="pdf"
  documentUrl="/reports/marketing-jan-2026.pdf"
  generatedAt={new Date('2026-01-31')}
  onExport={handleExport}
  onPrint={handlePrint}
>
  <PDFViewer url="/reports/marketing-jan-2026.pdf" />
</ReportLayout>

// Excel report with TOC
<ReportLayout
  title="Finance Dashboard"
  description="Quarterly financial overview"
  reportType="excel"
  documentUrl="/reports/finance-q1-2026.xlsx"
  generatedAt={new Date('2026-03-31')}
  tableOfContents={[
    { id: 'overview', label: 'Overview', page: 1 },
    { id: 'revenue', label: 'Revenue', page: 2 },
    { id: 'expenses', label: 'Expenses', page: 3 },
  ]}
>
  <ExcelViewer url="/reports/finance-q1-2026.xlsx" />
</ReportLayout>

// With navigation
<ReportLayout
  title="Insight Report"
  reportType="pdf"
  documentUrl="/reports/insight-123.pdf"
  generatedAt={new Date()}
  previousReport="/reports/insight-122"
  nextReport="/reports/insight-124"
>
  <PDFViewer url="/reports/insight-123.pdf" />
</ReportLayout>

// Fullscreen
<ReportLayout
  title="Executive Summary"
  reportType="pdf"
  documentUrl="/reports/executive-summary.pdf"
  generatedAt={new Date()}
  fullscreen
  onFullscreenToggle={toggleFullscreen}
>
  <PDFViewer url="/reports/executive-summary.pdf" />
</ReportLayout>
```

### Related Components

- [Card](./molecules.md#card) - Report container
- [Button](./atoms.md#button) - Action buttons
- [Navigation](./organisms.md#navigation) - TOC navigation

### Related Entities/Pages

- **Reports**: Report viewing pages
- **Insights**: Insight report pages
- **Exports**: Exported report pages

---

## SettingsLayout

### Purpose

Settings page layout with navigation sidebar and form sections. Used for all settings pages (account, tenant, connectors, notifications).

### Props/Inputs

```typescript
interface SettingsLayoutProps {
  // Content
  children: React.ReactNode;

  // Navigation
  sections: SettingsSection[];
  activeSection: string;

  // Header
  title: string;
  description?: string;

  // Actions
  actions?: React.ReactNode;

  // Breadcrumb
  breadcrumb?: BreadcrumbItem[];

  // States
  loading?: boolean;
  saving?: boolean;
  error?: string;
  success?: string;

  // Accessibility
  ariaLabel?: string;
}

interface SettingsSection {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  disabled?: boolean;
  badge?: string | number;
}

// Example usage:
<SettingsLayout
  title="Settings"
  sections={[
    { id: 'account', label: 'Account', icon: 'user', href: '/settings/account' },
    { id: 'tenant', label: 'Tenant', icon: 'building', href: '/settings/tenant' },
    { id: 'connectors', label: 'Connectors', icon: 'plug', href: '/settings/connectors' },
  ]}
  activeSection="account"
>
  <AccountSettingsForm />
</SettingsLayout>
```

### Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Header (Settings title, description, actions)                │
├─────────────────────────────────────────────────────────────┤
│                    ┌───────────────────┐                    │
│ Settings Nav       │   Settings Form   │                    │
│ (sidebar)          │                   │                    │
│                    │   [Section Title] │                    │
│ - Account          │                   │                    │
│ - Tenant          │   [Form Fields]   │                    │
│ - Connectors       │                   │                    │
│ - Notifications    │   [Actions]       │                    │
│                    │                   │                    │
│                    │                   │                    │
│                    └───────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Variants

| Variant     | Use Case         | Nav Position                             |
| ----------- | ---------------- | ---------------------------------------- |
| **default** | Desktop settings | Left sidebar (LTR) / Right sidebar (RTL) |
| **compact** | Smaller screens  | Narrower sidebar                         |
| **mobile**  | Mobile settings  | Top horizontal nav or drawer             |

### States

| State       | Appearance       | Behavior         |
| ----------- | ---------------- | ---------------- |
| **default** | Form visible     | Normal editing   |
| **loading** | Loading spinner  | Form disabled    |
| **saving**  | Saving indicator | Show "Saving..." |
| **error**   | Error message    | Error banner     |
| **success** | Success message  | Success banner   |

### Composition Rules

```tsx
// ✅ Allowed compositions
<SettingsLayout
  title="Settings"
  sections={settingsSections}
  activeSection="account"
>
  <AccountSettingsForm />
</SettingsLayout>

<SettingsLayout
  title="Tenant Settings"
  sections={settingsSections}
  activeSection="tenant"
  actions={<Button onClick={saveSettings}>Save Changes</Button>}
>
  <TenantSettingsForm />
</SettingsLayout>

// ❌ Invalid compositions
<SettingsLayout title="Settings"><div>Missing sections prop</div></SettingsLayout>
```

### Accessibility Requirements

- **Semantic HTML**: Use `<header>`, `<nav>`, `<main>`, `<form>` elements
- **Form Structure**: Proper fieldsets, legends, labels
- **Error Handling**: ARIA alerts for errors/success
- **Keyboard Navigation**: Navigate sections, form fields
- **Focus Management**: Focus first input on mount, focus on error
- **Screen Reader**: Announce section title, form errors, save status

**ARIA Pattern:**

```tsx
<div className="settings-layout">
  <header role="banner">
    <h1>{title}</h1>
    {description && <p>{description}</p>}
  </header>

  <div className="settings-body">
    <nav aria-label="Settings sections">
      <ul>
        {sections.map((section) => (
          <li key={section.id}>
            <a href={section.href} aria-current={section.id === activeSection ? "page" : undefined}>
              {section.icon && <span aria-hidden="true">{section.icon}</span>}
              <span>{section.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>

    <main role="main" aria-label={`${activeSection} settings`}>
      {error && (
        <div role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      {success && (
        <div role="status" aria-live="polite">
          {success}
        </div>
      )}

      {children}
    </main>
  </div>
</div>
```

### RTL/LTR Behavior

| Element           | LTR           | RTL            |
| ----------------- | ------------- | -------------- |
| **Settings nav**  | Left sidebar  | Right sidebar  |
| **Section icons** | Left of label | Right of label |
| **Form**          | Right of nav  | Left of nav    |
| **Actions**       | Right-aligned | Left-aligned   |

### Multi-Language Support

**Translation Keys:**

- `common.settings.title`: Settings
- `common.settings.account`: Account
- `common.settings.tenant`: Tenant
- `common.settings.connectors`: Connectors
- `common.settings.notifications`: Notifications
- `common.settings.save`: Save Changes
- `common.settings.saving`: Saving...
- `common.settings.saved`: Changes saved
- `common.settings.error`: Failed to save changes

### Usage Examples

```tsx
// Account settings
<SettingsLayout
  title="Account Settings"
  sections={[
    { id: 'account', label: 'Account', icon: 'user', href: '/settings/account' },
    { id: 'tenant', label: 'Tenant', icon: 'building', href: '/settings/tenant' },
    { id: 'connectors', label: 'Connectors', icon: 'plug', href: '/settings/connectors' },
  ]}
  activeSection="account"
>
  <AccountSettingsForm />
</SettingsLayout>

// Tenant settings with actions
<SettingsLayout
  title="Tenant Settings"
  sections={settingsSections}
  activeSection="tenant"
  actions={
    <Button loading={saving} onClick={saveSettings}>
      {saving ? 'Saving...' : 'Save Changes'}
    </Button>
  }
>
  <TenantSettingsForm />
</SettingsLayout>

// With error/success messages
<SettingsLayout
  title="Settings"
  sections={settingsSections}
  activeSection="connectors"
  error={error}
  success={success}
>
  <ConnectorSettingsForm />
</SettingsLayout>

// With breadcrumb
<SettingsLayout
  title="Connector Settings"
  sections={settingsSections}
  activeSection="connectors"
  breadcrumb={[
    { label: 'Settings', href: '/settings' },
    { label: 'Connectors', href: '/settings/connectors' },
    { label: 'Google Analytics 4' },
  ]}
>
  <GA4SettingsForm />
</SettingsLayout>
```

### Related Components

- [Card](./molecules.md#card) - Settings section cards
- [FormField](./molecules.md#formfield) - Form fields
- [Button](./atoms.md#button) - Save/reset buttons
- [Navigation](./organisms.md#navigation) - Settings navigation

### Related Entities/Pages

- **Settings**: All settings pages
- **Account**: User account settings
- **Tenant**: Tenant profile settings
- **Connectors**: Connector configuration

---

## Document Status

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After Phase 2 completion
**Maintainer:** UI/UX Team

**Related Specifications:**

- [README.md](./README.md) - Component catalog overview
- [organisms.md](./organisms.md) - Complex UI sections
- [patterns.md](./patterns.md) - Reusable interaction patterns
