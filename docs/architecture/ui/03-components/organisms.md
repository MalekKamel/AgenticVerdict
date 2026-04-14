# Organisms - Complex UI Sections

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [README.md](./README.md) - Component catalog overview
- [molecules.md](./molecules.md) - Composite components (used as building blocks)
- [accessibility-standards.md](../01-research-findings/accessibility-standards.md) - WCAG 2.1 AA
- [business-architecture.md](../../business/business-architecture.md) - Business entities

---

## Overview

**Organisms** are complex, reusable UI sections that combine molecules and atoms to form distinct sections of the interface. They represent more sophisticated functionality and often encapsulate business logic specific to the AgenticVerdict platform.

**Design Principles:**

- **Business Logic**: Encapsulate platform-specific functionality
- **Reusability**: Design for multiple contexts (dashboard, settings, reports)
- **Performance**: Optimize for large datasets (virtualization, lazy loading)
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation
- **RTL Support**: Comprehensive layout mirroring for Arabic

---

## Component Catalog

| Component              | Purpose                | Status         | Specification                          |
| ---------------------- | ---------------------- | -------------- | -------------------------------------- |
| **DataTable**          | Tabular data display   | 🔄 Phase 2     | [DataTable Spec](#datatable)           |
| **Navigation**         | Primary/secondary nav  | ✅ Implemented | [Navigation Spec](#navigation)         |
| **Sidebar**            | Collapsible navigation | 🔄 Phase 2     | [Sidebar Spec](#sidebar)               |
| **ConnectorCard**      | Connector status       | 🔄 Phase 2     | [ConnectorCard Spec](#connectorcard)   |
| **InsightCard**        | Insight summary        | 🔄 Phase 2     | [InsightCard Spec](#insightcard)       |
| **MetricCard**         | Single metric display  | 🔄 Phase 2     | [MetricCard Spec](#metriccard)         |
| **ChartContainer**     | Data visualization     | 🔄 Phase 2     | [ChartContainer Spec](#chartcontainer) |
| **EmptyState**         | No data/success states | 🔄 Phase 2     | [EmptyState Spec](#emptystate)         |
| **Notification/Toast** | Alert messages         | ✅ Implemented | [Notification Spec](#notification)     |

---

## DataTable

### Purpose

Full-featured data table with sorting, filtering, pagination, bulk actions, and RTL support. Used for displaying connectors, insights, metrics, and other tabular data.

### Props/Inputs

```typescript
interface DataTableProps<T> {
  // Data
  data: T[];
  columns: Column<T>[];

  // Selection
  selectable?: boolean;          // Enable row selection
  onSelectionChange?: (selectedRows: T[]) => void;
  getRowId?: (row: T) => string;  // Unique row identifier

  // Sorting
  sortable?: boolean;
  defaultSort?: SortDirection;
  onSortChange?: (column: string, direction: SortDirection) => void;

  // Filtering
  filterable?: boolean;
  onFilterChange?: (filters: FilterState) => void;
  filterPlaceholder?: string;

  // Pagination
  paginated?: boolean;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  totalRows?: number;

  // Bulk Actions
  bulkActions?: BulkAction<T>[];

  // States
  loading?: boolean;
  empty?: boolean;

  // Virtualization (for large datasets)
  virtualized?: boolean;
  virtualizationHeight?: number;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

interface Column<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  align?: 'start' | 'end' | 'center';
}

interface BulkAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedRows: T[]) => void;
  dangerous?: boolean;
}

// Example usage:
<DataTable
  data={connectors}
  columns={[
    { id: 'name', header: 'Platform', accessor: 'name' },
    { id: 'status', header: 'Status', accessor: 'status' },
    { id: 'lastSync', header: 'Last Sync', accessor: 'lastSync' },
  ]}
  selectable
  sortable
  paginated
  pageSize={10}
  bulkActions={[
    { label: 'Refresh', icon: 'refresh', onClick: handleRefresh },
    { label: 'Disconnect', icon: 'trash', onClick: handleDisconnect, dangerous: true },
  ]}
/>
```

### Outputs/Events

| Event                 | Signature                                            | Description                      |
| --------------------- | ---------------------------------------------------- | -------------------------------- |
| **onSelectionChange** | `(selectedRows: T[]) => void`                        | Fired when row selection changes |
| **onSortChange**      | `(column: string, direction: SortDirection) => void` | Fired when sort changes          |
| **onFilterChange**    | `(filters: FilterState) => void`                     | Fired when filters change        |
| **onPageChange**      | `(page: number) => void`                             | Fired when page changes          |
| **onRowClick**        | `(row: T) => void`                                   | Fired when row clicked           |

### Variants

| Variant        | Use Case             | Features                                  |
| -------------- | -------------------- | ----------------------------------------- |
| **basic**      | Simple data display  | No selection, sorting, or pagination      |
| **sortable**   | Sortable columns     | Click headers to sort                     |
| **selectable** | Row selection        | Checkboxes, bulk actions                  |
| **full**       | Complete feature set | Sorting, filtering, pagination, selection |

### States

| State        | Appearance                      | Behavior             |
| ------------ | ------------------------------- | -------------------- |
| **default**  | Data rows visible               | Normal display       |
| **loading**  | Skeleton rows                   | Shows loading state  |
| **empty**    | Empty state message             | No data message      |
| **error**    | Error message                   | Error display        |
| **sorting**  | Sort indicator on column header | Shows sort direction |
| **filtered** | Filtered rows                   | Filter badge visible |
| **selected** | Row highlighted                 | Checkbox checked     |

### Composition Rules

```tsx
// ✅ Allowed compositions
<DataTable data={data} columns={columns} />
<DataTable data={data} columns={columns} selectable sortable />
<DataTable data={data} columns={columns} bulkActions={actions} />

// ❌ Invalid compositions
<DataTable data={data} />  // Missing required columns
<DataTable columns={columns} />  // Missing required data
```

### Accessibility Requirements

- **Semantic HTML**: Use `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>`
- **Column Headers**: Use `scope="col"` for column headers, `scope="row"` for row headers
- **Sorting**: Announce sort direction with aria-sort
- **Selection**: Use checkboxes with proper labels
- **Pagination**: Accessible pagination with ARIA
- **Keyboard Navigation**: Arrow keys, Enter, Space
- **Screen Reader**: Announce row count, selection state

**ARIA Pattern:**

```tsx
<table aria-label="Connectors" aria-describedby="table-info">
  <caption id="table-info" className="sr-only">
    Showing {data.length} connectors
  </caption>
  <thead>
    <tr>
      <th scope="col" aria-sort={sortDirection}>
        Platform
      </th>
      <th scope="col">Status</th>
    </tr>
  </thead>
  <tbody>
    {data.map((row) => (
      <tr key={row.id}>
        <td>{row.name}</td>
        <td>{row.status}</td>
      </tr>
    ))}
  </tbody>
</table>
```

### RTL/LTR Behavior

| Element            | LTR             | RTL              |
| ------------------ | --------------- | ---------------- |
| **Column headers** | Left-aligned    | Right-aligned    |
| **Cell content**   | Left-aligned    | Right-aligned    |
| **Sort icons**     | Right of header | Left of header   |
| **Checkboxes**     | Leftmost column | Rightmost column |
| **Pagination**     | Left-to-right   | Right-to-left    |

### Multi-Language Support

**Translation Keys:**

- `common.datatable.noData`: No data available
- `common.datatable.loading`: Loading data...
- `common.datatable.error`: Error loading data
- `common.datatable.sort.ascending`: Sort ascending
- `common.datatable.sort.descending`: Sort descending
- `common.datatable.selected`: {count} selected
- `common.datatable.pagination.previous`: Previous
- `common.datatable.pagination.next`: Next
- `common.datatable.bulkActions`: Bulk actions

### Usage Examples

```tsx
// Basic table
<DataTable
  data={connectors}
  columns={[
    { id: 'name', header: 'Platform', accessor: 'name' },
    { id: 'status', header: 'Status', accessor: 'status' },
  ]}
/>

// With selection and bulk actions
<DataTable
  data={connectors}
  columns={connectorColumns}
  selectable
  onSelectionChange={setSelectedConnectors}
  bulkActions={[
    { label: 'Refresh All', icon: 'refresh', onClick: handleRefresh },
    { label: 'Disconnect', icon: 'trash', onClick: handleDisconnect, dangerous: true },
  ]}
/>

// With sorting and pagination
<DataTable
  data={insights}
  columns={insightColumns}
  sortable
  defaultSort="name"
  paginated
  pageSize={20}
  totalRows={totalInsights}
  onPageChange={setCurrentPage}
/>

// With filtering
<DataTable
  data={metrics}
  columns={metricColumns}
  filterable
  filterPlaceholder="Search metrics..."
  onFilterChange={setFilters}
/>

// Virtualized (large dataset)
<DataTable
  data={largeDataset}
  columns={columns}
  virtualized
  virtualizationHeight={600}
/>
```

### Related Components

- [Card](./molecules.md#card) - Card container for table
- [SearchInput](./molecules.md#searchinput) - Table search/filter
- [Badge](./atoms.md#badge) - Status badges in table cells
- [Button](./atoms.md#button) - Action buttons in table cells

### Related Entities/Pages

- **Connectors**: List of all connected platforms
- **Insights**: List of user insights
- **Reports**: Report history and downloads
- **Settings**: Users, permissions, configuration

---

## Navigation

### Purpose

Primary and secondary navigation for the application. Provides hierarchical navigation, breadcrumbs, and mobile-responsive menu.

### Props/Inputs

```typescript
interface NavigationProps {
  // Navigation items
  items: NavigationItem[];
  activeItem?: string;           // Currently active item ID

  // Display
  variant?: 'primary' | 'secondary' | 'breadcrumbs';
  orientation?: 'horizontal' | 'vertical';

  // Features
  collapsible?: boolean;         // Collapse sub-menus
  defaultCollapsed?: boolean;

  // Mobile
  mobileMenu?: boolean;          // Show mobile menu button
  onMobileMenuToggle?: () => void;

  // Branding
  logo?: React.ReactNode;
  logoHref?: string;

  // User menu
  userMenu?: UserMenuItem[];
  onUserMenuClick?: (item: UserMenuItem) => void;

  // Accessibility
  ariaLabel?: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string | number;       // Notification count, status
  children?: NavigationItem[];   // Sub-menu items
}

interface UserMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  dangerous?: boolean;
}

// Example usage:
<Navigation
  variant="primary"
  items={[
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', href: '/dashboard' },
    { id: 'insights', label: 'Insights', icon: 'file-text', href: '/insights' },
    { id: 'connectors', label: 'Connectors', icon: 'plug', href: '/connectors' },
  ]}
  activeItem="dashboard"
  mobileMenu
/>
```

### Outputs/Events

| Event                  | Signature                        | Description                       |
| ---------------------- | -------------------------------- | --------------------------------- |
| **onItemClick**        | `(item: NavigationItem) => void` | Fired when nav item clicked       |
| **onMobileMenuToggle** | `() => void`                     | Fired when mobile menu toggled    |
| **onUserMenuClick**    | `(item: UserMenuItem) => void`   | Fired when user menu item clicked |

### Variants

| Variant         | Use Case                    | Placement           |
| --------------- | --------------------------- | ------------------- |
| **primary**     | Main application navigation | Top or left sidebar |
| **secondary**   | Section-level navigation    | Below primary nav   |
| **breadcrumbs** | Page hierarchy              | Top of content area |

### States

| State         | Appearance       | Behavior         |
| ------------- | ---------------- | ---------------- |
| **default**   | Normal nav items | Hover effect     |
| **active**    | Highlighted item | Active indicator |
| **disabled**  | Grayed out       | Not interactive  |
| **collapsed** | Sub-menu hidden  | Expandable       |
| **expanded**  | Sub-menu visible | Collapsible      |

### Composition Rules

```tsx
// ✅ Allowed compositions
<Navigation variant="primary" items={items} />
<Navigation variant="breadcrumbs" items={breadcrumbItems} />
<Navigation variant="secondary" items={subItems} orientation="vertical" />

// ❌ Invalid compositions
<Navigation variant="invalid" items={items} />  // Invalid variant
<Navigation items={items}><div>Nested content</div></Navigation>  // No children allowed
```

### Accessibility Requirements

- **Semantic HTML**: Use `<nav>`, `<ul>`, `<li>`, `<a>` elements
- **ARIA Attributes**:
  - `aria-current="page"` for active item
  - `aria-expanded` for collapsible menus
  - `aria-label` for navigation regions
- **Keyboard Navigation**: Arrow keys, Enter, Escape
- **Skip Links**: Provide skip-to-content link
- **Focus Management**: Visible focus indicators

**ARIA Pattern:**

```tsx
<nav aria-label="Main navigation">
  <ul>
    {items.map((item) => (
      <li key={item.id}>
        <a href={item.href} aria-current={item.id === activeItem ? "page" : undefined}>
          {item.icon && <span aria-hidden="true">{item.icon}</span>}
          <span>{item.label}</span>
        </a>
      </li>
    ))}
  </ul>
</nav>
```

### RTL/LTR Behavior

| Element              | LTR                 | RTL                 |
| -------------------- | ------------------- | ------------------- |
| **Logo**             | Left side           | Right side          |
| **Nav items**        | Left-to-right order | Right-to-left order |
| **User menu**        | Right side          | Left side           |
| **Icons**            | Left of text        | Right of text       |
| **Collapse chevron** | Right side          | Left side (flipped) |

### Multi-Language Support

**Translation Keys:**

- `common.nav.dashboard`: Dashboard
- `common.nav.insights`: Insights
- `common.nav.connectors`: Connectors
- `common.nav.settings`: Settings
- `common.nav.mobileMenu`: Menu
- `common.nav.userMenu`: User menu
- `common.nav.breadcrumbs.home`: Home

### Usage Examples

```tsx
// Primary navigation
<Navigation
  variant="primary"
  items={[
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', href: '/dashboard' },
    { id: 'insights', label: 'Insights', icon: 'file-text', href: '/insights' },
    { id: 'connectors', label: 'Connectors', icon: 'plug', href: '/connectors' },
    { id: 'settings', label: 'Settings', icon: 'settings', href: '/settings' },
  ]}
  activeItem="dashboard"
/>

// Secondary navigation
<Navigation
  variant="secondary"
  items={[
    { id: 'overview', label: 'Overview', href: '/insights' },
    { id: 'marketing', label: 'Marketing', href: '/insights/marketing' },
    { id: 'finance', label: 'Finance', href: '/insights/finance' },
  ]}
  orientation="vertical"
/>

// Breadcrumbs
<Navigation
  variant="breadcrumbs"
  items={[
    { id: 'home', label: 'Home', href: '/' },
    { id: 'insights', label: 'Insights', href: '/insights' },
    { id: 'detail', label: 'Marketing Insight', href: '/insights/123' },
  ]}
/>

// With user menu
<Navigation
  variant="primary"
  items={navItems}
  userMenu={[
    { id: 'profile', label: 'Profile', icon: 'user', onClick: goToProfile },
    { id: 'settings', label: 'Settings', icon: 'settings', onClick: goToSettings },
    { id: 'logout', label: 'Sign out', icon: 'logout', onClick: signOut, dangerous: true },
  ]}
/>
```

### Related Components

- [Sidebar](#sidebar) - Collapsible sidebar navigation
- [Breadcrumb](#navigation) - Breadcrumb variant
- [Button](./atoms.md#button) - Mobile menu toggle button

### Related Entities/Pages

- **All Pages**: Primary navigation across application
- **Insights**: Secondary navigation by domain
- **Settings**: Settings sections navigation
- **Mobile**: Mobile menu navigation

---

## Sidebar

### Purpose

Collapsible sidebar navigation with tenant switcher for agencies. Provides hierarchical navigation, quick access to key features, and multi-tenant support.

### Props/Inputs

```typescript
interface SidebarProps {
  // Navigation items
  items: NavigationItem[];
  activeItem?: string;

  // Tenant switcher (for agencies)
  tenantSwitcher?: boolean;
  tenants?: Tenant[];
  currentTenant?: string;
  onTenantChange?: (tenantId: string) => void;

  // Collapsible
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;

  // Branding
  logo?: React.ReactNode;
  logoHref?: string;

  // User profile
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };

  // Quick actions
  quickActions?: QuickAction[];

  // Footer content
  footer?: React.ReactNode;

  // Mobile
  mobile?: boolean;              // Mobile overlay mode
  onCloseMobile?: () => void;    // Close mobile sidebar

  // Accessibility
  ariaLabel?: string;
}

interface Tenant {
  id: string;
  name: string;
  logo?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

// Example usage:
<Sidebar
  items={navItems}
  activeItem="dashboard"
  tenantSwitcher
  tenants={agencyClients}
  currentTenant={currentClientId}
  onTenantChange={switchTenant}
  collapsible
/>
```

### Outputs/Events

| Event                | Signature                        | Description                      |
| -------------------- | -------------------------------- | -------------------------------- |
| **onItemClick**      | `(item: NavigationItem) => void` | Fired when nav item clicked      |
| **onTenantChange**   | `(tenantId: string) => void`     | Fired when tenant switched       |
| **onCollapseChange** | `(collapsed: boolean) => void`   | Fired when sidebar collapsed     |
| **onCloseMobile**    | `() => void`                     | Fired when mobile sidebar closed |

### Variants

| Variant       | Use Case              | Width      |
| ------------- | --------------------- | ---------- |
| **expanded**  | Default, full sidebar | 260px      |
| **collapsed** | Icon-only sidebar     | 72px       |
| **mobile**    | Full-screen overlay   | 100% width |

### States

| State             | Appearance          | Behavior                      |
| ----------------- | ------------------- | ----------------------------- |
| **expanded**      | Full-width sidebar  | Shows labels, descriptions    |
| **collapsed**     | Narrow sidebar      | Icons only, tooltips on hover |
| **mobile-open**   | Full-screen overlay | Visible on mobile             |
| **mobile-closed** | Hidden              | Hidden on mobile              |

### Composition Rules

```tsx
// ✅ Allowed compositions
<Sidebar items={items} activeItem="dashboard" />
<Sidebar items={items} tenantSwitcher tenants={tenants} />
<Sidebar items={items} collapsible defaultCollapsed />

// ❌ Invalid compositions
<Sidebar />  // Missing required items
<Sidebar items={items}><div>Nested content</div></Sidebar>  // No children allowed
```

### Accessibility Requirements

- **Semantic HTML**: Use `<aside>`, `<nav>`, `<ul>`, `<button>` elements
- **ARIA Attributes**:
  - `aria-expanded` for collapsible state
  - `aria-current="page"` for active item
  - `aria-label` for icon-only buttons
- **Keyboard Navigation**: Arrow keys, Enter, Escape
- **Focus Trap**: Trap focus when mobile sidebar is open
- **Skip Link**: Provide skip-to-content link

### RTL/LTR Behavior

| Element             | LTR                     | RTL                      |
| ------------------- | ----------------------- | ------------------------ |
| **Sidebar**         | Left side               | Right side               |
| **Logo**            | Top-left                | Top-right                |
| **Nav items**       | Left-aligned            | Right-aligned            |
| **Collapse button** | Bottom of sidebar       | Bottom of sidebar        |
| **Chevron**         | Points left (collapsed) | Points right (collapsed) |

### Multi-Language Support

**Translation Keys:**

- `common.sidebar.dashboard`: Dashboard
- `common.sidebar.insights`: Insights
- `common.sidebar.connectors`: Connectors
- `common.sidebar.settings`: Settings
- `common.sidebar.tenantSwitcher`: Switch client
- `common.sidebar.collapse`: Collapse sidebar
- `common.sidebar.expand`: Expand sidebar

### Usage Examples

```tsx
// Basic sidebar
<Sidebar
  items={[
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', href: '/dashboard' },
    { id: 'insights', label: 'Insights', icon: 'file-text', href: '/insights' },
    { id: 'connectors', label: 'Connectors', icon: 'plug', href: '/connectors' },
  ]}
  activeItem="dashboard"
/>

// With tenant switcher (agency)
<Sidebar
  items={navItems}
  tenantSwitcher
  tenants={[
    { id: 'client1', name: 'Client 1' },
    { id: 'client2', name: 'Client 2' },
  ]}
  currentTenant="client1"
  onTenantChange={switchTenant}
/>

// Collapsible
<Sidebar
  items={navItems}
  collapsible
  defaultCollapsed={false}
  onCollapseChange={setCollapsed}
/>

// With user profile
<Sidebar
  items={navItems}
  user={{
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '/avatars/john.jpg',
  }}
/>

// Mobile overlay
<Sidebar
  items={navItems}
  mobile
  onCloseMobile={handleCloseMobile}
/>
```

### Related Components

- [Navigation](#navigation) - Primary/secondary navigation
- [Dropdown](./molecules.md#dropdown) - Tenant dropdown switcher
- [Button](./atoms.md#button) - Collapse/expand button

### Related Entities/Pages

- **Dashboard**: Main navigation
- **Agency Partner**: Multi-tenant management
- **Settings**: Settings navigation
- **Mobile**: Mobile navigation menu

---

## ConnectorCard

### Purpose

Card displaying connector status, metrics, health indicators, and actions. Used for managing platform connections (GA4, Meta, TikTok, etc.).

### Props/Inputs

```typescript
interface ConnectorCardProps {
  // Connector data
  connector: Connector;

  // Display
  variant?: 'status' | 'detailed' | 'compact';

  // Actions
  onConnect?: () => void;
  onDisconnect?: () => void;
  onRefresh?: () => void;
  onConfigure?: () => void;

  // States
  loading?: boolean;
  error?: string;

  // Health check
  showHealth?: boolean;
  healthCheckInterval?: number;  // milliseconds

  // Accessibility
  ariaLabel?: string;
}

interface Connector {
  id: string;
  name: string;
  platform: PlatformType;        // 'ga4' | 'meta' | 'tiktok' | 'gsc' | 'gbp'
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync?: Date;
  metrics?: ConnectorMetrics;
  errors?: ConnectorError[];
}

interface ConnectorMetrics {
  recordsFetched: number;
  lastFetchDuration: number;     // milliseconds
  dataFreshness: 'fresh' | 'stale' | 'outdated';
}

interface ConnectorError {
  code: string;
  message: string;
  timestamp: Date;
}

// Example usage:
<ConnectorCard
  connector={{
    id: 'ga4-123',
    name: 'Google Analytics 4',
    platform: 'ga4',
    status: 'connected',
    lastSync: new Date(),
    metrics: { recordsFetched: 1234, lastFetchDuration: 2500, dataFreshness: 'fresh' },
  }}
  variant="detailed"
  onRefresh={handleRefresh}
  onDisconnect={handleDisconnect}
/>
```

### Outputs/Events

| Event            | Signature    | Description                          |
| ---------------- | ------------ | ------------------------------------ |
| **onConnect**    | `() => void` | Fired when connect button clicked    |
| **onDisconnect** | `() => void` | Fired when disconnect button clicked |
| **onRefresh**    | `() => void` | Fired when refresh button clicked    |
| **onConfigure**  | `() => void` | Fired when configure button clicked  |

### Variants

| Variant      | Use Case            | Content                                |
| ------------ | ------------------- | -------------------------------------- |
| **status**   | Quick status view   | Platform icon, status badge, last sync |
| **detailed** | Full connector view | Status, metrics, errors, actions       |
| **compact**  | List view           | Platform, status, minimal actions      |

### States

| State            | Appearance          | Behavior                         |
| ---------------- | ------------------- | -------------------------------- |
| **connected**    | Green status badge  | Show metrics, refresh button     |
| **disconnected** | Gray status badge   | Show connect button              |
| **error**        | Red status badge    | Show error message, retry button |
| **pending**      | Yellow status badge | Show loading indicator           |
| **loading**      | Spinner overlay     | Disable all actions              |

### Composition Rules

```tsx
// ✅ Allowed compositions
<ConnectorCard connector={connector} />
<ConnectorCard connector={connector} variant="detailed" />
<ConnectorCard connector={connector} onConnect={handleConnect} />

// ❌ Invalid compositions
<ConnectorCard />  // Missing required connector prop
<ConnectorCard connector={connector}><div>Nested content</div></ConnectorCard>  // No children
```

### Accessibility Requirements

- **Semantic HTML**: Use `<article>` for card structure
- **ARIA Attributes**:
  - `aria-label` for connector identification
  - `aria-live="polite"` for status updates
  - `aria-busy="true"` during loading
- **Status Indicators**: Color + icon + text (never color alone)
- **Button Labels**: Clear action labels with aria-label

**ARIA Pattern:**

```tsx
<article aria-label={`Connector for ${connector.name}`} className="connector-card">
  <div className="status" aria-live="polite">
    <Badge variant="status" color={statusColor}>
      {connector.status}
    </Badge>
  </div>
  <button aria-label={`Refresh ${connector.name} connector`} onClick={onRefresh}>
    <Icon name="refresh" />
  </button>
</article>
```

### RTL/LTR Behavior

| Element           | LTR           | RTL           |
| ----------------- | ------------- | ------------- |
| **Platform icon** | Left side     | Right side    |
| **Status badge**  | Right of icon | Left of icon  |
| **Actions menu**  | Right side    | Left side     |
| **Error message** | Left-aligned  | Right-aligned |

### Multi-Language Support

**Translation Keys:**

- `common.connector.status.connected`: Connected
- `common.connector.status.disconnected`: Disconnected
- `common.connector.status.error`: Error
- `common.connector.status.pending`: Connecting...
- `common.connector.lastSync`: Last sync {time}
- `common.connector.actions.connect`: Connect
- `common.connector.actions.disconnect`: Disconnect
- `common.connector.actions.refresh`: Refresh
- `common.connector.actions.configure`: Configure
- `common.connector.error.authFailed`: Authentication failed
- `common.connector.error.rateLimit`: Rate limit exceeded

### Usage Examples

```tsx
// Status variant
<ConnectorCard
  connector={{
    id: 'ga4-123',
    name: 'Google Analytics 4',
    platform: 'ga4',
    status: 'connected',
    lastSync: new Date(),
  }}
  variant="status"
/>

// Detailed variant
<ConnectorCard
  connector={{
    id: 'meta-456',
    name: 'Meta',
    platform: 'meta',
    status: 'connected',
    lastSync: new Date(),
    metrics: {
      recordsFetched: 5678,
      lastFetchDuration: 3200,
      dataFreshness: 'fresh',
    },
  }}
  variant="detailed"
  onRefresh={handleRefresh}
  onDisconnect={handleDisconnect}
/>

// Error state
<ConnectorCard
  connector={{
    id: 'tiktok-789',
    name: 'TikTok',
    platform: 'tiktok',
    status: 'error',
    errors: [{
      code: 'AUTH_FAILED',
      message: 'Authentication failed',
      timestamp: new Date(),
    }],
  }}
  variant="detailed"
  onConnect={handleReconnect}
/>

// Loading state
<ConnectorCard
  connector={connector}
  loading
/>
```

### Related Components

- [Card](./molecules.md#card) - Base card component
- [Badge](./atoms.md#badge) - Status badges
- [Icon](./atoms.md#icon) - Platform icons
- [Button](./atoms.md#button) - Action buttons
- [MetricCard](#metriccard) - Connector metrics display

### Related Entities/Pages

- **Connector Management**: List of all connectors
- **Insight Creation**: Connector selection and status
- **Dashboard**: Connector health overview
- **Settings**: Connector configuration

---

## InsightCard

### Purpose

Card displaying insight summary, metrics, trends, drill-down, and export options. Used for presenting AI-generated insights.

### Props/Inputs

```typescript
interface InsightCardProps {
  // Insight data
  insight: Insight;

  // Display
  variant?: 'summary' | 'detailed' | 'minimal';

  // Actions
  onViewDetails?: () => void;
  onExport?: (format: 'pdf' | 'excel') => void;
  onShare?: () => void;
  onDelete?: () => void;

  // States
  loading?: boolean;
  error?: string;

  // Features
  showTrends?: boolean;
  showMetrics?: boolean;
  showRecommendations?: boolean;

  // Interaction
  expandable?: boolean;
  defaultExpanded?: boolean;

  // Accessibility
  ariaLabel?: string;
}

interface Insight {
  id: string;
  name: string;
  description?: string;
  domain: DomainType;            // 'marketing' | 'finance' | 'operations' | 'seo' | 'social' | 'local'
  status: 'active' | 'draft' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  metrics: InsightMetric[];
  trends: InsightTrend[];
  recommendations: string[];
  schedule: InsightSchedule;
}

interface InsightMetric {
  name: string;
  value: number;
  change?: number;
  unit?: string;
}

interface InsightTrend {
  period: string;
  value: number;
}

// Example usage:
<InsightCard
  insight={marketingInsight}
  variant="detailed"
  showTrends
  showMetrics
  onViewDetails={navigateToDetail}
  onExport={exportInsight}
/>
```

### Outputs/Events

| Event             | Signature                            | Description                     |
| ----------------- | ------------------------------------ | ------------------------------- |
| **onViewDetails** | `() => void`                         | Fired when view details clicked |
| **onExport**      | `(format: 'pdf' \| 'excel') => void` | Fired when export clicked       |
| **onShare**       | `() => void`                         | Fired when share clicked        |
| **onDelete**      | `() => void`                         | Fired when delete clicked       |

### Variants

| Variant      | Use Case           | Content                                       |
| ------------ | ------------------ | --------------------------------------------- |
| **summary**  | Dashboard overview | Name, description, key metrics, status        |
| **detailed** | Full insight view  | All metrics, trends, recommendations, actions |
| **minimal**  | List item          | Name, status, minimal info                    |

### States

| State        | Appearance      | Behavior                 |
| ------------ | --------------- | ------------------------ |
| **active**   | Normal display  | All actions available    |
| **draft**    | Draft badge     | Draft indicator visible  |
| **archived** | Grayed out      | Limited actions          |
| **loading**  | Skeleton loader | Shows loading state      |
| **error**    | Error message   | Error display with retry |

### Composition Rules

```tsx
// ✅ Allowed compositions
<InsightCard insight={insight} />
<InsightCard insight={insight} variant="detailed" />
<InsightCard insight={insight} onExport={handleExport} />

// ❌ Invalid compositions
<InsightCard />  // Missing required insight prop
<InsightCard insight={insight}><div>Nested content</div></InsightCard>  // No children
```

### Accessibility Requirements

- **Semantic HTML**: Use `<article>` for card structure
- **Heading Hierarchy**: Proper heading levels for title, sections
- **ARIA Attributes**:
  - `aria-label` for insight identification
  - `aria-describedby` for descriptions
  - `aria-expanded` for expandable content
- **Keyboard Navigation**: Tab through actions, Enter to activate
- **Screen Reader**: Announce insight name, domain, status

### RTL/LTR Behavior

| Element              | LTR             | RTL            |
| -------------------- | --------------- | -------------- |
| **Domain badge**     | Left of title   | Right of title |
| **Actions menu**     | Right side      | Left side      |
| **Trend indicators** | Right of metric | Left of metric |
| **Recommendations**  | Left-aligned    | Right-aligned  |

### Multi-Language Support

**Translation Keys:**

- `common.insight.status.active`: Active
- `common.insight.status.draft`: Draft
- `common.insight.status.archived`: Archived
- `common.insight.viewDetails`: View details
- `common.insight.export`: Export
- `common.insight.share`: Share
- `common.insight.delete`: Delete
- `common.insight.recommendations`: Recommendations
- `common.insight.metrics`: Metrics
- `common.insight.trends`: Trends

### Usage Examples

```tsx
// Summary variant
<InsightCard
  insight={marketingInsight}
  variant="summary"
  onViewDetails={navigateToDetail}
/>

// Detailed variant
<InsightCard
  insight={financeInsight}
  variant="detailed"
  showTrends
  showMetrics
  showRecommendations
  onViewDetails={navigateToDetail}
  onExport={handleExport}
  onShare={handleShare}
/>

// Expandable
<InsightCard
  insight={operationsInsight}
  expandable
  defaultExpanded={false}
/>

// Draft state
<InsightCard
  insight={{
    ...baseInsight,
    status: 'draft',
  }}
  variant="summary"
/>
```

### Related Components

- [Card](./molecules.md#card) - Base card component
- [MetricCard](#metriccard) - Metric display
- [Badge](./atoms.md#badge) - Status badges
- [Button](./atoms.md#button) - Action buttons
- [ChartContainer](#chartcontainer) - Trend charts

### Related Entities/Pages

- **Dashboard**: Insight overview cards
- **Insights**: List of all insights
- **Reports**: Insight detail view
- **Share**: Shared insight view

---

## MetricCard

### Purpose

Card displaying a single metric with value, trend indicator, sparkline, and comparison. Used for dashboard KPIs and metric summaries.

### Props/Inputs

```typescript
interface MetricCardProps {
  // Metric data
  title: string;
  value: number | string;
  unit?: string;

  // Trend
  trend?: number;               // Percentage change (+12.5, -5.3)
  trendDirection?: 'up' | 'down' | 'neutral';

  // Comparison
  previousValue?: number;
  comparisonLabel?: string;

  // Visual
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'red' | 'neutral';

  // Sparkline (optional)
  sparkline?: number[];
  sparklineColor?: string;

  // Link
  href?: string;
  onClick?: () => void;

  // Loading
  loading?: boolean;

  // Accessibility
  ariaLabel?: string;
}

// Example usage:
<MetricCard
  title="Total Impressions"
  value="1.2M"
  unit="impressions"
  trend={12.5}
  trendDirection="up"
  sparkline={[100, 120, 115, 130, 145, 140, 150]}
/>
```

### Outputs/Events

| Event       | Signature    | Description                                |
| ----------- | ------------ | ------------------------------------------ |
| **onClick** | `() => void` | Fired when card clicked (if href provided) |

### Variants

| Variant | Use Case        | Size                          |
| ------- | --------------- | ----------------------------- |
| **sm**  | Compact metric  | Small font, minimal padding   |
| **md**  | Default metric  | Medium font, standard padding |
| **lg**  | Featured metric | Large font, generous padding  |

### States

| State         | Appearance            | Behavior             |
| ------------- | --------------------- | -------------------- |
| **default**   | Base styles           | Normal display       |
| **positive**  | Green trend indicator | Shows upward trend   |
| **negative**  | Red trend indicator   | Shows downward trend |
| **neutral**   | Gray trend indicator  | No change            |
| **loading**   | Skeleton loader       | Shows loading state  |
| **clickable** | Hover effect          | Cursor pointer       |

### Composition Rules

```tsx
// ✅ Allowed compositions
<MetricCard title="Impressions" value="1.2M" />
<MetricCard title="Revenue" value="$45,000" trend={12.5} />
<MetricCard title="Clicks" value="12,345" sparkline={data} />

// ❌ Invalid compositions
<MetricCard value="1.2M" />  // Missing required title
<MetricCard title="Test"><div>Nested content</div></MetricCard>  // No children
```

### Accessibility Requirements

- **Semantic HTML**: Use `<article>` or `<div>` with role="region"
- **ARIA Attributes**:
  - `aria-label` for metric identification
  - `aria-describedby` for trend description
- **Trend Indicators**: Icon + color + text (never color alone)
- **Screen Reader**: Announce title, value, trend, comparison

**ARIA Pattern:**

```tsx
<article aria-label={`${title}: ${value}`} className="metric-card">
  <h3>{title}</h3>
  <p className="value" aria-describedby="trend-description">
    {value}
  </p>
  {trend && (
    <p id="trend-description" className="trend">
      <Icon name={trendDirection === "up" ? "trending-up" : "trending-down"} aria-hidden="true" />
      {Math.abs(trend)}% vs {comparisonLabel}
    </p>
  )}
</article>
```

### RTL/LTR Behavior

| Element             | LTR            | RTL           |
| ------------------- | -------------- | ------------- |
| **Title**           | Left-aligned   | Right-aligned |
| **Value**           | Left-aligned   | Right-aligned |
| **Trend indicator** | Right of value | Left of value |
| **Sparkline**       | Right side     | Left side     |

### Multi-Language Support

**Translation Keys:**

- `common.metric.vsPrevious`: vs previous period
- `common.metric.vsLastMonth`: vs last month
- `common.metric.vsLastYear`: vs last year
- `common.metric.trend.up`: Increased by {percentage}%
- `common.metric.trend.down`: Decreased by {percentage}%
- `common.metric.trend.neutral`: No change

### Usage Examples

```tsx
// Basic metric
<MetricCard
  title="Total Impressions"
  value="1.2M"
/>

// With trend
<MetricCard
  title="Revenue"
  value="$45,000"
  trend={12.5}
  trendDirection="up"
  comparisonLabel="last month"
/>

// With sparkline
<MetricCard
  title="Sessions"
  value="25,432"
  trend={-3.2}
  trendDirection="down"
  sparkline={[100, 95, 98, 92, 89, 91, 88]}
  comparisonLabel="last week"
/>

// Clickable
<MetricCard
  title="Conversion Rate"
  value="3.2%"
  href="/insights/conversion"
/>

// Loading
<MetricCard
  title="Loading Metric"
  value="--"
  loading
/>
```

### Related Components

- [Card](./molecules.md#card) - Base card component
- [Badge](./atoms.md#badge) - Trend badges
- [Icon](./atoms.md#icon) - Trend icons
- [ChartContainer](#chartcontainer) - Full charts (vs sparkline)

### Related Entities/Pages

- **Dashboard**: KPI cards
- **Insights**: Insight metric summaries
- **Reports**: Report metric cards
- **Connectors**: Connector metric cards

---

## ChartContainer

### Purpose

Container for data visualization with support for line, bar, pie, and funnel charts. Includes RTL support, accessibility features, and responsive design.

### Props/Inputs

```typescript
interface ChartContainerProps {
  // Chart data
  type: 'line' | 'bar' | 'pie' | 'funnel';
  data: ChartData;

  // Display
  title?: string;
  description?: string;
  height?: number | string;
  width?: number | string;

  // Axes (line/bar charts)
  xAxis?: string;
  yAxis?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;

  // Styling
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showTooltip?: boolean;

  // Interaction
  zoomable?: boolean;
  downloadable?: boolean;

  // Loading
  loading?: boolean;
  error?: string;

  // Accessibility
  ariaLabel?: string;
  ariaDescription?: string;
  dataTableName?: string;        // For screen reader alternative
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
  }[];
}

// Example usage:
<ChartContainer
  type="line"
  data={{
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Impressions',
      data: [1000, 1200, 1150, 1300, 1450, 1600],
      color: '#228BE6',
    }],
  }}
  title="Impressions Over Time"
  height={300}
  showLegend
  showTooltip
/>
```

### Outputs/Events

| Event                | Signature                             | Description                   |
| -------------------- | ------------------------------------- | ----------------------------- |
| **onDataPointClick** | `(dataPoint: ChartDataPoint) => void` | Fired when data point clicked |
| **onZoom**           | `(zoomState: ZoomState) => void`      | Fired when chart zoomed       |
| **onDownload**       | `(format: 'png' \| 'svg') => void`    | Fired when download clicked   |

### Variants

| Variant    | Use Case            | Chart Type      |
| ---------- | ------------------- | --------------- |
| **line**   | Trends over time    | Line chart      |
| **bar**    | Category comparison | Bar chart       |
| **pie**    | Part-to-whole       | Pie/donut chart |
| **funnel** | Conversion stages   | Funnel chart    |

### States

| State       | Appearance      | Behavior                  |
| ----------- | --------------- | ------------------------- |
| **default** | Chart visible   | Interactive tooltips      |
| **loading** | Skeleton loader | Shows loading state       |
| **error**   | Error message   | Error display             |
| **empty**   | Empty state     | No data message           |
| **zoomed**  | Zoomed in       | Reset zoom button visible |

### Composition Rules

```tsx
// ✅ Allowed compositions
<ChartContainer type="line" data={data} />
<ChartContainer type="bar" data={data} title="Sales by Month" />
<ChartContainer type="pie" data={data} showLegend />

// ❌ Invalid compositions
<ChartContainer type="line" />  // Missing required data
<ChartContainer type="invalid" data={data} />  // Invalid type
```

### Accessibility Requirements

- **Alternative Text**: Provide data table for screen readers
- **ARIA Attributes**:
  - `aria-label` for chart identification
  - `aria-describedby` for description
  - `role="img"` for chart container
- **Color Blindness**: Use patterns + colors, avoid red-green
- **Keyboard Navigation**: Navigate data points with arrow keys
- **Screen Reader**: Announce chart type, trends, key insights

**ARIA Pattern:**

```tsx
<div role="img" aria-label="Line chart showing impressions over time">
  <Chart data={data} type="line" />

  {/* Alternative data table for screen readers */}
  <table className="sr-only" aria-label="Impressions data table">
    <thead>
      <tr>
        <th>Month</th>
        <th>Impressions</th>
      </tr>
    </thead>
    <tbody>
      {data.labels.map((label, i) => (
        <tr key={i}>
          <td>{label}</td>
          <td>{data.datasets[0].data[i]}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### RTL/LTR Behavior

| Element          | LTR            | RTL            |
| ---------------- | -------------- | -------------- |
| **Y-axis label** | Left of chart  | Right of chart |
| **X-axis label** | Below chart    | Below chart    |
| **Legend**       | Right of chart | Left of chart  |
| **Tooltip**      | Follows cursor | Follows cursor |

### Multi-Language Support

**Translation Keys:**

- `common.chart.loading`: Loading chart...
- `common.chart.noData`: No data available
- `common.chart.download`: Download chart
- `common.chart.resetZoom`: Reset zoom
- `common.chart.tooltip`: {label}: {value}

### Usage Examples

```tsx
// Line chart
<ChartContainer
  type="line"
  data={{
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Impressions',
      data: [1000, 1200, 1150, 1300, 1450, 1600],
    }],
  }}
  title="Impressions Over Time"
  height={300}
  showTooltip
/>

// Bar chart
<ChartContainer
  type="bar"
  data={{
    labels: ['GA4', 'Meta', 'TikTok', 'GSC'],
    datasets: [{
      label: 'Sessions',
      data: [5000, 3200, 1800, 2100],
    }],
  }}
  title="Sessions by Platform"
  showGrid
  showLegend
/>

// Pie chart
<ChartContainer
  type="pie"
  data={{
    labels: ['Mobile', 'Desktop', 'Tablet'],
    datasets: [{
      label: 'Traffic',
      data: [60, 35, 5],
    }],
  }}
  title="Traffic by Device"
  showLegend
/>

// Funnel chart
<ChartContainer
  type="funnel"
  data={{
    labels: ['Visitors', 'Signups', 'Activations', 'Purchases'],
    datasets: [{
      label: 'Conversion Funnel',
      data: [10000, 5000, 2500, 500],
    }],
  }}
  title="Conversion Funnel"
/>
```

### Related Components

- [Card](./molecules.md#card) - Chart card container
- [MetricCard](#metriccard) - Single metric with sparkline
- [DataTable](#datatable) - Data table alternative

### Related Entities/Pages

- **Dashboard**: Trend charts, metric charts
- **Insights**: Insight visualization
- **Reports**: Report charts
- **Connectors**: Connector performance charts

---

## EmptyState

### Purpose

Visual component for no data, error, and success states. Provides illustrations, messaging, and action buttons.

### Props/Inputs

```typescript
interface EmptyStateProps {
  // Type
  type: 'no-data' | 'error' | 'success' | 'info';

  // Content
  title: string;
  description?: string;

  // Illustration
  illustration?: React.ReactNode;  // Custom illustration
  icon?: React.ReactNode;          // Icon instead of illustration

  // Actions
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };

  // Size
  size?: 'sm' | 'md' | 'lg';

  // Accessibility
  ariaLabel?: string;
}

// Example usage:
<EmptyState
  type="no-data"
  title="No insights yet"
  description="Create your first insight to get started"
  primaryAction={{
    label: 'Create Insight',
    onClick: createInsight,
    icon: 'plus',
  }}
/>
```

### Outputs/Events

| Event                       | Signature    | Description                         |
| --------------------------- | ------------ | ----------------------------------- |
| **primaryAction.onClick**   | `() => void` | Fired when primary action clicked   |
| **secondaryAction.onClick** | `() => void` | Fired when secondary action clicked |

### Variants

| Variant     | Use Case          | Appearance                         |
| ----------- | ----------------- | ---------------------------------- |
| **no-data** | No data available | Neutral illustration               |
| **error**   | Error occurred    | Error illustration, red accent     |
| **success** | Successful action | Success illustration, green accent |
| **info**    | Informational     | Info illustration, blue accent     |

### States

| State  | Appearance          | Behavior              |
| ------ | ------------------- | --------------------- |
| **sm** | Small illustration  | Compact layout        |
| **md** | Medium illustration | Default size          |
| **lg** | Large illustration  | Full-page empty state |

### Composition Rules

```tsx
// ✅ Allowed compositions
<EmptyState type="no-data" title="No data" />
<EmptyState type="error" title="Error" description="Something went wrong" />
<EmptyState type="success" title="Success" primaryAction={action} />

// ❌ Invalid compositions
<EmptyState type="no-data" />  // Missing required title
<EmptyState type="invalid" title="Test" />  // Invalid type
```

### Accessibility Requirements

- **Semantic HTML**: Use `<section>`, `<h2>`, `<p>`, `<button>` elements
- **ARIA Attributes**:
  - `role="status"` for no-data/info
  - `role="alert"` for error
  - `aria-live="polite"` for dynamic updates
- **Focus Management**: Focus primary action on mount
- **Screen Reader**: Announce title, description, available actions

### RTL/LTR Behavior

| Element          | LTR                         | RTL                          |
| ---------------- | --------------------------- | ---------------------------- |
| **Illustration** | Above text                  | Above text                   |
| **Title**        | Left-aligned                | Right-aligned                |
| **Description**  | Left-aligned                | Right-aligned                |
| **Actions**      | Left-aligned, primary first | Right-aligned, primary first |

### Multi-Language Support

**Translation Keys:**

- `common.empty.noData.title`: No data available
- `common.empty.noData.description`: There's no data to display yet
- `common.empty.error.title`: Something went wrong
- `common.empty.error.description`: An error occurred while loading data
- `common.empty.success.title`: Success!
- `common.empty.info.title`: Information`

### Usage Examples

```tsx
// No data
<EmptyState
  type="no-data"
  title="No connectors yet"
  description="Connect your first platform to start collecting data"
  primaryAction={{
    label: 'Add Connector',
    onClick: openConnectorModal,
    icon: 'plus',
  }}
/>

// Error
<EmptyState
  type="error"
  title="Failed to load insights"
  description="There was an error loading your insights. Please try again."
  primaryAction={{
    label: 'Retry',
    onClick: retry,
    icon: 'refresh',
  }}
  secondaryAction={{
    label: 'Go Back',
    onClick: goBack,
  }}
/>

// Success
<EmptyState
  type="success"
  title="Connector connected successfully"
  description="Your data is now being synchronized"
  primaryAction={{
    label: 'View Dashboard',
    onClick: goToDashboard,
  }}
/>
```

### Related Components

- [Card](./molecules.md#card) - Empty state in card
- [Button](./atoms.md#button) - Action buttons
- [Icon](./atoms.md#icon) - Status icons

### Related Entities/Pages

- **Dashboard**: No insights state
- **Connectors**: No connectors state
- **Insights**: No data state
- **Settings**: Success/error states

---

## Notification/Toast

### Purpose

Alert messages that appear temporarily to inform users of success, error, warning, or info events. Supports multiple positions and auto-dismiss.

### Props/Inputs

```typescript
interface NotificationProps {
  // Content
  title?: string;
  message: string;

  // Type
  variant?: "success" | "error" | "warning" | "info";

  // Display
  position?:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";

  // Actions
  action?: {
    label: string;
    onClick: () => void;
  };

  // Behavior
  autoClose?: boolean;
  autoCloseDelay?: number; // milliseconds (default: 5000)
  closable?: boolean;
  onClose?: () => void;

  // Icon
  icon?: React.ReactNode;

  // Accessibility
  ariaLabel?: string;
}

// Usage via hook:
const { showNotification } = useNotifications();

showNotification({
  variant: "success",
  title: "Insight created",
  message: "Your insight has been created successfully",
  action: {
    label: "View",
    onClick: viewInsight,
  },
});
```

### Outputs/Events

| Event              | Signature    | Description                    |
| ------------------ | ------------ | ------------------------------ |
| **onClose**        | `() => void` | Fired when notification closed |
| **action.onClick** | `() => void` | Fired when action clicked      |

### Variants

| Variant     | Use Case          | Appearance           |
| ----------- | ----------------- | -------------------- |
| **success** | Successful action | Green checkmark icon |
| **error**   | Error occurred    | Red X icon           |
| **warning** | Warning message   | Yellow warning icon  |
| **info**    | Informational     | Blue info icon       |

### States

| State        | Appearance    | Behavior               |
| ------------ | ------------- | ---------------------- |
| **entering** | Slides in     | Animation plays        |
| **visible**  | Fully visible | Auto-dismiss countdown |
| **exiting**  | Slides out    | Animation plays        |

### Composition Rules

```tsx
// ✅ Allowed compositions
<Notification variant="success" message="Saved successfully" />
<Notification variant="error" title="Error" message="Something went wrong" />
<Notification variant="info" message="New insight available" action={action} />

// ❌ Invalid compositions
<Notification />  // Missing required message
<Notification message="Test"><div>Nested content</div></Notification>  // No children
```

### Accessibility Requirements

- **ARIA Live Regions**: Use `role="status"` or `role="alert"`
- **Auto-Dismiss**: Announce before dismissing
- **Focus Management**: Focus close button or action
- **Screen Reader**: Announce title, message, available actions

**ARIA Pattern:**

```tsx
<div
  role={variant === "error" ? "alert" : "status"}
  aria-live={variant === "error" ? "assertive" : "polite"}
  aria-atomic="true"
  className="notification"
>
  <Icon name={variantIcon} aria-hidden="true" />
  <div className="content">
    {title && <h3>{title}</h3>}
    <p>{message}</p>
  </div>
  <button aria-label="Close notification" onClick={onClose}>
    <Icon name="x" />
  </button>
</div>
```

### RTL/LTR Behavior

| Element           | LTR                         | RTL                          |
| ----------------- | --------------------------- | ---------------------------- |
| **Icon**          | Left side                   | Right side                   |
| **Content**       | Left of icon                | Right of icon                |
| **Close button**  | Right side                  | Left side                    |
| **Action button** | Below content, left-aligned | Below content, right-aligned |

### Multi-Language Support

**Translation Keys:**

- `common.notification.close`: Close
- `common.notification.undo`: Undo
- `common.notification.retry`: Retry
- `common.notification.view`: View
- `common.notification.success.title`: Success
- `common.notification.error.title`: Error
- `common.notification.warning.title`: Warning
- `common.notification.info.title`: Information

### Usage Examples

```tsx
// Success notification
showNotification({
  variant: "success",
  title: "Insight created",
  message: "Your marketing insight has been created successfully",
  autoClose: true,
  autoCloseDelay: 5000,
});

// Error notification
showNotification({
  variant: "error",
  title: "Connection failed",
  message: "Failed to connect to Meta. Please check your credentials.",
  action: {
    label: "Retry",
    onClick: retryConnection,
  },
});

// Warning notification
showNotification({
  variant: "warning",
  message: "Your session will expire in 5 minutes",
  action: {
    label: "Extend",
    onClick: extendSession,
  },
});

// Info notification
showNotification({
  variant: "info",
  message: "New features available",
  action: {
    label: "Learn more",
    onClick: openFeatures,
  },
});
```

### Related Components

- [Badge](./atoms.md#badge) - Status badges
- [Icon](./atoms.md#icon) - Notification icons
- [Button](./atoms.md#button) - Action buttons

### Related Entities/Pages

- **All Pages**: Success/error notifications
- **Connectors**: Connection status notifications
- **Insights**: Creation/update notifications
- **Settings**: Save confirmation notifications

---

## Document Status

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After Phase 2 completion
**Maintainer:** UI/UX Team

**Related Specifications:**

- [README.md](./README.md) - Component catalog overview
- [molecules.md](./molecules.md) - Composite components
- [templates.md](./templates.md) - Page layout templates
