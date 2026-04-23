# Implementation Plan: Tenant Management

**Branch**: `009-tenant-management` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/01-ui/09-tenant-management/spec.md`

## Summary

Phase 09 (Tenant Management) implements multi-tenant switching and management capabilities essential for agency partners and multi-organization users. The implementation builds on the TanStack Start + Mantine v9 foundation to deliver a tenant switcher component, tenant/tenant settings pages, client management for agency partners, and tenant onboarding workflows—all with full RTL support and proper tenant isolation via AsyncLocalStorage context propagation.

## Technical Context

**Language/Version**: TypeScript 5.3+ (strict mode)
**Primary Dependencies**: 
  - TanStack Start (file-based routing, load/action pattern)
  - TanStack Router (type-safe navigation)
  - Mantine UI v9 (component library with RTL support)
  - TanStack Query (query caching and invalidation)
  - tRPC v11 (type-safe API layer)
  - Zod (runtime validation)

**Storage**: PostgreSQL 16 with Drizzle ORM (tenant, tenant, configuration tables)
**Testing**: Playwright (E2E), Vitest (unit testing)
**Target Platform**: Web (responsive design with mobile-first approach)
**Project Type**: Multi-tenant SaaS web application
**Performance Goals**: 
  - Tenant switch <3s (including data refresh)
  - Settings page load <1.5s
  - Client list virtualization for 50+ clients
**Constraints**: 
  - WCAG 2.1 AA compliance (keyboard nav, screen readers)
  - Full RTL support for Arabic locale
  - Zero tenant data leakage (complete isolation)
  - Browser storage limits for tenant context

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

✅ **Single Purpose**: Tenant management is a focused feature with clear boundaries
✅ **Minimal Dependencies**: Depends only on foundation, authentication, and scaffold phases
✅ **No Scope Creep**: Feature set is well-defined (switcher, settings, client management, onboarding)
✅ **No Circular Dependencies**: UI depends on API, API depends on database—clear hierarchy
✅ **No Hardcoded Logic**: All tenant customization flows through configuration schemas
✅ **No User Data**: No PII in tenant context (only IDs, names, branding)

## Project Structure

### Documentation (this feature)

```text
specs/01-ui/09-tenant-management/
├── spec.md              # This file's input (functional specification)
├── plan.md              # This file (implementation plan)
├── tasks.md             # Task breakdown (to be generated)
└── README.md            # Phase overview (optional)
```

### Source Code (repository root)

```text
apps/frontend/src/
├── routes/
│   ├── settings/
│   │   ├── tenant.tsx          # Tenant settings page
│   │   └── tenant.tsx           # Tenant settings page
│   ├── agency/
│   │   ├── clients.tsx          # Client management list
│   │   └── onboarding.tsx       # Tenant onboarding wizard
│   └── _components/
│       └── topbar.tsx           # Topbar with tenant switcher
├── components/
│   ├── tenant/
│   │   ├── TenantSwitcher.tsx       # Tenant switcher dropdown component
│   │   ├── TenantSettingsForm.tsx  # Tenant branding settings form
│   │   ├── TenantSettingsForm.tsx   # Tenant configuration form
│   │   ├── ClientList.tsx           # Agency client list with virtualization
│   │   ├── ClientCard.tsx           # Client overview card
│   │   ├── OnboardingWizard.tsx     # Multi-step onboarding flow
│   │   └── DomainStatusBadge.tsx    # Domain verification status indicator
│   └── forms/
│       ├── BrandingSection.tsx      # Branding form section
│       ├── DomainSection.tsx        # Domain configuration section
│       └── LocalizationSection.tsx  # Localization settings section
├── stores/
│   └── tenant-store.ts          # TanStack Store for tenant context state
├── lib/
│   ├── tenant-context.ts        # Tenant context utilities (AsyncLocalStorage wrapper)
│   └── tenant-utils.ts          # Tenant switching helpers, cache invalidation
└── hooks/
    ├── useTenantSwitch.ts       # Tenant switch hook with cache invalidation
    ├── useTenantConfig.ts       # Tenant configuration query hook
    └── useTenantBranding.ts    # Tenant branding query hook

packages/database/src/schema/
├── tenant.ts                    # Tenant table schema
├── tenant.ts                   # Tenant branding schema
└── tenant-config.ts             # Tenant configuration schema

packages/api/src/routers/
├── tenant-router.ts             # Tenant operations (get, update, switch)
├── tenant-router.ts            # Tenant branding operations
└── agency-router.ts             # Agency partner client operations
```

**Structure Decision**: This is a **web application** pattern with clear separation between UI routes, reusable components, state management, and API integration. Tenant management UI components reside in `apps/frontend/` while backend logic lives in `packages/api/` and database schemas in `packages/database/`.

## Implementation Strategy

### Tenant Context Propagation Architecture

The tenant management system relies on the existing AsyncLocalStorage-based context propagation from the backend API:

```typescript
// Server-side tenant context (packages/api/src/lib/tenant-context.ts)
const tenantContext = new AsyncLocalStorage<TenantContext>();

// Tenant context passed to tRPC procedures via context
export const createContext = async (req: Request) => {
  const tenantId = extractTenantIdFromRequest(req);
  const config = await loadTenantConfig(tenantId);
  return { tenantId, config, user };
};

// tRPC procedures automatically have tenant context
export const tenantRouter = t.router({
  get: t.procedure.query(({ ctx }) => {
    // ctx.tenantId and ctx.config are available
    return db.query.tenants.findFirst({
      where: eq(tenants.id, ctx.tenantId)
    });
  });
});
```

**Client-Side Tenant State Management**:

```typescript
// apps/frontend/src/stores/tenant-store.ts
import { createStore } from '@tanstack/react-store';

interface TenantState {
  currentTenantId: string;
  tenantName: string;
  branding: TenantBranding;
}

export const tenantStore = createStore<TenantState>({
  currentTenantId: '',
  tenantName: '',
  branding: {}
});

// apps/frontend/src/hooks/useTenantSwitch.ts
export function useTenantSwitch() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const switchTenant = async (tenantId: string) => {
    // Invalidate all tenant-scoped queries
    queryClient.invalidateQueries(['tenant']);
    queryClient.invalidateQueries(['connectors']);
    queryClient.invalidateQueries(['insights']);
    
    // Update tenant store
    tenantStore.setState((prev) => ({
      ...prev,
      currentTenantId: tenantId
    }));
    
    // Navigate to refresh context
    router.invalidate();
  };
  
  return { switchTenant };
}
```

### Tenant Switcher Component Design

The tenant switcher is integrated into the topbar and provides quick access to tenant switching:

```typescript
// apps/frontend/src/components/tenant/TenantSwitcher.tsx
import { Menu, Button, Text, Avatar, Stack } from '@mantine/core';
import { useTenantList } from '@/hooks/useTenantConfig';

export function TenantSwitcher() {
  const { data: tenants } = useTenantList();
  const { currentTenantId } = tenantStore.useState();
  const { switchTenant } = useTenantSwitch();
  
  const currentTenant = tenants?.find((t) => t.id === currentTenantId);
  
  if (tenants?.length === 1) {
    return <Text>{currentTenant?.name}</Text>; // No dropdown needed
  }
  
  return (
    <Menu>
      <Menu.Target>
        <Button variant="subtle" leftSection={<Avatar src={currentTenant?.logoUrl} />}>
          {currentTenant?.name}
        </Button>
      </Menu.Target>
      
      <Menu.Dropdown>
        {tenants?.map((tenant) => (
          <Menu.Item
            key={tenant.id}
            leftSection={<Avatar src={tenant.logoUrl} />}
            onClick={() => switchTenant(tenant.id)}
          >
            <Stack gap={0}>
              <Text>{tenant.name}</Text>
              {tenant.isAgency && (
                <Text size="xs" c="dimmed">Agency Partner</Text>
              )}
            </Stack>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
```

### Settings Pages Structure

Both tenant and tenant settings use a similar tabbed form layout:

```typescript
// apps/frontend/src/routes/settings/tenant.tsx
import { Tabs, Container } from '@mantine/core';
import { TenantSettingsForm } from '@/components/tenant/TenantSettingsForm';

export default function TenantSettingsPage() {
  return (
    <Container size="lg">
      <Tabs defaultValue="branding">
        <Tabs.List>
          <Tabs.Tab value="branding">Branding</Tabs.Tab>
          <Tabs.Tab value="domain">Custom Domain</Tabs.Tab>
          <Tabs.Tab value="localization">Localization</Tabs.Tab>
        </Tabs.List>
        
        <Tabs.Panel value="branding">
          <TenantSettingsForm section="branding" />
        </Tabs.Panel>
        
        <Tabs.Panel value="domain">
          <TenantSettingsForm section="domain" />
        </Tabs.Panel>
        
        <Tabs.Panel value="localization">
          <TenantSettingsForm section="localization" />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}
```

### Agency Client Management

Agency partners have a specialized client management interface with virtualization for large portfolios:

```typescript
// apps/frontend/src/components/tenant/ClientList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { Box } from '@mantine/core';

export function ClientList() {
  const { data: clients } = useAgencyClients();
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: clients?.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated height per client card
    overscan: 5
  });
  
  return (
    <Box ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const client = clients![virtualItem.index];
          return (
            <div
              key={client.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`
              }}
            >
              <ClientCard client={client} />
            </div>
          );
        })}
      </div>
    </Box>
  );
}
```

### RTL Support

All tenant management components must support RTL layouts:

```typescript
// Use Mantine's built-in RTL support
import { DirectionProvider } from '@mantine/core';

// The DirectionProvider at app level handles dir="rtl" or dir="ltr"
// Components using logical properties automatically flip

// Example: Tenant switcher dropdown alignment
<Menu.Dropdown>
  {/* Mantine automatically aligns dropdowns based on direction */}
  <Menu.Item>...</Menu.Item>
</Menu.Dropdown>
```

### Cache Invalidation Strategy

Tenant switching requires comprehensive cache invalidation:

```typescript
// apps/frontend/src/lib/tenant-utils.ts
export function invalidateTenantContext(
  queryClient: QueryClient,
  tenantId: string
) {
  // Invalidate all tenant-scoped queries
  queryClient.invalidateQueries({
    predicate: (query) => {
      const [key] = query.queryKey;
      return [
        'tenant',
        'connectors',
        'insights',
        'reports',
        'templates'
      ].includes(key as string);
    }
  });
  
  // Clear tenant-specific stores
  tenantStore.setState((prev) => ({
    ...prev,
    currentTenantId: tenantId
  }));
}
```

## Complexity Tracking

> **No complexity violations**: This feature follows standard web application patterns with clear separation of concerns. The tenant management logic is encapsulated in dedicated components and stores without introducing architectural complexity.

| Aspect | Implementation | Complexity Justification |
|--------|---------------|--------------------------|
| Tenant Switcher | Dropdown component in topbar | Standard UI pattern, no special complexity |
| Settings Pages | Tabbed forms with validation | Standard CRUD operations, well-established pattern |
| Client Management | Virtualized list for performance | Necessary optimization for large client portfolios |
| Onboarding Wizard | Multi-step form with progress | Standard UX pattern, no architectural impact |
| Cache Invalidation | Query invalidation on switch | Standard TanStack Query pattern |

## Performance Considerations

1. **Tenant Switch Performance**: Target <3s for complete switch including data refresh
   - Use optimistic UI updates for tenant switcher
   - Parallelize data fetching with Promise.all()
   - Implement skeleton screens during loading

2. **Client List Virtualization**: Support 50+ clients without performance degradation
   - Use @tanstack/react-virtual for virtual scrolling
   - Lazy load client metrics data
   - Implement pagination for initial client list

3. **Settings Page Load Time**: Target <1.5s initial render
   - Lazy load form sections (tabs)
   - Implement progressive form validation
   - Use TanStack Router's load functions for data fetching

4. **Image Upload Performance**: Logo uploads should not block UI
   - Implement client-side image optimization
   - Use CDN for asset delivery
   - Show upload progress indicators

## Accessibility Requirements

All tenant management components must meet WCAG 2.1 AA standards:

1. **Keyboard Navigation**: All interactive elements (tenant switcher, forms, buttons) must be accessible via keyboard
2. **Screen Reader Support**: Form labels, error messages, and status updates must be announced
3. **Focus Management**: Proper focus management during tenant switches and modal interactions
4. **Color Contrast**: All text and interactive elements must meet 4.5:1 contrast ratio
5. **RTL Support**: All components must render correctly in RTL layout (Arabic)

## Security Considerations

1. **Tenant Isolation**: Ensure no data leakage between tenants during context switches
2. **Authorization**: Verify user permissions before allowing tenant switches or settings changes
3. **Input Validation**: Validate all form inputs (especially domain configurations) on client and server
4. **CSRF Protection**: Use tRPC's built-in CSRF protection for all mutations
5. **Rate Limiting**: Implement rate limiting for tenant switch operations to prevent abuse

## Testing Strategy

1. **Unit Tests**: Test tenant store, switch hooks, and utility functions
2. **Integration Tests**: Test tenant switch flow with mocked tRPC procedures
3. **E2E Tests**: Test critical user journeys (tenant switch, settings save, client onboarding)
4. **RTL Tests**: Validate all components in both LTR and RTL layouts
5. **Accessibility Tests**: Automated axe-core scans for all tenant management pages

## Migration Notes

No database migrations are required for this phase—tenant, tenant, and configuration schemas should already exist from earlier backend implementation. This phase focuses solely on UI implementation.

## Rollout Plan

1. **Feature Flag**: Initially roll out behind a feature flag for beta testing
2. **Beta Users**: Test with agency partners first (highest complexity use case)
3. **Gradual Rollout**: Enable for all users after beta validation
4. **Monitoring**: Track tenant switch performance, error rates, and user feedback
