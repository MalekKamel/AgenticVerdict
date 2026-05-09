/**
 * Unit tests for Insight API hooks (queries)
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "@/lib/api/trpc-client";
import {
  useInsightList,
  useInsightDetail,
  useAuditTrail,
  useAIInsights,
  insightApi,
} from "../api/insight-api";

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
      getAuditTrail: {
        useQuery: vi.fn(),
      },
      getAIInsights: {
        useQuery: vi.fn(),
      },
    },
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
        domain: undefined,
        sortField: "createdAt",
        sortDirection: "desc",
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
        domain: undefined,
        sortField: "createdAt",
        sortDirection: "desc",
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

    const { result } = renderHook(() => useAuditTrail("insight-123"), {
      wrapper: createWrapper(),
    });

    expect(trpc.insight.getAuditTrail.useQuery).toHaveBeenCalledWith(
      { insightId: "insight-123" },
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

    renderHook(() => useAuditTrail(""), {
      wrapper: createWrapper(),
    });

    expect(trpc.insight.getAuditTrail.useQuery).toHaveBeenCalledWith(
      { insightId: "" },
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

describe("insightApi", () => {
  it("should generate correct cache keys", () => {
    const tenantId = "tenant-123";
    const insightId = "insight-456";

    expect(insightApi.keys.list(tenantId)).toEqual(["insights", tenantId]);
    expect(insightApi.keys.byId(tenantId, insightId)).toEqual(["insight", tenantId, insightId]);
  });
});
