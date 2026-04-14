# UI Patterns Specification

**Document Version:** 1.0  
**Date:** 2026-04-11  
**Status:** Design System Specification  
**Component:** AgenticVerdict UI System

---

## Executive Summary

This document defines the comprehensive UI patterns for AgenticVerdict, a multi-tenant marketing analytics SaaS platform. These patterns provide consistent, accessible, and responsive user interface solutions built on Mantine v9, supporting both LTR and RTL layouts with proper internationalization.

**Pattern Categories:**

1. **Layout Patterns** - App shell, dashboard grids, multi-column layouts, mobile navigation
2. **Data Display Patterns** - Tables, metrics cards, visualizations, trend indicators
3. **Form Patterns** - Multi-step wizards, validation, help text, save actions
4. **Feedback Patterns** - Loading states, toasts, empty states, progress indicators
5. **Navigation Patterns** - Breadcrumbs, tabs, tenant switcher, quick actions
6. **Action Patterns** - Bulk actions, confirmations, async feedback, keyboard shortcuts
7. **RTL Patterns** - Layout mirroring, icon handling, text input, chart adaptation

**Key Principles:**

- Mobile-first responsive design
- Accessibility-first (WCAG 2.1 AA)
- Progressive disclosure for complex data
- Consistent visual language across all patterns
- RTL support from the ground up

---

## Table of Contents

1. [Layout Patterns](#1-layout-patterns)
2. [Data Display Patterns](#2-data-display-patterns)
3. [Form Patterns](#3-form-patterns)
4. [Feedback Patterns](#4-feedback-patterns)
5. [Navigation Patterns](#5-navigation-patterns)
6. [Action Patterns](#6-action-patterns)
7. [RTL Patterns](#7-rtl-patterns)

---

## 1. Layout Patterns

### 1.1 App Shell with Responsive Sidebar

The app shell provides the foundational layout structure with a collapsible sidebar that adapts to different screen sizes and supports both LTR and RTL layouts.

**Use Cases:** Primary application layout, dashboard wrapper, settings pages

#### Pattern Implementation

```tsx
import { AppShell, Burger, Group, ScrollArea, rem } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Navbar } from "./Navbar";
import { Header } from "./Header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened, desktop: false },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Header />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          <Navbar />
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
```

#### Accessibility Considerations

- Sidebar toggle button must have `aria-expanded` and `aria-controls` attributes
- Use `<nav>` semantic element for sidebar content
- Implement skip link to main content
- Ensure keyboard trap management for mobile overlay

#### Responsive Behavior

- **Desktop (≥1024px):** Persistent sidebar, 280px width
- **Tablet (768-1023px):** Collapsible sidebar with overlay
- **Mobile (<768px):** Full-width drawer overlay, 280px width

#### RTL Adaptation

```tsx
// Mantine automatically handles RTL when direction is set
<MantineProvider withNormalizeCSS withGlobalStyles dir={direction}>
  <DashboardLayout>{/* Content automatically mirrors */}</DashboardLayout>
</MantineProvider>
```

---

### 1.2 Dashboard Grid Layouts

Responsive grid systems for organizing metric cards, charts, and data visualizations with automatic reflow based on screen size.

**Use Cases:** Main dashboard, analytics overview, report summaries

#### Pattern Implementation

```tsx
import { SimpleGrid, Container } from "@mantine/core";
import { MetricCard } from "./MetricCard";
import { ChartCard } from "./ChartCard";

export function DashboardGrid() {
  return (
    <Container size="xl">
      {/* Key metrics row - 4 columns on desktop, 2 on tablet, 1 on mobile */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="lg">
        <MetricCard title="Total Impressions" value="2.4M" trend="+12.5%" trendDirection="up" />
        <MetricCard title="Click-Through Rate" value="3.2%" trend="-0.8%" trendDirection="down" />
        <MetricCard title="Conversions" value="1,234" trend="+5.3%" trendDirection="up" />
        <MetricCard title="Cost per Conversion" value="$45.67" trend="+2.1%" trendDirection="up" />
      </SimpleGrid>

      {/* Charts section - 2 columns on desktop, 1 on mobile */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <ChartCard title="Performance Over Time" type="line" />
        <ChartCard title="Platform Comparison" type="bar" />
      </SimpleGrid>
    </Container>
  );
}
```

#### Grid Breakpoint Strategy

```tsx
// Responsive grid configuration
const gridConfig = {
  breakpoints: {
    mobile: "0px", // Single column
    tablet: "768px", // 2 columns
    desktop: "1024px", // 3-4 columns
    large: "1440px", // 4 columns maximum
  },

  spacing: {
    mobile: "sm", // 8px gaps
    tablet: "md", // 16px gaps
    desktop: "lg", // 24px gaps
  },
};
```

#### Accessibility Considerations

- Maintain reading order when grids reflow
- Use semantic HTML (`<section>`, `<article>`) for grid items
- Ensure focus order follows visual layout
- Provide grid layout announcements to screen readers

---

### 1.3 Multi-Column Content Layouts

Flexible column layouts for organizing related content with optional sticky sidebars and scrollable content areas.

**Use Cases:** Report viewer, insight detail pages, documentation

#### Pattern Implementation

```tsx
import { Grid, Stack, Text } from "@mantine/core";
import { Affix } from "./Affix";

export function TwoColumnLayout({
  main,
  sidebar,
}: {
  main: React.ReactNode;
  sidebar: React.ReactNode;
}) {
  return (
    <Grid>
      {/* Main content column */}
      <Grid.Col span={{ base: 12, md: 8 }}>
        <Stack gap="xl">{main}</Stack>
      </Grid.Col>

      {/* Sidebar column */}
      <Grid.Col span={{ base: 12, md: 4 }}>
        <Affix position={{ top: 80, right: 20 }}>
          <Stack gap="md">{sidebar}</Stack>
        </Affix>
      </Grid.Col>
    </Grid>
  );
}

// Usage example
<TwoColumnLayout
  main={
    <>
      <Text size="xl" fw={600}>
        Performance Report
      </Text>
      {/* Report content */}
    </>
  }
  sidebar={
    <>
      <SummaryCard />
      <ActionsCard />
    </>
  }
/>;
```

#### Content Organization Patterns

1. **70/30 Split:** Main content (70%) / Sidebar (30%)
2. **60/40 Split:** Content-focused pages with substantial navigation
3. **50/50 Split:** Comparison views, parallel analysis
4. **Single Column with Drawer:** Mobile pattern with collapsible sidebar

---

### 1.4 Mobile Navigation Patterns

Bottom navigation for mobile with smooth transitions to sidebar on larger screens.

**Use Cases:** Primary mobile navigation, quick access to main sections

#### Pattern Implementation

```tsx
import { AppShell, BottomNavigation, BottomNavigationAction } from "@mantine/core";
import { IconDashboard, IconChartBar, IconPlug, IconSettings } from "@tabler/icons-react";

export function MobileNavigation() {
  const [active, setActive] = useState(0);

  return (
    <BottomNavigation
      active={active}
      onChange={setActive}
      fixed
      // Automatically hidden on larger screens by CSS
      sx={{ display: { base: "flex", md: "none" } }}
    >
      <BottomNavigationAction
        label="Dashboard"
        icon={<IconDashboard size="1.5rem" />}
        onClick={() => navigate("/dashboard")}
      />
      <BottomNavigationAction
        label="Insights"
        icon={<IconChartBar size="1.5rem" />}
        onClick={() => navigate("/insights")}
      />
      <BottomNavigationAction
        label="Connectors"
        icon={<IconPlug size="1.5rem" />}
        onClick={() => navigate("/connectors")}
      />
      <BottomNavigationAction
        label="Settings"
        icon={<IconSettings size="1.5rem" />}
        onClick={() => navigate("/settings")}
      />
    </BottomNavigation>
  );
}
```

#### Mobile Navigation Best Practices

- **Maximum 5 items:** More items should use a "More" menu
- **Icon + Label:** Always include both for clarity
- **Touch Targets:** Minimum 44×44px per item
- **Visual Feedback:** Active state with color and opacity
- **Safe Areas:** Account for device notches and home indicators

#### RTL Mobile Navigation

```tsx
// Mantine automatically reverses bottom nav order in RTL
// No additional code needed - icons and labels adjust automatically
<MantineProvider dir="rtl">
  <BottomNavigation>{/* Items automatically position right-to-left */}</BottomNavigation>
</MantineProvider>
```

---

## 2. Data Display Patterns

### 2.1 Data Tables with Sort/Filter/Pagination

Comprehensive data tables with sorting, filtering, pagination, and export capabilities.

**Use Cases:** Report listings, connector logs, user management, data exports

#### Pattern Implementation

```tsx
import {
  Table,
  ActionIcon,
  Text,
  Group,
  Pagination,
  TextInput,
  Select,
  Menu,
  Checkbox,
} from "@mantine/core";
import {
  IconSortAscending,
  IconSortDescending,
  IconDots,
  IconDownload,
  IconRefresh,
} from "@tabler/icons-react";
import { useSortBy, useFilters, usePagination } from "./tableHooks";

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onExport?: () => void;
  onRefresh?: () => void;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  onExport,
  onRefresh,
}: DataTableProps<T>) {
  const {
    getTableProps,
    getTableBodyProps,
    headers,
    rows,
    prepareRow,
    state: { sortBy, filters },
  } = useTable({ columns, data }, [useSortBy, useFilters]);

  const [page, setPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  return (
    <Stack gap="md">
      {/* Table controls */}
      <Group justify="space-between">
        <Group gap="sm">
          <TextInput
            placeholder="Search..."
            onChange={(e) => setGlobalFilter(e.target.value)}
            leftSection={<IconSearch size="1rem" />}
            sx={{ width: 300 }}
          />
          <Select
            placeholder="Filter by status"
            data={["Active", "Inactive", "Pending"]}
            clearable
          />
        </Group>
        <Group gap="sm">
          {onRefresh && (
            <ActionIcon variant="light" onClick={onRefresh}>
              <IconRefresh size="1rem" />
            </ActionIcon>
          )}
          {onExport && (
            <Button leftSection={<IconDownload size="1rem" />} onClick={onExport}>
              Export
            </Button>
          )}
        </Group>
      </Group>

      {/* Data table */}
      <Table.ScrollContainer minWidth={800}>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>
                <Checkbox
                  aria-label="Select all rows"
                  checked={selectedRows.size === rows.length}
                  onChange={(e) => {
                    if (e.currentTarget.checked) {
                      setSelectedRows(new Set(rows.map((r) => r.original.id)));
                    } else {
                      setSelectedRows(new Set());
                    }
                  }}
                />
              </Table.Th>
              {headers.map((column) => (
                <Table.Th key={column.id}>
                  <Group gap="xs" onClick={column.getSortByToggleProps()}>
                    <Text>{column.render("Header")}</Text>
                    {column.isSorted && (
                      <ActionIcon size="xs" variant="transparent">
                        {column.isSortedDesc ? (
                          <IconSortDescending size="1rem" />
                        ) : (
                          <IconSortAscending size="1rem" />
                        )}
                      </ActionIcon>
                    )}
                  </Group>
                </Table.Th>
              ))}
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody {...getTableBodyProps()}>
            {rows.map((row) => {
              prepareRow(row);
              return (
                <Table.Tr key={row.id}>
                  <Table.Td>
                    <Checkbox
                      checked={selectedRows.has(row.original.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedRows);
                        if (e.currentTarget.checked) {
                          newSelected.add(row.original.id);
                        } else {
                          newSelected.delete(row.original.id);
                        }
                        setSelectedRows(newSelected);
                      }}
                    />
                  </Table.Td>
                  {row.cells.map((cell) => (
                    <Table.Td key={cell.column.id}>{cell.render("Cell")}</Table.Td>
                  ))}
                  <Table.Td>
                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon>
                          <IconDots size="1rem" />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item>View details</Menu.Item>
                        <Menu.Item>Edit</Menu.Item>
                        <Menu.Item color="red">Delete</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      {/* Pagination */}
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          Showing {(page - 1) * 10 + 1} to {Math.min(page * 10, rows.length)} of {rows.length}{" "}
          results
        </Text>
        <Pagination total={Math.ceil(rows.length / 10)} value={page} onChange={setPage} />
      </Group>
    </Stack>
  );
}
```

#### Table Accessibility

- Use semantic `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>` elements
- Include `scope="col"` on column headers and `scope="row"` on row headers
- Provide `aria-sort` attribute on sortable columns
- Implement keyboard navigation (arrow keys for rows, Enter for actions)
- Ensure pagination controls are properly labeled

#### Table Performance Optimization

```tsx
// Virtual scrolling for large datasets
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualTable({ data }: { data: Row[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimated row height
    overscan: 5,
  });

  return (
    <div ref={parentRef} style={{ height: "600px", overflow: "auto" }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {data[virtualRow.index].content}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 2.2 Card-Based Metrics Display

Consistent card components for displaying key metrics with trends, comparisons, and visual indicators.

**Use Cases:** Dashboard KPIs, metric summaries, performance indicators

#### Pattern Implementation

```tsx
import { Card, Text, Group, Stack, Progress, Badge } from "@mantine/core";
import { IconTrendingUp, IconTrendingDown, IconMinus } from "@tabler/icons-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  previousValue?: string | number;
  trend?: {
    value: string; // e.g., "+12.5%"
    direction: "up" | "down" | "neutral";
  };
  unit?: string;
  description?: string;
  onClick?: () => void;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  previousValue,
  trend,
  unit,
  description,
  onClick,
  loading,
}: MetricCardProps) {
  if (loading) {
    return <MetricCardSkeleton />;
  }

  const TrendIcon = {
    up: IconTrendingUp,
    down: IconTrendingDown,
    neutral: IconMinus,
  }[trend?.direction || "neutral"];

  const trendColor = {
    up: "green",
    down: "red",
    neutral: "gray",
  }[trend?.direction || "neutral"];

  return (
    <Card
      shadow="sm"
      padding="lg"
      radius="md"
      withBorder
      onClick={onClick}
      sx={{ cursor: onClick ? "pointer" : "default" }}
    >
      <Stack gap="xs">
        {/* Card header */}
        <Group justify="space-between">
          <Text size="sm" c="dimmed" fw={500}>
            {title}
          </Text>
          {description && (
            <Text size="xs" c="blue" style={{ cursor: "help" }} title={description}>
              ℹ️
            </Text>
          )}
        </Group>

        {/* Main value */}
        <Group align="flex-end" gap="xs">
          <Text size="xl" fw={700}>
            {typeof value === "number" ? value.toLocaleString() : value}
          </Text>
          {unit && (
            <Text size="sm" c="dimmed" mb={4}>
              {unit}
            </Text>
          )}
        </Group>

        {/* Trend indicator */}
        {trend && (
          <Group gap="xs">
            <Badge color={trendColor} variant="light" leftSection={<TrendIcon size="0.8rem" />}>
              {trend.value}
            </Badge>
            {previousValue && (
              <Text size="xs" c="dimmed">
                vs. {previousValue} {unit}
              </Text>
            )}
          </Group>
        )}

        {/* Progress bar (optional) */}
        {typeof value === "number" && <Progress value={(value / 100) * 100} size="sm" mt="xs" />}
      </Stack>
    </Card>
  );
}

// Skeleton loading state
function MetricCardSkeleton() {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="xs">
        <Skeleton height={16} width="60%" />
        <Skeleton height={32} width="40%" />
        <Skeleton height={20} width="80%" />
      </Stack>
    </Card>
  );
}
```

#### Metric Card Variations

1. **Compact Card:** Minimal information, dashboard-focused
2. **Detailed Card:** Includes historical data, sparklines
3. **Actionable Card:** Includes quick action buttons
4. **Status Card:** Shows system health, connection status

---

### 2.3 Chart Visualization Patterns

Consistent chart components with responsive sizing, interactive tooltips, and accessible alternatives.

**Use Cases:** Performance trends, platform comparisons, time series analysis

#### Pattern Implementation (with Recharts)

```tsx
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, Text, Group } from "@mantine/core";

interface ChartCardProps {
  title: string;
  data: any[];
  type: "line" | "bar" | "pie";
  xAxisKey?: string;
  dataKeys: string[];
  colors?: string[];
  height?: number;
  onDataPointClick?: (data: any) => void;
}

const DEFAULT_COLORS = [
  "#228be6", // blue
  "#40c057", // green
  "#fab005", // yellow
  "#fa5252", // red
  "#7950f2", // violet
];

export function ChartCard({
  title,
  data,
  type,
  xAxisKey,
  dataKeys,
  colors = DEFAULT_COLORS,
  height = 300,
  onDataPointClick,
}: ChartCardProps) {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 5 },
      onClick: onDataPointClick ? (data: any) => onDataPointClick(data) : undefined,
    };

    switch (type) {
      case "line":
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
            <XAxis dataKey={xAxisKey} stroke="#868e96" />
            <YAxis stroke="#868e96" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
            <XAxis dataKey={xAxisKey} stroke="#868e96" />
            <YAxis stroke="#868e96" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {dataKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKeys[0]}
              nameKey={xAxisKey}
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(entry) => `${entry.name}: ${entry.value}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Text size="lg" fw={600}>
          {title}
        </Text>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>

        {/* Accessible alternative data table */}
        <table className="sr-only" aria-label={`${title} data table`}>
          <thead>
            <tr>
              {xAxisKey && <th>{xAxisKey}</th>}
              {dataKeys.map((key) => (
                <th key={key}>{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {xAxisKey && <td>{row[xAxisKey]}</td>}
                {dataKeys.map((key) => (
                  <td key={key}>{row[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Stack>
    </Card>
  );
}

// Custom tooltip with Mantine styling
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;

  return (
    <Card shadow="md" padding="sm" radius="sm">
      <Text size="sm" fw={500} mb="xs">
        {label}
      </Text>
      {payload.map((entry: any, index: number) => (
        <Group key={index} gap="xs">
          <div
            style={{
              width: 12,
              height: 12,
              backgroundColor: entry.color,
              borderRadius: "50%",
            }}
          />
          <Text size="sm">
            {entry.name}: <strong>{entry.value}</strong>
          </Text>
        </Group>
      ))}
    </Card>
  );
}
```

#### Chart Accessibility

- Always provide alternative data tables (`.sr-only`)
- Include proper ARIA labels and descriptions
- Ensure keyboard navigation for interactive charts
- Provide high contrast colors (minimum 3:1 for data points)
- Test with screen readers and color blindness simulators

#### Responsive Chart Sizing

```tsx
// Breakpoint-based chart sizing
const chartConfig = {
  mobile: {
    height: 200,
    showLegend: false,
    dataPointCount: 7, // One week
  },
  tablet: {
    height: 300,
    showLegend: true,
    dataPointCount: 14, // Two weeks
  },
  desktop: {
    height: 400,
    showLegend: true,
    dataPointCount: 30, // One month
  },
};
```

---

### 2.4 Trend Indicators

Visual indicators showing metric changes over time with color coding and directional cues.

**Use Cases:** Metric comparisons, performance tracking, health indicators

#### Pattern Implementation

```tsx
import { Badge, Group, Text } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown, IconMinus } from '@tabler/icons-react';

type TrendDirection = 'up' | 'down' | 'neutral';

interface TrendIndicatorProps {
  value: string; // e.g., "+12.5%"
  direction: TrendDirection;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TrendIndicator({
  value,
  direction,
  label,
  size = 'md'
}: TrendIndicatorProps) {
  const config = {
    up: {
      color: 'green' as const,
      icon: IconTrendingUp,
      label: 'Positive trend',
    },
    down: {
      color: 'red' as const,
      icon: IconTrendingDown,
      label: 'Negative trend',
    },
    neutral: {
      color: 'gray' as const,
      icon: IconMinus,
      label: 'No change',
    },
  };

  const { color, icon: Icon, label: defaultLabel } = config[direction];

  const sizeStyles = {
    sm: { iconSize: 14, textSize: 'xs' },
    md: { iconSize: 16, textSize: 'sm' },
    lg: { iconSize: 20, textSize: 'md' },
  }[size];

  return (
    <Badge
      color={color}
      variant="light"
      leftSection={<Icon size={sizeStyles.iconSize} />}
      aria-label={label || defaultLabel}
    >
      <Text size={sizeStyles.textSize} fw={500}>
        {value}
      </Text>
    </Badge>
  );
}

// Usage examples
<TrendIndicator value="+12.5%" direction="up" label="Increased from last period" />
<TrendIndicator value="-3.2%" direction="down" label="Decreased from last period" />
<TrendIndicator value="0%" direction="neutral" label="No change" />
```

#### Accessibility for Trends

- Never rely on color alone; always include text labels
- Use aria-label to provide context for screen readers
- Include directional icons in addition to color
- Provide baseline values for comparison

---

## 3. Form Patterns

### 3.1 Multi-Step Wizards

Guided multi-step forms with progress tracking, validation, and the ability to review before submission.

**Use Cases:** Insight creation, connector configuration, report generation

#### Pattern Implementation

```tsx
import { Stepper, Button, Group, Stack, Container } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState } from "react";

interface WizardStep {
  label: string;
  description: string;
  component: React.ComponentType<{
    form: any;
    onNext: () => void;
    onPrevious: () => void;
  }>;
}

export function MultiStepWizard({ steps }: { steps: WizardStep[] }) {
  const [active, setActive] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);

  const form = useForm({
    validateInputOnChange: true,
    initialValues: {
      // Form fields based on your use case
    },
    validate: {
      // Validation rules
    },
  });

  const nextStep = () => {
    const validation = form.validate();
    if (validation.hasErrors) {
      return; // Don't proceed if validation fails
    }

    setCompleted((current) => [...current, active]);
    setActive((current) => (current < steps.length - 1 ? current + 1 : current));
  };

  const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

  const CurrentStep = steps[active].component;

  return (
    <Container size="sm">
      <Stack gap="xl">
        {/* Stepper header */}
        <Stepper active={active} onStepClick={setActive} allowNextStepsSelect={false}>
          {steps.map((step, index) => (
            <Stepper.Step
              key={index}
              label={step.label}
              description={step.description}
              completed={completed.includes(index)}
            >
              {active === index && (
                <Stack gap="md" mt="xl">
                  <CurrentStep form={form} onNext={nextStep} onPrevious={prevStep} />
                </Stack>
              )}
            </Stepper.Step>
          ))}
        </Stepper>

        {/* Navigation buttons */}
        <Group justify="flex-end" mt="xl">
          {active > 0 && (
            <Button variant="default" onClick={prevStep}>
              Previous
            </Button>
          )}
          {active < steps.length - 1 ? (
            <Button onClick={nextStep}>Next</Button>
          ) : (
            <Button
              onClick={() => {
                const validation = form.validate();
                if (!validation.hasErrors) {
                  // Submit form
                  console.log(form.values);
                }
              }}
            >
              Complete
            </Button>
          )}
        </Group>
      </Stack>
    </Container>
  );
}

// Example step component
function InsightConfigStep({
  form,
  onNext,
  onPrevious,
}: {
  form: any;
  onNext: () => void;
  onPrevious: () => void;
}) {
  return (
    <Stack gap="md">
      <TextInput
        label="Insight Name"
        placeholder="Enter a descriptive name"
        {...form.getInputProps("name")}
      />
      <Textarea
        label="Description"
        placeholder="What insights will this provide?"
        {...form.getInputProps("description")}
      />
      <MultiSelect
        label="Platforms"
        data={["Meta", "GA4", "GSC", "GBP", "TikTok"]}
        {...form.getInputProps("platforms")}
      />
    </Stack>
  );
}
```

#### Wizard Accessibility

- Use semantic `<fieldset>` and `<legend>` for step grouping
- Announce step changes to screen readers
- Maintain form state between steps
- Provide summary review before final submission
- Allow users to navigate back and correct errors

---

### 3.2 Validation and Error Handling

Comprehensive form validation with inline error messages, real-time feedback, and clear error recovery paths.

**Use Cases:** All form inputs, data entry, configuration screens

#### Pattern Implementation

```tsx
import { TextInput, PasswordInput, Text, Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconX } from "@tabler/icons-react";

interface FormFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
  children: (field: any) => React.ReactNode;
}

export function FormField({ label, description, required, error, children }: FormFieldProps) {
  return (
    <Box mb="md">
      <Text size="sm" fw={500} mb="xs">
        {label}
        {required && (
          <Text span c="red">
            *
          </Text>
        )}
      </Text>
      {description && (
        <Text size="xs" c="dimmed" mb="xs">
          {description}
        </Text>
      )}
      {children(error)}
      {error && (
        <Text size="xs" c="red" mt="xs">
          <Group gap="xs">
            <IconX size="0.8rem" />
            {error}
          </Group>
        </Text>
      )}
    </Box>
  );
}

// Usage with validation
export function ValidatedForm() {
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    validate: {
      email: (value) => {
        if (!value) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Invalid email address";
        }
        return null;
      },
      password: (value) => {
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        return null;
      },
      confirmPassword: (value, values) => {
        if (value !== values.password) return "Passwords do not match";
        return null;
      },
    },
  });

  return (
    <form onSubmit={form.onSubmit((values) => console.log(values))}>
      <FormField
        label="Email"
        required
        description="We'll send your report to this address"
        error={form.errors.email}
      >
        {(error) => (
          <TextInput
            placeholder="your.email@example.com"
            {...form.getInputProps("email")}
            error={!!error}
            aria-invalid={!!error}
            aria-describedby={error ? "email-error" : "email-hint"}
          />
        )}
      </FormField>

      <FormField label="Password" required error={form.errors.password}>
        {(error) => (
          <PasswordInput
            placeholder="Enter a secure password"
            {...form.getInputProps("password")}
            error={!!error}
            aria-invalid={!!error}
          />
        )}
      </FormField>

      <FormField label="Confirm Password" required error={form.errors.confirmPassword}>
        {(error) => (
          <PasswordInput
            placeholder="Confirm your password"
            {...form.getInputProps("confirmPassword")}
            error={!!error}
            aria-invalid={!!error}
          />
        )}
      </FormField>

      <Button type="submit" fullWidth mt="md">
        Create Account
      </Button>
    </form>
  );
}
```

#### Validation Best Practices

- **Real-time validation:** Validate on blur for immediate feedback
- **Inline errors:** Show errors below related fields
- **Clear messages:** Explain what's wrong and how to fix it
- **Visual cues:** Use color, icons, and text for errors
- **Success indicators:** Show when fields are valid
- **ARIA attributes:** Use `aria-invalid`, `aria-describedby`, `aria-errormessage`

---

### 3.3 Help Text and Tooltips

Contextual help and documentation that provides guidance without cluttering the interface.

**Use Cases:** Complex form fields, configuration options, feature explanations

#### Pattern Implementation

```tsx
import { Tooltip, Text, Group, Popover, Stack } from "@mantine/core";
import { IconHelpCircle, IconInfoCircle } from "@tabler/icons-react";

interface HelpTextProps {
  label: string;
  helpText?: string;
  tooltipContent?: React.ReactNode;
  children: React.ReactNode;
}

export function FieldWithHelp({ label, helpText, tooltipContent, children }: HelpTextProps) {
  return (
    <Stack gap="xs">
      <Group gap="xs">
        <Text size="sm" fw={500}>
          {label}
        </Text>
        {tooltipContent && (
          <Tooltip label={tooltipContent} multiline width={250} position="top" withArrow>
            <IconInfoCircle
              size="0.9rem"
              style={{ cursor: "help" }}
              color="var(--mantine-color-blue-6)"
            />
          </Tooltip>
        )}
      </Group>
      {helpText && (
        <Text size="xs" c="dimmed">
          {helpText}
        </Text>
      )}
      {children}
    </Stack>
  );
}

// Rich tooltip with examples
export function RichHelpTooltip({ content, examples }: { content: string; examples?: string[] }) {
  return (
    <Popover width={300} position="bottom" withArrow shadow="md">
      <Popover.Target>
        <IconHelpCircle
          size="1rem"
          style={{ cursor: "help" }}
          color="var(--mantine-color-blue-6)"
        />
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="sm">
          <Text size="sm">{content}</Text>
          {examples && (
            <>
              <Text size="xs" fw={500}>
                Examples:
              </Text>
              <Stack gap="xs">
                {examples.map((example, index) => (
                  <Text key={index} size="xs" c="dimmed">
                    • {example}
                  </Text>
                ))}
              </Stack>
            </>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

// Usage examples
<FieldWithHelp
  label="Metric Threshold"
  helpText="Alert when metric exceeds this value"
  tooltipContent="Set the threshold value that will trigger alerts. For example, set 100 to be notified when impressions exceed 100."
>
  <NumberInput placeholder="Enter threshold" />
</FieldWithHelp>;
```

---

### 3.4 Save/Discard/Cancel Actions

Consistent action button patterns for forms with clear visual hierarchy and keyboard shortcuts.

**Use Cases:** All forms, configuration panels, edit modals

#### Pattern Implementation

```tsx
import { Button, Group, Stack, Text, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";

export function FormActions({
  onSave,
  onDiscard,
  onCancel,
  isDirty,
  isValid,
  isSaving,
}: {
  onSave: () => void;
  onDiscard?: () => void;
  onCancel?: () => void;
  isDirty: boolean;
  isValid: boolean;
  isSaving?: boolean;
}) {
  const [showDiscardConfirm, { open: openDiscard, close: closeDiscard }] = useDisclosure(false);

  const handleDiscard = () => {
    if (isDirty && onDiscard) {
      openDiscard();
    } else if (onDiscard) {
      onDiscard();
    }
  };

  return (
    <>
      <Group justify="flex-end" mt="xl">
        {/* Cancel button (secondary) */}
        {onCancel && (
          <Button variant="default" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
        )}

        {/* Discard button (tertiary, warning) */}
        {onDiscard && (
          <Button
            variant="light"
            color="orange"
            onClick={handleDiscard}
            disabled={!isDirty || isSaving}
          >
            Discard Changes
          </Button>
        )}

        {/* Save button (primary) */}
        <Button
          onClick={onSave}
          disabled={!isValid || !isDirty || isSaving}
          loading={isSaving}
          type="submit"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </Group>

      {/* Discard confirmation modal */}
      <Modal opened={showDiscardConfirm} onClose={closeDiscard} title="Discard Changes?" centered>
        <Stack gap="md">
          <Text>
            You have unsaved changes that will be lost if you discard them. Are you sure you want to
            continue?
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeDiscard}>
              Keep Editing
            </Button>
            <Button
              color="red"
              onClick={() => {
                onDiscard();
                closeDiscard();
              }}
            >
              Discard Changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

// Keyboard shortcuts
export function useFormShortcuts({
  onSave,
  onCancel,
}: {
  onSave: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        onSave();
      }
      // Escape to cancel
      if (e.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onSave, onCancel]);
}

// Usage
function MyForm() {
  const form = useForm({
    /* ... */
  });

  return (
    <form onSubmit={form.onSubmit((values) => console.log(values))}>
      {/* Form fields */}

      <FormActions
        onSave={() => form.onSubmit((values) => saveForm(values))()}
        onDiscard={() => form.reset()}
        onCancel={() => navigate(-1)}
        isDirty={form.isDirty()}
        isValid={!form.hasErrors}
        isSaving={isSubmitting}
      />
    </form>
  );
}
```

#### Action Button Hierarchy

1. **Primary:** Save, Submit, Confirm (solid color, prominent)
2. **Secondary:** Cancel, Close (default variant)
3. **Tertiary:** Discard, Reset (light variant, warning color)
4. **Destructive:** Delete, Remove (red, requires confirmation)

---

## 4. Feedback Patterns

### 4.1 Loading States (Skeleton Screens)

Skeleton screens that mirror content structure for perceived performance improvements.

**Use Cases:** Page loads, data fetching, async operations

#### Pattern Implementation

```tsx
import { Skeleton, Stack, Group, Card } from "@mantine/core";

export function MetricCardSkeleton() {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="xs">
        <Skeleton height={16} width="60%" />
        <Skeleton height={32} width="40%" />
        <Skeleton height={20} width="80%" />
      </Stack>
    </Card>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <Stack gap="sm">
      {/* Header skeleton */}
      <Group gap="sm">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height={20} width={150} />
        ))}
      </Group>
      {/* Row skeletons */}
      {Array.from({ length: rows }).map((_, i) => (
        <Group key={i} gap="sm">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} height={16} width={100 + Math.random() * 100} />
          ))}
        </Group>
      ))}
    </Stack>
  );
}

export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Skeleton height={24} width="40%" />
        <Skeleton height={height} width="100%" />
      </Stack>
    </Card>
  );
}

// Usage
function DashboardSkeleton() {
  return (
    <Stack gap="lg">
      <Group gap="lg">
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
        <MetricCardSkeleton />
      </Group>
      <ChartSkeleton />
      <TableSkeleton rows={10} columns={5} />
    </Stack>
  );
}
```

#### Skeleton Best Practices

- **Match content structure:** Skeleton should mirror final layout
- **Animate gently:** Use subtle pulse or shimmer effects
- **Load progressively:** Show skeleton for 200-1000ms maximum
- **Accessibility:** Add `aria-busy="true"` and `aria-label="Loading"`

---

### 4.2 Success/Error Toasts

Non-intrusive notifications for system events, actions, and alerts.

**Use Cases:** Form submissions, API responses, system alerts

#### Pattern Implementation

```tsx
import { notifications, NotificationProps } from "@mantine/notifications";
import { IconCheck, IconX, IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";

export function showSuccess(message: string, options?: Partial<NotificationProps>) {
  return notifications.show({
    title: "Success",
    message,
    color: "green",
    icon: <IconCheck size="1.2rem" />,
    autoClose: 4000,
    ...options,
  });
}

export function showError(message: string, options?: Partial<NotificationProps>) {
  return notifications.show({
    title: "Error",
    message,
    color: "red",
    icon: <IconX size="1.2rem" />,
    autoClose: false, // Persistent for errors
    withCloseButton: true,
    ...options,
  });
}

export function showWarning(message: string, options?: Partial<NotificationProps>) {
  return notifications.show({
    title: "Warning",
    message,
    color: "yellow",
    icon: <IconAlertTriangle size="1.2rem" />,
    autoClose: 6000,
    ...options,
  });
}

export function showInfo(message: string, options?: Partial<NotificationProps>) {
  return notifications.show({
    title: "Information",
    message,
    color: "blue",
    icon: <IconInfoCircle size="1.2rem" />,
    autoClose: 5000,
    ...options,
  });
}

// Usage with actions
export function showActionableError(message: string, actionLabel: string, onAction: () => void) {
  return notifications.show({
    title: "Error",
    message,
    color: "red",
    icon: <IconX size="1.2rem" />,
    autoClose: false,
    withCloseButton: true,
    action: {
      label: actionLabel,
      onClick: () => {
        onAction();
        notifications.close(notificationId);
      },
    },
  });
}

// Example usage
function handleSubmit() {
  try {
    await createInsight(data);
    showSuccess("Insight created successfully", {
      message: "Your insight is now configured and will generate reports automatically.",
    });
  } catch (error) {
    showError("Failed to create insight", {
      message: error.message,
      action: {
        label: "Retry",
        onClick: () => handleSubmit(),
      },
    });
  }
}
```

#### Toast Guidelines

- **Success:** Auto-dismiss after 3-5s, green color
- **Error:** Persistent, red color, include retry action
- **Warning:** Auto-dismiss after 5-6s, yellow color
- **Info:** Auto-dismiss after 4-5s, blue color
- **Position:** Top-right (LTR), top-left (RTL)
- **Limit:** Maximum 3-4 toasts visible at once

---

### 4.3 Empty States

Friendly empty state patterns with clear guidance and next steps.

**Use Cases:** No data available, first-time users, empty lists

#### Pattern Implementation

```tsx
import { Stack, Text, Title, Button, Group, Center } from "@mantine/core";
import { IconDatabase, IconPlus, IconPlug, IconChartBar } from "@tabler/icons-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <Center py="xl">
      <Stack align="center" gap="md" maw={400} ta="center">
        {icon && <div style={{ fontSize: 48, opacity: 0.5 }}>{icon}</div>}
        <Title order={3}>{title}</Title>
        <Text c="dimmed">{description}</Text>
        {action && secondaryAction ? (
          <Group gap="sm">
            <Button variant="default" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
            <Button onClick={action.onClick}>{action.label}</Button>
          </Group>
        ) : action ? (
          <Button onClick={action.onClick}>{action.label}</Button>
        ) : null}
      </Stack>
    </Center>
  );
}

// Predefined empty states
export const EmptyStates = {
  noInsights: () => (
    <EmptyState
      icon={<IconChartBar size="3rem" />}
      title="No insights yet"
      description="Create your first insight to start aggregating marketing data and generating AI-powered reports."
      action={{
        label: "Create Insight",
        onClick: () => navigate("/insights/create"),
      }}
    />
  ),

  noConnectors: () => (
    <EmptyState
      icon={<IconPlug size="3rem" />}
      title="No platforms connected"
      description="Connect your marketing platforms to start aggregating data for your insights."
      action={{
        label: "Connect Platform",
        onClick: () => navigate("/connectors/new"),
      }}
    />
  ),

  noReports: () => (
    <EmptyState
      icon={<IconDatabase size="3rem" />}
      title="No reports generated yet"
      description="Reports will appear here once your insights run on their scheduled times."
      action={{
        label: "Run Report Now",
        onClick: () => {
          /* Trigger immediate report */
        },
      }}
      secondaryAction={{
        label: "View Insights",
        onClick: () => navigate("/insights"),
      }}
    />
  ),

  noResults: (query: string) => (
    <EmptyState
      icon={<IconSearch size="3rem" />}
      title="No results found"
      description={`No results match "${query}". Try different keywords or filters.`}
      action={{
        label: "Clear Filters",
        onClick: () => {
          /* Clear filters */
        },
      }}
    />
  ),
};

// Usage
<Stack gap="xl">
  <InsightList />
  {insights.length === 0 && <EmptyStates.noInsights />}
</Stack>;
```

---

### 4.4 Progress Indicators

Visual feedback for long-running operations with progress tracking and cancellation options.

**Use Cases:** Report generation, data exports, bulk operations

#### Pattern Implementation

```tsx
import { Progress, Stack, Text, Group, Button, Loader } from "@mantine/core";
import { useState, useEffect } from "react";

export function LinearProgress({
  value,
  label,
  status,
  onCancel,
}: {
  value: number;
  label: string;
  status: "loading" | "success" | "error";
  onCancel?: () => void;
}) {
  const color = {
    loading: "blue",
    success: "green",
    error: "red",
  }[status];

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text size="sm">{label}</Text>
        <Text size="sm" c="dimmed">
          {Math.round(value)}%
        </Text>
      </Group>
      <Progress value={value} color={color} animated={status === "loading"} />
      {onCancel && status === "loading" && (
        <Group justify="flex-end">
          <Button variant="light" size="xs" onClick={onCancel}>
            Cancel
          </Button>
        </Group>
      )}
    </Stack>
  );
}

export function CircularProgress({
  size = 80,
  label,
  value,
}: {
  size?: number;
  label: string;
  value?: number;
}) {
  return (
    <Stack align="center" gap="md">
      <Loader size={size} type="dots" />
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      {value !== undefined && (
        <Text size="lg" fw={600}>
          {value}%
        </Text>
      )}
    </Stack>
  );
}

// Multi-step progress tracker
export function StepProgress({
  steps,
  currentStep,
}: {
  steps: Array<{ label: string; status: "pending" | "in-progress" | "completed" }>;
  currentStep: number;
}) {
  return (
    <Stack gap="md">
      <Text size="sm" fw={500}>
        Progress
      </Text>
      <Stack gap="xs">
        {steps.map((step, index) => {
          const Icon = {
            pending: IconCircle,
            "in-progress": IconLoader,
            completed: IconCheck,
          }[step.status];

          return (
            <Group key={index} gap="sm">
              <Icon
                size="1.2rem"
                color={
                  step.status === "completed"
                    ? "green"
                    : step.status === "in-progress"
                      ? "blue"
                      : "gray"
                }
              />
              <Text
                size="sm"
                c={step.status === "in-progress" ? "blue" : "dimmed"}
                fw={step.status === "in-progress" ? 500 : 400}
              >
                {step.label}
              </Text>
            </Group>
          );
        })}
      </Stack>
    </Stack>
  );
}

// Usage in report generation
function ReportGenerator() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus("success");
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <LinearProgress
      value={progress}
      label="Generating report..."
      status={status}
      onCancel={() => {
        /* Cancel operation */
      }}
    />
  );
}
```

---

## 5. Navigation Patterns

### 5.1 Breadcrumbs

Hierarchical navigation showing the current page's location in the site structure.

**Use Cases:** Deep pages, multi-level navigation, user orientation

#### Pattern Implementation

```tsx
import { Breadcrumbs, Anchor, Text } from "@mantine/core";
import { Link, useLocation } from "@tanstack/react-router";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function CustomBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <Breadcrumbs separator="/" separatorMargin="md" mt="md">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast || !item.href) {
          return (
            <Text key={index} size="sm" fw={500}>
              {item.label}
            </Text>
          );
        }

        return (
          <Anchor key={index} component={Link} to={item.href} size="sm">
            {item.label}
          </Anchor>
        );
      })}
    </Breadcrumbs>
  );
}

// Usage with automatic route detection
function RouteBreadcrumbs() {
  const pathname = useLocation().pathname;

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      const label = formatBreadcrumbLabel(segment);
      return { label, href };
    });
  }, [pathname]);

  return <CustomBreadcrumbs items={breadcrumbs} />;
}

// Helper function to format labels
function formatBreadcrumbLabel(segment: string): string {
  const labels: Record<string, string> = {
    dashboard: "Dashboard",
    insights: "Insights",
    connectors: "Connectors",
    reports: "Reports",
    settings: "Settings",
    new: "Create New",
    "[id]": "Details",
  };

  return labels[segment] || segment;
}
```

---

### 5.2 Tabs and Sub-Tabs

Organize related content into tabbed interfaces with keyboard navigation and persistent state.

**Use Cases:** Multi-section pages, category filters, view switching

#### Pattern Implementation

```tsx
import { Tabs } from "@mantine/core";
import { useRouter, useLocation } from "@tanstack/react-router";

interface TabConfig {
  label: string;
  value: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  badge?: number;
}

export function TabNavigation({ tabs }: { tabs: TabConfig[] }) {
  const router = useRouter();
  const pathname = useLocation().pathname;

  const activeTab = pathname.split("/").pop() || tabs[0].value;

  return (
    <Tabs
      value={activeTab}
      onChange={(value) => {
        const newUrl = pathname.replace(/\/[^/]*$/, `/${value}`);
        router.navigate({ to: newUrl });
      }}
      variant="outline"
      keepMounted={false}
    >
      <Tabs.List>
        {tabs.map((tab) => (
          <Tabs.Tab
            key={tab.value}
            value={tab.value}
            leftSection={tab.icon}
            rightSection={
              tab.badge && (
                <Badge size="xs" circle>
                  {tab.badge}
                </Badge>
              )
            }
          >
            {tab.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>

      {tabs.map((tab) => (
        <Tabs.Panel key={tab.value} value={tab.value}>
          {tab.content}
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}

// Usage example
function InsightDetail() {
  const tabs = [
    {
      label: "Overview",
      value: "overview",
      icon: <IconDashboard size="1rem" />,
      content: <InsightOverview />,
    },
    {
      label: "Metrics",
      value: "metrics",
      icon: <IconChartBar size="1rem" />,
      content: <InsightMetrics />,
    },
    {
      label: "Reports",
      value: "reports",
      icon: <IconFileText size="1rem" />,
      badge: 5,
      content: <InsightReports />,
    },
    {
      label: "Settings",
      value: "settings",
      icon: <IconSettings size="1rem" />,
      content: <InsightSettings />,
    },
  ];

  return <TabNavigation tabs={tabs} />;
}
```

#### Tab Accessibility

- Use semantic `<button>` elements for tab controls
- Implement keyboard navigation (arrow keys, Home/End)
- Maintain tab state across page navigation
- Provide `aria-selected` and `aria-controls` attributes
- Announce tab changes to screen readers

---

### 5.3 Tenant Switcher (for Agencies)

Dropdown component for agency users to switch between client companies quickly.

**Use Cases:** Agency multi-client management, tenant switching

#### Pattern Implementation

```tsx
import { Menu, Avatar, Text, Group, UnstyledButton, Divider } from "@mantine/core";
import { IconChevronDown, IconBuilding } from "@tabler/icons-react";

interface Tenant {
  id: string;
  name: string;
  logo?: string;
  color?: string;
}

export function TenantSwitcher({
  currentTenant,
  tenants,
  onSwitch,
}: {
  currentTenant: Tenant;
  tenants: Tenant[];
  onSwitch: (tenantId: string) => void;
}) {
  return (
    <Menu shadow="md" width={300} position="bottom-end">
      <Menu.Target>
        <UnstyledButton>
          <Group gap="xs">
            {currentTenant.logo ? (
              <Avatar src={currentTenant.logo} size="sm" radius="sm" />
            ) : (
              <Avatar color={currentTenant.color || "blue"} size="sm" radius="sm">
                <IconBuilding size="0.8rem" />
              </Avatar>
            )}
            <Text size="sm" fw={500}>
              {currentTenant.name}
            </Text>
            <IconChevronDown size="0.8rem" />
          </Group>
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>
          <Group justify="space-between">
            <Text size="xs">Switch Company</Text>
            <Text size="xs" c="dimmed">
              {tenants.length} total
            </Text>
          </Group>
        </Menu.Label>

        <Divider />

        {tenants.map((tenant) => (
          <Menu.Item
            key={tenant.id}
            leftSection={
              tenant.logo ? (
                <Avatar src={tenant.logo} size="xs" radius="sm" />
              ) : (
                <Avatar color={tenant.color || "blue"} size="xs" radius="sm">
                  {tenant.name.charAt(0)}
                </Avatar>
              )
            }
            onClick={() => onSwitch(tenant.id)}
            disabled={tenant.id === currentTenant.id}
            aria-current={tenant.id === currentTenant.id ? "page" : undefined}
          >
            <Text size="sm" fw={tenant.id === currentTenant.id ? 600 : 400}>
              {tenant.name}
            </Text>
          </Menu.Item>
        ))}

        <Divider />

        <Menu.Item
          leftSection={<IconPlus size="1rem" />}
          onClick={() => navigate("/companies/new")}
        >
          Add New Company
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

// Usage with context
function AgencyHeader() {
  const { currentTenant, tenants, switchTenant } = useTenantContext();

  return (
    <Group gap="md">
      <TenantSwitcher currentTenant={currentTenant} tenants={tenants} onSwitch={switchTenant} />
    </Group>
  );
}
```

---

### 5.4 Quick Actions Menu

Context-aware quick action buttons and menus for common tasks.

**Use Cases:** Dashboard shortcuts, quick create, common actions

#### Pattern Implementation

```tsx
import { Menu, Button, Group, Text, Stack } from "@mantine/core";
import { IconPlus, IconFileText, IconChartBar, IconPlug, IconDots } from "@tabler/icons-react";

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  description?: string;
}

export function QuickActionsMenu({ actions }: { actions: QuickAction[] }) {
  return (
    <Menu shadow="md" width={280} position="bottom-end">
      <Menu.Target>
        <Button leftSection={<IconPlus size="1rem" />}>Quick Actions</Button>
      </Menu.Target>

      <Menu.Dropdown>
        {actions.map((action, index) => (
          <Menu.Item key={index} leftSection={action.icon} onClick={action.onClick}>
            <Stack gap={0}>
              <Text size="sm" fw={500}>
                {action.label}
              </Text>
              {action.description && (
                <Text size="xs" c="dimmed">
                  {action.description}
                </Text>
              )}
            </Stack>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

// Predefined quick actions
export function DashboardQuickActions() {
  const actions = [
    {
      label: "Create Insight",
      icon: <IconChartBar size="1rem" />,
      description: "Configure a new marketing insight",
      onClick: () => navigate("/insights/create"),
    },
    {
      label: "Connect Platform",
      icon: <IconPlug size="1rem" />,
      description: "Add a new data source",
      onClick: () => navigate("/connectors/new"),
    },
    {
      label: "Generate Report",
      icon: <IconFileText size="1rem" />,
      description: "Run a report immediately",
      onClick: () => {
        /* Trigger report generation */
      },
    },
  ];

  return <QuickActionsMenu actions={actions} />;
}

// Floating action button for mobile
export function MobileFab({ actions }: { actions: QuickAction[] }) {
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <Affix position={{ bottom: 20, right: 20 }}>
      <Menu opened={opened} onChange={toggle} position="top" withArrow shadow="xl">
        <Menu.Target>
          <ActionIcon
            size="xl"
            radius="xl"
            color="blue"
            variant="filled"
            sx={{
              display: { base: "flex", md: "none" },
            }}
          >
            <IconPlus size="1.5rem" />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          {actions.map((action, index) => (
            <Menu.Item key={index} leftSection={action.icon} onClick={action.onClick}>
              {action.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </Affix>
  );
}
```

---

## 6. Action Patterns

### 6.1 Bulk Actions (Reports)

Select and perform actions on multiple items at once with clear feedback.

**Use Cases:** Bulk report operations, multi-item management

#### Pattern Implementation

```tsx
import { Table, Checkbox, Button, Menu, Stack, Text, Group } from "@mantine/core";
import { useState } from "react";

interface BulkActionsProps<T> {
  items: T[];
  onSelect: (selectedIds: string[]) => void;
  actions: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: (selectedIds: string[]) => void;
    requiresConfirm?: boolean;
    confirmMessage?: string;
  }>;
}

export function BulkActions<T extends { id: string }>({
  items,
  onSelect,
  actions,
}: BulkActionsProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(items.map((item) => item.id)));
    } else {
      setSelectedIds(new Set());
    }
    onSelect(checked ? items.map((item) => item.id) : []);
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
    onSelect(Array.from(newSelected));
  };

  const handleBulkAction = (action: (typeof actions)[0]) => {
    const selectedArray = Array.from(selectedIds);

    if (action.requiresConfirm) {
      setShowConfirm(action.label);
      // Show confirmation modal
      return;
    }

    action.onClick(selectedArray);
    setSelectedIds(new Set());
  };

  return (
    <Stack gap="md">
      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <Card
          padding="sm"
          withBorder
          sx={(theme) => ({
            backgroundColor: theme.colors.blue[0],
          })}
        >
          <Group justify="space-between">
            <Text size="sm">
              {selectedIds.size} {selectedIds.size === 1 ? "item" : "items"} selected
            </Text>
            <Group gap="xs">
              <Button
                variant="light"
                size="xs"
                onClick={() => {
                  setSelectedIds(new Set());
                  onSelect([]);
                }}
              >
                Clear
              </Button>
              <Menu shadow="md" position="bottom-end">
                <Menu.Target>
                  <Button size="xs">Actions</Button>
                </Menu.Target>
                <Menu.Dropdown>
                  {actions.map((action, index) => (
                    <Menu.Item
                      key={index}
                      leftSection={action.icon}
                      onClick={() => handleBulkAction(action)}
                    >
                      {action.label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        </Card>
      )}

      {/* Table with selection */}
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Checkbox
                aria-label="Select all items"
                checked={selectedIds.size === items.length}
                onChange={(e) => handleSelectAll(e.currentTarget.checked)}
              />
            </Table.Th>
            {/* Other headers */}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {items.map((item) => (
            <Table.Tr key={item.id}>
              <Table.Td>
                <Checkbox
                  checked={selectedIds.has(item.id)}
                  onChange={(e) => handleSelectItem(item.id, e.currentTarget.checked)}
                />
              </Table.Td>
              {/* Other cells */}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
}

// Usage
function ReportList() {
  const [reports, setReports] = useState<Report[]>([]);

  const bulkActions = [
    {
      label: "Download PDF",
      icon: <IconDownload size="1rem" />,
      onClick: (selectedIds: string[]) => {
        downloadReports(selectedIds, "pdf");
      },
    },
    {
      label: "Download Excel",
      icon: <IconFileSpreadsheet size="1rem" />,
      onClick: (selectedIds: string[]) => {
        downloadReports(selectedIds, "excel");
      },
    },
    {
      label: "Delete",
      icon: <IconTrash size="1rem" />,
      onClick: (selectedIds: string[]) => {
        deleteReports(selectedIds);
      },
      requiresConfirm: true,
      confirmMessage: `Are you sure you want to delete ${selectedIds.length} reports?`,
    },
  ];

  return (
    <BulkActions
      items={reports}
      onSelect={(selectedIds) => console.log("Selected:", selectedIds)}
      actions={bulkActions}
    />
  );
}
```

---

### 6.2 Confirm Destructive Actions

Prevent accidental data loss with confirmation dialogs and clear warnings.

**Use Cases:** Delete operations, irreversible changes, data removal

#### Pattern Implementation

```tsx
import { Modal, Button, Stack, Text, Group, Alert } from "@mantine/core";
import { IconAlertTriangle, IconTrash } from "@tabler/icons-react";

interface ConfirmDialogProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: "danger" | "warning";
  itemName?: string;
}

export function ConfirmDialog({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  type = "danger",
  itemName,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title={title} centered>
      <Stack gap="md">
        {type === "danger" && (
          <Alert icon={<IconAlertTriangle size="1rem" />} color="red" variant="light">
            This action cannot be undone.
          </Alert>
        )}

        <Text size="sm">
          {message}
          {itemName && (
            <Text span fw={600}>
              {" "}
              "{itemName}"
            </Text>
          )}
        </Text>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            color={type === "danger" ? "red" : "orange"}
            onClick={handleConfirm}
            leftSection={type === "danger" && <IconTrash size="1rem" />}
          >
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

// Usage hook
export function useConfirmDialog() {
  const [opened, { open, close }] = useDisclosure(false);
  const [config, setConfig] = useState<Partial<ConfirmDialogProps>>({});

  const confirm = (props: Partial<ConfirmDialogProps>) => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        ...props,
        onConfirm: () => {
          props.onConfirm?.();
          resolve(true);
        },
        onClose: () => {
          props.onClose?.();
          close();
          resolve(false);
        },
      });
      open();
    });
  };

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      opened={opened}
      onClose={close}
      onConfirm={() => config.onConfirm?.()}
      {...config}
    />
  );

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
}

// Usage in component
function DeleteButton({ itemName, onDelete }: { itemName: string; onDelete: () => void }) {
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const handleClick = async () => {
    const confirmed = await confirm({
      title: "Delete Insight?",
      message:
        "Are you sure you want to delete this insight? All associated data will be permanently removed.",
      confirmLabel: "Delete",
      type: "danger",
      itemName,
    });

    if (confirmed) {
      onDelete();
    }
  };

  return (
    <>
      <Button color="red" variant="light" onClick={handleClick}>
        Delete
      </Button>
      <ConfirmDialog />
    </>
  );
}
```

---

### 6.3 Async Action Feedback

Provide clear feedback for asynchronous operations with loading states and progress tracking.

**Use Cases:** API calls, data uploads, report generation

#### Pattern Implementation

```tsx
import { Button, Group, Stack, Text } from "@mantine/core";
import { useState, useTransition } from "react";

interface AsyncActionProps {
  action: () => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  children: React.ReactNode;
  loadingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
}

export function AsyncAction({
  action,
  onSuccess,
  onError,
  children,
  loadingLabel = "Processing...",
  successLabel = "Success!",
  errorLabel = "Error",
}: AsyncActionProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setStatus("loading");
    setError(null);

    startTransition(async () => {
      try {
        await action();
        setStatus("success");
        onSuccess?.();
        setTimeout(() => setStatus("idle"), 2000);
      } catch (err) {
        setStatus("error");
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        onError?.(err as Error);
      }
    });
  };

  return (
    <Stack gap="xs">
      <Button
        onClick={handleClick}
        disabled={isPending}
        loading={status === "loading"}
        loaderProps={{ type: "dots" }}
      >
        {status === "success" ? successLabel : children}
      </Button>

      {status === "error" && error && (
        <Text size="xs" c="red">
          {errorLabel}: {error}
        </Text>
      )}
    </Stack>
  );
}

// Usage with progress tracking
export function AsyncActionWithProgress({
  action,
  onProgress,
  children,
}: {
  action: (progressCallback: (progress: number) => void) => Promise<void>;
  onProgress?: (progress: number) => void;
  children: React.ReactNode;
}) {
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsRunning(true);
    setError(null);
    setProgress(0);

    try {
      await action((p) => {
        setProgress(p);
        onProgress?.(p);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Stack gap="xs">
      <Button onClick={handleClick} disabled={isRunning}>
        {children}
      </Button>

      {isRunning && <Progress value={progress} size="sm" animated />}

      {error && (
        <Text size="xs" c="red">
          Error: {error}
        </Text>
      )}
    </Stack>
  );
}

// Usage
function ReportGenerator() {
  const handleGenerate = async () => {
    await generateReport();
  };

  return (
    <AsyncAction
      action={handleGenerate}
      onSuccess={() => showSuccess("Report generated successfully")}
      onError={(error) => showError("Failed to generate report", error.message)}
    >
      Generate Report
    </AsyncAction>
  );
}
```

---

### 6.4 Keyboard Shortcuts

Global keyboard shortcuts for power users and improved accessibility.

**Use Cases:** Quick navigation, common actions, accessibility

#### Pattern Implementation

```tsx
import { useEffect, useCallback } from "react";
import { useHotkeys } from "@mantine/hooks";

interface ShortcutConfig {
  keys: string;
  callback: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (matchShortcut(e, shortcut.keys)) {
          e.preventDefault();
          shortcut.callback();
          return;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

function matchShortcut(event: KeyboardEvent, keys: string): boolean {
  const parts = keys.toLowerCase().split("+");
  const key = parts.pop();
  const modifiers = parts;

  // Check modifiers
  const hasMod =
    modifiers.includes("mod") || modifiers.includes("cmd") || modifiers.includes("ctrl");
  const hasShift = modifiers.includes("shift");
  const hasAlt = modifiers.includes("alt");

  if (hasMod && !(event.metaKey || event.ctrlKey)) return false;
  if (hasShift && !event.shiftKey) return false;
  if (hasAlt && !event.altKey) return false;
  if (!hasMod && (event.metaKey || event.ctrlKey)) return false;

  // Check key
  return event.key.toLowerCase() === key;
}

// Predefined shortcuts for AgenticVerdict
export function useGlobalShortcuts() {
  const navigate = useNavigate();

  const shortcuts = [
    {
      keys: "mod+k",
      description: "Open command palette",
      callback: () => openCommandPalette(),
    },
    {
      keys: "mod+/",
      description: "Show keyboard shortcuts",
      callback: () => openShortcutsModal(),
    },
    {
      keys: "g+d",
      description: "Go to dashboard",
      callback: () => navigate("/dashboard"),
    },
    {
      keys: "g+i",
      description: "Go to insights",
      callback: () => navigate("/insights"),
    },
    {
      keys: "g+r",
      description: "Go to reports",
      callback: () => navigate("/reports"),
    },
    {
      keys: "mod+s",
      description: "Save current form",
      callback: () => submitCurrentForm(),
    },
    {
      keys: "escape",
      description: "Close modal or cancel",
      callback: () => closeModal(),
    },
  ];

  useKeyboardShortcuts(shortcuts);
  return shortcuts;
}

// Keyboard shortcuts modal
export function KeyboardShortcutsModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const shortcuts = useGlobalShortcuts();

  return (
    <Modal opened={opened} onClose={onClose} title="Keyboard Shortcuts">
      <Stack gap="sm">
        {shortcuts.map((shortcut, index) => (
          <Group key={index} justify="space-between">
            <Text size="sm">{shortcut.description}</Text>
            <Kbd>{shortcut.keys}</Kbd>
          </Group>
        ))}
      </Stack>
    </Modal>
  );
}

// Mantine hook alternative
function MyComponent() {
  useHotkeys([
    ["mod+K", () => console.log("Command palette")],
    ["escape", () => console.log("Close")],
  ]);

  return <div>Content</div>;
}
```

---

## 7. RTL Patterns

### 7.1 Layout Mirroring

Automatic layout mirroring for RTL languages with proper spacing and alignment.

**Use Cases:** Arabic UI, Hebrew UI, any RTL language

#### Pattern Implementation

```tsx
import { MantineProvider, createTheme, CSSObject } from "@mantine/core";

// RTL theme configuration
const rtlTheme = createTheme({
  dir: "rtl",
  fontFamily: "Cairo, sans-serif", // Arabic-friendly font
  headings: {
    fontFamily: "Cairo, sans-serif",
  },
});

export function RTLProvider({
  children,
  direction,
}: {
  children: React.ReactNode;
  direction: "rtl" | "ltr";
}) {
  return (
    <MantineProvider
      theme={direction === "rtl" ? rtlTheme : undefined}
      dir={direction}
      withNormalizeCSS
      withGlobalStyles
    >
      {children}
    </MantineProvider>
  );
}

// Usage with language detection
function App() {
  const { direction } = useLanguage(); // 'rtl' or 'ltr'

  return (
    <RTLProvider direction={direction}>
      <AppShell>{/* Content automatically mirrors */}</AppShell>
    </RTLProvider>
  );
}

// Manual RTL adjustments when needed
const rtlStyles: CSSObject = {
  '&[data-mantine-dir="rtl"]': {
    // Override specific styles for RTL
    textAlign: "right",
    "& .special-class": {
      marginLeft: 0,
      marginRight: "1rem",
    },
  },
};
```

---

### 7.2 Icon and Directional Asset Handling

Automatic icon flipping and directional asset management for RTL layouts.

**Use Cases:** Arrows, chevrons, directional indicators

#### Pattern Implementation

```tsx
import { Icon, createIcons } from "@tabler/icons-react";

// Automatically flip directional icons in RTL
export function DirectionalIcon({ icon: Icon, size = 16 }: { icon: any; size?: number }) {
  const { dir } = useLanguage();

  const shouldFlip = ["ArrowRight", "ChevronRight", "ArrowLeft", "ChevronLeft"].some((name) =>
    Icon.displayName?.includes(name),
  );

  return (
    <Icon
      size={size}
      style={{
        transform: dir === "rtl" && shouldFlip ? "scaleX(-1)" : undefined,
      }}
    />
  );
}

// RTL-aware icon components
export const RTLAwareIcons = {
  ArrowForward: (props: any) => <DirectionalIcon icon={IconArrowRight} {...props} />,
  ArrowBack: (props: any) => <DirectionalIcon icon={IconArrowLeft} {...props} />,
  ChevronNext: (props: any) => <DirectionalIcon icon={IconChevronRight} {...props} />,
  ChevronPrev: (props: any) => <DirectionalIcon icon={IconChevronLeft} {...props} />,
};

// Usage
function Pagination() {
  return (
    <Group>
      <Button variant="light">
        <RTLAwareIcons.ArrowBack size="1rem" />
        Previous
      </Button>
      <Button variant="light">
        Next
        <RTLAwareIcons.ArrowForward size="1rem" />
      </Button>
    </Group>
  );
}
```

---

### 7.3 Text Input RTL Considerations

Proper text input behavior for RTL languages with correct alignment and placeholder handling.

**Use Cases:** Form inputs, search fields, text areas

#### Pattern Implementation

```tsx
import { TextInput, Textarea } from "@mantine/core";
import { useDirection } from "@mantine/hooks";

// RTL-aware text input
export function LocalizedTextInput(props: any) {
  const direction = useDirection();

  return (
    <TextInput
      {...props}
      styles={{
        input: {
          textAlign: direction === "rtl" ? "right" : "left",
        },
      }}
    />
  );
}

// RTL-aware textarea
export function LocalizedTextarea(props: any) {
  const direction = useDirection();

  return (
    <Textarea
      {...props}
      styles={{
        input: {
          textAlign: direction === "rtl" ? "right" : "left",
        },
      }}
    />
  );
}

// Mixed LTR/RTL content handling
export function BidiTextInput({
  type = "text",
  ...props
}: {
  type?: "text" | "email" | "url";
  [key: string]: any;
}) {
  const { direction } = useLanguage();

  // Auto-detect content direction
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const isRTL = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(value);

    // Auto-switch text alignment based on content
    event.target.style.textAlign = isRTL ? "right" : "left";

    props.onChange?.(event);
  };

  return <TextInput {...props} dir="auto" onChange={handleChange} />;
}
```

---

### 7.4 Chart RTL Adaptation

Proper chart and data visualization adaptation for RTL layouts.

**Use Cases:** Analytics charts, graphs, data visualizations

#### Pattern Implementation

```tsx
import { LineChart, Line, BarChart, Bar, XAxis, YAxis } from "recharts";
import { useDirection } from "@mantine/hooks";

export function RTLChart({
  data,
  type = "line",
  ...props
}: {
  data: any[];
  type?: "line" | "bar";
  [key: string]: any;
}) {
  const direction = useDirection();
  const isRTL = direction === "rtl";

  return (
    <div style={{ direction: isRTL ? "rtl" : "ltr" }}>
      {type === "line" ? (
        <LineChart data={data} {...props}>
          <XAxis dataKey="name" reversed={isRTL} />
          <YAxis orientation={isRTL ? "right" : "left"} />
          {/* Other chart components */}
        </LineChart>
      ) : (
        <BarChart data={data} {...props}>
          <XAxis dataKey="name" reversed={isRTL} />
          <YAxis orientation={isRTL ? "right" : "left"} />
          {/* Other chart components */}
        </BarChart>
      )}
    </div>
  );
}

// RTL-aware tooltip
function RTLTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;

  return (
    <Card dir="auto">
      <Text size="sm" fw={600} mb="xs">
        {label}
      </Text>
      {payload.map((entry: any, index: number) => (
        <Group key={index} gap="xs">
          <div
            style={{
              width: 12,
              height: 12,
              backgroundColor: entry.color,
              borderRadius: "50%",
            }}
          />
          <Text size="sm">
            {entry.name}: <strong>{entry.value}</strong>
          </Text>
        </Group>
      ))}
    </Card>
  );
}

// Usage
function ArabicDashboard() {
  const arabicData = [
    { name: "يناير", value: 100 },
    { name: "فبراير", value: 200 },
    { name: "مارس", value: 150 },
  ];

  return (
    <MantineProvider dir="rtl">
      <RTLChart data={arabicData} type="line" tooltip={<RTLTooltip />} />
    </MantineProvider>
  );
}
```

---

## Conclusion

This UI patterns specification provides a comprehensive foundation for building consistent, accessible, and responsive interfaces in AgenticVerdict. All patterns are built on Mantine v9 and support both LTR and RTL layouts from the ground up.

**Key Takeaways:**

1. **Consistency:** All patterns follow the same visual language and interaction model
2. **Accessibility:** Every pattern includes accessibility considerations and WCAG compliance
3. **Responsive:** Patterns adapt seamlessly across desktop, tablet, and mobile
4. **RTL Support:** Arabic and other RTL languages are fully supported
5. **Component-Based:** Patterns are implemented as reusable components

**Implementation Priority:**

1. **Phase 1 (Foundation):** Layout patterns, navigation patterns, feedback patterns
2. **Phase 2 (Data Display):** Data display patterns, chart visualization
3. **Phase 3 (Forms):** Form patterns, validation, multi-step wizards
4. **Phase 4 (Actions):** Action patterns, bulk operations, async feedback

**Next Steps:**

- Implement patterns as React components in the UI package
- Create Storybook stories for pattern documentation
- Establish pattern testing suite
- Conduct usability testing with real users
- Iterate based on feedback

---

**Document Status:** Complete  
**Last Updated:** 2026-04-11  
**Maintained By:** UI/UX Team  
**Version:** 1.0
