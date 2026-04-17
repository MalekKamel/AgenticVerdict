/**
 * Vitest Test Setup
 *
 * Global configuration for unit tests
 */

import { afterEach, expect, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import React from "react";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as typeof IntersectionObserver;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as typeof ResizeObserver;

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock("@/i18n/react", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(() => "en"),
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock i18n navigation
vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    to,
    ...props
  }: {
    children?: React.ReactNode;
    href?: string;
    to?: string;
  }) => {
    const dest = href ?? to ?? "/";
    return React.createElement("a", { href: dest, ...props }, children);
  },
  usePathname: vi.fn(() => "/"),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  })),
}));

// Mock @tabler/icons-react
vi.mock("@tabler/icons-react", () => ({
  IconAlertCircle: ({ ...props }: Record<string, unknown>) =>
    React.createElement("div", { ...props }, "Alert"),
  IconCheck: ({ ...props }: Record<string, unknown>) =>
    React.createElement("div", { ...props }, "Check"),
  IconX: ({ ...props }: Record<string, unknown>) => React.createElement("div", { ...props }, "X"),
}));

// Mock @mantine/core components
vi.mock("@mantine/core", () => ({
  Box: ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement("div", { ...props }, children),
  Button: ({
    children,
    loading,
    disabled,
    ...props
  }: {
    children?: React.ReactNode;
    loading?: boolean;
  }) =>
    React.createElement(
      "button",
      { disabled: Boolean(loading || disabled), "data-loading": loading, ...props },
      children,
    ),
  Stack: ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement("div", { ...props }, children),
  TextInput: ({ label, error, ...props }: { label?: string; error?: string }) =>
    React.createElement("input", { "aria-label": label, "aria-invalid": !!error, ...props }),
  Text: ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement("p", { ...props }, children),
  Alert: ({ children, icon, ...props }: { children?: React.ReactNode; icon?: React.ReactNode }) =>
    React.createElement("div", { role: "alert", ...props }, [icon, children]),
  Paper: ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement("div", { ...props }, children),
  Container: ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement("div", { ...props }, children),
  Title: ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement("h1", { ...props }, children),
}));

// Mock @mantine/form
vi.mock("@mantine/form", () => ({
  useForm: vi.fn(() => ({
    getInputProps: vi.fn(() => ({
      onChange: vi.fn(),
      value: "",
    })),
    onSubmit: vi.fn((callback: () => void) => callback),
    errors: {},
    key: vi.fn(() => "key"),
  })),
}));
