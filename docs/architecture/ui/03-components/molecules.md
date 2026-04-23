# Molecules - Composite Components

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Related Specs:**

- [README.md](./README.md) - Component catalog overview
- [atoms.md](./atoms.md) - Basic UI elements (used as building blocks)
- [accessibility-standards.md](../01-research-findings/accessibility-standards.md) - WCAG 2.1 AA

---

## Overview

**Molecules** are simple combinations of atoms that serve specific business functions. They combine basic UI elements (buttons, inputs, badges) into more meaningful components that can be reused throughout the application. Molecules encapsulate business logic, validation, and state management.

**Design Principles:**

- **Single Responsibility**: Each molecule serves one clear business purpose
- **Composability**: Combine atoms and other molecules
- **Business Logic**: Encapsulate validation, formatting, state
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA attributes
- **RTL Support**: Logical properties, automatic mirroring

---

## Component Catalog

| Component         | Purpose                       | Status         | Specification                    |
| ----------------- | ----------------------------- | -------------- | -------------------------------- |
| **FormField**     | Labeled input with validation | ✅ Implemented | [FormField Spec](#formfield)     |
| **SearchInput**   | Search with filters           | 🔄 Phase 2     | [SearchInput Spec](#searchinput) |
| **Card**          | Content container             | ✅ Implemented | [Card Spec](#card)               |
| **Dropdown**      | Single/multi select           | 🔄 Phase 2     | [Dropdown Spec](#dropdown)       |
| **DatePicker**    | Date selection                | 🔄 Phase 2     | [DatePicker Spec](#datepicker)   |
| **Toggle/Switch** | Boolean input                 | ✅ Implemented | [Toggle Spec](#toggle)           |
| **Select**        | Option selection              | ✅ Implemented | [Select Spec](#select)           |

---

## FormField

### Purpose

Labeled input wrapper that provides validation, error messaging, help text, and accessibility attributes. Used throughout the application for form inputs.

### Props/Inputs

```typescript
interface FormFieldProps {
  // Content
  id: string;                    // Unique ID for input (links label to input)
  label: string;                 // Field label (translated)
  children: React.ReactNode;     // Input component (Input, Select, DatePicker, etc.)

  // Validation
  error?: string;                // Error message (shows error styling)
  required?: boolean;            // Show required asterisk
  helperText?: string;           // Helper/description text

  // Layout
  orientation?: 'vertical' | 'horizontal';  // Label above/beside input
  fullWidth?: boolean;

  // Accessibility
  ariaDescribedBy?: string;      // Additional context ID
}

// Example usage:
<FormField id="email" label="Email address" required error={error}>
  <Input type="email" value={email} onChange={setEmail} />
</FormField>
```

### Outputs/Events

- No output events (passes through events to child input)

### Variants

| Variant        | Use Case                  | Label Position     |
| -------------- | ------------------------- | ------------------ |
| **vertical**   | Default, most forms       | Label above input  |
| **horizontal** | Compact forms, checkboxes | Label beside input |

### States

| State        | Appearance                                 | Behavior              |
| ------------ | ------------------------------------------ | --------------------- |
| **default**  | Label + input                              | Normal display        |
| **error**    | Red label, red border, error message below | Shows error message   |
| **disabled** | Grayed label, disabled input               | Input not interactive |
| **required** | Asterisk (\*) after label                  | Visual indicator only |

### Composition Rules

```tsx
// ✅ Allowed compositions
<FormField id="name" label="Full name" required>
  <Input type="text" value={name} onChange={setName} />
</FormField>

<FormField id="role" label="User role">
  <Select value={role} onChange={setRole}>
    <option value="admin">Admin</option>
    <option value="user">User</option>
  </Select>
</FormField>

// ❌ Invalid compositions
<FormField id="email" label="Email">
  <div>Nested div instead of input</div>  // Must be input/select/textarea
</FormField>

<FormField id="missing-id" label="Label">
  {/* Child must have matching ID for accessibility */}
</FormField>
```

### Accessibility Requirements

- **Label Association**: Label `htmlFor` must match input `id`
- **Required Fields**: Mark with `aria-required="true"` or visible asterisk
- **Error Announcements**: Use `aria-invalid` and `aria-describedby` for errors
- **Helper Text**: Link with `aria-describedby` for additional context
- **Focus Management**: Clicking label focuses the input

**ARIA Pattern:**

```tsx
<FormField id="email" label="Email address" required error={error}>
  <Input
    type="email"
    id="email" // Must match FormField id
    aria-invalid={!!error}
    aria-describedby={error ? "email-error" : "email-hint"}
  />
  {error && (
    <span id="email-error" role="alert" className="text-red-600">
      {error}
    </span>
  )}
  {!error && helperText && (
    <span id="email-hint" className="text-gray-600">
      {helperText}
    </span>
  )}
</FormField>
```

### RTL/LTR Behavior

| Property            | LTR          | RTL                     |
| ------------------- | ------------ | ----------------------- |
| **Label alignment** | Left-aligned | Right-aligned           |
| **Helper text**     | Left-aligned | Right-aligned           |
| **Error icon**      | Left of text | Right of text (mirrors) |

**Implementation:**

```tsx
// Use logical properties
<label
  htmlFor={id}
  style={{
    textAlign: "start", // Mirrors automatically
    marginInlineEnd: "0.5rem", // Horizontal orientation
  }}
>
  {label}
  {required && <span aria-hidden="true">*</span>}
</label>
```

### Multi-Language Support

**Translation Keys:**

- `common.formField.required`: Required field
- `common.formField.error.required`: This field is required
- `common.formField.error.invalid`: Invalid format
- `common.formField.error.email`: Invalid email address

**Usage Example:**

```tsx
<FormField
  id="email"
  label={t("common.fields.email")}
  required
  error={errors.email}
  helperText={t("common.fields.emailHelp")}
>
  <Input type="email" value={email} onChange={setEmail} />
</FormField>
```

### Usage Examples

```tsx
// Basic text field
<FormField id="name" label="Full name" required>
  <Input
    type="text"
    value={name}
    onChange={setName}
    placeholder="Enter your name"
  />
</FormField>

// Email with validation
<FormField
  id="email"
  label="Email address"
  required
  error={errors.email}
  helperText="We'll send your report to this address"
>
  <Input type="email" value={email} onChange={setEmail} />
</FormField>

// Select field
<FormField id="domain" label="Business domain">
  <Select value={domain} onChange={setDomain}>
    <option value="marketing">Marketing</option>
    <option value="finance">Finance</option>
    <option value="operations">Operations</option>
  </Select>
</FormField>

// Horizontal orientation (compact)
<FormField id="agree" label="I agree to the terms" orientation="horizontal">
  <Toggle checked={agreed} onChange={setAgreed} />
</FormField>

// Disabled field
<FormField id="readOnly" label="Read-only field">
  <Input type="text" value={readOnlyValue} onChange={() => {}} disabled />
</FormField>
```

### Related Components

- [Input](./atoms.md#input) - Text input component
- [Select](#select) - Option selection component
- [Toggle](#toggle) - Boolean input component
- [DatePicker](#datepicker) - Date selection component

### Related Entities/Pages

- **Insight Creation**: Name, description, domain fields
- **Connector Setup**: API key, credentials fields
- **Settings**: Tenant name, timezone, language fields
- **Authentication**: Email, password fields

---

## SearchInput

### Purpose

Enhanced search input with clear button, optional filters, and autocomplete support. Used for searching insights, connectors, and other entities.

### Props/Inputs

```typescript
interface SearchInputProps {
  // Core
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;

  // Features
  showClear?: boolean;           // Show clear button when has value
  showFilters?: boolean;         // Show filter toggle button
  filtersActive?: number;        // Count of active filters (shows badge)

  // Autocomplete
  suggestions?: string[];        // Autocomplete suggestions
  onSuggestionSelect?: (value: string) => void;

  // Debouncing
  debounceMs?: number;           // Debounce onChange (default: 300ms)

  // Actions
  onClear?: () => void;
  onFilterClick?: () => void;

  // Accessibility
  ariaLabel?: string;
  ariaControls?: string;         // ID of filter panel
}

// Example usage:
<SearchInput
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search insights..."
  showClear
  showFilters
  filtersActive={2}
  onFilterClick={openFilterPanel}
/>
```

### Outputs/Events

| Event                  | Signature                 | Description                       |
| ---------------------- | ------------------------- | --------------------------------- |
| **onChange**           | `(value: string) => void` | Fired on input change (debounced) |
| **onClear**            | `() => void`              | Fired when clear button clicked   |
| **onFilterClick**      | `() => void`              | Fired when filter button clicked  |
| **onSuggestionSelect** | `(value: string) => void` | Fired when suggestion selected    |

### Variants

| Variant          | Use Case            | Features                            |
| ---------------- | ------------------- | ----------------------------------- |
| **basic**        | Simple search       | Input + clear button only           |
| **with-filters** | Search with filters | Input + clear + filter button       |
| **autocomplete** | Search suggestions  | Input + clear + suggestion dropdown |

### States

| State              | Appearance                   | Behavior                  |
| ------------------ | ---------------------------- | ------------------------- |
| **default**        | Empty input                  | Clear button hidden       |
| **has-value**      | Text in input                | Clear button visible      |
| **filters-active** | Badge count on filter button | Shows active filter count |
| **loading**        | Spinner in input             | Shows loading indicator   |
| **focused**        | Blue border/focus ring       | Input focused             |

### Composition Rules

```tsx
// ✅ Allowed compositions
<SearchInput value={query} onChange={setQuery} />
<SearchInput value={query} onChange={setQuery} showClear showFilters />
<SearchInput value={query} onChange={setQuery} suggestions={suggestions} />

// ❌ Invalid compositions
<SearchInput onChange={setQuery} />  // Missing required value prop
<SearchInput value={query} />        // Missing required onChange prop
```

### Accessibility Requirements

- **Label**: Always provide visible label or aria-label
- **Clear Button**: aria-label="Clear search"
- **Filter Button**: aria-label="Open filters", aria-expanded state
- **Suggestions**: ARIA listbox role, arrow key navigation
- **Debounce**: Announce "Searching..." to screen readers

**ARIA Pattern:**

```tsx
<div role="search">
  <label htmlFor="search-input" className="sr-only">
    Search
  </label>
  <input
    id="search-input"
    type="search"
    value={value}
    onChange={onChange}
    aria-label="Search insights"
    aria-controls="search-suggestions"
    aria-autocomplete="list"
  />
  <button aria-label="Clear search" onClick={onClear}>
    <Icon name="x" />
  </button>
  <button
    aria-label="Open filters"
    aria-controls="filter-panel"
    aria-expanded={filtersOpen}
    onClick={onFilterClick}
  >
    <Icon name="filter" />
    {filtersActive > 0 && <Badge variant="count" count={filtersActive} />}
  </button>
</div>
```

### RTL/LTR Behavior

| Element           | LTR                   | RTL                  |
| ----------------- | --------------------- | -------------------- |
| **Input**         | Left-aligned text     | Right-aligned text   |
| **Clear button**  | Right of input        | Left of input        |
| **Filter button** | Right of clear button | Left of clear button |

### Multi-Language Support

**Translation Keys:**

- `common.search.placeholder`: Search...
- `common.search.placeholder.insights`: Search insights...
- `common.search.placeholder.connectors`: Search connectors...
- `common.search.clear`: Clear search
- `common.search.filters`: Filters
- `common.search.noResults`: No results found

### Usage Examples

```tsx
// Basic search
<SearchInput
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search insights..."
/>

// With filters
<SearchInput
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search insights..."
  showClear
  showFilters
  filtersActive={activeFilters.length}
  onFilterClick={openFilterPanel}
/>

// With autocomplete
<SearchInput
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search connectors..."
  showClear
  suggestions={connectorSuggestions}
  onSuggestionSelect={handleSuggestionSelect}
  debounceMs={300}
/>

// With loading state
<SearchInput
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search insights..."
  loading={isSearching}
/>
```

### Related Components

- [Input](./atoms.md#input) - Base input component
- [FilterPanel](./patterns.md#filterpanel) - Collapsible filter panel
- [DataTable](./organisms.md#datatable) - Search in data tables

### Related Entities/Pages

- **Insights Dashboard**: Search insights by name, domain
- **Connector Management**: Search connectors by platform, status
- **Settings**: Search settings sections
- **Reports**: Search reports by title, date range

---

## Card

### Purpose

Content container with header, body, and footer sections. Used to group related content and provide visual hierarchy.

### Props/Inputs

```typescript
interface CardProps {
  // Content
  children: React.ReactNode;

  // Header
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;  // Button, menu, etc.
  icon?: React.ReactNode;

  // Footer
  footer?: React.ReactNode;

  // Visual
  variant?: 'basic' | 'interactive' | 'collapsible';
  size?: 'sm' | 'md' | 'lg';
  elevation?: 0 | 1 | 2 | 3;       // Shadow depth

  // States
  disabled?: boolean;
  loading?: boolean;

  // Interactions (interactive variant)
  onClick?: () => void;
  href?: string;                   // Link card
  target?: '_blank' | '_self';

  // Collapsible
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

// Example usage:
<Card title="Total Impressions" subtitle="Last 30 days" headerAction={<Menu />}>
  <MetricCard value="1.2M" trend="+12%" />
</Card>
```

### Outputs/Events

| Event                | Signature                      | Description                                   |
| -------------------- | ------------------------------ | --------------------------------------------- |
| **onClick**          | `() => void`                   | Fired when card clicked (interactive variant) |
| **onCollapseChange** | `(collapsed: boolean) => void` | Fired when collapsed state changes            |

### Variants

| Variant         | Use Case               | Behavior                           |
| --------------- | ---------------------- | ---------------------------------- |
| **basic**       | Static content display | No hover/focus effects             |
| **interactive** | Clickable cards        | Hover elevation, cursor pointer    |
| **collapsible** | Expandable content     | Toggle visibility, collapse button |

### Sizes

| Size   | Padding | Border Radius | Use Case                      |
| ------ | ------- | ------------- | ----------------------------- |
| **sm** | 12px    | 4px           | Compact cards                 |
| **md** | 16px    | 6px           | Default                       |
| **lg** | 24px    | 8px           | Large cards, featured content |

### States

| State                       | Appearance                               | Behavior              |
| --------------------------- | ---------------------------------------- | --------------------- |
| **default**                 | Base variant styles                      | Normal display        |
| **hover** (interactive)     | Elevation increases, background lightens | Cursor: pointer       |
| **disabled**                | Opacity 0.6, grayscale                   | Not interactive       |
| **loading**                 | Skeleton loader                          | Shows loading state   |
| **collapsed** (collapsible) | Body hidden, collapse icon rotated       | Toggle button visible |

### Composition Rules

```tsx
// ✅ Allowed compositions
<Card title="Card Title">
  <p>Card body content</p>
</Card>

<Card title="Card Title" footer={<Button>Action</Button>}>
  <p>Body content</p>
</Card>

<Card interactive onClick={handleClick}>
  <h3>Clickable card</h3>
  <p>Click to navigate</p>
</Card>

// ❌ Invalid compositions
<Card title={<div>Complex JSX in title</div>}>  // Keep title simple
  Content
</Card>
```

### Accessibility Requirements

- **Semantic Structure**: Use `<article>` element for cards
- **Heading Hierarchy**: Card title should use proper heading level
- **Interactive Cards**: Use `<button>` or `<a>` element for keyboard accessibility
- **Collapsible**: Use `aria-expanded` and `aria-controls`

**ARIA Pattern:**

```tsx
// Static card
<article className="card">
  <header>
    <h3>{title}</h3>
  </header>
  <div>{children}</div>
</article>

// Interactive card
<button
  className="card card-interactive"
  onClick={onClick}
  type="button"
>
  <h3>{title}</h3>
  <p>{description}</p>
</button>

// Collapsible card
<article className="card">
  <header>
    <button
      aria-expanded={collapsed}
      aria-controls="card-body"
      onClick={toggleCollapse}
    >
      <h3>{title}</h3>
      <Icon name={collapsed ? 'chevron-down' : 'chevron-up'} />
    </button>
  </header>
  <div id="card-body" hidden={collapsed}>
    {children}
  </div>
</article>
```

### RTL/LTR Behavior

| Element           | LTR           | RTL           |
| ----------------- | ------------- | ------------- |
| **Title**         | Left-aligned  | Right-aligned |
| **Header action** | Right-aligned | Left-aligned  |
| **Collapse icon** | Right side    | Left side     |

### Multi-Language Support

**Translation Keys:**

- `common.card.expand`: Expand
- `common.card.collapse`: Collapse
- `common.card.loading`: Loading...

### Usage Examples

```tsx
// Basic card
<Card title="Marketing Overview">
  <p>Your marketing performance across all platforms.</p>
</Card>

// With header action
<Card
  title="Campaign Performance"
  headerAction={<Button size="sm">View Details</Button>}
>
  <MetricCard value="1.2M" trend="+12%" />
</Card>

// Interactive card
<Card
  interactive
  onClick={navigateToInsight}
  title="Marketing Insight"
  subtitle="Last 30 days"
>
  <p>Click to view full report</p>
</Card>

// Collapsible card
<Card
  title="Advanced Filters"
  collapsible
  defaultCollapsed={true}
  onCollapseChange={setCollapsed}
>
  <FilterPanel />
</Card>

// With footer
<Card
  title="Connector Status"
  footer={<Button onClick={refresh}>Refresh</Button>}
>
  <ConnectorStatusList />
</Card>

// Loading state
<Card title="Metrics" loading>
  <p>Loading metrics...</p>
</Card>
```

### Related Components

- [MetricCard](./organisms.md#metriccard) - Metric display card
- [ConnectorCard](./organisms.md#connectorcard) - Connector status card
- [InsightCard](./organisms.md#insightcard) - Insight summary card
- [Badge](./atoms.md#badge) - Badges in card headers

### Related Entities/Pages

- **Dashboard**: Metric cards, overview cards
- **Insights**: Insight cards, connector cards
- **Connectors**: Connection status cards
- **Settings**: Configuration cards

---

## Dropdown

### Purpose

Single or multi-select dropdown with keyboard navigation, search, and RTL support. Used for selecting options from lists.

### Props/Inputs

```typescript
interface DropdownProps {
  // Core
  value: string | string[];      // Single or multi-select
  onChange: (value: string | string[]) => void;
  options: DropdownOption[];

  // Display
  placeholder?: string;
  label?: string;                // Optional label (use FormField for full labeling)
  displayValue?: (value: string | string[]) => string;  // Custom display

  // Features
  searchable?: boolean;          // Enable search within options
  multiSelect?: boolean;         // Allow multiple selections
  clearable?: boolean;           // Show clear button

  // Filtering
  filterOptions?: (options: DropdownOption[], search: string) => DropdownOption[];

  // Virtualization (for large lists)
  virtualized?: boolean;
  virtualizationHeight?: number;

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  group?: string;                // For grouped options
}

// Example usage:
<Dropdown
  value={selectedPlatform}
  onChange={setSelectedPlatform}
  options={[
    { value: 'ga4', label: 'Google Analytics 4' },
    { value: 'meta', label: 'Meta' },
    { value: 'tiktok', label: 'TikTok' },
  ]}
  placeholder="Select platform"
/>
```

### Outputs/Events

| Event            | Signature                             | Description                      |
| ---------------- | ------------------------------------- | -------------------------------- |
| **onChange**     | `(value: string \| string[]) => void` | Fired when selection changes     |
| **onOpenChange** | `(open: boolean) => void`             | Fired when dropdown opens/closes |

### Variants

| Variant        | Use Case                | Selection            |
| -------------- | ----------------------- | -------------------- |
| **single**     | Single option selection | One value            |
| **multi**      | Multiple options        | Array of values      |
| **searchable** | Large option lists      | Search input visible |

### States

| State        | Appearance                            | Behavior                |
| ------------ | ------------------------------------- | ----------------------- |
| **default**  | Closed dropdown                       | Shows placeholder/value |
| **open**     | Dropdown list visible                 | Options visible         |
| **focused**  | Focus ring on trigger                 | Keyboard navigable      |
| **disabled** | Grayed out, not interactive           | Cannot open             |
| **error**    | Red border (when error prop provided) | Error styling           |

### Composition Rules

```tsx
// ✅ Allowed compositions
<Dropdown
  value={value}
  onChange={setValue}
  options={options}
/>

// ❌ Invalid compositions
<Dropdown value={value} />  // Missing required onChange and options
<Dropdown onChange={setValue} />  // Missing required value and options
```

### Accessibility Requirements

- **Keyboard Navigation**: Arrow keys, Enter, Escape, Home, End
- **Focus Management**: Trap focus within dropdown when open
- **ARIA Attributes**:
  - `aria-expanded`: Open/closed state
  - `aria-controls`: ID of option list
  - `aria-selected`: Selected state of options
  - `aria-activedescendant`: ID of active option
- **Screen Reader**: Announce "X options selected" for multi-select

**Keyboard Navigation:**

- **Arrow Down/Up**: Navigate options
- **Enter**: Select focused option
- **Escape**: Close dropdown
- **Home/End**: Jump to first/last option
- **Type-ahead**: Jump to matching option

### RTL/LTR Behavior

| Element           | LTR                             | RTL                             |
| ----------------- | ------------------------------- | ------------------------------- |
| **Dropdown list** | Aligned left, opens downward    | Aligned right, opens downward   |
| **Chevron icon**  | Points down (rotated when open) | Points down (rotated when open) |
| **Options**       | Left-aligned                    | Right-aligned                   |

### Multi-Language Support

**Translation Keys:**

- `common.dropdown.placeholder`: Select...
- `common.dropdown.noOptions`: No options found
- `common.dropdown.multiSelected`: {count} selected
- `common.dropdown.clear`: Clear selection

### Usage Examples

```tsx
// Single select
<Dropdown
  value={selectedDomain}
  onChange={setSelectedDomain}
  options={[
    { value: 'marketing', label: 'Marketing' },
    { value: 'finance', label: 'Finance' },
    { value: 'operations', label: 'Operations' },
  ]}
  placeholder="Select domain"
/>

// Multi select
<Dropdown
  multiSelect
  value={selectedPlatforms}
  onChange={setSelectedPlatforms}
  options={platformOptions}
  placeholder="Select platforms"
  displayValue={(values) => `${values.length} platforms selected`}
/>

// Searchable dropdown
<Dropdown
  searchable
  value={selectedConnector}
  onChange={setSelectedConnector}
  options={allConnectors}
  placeholder="Search connectors..."
/>

// With FormField
<FormField id="platform" label="Platform" required>
  <Dropdown
    value={platform}
    onChange={setPlatform}
    options={platformOptions}
    placeholder="Select platform"
  />
</FormField>

// Grouped options
<Dropdown
  value={value}
  onChange={setValue}
  options={[
    { value: 'ga4', label: 'Google Analytics 4', group: 'Marketing' },
    { value: 'meta', label: 'Meta', group: 'Marketing' },
    { value: 'quickbooks', label: 'QuickBooks', group: 'Finance' },
    { value: 'stripe', label: 'Stripe', group: 'Finance' },
  ]}
/>
```

### Related Components

- [Select](#select) - Native select component (simpler, better mobile)
- [FormField](#formfield) - Labeled dropdown wrapper
- [SearchInput](#searchinput) - Custom search with filters

### Related Entities/Pages

- **Insight Creation**: Select domain, platforms
- **Connector Management**: Select connector type
- **Settings**: Select timezone, language, region
- **Reports**: Select date range, format

---

## DatePicker

### Purpose

Date selection input with single date, date range, and timezone awareness. Used for scheduling insights, filtering data, and setting report periods.

### Props/Inputs

```typescript
interface DatePickerProps {
  // Core
  value: Date | DateRange | null;
  onChange: (value: Date | DateRange | null) => void;

  // Mode
  mode: 'single' | 'range';

  // Display
  placeholder?: string;
  label?: string;                // Optional label (use FormField for full labeling)
  format?: string;               // Date format (default: locale-specific)

  // Constraints
  minDate?: Date;
  maxDate?: Date;
  disableDates?: Date[];         // Specific dates to disable
  disableWeekends?: boolean;     // Disable Saturday/Sunday

  // Timezone
  timezone?: string;             // IANA timezone (e.g., 'America/New_York')
  timezoneAware?: boolean;       // Show timezone selector

  // Localization
  locale?: string;               // Locale for date formatting (default: user locale)

  // Presets (range mode)
  presets?: DateRangePreset[];   // Quick date range selections

  // Accessibility
  ariaLabel?: string;
}

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangePreset {
  label: string;
  range: DateRange;
}

// Example usage:
<DatePicker
  mode="range"
  value={dateRange}
  onChange={setDateRange}
  presets={[
    { label: 'Last 7 days', range: { start: subDays(new Date(), 7), end: new Date() } },
    { label: 'Last 30 days', range: { start: subDays(new Date(), 30), end: new Date() } },
  ]}
/>
```

### Outputs/Events

| Event        | Signature                                    | Description                       |
| ------------ | -------------------------------------------- | --------------------------------- |
| **onChange** | `(value: Date \| DateRange \| null) => void` | Fired when date selection changes |

### Variants

| Variant    | Use Case              | Value Type  |
| ---------- | --------------------- | ----------- |
| **single** | Single date selection | `Date`      |
| **range**  | Date range selection  | `DateRange` |

### States

| State        | Appearance          | Behavior                        |
| ------------ | ------------------- | ------------------------------- |
| **default**  | Closed picker       | Shows placeholder/selected date |
| **open**     | Calendar visible    | Calendar panel displayed        |
| **focused**  | Focus ring on input | Keyboard navigable              |
| **disabled** | Grayed out          | Cannot open picker              |

### Composition Rules

```tsx
// ✅ Allowed compositions
<DatePicker mode="single" value={date} onChange={setDate} />
<DatePicker mode="range" value={dateRange} onChange={setDateRange} />

// ❌ Invalid compositions
<DatePicker value={date} />  // Missing required onChange and mode
<DatePicker mode="invalid" value={date} onChange={setDate} />  // Invalid mode
```

### Accessibility Requirements

- **Keyboard Navigation**: Arrow keys, PgUp/PgDn, Home/End, Enter
- **Date Formatting**: Locale-aware formatting (e.g., MM/DD/YYYY vs DD/MM/YYYY)
- **Timezone Awareness**: Display timezone, allow selection
- **ARIA Attributes**:
  - `aria-label`: Date picker label
  - `aria-invalid`: Error state
  - `aria-describedby`: Error/help text

**Keyboard Navigation:**

- **Arrow Keys**: Navigate days
- **Page Up/Down**: Navigate months
- **Home/End**: Jump to first/last day of month
- **Enter**: Select date
- **Escape**: Close picker

### RTL/LTR Behavior

| Element              | LTR                  | RTL                       |
| -------------------- | -------------------- | ------------------------- |
| **Calendar**         | Left-to-right layout | Right-to-left layout      |
| **Day names**        | Sun Mon Tue...       | الجمعة الخميس... (Arabic) |
| **Month navigation** | < March >            | > مارس < (arrows flipped) |

### Multi-Language Support

**Translation Keys:**

- `common.datepicker.placeholder`: Select date...
- `common.datepicker.today`: Today
- `common.datepicker.clear`: Clear
- `common.datepicker.preset.last7days`: Last 7 days
- `common.datepicker.preset.last30days`: Last 30 days
- `common.datepicker.preset.thisMonth`: This month
- `common.datepicker.preset.lastMonth`: Last month
- `common.datepicker.preset.custom`: Custom range

**Locale-aware Formatting:**

```tsx
// English (US): MM/DD/YYYY
// English (UK): DD/MM/YYYY
// Arabic: DD/MM/YYYY (with Arabic numerals)
```

### Usage Examples

```tsx
// Single date
<DatePicker
  mode="single"
  value={selectedDate}
  onChange={setSelectedDate}
  placeholder="Select date"
/>

// Date range with presets
<DatePicker
  mode="range"
  value={dateRange}
  onChange={setDateRange}
  placeholder="Select date range"
  presets={[
    { label: 'Last 7 days', range: { start: subDays(new Date(), 7), end: new Date() } },
    { label: 'Last 30 days', range: { start: subDays(new Date(), 30), end: new Date() } },
    { label: 'This month', range: { start: startOfMonth(new Date()), end: new Date() } },
  ]}
/>

// With timezone
<DatePicker
  mode="single"
  value={selectedDate}
  onChange={setSelectedDate}
  timezone="America/New_York"
  timezoneAware
/>

// With constraints
<DatePicker
  mode="range"
  value={dateRange}
  onChange={setDateRange}
  minDate={new Date('2024-01-01')}
  maxDate={new Date()}
  disableWeekends
/>

// With FormField
<FormField id="startDate" label="Start date" required>
  <DatePicker
    mode="single"
    value={startDate}
    onChange={setStartDate}
  />
</FormField>
```

### Related Components

- [FormField](#formfield) - Labeled date picker wrapper
- [Input](./atoms.md#input) - Manual date input (alternative)
- [Select](#select) - Quick preset selection

### Related Entities/Pages

- **Insight Creation**: Schedule start date, end date
- **Reports**: Report date range filter
- **Dashboard**: Date range selector for metrics
- **Connectors**: Data fetch date range

---

## Toggle/Switch

### Purpose

Boolean input for on/off states, settings toggles, and feature flags. Used throughout the application for binary choices.

### Props/Inputs

```typescript
interface ToggleProps {
  // Core
  checked: boolean;
  onChange: (checked: boolean) => void;

  // Display
  label?: string;                // Label text (beside toggle)
  description?: string;          // Helper text below label

  // Visual
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'red';

  // States
  disabled?: boolean;
  loading?: boolean;             // Show spinner, disable interaction

  // Accessibility
  ariaLabel?: string;            // Required if no label
  ariaDescribedBy?: string;
}

// Example usage:
<Toggle
  checked={enabled}
  onChange={setEnabled}
  label="Enable insights"
  description="Generate insights automatically"
/>
```

### Outputs/Events

| Event        | Signature                    | Description                     |
| ------------ | ---------------------------- | ------------------------------- |
| **onChange** | `(checked: boolean) => void` | Fired when toggle state changes |
| **onFocus**  | `() => void`                 | Fired when toggle gains focus   |
| **onBlur**   | `() => void`                 | Fired when toggle loses focus   |

### Variants

| Variant     | Use Case            | Appearance         |
| ----------- | ------------------- | ------------------ |
| **default** | General use         | Blue when checked  |
| **success** | Success states      | Green when checked |
| **danger**  | Destructive actions | Red when checked   |

### Sizes

| Size   | Height | Track Width | Thumb Size |
| ------ | ------ | ----------- | ---------- |
| **sm** | 20px   | 32px        | 16px       |
| **md** | 24px   | 40px        | 20px       |
| **lg** | 28px   | 48px        | 24px       |

### States

| State         | Appearance                    | Behavior            |
| ------------- | ----------------------------- | ------------------- |
| **unchecked** | Gray track, thumb on left     | Shows "off" state   |
| **checked**   | Colored track, thumb on right | Shows "on" state    |
| **disabled**  | Opacity 0.6, grayscale        | Not interactive     |
| **loading**   | Spinner, disabled             | Shows loading state |

### Composition Rules

```tsx
// ✅ Allowed compositions
<Toggle checked={checked} onChange={setChecked} />
<Toggle checked={checked} onChange={setChecked} label="Enable feature" />
<Toggle checked={checked} onChange={setChecked} label="Enable" description="Description here" />

// ❌ Invalid compositions
<Toggle checked={checked} />  // Missing required onChange
<Toggle onChange={setChecked} />  // Missing required checked
<Toggle checked={checked} onChange={setChecked}><div>Nested content</div></Toggle>  // No children allowed
```

### Accessibility Requirements

- **Label Association**: Use `<label>` or `aria-label`
- **Keyboard Activation**: Space key toggles state
- **Focus Indicator**: Visible focus ring (2px minimum)
- **State Announcement**: Screen reader announces "checked" or "not checked"
- **Touch Targets**: Minimum 44×44px for accessibility

**ARIA Pattern:**

```tsx
<label className="flex items-center gap-3">
  <span className="sr-only">{label}</span>
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
  >
    <span className="sr-only">{checked ? "On" : "Off"}</span>
    {/* Toggle visual implementation */}
  </button>
  <span>{label}</span>
</label>
```

### RTL/LTR Behavior

| Property           | LTR                                | RTL                                |
| ------------------ | ---------------------------------- | ---------------------------------- |
| **Thumb position** | Left (unchecked) → Right (checked) | Right (unchecked) → Left (checked) |
| **Label position** | Right of toggle                    | Left of toggle                     |

**Implementation:**

```tsx
// Use logical properties
<button
  style={{
    // Thumb position mirrors automatically
    transform: checked ? "translateX(100%)" : "translateX(0)",
  }}
>
  {/* Toggle thumb */}
</button>
```

### Multi-Language Support

**Translation Keys:**

- `common.toggle.on`: On
- `common.toggle.off`: Off
- `common.toggle.enabled`: Enabled
- `common.toggle.disabled`: Disabled

### Usage Examples

```tsx
// Basic toggle
<Toggle checked={enabled} onChange={setEnabled} />

// With label
<Toggle
  checked={autoGenerate}
  onChange={setAutoGenerate}
  label="Auto-generate insights"
/>

// With description
<Toggle
  checked={notificationsEnabled}
  onChange={setNotificationsEnabled}
  label="Email notifications"
  description="Receive daily insight summaries"
/>

// Disabled
<Toggle
  checked={checked}
  onChange={setChecked}
  disabled
  label="Feature unavailable"
/>

// With FormField
<FormField id="public" label="Public insight" orientation="horizontal">
  <Toggle
    checked={isPublic}
    onChange={setIsPublic}
    aria-label="Make insight public"
  />
</FormField>
```

### Related Components

- [FormField](#formfield) - Labeled toggle wrapper
- [Checkbox](./atoms.md#input) - Alternative boolean input
- [RadioGroup](./atoms.md#input) - Single selection from multiple options

### Related Entities/Pages

- **Settings**: Feature flags, notifications, preferences
- **Insight Creation**: Enable/disable AI, schedule toggles
- **Connector Management**: Enable/disable connectors
- **Reports**: Enable/disable auto-delivery

---

## Select

### Purpose

Native select dropdown for option selection. Simpler and more mobile-friendly than the custom Dropdown component. Use for simple option lists.

### Props/Inputs

```typescript
interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  // Core
  value: string;
  onChange: (value: string) => void;

  // Options
  options: SelectOption[];

  // Display
  placeholder?: string;
  label?: string;                // Optional label (use FormField for full labeling)
  size?: 'sm' | 'md' | 'lg';

  // Groups
  grouped?: boolean;             // Options have groups

  // Accessibility
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;                // For grouped options
}

// Example usage:
<Select
  value={selectedPlatform}
  onChange={setSelectedPlatform}
  options={[
    { value: 'ga4', label: 'Google Analytics 4' },
    { value: 'meta', label: 'Meta' },
    { value: 'tiktok', label: 'TikTok' },
  ]}
  placeholder="Select platform"
/>
```

### Outputs/Events

| Event        | Signature                 | Description                   |
| ------------ | ------------------------- | ----------------------------- |
| **onChange** | `(value: string) => void` | Fired when selection changes  |
| **onBlur**   | `() => void`              | Fired when select loses focus |
| **onFocus**  | `() => void`              | Fired when select gains focus |

### Variants

| Variant      | Use Case           | Appearance                     |
| ------------ | ------------------ | ------------------------------ |
| **default**  | General use        | Standard select styling        |
| **platform** | Platform selection | With icons, grouped by domain  |
| **domain**   | Domain selection   | Marketing, Finance, Operations |

### Sizes

| Size   | Height | Padding   | Font Size |
| ------ | ------ | --------- | --------- |
| **sm** | 30px   | 6px 12px  | 14px      |
| **md** | 36px   | 8px 16px  | 14px      |
| **lg** | 44px   | 10px 20px | 16px      |

### States

| State        | Appearance                    | Behavior           |
| ------------ | ----------------------------- | ------------------ |
| **default**  | Gray border, white background | Normal display     |
| **focused**  | Blue border, focus ring       | Keyboard navigable |
| **disabled** | Gray background, opacity 0.6  | Not interactive    |
| **error**    | Red border                    | Error styling      |

### Composition Rules

```tsx
// ✅ Allowed compositions
<Select
  value={value}
  onChange={setValue}
  options={options}
/>

// ❌ Invalid compositions
<Select value={value} />  // Missing required onChange and options
<Select onChange={setValue} />  // Missing required value and options
```

### Accessibility Requirements

- **Native Accessibility**: Leverages browser's native select accessibility
- **Label Association**: Use `<label>` or `aria-label`
- **Keyboard Navigation**: Native arrow key navigation
- **Option Groups**: Use `<optgroup>` for grouped options

**ARIA Pattern:**

```tsx
<label htmlFor="platform-select">Platform</label>
<select
  id="platform-select"
  value={value}
  onChange={(e) => onChange(e.target.value)}
  aria-label="Select platform"
>
  <option value="">Select platform...</option>
  <optgroup label="Marketing">
    <option value="ga4">Google Analytics 4</option>
    <option value="meta">Meta</option>
  </optgroup>
  <optgroup label="Finance">
    <option value="quickbooks">QuickBooks</option>
    <option value="stripe">Stripe</option>
  </optgroup>
</select>
```

### RTL/LTR Behavior

| Element            | LTR          | RTL           |
| ------------------ | ------------ | ------------- |
| **Dropdown arrow** | Right side   | Left side     |
| **Options**        | Left-aligned | Right-aligned |

### Multi-Language Support

**Translation Keys:**

- `common.select.placeholder`: Select...
- `common.select.platform.placeholder`: Select platform...
- `common.select.domain.placeholder`: Select domain...

### Usage Examples

```tsx
// Basic select
<Select
  value={selectedDomain}
  onChange={setSelectedDomain}
  options={[
    { value: 'marketing', label: 'Marketing' },
    { value: 'finance', label: 'Finance' },
    { value: 'operations', label: 'Operations' },
  ]}
  placeholder="Select domain"
/>

// Platform select (with icons)
<Select
  value={selectedPlatform}
  onChange={setSelectedPlatform}
  options={[
    { value: 'ga4', label: 'Google Analytics 4' },
    { value: 'meta', label: 'Meta' },
    { value: 'tiktok', label: 'TikTok' },
  ]}
  placeholder="Select platform"
/>

// Domain select
<Select
  value={selectedDomain}
  onChange={setSelectedDomain}
  options={[
    { value: 'marketing', label: 'Marketing' },
    { value: 'finance', label: 'Finance' },
    { value: 'operations', label: 'Operations' },
    { value: 'seo', label: 'SEO' },
    { value: 'social', label: 'Social Media' },
    { value: 'local', label: 'Local Business' },
  ]}
  placeholder="Select domain"
/>

// With FormField
<FormField id="timezone" label="Timezone" required>
  <Select
    value={timezone}
    onChange={setTimezone}
    options={timezoneOptions}
    placeholder="Select timezone"
  />
</FormField>

// Grouped options
<Select
  value={value}
  onChange={setValue}
  grouped
  options={[
    { value: 'ga4', label: 'Google Analytics 4', group: 'Marketing' },
    { value: 'meta', label: 'Meta', group: 'Marketing' },
    { value: 'quickbooks', label: 'QuickBooks', group: 'Finance' },
    { value: 'stripe', label: 'Stripe', group: 'Finance' },
  ]}
/>
```

### Related Components

- [Dropdown](#dropdown) - Custom dropdown with search
- [FormField](#formfield) - Labeled select wrapper
- [Toggle](#toggle) - Boolean input alternative

### Related Entities/Pages

- **Insight Creation**: Select domain, platforms
- **Connector Management**: Select connector type
- **Settings**: Select timezone, language, region
- **Reports**: Select format, delivery method

---

## Document Status

**Version:** 1.0
**Last Updated:** 2026-04-13
**Status:** Active
**Next Review:** After Phase 2 completion
**Maintainer:** UI/UX Team

**Related Specifications:**

- [README.md](./README.md) - Component catalog overview
- [atoms.md](./atoms.md) - Basic UI elements
- [organisms.md](./organisms.md) - Complex UI sections
