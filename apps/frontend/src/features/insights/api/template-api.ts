/**
 * Template API Client
 *
 * Type-safe tRPC hooks for insight template operations.
 */

import { trpc } from "@/lib/api/trpc-client";
import { showSuccessNotification, showErrorNotification } from "@/lib/notifications";

export function useTemplateList(domain?: string) {
  return trpc.insightTemplates.list.useQuery(
    { domain },
    {
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  );
}

export function useTemplateDetail(id: string) {
  return trpc.insightTemplates.detail.useQuery(
    { id },
    {
      retry: false,
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    },
  );
}

export function useApplyTemplate() {
  const utils = trpc.useUtils();
  return trpc.insightTemplates.applyTemplate.useMutation({
    onSuccess: (data: { templateName: string }) => {
      utils.insightTemplates.list.invalidate();
      utils.insightTemplates.detail.invalidate();
      showSuccessNotification({
        title: "Template Applied",
        message: `Applied "${data.templateName}"`,
      });
    },
    onError: (error: { message: string }) => {
      showErrorNotification({
        title: "Apply Failed",
        message: error.message,
      });
    },
  });
}

export function useValidateTemplate() {
  return trpc.insightTemplates.validate.useMutation();
}

export const templateApi = {
  keys: {
    list: () => ["insight-templates", "list"],
    byId: (id: string) => ["insight-templates", "detail", id],
  },
};
