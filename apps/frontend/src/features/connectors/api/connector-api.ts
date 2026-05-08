/**
 * Connector API Client
 *
 * Type-safe wrapper around tRPC connector operations.
 */

import { trpc } from "@/lib/api/trpc-client";

export function useConnectorList(input: {
  status?: "healthy" | "warning" | "error" | "inactive" | "syncing";
  domainId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  return trpc.connector.list.useQuery(input, {
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useConnectorDetail(id: string) {
  return trpc.connector.detail.useQuery({ id });
}

export function useConnectorCreate() {
  return trpc.connector.create.useMutation();
}

export function useConnectorUpdate() {
  return trpc.connector.update.useMutation();
}

export function useConnectorDelete() {
  const utils = trpc.useContext();
  return trpc.connector.delete.useMutation({
    onSuccess: () => {
      utils.connector.list.invalidate();
      utils.connector.detail.invalidate();
    },
  });
}

export function useConnectorSync() {
  const utils = trpc.useContext();
  return trpc.connector.sync.useMutation({
    onSuccess: () => {
      utils.connector.list.invalidate();
      utils.connector.detail.invalidate();
    },
  });
}

export function useConnectorTest() {
  return trpc.connector.test.useMutation();
}

export function useConnectorRemovalPreview(id: string) {
  return trpc.connector.removalPreview.useQuery({ id });
}

export function useConnectorMetrics(connectorIds: string[]) {
  return trpc.connector.metrics.useQuery(
    { connectorIds },
    {
      enabled: connectorIds.length > 0,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  );
}
