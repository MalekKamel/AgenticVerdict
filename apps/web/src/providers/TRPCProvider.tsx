/**
 * tRPC Client Provider
 *
 * Provides tRPC client to the React component tree.
 * This is a placeholder for future tRPC integration.
 */

"use client";

import React, { createContext, useContext, useMemo } from "react";

/**
 * tRPC Client context
 */
interface TRPCClientContext {
  /**
   * Whether the client is initialized
   */
  isInitialized: boolean;

  /**
   * Client version
   */
  version: string;
}

const TRPCContext = createContext<TRPCClientContext | null>(null);

/**
 * Hook to access tRPC client
 */
export function useTRPC(): TRPCClientContext {
  const context = useContext(TRPCContext);
  if (!context) {
    throw new Error("useTRPC must be used within a TRPCProvider");
  }
  return context;
}

/**
 * tRPC Provider component
 *
 * Wraps the app with tRPC client context.
 * This will be expanded when the tRPC backend is implemented.
 */
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const context = useMemo<TRPCClientContext>(
    () => ({
      isInitialized: false,
      version: "11.0.0",
    }),
    [],
  );

  return <TRPCContext.Provider value={context}>{children}</TRPCContext.Provider>;
}

/**
 * Default export for convenience
 */
export default TRPCProvider;
