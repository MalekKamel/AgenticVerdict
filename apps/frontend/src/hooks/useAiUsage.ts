/**
 * AI Usage React Query Hooks
 *
 * TanStack Query hooks for AI usage tracking with proper query key structure.
 */

"use client";

import { trpc } from "@/lib/api/trpc-client";

export const queryKeys = {
  usage: {
    all: ["ai-usage"] as const,
    summary: () => [...queryKeys.usage.all, "summary"] as const,
    summaryFor: (filters: {
      startDate: string;
      endDate: string;
      providerId?: string;
      domainId?: string;
      modelId?: string;
    }) => [...queryKeys.usage.summary(), filters] as const,
    trends: () => [...queryKeys.usage.all, "trends"] as const,
    trendsFor: (filters: {
      startDate: string;
      endDate: string;
      providerId?: string;
      domainId?: string;
      modelId?: string;
    }) => [...queryKeys.usage.trends(), filters] as const,
    byProvider: () => [...queryKeys.usage.all, "by-provider"] as const,
    byProviderFor: (filters: { startDate: string; endDate: string; providerId: string }) =>
      [...queryKeys.usage.byProvider(), filters] as const,
    byDomain: () => [...queryKeys.usage.all, "by-domain"] as const,
    byDomainFor: (filters: { startDate: string; endDate: string; domainId: string }) =>
      [...queryKeys.usage.byDomain(), filters] as const,
    failed: () => [...queryKeys.usage.all, "failed"] as const,
    failedFor: (filters: { startDate: string; endDate: string }) =>
      [...queryKeys.usage.failed(), filters] as const,
    currentMonth: () => [...queryKeys.usage.all, "current-month"] as const,
    costEfficiency: () => [...queryKeys.usage.all, "cost-efficiency"] as const,
    costEfficiencyFor: (filters: { startDate: string; endDate: string }) =>
      [...queryKeys.usage.costEfficiency(), filters] as const,
  },
};

export function useAiUsageSummary(filters: {
  startDate: string;
  endDate: string;
  providerId?: string;
  domainId?: string;
  modelId?: string;
}) {
  return trpc.aiUsage.getSummary.useQuery(filters);
}

export function useAiUsageTrends(filters: {
  startDate: string;
  endDate: string;
  providerId?: string;
  domainId?: string;
  modelId?: string;
}) {
  return trpc.aiUsage.getTrends.useQuery(filters);
}

export function useAiUsageByProvider(filters: {
  startDate: string;
  endDate: string;
  providerId: string;
}) {
  return trpc.aiUsage.getByProvider.useQuery(filters);
}

export function useAiUsageByDomain(filters: {
  startDate: string;
  endDate: string;
  domainId: string;
}) {
  return trpc.aiUsage.getByDomain.useQuery(filters);
}

export function useAiFailedRequests(filters: { startDate: string; endDate: string }) {
  return trpc.aiUsage.getFailedRequests.useQuery(filters);
}

export function useAiCurrentMonthUsage() {
  return trpc.aiUsage.getCurrentMonth.useQuery();
}

export function useAiCostEfficiency(filters: { startDate: string; endDate: string }) {
  return trpc.aiUsage.getCostEfficiency.useQuery(filters);
}
