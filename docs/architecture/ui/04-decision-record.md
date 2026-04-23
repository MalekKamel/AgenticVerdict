# AgenticVerdict UI System: Architectural Decision Record

**Document Version:** 1.1
**Date:** 2026-04-13
**Status:** Active
**Authors:** Architecture Team
**Related Documents:**

- [Research Findings](./01-research-findings/)
- [Design System Specification](./02-design-system-specification/)
- [Technical Architecture](/docs/architecture/business/technical-architecture.md)

---

## Executive Summary

This document captures the architectural decisions made for the AgenticVerdict UI system, a multi-business-domain intelligence platform requiring first-class internationalization (Arabic RTL + English LTR), WCAG 2.1 AA accessibility, and white-label customization capabilities. Each decision follows a structured format documenting the choice, context, alternatives considered, rationale, trade-offs, and related decisions.

**Primary Technology Stack:** Next.js 15 + Mantine UI v9 + CSS-in-JS + Ladle documentation + Radix UI augmentation for advanced accessibility scenarios.

---

## Decision 1: Mantine UI v9 as Primary Component Library

### Decision

**Selected:** Mantine UI v9 as the foundational component library for AgenticVerdict.

### Context

- **Project Requirements:** Multi-tenant SaaS platform with complex data visualizations, forms, and dashboards
- **Accessibility:** WCAG 2.1 AA compliance mandatory, with AAA targets for critical paths
- **Internationalization:** Full Arabic RTL support from day one, extensible to additional languages
- **Timeline:** Foundation phase (2 weeks) with rapid iteration requirements
- **Team:** Small team needing to move fast without sacrificing quality
- **Performance:** <2s page load on 3G, <500KB initial bundle targets

### Options Considered

1. **Mantine UI v9** ✅ Selected
2. **Radix UI (standalone)**
3. **Headless UI + Tailwind CSS**
4. **Shadcn UI**
5. **Chakra UI**
6. **Material-UI (MUI)**

### Rationale

**Mantine UI v9 was selected** based on comprehensive evaluation across five critical dimensions:

**Accessibility (25% weight):** Mantine provides WCAG 2.1 AA compliance out-of-box with proper ARIA attributes, keyboard navigation, and screen reader optimization. The component library is built with accessibility as a first-class concern, not an add-on.

**RTL Support (10% weight):** Native RTL support through `DirectionProvider` eliminates the need for manual direction handling. Components automatically mirror layouts, flip icons, and adjust text alignment based on locale direction.

**Developer Experience (20% weight):** Excellent TypeScript support with comprehensive type definitions. Consistent API design across 100+ components reduces cognitive load. Extensive documentation with live examples accelerates development.

**Bundle Size (15% weight):** Tree-shakeable imports enable optimal bundle sizes. Core library is ~150KB gzipped, acceptable for the feature richness provided. Selective imports keep individual page bundles minimal.

**Integration with Next.js 15 (30% weight):** First-class React Server Components support. Built-in CSS-in-JS solution works seamlessly with Next.js SSR/SSG. No configuration required for App Router compatibility.

**Multi-tenant Theming (Bonus):** Theme customization through CSS custom properties enables runtime brand injection without rebuilds—a critical requirement for white-label agency partnerships.

### Trade-offs

**Accepted:**

- **Runtime Overhead:** CSS-in-JS adds ~2-5ms per component for style generation, mitigated by aggressive caching and server-side rendering
- **Learning Curve:** Team must learn Mantine-specific APIs (`createStyles`, theme structure), but this is offset by comprehensive documentation
- **Bundle Size:** Larger than headless alternatives, but justified by reduced development time and built-in accessibility

**Avoided:**

- **Custom Component Build:** Radix-only approach would require building 100+ components from scratch, violating "don't reinvent the wheel" principle
- **Tailwind Migration:** Headless UI + Tailwind would require 2-3 week migration with uncertain RTL stability
- **Maintenance Burden:** Shadcn UI's copy-paste model would create long-term maintenance overhead for component updates

### Related Decisions

- Decision 2: CSS-in-JS as primary styling approach (enabled by Mantine v9)
- Decision 4: Radix UI augmentation for accessibility gaps (complementary to Mantine v9)
- Decision 6: RTL support via DirectionProvider (Mantine v9 feature)

---

## Decision 2: CSS-in-JS as Primary Styling Approach

### Decision

**Selected:** Mantine's built-in CSS-in-JS solution for component styling, with CSS Modules for global styles and animations.

### Context

- **Requirement:** Dynamic theming for multi-tenant scenarios (runtime brand injection)
- **Requirement:** Automatic RTL support without manual CSS direction handling
- **Requirement:** Strong TypeScript integration for theme type safety
- **Constraint:** Performance targets (<2s page load, <500KB bundle)
- **Team Background:** Mixed CSS/JavaScript experience, but willing to learn new paradigms

### Options Considered

1. **CSS-in-JS (Mantine)** ✅ Selected
2. **Tailwind CSS**
3. **CSS Modules (primary)**
4. **Styled Components**
5. **Vanilla Extract**

### Rationale

**CSS-in-JS was selected** for component-level styling based on three decisive advantages:

**Dynamic Theming:** Multi-tenant theming requires runtime style injection. CSS-in-JS enables theme switching without page reloads through JavaScript theme object manipulation. Critical for agency white-labeling where brand customization must be tenant-specific.

```typescript
// Runtime theme injection per tenant
<MantineProvider theme={tenantSpecificTheme}>
  <App />
</MantineProvider>
```

**Automatic RTL:** Mantine's CSS-in-JS generates direction-aware styles automatically. When `DirectionProvider` sets `dir="rtl"`, margin properties flip (`margin-inline-start` vs `margin-inline-end`), layouts reverse, and icons mirror without manual CSS.

**Type Safety:** Full TypeScript integration ensures theme access is type-checked at compile time. Refactoring theme values triggers compile errors across all usages, preventing inconsistencies.

**CSS Modules** were selected as a complementary approach for:

- Global styles (reset, base typography)
- Animation keyframes (pure CSS is more performant)
- Critical CSS extraction for above-the-fold content

### Trade-offs

**Accepted:**

- **Runtime Performance:** ~2-5ms overhead per component for style generation, acceptable for typical dashboards with <100 components
- **Debugging Complexity:** Generated class names require browser dev tools inspection, but Mantine's dev mode provides source mapping
- **Build Complexity:** Requires PostCSS configuration, but this is one-time setup cost

**Avoided:**

- **Tailwind Migration:** 2-3 week migration effort with uncertain ROI; Mantine's CSS-in-JS is production-ready and feature-complete
- **CSS Modules Primary:** Would lose dynamic theming and automatic RTL, requiring manual direction handling
- **Styled Components:** Larger bundle size, worse Next.js 15 integration, redundant with Mantine's solution

### Related Decisions

- Decision 1: Mantine UI v9 (CSS-in-JS is built-in)
- Decision 3: Design tokens via CSS custom properties (hybrid approach)
- Decision 6: RTL support (enabled by CSS-in-JS automatic direction handling)

---

## Decision 3: Three-Tier Design Token System

### Decision

**Selected:** Three-tier design token architecture (Global → Brand → Component) implemented via CSS custom properties and Mantine theme customization.

### Context

- **Requirement:** Multi-tenant theming with tenant-specific brand customization
- **Requirement:** Design consistency across all components while maintaining flexibility
- **Requirement:** Runtime theme injection without page reloads
- **Requirement:** Future-proof for design tool synchronization (Figma → Code)
- **Standard:** W3C Design Tokens Community Group specification compliance

### Options Considered

1. **Three-Tier Token System (CSS Custom Properties)** ✅ Selected
2. **Mantine Theme Only (JavaScript tokens)**
3. **Style Dictionary Build Pipeline**
4. **SCSS Variables with Compile-Time Themed Builds**

### Rationale

**Three-tier architecture** was selected to balance consistency with flexibility:

```
Global Tokens (Primitives)
    ↓
Brand Tokens (Semantic)
    ↓
Component Tokens (Specific)
```

**Global Tokens** (`--av-color-blue-700: #1976D2`) provide:

- Technology-agnostic raw values
- Single source of truth for design primitives
- Easy synchronization with design tools (future)

**Brand Tokens** (`--brand-color-primary: var(--av-color-blue-700)`) provide:

- Semantic naming for design intent
- Tenant-specific overrides without code changes
- Clear separation between structure and branding

**Component Tokens** (`--button-primary-bg: var(--brand-color-primary)`) provide:

- Component-specific customization
- Composition from global/brand tokens
- Local overrides when needed

**CSS Custom Properties Implementation** enables:

- **Runtime Updates:** Theme changes without page reload
- **Cascade and Inheritance:** Natural CSS scoping
- **Dev Tools Inspection:** Easy debugging in browser
- **No Build Step:** Token changes don't require rebuild

### Trade-offs

**Accepted:**

- **Browser Support:** CSS variables require IE11+, but AgenticVerdict targets modern browsers (Chrome 90+, Safari 14+, Firefox 88+)
- **Performance:** CSS variable resolution has minimal runtime cost (<1ms)
- **Tooling:** No standard tooling for token validation yet, but TypeScript types provide compile-time safety

**Avoided:**

- **Mantine Theme Only:** Would couple design system to Mantine implementation, making future migrations harder
- **Style Dictionary:** Overkill for current scale; adds build complexity for limited benefit
- **SCSS Variables:** No runtime updates, requires themed builds per tenant, doesn't scale for multi-tenancy

### Related Decisions

- Decision 1: Mantine UI v9 (theme customization integrates with tokens)
- Decision 2: CSS-in-JS (works alongside CSS custom properties)
- Decision 5: Multi-tenant theming (three-tier system enables tenant customization)

---

## Decision 4: Radix UI Augmentation for Accessibility Gaps

### Decision

**Selected:** Use Radix UI primitives to complement Mantine for components requiring advanced accessibility customization or complex interaction patterns.

### Context

- **Requirement:** WCAG 2.1 AA compliance across all components, with AAA targets for critical paths
- **Gap:** Mantine provides excellent baseline accessibility, but some advanced patterns require more control
- **Use Cases:** Complex tooltips with positioning challenges, advanced menus with nested navigation, custom dialogs with focus management
- **Timeline:** Phase 2 enhancement (1-2 weeks after foundation)

### Options Considered

1. **Radix UI Augmentation** ✅ Selected
2. **Mantine Only (Build Custom Components)**
3. **React ARIA (Adobe)**
4. **Reach UI**

### Rationale

**Radix UI augmentation** was selected for specific use cases where Mantine's accessibility defaults need customization:

**Superior Accessibility:** Radix components are built with unmatched attention to ARIA attributes, keyboard navigation, and screen reader optimization. For complex interaction patterns (command palette, advanced data grids), Radix provides primitives that are battle-tested.

**Complementary to Mantine:** Radix doesn't compete with Mantine—it fills gaps. Use Mantine for 95% of components (forms, buttons, inputs), Radix for 5% requiring advanced accessibility (complex tooltips, popovers, menus).

**React Server Components Ready:** Radix has explicit RSC support, aligning with Next.js 15's architecture. Future-proofs the platform for server-side rendering optimizations.

**Strong TypeScript:** Excellent type inference and generic component patterns enable type-safe custom components without sacrificing accessibility.

**Selective Installation:** Install only specific Radix primitives needed (`@radix-ui/react-popover`, `@radix-ui/react-tooltip`), keeping bundle size minimal.

### Trade-offs

**Accepted:**

- **Integration Effort:** Requires wrapping Radix components with Mantine styling to maintain visual consistency (estimated 4-8 hours for Phase 2)
- **Bundle Size:** Additional ~10-20KB gzipped for selected Radix primitives, acceptable for enhanced accessibility
- **API Complexity:** Radix is more verbose than full component libraries, but justified for advanced use cases

**Avoided:**

- **Custom Mantine Components:** Building accessible components from scratch violates "don't reinvent the wheel" and risks accessibility regressions
- **React ARIA:** Lower-level primitives than Radix, requiring more implementation work
- **Reach UI:** Less active development, smaller community, fewer components

### Related Decisions

- Decision 1: Mantine UI v9 (primary component library)
- Decision 7: WCAG 2.1 AA accessibility targets (Radix helps achieve AAA for critical paths)
- Decision 9: Testing strategy (Radix components require comprehensive a11y testing)

---

## Decision 5: Multi-Tenant Theming via TenantConfig

### Decision

**Selected:** Runtime theme injection through `TenantConfig` schema integration, using CSS custom properties for tenant-specific design token overrides.

### Context

- **Business Requirement:** White-label customization for agency partners
- **Technical Requirement:** Zero code changes for brand customization
- **Runtime Requirement:** Theme switching without application rebuilds
- **Scalability:** Support 10+ tenants with unique branding in Phase 1, scaling to 100+

### Options Considered

1. **Runtime Theme Injection (TenantConfig + CSS Custom Properties)** ✅ Selected
2. **Build-Time Themed Builds (Docker images per tenant)**
3. **Database-Driven Theme Generation**
4. **iframe-Based Tenant Isolation**

### Rationale

**Runtime theme injection** was selected to maximize flexibility while minimizing operational overhead:

**TenantConfig Integration:** Leverage existing `TenantConfig` schema for theme metadata:

```typescript
interface TenantConfig {
  localization: {
    language: "ar" | "en";
  };
  branding: {
    primaryColor: string;
    logoUrl: string;
    fontFamily: string;
  };
}
```

**CSS Custom Properties:** Inject tenant-specific tokens at runtime:

```typescript
// app/layout.tsx
const tenantConfig = await configManager.loadTenantConfig(tenantId);

<style jsx global>{`
  :root {
    --brand-color-primary: ${tenantConfig.branding.primaryColor};
    --brand-logo-url: ${tenantConfig.branding.logoUrl};
  }
`}</style>
```

**Zero Code Changes:** Adding new tenants requires only database configuration, no deployment. Critical for agency partner onboarding velocity.

**Cacheable Themes:** Theme configurations cached at edge (Vercel Edge Config), eliminating database queries for theme resolution on subsequent requests.

### Trade-offs

**Accepted:**

- **Runtime Overhead:** CSS variable resolution has minimal cost (<1ms), acceptable for flexibility gained
- **Testing Complexity:** Must validate layouts across multiple tenant themes (mitigated by automated visual regression testing)
- **Design Consistency:** Risk of tenants breaking accessibility with custom colors (mitigated by validation in `TenantConfig` schema)

**Avoided:**

- **Build-Time Builds:** Would require separate Docker images per tenant, exploding infrastructure complexity and deployment time
- **Database-Driven Generation:** Unnecessary complexity; CSS custom properties provide same flexibility without server-side rendering overhead
- **iframe Isolation:** Complete tenant isolation but terrible UX (broken navigation, search, accessibility)

### Related Decisions

- Decision 1: Mantine UI v9 (theme customization enables tenant branding)
- Decision 2: CSS-in-JS (dynamic theming support)
- Decision 3: Three-tier token system (brand token layer for tenant overrides)

---

## Decision 6: RTL/LTR Support via DirectionProvider

### Decision

**Selected:** Use Mantine's `DirectionProvider` component for automatic RTL/LTR switching based on user locale, with logical CSS properties for direction-agnostic styling.

### Context

- **Requirement:** First-class Arabic RTL support from day one
- **Requirement:** English LTR support with easy extension to future languages
- **Requirement:** Automatic direction detection based on user locale
- **Constraint:** Manual direction handling across 100+ components is error-prone

### Options Considered

1. **DirectionProvider + Logical Properties** ✅ Selected
2. **Conditional CSS Classes (.rtl, .ltr)**
3. **Separate RTL Builds (Arabic-specific bundle)**
4. **CSS Logical Properties Only (DirectionProvider wrapper)**

### Rationale

**DirectionProvider + Logical Properties** was selected for maximum automation and developer ergonomics:

**Automatic Direction Detection:** `DirectionProvider` wraps the app and detects locale from context:

```typescript
import { DirectionProvider } from '@mantine/core';

<DirectionProvider initialDirection={locale === 'ar' ? 'rtl' : 'ltr'}>
  <App />
</DirectionProvider>
```

**Logical Properties:** Use direction-agnostic CSS properties that automatically flip:

```css
/* Instead of margin-left, use margin-inline-start */
.sidebar {
  margin-inline-start: var(--av-spacing-md);
  text-align: start; /* Instead of text-align: left */
}
```

**Layout Mirroring:** Flexbox and Grid automatically reverse when `dir="rtl"`, eliminating manual layout adjustments for 95% of cases.

**Icon Mirroring:** Directional icons (arrows, chevrons) flip automatically via CSS transforms when direction changes.

**Component Consistency:** Mantine components handle RTL internally—buttons, inputs, modals, and dropdowns mirror correctly without custom code.

### Trade-offs

**Accepted:**

- **Browser Support:** Logical properties require modern browsers (same as CSS custom properties decision)
- **Edge Cases:** 5% of layouts require manual RTL adjustments (mitigated by comprehensive RTL testing in Phase 2)
- **Icon Assets:** Directional icons require SVG or font-based approach (bitmap icons don't scale)

**Avoided:**

- **Conditional CSS Classes:** Maintaining separate `.rtl` and `.ltr` classes doubles CSS maintenance burden
- **Separate Builds:** Arabic-specific bundle doubles deployment complexity and creates translation drift risk
- **Manual Direction Handling:** Error-prone across 100+ components; likely to miss edge cases

### Related Decisions

- Decision 1: Mantine UI v9 (DirectionProvider is built-in)
- Decision 2: CSS-in-JS (automatic RTL support)
- Decision 7: WCAG 2.1 AA accessibility (RTL layouts require separate accessibility validation)

---

## Decision 7: Accessibility Target: WCAG 2.1 AA

### Decision

**Selected:** WCAG 2.1 Level AA as the minimum accessibility standard for all components, with Level AAA targets for critical user paths (authentication, data export, connector management).

### Context

- **Legal Requirement:** ADA compliance for US-based customers
- **Business Requirement:** Serve public sector clients with strict accessibility requirements
- **User Base:** Includes users with visual, motor, and cognitive disabilities
- **Platform:** B2B SaaS with keyboard-heavy workflows (data analysts, marketers)

### Options Considered

1. **WCAG 2.1 AA (Baseline) + AAA for Critical Paths** ✅ Selected
2. **WCAG 2.1 AAA (All Components)**
3. **WCAG 2.0 AA (Legacy Standard)**
4. **Custom Accessibility Standard**

### Rationale

**WCAG 2.1 AA + AAA for Critical Paths** balances comprehensive accessibility with pragmatic implementation:

**Level AA Requirements (All Components):**

- Color contrast: 4.5:1 for normal text, 3:1 for large text
- Keyboard navigation: All interactive elements accessible via keyboard
- Screen reader compatibility: Proper ARIA labels, roles, and live regions
- Focus indicators: Visible focus rings for keyboard navigation
- Touch targets: Minimum 44×44px for mobile interactions

**Level AAA Requirements (Critical Paths):**

- Enhanced color contrast: 7:1 for normal text on authentication pages
- Error prevention: Clear error messages with suggestions for recovery
- Context changes: No unexpected redirects or focus shifts
- Consistent navigation: Predictable page structure and labels

**Automated Testing:** Integration of axe-core in CI pipeline catches 80% of violations automatically. Manual testing with screen readers (NVDA, JAWS, VoiceOver) validates remaining 20%.

**Mantine Foundation:** Mantine's built-in accessibility provides AA compliance out-of-box, reducing custom implementation burden.

### Trade-offs

**Accepted:**

- **Testing Overhead:** Automated + manual testing increases development time by ~15%, justified by legal compliance and user inclusivity
- **Design Constraints:** Color contrast requirements limit palette choices (mitigated by design system token validation)
- **AAA Complexity:** Full AAA compliance across all components would require 2-3x effort, so targeted to critical paths only

**Avoided:**

- **WCAG 2.0 AA:** Outdated standard; doesn't address mobile accessibility or cognitive load
- **Full AAA:** Impractical for aggressive timeline; some AAA criteria conflict with modern design patterns
- **Custom Standard:** Non-compliant with legal requirements; creates confusion for auditors

### Related Decisions

- Decision 1: Mantine UI v9 (built-in AA compliance)
- Decision 4: Radix UI augmentation (enhanced accessibility for complex components)
- Decision 9: Testing strategy (automated axe-core testing in CI)

---

## Decision 8: Performance Targets and Optimization Strategy

### Decision

**Selected:** Aggressive performance targets (<2s page load on 3G, <500KB initial bundle) achieved through route-based code splitting, component lazy loading, virtual scrolling, and strategic preloading.

### Context

- **User Base:** Global users with varying network conditions (3G mobile connections common in Middle East)
- **Platform:** Data-heavy analytics dashboards with complex visualizations
- **Competition:** Modern SaaS platforms set high performance expectations
- **SEO:** Core Web Vitals impact search rankings (critical for organic growth)

### Options Considered

1. **Aggressive Targets with Incremental Optimization** ✅ Selected
2. **Moderate Targets (<4s page load)**
3. **Performance-Last Approach (Optimize after feature complete)**
4. **SPA-First Approach (Client-Side Rendering Only)**

### Rationale

**Aggressive targets with incremental optimization** ensures performance is a feature, not an afterthought:

**Performance Targets:**

- Page Load Time: <2s (3G connection)
- Time to Interactive: <3s (3G connection)
- Initial Bundle Size: <500KB gzipped
- First Contentful Paint: <1.5s (mobile, 4G)
- Cumulative Layout Shift: <0.1
- First Input Delay: <100ms

**Optimization Strategies:**

1. **Route-Based Code Splitting:** Automatic with Next.js 15 App Router
2. **Component Lazy Loading:** Dynamic imports for components >50KB
3. **Virtual Scrolling:** @tanstack/react-virtual for large lists (1000+ items)
4. **Bundle Optimization:** Tree-shakeable Mantine imports, chunk splitting
5. **Image Optimization:** Next.js Image with WebP/AVIF formats
6. **Monitoring:** Core Web Vitals tracking in production

**Incremental Implementation:**

- **Phase 1 (Week 1):** Setup bundle analyzer, configure performance budgets
- **Phase 2 (Week 2):** Implement lazy loading for heavy components
- **Phase 3 (Week 3):** Virtual scrolling for large lists, runtime optimization

### Trade-offs

**Accepted:**

- **Development Complexity:** Lazy loading adds component hierarchy complexity (mitigated by Suspense patterns)
- **Bundle Analysis Time:** Weekly bundle reviews add ~2 hours to sprint maintenance
- **Loading States:** Skeleton screens required for lazy-loaded components (improves perceived performance anyway)

**Avoided:**

- **Moderate Targets:** Would result in 40%+ bounce rate from slow-loading pages
- **Performance-Last:** Expensive to retrofit optimizations; technical debt accumulates rapidly
- **SPA-Only:** Poor SEO, slow initial load, bad UX on slow networks

### Related Decisions

- Decision 1: Mantine UI v9 (tree-shakeable imports enable bundle optimization)
- Decision 2: CSS-in-JS (server-side rendering eliminates FOUC)
- Decision 9: Testing strategy (performance regression tests in CI)

---

## Decision 9: Testing Strategy (70%+ Coverage)

### Decision

**Selected:** Multi-layered testing strategy with 70%+ unit test coverage, 80%+ for business logic, visual regression testing for UI integrity, and automated accessibility testing via axe-core.

### Context

- **Platform:** B2B SaaS with zero tolerance for production bugs
- **Compliance:** WCAG 2.1 AA requires automated accessibility validation
- **Team:** Small team needing high confidence in deployments
- **Regularity:** Weekly production releases with minimal manual QA

### Options Considered

1. **Multi-Layered Testing (Unit + Integration + E2E + Visual + A11y)** ✅ Selected
2. **Unit Testing Only**
3. **E2E Testing Only (Playwright)**
4. **Manual Testing Only**

### Rationale

**Multi-layered testing** provides defense-in-depth against regressions:

**Unit Tests (70%+ coverage target, 80%+ for business logic):**

- **Tool:** Vitest for fast unit tests
- **Scope:** Component logic, utilities, hooks, data transformations
- **Speed:** <5 minutes for full test suite
- **Examples:**
  ```typescript
  describe("formatCurrency", () => {
    it("formats Saudi Riyal with Arabic locale", () => {
      expect(formatCurrency(1234.56, "ar-SA", "SAR")).toBe("١٬٢٣٤٫٥٦ ر.س");
    });
  });
  ```

**Integration Tests (25% of test suite):**

- **Tool:** Vitest + MSW (Mock Service Worker)
- **Scope:** API interactions, tRPC queries, database operations
- **Speed:** <15 minutes for full test suite
- **Examples:** User authentication flow, connector status updates

**E2E Tests (5% of test suite, critical paths only):**

- **Tool:** Playwright
- **Scope:** Critical user journeys (connector setup, insight creation, report generation)
- **Speed:** <30 minutes for full test suite
- **Examples:**
  ```typescript
  test("user can create insight with multi-platform data", async ({ page }) => {
    await page.goto("/insights/new");
    await page.selectOption("platforms", ["meta", "ga4"]);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/insights/1");
  });
  ```

**Visual Regression Tests:**

- **Tool:** Playwright + Percy (or Chromatic)
- **Scope:** All components, critical pages
- **Frequency:** On every PR
- **Catch:** CSS regressions, spacing issues, RTL layout breaks

**Accessibility Tests:**

- **Tool:** axe-core + Playwright
- **Scope:** All pages, critical components
- **Frequency:** On every PR
- **Catch:** ARIA violations, contrast issues, keyboard navigation breaks

### Trade-offs

**Accepted:**

- **Test Maintenance:** Multi-layered testing requires ~20% of development time for test updates (justified by reduced production bugs)
- **CI Duration:** Full test suite takes ~45 minutes (mitigated by parallel test execution)
- **Flaky Tests:** E2E tests can be flaky (mitigated by retry logic and test isolation)

**Avoided:**

- **Unit Testing Only:** Misses integration issues and visual regressions
- **E2E Testing Only:** Slow feedback loop, expensive to maintain, misses unit-level bugs
- **Manual Testing Only:** Not scalable for weekly releases, high risk of regressions

### Related Decisions

- Decision 1: Mantine UI v9 (component testing simplified by consistent APIs)
- Decision 7: WCAG 2.1 AA accessibility (automated axe-core testing required)
- Decision 8: Performance targets (performance regression tests in CI)

---

## Decision 10: Atomic Design for Component Organization

### Decision

**Selected:** Atomic Design methodology (atoms → molecules → organisms → templates → pages) for component hierarchy and organization within `@agenticverdict/ui` package.

### Context

- **Scale:** 100+ components planned across multiple domains (insights, connectors, reports)
- **Team:** Multiple developers working in parallel on different features
- **Discovery:** Need clear component taxonomy for navigation and reuse
- **Scalability:** Component library must grow organically without becoming chaotic

### Options Considered

1. **Atomic Design (Five Levels)** ✅ Selected
2. **Feature-Based Organization**
3. **Flat Structure (All Components in One Directory)**
4. **Domain-Driven Design (Bounded Contexts)**

### Rationale

**Atomic Design** provides the optimal balance of structure and flexibility:

**Five-Level Hierarchy:**

```
packages/ui/src/
├── atoms/              # Basic building blocks (20-30 components)
│   ├── Button/
│   ├── Input/
│   ├── Badge/
│   ├── Icon/
│   └── Typography/
├── molecules/          # Simple combinations (30-40 components)
│   ├── SearchInput/
│   ├── FormField/
│   ├── Card/
│   ├── Dropdown/
│   └── MenuItem/
├── organisms/          # Complex, distinct sections (40-50 components)
│   ├── DataTable/
│   ├── DashboardCard/
│   ├── Navigation/
│   ├── Sidebar/
│   └── Header/
├── templates/          # Page-level components (5-10 templates)
│   ├── DashboardLayout/
│   ├── AuthLayout/
│   └── ReportLayout/
└── hooks/              # Shared business logic hooks
    ├── useConnectorStatus/
    └── useInsightData/
```

**Benefits:**

- **Clear Hierarchy:** Component complexity maps to directory level
- **Facilitated Discovery:** Developers know where to find components based on complexity
- **Natural Scaling:** New components fit naturally into appropriate level
- **Shared Language:** "Atom" vs "organism" provides clear terminology for code reviews

**Implementation with Mantine:**

```typescript
// Atoms: Direct Mantine wrappers with minimal customization
export const AVButton = ({ variant = 'primary', ...props }: ButtonProps) => {
  return <Button {...props} variant={variant} />;
};

// Molecules: Compose atoms for business logic
export function SearchInput({ onSearch, ...props }) {
  const [value, setValue] = useState('');

  return (
    <Group>
      <Input value={value} onChange={(e) => setValue(e.target.value)} {...props} />
      <AVButton onClick={() => onSearch(value)}>Search</AVButton>
    </Group>
  );
}

// Organisms: Complex business components
export function ConnectorStatusCard({ connector }: Props) {
  return (
    <Card>
      <Group>
        <ConnectorIcon type={connector.type} />
        <div>
          <Text weight={500}>{connector.name}</Text>
          <StatusBadge status={connector.health} />
        </div>
      </Group>
    </Card>
  );
}
```

### Trade-offs

**Accepted:**

- **Cognitive Overhead:** New developers must learn Atomic Design concepts (mitigated by clear documentation)
- **Component Placement Ambiguity:** Some components could fit in multiple levels (mitigated by team guidelines and code review)
- **Import Depth:** Deep directory structures (e.g., `@agenticverdict/ui/organisms/DataTable`) (mitigated by barrel exports)

**Avoided:**

- **Feature-Based Organization:** Creates duplicate components across features (e.g., five different button implementations)
- **Flat Structure:** Becomes unmanageable beyond 50 components; difficult to navigate
- **Domain-Driven Design:** Over-engineered for current scale; creates silos between teams

### Related Decisions

- Decision 1: Mantine UI v9 (atoms are thin wrappers around Mantine v9 components)
- Decision 3: Three-tier token system (component tokens map to Atomic Design levels)

---

## Decision 11: tRPC as Unified API Layer for Multi-Client Support

### Decision

**Selected:** tRPC v11 as the unified API layer serving web, mobile, and CLI clients through a single type-safe contract, with Fastify as the server runtime.

### Context

- **Multi-Client Requirement:** AgenticVerdict must support web (Phase 1), mobile (Phase 2-3), and CLI (Phase 2-3) clients
- **Type Safety Priority:** End-to-end type safety without code generation is a core requirement
- **Greenfield Implementation:** No backward compatibility concerns, allowing optimal architecture choice
- **Timeline:** TanStack Start migration in progress (Phases 1-4 complete per changelog)

### Options Considered

1. **tRPC Unified API** ✅ Selected
2. **REST API with OpenAPI**
3. **TanStack Start Server Functions**
4. **GraphQL (CodeSandbox/GraphQL Yoga)**

### Rationale

**tRPC was selected** based on multi-client requirements and developer experience:

**Multi-Client Support:**

- Web: TanStack Start with `@tanstack/start-trpc` integration
- Mobile: React Native with `@trpc/react-query` client
- CLI: HTTP client accessing same tRPC endpoints
- Single API surface eliminates duplicate API implementations

**Type Safety:**

- Zero code generation—types are inferred directly from router definitions
- Changes to router automatically propagate to all clients
- Compile-time validation of all API calls

**Developer Experience:**

- "Near-zero-API" feel—define procedure once, use everywhere
- Collocated router definitions with business logic
- Zod integration for runtime validation

### Trade-offs

**Accepted:**

- **Runtime Dependency:** All clients must use TypeScript (acceptable for greenfield project)
- **HTTP Caching:** Standard REST caching patterns don't apply (mitigated by React Query caching)
- **OpenAPI Generation:** No auto-generated API docs (mitigated by custom documentation)

**Avoided:**

- **Separate APIs:** Would require maintaining multiple API layers (web-specific, mobile-specific, REST for CLI)
- **Server Functions:** Only work with TanStack Start web apps—exclude mobile and CLI
- **REST + Code Generation:** Maintenance burden of syncing OpenAPI specs with client types

### Related Decisions

- Decision 1: Mantine UI v9 (unaffected—UI layer)
- Decision 6: RTL/LTR Support (unaffected—i18n concern)
- TanStack Start Migration (Phase 1-4 complete per changelog)

---

## Cross-Cutting Concerns

### Internationalization (i18n)

**Decision:** next-intl for multi-language support with locale-aware routing, integrated with Mantine's `DirectionProvider` for automatic RTL/LTR switching.

**Rationale:** next-intl provides seamless Next.js 15 App Router integration, type-safe translation keys, and automatic locale detection. Combined with `DirectionProvider`, enables single-source-of-truth for language and direction.

### Monitoring and Observability

**Decision:** Core Web Vitals tracking via Vercel Speed Insights, supplemented by custom performance monitoring for critical user journeys.

**Rationale:** Real-user monitoring (RUM) catches performance issues that synthetic tests miss. Vercel Speed Insights provides zero-configuration tracking for LCP, FID, CLS, and other Core Web Vitals.

### Design Tool Synchronization

**Decision:** Future-proof design token system for potential Figma → Code synchronization via Style Dictionary, but defer implementation until design team maturity.

**Rationale:** Token architecture follows W3C specification, enabling future automation. No immediate need given current design process, but structure prevents rework.

---

## Decision Log

| Decision ID | Date       | Decision                                           | Status     | Impact |
| ----------- | ---------- | -------------------------------------------------- | ---------- | ------ |
| UI-001      | 2026-04-11 | Mantine UI v9 as primary component library         | ✅ Active  | High   |
| UI-002      | 2026-04-11 | CSS-in-JS as primary styling approach              | ✅ Active  | High   |
| UI-003      | 2026-04-11 | Three-tier design token system                     | ✅ Active  | Medium |
| UI-004      | 2026-04-11 | Radix UI augmentation for accessibility gaps       | 🔄 Phase 2 | Low    |
| UI-005      | 2026-04-11 | Multi-tenant theming via TenantConfig              | ✅ Active  | High   |
| UI-006      | 2026-04-11 | RTL/LTR support via DirectionProvider              | ✅ Active  | High   |
| UI-007      | 2026-04-11 | Accessibility target: WCAG 2.1 AA                  | ✅ Active  | High   |
| UI-008      | 2026-04-11 | Performance targets and optimization strategy      | ✅ Active  | High   |
| UI-009      | 2026-04-11 | Testing strategy (70%+ coverage)                   | ✅ Active  | Medium |
| UI-010      | 2026-04-11 | Atomic Design for component organization           | ✅ Active  | Medium |
| UI-011      | 2026-04-13 | tRPC as unified API layer for multi-client support | ✅ Active  | High   |

---

## Revision History

| Version | Date       | Changes                                   | Author            |
| ------- | ---------- | ----------------------------------------- | ----------------- |
| 1.0     | 2026-04-11 | Initial decision record creation          | Architecture Team |
| 1.1     | 2026-04-13 | Added Decision 11: tRPC unified API layer | Architecture Team |

---

## Appendices

### A. Decision-Making Framework

All UI architecture decisions follow this framework:

1. **Define Requirements:** Functional, non-functional, and constraint requirements
2. **Generate Options:** Brainstorm 3-5 viable alternatives
3. **Evaluate Criteria:** Score each option against weighted criteria
4. **Document Trade-offs:** Explicitly state what's gained and sacrificed
5. **Record Rationale:** Capture the "why" for future reference
6. **Review Periodically:** Revisit decisions as context changes

### B. Related Architecture Documents

- **[Technical Architecture](/docs/architecture/business/technical-architecture.md)** - System-wide architecture decisions
- **[Implementation Guide](/docs/architecture/business/implementation-guide.md)** - Current status and patterns
- **[Testing Strategy](/docs/02-planning-and-methodology/testing-strategy.md)** - Comprehensive testing approach
- **[CLAUDE.md](/CLAUDE.md)** - Project-level development guidelines

### C. Glossary

- **Atomic Design:** Component organization methodology with five hierarchy levels
- **CSS-in-JS:** CSS generated via JavaScript at runtime (Mantine's approach)
- **Design Tokens:** Named entities that store visual design attributes
- **RTL/LTR:** Right-to-left / Left-to-right text direction
- **WCAG:** Web Content Accessibility Guidelines (W3C standard)
- **Multi-tenant:** Single application instance serving multiple customers with isolated data

---

**Document Status:** ✅ Active
**Next Review:** After Phase 2 completion (estimated 2 weeks)
**Maintainer:** Architecture Team
**Approval:** Technical Lead, Product Owner
