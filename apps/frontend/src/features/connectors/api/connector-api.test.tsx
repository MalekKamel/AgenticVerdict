/**
 * Unit tests for Connector API hooks
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "@/lib/api/trpc-client";
import {
  useConnectorList,
  useConnectorDetail,
  useConnectorMetrics,
  useConnectorDelete,
  useConnectorSync,
} from "./connector-api";

// Mock tRPC client
vi.mock("@/lib/api/trpc-client", () => ({
  trpc: {
    connector: {
      list: {
        useQuery: vi.fn(),
      },
      detail: {
        useQuery: vi.fn(),
      },
      metrics: {
        useQuery: vi.fn(),
      },
      delete: {
        useMutation: vi.fn(),
      },
      sync: {
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

describe("useConnectorList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call tRPC connector.list with default parameters", () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: { items: [], total: 0, page: 1, pageSize: 20 },
      isLoading: false,
      isError: false,
    });

    vi.mocked(trpc.connector.list.useQuery).mockImplementation(mockUseQuery);

    const { result } = renderHook(() => useConnectorList({}), {
      wrapper: createWrapper(),
    });

    expect(trpc.connector.list.useQuery).toHaveBeenCalledWith(
      {},
      {
        retry: false,
        staleTime: 5 * 60 * 1000,
      },
    );

    expect(result.current.data).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });
    expect(result.current.isLoading).toBe(false);
  });

  it("should pass custom parameters to tRPC", () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: { items: [], total: 5, page: 2, pageSize: 10 },
      isLoading: false,
      isError: false,
    });

    vi.mocked(trpc.connector.list.useQuery).mockImplementation(mockUseQuery);

    renderHook(
      () =>
        useConnectorList({
          status: "healthy",
          domainId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          search: "test",
          page: 2,
          pageSize: 10,
        }),
      {
        wrapper: createWrapper(),
      },
    );

    expect(trpc.connector.list.useQuery).toHaveBeenCalledWith(
      {
        status: "healthy",
        domainId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        search: "test",
        page: 2,
        pageSize: 10,
      },
      {
        retry: false,
        staleTime: 5 * 60 * 1000,
      },
    );
  });

  it("should handle loading state", () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    vi.mocked(trpc.connector.list.useQuery).mockImplementation(mockUseQuery);

    const { result } = renderHook(() => useConnectorList({}), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("should handle error state", () => {
    const mockError = new Error("Failed to fetch connectors");
    const mockUseQuery = vi.fn().mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
    });

    vi.mocked(trpc.connector.list.useQuery).mockImplementation(mockUseQuery);

    const { result } = renderHook(() => useConnectorList({}), {
      wrapper: createWrapper(),
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
  });
});

describe("useConnectorDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch connector detail by id", () => {
    const mockConnector = {
      id: "connector-123",
      name: "Test Connector",
      platform: "ga4",
      status: "healthy",
    };

    const mockUseQuery = vi.fn().mockReturnValue({
      data: mockConnector,
      isLoading: false,
      isError: false,
    });

    vi.mocked(trpc.connector.detail.useQuery).mockImplementation(mockUseQuery);

    const { result } = renderHook(() => useConnectorDetail("connector-123"), {
      wrapper: createWrapper(),
    });

    expect(trpc.connector.detail.useQuery).toHaveBeenCalledWith({ id: "connector-123" });
    expect(result.current.data).toEqual(mockConnector);
  });
});

describe("useConnectorMetrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch metrics for connectors", () => {
    const mockMetrics = {
      totalConnectors: 3,
      healthyConnectors: 2,
      warningConnectors: 1,
      errorConnectors: 0,
    };

    const mockUseQuery = vi.fn().mockReturnValue({
      data: mockMetrics,
      isLoading: false,
      isError: false,
    });

    vi.mocked(trpc.connector.metrics.useQuery).mockImplementation(mockUseQuery);

    const { result } = renderHook(() => useConnectorMetrics(["connector-1", "connector-2"]), {
      wrapper: createWrapper(),
    });

    expect(trpc.connector.metrics.useQuery).toHaveBeenCalledWith(
      { connectorIds: ["connector-1", "connector-2"] },
      {
        enabled: true,
        retry: false,
        staleTime: 5 * 60 * 1000,
      },
    );
    expect(result.current.data).toEqual(mockMetrics);
  });

  it("should disable query when no connector IDs provided", () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });

    vi.mocked(trpc.connector.metrics.useQuery).mockImplementation(mockUseQuery);

    renderHook(() => useConnectorMetrics([]), {
      wrapper: createWrapper(),
    });

    expect(trpc.connector.metrics.useQuery).toHaveBeenCalledWith(
      { connectorIds: [] },
      {
        enabled: false,
        retry: false,
        staleTime: 5 * 60 * 1000,
      },
    );
  });
});

describe("useConnectorDelete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return mutation with invalidation on success", () => {
    const mockInvalidate = vi.fn();
    const mockUseContext = vi.fn().mockReturnValue({
      connector: {
        list: { invalidate: mockInvalidate },
        detail: { invalidate: mockInvalidate },
      },
    });

    const mockMutation = {
      mutate: vi.fn(),
      isLoading: false,
      isError: false,
    };

    vi.mocked(trpc.useContext).mockImplementation(mockUseContext);
    vi.mocked(trpc.connector.delete.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useConnectorDelete(), {
      wrapper: createWrapper(),
    });

    expect(trpc.useContext).toHaveBeenCalled();
    expect(trpc.connector.delete.useMutation).toHaveBeenCalledWith({
      onSuccess: expect.any(Function),
    });
    expect(result.current).toEqual(mockMutation);
  });

  it("should invalidate cache on successful delete", () => {
    const mockInvalidate = vi.fn();
    const mockUseContext = vi.fn().mockReturnValue({
      connector: {
        list: { invalidate: mockInvalidate },
        detail: { invalidate: mockInvalidate },
      },
    });

    const mockMutation = {
      mutate: vi.fn(),
      isLoading: false,
      isError: false,
    };

    vi.mocked(trpc.useContext).mockImplementation(mockUseContext);
    vi.mocked(trpc.connector.delete.useMutation).mockImplementation((options) => {
      if (options?.onSuccess) {
        options.onSuccess();
      }
      return mockMutation;
    });

    renderHook(() => useConnectorDelete(), {
      wrapper: createWrapper(),
    });

    expect(mockInvalidate).toHaveBeenCalledTimes(2);
  });
});

describe("useConnectorSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return sync mutation with invalidation", () => {
    const mockInvalidate = vi.fn();
    const mockUseContext = vi.fn().mockReturnValue({
      connector: {
        list: { invalidate: mockInvalidate },
        detail: { invalidate: mockInvalidate },
      },
    });

    const mockMutation = {
      mutate: vi.fn(),
      isLoading: false,
      isError: false,
    };

    vi.mocked(trpc.useContext).mockImplementation(mockUseContext);
    vi.mocked(trpc.connector.sync.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useConnectorSync(), {
      wrapper: createWrapper(),
    });

    expect(trpc.useContext).toHaveBeenCalled();
    expect(trpc.connector.sync.useMutation).toHaveBeenCalledWith({
      onSuccess: expect.any(Function),
    });
    expect(result.current).toEqual(mockMutation);
  });

  it("should invalidate cache on successful sync", () => {
    const mockInvalidate = vi.fn();
    const mockUseContext = vi.fn().mockReturnValue({
      connector: {
        list: { invalidate: mockInvalidate },
        detail: { invalidate: mockInvalidate },
      },
    });

    const mockMutation = {
      mutate: vi.fn(),
      isLoading: false,
      isError: false,
    };

    vi.mocked(trpc.useContext).mockImplementation(mockUseContext);
    vi.mocked(trpc.connector.sync.useMutation).mockImplementation((options) => {
      if (options?.onSuccess) {
        options.onSuccess();
      }
      return mockMutation;
    });

    renderHook(() => useConnectorSync(), {
      wrapper: createWrapper(),
    });

    expect(mockInvalidate).toHaveBeenCalledTimes(2);
  });
});
