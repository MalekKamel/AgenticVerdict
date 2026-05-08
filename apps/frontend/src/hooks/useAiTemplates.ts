/**
 * AI Templates React Query Hooks
 *
 * TanStack Query hooks for AI template management with deployment mutations.
 */

"use client";

import { useQueryClient } from "@tanstack/react-query";

import { trpc } from "@/lib/api/trpc-client";

type AiTemplateList = NonNullable<ReturnType<typeof trpc.aiTemplates.list.useQuery>["data"]>;
type AiTemplateDetail = AiTemplateList extends Array<infer U> ? U : Record<string, unknown>;

export const queryKeys = {
  templates: {
    all: ["ai-templates"] as const,
    lists: () => [...queryKeys.templates.all, "list"] as const,
    list: (filters?: { status?: string; type?: string; domainId?: string }) =>
      [...queryKeys.templates.lists(), filters] as const,
    details: () => [...queryKeys.templates.all, "detail"] as const,
    detail: (templateId: string) => [...queryKeys.templates.details(), templateId] as const,
    usage: () => [...queryKeys.templates.all, "usage"] as const,
    usageFor: (templateId: string, startDate?: string, endDate?: string) =>
      [...queryKeys.templates.usage(), templateId, startDate, endDate] as const,
    versionHistory: () => [...queryKeys.templates.all, "version-history"] as const,
    versionHistoryFor: (templateId: string) =>
      [...queryKeys.templates.versionHistory(), templateId] as const,
  },
};

export function useAiTemplates(filters?: {
  status?: "draft" | "published" | "archived" | "all";
  type?: "prompt" | "configuration" | "workflow";
  domainId?: string;
}) {
  return trpc.aiTemplates.list.useQuery(filters ?? {});
}

export function useAiTemplate(templateId: string) {
  return trpc.aiTemplates.getById.useQuery({ templateId }, { enabled: !!templateId });
}

export function useCreateAiTemplate(options?: { onSuccess?: (data: AiTemplateDetail) => void }) {
  const queryClient = useQueryClient();

  return trpc.aiTemplates.create.useMutation({
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      options?.onSuccess?.(data as unknown as AiTemplateDetail);
    },
  });
}

export function useUpdateAiTemplate(options?: { onSuccess?: (data: AiTemplateDetail) => void }) {
  const queryClient = useQueryClient();

  return trpc.aiTemplates.update.useMutation({
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      if (variables.templateId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.templates.detail(variables.templateId),
        });
      }
      options?.onSuccess?.(data as unknown as AiTemplateDetail);
    },
  });
}

export function useDeleteAiTemplate(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return trpc.aiTemplates.delete.useMutation({
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.detail(variables.templateId) });
      options?.onSuccess?.();
    },
  });
}

export function usePublishAiTemplate(options?: { onSuccess?: (data: AiTemplateDetail) => void }) {
  const queryClient = useQueryClient();

  return trpc.aiTemplates.publish.useMutation({
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      if (variables.templateId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.templates.detail(variables.templateId),
        });
      }
      options?.onSuccess?.(data as unknown as AiTemplateDetail);
    },
  });
}

export function useArchiveAiTemplate(options?: { onSuccess?: (data: AiTemplateDetail) => void }) {
  const queryClient = useQueryClient();

  return trpc.aiTemplates.archive.useMutation({
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      if (variables.templateId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.templates.detail(variables.templateId),
        });
      }
      options?.onSuccess?.(data as unknown as AiTemplateDetail);
    },
  });
}

export function useDeployAiTemplate(options?: {
  onSuccess?: (data: {
    id: string;
    templateId: string;
    tenantId: string;
    scope: string;
    targetId: string | null;
    deploymentStatus: string;
    createdAt: Date;
  }) => void;
}) {
  const queryClient = useQueryClient();

  return trpc.aiTemplates.deploy.useMutation({
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      if (variables.templateId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.templates.detail(variables.templateId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.templates.usageFor(variables.templateId),
        });
      }
      options?.onSuccess?.(
        data as unknown as {
          id: string;
          templateId: string;
          tenantId: string;
          scope: string;
          targetId: string | null;
          deploymentStatus: string;
          createdAt: Date;
        },
      );
    },
  });
}

export function useAiTemplateUsage(templateId: string, startDate?: string, endDate?: string) {
  return trpc.aiTemplates.getUsage.useQuery(
    { templateId, startDate, endDate },
    { enabled: !!templateId },
  );
}

export function useAiTemplateVersionHistory(templateId: string) {
  return trpc.aiTemplates.getVersionHistory.useQuery({ templateId }, { enabled: !!templateId });
}
