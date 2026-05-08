/**
 * AI Providers React Query Hooks
 *
 * TanStack Query hooks for AI provider management with proper cache invalidation.
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";

import { trpc } from "@/lib/api/trpc-client";

type AiProviderList = NonNullable<ReturnType<typeof trpc.aiProviders.list.useQuery>["data"]>;
type AiProviderDetail = AiProviderList extends Array<infer U> ? U : Record<string, unknown>;

export const queryKeys = {
  providers: {
    all: ["ai-providers"] as const,
    lists: () => [...queryKeys.providers.all, "list"] as const,
    list: (filters?: { status?: string }) => [...queryKeys.providers.lists(), filters] as const,
    details: () => [...queryKeys.providers.all, "detail"] as const,
    detail: (providerId: string) => [...queryKeys.providers.details(), providerId] as const,
  },
};

export function useAiProviders(filters?: { status?: string }) {
  void filters;
  return trpc.aiProviders.list.useQuery({});
}

export function useAiProvider(providerId: string) {
  return trpc.aiProviders.getById.useQuery({ providerId }, { enabled: !!providerId });
}

export function useCreateAiProvider(options?: { onSuccess?: (data: AiProviderDetail) => void }) {
  const queryClient = useQueryClient();

  return trpc.aiProviders.create.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.all });
      options?.onSuccess?.(data as unknown as AiProviderDetail);
    },
  });
}

export function useUpdateAiProvider(options?: { onSuccess?: (data: AiProviderDetail) => void }) {
  const queryClient = useQueryClient();

  return trpc.aiProviders.update.useMutation({
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.all });
      if (variables.providerId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.providers.detail(variables.providerId),
        });
      }
      options?.onSuccess?.(data as unknown as AiProviderDetail);
    },
  });
}

export function useDeleteAiProvider(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return trpc.aiProviders.delete.useMutation({
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.detail(variables.providerId) });
      options?.onSuccess?.();
    },
  });
}

export function useTestAiProviderConnection() {
  return trpc.aiProviders.testConnectivity.useMutation();
}

export function useRotateAiProviderCredentials(options?: {
  onSuccess?: (data: AiProviderDetail) => void;
}) {
  const queryClient = useQueryClient();

  return trpc.aiProviders.rotateCredentials.useMutation({
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.providers.all });
      if ("providerId" in variables) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.providers.detail(variables.providerId),
        });
      }
      options?.onSuccess?.(data);
    },
  });
}
