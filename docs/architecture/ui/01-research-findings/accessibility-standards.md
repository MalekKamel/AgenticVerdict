# Accessibility Standards and Implementation Guide

**Purpose**: Comprehensive WCAG 2.1 AA compliance guide for AgenticVerdict multi-tenant SaaS analytics platform with focus on data visualization, RTL support, and screen reader optimization.

**Last Updated**: 2026-04-11

**Target Compliance**: WCAG 2.1 Level AA (minimum), with AAA aspirations for critical user paths

## Executive Summary

This guide provides actionable implementation patterns for making complex analytics dashboards accessible to all users, including those who rely on assistive technologies. It addresses the unique challenges of data visualization, multi-language support (Arabic RTL), and real-time data updates in a multi-tenant SaaS environment.

**Key Principles**:

- **Universal Design**: Build accessibility in from the start, not as an afterthought
- **Progressive Enhancement**: Ensure core functionality works without JavaScript
- **Tenant-Aware Accessibility**: Respect company-specific accessibility configurations
- **Continuous Testing**: Integrate accessibility into the development lifecycle

## 1. WCAG 2.1 AA Compliance Checklist

### 1.1 Perceivability

#### 1.1.1 Text Alternatives

- **Level A**: All non-text content has text alternatives
  - Charts: Provide data tables as alternatives
  - Icons: Use `aria-label` or hidden text with `.sr-only`
  - Images: Meaningful `alt` text (not decorative)
- **Level AA**: Images must have `alt` attribute (can be empty if decorative)

**Implementation**:

```tsx
// Chart with alternative data table
<div role="region" aria-label="Monthly traffic trends">
  <Chart data={trafficData} />
  <table className="sr-only" aria-label="Traffic data table">
    <thead>
      <tr>
        <th>Month</th>
        <th>Sessions</th>
        <th>Page Views</th>
      </tr>
    </thead>
    <tbody>
      {trafficData.map((row) => (
        <tr key={row.month}>
          <td>{row.month}</td>
          <td>{row.sessions.toLocaleString()}</td>
          <td>{row.pageViews.toLocaleString()}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

#### 1.1.2 Time-Based Media

- **Level A**: Provide alternatives for audio/video content
- **Level AA**: Provide captions for synchronized media

#### 1.1.3 Adaptable

- **Level A**: Create content that can be presented in different ways
  - Use semantic HTML (`<nav>`, `<main>`, `<article>`)
  - Proper heading hierarchy (h1 → h2 → h3)
  - Lists for grouped items

#### 1.1.4 Distinguishable

- **Level A**: Use color and text to convey information
  - Don't rely on color alone (use patterns, labels, icons)
  - Link text must be descriptive (no "click here")
- **Level AA**: Contrast ratio of at least 4.5:1 for normal text, 3:1 for large text
- **Level AA**: Text can be resized up to 200% without breaking layout

**Implementation**:

```tsx
// Bad: Color-only status indicator
<span className="text-red-500">Error</span>

// Good: Color + icon + text
<span className="flex items-center gap-2">
  <span aria-hidden="true" className="text-red-500">●</span>
  <Icon name="error" className="text-red-500" />
  <span>Connection failed</span>
</span>

// Bad link
<a href="/analytics">Click here</a> for analytics

// Good link
<a href="/analytics">View analytics dashboard</a>
```

### 1.2 Operability

#### 1.2.1 Keyboard Accessible

- **Level A**: All functionality available via keyboard
  - No keyboard traps
  - Visible focus indicators
  - Logical tab order
- **Level AA**: No keyboard focus requirement (users can remap shortcuts)
- **Level A**: Provide skip links for navigation

**Implementation**:

```tsx
// Skip link (must be first focusable element)
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:p-4"
>
  Skip to main content
</a>;

// Custom focus indicator (Mantine v9)
import { MantineProvider } from "@mantine/core";

<MantineProvider
  theme={{
    focusRing: "always",
    focusRingStyles: {
      inputStyles: (theme) => ({
        border: "2px solid",
        borderColor: theme.colors.blue[6],
        outline: "none",
      }),
    },
  }}
>
  <App />
</MantineProvider>;
```

#### 1.2.2 Enough Time

- **Level A**: Provide enough time to read and interact
  - No time limits (or ability to extend)
  - Moving/scrolling content can be paused
- **Level AA**: Auto-advancing content can be stopped/hidden

#### 1.2.3 Seizures and Physical Reactions

- **Level A**: No content that flashes more than 3 times per second
- **Level AAA**: No flashing content at all

#### 1.2.4 Navigable

- **Level A**: Help users navigate and find content
  - Skip links (mentioned above)
  - Page titles descriptive and unique
  - Tab order logical
- **Level AA**: Focus visible (always show focus indicator)
- **Level AA**: Link purpose clear from context

#### 1.2.5 Input Modalities

- **Level A**: Provide functionality beyond keyboard
  - Don't require specific gestures without alternatives
  - Touch targets at least 44×44 CSS pixels
- **Level AA**: No dragging required (unless essential)

### 1.3 Understandability

#### 1.3.1 Readable

- **Level A**: Make text content readable
  - Language of page declared (`<html lang="en">`)
  - Changes in language marked (`<span lang="ar">`)
- **Level AA**: Line height 1.5, paragraph spacing 2×, letter spacing 0.12×
- **Level AA**: Text can be resized without assistive technology

#### 1.3.2 Predictable

- **Level A**: Make pages appear and operate in predictable ways
  - Consistent navigation
  - Identifiable elements (consistent styling)
  - Context changes on user request only
- **Level AA**: Focus doesn't change without user interaction

#### 1.3.3 Input Assistance

- **Level A**: Help users avoid and correct mistakes
  - Error identification (clearly labeled)
  - Labels and instructions
  - Error suggestions (when possible)
- **Level AA**: Error prevention (legal/financial commitments)
- **Level AA**: Confirmation before submission (reversible actions)

**Implementation**:

```tsx
// Form with accessible error handling
<form onSubmit={handleSubmit}>
  <FormField
    id="email"
    label="Email address"
    required
    error={errors.email}
    aria-invalid={errors.email ? "true" : "false"}
    aria-describedby={errors.email ? "email-error" : undefined}
  >
    <input
      type="email"
      id="email"
      name="email"
      aria-invalid={errors.email ? "true" : "false"}
      aria-describedby={errors.email ? "email-error" : "email-hint"}
    />
    <span id="email-hint" className="text-sm text-gray-600">
      We'll send your report to this address
    </span>
  </FormField>

  {errors.email && (
    <div id="email-error" role="alert" className="text-red-600 mt-2">
      <Icon name="error" aria-hidden="true" />
      {errors.email}
    </div>
  )}
</form>
```

### 1.4 Robustness

#### 1.4.1 Compatible

- **Level A**: Maximize compatibility with current/future user agents
  - Valid HTML
  - Proper ARIA roles
  - Name/role/value for all components
- **Level AA**: No major accessibility failures in assistive technology

## 2. Screen Reader Optimization

### 2.1 ARIA Labels and Live Regions

**ARIA Label Patterns**:

```tsx
// Icon buttons need labels
<button aria-label="Refresh data" onClick={handleRefresh}>
  <Icon name="refresh" />
</button>

// Complex controls need descriptions
<div
  role="region"
  aria-label="Analytics dashboard"
  aria-describedby="dashboard-help"
>
  <DashboardContent />
  <span id="dashboard-help" className="sr-only">
    Overview of marketing performance across all platforms
  </span>
</div>

// Live regions for dynamic updates
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {loadingStatus}
</div>
```

**Live Region Guidelines**:

- **`aria-live="off"`** (default): No announcement
- **`aria-live="polite"`**: Wait until user is idle, then announce
- **`aria-live="assertive"`**: Interrupt immediately (use sparingly)
- **`aria-atomic="true"`**: Announce entire region, not just changed part

### 2.2 Data Table Accessibility

**Complex Table Pattern**:

```tsx
<table
  className="min-w-full"
  aria-label="Platform performance metrics"
  summary="Comparative analysis of marketing platforms showing impressions, clicks, and conversions"
>
  <caption className="sr-only">
    Platform performance from {formatDate(startDate)} to {formatDate(endDate)}
  </caption>
  <thead>
    <tr>
      <th scope="col" id="platform">
        Platform
      </th>
      <th scope="col" id="impressions">
        Impressions
      </th>
      <th scope="col" id="clicks">
        Clicks
      </th>
      <th scope="col" id="ctr">
        CTR
      </th>
      <th scope="col" id="conversions">
        Conversions
      </th>
    </tr>
  </thead>
  <tbody>
    {platforms.map((platform) => (
      <tr key={platform.id}>
        <th scope="row" id={`platform-${platform.id}`}>
          {platform.name}
        </th>
        <td headers="platform platform-${platform.id} impressions">
          {platform.impressions.toLocaleString()}
        </td>
        <td headers="platform platform-${platform.id} clicks">
          {platform.clicks.toLocaleString()}
        </td>
        <td headers="platform platform-${platform.id} ctr">{platform.ctr}%</td>
        <td headers="platform platform-${platform.id} conversions">
          {platform.conversions.toLocaleString()}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**Sorting Pattern**:

```tsx
<th scope="col">
  <button
    onClick={() => onSort("impressions")}
    aria-label="Sort by impressions"
    aria-pressed={sortColumn === "impressions"}
    aria-sort={
      sortColumn === "impressions" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"
    }
  >
    Impressions
    {sortColumn === "impressions" && (
      <span aria-hidden="true">{sortDirection === "asc" ? "↑" : "↓"}</span>
    )}
  </button>
</th>
```

### 2.3 Chart and Graph Accessibility

**Multi-Modal Approach**:

1. **Data Table Alternative**: Always provide table version
2. **Text Summary**: Description of trends/insights
3. **Sonification**: Audio representation of data (optional AAA)
4. **Tactile Graphics**: SVG with high contrast for Braille displays

**Implementation**:

```tsx
<figure role="group" aria-labelledby="chart-title chart-desc">
  <h2 id="chart-title">Monthly Traffic Trends</h2>

  {/* Visual chart */}
  <LineChart
    data={trafficData}
    aria-describedby="chart-desc"
    aria-label="Line chart showing traffic trends over time"
  />

  {/* Text description */}
  <p id="chart-desc" className="mt-4">
    Traffic increased 23% from January to June, peaking in May with
    {peakTraffic.toLocaleString()} sessions. Mobile traffic accounts for 67% of total visits.
  </p>

  {/* Data table alternative */}
  <div className="mt-6">
    <details>
      <summary>View data table</summary>
      <TrafficTable data={trafficData} />
    </details>
  </div>
</figure>
```

### 2.4 Dynamic Content Updates

**Real-Time Data Pattern**:

```tsx
// Announce data refreshes
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {lastUpdate && `Data refreshed ${formatRelativeTime(lastUpdate)}`}
</div>

// Announce filter changes
<div
  role="status"
  aria-live="polite"
  className="sr-only"
>
  Showing {filteredCount} of {totalCount} records
</div>

// Announce errors in real-time
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
  className="sr-only"
>
  {connectionError && 'Connection lost. Retrying...'}
</div>
```

### 2.5 Screen Reader Testing

**Testing Matrix**:

| Screen Reader | Browser | OS      | Priority |
| ------------- | ------- | ------- | -------- |
| NVDA (Free)   | Firefox | Windows | High     |
| JAWS (Paid)   | Chrome  | Windows | High     |
| VoiceOver     | Safari  | macOS   | High     |
| TalkBack      | Chrome  | Android | Medium   |
| VoiceOver     | Safari  | iOS     | Medium   |

**Testing Checklist**:

1. Navigate entire interface using only keyboard
2. Announce all interactive elements (buttons, links, form fields)
3. Verify data tables are navigable (headers announced)
4. Confirm charts have text alternatives
5. Test dynamic updates (live regions announce changes)
6. Validate focus order is logical
7. Check RTL language switching (Arabic)

## 3. Keyboard Navigation Patterns

### 3.1 Focus Order in Complex Dashboards

**Visual Dashboard Layout**:

```
┌─────────────────────────────────────────────┐
│ [Skip to main]                              │
├─────────────────────────────────────────────┤
│ Header: Logo | Search | Notifications | User │
├─────────────────────────────────────────────┤
│ Nav: Dashboard | Analytics | Reports |      │
├──────────┬──────────────────────────────────┤
│ Filters  │ Charts Area                      │
│ Platform │ [Chart 1]                        │
│ Date     │ [Chart 2]                        │
│          │ Data Table                       │
├──────────┴──────────────────────────────────┤
│ Footer: Help | Settings | Status            │
└─────────────────────────────────────────────┘
```

**Focus Order Strategy**:

1. **Skip Link** → Main Content
2. **Global Header** → Logo (home link), Search, Notifications, User menu
3. **Main Navigation** → Dashboard, Analytics, Reports
4. **Filters** → Platform selector, Date range picker, Apply button
5. **Charts** → Chart 1 (with expand/collapse), Chart 2
6. **Data Table** → Sortable headers, then data rows
7. **Footer** → Help, Settings, Status

**Implementation**:

```tsx
// Main landmark structure
<div id="main-content" tabIndex={-1}>
  <nav aria-label="Platform filters">
    <FilterPanel />
  </nav>

  <main aria-labelledby="dashboard-title">
    <h1 id="dashboard-title" className="sr-only">
      Analytics Dashboard
    </h1>
    <section aria-labelledby="charts-heading">
      <h2 id="charts-heading" className="sr-only">
        Performance Charts
      </h2>
      <ChartGrid>
        <Chart title="Traffic Overview" />
        <Chart title="Conversion Funnel" />
      </ChartGrid>
    </section>

    <section aria-labelledby="table-heading">
      <h2 id="table-heading" className="sr-only">
        Detailed Data
      </h2>
      <DataTable />
    </section>
  </main>
</div>
```

### 3.2 Skip Links and Landmarks

**Skip Navigation**:

```tsx
// Multiple skip links for complex layouts
<SkipLinks>
  <SkipLink target="main-content">Skip to main content</SkipLink>
  <SkipLink target="filters">Skip to filters</SkipLink>
  <SkipLink target="data-table">Skip to data table</SkipLink>
</SkipLinks>;

// CSS for skip links
export const skipLinkStyles = `
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 100;
  }

  .skip-link:focus {
    top: 0;
  }
`;
```

**Landmark Structure**:

```tsx
<body>
  <a href="#main-content" className="skip-link">
    Skip to main content
  </a>

  <header>
    <nav aria-label="Main navigation">{/* Primary nav */}</nav>
  </header>

  <main id="main-content">
    <nav aria-label="Page navigation">{/* Secondary nav */}</nav>

    <section aria-labelledby="page-title">
      <h1 id="page-title">Page heading</h1>
      {/* Main content */}
    </section>
  </main>

  <aside aria-label="Helpful resources">{/* Sidebar content */}</aside>

  <footer>
    <nav aria-label="Footer navigation">{/* Footer links */}</nav>
  </footer>
</body>
```

### 3.3 Modal and Dialog Navigation

**Modal Pattern**:

```tsx
<Dialog
  open={isOpen}
  onClose={handleClose}
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>
  <DialogTrigger>
    <button>Open Settings</button>
  </DialogTrigger>

  <DialogContent>
    <DialogTitle id="dialog-title">Dashboard Settings</DialogTitle>
    <DialogDescription id="dialog-description">
      Customize your analytics view and data refresh preferences.
    </DialogDescription>

    <form onSubmit={handleSubmit}>
      <label htmlFor="refresh-interval">Refresh Interval</label>
      <select id="refresh-interval" name="refreshInterval" defaultValue={config.refreshInterval}>
        <option value="30">30 seconds</option>
        <option value="60">1 minute</option>
        <option value="300">5 minutes</option>
      </select>

      <div className="flex gap-2 mt-4">
        <button type="submit">Save Changes</button>
        <button type="button" onClick={handleClose}>
          Cancel
        </button>
      </div>
    </form>
  </DialogContent>
</Dialog>
```

**Focus Management**:

```tsx
// Custom modal with focus trap (if Mantine v9 Dialog insufficient)
useEffect(() => {
  if (isOpen) {
    // Save current focus
    const previouslyFocused = document.activeElement;

    // Focus first focusable element in modal
    const firstFocusable = modalRef.current?.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    firstFocusable?.focus();

    // Trap focus within modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const firstElement = focusableElements?.[0];
        const lastElement = focusableElements?.[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus on close
      (previouslyFocused as HTMLElement)?.focus();
    };
  }
}, [isOpen, onClose]);
```

### 3.4 Data Grid Navigation

**Grid Interaction Pattern**:

```tsx
<div
  role="grid"
  aria-label="Analytics data grid"
  aria-rowcount={data.length + 1} // +1 for header
  aria-colcount={columns.length}
>
  <div role="rowgroup" aria-label="Header">
    <div role="row" aria-rowindex={1}>
      {columns.map((col, i) => (
        <div key={col.id} role="columnheader" aria-colindex={i + 1} aria-sort={col.sortDirection}>
          <button onClick={() => onSort(col.id)} aria-label={`Sort by ${col.label}`}>
            {col.label}
          </button>
        </div>
      ))}
    </div>
  </div>

  <div role="rowgroup" aria-label="Data">
    {data.map((row, rowIndex) => (
      <div
        key={row.id}
        role="row"
        aria-rowindex={rowIndex + 2} // +2 for header offset
        aria-selected={selectedRowId === row.id}
        tabIndex={selectedRowId === row.id ? 0 : -1}
        onClick={() => onSelectRow(row.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectRow(row.id);
          }
        }}
      >
        {columns.map((col, colIndex) => (
          <div key={col.id} role="gridcell" aria-colindex={colIndex + 1}>
            {row[col.id]}
          </div>
        ))}
      </div>
    ))}
  </div>
</div>
```

### 3.5 Keyboard Shortcuts

**Global Shortcuts**:

```tsx
// Keyboard shortcut handler
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Check for modifier keys
    const isModifierKey = e.metaKey || e.ctrlKey;

    // Skip if user is in form input
    const isInputElement = ["INPUT", "TEXTAREA", "SELECT"].includes(
      (e.target as HTMLElement).tagName,
    );

    if (isInputElement && !isModifierKey) return;

    // Global shortcuts
    switch (e.key) {
      case "/":
        if (!isModifierKey) {
          e.preventDefault();
          focusSearch();
        }
        break;
      case "K":
        if (isModifierKey) {
          e.preventDefault();
          focusSearch();
        }
        break;
      case "?":
        if (e.shiftKey && !isModifierKey) {
          e.preventDefault();
          openKeyboardShortcuts();
        }
        break;
    }
  };

  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, []);
```

**Keyboard Shortcuts Modal**:

```tsx
<KeyboardShortcutsDialog>
  <h2>Keyboard Shortcuts</h2>
  <table>
    <tbody>
      <tr>
        <td>
          <kbd>?</kbd>
        </td>
        <td>Show this dialog</td>
      </tr>
      <tr>
        <td>
          <kbd>/</kbd> or <kbd>⌘</kbd> + <kbd>K</kbd>
        </td>
        <td>Focus search</td>
      </tr>
      <tr>
        <td>
          <kbd>Esc</kbd>
        </td>
        <td>Close modal / Clear filters</td>
      </tr>
      <tr>
        <td>
          <kbd>Tab</kbd> / <kbd>Shift</kbd> + <kbd>Tab</kbd>
        </td>
        <td>Navigate forward / backward</td>
      </tr>
      <tr>
        <td>
          <kbd>Enter</kbd> / <kbd>Space</kbd>
        </td>
        <td>Activate button / Select row</td>
      </tr>
    </tbody>
  </table>
</KeyboardShortcutsDialog>
```

## 4. Color Contrast and Semantic HTML

### 4.1 Color Contrast Requirements

**WCAG 2.1 AA Standards**:

- **Normal text** (< 18pt / 24px): 4.5:1 minimum
- **Large text** (≥ 18pt or 14pt bold): 3:1 minimum
- **UI components** (borders, focus indicators): 3:1 minimum
- **Graphical objects**: 3:1 minimum

**Mantine v9 Theme Configuration**:

```tsx
// Configure accessible color palette
import { MantineProvider } from "@mantine/core";

const accessibleColors = {
  // Primary: Blue with 4.5:1 contrast on white
  blue: {
    50: "#e6f7ff",
    100: "#bae7ff",
    200: "#91d5ff",
    300: "#69c0ff",
    400: "#40a9ff",
    500: "#1890ff", // 4.5:1 on white
    600: "#096dd9",
    700: "#0050b3",
    800: "#003a8c",
    900: "#002766",
  },

  // Success: Green with 4.5:1 contrast
  green: {
    50: "#f6ffed",
    100: "#d9f7be",
    200: "#b7eb8f",
    300: "#95de64",
    400: "#73d13d",
    500: "#52c41a", // 4.5:1 on white
    600: "#389e0d",
    700: "#237804",
    800: "#135200",
    900: "#092b00",
  },

  // Error: Red with 4.5:1 contrast
  red: {
    50: "#fff1f0",
    100: "#ffccc7",
    200: "#ffa39e",
    300: "#ff7875",
    400: "#ff4d4f",
    500: "#f5222d", // 4.5:1 on white
    600: "#cf1322",
    700: "#a8071a",
    800: "#820014",
    900: "#5c0011",
  },
};

<MantineProvider
  theme={{
    colors: accessibleColors,
    primaryColor: "blue",
    defaultRadius: "sm",
    focusRing: "always",
  }}
>
  <App />
</MantineProvider>;
```

### 4.2 Color Independence

**Don't Rely on Color Alone**:

```tsx
// Bad: Color only
<div className={status === 'error' ? 'text-red-500' : 'text-green-500'}>
  {status}
</div>

// Good: Color + icon + text
<div className="flex items-center gap-2">
  {status === 'error' ? (
    <>
      <Icon name="error" aria-hidden="true" />
      <span className="text-red-500">Error</span>
    </>
  ) : (
    <>
      <Icon name="check" aria-hidden="true" />
      <span className="text-green-500">Success</span>
    </>
  )}
</div>

// Chart with multiple indicators
<ChartLegend>
  <LegendItem color="#1890ff" pattern="solid">Organic traffic</LegendItem>
  <LegendItem color="#52c41a" pattern="striped">Direct traffic</LegendItem>
  <LegendItem color="#f5222d" pattern="dotted">Paid traffic</LegendItem>
</ChartLegend>
```

### 4.3 Semantic HTML Structure

**Document Outline**:

```tsx
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charSet="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Analytics Dashboard - AgenticVerdict</title>
</head>
<body>
  <header>
    <nav aria-label="Main">
      {/* Primary navigation */}
    </nav>
  </header>

  <main>
    <nav aria-label="Breadcrumb">
      <ol>
        <li><a href="/">Home</a></li>
        <li><a href="/analytics">Analytics</a></li>
        <li aria-current="page">Dashboard</li>
      </ol>
    </nav>

    <h1>Analytics Dashboard</h1>

    <section aria-labelledby="overview-heading">
      <h2 id="overview-heading">Overview</h2>
      {/* Content */}
    </section>

    <section aria-labelledby="detailed-metrics-heading">
      <h2 id="detailed-metrics-heading">Detailed Metrics</h2>
      {/* Content */}
    </section>
  </main>

  <aside aria-label="Help">
    {/* Sidebar */}
  </aside>

  <footer>
    <nav aria-label="Footer">
      {/* Footer navigation */}
    </nav>
  </footer>
</body>
</html>
```

**Heading Hierarchy Rules**:

- One `<h1>` per page (page title)
- No skipping levels (h1 → h2 → h3)
- Headings describe content sections
- Use aria-labelledby for complex regions

### 4.4 Form Labeling Strategies

**Label Association**:

```tsx
// Explicit label (preferred)
<label htmlFor="email-input">Email address</label>
<input
  type="email"
  id="email-input"
  name="email"
  required
  aria-required="true"
/>

// Wrapping label
<label>
  Email address
  <input type="email" name="email" />
</label>

// aria-label (use sparingly)
<input
  type="search"
  aria-label="Search analytics"
  placeholder="Search..."
/>

// aria-labelledby (complex situations)
<input
  type="text"
  id="username"
  aria-labelledby="username-label username-hint"
/>
<span id="username-label">Username</span>
<span id="username-hint" className="text-sm">
  Must be at least 8 characters
</span>
```

**Required Field Indicators**:

```tsx
// Don't rely on color alone
<FormField label="Email address" required aria-required="true">
  <input type="email" required aria-required="true" />
  <span className="text-sm text-gray-600">
    <span aria-hidden="true" className="text-red-500">
      *
    </span>
    <span className="sr-only">(required)</span>
  </span>
</FormField>
```

### 4.5 Link and Button Distinctions

**Interactive Element Guidelines**:

```tsx
// Buttons for actions
<button onClick={handleSubmit}>Submit Report</button>
<button onClick={handleCancel}>Cancel</button>

// Links for navigation
<a href="/analytics">View Analytics</a>
<a href="/reports/123" download>Download PDF</a>

// Don't use divs as interactive elements
<button onClick={handleAction}>
  {/* Correct */}
</button>

<div
  role="button"
  tabIndex={0}
  onClick={handleAction}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleAction();
    }
  }}
>
  {/* Last resort - prefer button element */}
</div>
```

## 5. Accessibility Testing

### 5.1 Automated Testing Tools

**Axe-core with Jest/Playwright**:

```typescript
// vitest-setup.ts
import { injectAxe, checkA11y } from "axe-playwright";

beforeEach(async () => {
  await injectAxe(page);
});

test("homepage is accessible", async ({ page }) => {
  await page.goto("/");
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
});

// Test specific element
test("chart is accessible", async ({ page }) => {
  await page.goto("/analytics");
  const chart = page.locator('[data-testid="traffic-chart"]');
  await checkA11y(page, null, {
    includedImpacts: ["critical", "serious"],
  });
});
```

**ESLint Configuration**:

```json
// .eslintrc.json
{
  "extends": ["plugin:jsx-a11y/recommended", "plugin:jsx-a11y/strict"],
  "rules": {
    "jsx-a11y/anchor-is-valid": "error",
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-proptypes": "error",
    "jsx-a11y/aria-unsupported-elements": "error",
    "jsx-a11y/role-has-required-aria-props": "error",
    "jsx-a11y/role-supports-aria-props": "error",
    "jsx-a11y/no-access-key": "error",
    "jsx-a11y/no-autofocus": "warn",
    "jsx-a11y/click-events-have-key-events": "error"
  }
}
```

**CI Integration**:

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

on:
  pull_request:
    paths:
      - "apps/web/**"
      - "packages/ui/**"

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Run accessibility tests
        run: pnpm test:a11y

      - name: Upload accessibility report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: accessibility-report
          path: test-results/a11y/
```

### 5.2 Manual Testing Checklist

**Pre-Release Checklist**:

#### Keyboard Navigation

- [ ] Can navigate entire interface using Tab key
- [ ] Focus indicator is always visible
- [ ] Tab order is logical (left-to-right, top-to-bottom)
- [ ] Can activate all interactive elements with Enter/Space
- [ ] Escape key closes modals and clears filters
- [ ] No keyboard traps (can always move focus away)

#### Screen Reader (NVDA/JAWS)

- [ ] Page title announced correctly
- [ ] Navigation landmarks available
- [ ] Headings hierarchy announced
- [ ] Form fields have associated labels
- [ ] Errors announced when they occur
- [ ] Data tables headers announced
- [ ] Charts have text alternatives

#### Visual Accessibility

- [ ] Color contrast meets 4.5:1 for text
- [ ] Not relying on color alone
- [ ] Text resizable to 200% without horizontal scroll
- [ ] Link text is descriptive (no "click here")
- [ ] Focus indicators are visible
- [ ] No flashing content (> 3Hz)

#### Forms

- [ ] All fields have labels
- [ ] Required fields marked with asterisk + "(required)"
- [ ] Error messages clear and specific
- [ ] Validation happens after form submission (or with clear feedback)
- [ ] Success confirmation provided

### 5.3 User Testing with Assistive Technology

**Recruitment Criteria**:

- Screen reader users (NVDA, JAWS, VoiceOver)
- Keyboard-only users
- Users with low vision (zoom text, high contrast)
- Users with color blindness
- Arabic-speaking users (RTL testing)

**Testing Scenarios**:

1. **Dashboard Navigation**: Navigate to analytics dashboard and filter by platform
2. **Data Analysis**: Compare metrics across platforms using data table
3. **Report Generation**: Create and download custom report
4. **Settings Update**: Change dashboard preferences and save
5. **Language Switch**: Switch between English and Arabic

**Feedback Collection**:

- Task completion rate
- Time to complete
- Subjective difficulty (1-5 scale)
- Verbal feedback during testing
- Specific barriers encountered

### 5.4 Continuous Integration for A11y

**Pre-commit Hook**:

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "tsc --noEmit"]
  }
}
```

**Playwright Accessibility Suite**:

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from "@playwright/test";
import { injectAxe, checkA11y } from "axe-playwright";

test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await injectAxe(page);
  });

  test("homepage is accessible", async ({ page }) => {
    await page.goto("/");
    await checkA11y(page);
  });

  test("dashboard is accessible", async ({ page }) => {
    await page.goto("/dashboard");
    await checkA11y(page);
  });

  test("analytics page is accessible", async ({ page }) => {
    await page.goto("/analytics");
    await checkA11y(page);
  });

  test("reports page is accessible", async ({ page }) => {
    await page.goto("/reports");
    await checkA11y(page);
  });

  test("settings page is accessible", async ({ page }) => {
    await page.goto("/settings");
    await checkA11y(page);
  });
});
```

## 6. RTL-Specific Accessibility

### 6.1 Bidirectional Layout Considerations

**HTML Structure**:

```tsx
// Language switching
<html lang={language} dir={direction}>
  {/* direction: 'ltr' | 'rtl' */}
</html>;

// React implementation
const I18nProvider = ({ children, locale }) => {
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={direction}>
      {children}
    </html>
  );
};
```

**CSS Logical Properties** (Mantine v9 support):

```tsx
// Use logical properties instead of physical ones
const styles = {
  // Bad: physical properties
  marginLeft: "1rem",
  marginRight: "1rem",
  paddingLeft: "1rem",
  paddingRight: "1rem",

  // Good: logical properties (auto-flip for RTL)
  marginInlineStart: "1rem",
  marginInlineEnd: "1rem",
  paddingInlineStart: "1rem",
  paddingInlineEnd: "1rem",

  // Text alignment
  textAlign: "start", // aligns left for LTR, right for RTL
  textAlign: "end", // aligns right for LTR, left for RTL
};
```

### 6.2 Screen Reader Behavior with RTL

**Arabic-Specific Considerations**:

```tsx
// Declare language correctly
<span lang="ar" dir="rtl">
  المحتوى باللغة العربية
</span>

// Mixed content (numbers in Arabic text)
<p lang="ar" dir="rtl">
  تم عرض <span lang="en" dir="ltr">1,234</span> زيارة هذا الشهر
</p>

// Screen reader announcements
<button
  aria-label={locale === 'ar' ? 'تحديث البيانات' : 'Refresh data'}
  onClick={handleRefresh}
>
  <Icon name="refresh" />
</button>
```

**Testing with Arabic Screen Readers**:

- **Windows**: NVDA with Arabic language pack
- **macOS**: VoiceOver with Arabic voice
- **iOS**: VoiceOver with Arabic voice
- **Android**: TalkBack with Arabic locale

### 6.3 Focus Management in Bidirectional Layouts

**Focus Order Considerations**:

```tsx
// RTL focus order
const RTLFocusOrder = () => {
  useEffect(() => {
    if (direction === "rtl") {
      // Ensure focus moves right-to-left
      const focusableElements = document.querySelectorAll('[tabindex]:not([tabindex="-1"])');

      // Reverse order for manual control (usually automatic)
      // but verify with screen reader testing
    }
  }, [direction]);
};
```

**Arrow Key Navigation**:

```tsx
// Grid navigation respects direction
const handleArrowKey = (e: KeyboardEvent) => {
  const isRTL = document.dir === "rtl";

  switch (e.key) {
    case "ArrowRight":
      // Move to next in reading direction
      e.preventDefault();
      focusNext(isRTL ? -1 : 1); // -1 for RTL, +1 for LTR
      break;
    case "ArrowLeft":
      // Move to previous in reading direction
      e.preventDefault();
      focusNext(isRTL ? 1 : -1);
      break;
  }
};
```

### 6.4 Language Switching Accessibility

**Seamless Transition**:

```tsx
// Language switcher with proper aria announcements
<LanguageSwitcher
  currentLocale={locale}
  onLocaleChange={(newLocale) => {
    // Announce language change to screen readers
    announceToScreenReader(
      newLocale === "ar" ? "تم تغيير اللغة إلى العربية" : "Language changed to English",
    );

    // Update document attributes
    document.documentElement.lang = newLocale;
    document.documentElement.dir = newLocale === "ar" ? "rtl" : "ltr";
  }}
/>
```

**URL-Based Language**:

```tsx
// Maintain language in URL for proper page reloads
const LanguageAwareLink = ({ href, locale, ...props }) => {
  const localizedHref = `/${locale}${href}`;

  return <a href={localizedHref} hrefLang={locale} lang={locale} {...props} />;
};

// Usage
<LanguageAwareLink href="/analytics" locale="ar">
  التحليلات
</LanguageAwareLink>;
```

### 6.5 Arabic Content Testing

**RTL Testing Checklist**:

- [ ] Layout mirrors correctly (left becomes right)
- [ ] Text aligns to right side
- [ ] Numbers display correctly (LTR in Arabic text)
- [ ] Icons and arrows flip direction
- [ ] Focus order is right-to-left
- [ ] Screen reader announces Arabic content correctly
- [ ] Mixed LTR/RTL content displays properly
- [ ] Forms accept Arabic input
- [ ] Date formats localize correctly
- [ ] Currency symbols appear in correct position

## 7. Component-Specific Patterns

### 7.1 Date Range Picker

```tsx
<div role="group" aria-labelledby="date-range-label">
  <label id="date-range-label" htmlFor="date-range-input">
    Date range
  </label>

  <input
    type="text"
    id="date-range-input"
    value={formatDateRange(startDate, endDate)}
    aria-describedby="date-range-hint"
    readOnly
    onClick={() => setOpen(true)}
  />

  <span id="date-range-hint" className="sr-only">
    Press Enter to open calendar
  </span>

  {isOpen && (
    <DatePicker
      startDate={startDate}
      endDate={endDate}
      onSelect={handleSelect}
      aria-label="Select date range"
      minDate={minDate}
      maxDate={maxDate}
    />
  )}

  <p className="text-sm text-gray-600">
    {formatDateRange(startDate, endDate)}
    <span className="sr-only"> (selected date range)</span>
  </p>
</div>
```

### 7.2 Multi-Select Filter

```tsx
<div role="group" aria-labelledby="platform-filter-label">
  <label id="platform-filter-label" htmlFor="platform-select">
    Platform
  </label>

  <button
    id="platform-select"
    aria-haspopup="listbox"
    aria-expanded={isOpen}
    aria-labelledby="platform-filter-label platform-select"
    onClick={() => setIsOpen(!isOpen)}
  >
    {selectedPlatforms.length > 0
      ? `${selectedPlatforms.length} platforms selected`
      : "Select platforms"}
  </button>

  {isOpen && (
    <ul role="listbox" aria-labelledby="platform-filter-label">
      {platforms.map((platform) => (
        <li
          key={platform.id}
          role="option"
          aria-selected={selectedPlatforms.includes(platform.id)}
          onClick={() => togglePlatform(platform.id)}
        >
          <Checkbox
            checked={selectedPlatforms.includes(platform.id)}
            aria-label={platform.name}
            readOnly
          />
          <span>{platform.name}</span>
        </li>
      ))}
    </ul>
  )}

  <div role="status" aria-live="polite" className="sr-only">
    {selectedPlatforms.length > 0 && `${selectedPlatforms.length} platforms selected`}
  </div>
</div>
```

### 7.3 Data Visualization Toggle

```tsx
<div role="group" aria-labelledby="view-toggle-label">
  <span id="view-toggle-label">View as</span>

  <ButtonGroup>
    <ToggleButton
      pressed={view === "chart"}
      onPressedChange={() => setView("chart")}
      aria-label="Chart view"
      aria-pressed={view === "chart"}
    >
      <Icon name="chart" aria-hidden="true" />
      <span className="sr-only">Chart</span>
    </ToggleButton>

    <ToggleButton
      pressed={view === "table"}
      onPressedChange={() => setView("table")}
      aria-label="Table view"
      aria-pressed={view === "table"}
    >
      <Icon name="table" aria-hidden="true" />
      <span className="sr-only">Table</span>
    </ToggleButton>
  </ButtonGroup>
</div>
```

## 8. Tool Recommendations

### 8.1 Development Tools

| Tool                       | Type              | Purpose                       | Cost |
| -------------------------- | ----------------- | ----------------------------- | ---- |
| **axe DevTools**           | Browser extension | Fast accessibility auditing   | Free |
| **WAVE**                   | Browser extension | Visual accessibility feedback | Free |
| **Lighthouse**             | Browser CI        | Performance + a11y scoring    | Free |
| **playwright-axe**         | E2E testing       | Automated a11y tests          | Free |
| **eslint-plugin-jsx-a11y** | Linting           | Catch a11y issues in code     | Free |
| **Mantine v9**             | UI library        | Accessible component base     | Free |

### 8.2 Testing Tools

| Tool                        | Type            | Platform  | Cost                   |
| --------------------------- | --------------- | --------- | ---------------------- |
| **NVDA**                    | Screen reader   | Windows   | Free                   |
| **JAWS**                    | Screen reader   | Windows   | Paid (trial available) |
| **VoiceOver**               | Screen reader   | macOS/iOS | Built-in               |
| **TalkBack**                | Screen reader   | Android   | Built-in               |
| **Color Contrast Analyzer** | Color tool      | Desktop   | Free                   |
| **W3C Validator**           | HTML validation | Web       | Free                   |

### 8.3 User Testing Resources

- **Fable**: Platform for testing with users with disabilities
- **Knowbility**: Accessibility consulting and testing
- **The Paciello Group**: Accessibility expertise and tools
- **WebAIM**: Resources and training

## 9. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

- [ ] Configure Mantine v9 theme with accessible colors
- [ ] Set up ESLint with jsx-a11y rules
- [ ] Implement skip links and landmark structure
- [ ] Add aria-live regions for dynamic content
- [ ] Create reusable accessible form components

### Phase 2: Component Accessibility (Week 3-4)

- [ ] Audit all UI components for accessibility
- [ ] Add proper ARIA labels to all interactive elements
- [ ] Implement keyboard navigation for all custom components
- [ ] Add text alternatives to all images and charts
- [ ] Create accessible data table patterns

### Phase 3: Testing Integration (Week 5-6)

- [ ] Set up automated a11y tests with Playwright + axe
- [ ] Configure CI/CD accessibility checks
- [ ] Create manual testing checklist
- [ ] Conduct screen reader testing (NVDA, VoiceOver)
- [ ] Perform keyboard-only navigation audit

### Phase 4: RTL Implementation (Week 7-8)

- [ ] Implement bidirectional layout support
- [ ] Add Arabic language translations
- [ ] Test with Arabic screen readers
- [ ] Verify focus order in RTL
- [ ] Validate mixed LTR/RTL content

### Phase 5: User Testing & Validation (Week 9-10)

- [ ] Recruit users with disabilities
- [ ] Conduct usability testing sessions
- [ ] Gather feedback and iterate
- [ ] Fix critical issues
- [ ] Document known limitations

## 10. Continuous Improvement

### Monitoring

- Track accessibility issues in bug tracker
- Monitor a11y test results in CI/CD
- Collect user feedback on accessibility
- Review accessibility metrics in analytics

### Training

- Accessibility training for all developers
- Regular accessibility code reviews
- Accessibility guidelines in onboarding
- Accessibility considerations in design reviews

### Maintenance

- Keep a11y tools updated
- Review new WCAG guidelines (2.2 in development)
- Regular accessibility audits
- Continuous user testing with assistive technology

---

**Document Status**: Draft v1.0

**Next Steps**:

1. Review with engineering team
2. Validate with accessibility consultant
3. Create implementation tickets
4. Begin Phase 1 foundation work

**Related Documents**:

- [`ui-libraries.md`](./ui-libraries.md) - Mantine v9 accessibility features
- [`/docs/architecture/business/technical-architecture.md`](../../architecture/technical-architecture.md) - System architecture
- [`/specs/00-core/02-intelligence/README.md`](../../specs/00-core/02-intelligence/README.md) - Intelligence phase specs
