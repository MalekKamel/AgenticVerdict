# Getting Started with AgenticVerdict UI

**Version:** 1.1  
**Last Updated:** 2026-04-13  
**Status:** Active  
**Target Audience:** Developers joining the AgenticVerdict project

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Installation and Setup](#2-installation-and-setup)
3. [Package Structure Overview](#3-package-structure-overview)
4. [First Component Creation](#4-first-component-creation)
5. [API Integration with tRPC](#5-api-integration-with-trpc)
6. [Running the Development Server](#6-running-the-development-server)
7. [Testing Setup](#7-testing-setup)
8. [Common Workflows](#8-common-workflows)
9. [Troubleshooting](#9-troubleshooting)
10. [Next Steps](#10-next-steps)

---

## 1. Prerequisites

Before starting with AgenticVerdict UI development, ensure you have the following tools installed and configured:

### Required Tools

**Node.js Runtime**

- **Version:** Node.js 20 LTS (Active Long Term Support)
- **Download:** [nodejs.org](https://nodejs.org/)
- **Verification:** `node --version` should output `v20.x.x`

**Package Manager**

- **Tool:** pnpm (fast, disk-efficient package manager)
- **Version:** pnpm 10.28.1+
- **Installation:** `npm install -g pnpm`
- **Verification:** `pnpm --version`

**Docker Engine**

- **Version:** Docker 24.0+
- **Purpose:** Local infrastructure services (PostgreSQL, Redis)
- **Download:** [docker.com](https://www.docker.com/products/docker-desktop)
- **Verification:** `docker --version`

**Git**

- **Version:** Git 2.40+
- **Verification:** `git --version`

### Optional but Recommended

**IDE/Code Editor**

- **Recommended:** VS Code with extensions:
  - ESLint
  - Prettier
  - TypeScript Vue Plugin (Volar)
  - GitLens
  - Playwright Test for VS Code

**Browser Developer Tools**

- Chrome DevTools or Firefox Developer Edition
- React Developer Tools browser extension

---

## 2. Installation and Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-org/agenticverdict.git
cd agenticverdict

# Checkout the correct branch
git checkout feature/phase-00-foundation
```

### Step 2: Install Dependencies

```bash
# Install all dependencies across the monorepo
pnpm install

# This installs dependencies for:
# - apps/frontend/ (TanStack Start web application)
# - apps/api/ (Fastify + tRPC API server)
# - apps/worker/ (BullMQ background job processor)
# - packages/ui/ (Shared component library)
# - packages/i18n/ (Internationalization)
# - packages/config/ (Configuration management)
# - And other workspace packages
```

**Expected output:** Installation should complete in 2-5 minutes depending on your network speed and system performance.

### Step 3: Environment Configuration

```bash
# Copy the example environment file
cp .env.docker.example .env.docker

# Edit .env.docker to configure your local environment
# Minimum required variables:
# - COMPOSE_PROJECT_NAME=agenticverdict
# - DATABASE_URL=postgresql://...
```

### Step 4: Start Infrastructure Services

```bash
# Start PostgreSQL and Redis containers
make infra-up

# Or use Docker Compose directly
docker compose up -d

# Verify services are running
docker compose ps

# The API server will start on port 4000 with tRPC endpoints available at:
# - http://localhost:4000/trpc/{procedure}
```

### Step 5: Initialize the Database

```bash
# Run database migrations
pnpm --filter @agenticverdict/database db:push

# Seed test data (optional, for development)
pnpm db:seed:test
```

---

## 3. Package Structure Overview

The AgenticVerdict UI system follows a monorepo architecture with Turborepo for efficient builds:

### Monorepo Structure

```
agenticverdict/
├── apps/
│   ├── web/                    # TanStack Start web application
│   │   ├── src/
│   │   │   ├── routes/        # File-based routes
│   │   │   ├── components/    # App-specific components
│   │   │   ├── i18n/          # Internationalization config
│   │   │   ├── lib/           # Utilities and helpers
│   │   │   │   └── trpc.ts    # tRPC client setup
│   │   │   └── stores/        # TanStack Store state stores
│   │   ├── public/            # Static assets
│   │   ├── messages/          # Translation files
│   │   ├── package.json
│   │   └── playwright.config.ts
│   │
│   ├── api/                   # Fastify + tRPC API server
│   │   ├── src/
│   │   │   ├── routers/       # tRPC routers
│   │   │   ├── middleware/    # tRPC middleware
│   │   │   └── server.ts      # Fastify server
│   │   └── package.json
│   │
│   └── worker/                # BullMQ background job processor
│
├── packages/
│   ├── ui/                    # Shared component library (Planned)
│   ├── i18n/                  # Shared internationalization
│   ├── config/                # Configuration management
│   ├── core/                  # Business logic
│   ├── types/                 # Shared TypeScript types
│   └── data-connectors/       # Multi-domain integrations (Marketing, Finance, Operations, SEO, Social, Local)
│
├── docs/                      # Comprehensive documentation
├── Makefile                   # Docker Compose convenience targets
├── turbo.json                # Turborepo configuration
└── package.json              # Root package configuration
```

### Web App Structure (`apps/frontend/src/`)

**File-based Routing (TanStack Start)**

- `routes/` - Route files using file-based routing
- `routes/__root.tsx` - Root layout with Mantine provider
- `routes/index.tsx` - Home page
- `lib/trpc.ts` - tRPC client setup for API communication

**Components Organization**

```
components/
├── ui/                       # Reusable UI components
│   ├── AppButton.tsx        # Button wrapper
│   ├── AppTextInput.tsx     # Text input wrapper
│   └── AppCard.tsx          # Card component
│
├── layout/                   # Layout components
│   ├── AppShellLayout.tsx   # Main app shell
│   ├── ColorSchemeToggle.tsx
│   └── LanguageSwitcher.tsx
│
└── forms/                    # Form components
    └── DemoLeadForm.tsx
```

**Internationalization**

- `i18n/routing.ts` - Locale configuration
- `i18n/request.ts` - Server-side i18n setup
- `i18n/navigation.ts` - Localized navigation
- `messages/en.json` - English translations
- `messages/ar.json` - Arabic translations

---

## 4. First Component Creation

Let's create a simple component following AgenticVerdict conventions:

### Step 1: Create a New Component

Create `apps/frontend/src/components/ui/AppBadge.tsx`:

````typescript
"use client";

import { Badge, type BadgeProps } from "@mantine/core";
import type { ReactNode } from "react";

export type AppBadgeProps = BadgeProps & {
  children: ReactNode;
};

/**
 * AppBadge - Thin Mantine wrapper for consistent badge styling
 *
 * @example
 * ```tsx
 * <AppBadge color="green">Active</AppBadge>
 * <AppBadge variant="outline">Pending</AppBadge>
 * ```
 */
export function AppBadge({
  children,
  radius = "sm",
  variant = "filled",
  ...props
}: AppBadgeProps) {
  return (
    <Badge radius={radius} variant={variant} {...props}>
      {children}
    </Badge>
  );
}
````

### Step 2: Create a Container Component (Organism Level)

Create `apps/frontend/src/components/dashboard/ConnectorStatusCard.tsx`:

```typescript
"use client";

import { Card, Group, Stack, Text, Title } from "@mantine/core";
import { useTranslations } from "next-intl";

import { AppBadge } from "../ui/AppBadge";

export interface ConnectorStatusCardProps {
  name: string;
  status: "connected" | "disconnected" | "error";
  lastSync?: Date;
}

/**
 * ConnectorStatusCard - Displays platform connector status
 *
 * Used in dashboard to show connection status for marketing platforms
 * (Meta, GA4, GSC, GBP, TikTok).
 */
export function ConnectorStatusCard({
  name,
  status,
  lastSync,
}: ConnectorStatusCardProps) {
  const t = useTranslations("Connectors");

  const statusColor = {
    connected: "green",
    disconnected: "gray",
    error: "red",
  }[status];

  return (
    <Card shadow="sm" padding="lg" radius="md">
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Title order={4}>{name}</Title>
          <AppBadge color={statusColor}>
            {t(`status.${status}`)}
          </AppBadge>
        </Group>

        {lastSync && (
          <Text size="sm" c="gray.6">
            {t("lastSync")}: {lastSync.toLocaleString()}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
```

### Step 3: Add Translations

Update `apps/frontend/messages/en.json`:

```json
{
  "Connectors": {
    "status": {
      "connected": "Connected",
      "disconnected": "Disconnected",
      "error": "Error"
    },
    "lastSync": "Last sync"
  }
}
```

Update `apps/frontend/messages/ar.json`:

```json
{
  "Connectors": {
    "status": {
      "connected": "متصل",
      "disconnected": "غير متصل",
      "error": "خطأ"
    },
    "lastSync": "آخر مزامنة"
  }
}
```

### Step 4: Use the Component

In `apps/frontend/src/app/[locale]/page.tsx`:

```typescript
import { ConnectorStatusCard } from "@/components/dashboard/ConnectorStatusCard";

export default function HomePage() {
  return (
    <div>
      <ConnectorStatusCard
        name="Meta (Facebook/Instagram)"
        status="connected"
        lastSync={new Date()}
      />
    </div>
  );
}
```

---

## 5. API Integration with tRPC

AgenticVerdict uses tRPC for type-safe API communication between the TanStack Start web app and the Fastify API server. This provides end-to-end type safety without code generation.

### Setting Up the tRPC Client

The tRPC client is configured in `apps/frontend/src/lib/trpc.ts`:

```typescript
// apps/frontend/src/lib/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@agenticverdict/api";

export const trpc = createTRPCReact<AppRouter>();
```

### Using tRPC Queries

Fetch data from the API with full type safety:

```typescript
// apps/frontend/src/routes/dashboard.tsx
import { createRoute } from '@tanstack/react-router'
import { trpc } from '@/lib/trpc'

export const Route = createRoute({
  component: Dashboard,
})

function Dashboard() {
  // Type-safe query - input and output are fully typed
  const { data, isLoading } = trpc.connectors.list.useQuery()

  if (isLoading) return <div>Loading connectors...</div>

  return (
    <div>
      <h1>Connectors</h1>
      {data?.connectors.map((connector) => (
        <div key={connector.id}>
          <h3>{connector.name}</h3>
          <p>Status: {connector.status}</p>
        </div>
      ))}
    </div>
  )
}
```

### Using tRPC Mutations

Perform mutations with automatic cache updates:

```typescript
// apps/frontend/src/routes/connector-settings.tsx
import { trpc } from '@/lib/trpc'

function ConnectorSettings() {
  const utils = trpc.useContext()

  const authenticate = trpc.connectors.authenticate.useMutation({
    onSuccess: () => {
      // Invalidate and refetch queries after mutation
      utils.connectors.list.invalidate()
    },
  })

  const handleAuthenticate = (connector: string, credentials: any) => {
    authenticate.mutate({
      connector,
      credentials,
    })
  }

  return (
    <div>
      <button
        onClick={() => handleAuthenticate('meta', { accessToken: '...' })}
        disabled={authenticate.isLoading}
      >
        Authenticate Meta
      </button>
      {authenticate.error && (
        <div>Error: {authenticate.error.message}</div>
      )}
    </div>
  )
}
```

### Available tRPC Procedures

The API provides these tRPC routers:

| Router         | Procedures                             | Description         |
| -------------- | -------------------------------------- | ------------------- |
| **auth**       | `login`, `logout`, `me`                | Authentication      |
| **connectors** | `list`, `authenticate`, `fetchMetrics` | Platform connectors |
| **companies**  | `getConfig`, `updateConfig`            | Company settings    |
| **reports**    | `generate`, `list`, `getHistory`       | Report operations   |
| **insights**   | `list`, `getById`                      | AI insights         |

For more details, see the API specification in `/prompts/tanstack-start-full-stack-adoption.md`.

---

## 6. Running the Development Server

### Development Mode (Hot Reload)

```bash
# Start all apps in development mode
pnpm dev

# Start only the web app
pnpm --filter @agenticverdict/web dev

# The web app will be available at:
# - http://localhost:3000 (English)
# - http://localhost:3000/ar (Arabic)
```

**Features enabled in dev mode:**

- Turbopack for faster builds
- Hot Module Replacement (HMR)
- Source maps for debugging
- Detailed error messages

### Production-Like Build

```bash
# Build all packages in dependency order
pnpm build

# Build only the web app
pnpm --filter @agenticverdict/web build

# Start production server
pnpm --filter @agenticverdict/web start
```

### Docker Development Stack

```bash
# Start infrastructure + apps with dev stage
make dev

# This starts:
# - PostgreSQL (port 5432)
# - Redis (port 6379)
# - Web app (port 3000)
# - API (port 4000)
# - Worker (background jobs)

# View logs
make logs

# Stop all services
make dev-stop
```

### Health Checks

```bash
# Check all services
make health

# Check individual services
curl http://localhost:3000/api/health  # Web app
curl http://localhost:4000/health       # API
```

---

## 7. Testing Setup

AgenticVerdict uses a comprehensive testing strategy with Vitest (unit tests) and Playwright (E2E tests).

### Unit Testing with Vitest

**Test File Location:** Co-locate tests with components using `.test.ts` suffix

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm --filter @agenticverdict/web test --watch

# Run tests with coverage
pnpm test:coverage
```

**Example Unit Test:** `apps/frontend/src/components/ui/__tests__/AppButton.test.tsx`

```typescript
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppButton } from "../AppButton";

describe("AppButton", () => {
  it("renders children correctly", () => {
    render(<AppButton>Click me</AppButton>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("applies default radius", () => {
    render(<AppButton>Test</AppButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("mantine-Button-radius-md");
  });

  it("supports custom variants", () => {
    render(<AppButton variant="outline">Outline</AppButton>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("mantine-Button-outline");
  });
});
```

### E2E Testing with Playwright

**Test Location:** `apps/frontend/e2e/`

```bash
# Run all E2E tests
pnpm test:e2e

# Run specific test file
pnpm --filter @agenticverdict/web exec playwright test home-journey.spec.ts

# Run tests in headed mode (see browser)
pnpm test:e2e -- --headed

# Debug tests
pnpm test:e2e -- --debug
```

**Example E2E Test:** `apps/frontend/e2e/home-journey.spec.ts`

```typescript
import { expect, test } from "@playwright/test";

test.describe("Home Journey", () => {
  test("loads home page in English", async ({ page }) => {
    await page.goto("http://localhost:3000/en");

    await expect(page).toHaveTitle(/AgenticVerdict/);
    await expect(page.locator("text=AgenticVerdict")).toBeVisible();
  });

  test("switches to Arabic and shows RTL layout", async ({ page }) => {
    await page.goto("http://localhost:3000/en");

    // Click language switcher
    await page.click('button[aria-label*="language"]');
    await page.click('text="العربية"';

    // Verify RTL
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page).toHaveURL(/\/ar\//);
  });

  test("navigates between pages", async ({ page }) => {
    await page.goto("http://localhost:3000/en");

    // Test navigation
    await page.click('text="Dashboard"');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
```

### Accessibility Testing

```bash
# Run accessibility tests with axe-core
pnpm test:e2e a11y-home.spec.ts

# This automatically checks for:
# - WCAG 2.1 AA compliance
# - Color contrast issues
# - Missing ARIA labels
# - Keyboard navigation issues
```

---

## 8. Common Workflows

### Adding a New Page (TanStack Start File-based Routing)

```bash
# Create a new route at /dashboard
mkdir -p apps/frontend/src/routes/dashboard

# Create index.tsx
cat > apps/frontend/src/routes/dashboard/index.tsx << 'EOF'
import { createRoute } from '@tanstack/react-router'
import { Title } from '@mantine/core'
import { useTranslations } from 'next-intl'

export const Route = createRoute({
  component: DashboardPage,
})

function DashboardPage() {
  const t = useTranslations('Dashboard')

  return (
    <div>
      <Title order={1}>{t('title')}</Title>
    </div>
  )
}
EOF

# Add translations
# Update messages/en.json and messages/ar.json
```

### Adding a New Locale

```bash
# 1. Update routing configuration
# Edit apps/frontend/src/i18n/routing.ts:
export const routing = defineRouting({
  locales: ["en", "ar", "fr"],  // Add "fr"
  defaultLocale: "en",
});

# 2. Create translation file
cp apps/frontend/messages/en.json apps/frontend/messages/fr.json

# 3. Translate content in fr.json
```

### Styling with Mantine

```typescript
import { Button, Container, Paper, useMantineTheme } from "@mantine/core";

export function StyledComponent() {
  const theme = useMantineTheme();

  return (
    <Container size="md" mt="xl">
      <Paper
        shadow="md"
        p="xl"
        radius="lg"
        style={{
          backgroundColor: theme.colors.gray[0],
        }}
      >
        <Button
          color="blue"
          size="lg"
          radius="md"
        >
          Click me
        </Button>
      </Paper>
    </Container>
  );
}
```

### State Management with TanStack Store

```typescript
// apps/frontend/src/stores/connector-store.ts
import { create } from "TanStack Store";

interface Connector {
  id: string;
  name: string;
  status: "connected" | "disconnected" | "error";
}

interface ConnectorStore {
  connectors: Connector[];
  addConnector: (connector: Connector) => void;
  updateConnectorStatus: (id: string, status: Connector["status"]) => void;
}

export const useConnectorStore = create<ConnectorStore>((set) => ({
  connectors: [],
  addConnector: (connector) =>
    set((state) => ({ connectors: [...state.connectors, connector] })),
  updateConnectorStatus: (id, status) =>
    set((state) => ({
      connectors: state.connectors.map((c) =>
        c.id === id ? { ...c, status } : c
      ),
    })),
}));

// Usage in component
function ConnectorList() {
  const { connectors, updateConnectorStatus } = useConnectorStore();

  return (
    <div>
      {connectors.map((connector) => (
        <div key={connector.id}>{connector.name}</div>
      ))}
    </div>
  );
}
```

---

## 9. Troubleshooting

### Common Issues and Solutions

#### Issue: Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use a different port
PORT=3001 pnpm --filter @agenticverdict/web dev
```

#### Issue: Module Not Found

**Error:** `Module not found: Can't resolve '@agenticverdict/config'`

**Solution:**

```bash
# Rebuild all packages
pnpm build

# Clear node_modules and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

#### Issue: Docker Containers Not Starting

**Error:** `docker compose up` fails

**Solution:**

```bash
# Check Docker is running
docker ps

# Rebuild containers
docker compose down -v
docker compose up -d --build

# Check logs
docker compose logs web
```

#### Issue: Database Connection Errors

**Error:** `Connection refused at localhost:5432`

**Solution:**

```bash
# Verify PostgreSQL is running
docker compose ps

# Restart database
docker compose restart postgres

# Check database logs
docker compose logs postgres
```

#### Issue: Translation Keys Missing

**Error:** Translation key not found

**Solution:**

```bash
# Validate translations
pnpm --filter @agenticverdict/web i18n:validate

# List all translation keys
pnpm --filter @agenticverdict/web i18n:extract

# Ensure keys exist in both en.json and ar.json
```

#### Issue: RTL Layout Problems

**Symptoms:** Arabic layout looks incorrect

**Solution:**

```typescript
// Ensure DirectionProvider wraps your app
import { DirectionProvider } from "@mantine/core";

function Layout({ children }) {
  return (
    <DirectionProvider initialDirection="auto">
      {children}
    </DirectionProvider>
  );
}

// Use logical properties in CSS
// Instead of: margin-left: 1rem;
// Use: margin-inline-start: 1rem;
```

### Performance Issues

**Slow build times:**

```bash
# Use Turbopack for faster builds
pnpm --filter @agenticverdict/web dev --turbopack

# Clear Next.js cache
rm -rf apps/frontend/.next
```

**Slow page loads:**

```bash
# Analyze bundle size
pnpm --filter @agenticverdict/web build --analyze

# Check for large dependencies
pnpm ls --depth=0
```

---

## 10. Next Steps

### Learning Resources

**Internal Documentation**

- [UI System Overview](/docs/architecture/ui/00-overview.md) - Executive summary
- [Design System Specification](/docs/architecture/ui/02-design-system-specification/) - Component library details
- [Testing Strategy](/docs/02-planning-and-methodology/testing-strategy.md) - Testing requirements and targets
- [Technical Architecture](/docs/architecture/business/technical-architecture.md) - System architecture

**External Resources**

- [TanStack Start Documentation](https://tanstack.com/start/latest)
- [Mantine UI v7 Docs](https://mantine.dev/)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [tRPC Documentation](https://trpc.io/docs)
- [Playwright Testing Guide](https://playwright.dev/docs/intro)

### Development Workflow

1. **Start with existing components** - Check `apps/frontend/src/components/ui/` before creating new ones
2. **Follow atomic design** - Organize components by complexity (atoms → molecules → organisms)
3. **Test RTL layouts** - Always test with both English and Arabic
4. **Write tests first** - Follow TDD for critical components
5. **Check accessibility** - Use keyboard navigation and screen reader testing
6. **Optimize performance** - Lazy load components >50KB, use virtual scrolling for lists

### Component Development Checklist

Before creating a new component:

- [ ] Check if similar component exists in Mantine or `components/ui/`
- [ ] Follow naming convention: `App<ComponentName>` (e.g., `AppButton`, `AppCard`)
- [ ] Add TypeScript types for all props
- [ ] Include JSDoc comments with usage examples
- [ ] Write unit tests with Vitest
- [ ] Test in both LTR and RTL layouts
- [ ] Verify accessibility with keyboard and screen reader
- [ ] Add translations for user-facing strings
- [ ] Consider responsive design (mobile, tablet, desktop)

### Getting Help

**Slack Channels**

- `#ui-development` - UI-specific questions
- `#frontend` - General frontend development
- `#accessibility` - A11y concerns
- `#internationalization` - i18n and RTL issues

**Code Review Process**

1. Create feature branch from `feature/phase-00-foundation`
2. Make changes with clear commit messages
3. Run tests: `pnpm test` and `pnpm test:e2e`
4. Create pull request with description
5. Address review feedback
6. Merge after approval

**Useful Commands**

```bash
# Quick reference
make help              # Show all Makefile targets
pnpm dev               # Start development server
pnpm test              # Run unit tests
pnpm test:e2e          # Run E2E tests
pnpm lint              # Run ESLint
pnpm typecheck         # Run TypeScript checks
pnpm build             # Build all packages
```

---

## Appendix: Quick Reference Commands

### Development

```bash
# Start development
pnpm dev                          # All apps
pnpm --filter @agenticverdict/web dev  # Web app only

# Build
pnpm build                        # All packages
pnpm --filter @agenticverdict/web build  # Web app only

# Testing
pnpm test                         # Unit tests
pnpm test:e2e                     # E2E tests
pnpm test:coverage                # With coverage
```

### Docker

```bash
make dev                          # Full dev stack
make apps-up                      # Production-like apps
make infra-up                     # PostgreSQL + Redis only
make logs                         # View logs
make dev-stop                     # Stop services
```

### Quality

```bash
pnpm lint                         # ESLint
pnpm typecheck                    # TypeScript
pnpm format                       # Prettier
make validate                     # Compose files
```

---

**Document Maintainer:** UI Architecture Team  
**Last Updated:** 2026-04-13  
**Next Review:** After Phase 2 completion  
**Feedback:** Create issue or PR in repository
