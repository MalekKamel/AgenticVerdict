/**
 * Unit tests for Report API hooks
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "@/lib/api/trpc-client";
import {
  useReportList,
  useReportDetail,
  useReportById,
  useReportContent,
  useReportDelete,
  useReportDeleteMany,
  reportApi,
} from "./report-api";

// Mock tRPC client
vi.mock("@/lib/api/trpc-client", () => ({
  trpc: {
    report: {
      list: {
        useQuery: vi.fn(),
      },
      detail: {
        useQuery: vi.fn(),
      },
      content: {
        useQuery: vi.fn(),
      },
      delete: {
        useMutation: vi.fn(),
      },
      deleteMany: {
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

describe("useReportList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call tRPC report.list with default parameters", () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: { reports: [], total: 0, page: 1, pageSize: 20 },
      isLoading: false,
      isError: false,
    });

    vi.mocked(trpc.report.list.useQuery).mockImplementation(mockUseQuery);

    const { result } = renderHook(() => useReportList({}), {
      wrapper: createWrapper(),
    });

    expect(trpc.report.list.useQuery).toHaveBeenCalledWith(
      {
        status: undefined,
        format: "all",
        search: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        page: 1,
        pageSize: 20,
      },
      {
        retry: false,
      },
    );

    expect(result.current.data).toEqual({ reports: [], total: 0, page: 1, pageSize: 20 });
    expect(result.current.isLoading).toBe(false);
  });

  it("should pass custom parameters to tRPC", () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: { reports: [], total: 5, page: 2, pageSize: 10 },
      isLoading: false,
      isError: false,
    });

    vi.mocked(trpc.report.list.useQuery).mockImplementation(mockUseQuery);

    renderHook(
      () =>
        useReportList({
          status: "completed",
          format: "pdf",
          search: "test",
          dateFrom: "2024-01-01",
          dateTo: "2024-01-31",
          page: 2,
          pageSize: 10,
        }),
      {
        wrapper: createWrapper(),
      },
    );

    expect(trpc.report.list.useQuery).toHaveBeenCalledWith(
      {
        status: "completed",
        format: "pdf",
        search: "test",
        dateFrom: "2024-01-01",
        dateTo: "2024-01-31",
        page: 2,
        pageSize: 10,
      },
      {
        retry: false,
      },
    );
  });

  it("should handle loading state", () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    vi.mocked(trpc.report.list.useQuery).mockImplementation(mockUseQuery);

    const { result } = renderHook(() => useReportList({}), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("should handle error state", () => {
    const mockError = new Error("Failed to fetch reports");
    const mockUseQuery = vi.fn().mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: mockError,
    });

    vi.mocked(trpc.report.list.useQuery).mockImplementation(mockUseQuery);

    const { result } = renderHook(() => useReportList({}), {
      wrapper: createWrapper(),
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(mockError);
  });
});

describe("useReportDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch report detail by id", () => {
    const mockReport = {
      id: "report-123",
      name: "Test Report",
      status: "completed",
      format: "pdf",
    };

    const mockUseQuery = vi.fn().mockReturnValue({
      data: mockReport,
      isLoading: false,
      isError: false,
    });

    vi.mocked(trpc.report.detail.useQuery).mockImplementation(mockUseQuery);

    const { result } = renderHook(() => useReportDetail("report-123"), {
      wrapper: createWrapper(),
    });

    expect(trpc.report.detail.useQuery).toHaveBeenCalledWith({ id: "report-123" });
    expect(result.current.data).toEqual(mockReport);
  });
});

describe("useReportById", () => {
  it("should be an alias for useReportDetail", () => {
    expect(useReportById).toBe(useReportDetail);
  });
});

describe("useReportContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch report content in PDF format", () => {
    const mockContent = {
      id: "report-123",
      format: "pdf",
      url: "https://example.com/report.pdf",
      content: "base64-encoded-content",
    };

    const mockUseQuery = vi.fn().mockReturnValue({
      data: mockContent,
      isLoading: false,
      isError: false,
    });

    vi.mocked(trpc.report.content.useQuery).mockImplementation(mockUseQuery);

    const { result } = renderHook(() => useReportContent("report-123", "pdf"), {
      wrapper: createWrapper(),
    });

    expect(trpc.report.content.useQuery).toHaveBeenCalledWith({ id: "report-123", format: "pdf" });
    expect(result.current.data).toEqual(mockContent);
  });

  it("should fetch report content in Excel format", () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: { id: "report-123", format: "excel", url: "https://example.com/report.xlsx" },
      isLoading: false,
      isError: false,
    });

    vi.mocked(trpc.report.content.useQuery).mockImplementation(mockUseQuery);

    renderHook(() => useReportContent("report-123", "excel"), {
      wrapper: createWrapper(),
    });

    expect(trpc.report.content.useQuery).toHaveBeenCalledWith({
      id: "report-123",
      format: "excel",
    });
  });
});

describe("useReportDelete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return mutation with invalidation on success", () => {
    const mockInvalidate = vi.fn();
    const mockUseContext = vi.fn().mockReturnValue({
      report: {
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
    vi.mocked(trpc.report.delete.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useReportDelete(), {
      wrapper: createWrapper(),
    });

    expect(trpc.useContext).toHaveBeenCalled();
    expect(trpc.report.delete.useMutation).toHaveBeenCalledWith({
      onSuccess: expect.any(Function),
      onError: expect.any(Function),
    });
    expect(result.current).toEqual(mockMutation);
  });

  it("should invalidate cache on successful delete", () => {
    const mockInvalidate = vi.fn();
    const mockUseContext = vi.fn().mockReturnValue({
      report: {
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
    vi.mocked(trpc.report.delete.useMutation).mockImplementation((options) => {
      if (options?.onSuccess) {
        options.onSuccess();
      }
      return mockMutation;
    });

    renderHook(() => useReportDelete(), {
      wrapper: createWrapper(),
    });

    expect(mockInvalidate).toHaveBeenCalledTimes(2);
  });
});

describe("useReportDeleteMany", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return deleteMany mutation with invalidation", () => {
    const mockInvalidate = vi.fn();
    const mockUseContext = vi.fn().mockReturnValue({
      report: {
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
    vi.mocked(trpc.report.deleteMany.useMutation).mockReturnValue(mockMutation);

    const { result } = renderHook(() => useReportDeleteMany(), {
      wrapper: createWrapper(),
    });

    expect(trpc.useContext).toHaveBeenCalled();
    expect(trpc.report.deleteMany.useMutation).toHaveBeenCalledWith({
      onSuccess: expect.any(Function),
      onError: expect.any(Function),
    });
    expect(result.current).toEqual(mockMutation);
  });

  it("should invalidate cache on successful bulk delete", () => {
    const mockInvalidate = vi.fn();
    const mockUseContext = vi.fn().mockReturnValue({
      report: {
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
    vi.mocked(trpc.report.deleteMany.useMutation).mockImplementation((options) => {
      if (options?.onSuccess) {
        options.onSuccess();
      }
      return mockMutation;
    });

    renderHook(() => useReportDeleteMany(), {
      wrapper: createWrapper(),
    });

    expect(mockInvalidate).toHaveBeenCalledTimes(2);
  });
});

describe("reportApi", () => {
  it("should generate correct cache keys", () => {
    const tenantId = "tenant-123";
    const reportId = "report-456";
    const format = "pdf";

    expect(reportApi.keys.list(tenantId)).toEqual(["reports", tenantId]);
    expect(reportApi.keys.byId(tenantId, reportId)).toEqual(["report", tenantId, reportId]);
    expect(reportApi.keys.content(tenantId, reportId, format)).toEqual([
      "report-content",
      tenantId,
      reportId,
      format,
    ]);
  });
});
