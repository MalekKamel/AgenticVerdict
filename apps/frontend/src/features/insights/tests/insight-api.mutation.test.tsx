/**
 * Unit tests for Insight API mutations
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "@/lib/api/trpc-client";
import {
  useInsightCreate,
  useInsightUpdate,
  useInsightDelete,
  useInsightRun,
  useGenerateAIInsights,
} from "../api/insight-api";

// Mock tRPC client
vi.mock("@/lib/api/trpc-client", () => ({
  trpc: {
    insight: {
      create: {
        useMutation: vi.fn(),
      },
      update: {
        useMutation: vi.fn(),
      },
      delete: {
        useMutation: vi.fn(),
      },
      run: {
        useMutation: vi.fn(),
      },
      generateAIInsights: {
        useMutation: vi.fn(),
      },
    },
    useContext: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useInsightCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call create mutation with correct data", async () => {
    const mockMutate = vi.fn();
    const mockMutation = {
      mutate: mockMutate,
      mutateAsync: vi.fn().mockResolvedValue({ id: "insight-123" }),
      isLoading: false,
      isError: false,
    };

    vi.mocked(trpc.insight.create.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useInsightCreate(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        name: "Test Insight",
        description: "Test description",
        domain: "marketing",
        connectorIds: ["connector-1"],
        selectedMetrics: { "connector-1": ["metric-1"] },
        model: "claude-3-5-sonnet",
        quality: 75,
        detailLevel: "standard",
        frequency: "weekly",
        time: "09:00",
        format: "pdf",
        emailRecipients: [],
      });
    });

    expect(mockMutate).toHaveBeenCalledWith({
      name: "Test Insight",
      description: "Test description",
      domain: "marketing",
      connectorIds: ["connector-1"],
      selectedMetrics: { "connector-1": ["metric-1"] },
      model: "claude-3-5-sonnet",
      quality: 75,
      detailLevel: "standard",
      frequency: "weekly",
      time: "09:00",
      format: "pdf",
      emailRecipients: [],
    });
  });

  it("should invalidate cache on successful create", async () => {
    const mockInvalidate = vi.fn();
    const mockUseContext = vi.fn().mockReturnValue({
      insight: {
        list: { invalidate: mockInvalidate },
        detail: { invalidate: mockInvalidate },
      },
    });

    const mockMutation = {
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue({ id: "insight-123" }),
      isLoading: false,
      isError: false,
    };

    vi.mocked(trpc.useContext).mockImplementation(mockUseContext);
    vi.mocked(trpc.insight.create.useMutation).mockImplementation((options) => {
      // Call onSuccess to verify invalidation
      if (options?.onSuccess) {
        options.onSuccess();
      }
      return mockMutation;
    });

    renderHook(() => useInsightCreate(), {
      wrapper: createWrapper(),
    });

    expect(mockInvalidate).toHaveBeenCalledTimes(2);
  });

  it("should handle create error", () => {
    const mockError = new Error("Failed to create insight");
    const mockMutation = {
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockRejectedValue(mockError),
      isLoading: false,
      isError: true,
      error: mockError,
    };

    vi.mocked(trpc.insight.create.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useInsightCreate(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
  });
});

describe("useInsightUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call update mutation with correct data", async () => {
    const mockMutate = vi.fn();
    const mockMutation = {
      mutate: mockMutate,
      mutateAsync: vi.fn().mockResolvedValue({ id: "insight-123" }),
      isLoading: false,
      isError: false,
    };

    vi.mocked(trpc.insight.update.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useInsightUpdate(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        id: "insight-123",
        name: "Updated Insight",
        description: "Updated description",
        enabled: true,
      });
    });

    expect(mockMutate).toHaveBeenCalledWith({
      id: "insight-123",
      name: "Updated Insight",
      description: "Updated description",
      enabled: true,
    });
  });

  it("should invalidate cache on successful update", () => {
    const mockInvalidate = vi.fn();
    const mockUseContext = vi.fn().mockReturnValue({
      insight: {
        list: { invalidate: mockInvalidate },
        detail: { invalidate: mockInvalidate },
      },
    });

    const mockMutation = {
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue({ id: "insight-123" }),
      isLoading: false,
      isError: false,
    };

    vi.mocked(trpc.useContext).mockImplementation(mockUseContext);
    vi.mocked(trpc.insight.update.useMutation).mockImplementation((options) => {
      if (options?.onSuccess) {
        options.onSuccess();
      }
      return mockMutation;
    });

    renderHook(() => useInsightUpdate(), {
      wrapper: createWrapper(),
    });

    expect(mockInvalidate).toHaveBeenCalledTimes(2);
  });

  it("should handle update error", () => {
    const mockError = new Error("Failed to update insight");
    const mockMutation = {
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockRejectedValue(mockError),
      isLoading: false,
      isError: true,
      error: mockError,
    };

    vi.mocked(trpc.insight.update.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useInsightUpdate(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
  });
});

describe("useInsightDelete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call delete mutation with correct id", async () => {
    const mockMutate = vi.fn();
    const mockMutation = {
      mutate: mockMutate,
      mutateAsync: vi.fn().mockResolvedValue({ success: true }),
      isLoading: false,
      isError: false,
    };

    vi.mocked(trpc.insight.delete.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useInsightDelete(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ id: "insight-123" });
    });

    expect(mockMutate).toHaveBeenCalledWith({ id: "insight-123" });
  });

  it("should invalidate list on successful delete", () => {
    const mockInvalidate = vi.fn();
    const mockUseContext = vi.fn().mockReturnValue({
      insight: {
        list: { invalidate: mockInvalidate },
        detail: { invalidate: mockInvalidate },
      },
    });

    const mockMutation = {
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue({ success: true }),
      isLoading: false,
      isError: false,
    };

    vi.mocked(trpc.useContext).mockImplementation(mockUseContext);
    vi.mocked(trpc.insight.delete.useMutation).mockImplementation((options) => {
      if (options?.onSuccess) {
        options.onSuccess();
      }
      return mockMutation;
    });

    renderHook(() => useInsightDelete(), {
      wrapper: createWrapper(),
    });

    expect(mockInvalidate).toHaveBeenCalledTimes(2);
  });

  it("should handle delete error", () => {
    const mockError = new Error("Failed to delete insight");
    const mockMutation = {
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockRejectedValue(mockError),
      isLoading: false,
      isError: true,
      error: mockError,
    };

    vi.mocked(trpc.insight.delete.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useInsightDelete(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
  });
});

describe("useInsightRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call run mutation with correct id", async () => {
    const mockMutate = vi.fn();
    const mockMutation = {
      mutate: mockMutate,
      mutateAsync: vi.fn().mockResolvedValue({ jobId: "job-123" }),
      isLoading: false,
      isError: false,
    };

    vi.mocked(trpc.insight.run.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useInsightRun(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ id: "insight-123" });
    });

    expect(mockMutate).toHaveBeenCalledWith({ id: "insight-123" });
  });

  it("should handle run error", () => {
    const mockError = new Error("Failed to run insight");
    const mockMutation = {
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockRejectedValue(mockError),
      isLoading: false,
      isError: true,
      error: mockError,
    };

    vi.mocked(trpc.insight.run.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useInsightRun(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
  });

  it("should show loading state while running", () => {
    const mockMutation = {
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isLoading: true,
      isError: false,
    };

    vi.mocked(trpc.insight.run.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useInsightRun(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });
});

describe("useGenerateAIInsights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call generate AI insights mutation with correct params", async () => {
    const mockMutate = vi.fn();
    const mockMutation = {
      mutate: mockMutate,
      mutateAsync: vi.fn().mockResolvedValue({ success: true }),
      isLoading: false,
      isError: false,
    };

    vi.mocked(trpc.insight.generateAIInsights.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useGenerateAIInsights(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ insightId: "insight-123", reportId: "report-456" });
    });

    expect(mockMutate).toHaveBeenCalledWith({ insightId: "insight-123", reportId: "report-456" });
  });

  it("should invalidate AI insights cache on success", () => {
    const mockInvalidate = vi.fn();
    const mockUseContext = vi.fn().mockReturnValue({
      insight: {
        getAIInsights: { invalidate: mockInvalidate },
        list: { invalidate: mockInvalidate },
      },
    });

    const mockMutation = {
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue({ success: true }),
      isLoading: false,
      isError: false,
    };

    vi.mocked(trpc.useContext).mockImplementation(mockUseContext);
    vi.mocked(trpc.insight.generateAIInsights.useMutation).mockImplementation((options) => {
      if (options?.onSuccess) {
        options.onSuccess(undefined, { insightId: "insight-123" });
      }
      return mockMutation;
    });

    renderHook(() => useGenerateAIInsights(), {
      wrapper: createWrapper(),
    });

    expect(mockInvalidate).toHaveBeenCalledWith({ insightId: "insight-123" });
  });

  it("should handle generate AI insights error", () => {
    const mockError = new Error("Failed to generate AI insights");
    const mockMutation = {
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockRejectedValue(mockError),
      isLoading: false,
      isError: true,
      error: mockError,
    };

    vi.mocked(trpc.insight.generateAIInsights.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useGenerateAIInsights(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
  });
});
