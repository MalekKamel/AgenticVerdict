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
global.IntersectionObserver = class IntersectionObserverMock {
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    void _callback;
    void _options;
  }
  root = null;
  rootMargin = "";
  thresholds = [] as number[];
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof IntersectionObserver;

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
const iconFactory = (name: string) =>
  function IconMock({ ...props }: Record<string, unknown>) {
    return React.createElement("div", { ...props, "data-icon": name }, name);
  };

vi.mock("@tabler/icons-react", () => ({
  IconAlertCircle: iconFactory("AlertCircle"),
  IconCheck: iconFactory("Check"),
  IconX: iconFactory("X"),
  IconSearch: iconFactory("Search"),
  IconPlus: iconFactory("Plus"),
  IconRefresh: iconFactory("Refresh"),
  IconDotsVertical: iconFactory("DotsVertical"),
  IconTrash: iconFactory("Trash"),
  IconSettings: iconFactory("Settings"),
  IconEye: iconFactory("Eye"),
  IconAlertTriangle: iconFactory("AlertTriangle"),
  IconDownload: iconFactory("Download"),
  IconArrowRight: iconFactory("ArrowRight"),
}));

// Mock @mantine/core components
vi.mock("@mantine/core", () => ({
  Box: ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement("div", { ...props }, children),
  Button: ({ children, loading, ...props }: { children?: React.ReactNode; loading?: boolean }) =>
    React.createElement(
      "button",
      { disabled: Boolean(loading), "data-loading": loading, ...props },
      children,
    ),
  Stack: ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement("div", { ...props }, children),
  TextInput: ({
    label,
    error,
    placeholder,
    ...props
  }: {
    label?: string;
    error?: string;
    placeholder?: string;
  }) =>
    React.createElement("input", {
      "aria-label": label,
      placeholder,
      "aria-invalid": !!error,
      ...props,
    }),
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
  Card: ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement("div", { ...props }, children),
  Group: ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement("div", { ...props }, children),
  Menu: Object.assign(
    ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement("div", { ...props }, children),
    {
      Target: ({ children, ...props }: { children?: React.ReactNode }) =>
        React.createElement("div", { ...props }, children),
      Dropdown: ({ children, ...props }: { children?: React.ReactNode }) =>
        React.createElement("div", { ...props }, children),
      Item: ({ children, ...props }: { children?: React.ReactNode }) =>
        React.createElement("button", { ...props }, children),
    },
  ),
  ActionIcon: ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement("button", { ...props }, children),
  Badge: ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement("span", { ...props }, children),
  Select: ({
    value,
    onChange,
    ...props
  }: {
    value?: string;
    onChange?: (v: string | null) => void;
  }) =>
    React.createElement("select", {
      value,
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange?.(e.target.value),
      ...props,
    }),
  SimpleGrid: ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement("div", { ...props }, children),
  Stepper: Object.assign(
    ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement("div", { ...props }, children),
    {
      Step: ({ label, description, ...props }: { label?: string; description?: string }) =>
        React.createElement("div", { ...props }, [label, description]),
    },
  ),
  Checkbox: Object.assign(
    ({
      label,
      checked,
      onChange,
      ...props
    }: {
      label?: string;
      checked?: boolean;
      onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    }) =>
      React.createElement(
        "label",
        { ...props },
        React.createElement("input", { type: "checkbox", checked, onChange }),
        label,
      ),
    {
      Group: ({ children, ...props }: { children?: React.ReactNode }) =>
        React.createElement("div", { ...props }, children),
    },
  ),
  Radio: Object.assign(
    ({
      label,
      checked,
      onChange,
      value,
      ...props
    }: {
      label?: string;
      value?: string;
      checked?: boolean;
      onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    }) =>
      React.createElement(
        "label",
        { ...props },
        React.createElement("input", {
          type: "radio",
          checked,
          value,
          onChange,
          "aria-label": label,
        }),
        label,
      ),
    {
      Group: ({ children, ...props }: { children?: React.ReactNode }) =>
        React.createElement("div", { ...props }, children),
    },
  ),
  LoadingOverlay: ({ ...props }: Record<string, unknown>) =>
    React.createElement("div", { ...props }, "Loading..."),
  TagsInput: ({
    value,
    onChange,
    ...props
  }: {
    value?: string[];
    onChange?: (v: string[]) => void;
  }) =>
    React.createElement("input", {
      value: (value ?? []).join(","),
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value.split(",")),
      ...props,
    }),
  Switch: ({
    label,
    checked,
    onChange,
    ...props
  }: {
    label?: string;
    checked?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) =>
    React.createElement(
      "label",
      { ...props },
      React.createElement("input", { type: "checkbox", checked, onChange }),
      label,
    ),
  Table: Object.assign(
    ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement("table", { ...props }, children),
    {
      Thead: ({ children, ...props }: { children?: React.ReactNode }) =>
        React.createElement("thead", { ...props }, children),
      Tbody: ({ children, ...props }: { children?: React.ReactNode }) =>
        React.createElement("tbody", { ...props }, children),
      Tr: ({ children, ...props }: { children?: React.ReactNode }) =>
        React.createElement("tr", { ...props }, children),
      Th: ({ children, ...props }: { children?: React.ReactNode }) =>
        React.createElement("th", { ...props }, children),
      Td: ({ children, ...props }: { children?: React.ReactNode }) =>
        React.createElement("td", { ...props }, children),
    },
  ),
  Center: ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement("div", { ...props }, children),
  Skeleton: ({ ...props }: Record<string, unknown>) =>
    React.createElement("div", { ...props }, "Skeleton"),
  Anchor: ({ children, ...props }: { children?: React.ReactNode }) =>
    React.createElement("a", { ...props }, children),
  List: Object.assign(
    ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement("ul", { ...props }, children),
    {
      Item: ({ children, ...props }: { children?: React.ReactNode }) =>
        React.createElement("li", { ...props }, children),
    },
  ),
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

// Mock @tanstack/react-router — individual test files should provide their own mocks as needed
