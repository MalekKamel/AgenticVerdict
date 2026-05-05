# Insights & Reports Feature Flag Guide

## Overview

The Insights and Reports UI features are controlled by the `ENABLE_INSIGHTS_UI` feature flag. This document describes how to use and manage this feature flag.

## Feature Flag Configuration

### Environment Variable

The feature flag is controlled via the environment variable:

```bash
VITE_PUBLIC_ENABLE_INSIGHTS_UI=true|false
```

### Default Value

- **Development**: `false` (disabled by default)
- **Production**: `false` (disabled by default)
- **Testing**: `true` (enabled for E2E tests)

## Usage in Code

### Checking Feature Flag Status

```typescript
import { isFeatureEnabled } from "@/lib/feature-flags";

function MyComponent() {
  const insightsEnabled = isFeatureEnabled("ENABLE_INSIGHTS_UI");

  if (!insightsEnabled) {
    return <FeatureDisabledMessage feature="Insights" />;
  }

  return <InsightsDashboard />;
}
```

### Conditional Navigation

```typescript
import { useFeatureFlags } from "@/lib/feature-flags";

function NavigationMenu() {
  const { isEnabled } = useFeatureFlags();

  return (
    <nav>
      <NavLink href="/dashboard">Dashboard</NavLink>
      {isEnabled("ENABLE_INSIGHTS_UI") && (
        <>
          <NavLink href="/dashboard/insights">Insights</NavLink>
          <NavLink href="/dashboard/reports">Reports</NavLink>
        </>
      )}
    </nav>
  );
}
```

### Conditional Route Registration

```typescript
// apps/frontend/src/routes.ts
import { isFeatureEnabled } from "@/lib/feature-flags";

export const routes = [
  {
    path: "/dashboard",
    component: DashboardLayout,
    children: [
      {
        path: "insights",
        component: InsightsListPage,
        enabled: () => isFeatureEnabled("ENABLE_INSIGHTS_UI"),
      },
      {
        path: "reports",
        component: ReportsListPage,
        enabled: () => isFeatureEnabled("ENABLE_INSIGHTS_UI"),
      },
    ],
  },
];
```

## Rollout Strategy

### Phase 1: Development (Current)

- **Status**: ✅ Complete
- **Flag**: Disabled by default
- **Scope**: Development environments only
- **Users**: Developers and QA team

```bash
# .env.local
VITE_PUBLIC_ENABLE_INSIGHTS_UI=true
```

### Phase 2: Internal Testing

- **Status**: 🔄 In Progress
- **Flag**: Enabled for internal users
- **Scope**: Staging environment
- **Users**: Internal team only

```typescript
// Enable for internal users
const isEnabled = isFeatureEnabled("ENABLE_INSIGHTS_UI") || user.isInternal;
```

### Phase 3: Beta Program

- **Status**: ⏳ Planned
- **Flag**: Enabled for beta users
- **Scope**: Production (beta segment)
- **Users**: Selected beta testers

```typescript
// Enable for beta users
const isEnabled =
  isFeatureEnabled("ENABLE_INSIGHTS_UI") || user.betaFeatures.includes("insights-reports");
```

### Phase 4: General Availability

- **Status**: ⏳ Planned
- **Flag**: Enabled for all users
- **Scope**: Production (all users)
- **Users**: Everyone

```bash
# .env.production
VITE_PUBLIC_ENABLE_INSIGHTS_UI=true
```

### Phase 5: Flag Removal

- **Status**: ⏳ Future
- **Flag**: Removed after stabilization
- **Scope**: All environments
- **Action**: Remove feature flag checks

```typescript
// After stabilization - remove flag checks
// ❌ if (isFeatureEnabled("ENABLE_INSIGHTS_UI")) { ... }
// ✅ Always show insights/reports
```

## Environment-Specific Configuration

### Development

```bash
# .env.local
VITE_PUBLIC_ENABLE_INSIGHTS_UI=true
```

### Staging

```bash
# .env.staging
VITE_PUBLIC_ENABLE_INSIGHTS_UI=true
```

### Production

```bash
# .env.production
VITE_PUBLIC_ENABLE_INSIGHTS_UI=false
```

## Testing with Feature Flags

### Unit Tests

```typescript
import { isFeatureEnabled } from "@/lib/feature-flags";

vi.mock("@/lib/feature-flags", () => ({
  isFeatureEnabled: vi.fn(() => true), // Enable for tests
}));

test("should render insights when feature is enabled", () => {
  render(<InsightsList />);
  expect(screen.getByText("Insights")).toBeInTheDocument();
});
```

### E2E Tests

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    headless: true,
    env: {
      VITE_PUBLIC_ENABLE_INSIGHTS_UI: "true",
    },
  },
});
```

### Integration Tests

```typescript
// Enable feature flag in test setup
beforeAll(() => {
  process.env.VITE_PUBLIC_ENABLE_INSIGHTS_UI = "true";
});
```

## Monitoring and Metrics

### Error Tracking

Monitor errors related to insights and reports:

```typescript
import { trackError } from "@/observability";

try {
  await createInsight(data);
} catch (error) {
  trackError(error, {
    feature: "insights",
    flag: "ENABLE_INSIGHTS_UI",
    userId: user.id,
  });
}
```

### Usage Analytics

Track feature usage:

```typescript
import { trackEvent } from "@/observability";

function InsightCreateButton() {
  const handleClick = () => {
    trackEvent("insight_create_clicked", {
      feature: "insights",
      timestamp: new Date().toISOString(),
    });
    router.push("/dashboard/insights/new");
  };

  return <Button onClick={handleClick}>Create Insight</Button>;
}
```

### Performance Metrics

Monitor performance impact:

```typescript
import { trackPerformance } from "@/observability";

const { data, isLoading } = useInsightList({});

useEffect(() => {
  if (!isLoading) {
    trackPerformance("insight_list_load", {
      duration: performance.now() - startTime,
      count: data?.insights.length || 0,
    });
  }
}, [isLoading, data]);
```

## Troubleshooting

### Feature Not Appearing

1. **Check environment variable**:

   ```bash
   echo $VITE_PUBLIC_ENABLE_INSIGHTS_UI
   ```

2. **Verify build includes flag**:

   ```bash
   grep -r "ENABLE_INSIGHTS_UI" dist/
   ```

3. **Clear browser cache**:
   ```bash
   # Hard refresh or clear cache
   ```

### Flag Not Working in Tests

1. **Check mock setup**:

   ```typescript
   vi.mock("@/lib/feature-flags", () => ({
     isFeatureEnabled: vi.fn(() => true),
   }));
   ```

2. **Verify test environment**:
   ```bash
   # Check .env.test
   VITE_PUBLIC_ENABLE_INSIGHTS_UI=true
   ```

### Production Issues

If issues arise in production:

1. **Disable feature flag**:

   ```bash
   # Set to false and redeploy
   VITE_PUBLIC_ENABLE_INSIGHTS_UI=false
   ```

2. **Monitor error logs**:

   ```bash
   # Check Sentry/Datadog for errors
   ```

3. **Gradual re-enable**:
   ```typescript
   // Enable for subset of users first
   const isEnabled = user.id % 100 < 10; // 10% rollout
   ```

## Related Documentation

- [Insights & Reports Routes](./insights-reports-routes.md)
- [API Integration Examples](./insights-reports-api-examples.md)
- [Feature Flags Implementation](./feature-flags-guide.md)
- [Deployment Guide](./deployment-guide.md)

## Changelog

### 2024-02-01

- Initial implementation of `ENABLE_INSIGHTS_UI` flag
- Insights list, create, detail, edit pages complete
- Reports list and viewer pages complete
- Feature flag documentation created

### Future Updates

- Phase 2: Internal testing rollout
- Phase 3: Beta program launch
- Phase 4: General availability
- Phase 5: Flag removal after stabilization
