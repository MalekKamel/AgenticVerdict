/**
 * Unit tests for Insight API hooks
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "@/lib/api/trpc-client";
import {
  useInsightList,
  useInsightDetail,
  useInsightCreate,
  useInsightUpdate,
  useInsightDelete,
  useInsightRun,
  useInsightById,
  useAuditTrail,
  useAIInsights,
  useGenerateAIInsights,
} from "./insight-api";

// Mock tRPC client
vi.mock("@/lib/api/trpc-client", () => ({
  trpc: {
    insight: {
      list: {
        useQuery: vi.fn(),
      },
      detail: {
        useQuery: vi.fn(),
      },
      getById: {
        useQuery: vi.fn(),
      },
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
      getAuditTrail: {
        useQuery: vi.fn(),
      },
      getAIInsights: {
        useQuery: vi.fn(),
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

describe("useInsightList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call tRPC insight.list with default parameters", () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: { insights: [], total: 0, page: 1, pageSize: 20 },
      isLoading: false,
      isError: false,
    });

    vi.mocked(trpc.insight.list.useQuery).mockImplementation(mockUseQuery);

    const { result } = renderHook(() => useInsightList({}), {
      wrapper: createWrapper(),
    });

    expect(trpc.insight.list.useQuery).toHaveBeenCalledWith(
      {
        status: "all",
        search: undefined,
        page: 1,
        pageSize: 20,
      },
      {
        retry: false,
        refetchInterval: expect.any(Function),
      },
    );

    expect(result.current.data).toEqual({ insights: [], total: 0, page: 1, pageSize: 20 });
    expect(result.current.isLoading).toBe(false);
  });

  it("should pass custom parameters to tRPC", () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: { insights: [], total: 5, page: 2, pageSize: 10 },
      isLoading: false,
      isError: false,
    });

    vi.mocked(trpc.insight.list.useQuery).mockImplementation(mockUseQuery);

    renderHook(
      () =>
        useInsightList({
          status: "enabled",
          search: "test",
          page: 2,
          pageSize: 10,
        }),
      {
        wrapper: createWrapper(),
      },
    );

    expect(trpc.insight.list.useQuery).toHaveBeenCalledWith(
      {
        status: "enabled",
        search: "test",
        page: 2,
        pageSize: 10,
      },
      {
        retry: false,
        refetchInterval: expect.any(Function),
      },
    );
  });

  it("should handle loading state", () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    vi.mocked(trpc.insight.list.useQuery).mockImplementation(mockUseQuery);

    const { result } = renderHook(() => useInsightList({}), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("should handle error state", () => {
    const mockError = new Error("Failed to fetch insights");
    const mockUseQuery = vi.fn().mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
    });

    vi.mocked(trpc.insight.list.useQuery).mockImplementation(mockUseQuery);

    const { result } = renderHook(() => useInsightList({}), {
      wrapper: createWrapper(),
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
  });
});

describe("useInsightDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch insight detail by id", () => {
    const mockInsight = {
      id: "insight-123",
      name: "Test Insight",
      status: "enabled",
      domain: "seo",
    };

    const mockUseQuery = vi.fn().mockReturnValue({
      data: mockInsight,
      isLoading: false,
      isError: false,
    });

    vi.mocked(trpc.insight.detail.useQuery).mockImplementation(mockUseQuery);

    const { result } = renderHook(() => useInsightDetail("insight-123"), {
      wrapper: createWrapper(),
    });

    expect(trpc.insight.detail.useQuery).toHaveBeenCalledWith({ id: "insight-123" });
    expect(result.current.data).toEqual(mockInsight);
  });
});

describe("useInsightById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch insight by id", () => {
    const mockInsight = {
      id: "insight-123",
      name: "Test Insight",
      enabled: true,
    };

    const mockUseQuery = vi.fn().mockReturnValue({
      data: mockInsight,
      isLoading: false,
      isError: false,
    });

    vi.mocked(trpc.insight.getById.useQuery).mockImplementation(mockUseQuery);

    const { result } = renderHook(() => useInsightById("insight-123"), {
      wrapper: createWrapper(),
    });

    expect(trpc.insight.getById.useQuery).toHaveBeenCalledWith(
      { id: "insight-123" },
      {
        enabled: true,
        retry: false,
      },
    );
    expect(result.current.data).toEqual(mockInsight);
  });

  it("should disable query when insightId is missing", () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });

    vi.mocked(trpc.insight.getById.useQuery).mockImplementation(mockUseQuery);

    renderHook(() => useInsightById(""), {
      wrapper: createWrapper(),
    });

    expect(trpc.insight.getById.useQuery).toHaveBeenCalledWith(
      { id: "" },
      {
        enabled: false,
        retry: false,
      },
    );
  });
});

describe("useInsightCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return mutation object with onSuccess invalidation", () => {
    const mockInvalidate = vi.fn();
    const mockMutate = vi.fn();
    const mockMutation = {
      mutate: mockMutate,
      mutateAsync: vi.fn(),
      isLoading: false,
      isError: false,
    };

    const mockUseContext = vi.fn().mockReturnValue({
      insight: {
        list: { invalidate: mockInvalidate },
        detail: { invalidate: mockInvalidate },
      },
    });

    vi.mocked(trpc.useContext).mockImplementation(mockUseContext);
    vi.mocked(trpc.insight.create.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useInsightCreate(), {
      wrapper: createWrapper(),
    });

    expect(trpc.useContext).toHaveBeenCalled();
    expect(trpc.insight.create.useMutation).toHaveBeenCalledWith({
      onSuccess: expect.any(Function),
      onError: expect.any(Function),
    });

    expect(result.current).toEqual(mockMutation);
  });
});

describe("useInsightUpdate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return mutation with invalidation on success", () => {
    const mockMutation = {
      mutate: vi.fn(),
      isLoading: false,
      isError: false,
    };

    vi.mocked(trpc.insight.update.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useInsightUpdate(), {
      wrapper: createWrapper(),
    });

    expect(trpc.insight.update.useMutation).toHaveBeenCalledWith({
      onSuccess: expect.any(Function),
      onError: expect.any(Function),
    });
    expect(result.current).toEqual(mockMutation);
  });
});

describe("useInsightDelete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return mutation with list invalidation", () => {
    const mockMutation = {
      mutate: vi.fn(),
      isLoading: false,
      isError: false,
    };

    vi.mocked(trpc.insight.delete.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useInsightDelete(), {
      wrapper: createWrapper(),
    });

    expect(trpc.insight.delete.useMutation).toHaveBeenCalledWith({
      onSuccess: expect.any(Function),
      onError: expect.any(Function),
    });
    expect(result.current).toEqual(mockMutation);
  });
});

describe("useInsightRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return run mutation", () => {
    const mockMutation = {
      mutate: vi.fn(),
      isLoading: false,
      isError: false,
    };

    vi.mocked(trpc.insight.run.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useInsightRun(), {
      wrapper: createWrapper(),
    });

    expect(trpc.insight.run.useMutation).toHaveBeenCalled();
    expect(result.current).toEqual(mockMutation);
  });
});

describe("useAuditTrail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch audit trail for insight", () => {
    const mockAuditTrail = {
      events: [
        { id: "1", type: "insight.created", timestamp: new Date().toISOString() },
        { id: "2", type: "insight.run", timestamp: new Date().toISOString() },
      ],
    };

    const mockUseQuery = vi.fn().mockReturnValue({
      data: mockAuditTrail,
      isLoading: false,
      isError: false,
    });

    vi.mocked(trpc.insight.getAuditTrail.useQuery).mockImplementation(mockUseQuery);

    const { result } = renderHook(() => useAuditTrail("tenant-456", "insight-123"), {
      wrapper: createWrapper(),
    });

    expect(trpc.insight.getAuditTrail.useQuery).toHaveBeenCalledWith(
      { tenantId: "tenant-456", insightId: "insight-123" },
      {
        enabled: true,
        retry: false,
      },
    );
    expect(result.current.data).toEqual(mockAuditTrail);
  });

  it("should disable query when parameters are missing", () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });

    vi.mocked(trpc.insight.getAuditTrail.useQuery).mockImplementation(mockUseQuery);

    renderHook(() => useAuditTrail("", "insight-123"), {
      wrapper: createWrapper(),
    });

    expect(trpc.insight.getAuditTrail.useQuery).toHaveBeenCalledWith(
      { tenantId: "", insightId: "insight-123" },
      {
        enabled: false,
        retry: false,
      },
    );
  });
});

describe("useAIInsights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch AI insights for insight", () => {
    const mockAIInsights = {
      performanceSummary: "Good performance",
      keyFindings: ["Finding 1", "Finding 2"],
      recommendations: ["Recommendation 1"],
      generatedAt: new Date().toISOString(),
    };

    const mockUseQuery = vi.fn().mockReturnValue({
      data: mockAIInsights,
      isLoading: false,
      isError: false,
    });

    vi.mocked(trpc.insight.getAIInsights.useQuery).mockImplementation(mockUseQuery);

    const { result } = renderHook(() => useAIInsights("insight-123", "report-456"), {
      wrapper: createWrapper(),
    });

    expect(trpc.insight.getAIInsights.useQuery).toHaveBeenCalledWith(
      { insightId: "insight-123", reportId: "report-456" },
      {
        enabled: true,
        retry: false,
        staleTime: 10 * 60 * 1000,
      },
    );
    expect(result.current.data).toEqual(mockAIInsights);
  });

  it("should work without reportId", () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    vi.mocked(trpc.insight.getAIInsights.useQuery).mockImplementation(mockUseQuery);

    renderHook(() => useAIInsights("insight-123"), {
      wrapper: createWrapper(),
    });

    expect(trpc.insight.getAIInsights.useQuery).toHaveBeenCalledWith(
      { insightId: "insight-123", reportId: undefined },
      {
        enabled: true,
        retry: false,
        staleTime: 10 * 60 * 1000,
      },
    );
  });
});

describe("useGenerateAIInsights", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return mutation with AI insights invalidation", () => {
    const mockMutation = {
      mutate: vi.fn(),
      isLoading: false,
      isError: false,
    };

    vi.mocked(trpc.insight.generateAIInsights.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useGenerateAIInsights(), {
      wrapper: createWrapper(),
    });

    expect(trpc.insight.generateAIInsights.useMutation).toHaveBeenCalledWith({
      onSuccess: expect.any(Function),
    });
    expect(result.current).toEqual(mockMutation);
  });
});
