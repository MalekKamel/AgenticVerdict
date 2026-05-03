import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMockRouter, mockUseRouter } from "./mock-router";

describe("mock-router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a mock router with vi.fn() methods", () => {
    const mockRouter = createMockRouter();

    expect(mockRouter.push).toBeDefined();
    expect(mockRouter.replace).toBeDefined();
    expect(mockRouter.back).toBeDefined();
    expect(mockRouter.prefetch).toBeDefined();
    expect(mockRouter.navigate).toBeDefined();

    expect(vi.isMockFunction(mockRouter.push)).toBe(true);
    expect(vi.isMockFunction(mockRouter.replace)).toBe(true);
  });

  it("should track calls on mock router methods", () => {
    const mockRouter = createMockRouter();

    mockRouter.push("/dashboard");
    mockRouter.replace("/auth/login");
    mockRouter.back();

    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    expect(mockRouter.replace).toHaveBeenCalledWith("/auth/login");
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it("should accept custom mock router in mockUseRouter", () => {
    const customMock = createMockRouter();
    customMock.push.mockImplementation((path: string) => {
      console.log(`Navigating to: ${path}`);
    });

    mockUseRouter(customMock);

    expect(customMock.push).not.toHaveBeenCalled();
  });
});
