"use client";

import { useSessionQuery } from "@/hooks/useSessionQuery";

export function useShellBootstrap() {
  const sessionQuery = useSessionQuery();
  const hasError = !!sessionQuery.error;
  const isLoading = sessionQuery.isLoading && !sessionQuery.data;

  return {
    isLoading,
    isError: hasError,
    error: sessionQuery.error,
    retry: () => sessionQuery.refetch(),
  };
}
