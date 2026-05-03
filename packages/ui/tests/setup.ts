/**
 * Vitest setup for @agenticverdict/ui
 */

import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

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
} as unknown as typeof IntersectionObserver;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown as typeof ResizeObserver;

// Mock matchMedia
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

import React from "react";

vi.mock("@mantine/core", () => ({
  Badge: ({
    children,
    style,
    ...props
  }: {
    children?: React.ReactNode;
    style?: React.CSSProperties;
  }) => React.createElement("span", { ...props, style }, children),
  Box: ({
    children,
    style,
    ...props
  }: {
    children?: React.ReactNode;
    style?: React.CSSProperties;
  }) => React.createElement("div", { ...props, style }, children),
  Group: ({
    children,
    style,
    ...props
  }: {
    children?: React.ReactNode;
    style?: React.CSSProperties;
  }) => React.createElement("div", { ...props, style }, children),
  MantineProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-mantine-provider": "true" }, children),
  Stack: ({
    children,
    style,
    ...props
  }: {
    children?: React.ReactNode;
    style?: React.CSSProperties;
  }) => React.createElement("div", { ...props, style }, children),
  Text: ({
    children,
    style,
    ...props
  }: {
    children?: React.ReactNode;
    style?: React.CSSProperties;
  }) => React.createElement("span", { ...props, style }, children),
  ThemeIcon: ({
    children,
    style,
    ...props
  }: {
    children?: React.ReactNode;
    style?: React.CSSProperties;
  }) => React.createElement("span", { ...props, style }, children),
  UnstyledButton: ({
    children,
    style,
    ...props
  }: {
    children?: React.ReactNode;
    style?: React.CSSProperties;
  }) => React.createElement("button", { ...props, style }, children),
}));
