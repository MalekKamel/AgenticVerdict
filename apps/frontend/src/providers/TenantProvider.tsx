"use client";

import { extractTenantSlugFromHost } from "@agenticverdict/core";

import { trpc } from "@/lib/api/trpc-client";
import { getEffectiveTenantId, isTenantUuid } from "@/lib/tenant/tenant-resolution";
import { useAuthStore } from "@/stores/auth-store";
import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";

export interface TenantContextValue {
  /** Resolved tenant UUID for the current client session, when known. */
  tenantId: string | undefined;
}

const TenantContext = createContext<TenantContextValue | null>(null);

function readTrustedBaseDomains(): string[] {
  try {
    const raw =
      typeof import.meta !== "undefined" && import.meta.env?.VITE_PUBLIC_TENANT_BASE_DOMAINS
        ? String(import.meta.env.VITE_PUBLIC_TENANT_BASE_DOMAINS)
        : "";
    if (!raw.trim()) {
      return [];
    }
    return raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Provides tenant id derived from auth state, optional subdomain slug resolution, and dev default env
 * (see `getEffectiveTenantId`). Keeps `x-tenant-id` aligned with `trpc-client.ts`.
 */
export function TenantProvider({ children }: { children: ReactNode }) {
  const auth = useAuthStore();
  const bases = useMemo(() => readTrustedBaseDomains(), []);
  const [hostname, setHostname] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHostname(window.location.hostname);
    }
  }, []);

  const slug = useMemo(() => {
    if (!bases.length || !hostname) {
      return undefined;
    }
    return extractTenantSlugFromHost(hostname, bases);
  }, [bases, hostname]);

  const { data: slugResolve } = trpc.tenant.resolveSlug.useQuery(
    { slug: slug! },
    { enabled: Boolean(slug) && !isTenantUuid(auth.tenantId) },
  );

  const value = useMemo(
    (): TenantContextValue => ({
      tenantId: getEffectiveTenantId({
        authTenantId: auth.tenantId,
        slugResolvedTenantId: slugResolve?.tenantId,
      }),
    }),
    [auth.tenantId, slugResolve?.tenantId],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return ctx;
}
