"use client";

import { trpc } from "@/lib/api/trpc-client";
import { extractTenantSlugFromHost } from "@/lib/tenant/extract-tenant-slug";
import { getEffectiveTenantId, isTenantUuid } from "@/lib/tenant/tenant-resolution";
import { publishTenantIdForTrpcHeaders } from "@/lib/tenant/trpc-tenant-bridge";
import { useAuthStore } from "@/stores/auth-store";
import { computeCapabilities } from "@/hooks/useTenantType";
import type { TenantType, TenantStatus, TenantCapabilities } from "@agenticverdict/types";
import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";

export interface TenantContextValue {
  tenantId: string | undefined;
  tenantType: TenantType | undefined;
  tenantStatus: TenantStatus | undefined;
  capabilities: TenantCapabilities;
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

  const authenticatedTenantId =
    auth.isAuthenticated && isTenantUuid(auth.tenantId) ? auth.tenantId : undefined;

  const { data: slugResolve } = trpc.tenant.resolveSlug.useQuery(
    { slug: slug! },
    { enabled: Boolean(slug) && !authenticatedTenantId },
  );

  const value = useMemo(
    (): TenantContextValue => ({
      tenantId: getEffectiveTenantId({
        authTenantId: authenticatedTenantId,
        slugResolvedTenantId: slugResolve?.tenantId,
      }),
      tenantType: auth.tenantType ?? undefined,
      tenantStatus: auth.tenantStatus ?? undefined,
      capabilities: computeCapabilities(auth.tenantType, auth.tenantStatus),
    }),
    [authenticatedTenantId, slugResolve?.tenantId, auth.tenantType, auth.tenantStatus],
  );

  useEffect(() => {
    publishTenantIdForTrpcHeaders(value.tenantId);
  }, [value.tenantId]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return ctx;
}
