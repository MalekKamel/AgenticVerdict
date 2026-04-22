# UI Performance Optimization Guide: AgenticVerdict Analytics Platform

**Document Version:** 1.0  
**Date:** 2026-04-11  
**Status:** Active  
**Prepared For:** Development Team, Architecture Team

---

## Executive Summary

This guide provides comprehensive performance optimization strategies for the AgenticVerdict Next.js 15 + Mantine analytics platform. With performance targets of <2s page load time and <3s time to interactive on 3G connections, these optimizations are critical for user experience and platform scalability.

### Performance Targets

| Metric                       | Target         | Measurement Condition              |
| ---------------------------- | -------------- | ---------------------------------- |
| **Page Load Time**           | <2 seconds     | 3G connection (Fast 3G throttling) |
| **Time to Interactive**      | <3 seconds     | 3G connection (Fast 3G throttling) |
| **Initial Bundle Size**      | <500KB gzipped | Main JavaScript bundle             |
| **First Contentful Paint**   | <1.5 seconds   | Mobile device, 4G                  |
| **Largest Contentful Paint** | <2.5 seconds   | Mobile device, 4G                  |
| **Cumulative Layout Shift**  | <0.1           | All viewports                      |
| **First Input Delay**        | <100ms         | All interactions                   |

---

## 1. Component Lazy-Loading Strategies

### 1.1 Route-Based Code Splitting

Next.js 15 provides automatic code splitting for routes, but we can optimize further:

```typescript
// apps/frontend/src/app/[locale]/insights/page.tsx
import dynamic from 'next/dynamic';
import { Skeleton } from '@mantine/core';

// Lazy load heavy insight creation wizard
const InsightCreationWizard = dynamic(
  () => import('@/components/insights/InsightCreationWizard'),
  {
    loading: () => <InsightWizardSkeleton />,
    ssr: true, // Enable SSR for initial render
  }
);

// Lazy load chart components (client-only)
const AnalyticsChart = dynamic(
  () => import('@/components/charts/AnalyticsChart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Client-only for charts
  }
);
```

**Implementation Pattern:**

- Split at route level (automatic with Next.js App Router)
- Lazy load components >50KB
- Use skeleton screens for better perceived performance
- Enable SSR for content-critical components
- Disable SSR for interactive-only components

### 1.2 Component-Level Lazy Loading

For heavy UI components within routes:

```typescript
// apps/frontend/src/components/dashboard/Dashboard.tsx
import { lazy, Suspense } from 'react';

// Lazy load connector management
const ConnectorManager = lazy(() =>
  import('@/components/connectors/ConnectorManager')
);

// Lazy load report viewer
const ReportViewer = lazy(() =>
  import('@/components/reports/ReportViewer')
);

// Lazy load insight configuration
const InsightConfigurator = lazy(() =>
  import('@/components/insights/InsightConfigurator')
);

export function Dashboard() {
  return (
    <div>
      <Suspense fallback={<ConnectorManagerSkeleton />}>
        <ConnectorManager />
      </Suspense>

      <Suspense fallback={<ReportViewerSkeleton />}>
        <ReportViewer />
      </Suspense>
    </div>
  );
}
```

### 1.3 Dynamic Import Patterns

Pattern for conditionally loading components:

```typescript
// Load heavy admin components only for admins
const AdminPanel = dynamic(
  () => import('@/components/admin/AdminPanel'),
  {
    loading: () => <AdminPanelSkeleton />,
  }
);

// Load agency-specific features only for agency partners
const AgencyDashboard = dynamic(
  () => import('@/components/agency/AgencyDashboard'),
  {
    loading: () => <AgencyDashboardSkeleton />,
  }
);
```

### 1.4 Preloading Strategies

Strategic preloading for improved user experience:

```typescript
// apps/frontend/src/components/layout/AppShellLayout.tsx
import { useEffect } from 'react';

export function AppShellLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Preload components likely to be needed next
    const prefetchTimeout = setTimeout(() => {
      import('@/components/insights/InsightCreationWizard');
      import('@/components/reports/ReportViewer');
    }, 2000); // Start preloading after 2 seconds

    return () => clearTimeout(prefetchTimeout);
  }, []);

  return (
    <AppShell>
      {/* ... */}
    </AppShell>
  );
}
```

**Preloading Strategy:**

- Preload on hover for navigation items
- Preload after page load for likely next actions
- Use `priority` for critical above-the-fold content
- Defer preloading for low-priority components

---

## 2. Bundle Size Optimization

### 2.1 Tree Shaking Techniques

Ensure Mantine imports are tree-shakeable:

```typescript
// ❌ BAD: Imports entire library
import { Button, Card, TextInput } from "@mantine/core";

// ✅ GOOD: Tree-shakeable imports
import { Button } from "@mantine/core";
import { Card } from "@mantine/core";
import { TextInput } from "@mantine/core";

// ✅ EVEN BETTER: Use specific component imports
import { Button } from "@mantine/core/lib/Button";
import { Card } from "@mantine/core/lib/Card";
```

### 2.2 Mantine Import Analysis

Analyze and optimize Mantine imports:

```typescript
// apps/frontend/src/components/ui/index.ts
// Create optimized component exports

export { AppButton } from "./AppButton";
export { AppCard } from "./AppCard";
export { AppTextInput } from "./AppTextInput";

// Use barrel exports to ensure tree shaking
```

### 2.3 Analyzer Tools Setup

Setup bundle analysis in Next.js 15:

```javascript
// apps/frontend/next.config.ts
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig = {
  // ... existing config
};

module.exports = withBundleAnalyzer(nextConfig);
```

```json
// apps/frontend/package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}
```

### 2.4 Dependency Optimization

Optimize heavy dependencies:

```typescript
// ✅ Use date-fns instead of moment.js
import { format } from "date-fns";
import { arSA, enUS } from "date-fns/locale";

// ✅ Use lodash-es instead of lodash
import { debounce } from "lodash-es";

// ✅ Use specific recharts imports
import { LineChart } from "recharts/es6/components/LineChart";
```

**Current Dependency Analysis:**

- `@mantine/core`: ~150KB gzipped (acceptable)
- `react` + `react-dom`: ~130KB gzipped (standard)
- `next-intl`: ~20KB gzipped (necessary for i18n)
- `TanStack Store`: ~3KB gzipped (excellent choice)

### 2.5 Chunk Splitting Strategy

Configure webpack chunk splitting:

```javascript
// apps/frontend/next.config.ts
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          // Mantine vendor chunk
          mantine: {
            test: /[\\/]node_modules[\\/]@mantine[\\/]/,
            name: "mantine",
            priority: 10,
          },
          // Other vendor chunks
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: 5,
          },
          // Common components
          common: {
            minChunks: 2,
            priority: 0,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  },
};
```

---

## 3. Runtime Performance

### 3.1 Virtual Scrolling for Large Lists

Implement virtual scrolling for large data sets:

```typescript
// apps/frontend/src/components/data/VirtualizedList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualizedInsightList({ insights }: { insights: Insight[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: insights.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated row height
    overscan: 5, // Render 5 extra rows
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <InsightListItem
            key={virtualItem.key}
            insight={insights[virtualItem.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

### 3.2 Memoization Strategies

Strategic memoization for expensive components:

```typescript
// apps/frontend/src/components/dashboard/KPICard.tsx
import { memo } from 'react';

export const KPICard = memo(function KPICard({
  title,
  value,
  trend
}: KPICardProps) {
  return (
    <AppCard>
      <Text size="sm" c="gray.6">{title}</Text>
      <Text size="xl" fw={600}>{value}</Text>
      {trend && <TrendIndicator value={trend} />}
    </AppCard>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-renders
  return (
    prevProps.title === nextProps.title &&
    prevProps.value === nextProps.value &&
    prevProps.trend === nextProps.trend
  );
});
```

### 3.3 Debouncing/Throttling User Input

Optimize user interactions:

```typescript
// apps/frontend/src/components/search/SearchInput.tsx
import { useDebouncedValue } from '@mantine/hooks';
import { useEffect } from 'react';

export function SearchInput() {
  const [query, setQuery] = useState('');
  const [debounced] = useDebouncedValue(query, 300);

  useEffect(() => {
    if (debounced.length >= 2) {
      // Perform search with debounced value
      performSearch(debounced);
    }
  }, [debounced]);

  return (
    <TextInput
      value={query}
      onChange={(event) => setQuery(event.currentTarget.value)}
      placeholder="Search insights..."
    />
  );
}
```

### 3.4 Animation Performance

Prefer CSS animations over JavaScript:

```css
/* apps/frontend/src/app/animations.css */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in;
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}

/* Hardware acceleration for smooth animations */
.animate-gpu {
  will-change: transform;
  transform: translateZ(0);
}
```

**Animation Best Practices:**

- Use CSS transforms and opacity (60fps)
- Avoid animating width, height, or layout properties
- Use `will-change` sparingly for animations
- Prefer CSS animations over JavaScript
- Use `requestAnimationFrame` for JS animations

---

## 4. Design Token Delivery

### 4.1 CSS Variable vs JavaScript Token Delivery

For AgenticVerdict, use CSS variables for design tokens:

```typescript
// apps/frontend/src/components/Providers.tsx
import { createTheme, MantineProvider } from '@mantine/core';

const theme = createTheme({
  // Minimal JavaScript tokens
  primaryShade: { light: 8, dark: 7 },
  fontFamily: 'Inter, sans-serif',
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      {children}
    </MantineProvider>
  );
}
```

```css
/* apps/frontend/src/app/globals.css */
:root {
  /* Core design tokens as CSS variables */
  --av-color-primary: #228be6;
  --av-color-secondary: #748ffc;
  --av-spacing-xs: 0.25rem;
  --av-spacing-sm: 0.5rem;
  --av-spacing-md: 1rem;
  --av-spacing-lg: 1.5rem;
  --av-spacing-xl: 2rem;
  --av-radius-sm: 0.25rem;
  --av-radius-md: 0.5rem;
  --av-radius-lg: 1rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --av-color-primary: #339af0;
    --av-color-secondary: #91a7ff;
  }
}

/* RTL-aware spacing */
[dir="rtl"] {
  --av-spacing-start: var(--av-spacing-right);
  --av-spacing-end: var(--av-spacing-left);
}

[dir="ltr"] {
  --av-spacing-start: var(--av-spacing-left);
  --av-spacing-end: var(--av-spacing-right);
}
```

### 4.2 Token Injection Strategies

Inject design tokens efficiently:

```typescript
// apps/frontend/src/app/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
        {/* Inject critical CSS inline */}
        <style jsx global>{`
          :root {
            --av-color-primary: #228BE6;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 4.3 Theme Switching Performance

Optimize theme switching:

```typescript
// apps/frontend/src/components/layout/ColorSchemeToggle.tsx
import { useColorScheme } from '@mantine/hooks';

export function ColorSchemeToggle() {
  const [colorScheme, setColorScheme] = useColorScheme('auto');

  // Use requestAnimationFrame for smooth transitions
  const toggleColorScheme = () => {
    requestAnimationFrame(() => {
      setColorScheme(colorScheme === 'light' ? 'dark' : 'light');
    });
  };

  return (
    <ActionIcon onClick={toggleColorScheme} variant="subtle">
      {colorScheme === 'light' ? <IconSun /> : <IconMoon />}
    </ActionIcon>
  );
}
```

### 4.4 Multi-Brand Token Optimization

For agency partners with white-labeling:

```typescript
// apps/frontend/src/components/Providers.tsx
export function Providers({
  children,
  brandConfig
}: {
  children: ReactNode;
  brandConfig?: BrandConfig;
}) {
  const theme = createTheme({
    // Base theme
    primaryShade: { light: 8, dark: 7 },
  });

  const brandTheme = brandConfig ? createBrandTheme(brandConfig) : {};

  return (
    <MantineProvider theme={{ ...theme, ...brandTheme }}>
      <style jsx global>{`
        :root {
          ${brandConfig ? generateBrandCSSVars(brandConfig) : ''}
        }
      `}</style>
      {children}
    </MantineProvider>
  );
}
```

---

## 5. Monitoring and Measurement

### 5.1 Core Web Vitals Tracking

Implement Core Web Vitals monitoring:

```typescript
// apps/frontend/src/app/[locale]/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function LocaleLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      {children}
      <SpeedInsights />
    </div>
  );
}
```

### 5.2 Performance Budgets

Configure performance budgets in Next.js:

```javascript
// apps/frontend/next.config.ts
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Performance budgets
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};
```

### 5.3 Runtime Performance Monitoring

Monitor runtime performance:

```typescript
// apps/frontend/src/lib/performance.ts
export class PerformanceMonitor {
  static mark(name: string) {
    if (typeof performance !== "undefined") {
      performance.mark(name);
    }
  }

  static measure(name: string, startMark: string, endMark: string) {
    if (typeof performance !== "undefined") {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];

        // Send to analytics
        if (measure.duration > 100) {
          console.warn(`Slow operation: ${name} took ${measure.duration}ms`);
        }
      } catch (e) {
        // Ignore measurement errors
      }
    }
  }
}

// Usage
export async function loadData() {
  PerformanceMonitor.mark("data-fetch-start");
  const data = await fetchData();
  PerformanceMonitor.mark("data-fetch-end");
  PerformanceMonitor.measure("data-fetch", "data-fetch-start", "data-fetch-end");
  return data;
}
```

### 5.4 User-Centric Metrics

Track user-centric metrics:

```typescript
// apps/frontend/src/lib/analytics.ts
export function trackWebVitals() {
  if (typeof window !== "undefined") {
    import("web-vitals").then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    });
  }
}
```

---

## 6. Next.js 15 Specific Optimizations

### 6.1 Partial Prerendering

Utilize Next.js 15's partial prerendering:

```typescript
// apps/frontend/src/app/[locale]/dashboard/page.tsx
export const runtime = 'edge';
export const dynamic = 'force-static';

// Static shell with dynamic data
export default async function DashboardPage() {
  const staticData = await getStaticData();

  return (
    <div>
      <StaticHeader data={staticData} />
      <Suspense fallback={<DashboardSkeleton />}>
        <DynamicDashboardData />
      </Suspense>
    </div>
  );
}
```

### 6.2 Server Components Optimization

Maximize server components:

```typescript
// Default to server components (no "use client")
export default async function InsightList() {
  const insights = await getInsights(); // Server-side fetch

  return (
    <div>
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}

// Only add "use client" for interactive components
"use client";
export function InsightCard({ insight }: { insight: Insight }) {
  const [liked, setLiked] = useState(false);

  return (
    <AppCard>
      <Text>{insight.name}</Text>
      <Button onClick={() => setLiked(!liked)}>
        {liked ? 'Unlike' : 'Like'}
      </Button>
    </AppCard>
  );
}
```

### 6.3 Image Optimization

Use Next.js Image component:

```typescript
// apps/frontend/src/components/images/OptimizedImage.tsx
import Image from 'next/image';

export function OptimizedImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      priority={false} // Lazy load by default
      placeholder="blur" // Show blur placeholder
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}
```

### 6.4 Font Optimization

Optimize font loading:

```typescript
// apps/frontend/src/app/layout.tsx
import { Inter, Cairo } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const cairo = Cairo({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-cairo',
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cairo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

---

## 7. Mantine-Specific Performance Considerations

### 7.1 Selective Component Imports

Import only needed Mantine components:

```typescript
// Create component exports for better tree shaking
// packages/ui/src/components/mantine/index.ts

export { Button } from "@mantine/core/lib/Button";
export { Card } from "@mantine/core/lib/Card";
export { TextInput } from "@mantine/core/lib/TextInput";
export { NumberInput } from "@mantine/core/lib/NumberInput";
export { Select } from "@mantine/core/lib/Select";
export { Textarea } from "@mantine/core/lib/Textarea";
```

### 7.2 CSS Modules Optimization

Optimize Mantine CSS:

```javascript
// apps/frontend/postcss.config.mjs
export default {
  plugins: {
    "postcss-preset-mantine": {
      // Reduce CSS size
      variables: {
        "mantine-breakpoint-xs": "36em",
        "mantine-breakpoint-sm": "48em",
        "mantine-breakpoint-md": "62em",
        "mantine-breakpoint-lg": "75em",
        "mantine-breakpoint-xl": "88em",
      },
    },
  },
};
```

### 7.3 Form Optimization

Optimize form performance with Mantine Form:

```typescript
// apps/frontend/src/components/forms/OptimizedForm.tsx
import { useForm } from '@mantine/form';

export function OptimizedInsightForm() {
  const form = useForm({
    initialValues: {
      name: '',
      connectors: [],
      metrics: [],
    },
    enhanceGetInputProps: (payload) => {
      // Optimize form re-renders
      return {
        ...payload.form.getInputProps(payload.field),
        onChange: (event) => {
          // Debounce validation
          form.setFieldValue(payload.field, event.currentTarget.value);
        },
      };
    },
  });

  return <form onSubmit={form.onSubmit(handleSubmit)}>{/* ... */}</form>;
}
```

---

## 8. AgenticVerdict Specific Recommendations

### 8.1 Analytics Dashboard Optimization

For the analytics dashboard:

```typescript
// apps/frontend/src/app/[locale]/dashboard/page.tsx
export default function AnalyticsDashboard() {
  return (
    <div>
      {/* Critical KPIs - render immediately */}
      <KPICards />

      {/* Lazy load charts */}
      <Suspense fallback={<ChartSkeletons />}>
        <AnalyticsCharts />
      </Suspense>

      {/* Lazy load detailed tables */}
      <Suspense fallback={<TableSkeleton />}>
        <DetailedDataTable />
      </Suspense>

      {/* Lazy load historical comparisons */}
      <Suspense fallback={<ComparisonSkeleton />}>
        <HistoricalComparison />
      </Suspense>
    </div>
  );
}
```

### 8.2 Multi-Tenant Performance Optimization

Optimize for agency partners:

```typescript
// apps/frontend/src/components/agency/TenantSwitcher.tsx
export function TenantSwitcher() {
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    // Lazy load tenant list
    import('@/lib/api/tenants').then(({ getTenants }) => {
      getTenants().then(setTenants);
    });
  }, []);

  return (
    <Select
      data={tenants.map(t => ({ value: t.id, label: t.name }))}
      // Use virtualization for large tenant lists
      limit={20}
      searchable
    />
  );
}
```

### 8.3 RTL/LTR Performance

Optimize for RTL/LTR switching:

```typescript
// apps/frontend/src/components/Providers.tsx
export function Providers({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <DirectionProvider initialDirection={dir} detectDirection={false}>
      <MantineProvider theme={theme}>
        {children}
      </MantineProvider>
    </DirectionProvider>
  );
}
```

### 8.4 Connector Management Optimization

Optimize connector status monitoring:

```typescript
// apps/frontend/src/components/connectors/ConnectorStatus.tsx
export function ConnectorStatus() {
  const [statuses, setStatuses] = useState<ConnectorStatus[]>([]);

  // Use SWR for efficient data fetching
  const { data } = useSWR('/api/connectors/status', fetcher, {
    refreshInterval: 30000, // Poll every 30s
    revalidateOnFocus: false,
  });

  return (
    <VirtualizedList
      items={data || []}
      renderItem={(status) => <ConnectorStatusCard key={status.id} {...status} />}
    />
  );
}
```

---

## 9. Implementation Checklist

### Phase 1: Critical Optimizations (Week 1)

- [ ] Setup bundle analyzer
- [ ] Implement route-based code splitting
- [ ] Add lazy loading for heavy components (>50KB)
- [ ] Configure performance budgets
- [ ] Setup Core Web Vitals tracking

### Phase 2: Runtime Optimizations (Week 2)

- [ ] Implement virtual scrolling for large lists
- [ ] Add memoization for expensive components
- [ ] Optimize form performance with debouncing
- [ ] Implement CSS animations instead of JS
- [ ] Optimize image loading with Next.js Image

### Phase 3: Advanced Optimizations (Week 3)

- [ ] Implement partial prerendering
- [ ] Optimize Mantine imports
- [ ] Setup design token delivery
- [ ] Implement runtime performance monitoring
- [ ] Create performance regression tests

---

## 10. Monitoring Strategy

### 10.1 Development Monitoring

```bash
# Run bundle analyzer
pnpm --filter @agenticverdict/frontend analyze

# Run Lighthouse audits
pnpm --filter @agenticverdict/frontend lighthouse

# Check bundle sizes
pnpm --filter @agenticverdict/frontend build:stats
```

### 10.2 Production Monitoring

- **Core Web Vitals**: Track CLS, FID, LCP
- **Bundle Size**: Monitor main bundle size
- **API Performance**: Track tRPC query times
- **Error Tracking**: Monitor JavaScript errors
- **User Analytics**: Track user interactions

### 10.3 Performance Budgets

Create `.lighthouserc.json`:

```json
{
  "ci": {
    "assert": {
      "preset": "desktop",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }]
      }
    }
  }
}
```

---

## 11. Performance Testing Strategy

### 11.1 Automated Performance Tests

Create performance regression tests:

```typescript
// apps/frontend/e2e/performance.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Performance Tests", () => {
  test("dashboard loads within 2 seconds on 3G", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      };
    });

    expect(performanceMetrics.loadComplete).toBeLessThan(2000);
  });
});
```

### 11.2 Manual Performance Audits

Monthly performance audits:

1. Lighthouse audits (Mobile & Desktop)
2. Bundle size analysis
3. Core Web Vitals monitoring
4. Real user monitoring (RUM)
5. A/B testing for optimizations

---

## 12. Conclusion

This performance optimization guide provides a comprehensive approach to achieving the AgenticVerdict platform's performance targets. By implementing these strategies systematically, we can ensure:

- **Fast initial load times** (<2s on 3G)
- **Smooth interactions** (<100ms input delay)
- **Small bundle sizes** (<500KB gzipped)
- **Excellent user experience** across all devices

The key is to implement these optimizations incrementally, measuring impact at each step, and prioritizing optimizations that provide the most significant user experience improvements.

---

**Document Status**: ✅ Active  
**Next Review**: After foundation sub-phase completion  
**Maintainer**: Architecture Team  
**Related Documents**:

- [BUSINESS_REQUIREMENTS.md](./BUSINESS_REQUIREMENTS.md)
- [UI_IMPLEMENTATION_DETAILS.md](./UI_IMPLEMENTATION_DETAILS.md)
- [Technical Architecture](/docs/architecture/business/technical-architecture.md)
