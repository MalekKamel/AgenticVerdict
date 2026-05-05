"use client";

import { type ReactNode } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { logWebClientError } from "@/lib/observability/client-log";

interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName: string;
}

/**
 * Page-level error boundary that wraps entire pages.
 *
 * Provides:
 * - Automatic error logging with tenant context
 * - User-friendly error UI
 * - Retry functionality
 *
 * @example
 * ```tsx
 * export default function MyPage() {
 *   return (
 *     <PageErrorBoundary pageName="MyPage">
 *       <PageContent />
 *     </PageErrorBoundary>
 *   );
 * }
 * ```
 */
export function PageErrorBoundary({ children, pageName }: PageErrorBoundaryProps) {
  const handleError = (error: Error) => {
    logWebClientError(error, {
      source: "route",
      routeLabel: pageName,
    });
  };

  return <ErrorBoundary onError={handleError}>{children}</ErrorBoundary>;
}
