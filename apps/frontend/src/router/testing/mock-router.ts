import { vi } from "vitest";

export interface MockRouter {
  push: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
  back: ReturnType<typeof vi.fn>;
  prefetch: ReturnType<typeof vi.fn>;
  navigate: ReturnType<typeof vi.fn>;
}

export function createMockRouter(): MockRouter {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
    navigate: vi.fn(),
  };
}

export function mockUseRouter(mockRouter?: MockRouter) {
  vi.mock("@/router/hooks/useRouter", () => ({
    useRouter: () => mockRouter ?? createMockRouter(),
  }));
}
