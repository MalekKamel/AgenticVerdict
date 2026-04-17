"use client";

import type { ReactNode } from "react";

import { useSessionQuery } from "@/hooks/useSessionQuery";

/**
 * Fetches `/` session once on mount and on the configured refresh interval so
 * {@link useRequireAuth} and the auth store stay aligned with the API contract.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  useSessionQuery();
  return children;
}
