/**
 * Report API Client
 *
 * Type-safe wrapper around tRPC report operations.
 */

import { trpc } from "@/lib/api/trpc-client";
import { showSuccessNotification, showErrorNotification } from "@/lib/notifications";
import { getReportErrorMessage } from "../utils/error-translator";

export function useReportList(input: {
  status?: string;
  format?: "pdf" | "excel" | "all";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  insightId?: string;
}) {
  return trpc.report.list.useQuery(
    {
      status: input.status,
      format: input.format ?? "all",
      search: input.search,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20,
      insightId: input.insightId,
    },
    {
      retry: false,
    },
  );
}

export function useReportDetail(id: string) {
  return trpc.report.detail.useQuery({ id });
}

// Alias for consistency with naming convention
export const useReportById = useReportDetail;

export function useReportContent(id: string, format: "pdf" | "excel") {
  return trpc.report.content.useQuery({ id, format });
}

export function useReportDelete() {
  const utils = trpc.useUtils();
  return trpc.report.delete.useMutation({
    onSuccess: () => {
      utils.report.list.invalidate();
      utils.report.detail.invalidate();
      showSuccessNotification({
        title: "Report deleted",
        message: "Your report has been deleted successfully",
      });
    },
    onError: (error) => {
      showErrorNotification({
        title: "Failed to delete report",
        message: getReportErrorMessage(error),
      });
    },
  });
}

export function useReportDeleteMany() {
  const utils = trpc.useUtils();
  return trpc.report.deleteMany.useMutation({
    onSuccess: () => {
      utils.report.list.invalidate();
      utils.report.detail.invalidate();
      showSuccessNotification({
        title: "Reports deleted",
        message: "Your reports have been deleted successfully",
      });
    },
    onError: (error) => {
      showErrorNotification({
        title: "Failed to delete reports",
        message: getReportErrorMessage(error),
      });
    },
  });
}

export function useSharedReport(reportId: string, token: string) {
  return trpc.report.getSharedReport.useQuery(
    { reportId, token },
    {
      enabled: !!reportId && !!token,
      retry: false,
    },
  );
}

export function useSharedReportContent(reportId: string, token: string, format: "pdf" | "excel") {
  return trpc.report.getSharedReportContent.useQuery(
    { reportId, token, format },
    {
      enabled: !!reportId && !!token,
      retry: false,
    },
  );
}

export const reportApi = {
  keys: {
    list: (tenantId: string) => ["reports", tenantId],
    byId: (tenantId: string, reportId: string) => ["report", tenantId, reportId],
    content: (tenantId: string, reportId: string, format: string) => [
      "report-content",
      tenantId,
      reportId,
      format,
    ],
    shares: (tenantId: string, reportId: string) => ["report-shares", tenantId, reportId],
  },
};
