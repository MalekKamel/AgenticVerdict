"use client";

/**
 * Route-level error boundary UI (works without Mantine — may render outside `Providers`).
 */

import { getTrpcSafeUserMessage } from "@/lib/api/trpc-error-message";
import { logWebClientError } from "@/lib/observability/client-log";
import { useEffect } from "react";

export interface AppRouteErrorProps {
  error: unknown;
  reset: () => void;
  /** Shown in logs only; keep stable per route file */
  routeLabel?: string;
}

export function AppRouteError({ error, reset, routeLabel }: AppRouteErrorProps) {
  useEffect(() => {
    logWebClientError(error, { source: "route", routeLabel });
  }, [error, routeLabel]);

  const message = getTrpcSafeUserMessage(error);

  return (
    <div
      role="alert"
      style={{
        padding: "1rem",
        maxWidth: "36rem",
        margin: "2rem auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "1.125rem", marginBottom: "0.5rem" }}>Something went wrong</h1>
      <p style={{ marginBottom: "1rem", color: "#333" }}>{message}</p>
      <button
        type="button"
        onClick={() => reset()}
        style={{
          appearance: "none",
          fontSize: "0.875rem",
          border: "1px solid #333",
          padding: "0.35rem 0.75rem",
          borderRadius: "0.25rem",
          cursor: "pointer",
          background: "#fff",
        }}
      >
        Try again
      </button>
    </div>
  );
}
