/**
 * Insight API Client
 *
 * Type-safe wrapper around tRPC insight operations.
 */

import { trpc } from "@/lib/api/trpc-client";
import { showSuccessNotification, showErrorNotification } from "@/lib/notifications";
import {
  getNotificationCreateTitle,
  getNotificationCreateMessage,
  getNotificationUpdateTitle,
  getNotificationUpdateMessage,
  getNotificationDeleteTitle,
  getNotificationDeleteMessage,
  getNotificationRunTitle,
  getNotificationRunMessage,
  getNotificationCreateErrorTitle,
  getNotificationUpdateErrorTitle,
  getNotificationDeleteErrorTitle,
  getNotificationRunErrorTitle,
} from "@/lib/notifications-i18n";
import { getInsightErrorMessage } from "../utils/error-translator";

export function useInsightList(input: {
  status?: "enabled" | "disabled" | "all";
  search?: string;
  domain?: string;
  sortField?: "name" | "createdAt" | "lastRunAt" | "status";
  sortDirection?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}) {
  return trpc.insight.list.useQuery(
    {
      status: input.status ?? "all",
      search: input.search,
      domain: input.domain,
      sortField: input.sortField ?? "createdAt",
      sortDirection: input.sortDirection ?? "desc",
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20,
    },
    {
      retry: false,
      refetchInterval: (query) => {
        const insights = query.state.data?.insights || [];
        const hasRunning = insights.some((i) => i.status === "running");
        return hasRunning ? 5000 : false;
      },
    },
  );
}

export function useInsightDetail(id: string) {
  return trpc.insight.detail.useQuery({ id });
}

export function useInsightCreate() {
  const utils = trpc.useUtils();
  return trpc.insight.create.useMutation({
    onSuccess: () => {
      utils.insight.list.invalidate();
      utils.insight.detail.invalidate();
      showSuccessNotification({
        title: getNotificationCreateTitle(),
        message: getNotificationCreateMessage(),
      });
    },
    onError: (error) => {
      showErrorNotification({
        title: getNotificationCreateErrorTitle(),
        message: getInsightErrorMessage(error),
      });
    },
  });
}

export function useInsightUpdate() {
  const utils = trpc.useUtils();
  return trpc.insight.update.useMutation({
    onSuccess: () => {
      utils.insight.list.invalidate();
      utils.insight.detail.invalidate();
      showSuccessNotification({
        title: getNotificationUpdateTitle(),
        message: getNotificationUpdateMessage(),
      });
    },
    onError: (error) => {
      showErrorNotification({
        title: getNotificationUpdateErrorTitle(),
        message: getInsightErrorMessage(error),
      });
    },
  });
}

export function useInsightDelete() {
  const utils = trpc.useUtils();
  return trpc.insight.delete.useMutation({
    onSuccess: () => {
      utils.insight.list.invalidate();
      utils.insight.detail.invalidate();
      showSuccessNotification({
        title: getNotificationDeleteTitle(),
        message: getNotificationDeleteMessage(),
      });
    },
    onError: (error) => {
      showErrorNotification({
        title: getNotificationDeleteErrorTitle(),
        message: getInsightErrorMessage(error),
      });
    },
  });
}

export function useInsightRun() {
  return trpc.insight.run.useMutation({
    onSuccess: () => {
      showSuccessNotification({
        title: getNotificationRunTitle(),
        message: getNotificationRunMessage(),
      });
    },
    onError: (error) => {
      showErrorNotification({
        title: getNotificationRunErrorTitle(),
        message: getInsightErrorMessage(error),
      });
    },
  });
}

export function useAuditTrail(insightId: string) {
  return trpc.insight.getAuditTrail.useQuery(
    { insightId },
    {
      enabled: !!insightId,
      retry: false,
    },
  );
}

export function useAIInsights(insightId: string, reportId?: string) {
  return trpc.insight.getAIInsights.useQuery(
    { insightId, reportId },
    {
      enabled: !!insightId,
      retry: false,
      staleTime: 10 * 60 * 1000,
    },
  );
}

export function useAiModels() {
  return trpc.insight.ai.models.useQuery(undefined, {
    staleTime: 30 * 60 * 1000,
  });
}

export function useAiDefaults() {
  return trpc.insight.ai.defaults.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
}

export function useConnectorDomains() {
  return trpc.insight.connector.domains.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
}

export function useTenantConfig() {
  return trpc.insight.tenant.config.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
}

export function useGenerateAIInsights() {
  const utils = trpc.useUtils();
  return trpc.insight.generateAIInsights.useMutation({
    onSuccess: (_, variables) => {
      utils.insight.getAIInsights.invalidate({ insightId: variables.insightId });
      utils.insight.list.invalidate();
    },
  });
}

export const insightApi = {
  keys: {
    list: (tenantId: string) => ["insights", tenantId],
    byId: (tenantId: string, insightId: string) => ["insight", tenantId, insightId],
    auditTrail: (tenantId: string, insightId: string) => ["auditTrail", tenantId, insightId],
  },
};
