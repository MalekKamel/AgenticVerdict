# UI Testing Strategy Guide

**Document Version:** 1.0
**Last Updated:** 2026-04-11
**Status:** Active
**Target Audience:** Frontend Developers, QA Engineers, Test Engineers

---

## Executive Summary

This guide provides comprehensive testing strategies for AgenticVerdict's UI components and applications. Built on TanStack Start, Mantine UI v7, tRPC v11 for type-safe API calls, and multi-language support (English/Arabic with RTL), our testing approach ensures accessibility, performance, and reliability across all user interfaces.

**Core Testing Philosophy:** Fast feedback, comprehensive coverage, and accessibility-first testing. We target 70%+ coverage for UI components (90%+ for critical components like authentication, data visualization, and multi-tenant context management) using a pyramid approach: 70% unit tests, 20% integration tests (including tRPC queries/mutations), and 10% E2E tests.

---

## Table of Contents

1. [Testing Philosophy](#1-testing-philosophy)
2. [Unit Testing with Vitest](#2-unit-testing-with-vitest)
3. [Integration Testing](#3-integration-testing)
4. [Accessibility Testing](#4-accessibility-testing)
5. [E2E Testing with Playwright](#5-e2e-testing-with-playwright)
6. [Testing Best Practices](#6-testing-best-practices)
7. [Code Examples](#7-code-examples)

---

## 1. Testing Philosophy

### 1.1 Testing Pyramid

```
         ┌──────────────────┐
         │   E2E Tests (10%)│
         │  Critical paths  │
         └────────┬─────────┘
                  │
    ┌─────────────┴─────────────┐
    │  Integration Tests (20%)  │
    │  Forms, tRPC queries/mutations, i18n        │
    └─────────────┬─────────────┘
                  │
┌─────────────────┴─────────────────┐
│     Unit Tests (70%)              │
│  Components, hooks, utilities     │
└───────────────────────────────────┘
```

### 1.2 Coverage Targets by Component Type

| Component Type                       | Minimum Coverage | Critical Components | Test Priority |
| ------------------------------------ | ---------------- | ------------------- | ------------- |
| **Atoms** (Button, Input)            | 70%              | 90%                 | High          |
| **Molecules** (FormField, Card)      | 75%              | 85%                 | High          |
| **Organisms** (DataTable, Dashboard) | 80%              | 90%                 | Critical      |
| **Templates** (Layouts)              | 70%              | 80%                 | Medium        |
| **Pages** (Complete views)           | 60%              | 75%                 | Medium        |
| **Hooks** (Custom hooks)             | 85%              | 95%                 | Critical      |
| **Utilities** (Helper functions)     | 90%              | 95%                 | Critical      |

### 1.3 What to Test vs. Not Test

**✅ Test:**

- Component rendering and props
- User interactions (clicks, form submissions)
- State changes and side effects
- Accessibility attributes
- RTL/LTR layout differences
- Form validation
- Error handling
- Multi-language content
- Multi-tenant context
- tRPC queries and mutations

**❌ Don't Test:**

- Third-party library internals (Mantine, Radix UI)
- Static CSS values
- Inline styles (unless dynamic)
- Framework internals (React, Next.js)
- Simple prop passing (wrapper components)

---

## 2. Unit Testing with Vitest

### 2.1 Setup and Configuration

**vitest.config.ts:**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom", // For DOM testing
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "test/"],
    },
    globals: true,
  },
});
```

**test/setup.ts:**

```typescript
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/en",
  useParams: () => ({ locale: "en" }),
}));
```

### 2.2 Component Testing Patterns

#### Basic Component Test

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AppButton } from "@/components/ui/AppButton";

describe("AppButton", () => {
  it("renders children text", () => {
    render(<AppButton>Click me</AppButton>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("applies variant prop", () => {
    render(<AppButton variant="filled">Submit</AppButton>);
    const button = screen.getByRole("button", { name: "Submit" });
    expect(button).toHaveClass("mantine-Button-filled");
  });

  it("calls onClick handler", () => {
    const handleClick = vi.fn();
    render(<AppButton onClick={handleClick}>Click</AppButton>);
    screen.getByRole("button").click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

#### RTL Component Test

```typescript
import { render, screen } from "@testing-library/react";
import { DirectionProvider } from "@mantine/core";
import { AppCard } from "@/components/ui/AppCard";

describe("AppCard - RTL Support", () => {
  const renderWithDirection = (ui: React.ReactNode, direction: "ltr" | "rtl") => {
    return render(
      <DirectionProvider initialDirection={direction}>
        {ui}
      </DirectionProvider>
    );
  };

  it("applies LTR direction correctly", () => {
    renderWithDirection(<AppCard title="Test">Content</AppCard>, "ltr");
    const card = screen.getByText("Test").closest("div");
    expect(card).toHaveStyle({ direction: "ltr" });
  });

  it("applies RTL direction correctly", () => {
    renderWithDirection(<AppCard title="اختبار">محتوى</AppCard>, "rtl");
    const card = screen.getByText("اختبار").closest("div");
    expect(card).toHaveStyle({ direction: "rtl" });
  });

  it("mirrors padding in RTL", () => {
    const { container } = renderWithDirection(
      <AppCard title="Test">Content</AppCard>,
      "rtl"
    );
    const card = container.firstChild as HTMLElement;
    const styles = window.getComputedStyle(card);

    // In RTL, padding-inline-start should be on the right
    expect(styles.paddingInlineStart).toBe("16px");
  });
});
```

### 2.3 Hook Testing

```typescript
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useConnectorStatus } from "@/hooks/useConnectorStatus";

describe("useConnectorStatus", () => {
  it("returns idle status initially", () => {
    const { result } = renderHook(() => useConnectorStatus());
    expect(result.current.status).toBe("idle");
  });

  it("updates status on connect", async () => {
    const { result } = renderHook(() => useConnectorStatus());

    await act(async () => {
      await result.current.connect("meta");
    });

    expect(result.current.status).toBe("connected");
  });

  it("handles connection errors", async () => {
    const { result } = renderHook(() => useConnectorStatus());

    await act(async () => {
      await result.current.connect("invalid-platform");
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.status).toBe("error");
  });
});
```

### 2.4 Utility Testing

```typescript
import { describe, it, expect } from "vitest";
import { formatMetricValue, formatDate } from "@/lib/formatters";

describe("formatters", () => {
  describe("formatMetricValue", () => {
    it("formats numbers with commas", () => {
      expect(formatMetricValue(1000000)).toBe("1,000,000");
    });

    it("handles decimal precision", () => {
      expect(formatMetricValue(1234.567, 2)).toBe("1,234.57");
    });

    it("uses Arabic numerals in RTL context", () => {
      expect(formatMetricValue(1234, 0, "ar")).toBe("١٬٢٣٤");
    });
  });

  describe("formatDate", () => {
    it("formats dates in English locale", () => {
      const date = new Date("2026-04-11");
      expect(formatDate(date, "en")).toBe("April 11, 2026");
    });

    it("formats dates in Arabic locale", () => {
      const date = new Date("2026-04-11");
      expect(formatDate(date, "ar")).toBe("١١ أبريل ٢٠٢٦");
    });

    it("uses Hijri calendar when configured", () => {
      const date = new Date("2026-04-11");
      expect(formatDate(date, "ar", "hijri")).toContain("رمضان");
    });
  });
});
```

### 2.5 Mocking Strategies

#### Mocking tRPC

**Setup tRPC Mock Factory**

```typescript
// test/mocks/trpc.ts
import { vi } from "vitest";

// Mock tRPC client factory
export const createMockTRPCClient = () => ({
  connectors: {
    list: {
      useQuery: vi.fn(),
    },
    getStatus: {
      useQuery: vi.fn(),
    },
    authenticate: {
      useMutation: vi.fn(),
    },
  },
  insights: {
    list: {
      useQuery: vi.fn(),
    },
    generate: {
      useMutation: vi.fn(),
    },
  },
  reports: {
    generate: {
      useMutation: vi.fn(),
    },
    getHistory: {
      useQuery: vi.fn(),
    },
  },
});

// Default mock data
export const mockConnectors = [
  { id: "meta", name: "Meta", status: "connected", lastSync: "2026-04-13T10:00:00Z" },
  { id: "ga4", name: "Google Analytics", status: "disconnected", lastSync: null },
  {
    id: "gsc",
    name: "Google Search Console",
    status: "connected",
    lastSync: "2026-04-13T09:00:00Z",
  },
];

export const mockInsights = [
  {
    id: "insight-1",
    title: "Traffic spike detected",
    severity: "info",
    createdAt: "2026-04-13T10:00:00Z",
  },
  {
    id: "insight-2",
    title: "Conversion rate drop",
    severity: "warning",
    createdAt: "2026-04-13T09:00:00Z",
  },
];

// Test utilities
export function mockQuerySuccess(hook: any, data: any) {
  return { data, isLoading: false, error: null, refetch: vi.fn(), invalidate: vi.fn() };
}

export function mockQueryLoading(hook: any) {
  return { data: undefined, isLoading: true, error: null, refetch: vi.fn(), invalidate: vi.fn() };
}

export function mockQueryError(hook: any, errorMessage: string) {
  return {
    data: undefined,
    isLoading: false,
    error: { message: errorMessage },
    refetch: vi.fn(),
    invalidate: vi.fn(),
  };
}

export function mockMutationSuccess(hook: any) {
  const mutate = vi.fn((variables, { onSuccess }) => {
    if (onSuccess) onSuccess({ id: "test-id", ...variables });
  });
  return { mutate, isLoading: false, error: null, reset: vi.fn() };
}

export function mockMutationLoading(hook: any) {
  const mutate = vi.fn();
  return { mutate, isLoading: true, error: null, reset: vi.fn() };
}

export function mockMutationError(hook: any, errorMessage: string) {
  const mutate = vi.fn();
  return { mutate, isLoading: false, error: { message: errorMessage }, reset: vi.fn() };
}
```

**Using tRPC Mocks in Tests**

```typescript
// test/setup.ts
import { vi } from "vitest";
import { createMockTRPCClient } from "./mocks/trpc";

// Mock the tRPC client globally
vi.mock("@/lib/trpc", () => ({
  trpc: createMockTRPCClient(),
  // Add useContext if needed
  useContext: vi.fn(() => ({
    connectors: {
      list: {
        invalidate: vi.fn(),
      },
    },
  })),
}));
```

**Component Test with Mocked tRPC**

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Dashboard } from "@/components/Dashboard";
import { trpc } from "@/lib/trpc";
import { mockConnectors, mockQuerySuccess } from "@/test/mocks/trpc";

describe("Dashboard with mocked tRPC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders connector data from mocked query", () => {
    (trpc.connectors.list.useQuery as vi.Mock).mockReturnValue(
      mockQuerySuccess(trpc.connectors.list.useQuery, mockConnectors)
    );

    render(<Dashboard />);

    expect(screen.getByText("Meta")).toBeInTheDocument();
    expect(screen.getByText("Google Analytics")).toBeInTheDocument();
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
  });

  it("shows loading state from mocked query", () => {
    (trpc.connectors.list.useQuery as vi.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<Dashboard />);

    expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();
  });

  it("handles error state from mocked query", () => {
    (trpc.connectors.list.useQuery as vi.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: "Failed to fetch connectors" },
    });

    render(<Dashboard />);

    expect(screen.getByText(/failed to fetch connectors/i)).toBeInTheDocument();
  });

  it("tests mutation with mocked success response", async () => {
    const mutateMock = vi.fn();
    (trpc.connectors.authenticate.useMutation as vi.Mock).mockReturnValue({
      mutate: mutateMock,
      isLoading: false,
      error: null,
    });

    render(<Dashboard />);

    // Simulate user action triggering mutation
    const connectButton = screen.getByRole("button", { name: /connect meta/i });
    await userEvent.click(connectButton);

    expect(mutateMock).toHaveBeenCalledWith({
      connector: "meta",
      credentials: { accessToken: expect.any(String) }
    });
  });
});
```

**Testing Error States with Mocks**

```typescript
describe("Error handling with mocked tRPC", () => {
  it("displays network error message", () => {
    (trpc.connectors.list.useQuery as vi.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: {
        message: "Network Error: Failed to reach API server",
        code: "NETWORK_ERROR"
      },
    });

    render(<Dashboard />);

    expect(screen.getByText(/network error/i)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
  });

  it("displays authentication error message", () => {
    (trpc.connectors.authenticate.useMutation as vi.Mock).mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
      error: {
        message: "Authentication failed: Invalid credentials",
        code: "UNAUTHORIZED"
      },
    });

    render(<AuthForm />);

    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveClass("error-alert");
  });

  it("displays tenant context error", () => {
    (trpc.tenants.getConfig.useQuery as vi.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: {
        message: "Tenant context not found",
        code: "NOT_FOUND"
      },
    });

    render(<SettingsPage />);

    expect(screen.getByText(/tenant context not found/i)).toBeInTheDocument();
  });
});
```

#### Mocking Tenant Context

```typescript
import { createTestTenantContext } from "@agenticverdict/testing";
import { TenantContextProvider } from "@/providers/TenantContextProvider";

const TestWrapper = ({ children, tenantContext }) => (
  <TenantContextProvider value={tenantContext}>
    {children}
  </TenantContextProvider>
);

describe("with tenant context", () => {
  it("uses tenant-specific config", () => {
    const tenantContext = createTestTenantContext({
      tenantConfig: {
        localization: { language: "ar", region: "SA" }
      }
    });

    render(
      <TestWrapper tenantContext={tenantContext}>
        <Dashboard />
      </TestWrapper>
    );

    expect(screen.getByText("مرحباً")).toBeInTheDocument();
  });
});
```

### 2.6 Testing tRPC Hooks and Queries

Testing components that consume tRPC requires mocking the tRPC client and its hooks. This ensures tests remain fast and deterministic while verifying correct API integration patterns.

#### Mocking tRPC Responses

```typescript
// test/utils/trpc-mocks.ts
import { vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

export const mockTRPCContext = {
  connectors: {
    list: vi.fn(),
    getStatus: vi.fn(),
    authenticate: vi.fn(),
  },
  insights: {
    list: vi.fn(),
    generate: vi.fn(),
  },
};

export function mockTRPCQuery(hook: () => any, mockData: any) {
  const result = renderHook(hook);
  mockTRPCContext.connectors.list.mockResolvedValue(mockData);
  return result;
}
```

#### Testing Components with tRPC Queries

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConnectorList } from "@/components/connectors/ConnectorList";
import { trpc } from "@/lib/trpc";

// Mock the tRPC client
vi.mock("@/lib/trpc", () => ({
  trpc: {
    connectors: {
      list: {
        useQuery: vi.fn(),
      },
    },
  },
}));

describe("ConnectorList with tRPC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    (trpc.connectors.list.useQuery as vi.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<ConnectorList />);
    expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();
  });

  it("renders connector data from tRPC query", async () => {
    const mockConnectors = [
      { id: "meta", name: "Meta", status: "connected" },
      { id: "ga4", name: "Google Analytics", status: "disconnected" },
    ];

    (trpc.connectors.list.useQuery as vi.Mock).mockReturnValue({
      data: mockConnectors,
      isLoading: false,
      error: null,
    });

    render(<ConnectorList />);

    expect(screen.getByText("Meta")).toBeInTheDocument();
    expect(screen.getByText("Google Analytics")).toBeInTheDocument();
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
  });

  it("handles tRPC error states", async () => {
    (trpc.connectors.list.useQuery as vi.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: "Failed to fetch connectors" },
    });

    render(<ConnectorList />);

    expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument();
  });

  it("refetches on retry click", async () => {
    const refetchMock = vi.fn();
    (trpc.connectors.list.useQuery as vi.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: "Network error" },
      refetch: refetchMock,
    });

    render(<ConnectorList />);

    const retryButton = screen.getByRole("button", { name: /retry/i });
    await userEvent.click(retryButton);

    expect(refetchMock).toHaveBeenCalledTimes(1);
  });
});
```

#### Testing Components with tRPC Mutations

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ConnectorAuthForm } from "@/components/connectors/ConnectorAuthForm";
import { trpc } from "@/lib/trpc";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    connectors: {
      authenticate: {
        useMutation: vi.fn(),
      },
    },
  },
}));

describe("ConnectorAuthForm with tRPC mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits authentication request to tRPC", async () => {
    const mutateMock = vi.fn();
    (trpc.connectors.authenticate.useMutation as vi.Mock).mockReturnValue({
      mutate: mutateMock,
      isLoading: false,
      error: null,
    });

    render(<ConnectorAuthForm connector="meta" />);

    const apiKeyInput = screen.getByLabelText(/api key/i);
    await userEvent.type(apiKeyInput, "EAABwzLixnjYBO123456");

    const submitButton = screen.getByRole("button", { name: /connect/i });
    await userEvent.click(submitButton);

    expect(mutateMock).toHaveBeenCalledWith(
      { connector: "meta", credentials: { accessToken: "EAABwzLixnjYBO123456" } }
    );
  });

  it("shows loading state during mutation", async () => {
    (trpc.connectors.authenticate.useMutation as vi.Mock).mockReturnValue({
      mutate: vi.fn(),
      isLoading: true,
      error: null,
    });

    render(<ConnectorAuthForm connector="meta" />);

    const submitButton = screen.getByRole("button", { name: /connecting/i });
    expect(submitButton).toBeDisabled();
  });

  it("handles mutation errors", async () => {
    (trpc.connectors.authenticate.useMutation as vi.Mock).mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
      error: { message: "Invalid credentials" },
    });

    render(<ConnectorAuthForm connector="meta" />);

    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it("invalidates related queries on success", async () => {
    const utils = {
      connectors: {
        list: {
          invalidate: vi.fn(),
        },
      },
    };

    (trpc.connectors.authenticate.useMutation as vi.Mock).mockReturnValue({
      mutate: vi.fn((_, { onSuccess }) => {
        onSuccess();
      }),
      isLoading: false,
      error: null,
    });

    const { invalidate } = trpc.useUtils();
    render(<ConnectorAuthForm connector="meta" onSuccess={() => invalidate()} />);

    await waitFor(() => {
      expect(utils.connectors.list.invalidate).toHaveBeenCalled();
    });
  });
});
```

#### Testing Custom Hooks with tRPC

```typescript
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useConnectorAuth } from "@/hooks/useConnectorAuth";
import { trpc } from "@/lib/trpc";

vi.mock("@/lib/trpc", () => ({
  trpc: {
    connectors: {
      authenticate: {
        useMutation: vi.fn(),
      },
      getStatus: {
        useQuery: vi.fn(),
      },
    },
  },
}));

describe("useConnectorAuth hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("authenticates connector successfully", async () => {
    const mutateMock = vi.fn();
    (trpc.connectors.authenticate.useMutation as vi.Mock).mockReturnValue({
      mutate: mutateMock,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useConnectorAuth());

    await act(async () => {
      await result.current.authenticate("meta", { accessToken: "test-token" });
    });

    expect(mutateMock).toHaveBeenCalledWith({
      connector: "meta",
      credentials: { accessToken: "test-token" },
    });
  });

  it("returns connector status from query", () => {
    (trpc.connectors.getStatus.useQuery as vi.Mock).mockReturnValue({
      data: { status: "connected", lastSync: "2026-04-13T10:00:00Z" },
      isLoading: false,
    });

    const { result } = renderHook(() => useConnectorAuth("meta"));

    expect(result.current.status).toBe("connected");
    expect(result.current.lastSync).toBe("2026-04-13T10:00:00Z");
  });
});
```

#### Mock Factory Helpers

```typescript
// test/utils/trpc-factories.ts
import { vi } from "vitest";

export function createMockQuery<T>(data: T, isLoading = false) {
  return {
    data,
    isLoading,
    error: null,
    refetch: vi.fn(),
    invalidate: vi.fn(),
  };
}

export function createMockMutation<T>() {
  return {
    mutate: vi.fn(),
    isLoading: false,
    error: null,
    reset: vi.fn(),
  };
}

export function createMockQueryError(errorMessage: string) {
  return {
    data: undefined,
    isLoading: false,
    error: { message: errorMessage },
    refetch: vi.fn(),
  };
}

// Usage
import { createMockQuery, createMockMutation } from "@/test/utils/trpc-factories";

(trpc.connectors.list.useQuery as vi.Mock).mockReturnValue(
  createMockQuery([{ id: "meta", name: "Meta" }]),
);

(trpc.connectors.authenticate.useMutation as vi.Mock).mockReturnValue(createMockMutation());
```

---

## 3. Integration Testing

### 3.1 tRPC Integration Testing

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@agenticverdict/api/src/router";

describe("tRPC integration", () => {
  let client: ReturnType<typeof createTRPCProxyClient<AppRouter>>;
  let serverUrl: string;

  beforeAll(async () => {
    // Start test server
    serverUrl = await startTestServer();

    client = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${serverUrl}/trpc`,
          headers: async () => ({
            Authorization: `Bearer ${getTestToken()}`,
          }),
        }),
      ],
    });
  });

  afterAll(async () => {
    await stopTestServer();
  });

  it("fetches connector list", async () => {
    const connectors = await client.connectors.list.query();
    expect(connectors).toBeInstanceOf(Array);
    expect(connectors[0]).toHaveProperty("id");
    expect(connectors[0]).toHaveProperty("name");
  });

  it("creates insight with tenant isolation", async () => {
    const tenantContext = createTestTenantContext();

    const insight = await client.insights.create.mutate(
      {
        title: "Test Insight",
        connectorId: "meta",
      },
      { context: tenantContext },
    );

    expect(insight).toHaveProperty("id");
    expect(insight.tenantId).toBe(tenantContext.tenantId);
  });
});
```

### 3.2 Form Validation Testing

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { ConnectorForm } from "@/components/forms/ConnectorForm";

describe("ConnectorForm validation", () => {
  it("shows validation errors for empty fields", async () => {
    render(<ConnectorForm />);

    const submitButton = screen.getByRole("button", { name: "Connect" });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("API Key is required")).toBeInTheDocument();
      expect(screen.getByText("Platform is required")).toBeInTheDocument();
    });
  });

  it("validates API key format", async () => {
    render(<ConnectorForm />);

    const apiKeyInput = screen.getByLabelText("API Key");
    await userEvent.type(apiKeyInput, "invalid-key");

    const submitButton = screen.getByRole("button", { name: "Connect" });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid API key format/i)).toBeInTheDocument();
    });
  });

  it("submits successfully with valid data", async () => {
    const onSubmit = vi.fn();
    render(<ConnectorForm onSubmit={onSubmit} />);

    await userEvent.selectOptions(
      screen.getByLabelText("Platform"),
      "meta"
    );
    await userEvent.type(
      screen.getByLabelText("API Key"),
      "EAABwzLixnjYBO123456"
    );
    await userEvent.click(screen.getByRole("button", { name: "Connect" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        platform: "meta",
        apiKey: "EAABwzLixnjYBO123456",
      });
    });
  });
});
```

### 3.3 Multi-Tenant Context Testing

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TenantContextProvider, type TenantContext } from "@/providers/TenantContextProvider";
import { Dashboard } from "@/components/Dashboard";

describe("multi-tenant context", () => {
  const renderWithTenant = (ui: React.ReactNode, tenantContext: TenantContext) => {
    return render(
      <TenantContextProvider value={tenantContext}>
        {ui}
      </TenantContextProvider>
    );
  };

  it("displays tenant-specific branding", () => {
    const tenantContext = createTestTenantContext({
      tenantConfig: {
        branding: {
          logoUrl: "/logos/tenant-alpha.svg",
          primaryColor: "#FF6B35",
        }
      }
    });

    renderWithTenant(<Dashboard />, tenantContext);

    const logo = screen.getByRole("img", { name: /tenant logo/i });
    expect(logo).toHaveAttribute("src", "/logos/tenant-alpha.svg");
  });

  it("enforces tenant data isolation", () => {
    const tenantAlpha = createTestTenantContext({ tenantId: "tenant-alpha" });
    const tenantBeta = createTestTenantContext({ tenantId: "tenant-beta" });

    const { rerender } = renderWithTenant(<Dashboard />, tenantAlpha);
    expect(screen.getByText("tenant-alpha")).toBeInTheDocument();

    rerender(
      <TenantContextProvider value={tenantBeta}>
        <Dashboard />
      </TenantContextProvider>
    );
    expect(screen.getByText("tenant-beta")).toBeInTheDocument();
    expect(screen.queryByText("tenant-alpha")).not.toBeInTheDocument();
  });
});
```

### 3.4 i18n Switching Tests

```typescript
import { render, screen } from "@testing-library/react";
import { useRouter, usePathname } from "next/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

describe("language switching", () => {
  it("switches from English to Arabic", async () => {
    const push = vi.fn();
    (useRouter as any).mockReturnValue({ push });
    (usePathname as any).mockReturnValue("/en/dashboard");

    render(<LanguageSwitcher />);

    const arabicButton = screen.getByRole("button", { name: "العربية" });
    await userEvent.click(arabicButton);

    expect(push).toHaveBeenCalledWith("/ar/dashboard");
  });

  it("updates document direction attribute", async () => {
    const { container } = render(<LanguageSwitcher />);

    // Start in English
    expect(container.documentElement).toHaveAttribute("dir", "ltr");

    // Switch to Arabic
    const arabicButton = screen.getByRole("button", { name: "العربية" });
    await userEvent.click(arabicButton);

    expect(container.documentElement).toHaveAttribute("dir", "rtl");
  });
});
```

---

## 4. Accessibility Testing

### 4.1 Automated Accessibility Testing with jest-axe

**Setup:**

```typescript
// test/a11y.ts
import { toHaveNoViolations } from "jest-axe";
import { expect } from "vitest";

expect.extend(toHaveNoViolations);
```

**Component A11y Test:**

```typescript
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { AppCard } from "@/components/ui/AppCard";

expect.extend(toHaveNoViolations);

describe("AppCard accessibility", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(
      <AppCard title="Test Card" aria-label="Test card">
        <p>Card content</p>
      </AppCard>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("maintains accessibility in RTL mode", async () => {
    const { container } = render(
      <DirectionProvider initialDirection="rtl">
        <AppCard title="بطاقة اختبار" aria-label="بطاقة اختبار">
          <p>محتوى البطاقة</p>
        </AppCard>
      </DirectionProvider>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 4.2 Keyboard Navigation Tests

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { Modal } from "@/components/ui/Modal";

describe("Modal keyboard navigation", () => {
  it("closes on Escape key", async () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    );

    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();
  });

  it("traps focus within modal", async () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Test Modal">
        <button>First Button</button>
        <button>Second Button</button>
      </Modal>
    );

    const buttons = screen.getAllByRole("button");
    buttons[0].focus();

    // Tab should cycle within modal
    await userEvent.tab();
    expect(buttons[1]).toHaveFocus();

    await userEvent.tab();
    expect(buttons[0]).toHaveFocus(); // Focus wrapped
  });

  it("supports arrow key navigation in RTL", async () => {
    render(
      <DirectionProvider initialDirection="rtl">
        <TabList>
          <Tab>Tab 1</Tab>
          <Tab>Tab 2</Tab>
          <Tab>Tab 3</Tab>
        </TabList>
      </DirectionProvider>
    );

    const tabs = screen.getAllByRole("tab");
    tabs[0].focus();

    // In RTL, left arrow moves forward
    await userEvent.keyboard("{ArrowLeft}");
    expect(tabs[1]).toHaveFocus();

    // Right arrow moves backward
    await userEvent.keyboard("{ArrowRight}");
    expect(tabs[0]).toHaveFocus();
  });
});
```

### 4.3 Screen Reader Testing

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DataCard } from "@/components/ui/DataCard";

describe("screen reader announcements", () => {
  it("announces data loading states", () => {
    render(<DataCard isLoading />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("provides accessible data table structure", () => {
    render(
      <DataTable
        columns={["Name", "Value"]}
        data={[{ name: "Test", value: 123 }]}
      />
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
  });

  it("includes aria-labels for icon-only buttons", () => {
    render(<ActionButton icon={<Icon />} aria-label="Refresh data" />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Refresh data");
  });
});
```

### 4.4 Color Contrast Validation

```typescript
import { describe, it, expect } from "vitest";
import { getContrastRatio } from "@/lib/a11y-utils";

describe("color contrast", () => {
  it("meets WCAG AA standards for normal text", () => {
    const contrast = getContrastRatio("#228BE6", "#FFFFFF");
    expect(contrast).toBeGreaterThanOrEqual(4.5); // AA requirement
  });

  it("meets WCAG AA standards for large text", () => {
    const contrast = getContrastRatio("#228BE6", "#FFFFFF");
    expect(contrast).toBeGreaterThanOrEqual(3.0); // AA for large text
  });

  it("validates theme color combinations", () => {
    const theme = getMantineTheme();
    const primaryColor = theme.colors.blue[6];
    const backgroundColor = theme.white;

    expect(getContrastRatio(primaryColor, backgroundColor)).toBeGreaterThanOrEqual(4.5);
  });
});
```

---

## 5. E2E Testing with Playwright

### 5.1 Critical User Journeys

**playwright.config.ts:**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
  ],

  webServer: {
    command: "pnpm run build && pnpm run start",
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

**E2E Test Example:**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Connector Setup Journey", () => {
  test("user adds Meta connector", async ({ page }) => {
    // Navigate to connectors page
    await page.goto("/en/connectors");
    await expect(page).toHaveTitle(/Connectors/);

    // Click add connector button
    await page.click('button:has-text("Add Connector")');

    // Select Meta platform
    await page.selectOption("select[name='platform']", "meta");

    // Enter API credentials
    await page.fill("input[name='apiKey']", "test-api-key");
    await page.fill("input[name='apiSecret']", "test-api-secret");

    // Submit form
    await page.click('button:has-text("Connect")');

    // Verify success
    await expect(page.locator(".toast-success")).toContainText("Connector added");
    await expect(page.locator("text=Meta")).toBeVisible();
  });

  test("validates connector health", async ({ page }) => {
    await page.goto("/en/connectors");

    const statusIndicator = page.locator("[data-status='connected']").first();
    await expect(statusIndicator).toHaveAttribute("aria-label", "Connected");
  });
});
```

### 5.2 Multi-Tenant Workflows

```typescript
import { test, expect } from "@playwright/test";

test.describe("multi-tenant workflows", () => {
  test("tenant-specific data isolation", async ({ page }) => {
    // Login as tenant-alpha
    await page.goto("/en/login");
    await page.fill("input[name='email']", "user@tenant-alpha.com");
    await page.fill("input[name='password']", "password");
    await page.click('button:has-text("Sign In")');

    // Verify tenant-alpha data
    await expect(page.locator("text=tenant-alpha")).toBeVisible();
    const alphaInsights = await page.locator(".insight-card").count();

    // Logout and login as tenant-beta
    await page.click('button:has-text("Logout")');
    await page.fill("input[name='email']", "user@tenant-beta.com");
    await page.fill("input[name='password']", "password");
    await page.click('button:has-text("Sign In")');

    // Verify tenant-beta data (different from alpha)
    await expect(page.locator("text=tenant-beta")).toBeVisible();
    const betaInsights = await page.locator(".insight-card").count();
    expect(betaInsights).not.toBe(alphaInsights);
  });

  test("tenant-specific branding", async ({ page }) => {
    await page.goto("/en/login");
    await page.fill("input[name='email']", "user@tenant-alpha.com");
    await page.fill("input[name='password']", "password");
    await page.click('button:has-text("Sign In")');

    const logo = page.locator("img[alt='Tenant Logo']");
    await expect(logo).toHaveAttribute("src", /tenant-alpha/);
  });
});
```

### 5.3 Language Switching

```typescript
import { test, expect } from "@playwright/test";

test.describe("language switching", () => {
  test("switches from English to Arabic", async ({ page }) => {
    await page.goto("/en/dashboard");

    // Verify English content
    await expect(page).toHaveAttribute("lang", "en");
    await expect(page).toHaveAttribute("dir", "ltr");
    await expect(page.locator("h1")).toContainText("Dashboard");

    // Switch to Arabic
    await page.click('button:has-text("العربية")');

    // Verify Arabic content
    await expect(page).toHaveAttribute("lang", "ar");
    await expect(page).toHaveAttribute("dir", "rtl");
    await expect(page.locator("h1")).toContainText("لوحة القيادة");

    // Verify URL update
    await expect(page).toHaveURL("/ar/dashboard");
  });

  test("maintains state across language changes", async ({ page }) => {
    await page.goto("/en/dashboard");

    // Open a panel
    await page.click('button:has-text("Settings")');
    await expect(page.locator("[data-panel='settings']")).toBeVisible();

    // Switch language
    await page.click('button:has-text("العربية")');

    // Panel should remain open
    await expect(page.locator("[data-panel='settings']")).toBeVisible();
  });
});
```

### 5.4 Visual Regression Testing

```typescript
import { test, expect } from "@playwright/test";

test.describe("visual regression", () => {
  test("dashboard layout matches snapshot", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page).toHaveScreenshot("dashboard.png");
  });

  test("RTL layout matches snapshot", async ({ page }) => {
    await page.goto("/ar/dashboard");
    await expect(page).toHaveScreenshot("dashboard-rtl.png");
  });

  test("data table matches snapshot", async ({ page }) => {
    await page.goto("/en/reports/data");
    await expect(page.locator(".data-table")).toHaveScreenshot("data-table.png");
  });
});
```

---

## 6. Testing Best Practices

### 6.1 Test Organization

**Directory Structure:**

```
apps/frontend/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── AppButton.tsx
│   │   │   ├── AppButton.test.tsx
│   │   │   ├── AppCard.tsx
│   │   │   └── AppCard.test.tsx
│   │   └── forms/
│   │       ├── ConnectorForm.tsx
│   │       └── ConnectorForm.test.tsx
│   ├── hooks/
│   │   ├── useConnectorStatus.ts
│   │   └── useConnectorStatus.test.ts
│   └── lib/
│       ├── formatters.ts
│       └── formatters.test.ts
├── e2e/
│   ├── critical-journeys/
│   │   ├── connector-setup.spec.ts
│   │   └── report-generation.spec.ts
│   ├── multi-tenant/
│   │   └── tenant-isolation.spec.ts
│   └── a11y/
│       └── accessibility.spec.ts
└── test/
    ├── setup.ts
    ├── helpers.ts
    └── a11y.ts
```

### 6.2 Fixture Management

**test/fixtures/tenant.ts:**

```typescript
import { createTestTenantContext } from "@agenticverdict/testing";

export const tenantFixtures = {
  masafh: () =>
    createTestTenantContext({
      tenantId: "masafh",
      tenantConfig: {
        branding: { primaryColor: "#FF6B35" },
        localization: { language: "ar", region: "SA" },
      },
    }),

  defaultTenant: () =>
    createTestTenantContext({
      tenantId: "default-tenant",
      tenantConfig: {
        branding: { primaryColor: "#228BE6" },
        localization: { language: "en", region: "US" },
      },
    }),
};
```

**test/fixtures/connector.ts:**

```typescript
export const connectorFixtures = {
  metaConnected: () => ({
    id: "meta",
    name: "Meta",
    status: "connected",
    lastSync: new Date().toISOString(),
  }),

  metaError: () => ({
    id: "meta",
    name: "Meta",
    status: "error",
    error: "Authentication failed",
  }),
};
```

### 6.3 Test Data Factories

**packages/testing/src/factories/connector-factory.ts:**

```typescript
import { faker } from "@faker-js/faker";

export interface ConnectorFactoryOptions {
  status?: "connected" | "error" | "idle";
  platform?: "meta" | "ga4" | "gsc";
}

export function createConnector(options: ConnectorFactoryOptions = {}) {
  return {
    id: faker.string.uuid(),
    name: options.platform === "meta" ? "Meta" : "GA4",
    status: options.status ?? "idle",
    platform: options.platform ?? "meta",
    createdAt: faker.date.past().toISOString(),
    lastSync: faker.date.recent().toISOString(),
  };
}

export function createConnectors(count: number, options?: ConnectorFactoryOptions) {
  return Array.from({ length: count }, () => createConnector(options));
}
```

### 6.4 CI/CD Integration

**.github/workflows/test.yml:**

```yaml
name: Test Suite

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests
        run: pnpm test --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  a11y-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run accessibility tests
        run: pnpm test:a11y
```

---

## 7. Code Examples

### 7.1 Complete Component Test Suite

```typescript
// AppButton.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { DirectionProvider } from "@mantine/core";
import { AppButton } from "./AppButton";

expect.extend(toHaveNoViolations);

const renderWithDirection = (ui: React.ReactNode, direction: "ltr" | "rtl") => {
  return render(
    <DirectionProvider initialDirection={direction}>
      {ui}
    </DirectionProvider>
  );
};

describe("AppButton", () => {
  // Rendering tests
  describe("rendering", () => {
    it("renders children text", () => {
      render(<AppButton>Click me</AppButton>);
      expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
    });

    it("applies default props", () => {
      render(<AppButton>Submit</AppButton>);
      const button = screen.getByRole("button", { name: "Submit" });
      expect(button).toHaveClass("mantine-Button-root");
      expect(button).toHaveAttribute("type", "button");
    });

    it("applies custom variant", () => {
      render(<AppButton variant="light">Light</AppButton>);
      expect(screen.getByRole("button")).toHaveClass("mantine-Button-light");
    });
  });

  // Interaction tests
  describe("interactions", () => {
    it("calls onClick handler", async () => {
      const handleClick = vi.fn();
      render(<AppButton onClick={handleClick}>Click</AppButton>);

      await userEvent.click(screen.getByRole("button"));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not call onClick when disabled", async () => {
      const handleClick = vi.fn();
      render(<AppButton onClick={handleClick} disabled>Click</AppButton>);

      await userEvent.click(screen.getByRole("button"));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // Accessibility tests
  describe("accessibility", () => {
    it("has no accessibility violations", async () => {
      const { container } = render(<AppButton>Accessible Button</AppButton>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("supports keyboard navigation", async () => {
      render(<AppButton>Submit</AppButton>);
      const button = screen.getByRole("button");

      button.focus();
      expect(button).toHaveFocus();

      await userEvent.keyboard("{Enter}");
      // Verify Enter key triggers action
    });

    it("includes aria-label for icon-only buttons", () => {
      render(<AppButton aria-label="Refresh"><IconRefresh /></AppButton>);
      expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Refresh");
    });
  });

  // RTL tests
  describe("RTL support", () => {
    it("renders correctly in LTR", () => {
      renderWithDirection(<AppButton>Click</AppButton>, "ltr");
      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ direction: "ltr" });
    });

    it("renders correctly in RTL", () => {
      renderWithDirection(<AppButton>اضغط</AppButton>, "rtl");
      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ direction: "rtl" });
    });

    it("mirrors padding in RTL", () => {
      const { container } = renderWithDirection(
        <AppButton>Button</AppButton>,
        "rtl"
      );
      const button = container.querySelector("button");
      expect(button).toHaveStyle({
        paddingInlineStart: "18px",
        paddingInlineEnd: "18px",
      });
    });
  });

  // Edge cases
  describe("edge cases", () => {
    it("handles long text content", () => {
      render(
        <AppButton>
          This is a very long button text that should wrap properly
        </AppButton>
      );
      expect(screen.getByRole("button")).toBeVisible();
    });

    it("handles empty children gracefully", () => {
      render(<AppButton>{""}</AppButton>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });
});
```

### 7.2 Complete Hook Test Suite

```typescript
// useConnectorStatus.test.ts
import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useConnectorStatus } from "./useConnectorStatus";
import { createTestTenantContext } from "@agenticverdict/testing";

describe("useConnectorStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns idle status initially", () => {
    const { result } = renderHook(() => useConnectorStatus());
    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
  });

  it("updates status to connecting when connecting", async () => {
    const { result } = renderHook(() => useConnectorStatus());

    act(() => {
      result.current.connect("meta");
    });

    expect(result.current.status).toBe("connecting");
  });

  it("updates status to connected on success", async () => {
    const { result } = renderHook(() => useConnectorStatus("meta"));

    await act(async () => {
      await result.current.connect("meta");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("connected");
    });
  });

  it("handles connection errors", async () => {
    const { result } = renderHook(() => useConnectorStatus("invalid-platform"));

    await act(async () => {
      await result.current.connect("invalid-platform");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
      expect(result.current.error).toBeTruthy();
    });
  });

  it("respects tenant context", async () => {
    const tenantContext = createTestTenantContext({
      tenantId: "test-tenant",
    });

    const { result } = renderHook(() =>
      useConnectorStatus("meta", {
        tenantContext,
      }),
    );

    await act(async () => {
      await result.current.connect("meta");
    });

    // Verify tenant context is used in API calls
    expect(result.current.tenantId).toBe("test-tenant");
  });
});
```

### 7.3 Complete E2E Test Suite

```typescript
// connector-setup.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Connector Setup Journey", () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/en/login");
    await page.fill("input[name='email']", "test@example.com");
    await page.fill("input[name='password']", "password");
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL("/en/dashboard");
  });

  test("adds Meta connector successfully", async ({ page }) => {
    await page.goto("/en/connectors");

    // Click add connector
    await page.click('button:has-text("Add Connector")');
    await expect(page.locator("h2")).toContainText("Add Connector");

    // Fill form
    await page.selectOption("select[name='platform']", "meta");
    await page.fill("input[name='apiKey']", "test-api-key");
    await page.fill("input[name='apiSecret']", "test-api-secret");

    // Submit
    await page.click('button:has-text("Connect")');

    // Verify success
    await expect(page.locator(".toast-success")).toContainText("Connector added");
    await expect(page.locator("text=Meta")).toBeVisible();
  });

  test("validates form fields", async ({ page }) => {
    await page.goto("/en/connectors");
    await page.click('button:has-text("Add Connector")');

    // Submit without filling fields
    await page.click('button:has-text("Connect")');

    // Verify errors
    await expect(page.locator("text=Platform is required")).toBeVisible();
    await expect(page.locator("text=API Key is required")).toBeVisible();
  });

  test("shows connector status", async ({ page }) => {
    await page.goto("/en/connectors");

    const statusIndicator = page.locator("[data-connector='meta'] [data-status]");
    await expect(statusIndicator).toHaveAttribute("data-status", "connected");
  });

  test("deletes connector", async ({ page }) => {
    await page.goto("/en/connectors");

    // Click delete button
    await page.click("[data-connector='meta'] button[aria-label='Delete']");

    // Confirm deletion
    await page.click('button:has-text("Delete")');

    // Verify removal
    await expect(page.locator("text=Meta")).not.toBeVisible();
  });
});

test.describe("Connector Setup - Arabic", () => {
  test("adds connector in Arabic UI", async ({ page }) => {
    // Navigate to Arabic version
    await page.goto("/ar/connectors");
    await expect(page).toHaveAttribute("lang", "ar");
    await expect(page).toHaveAttribute("dir", "rtl");

    // Verify Arabic labels
    await expect(page.locator("h1")).toContainText("الموصلات");

    // Add connector
    await page.click('button:has-text("إضافة موصل")');
    await page.selectOption("select[name='platform']", "meta");
    await page.fill("input[name='apiKey']", "test-api-key");
    await page.click('button:has-text("اتصال")');

    // Verify success message in Arabic
    await expect(page.locator(".toast-success")).toContainText("تمت الإضافة");
  });
});
```

---

## Summary

This testing strategy provides comprehensive coverage for AgenticVerdict's UI components and applications:

- **70%+ coverage** for UI components, **90%+** for critical components
- **Accessibility-first** testing with automated axe-core checks
- **RTL/LTR testing** for all components and pages
- **Multi-tenant context** testing for data isolation
- **i18n testing** for language switching and localization
- **E2E testing** for critical user journeys

**Key Tools:**

- Vitest for unit testing
- Testing Library for component testing
- jest-axe for accessibility testing
- Playwright for E2E testing
- @agenticverdict/testing for test utilities

**Next Steps:**

1. Implement missing unit tests for existing components
2. Add visual regression testing with Playwright screenshots
3. Expand E2E test coverage for all critical user journeys
4. Set up automated accessibility testing in CI
5. Add performance testing for large datasets

---

**Document Status:**

- **Version:** 1.0
- **Last Updated:** 2026-04-11
- **Status:** Active
- **Next Review:** After Phase 2 completion
- **Maintainer:** Frontend Team

**Related Documents:**

- [Testing Strategy](/docs/02-planning-and-methodology/testing-strategy.md)
- [Technical Architecture](/docs/architecture/business/technical-architecture.md)
- [Accessibility Standards](/docs/architecture/ui/01-research-findings/accessibility-standards.md)
- [Performance Optimization](/docs/architecture/ui/01-research-findings/performance-optimization.md)
