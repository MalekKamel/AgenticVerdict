import { trpc } from "@/lib/api/trpc-client";

export function useTenantConnectors() {
  return trpc.connector.list.useQuery(
    {
      status: "healthy",
      page: 1,
      pageSize: 100,
    },
    {
      staleTime: 5 * 60 * 1000,
    },
  );
}

export function useConnectorList(input: {
  status?: "healthy" | "warning" | "error" | "inactive" | "syncing";
  domainId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  return trpc.connector.list.useQuery(
    {
      status: input.status,
      domainId: input.domainId,
      search: input.search,
      page: input.page ?? 1,
      pageSize: input.pageSize ?? 20,
    },
    {
      staleTime: 5 * 60 * 1000,
    },
  );
}

export function useConnectorDelete() {
  const utils = trpc.useUtils();
  return trpc.connector.delete.useMutation({
    onSuccess: () => {
      utils.connector.list.invalidate();
    },
  });
}

export function useConnectorUpdate() {
  const utils = trpc.useUtils();
  return trpc.connector.update.useMutation({
    onSuccess: () => {
      utils.connector.list.invalidate();
    },
  });
}

export const connectorApi = {
  keys: {
    list: (tenantId: string) => ["connectors", tenantId],
    byId: (tenantId: string, connectorId: string) => ["connector", tenantId, connectorId],
  },
};
