import { Counter } from "prom-client";

import { productionFlowTestRegistry } from "./registry";

type TenantSecuritySurface = "http" | "trpc";
type TenantRateLimitBucketType = "tenant" | "anonymous" | "global";

const tenantSecurityEventsTotal = new Counter<"surface" | "code">({
  name: "agenticverdict_tenant_security_events_total",
  help: "Tenant security events by surface and code",
  labelNames: ["surface", "code"],
  registers: [productionFlowTestRegistry],
});

const tenantRateLimitHitsTotal = new Counter<"key_prefix" | "bucket_type">({
  name: "agenticverdict_tenant_rate_limit_hits_total",
  help: "Tenant-aware rate-limit hits grouped by key prefix and bucket type",
  labelNames: ["key_prefix", "bucket_type"],
  registers: [productionFlowTestRegistry],
});

export function recordTenantSecurityEvent(surface: TenantSecuritySurface, code: string): void {
  tenantSecurityEventsTotal.inc({ surface, code });
}

export function recordTenantRateLimitHit(
  keyPrefix: string,
  bucketType: TenantRateLimitBucketType,
): void {
  tenantRateLimitHitsTotal.inc({ key_prefix: keyPrefix, bucket_type: bucketType });
}
