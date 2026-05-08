/**
 * AI Domains React Query Hooks
 *
 * TanStack Query hooks for AI domain management with proper cache invalidation.
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";

import { trpc } from "@/lib/api/trpc-client";

type AiDomainList = NonNullable<ReturnType<typeof trpc.aiDomains.list.useQuery>["data"]>;
type AiDomainDetail = AiDomainList extends Array<infer U> ? U : Record<string, unknown>;

export const queryKeys = {
  domains: {
    all: ["ai-domains"] as const,
    lists: () => [...queryKeys.domains.all, "list"] as const,
    list: (filters?: { status?: string }) => [...queryKeys.domains.lists(), filters] as const,
    details: () => [...queryKeys.domains.all, "detail"] as const,
    detail: (domainId: string) => [...queryKeys.domains.details(), domainId] as const,
    hierarchy: () => [...queryKeys.domains.all, "hierarchy"] as const,
    hierarchyFor: (domainId: string) => [...queryKeys.domains.hierarchy(), domainId] as const,
    effectiveConfig: () => [...queryKeys.domains.all, "effective-config"] as const,
    effectiveConfigFor: (domainId: string) =>
      [...queryKeys.domains.effectiveConfig(), domainId] as const,
  },
};

export function useAiDomains(filters?: { status?: string }) {
  return trpc.aiDomains.list.useQuery(
    filters ? { includeConnectors: filters.status === "active" } : {},
  );
}

export function useAiDomain(domainId: string) {
  return trpc.aiDomains.getById.useQuery({ domainId }, { enabled: !!domainId });
}

export function useCreateAiDomain(options?: { onSuccess?: (data: AiDomainDetail) => void }) {
  const queryClient = useQueryClient();

  return trpc.aiDomains.create.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      options?.onSuccess?.(data as unknown as AiDomainDetail);
    },
  });
}

export function useUpdateAiDomain(options?: { onSuccess?: (data: AiDomainDetail) => void }) {
  const queryClient = useQueryClient();

  return trpc.aiDomains.update.useMutation({
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      if (variables.domainId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.domains.detail(variables.domainId) });
        queryClient.invalidateQueries({
          queryKey: queryKeys.domains.hierarchyFor(variables.domainId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.domains.effectiveConfigFor(variables.domainId),
        });
      }
      options?.onSuccess?.(data as unknown as AiDomainDetail);
    },
  });
}

export function useDeleteAiDomain(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return trpc.aiDomains.delete.useMutation({
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.detail(variables.domainId) });
      options?.onSuccess?.();
    },
  });
}

export function useAiDomainHierarchy(domainId: string) {
  return trpc.aiDomains.getHierarchy.useQuery({ domainId }, { enabled: !!domainId });
}

export function useAiDomainEffectiveConfig(domainId: string) {
  return trpc.aiDomains.getEffectiveConfig.useQuery({ domainId }, { enabled: !!domainId });
}

export function useMapConnector(options?: { onSuccess?: (data: AiDomainDetail) => void }) {
  const queryClient = useQueryClient();

  return trpc.aiDomains.mapConnector.useMutation({
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.detail(variables.domainId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.domains.effectiveConfigFor(variables.domainId),
      });
      options?.onSuccess?.(data as unknown as AiDomainDetail);
    },
  });
}

export function useUnmapConnector(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return trpc.aiDomains.unmapConnector.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      options?.onSuccess?.();
    },
  });
}
