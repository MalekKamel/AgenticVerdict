import { afterEach, describe, expect, it } from "vitest";

import { resetTenantBridgeForTests } from "@/lib/tenant/trpc-tenant-bridge";
import { authActions } from "@/stores/auth-store";

import {
  buildTrpcHeaders,
  buildTrpcHeadersWithoutTenant,
  inferDevApiBaseUrlFromBrowserLocation,
} from "./trpc-client";

describe("trpc-client headers", () => {
  afterEach(() => {
    resetTenantBridgeForTests();
    authActions.logout();
  });

  it("sends x-tenant-id when authenticated session has a UUID tenant", () => {
    const id = "33333333-3333-4333-8333-333333333333";
    authActions.setAuth(
      true,
      {
        id: "user-1",
        email: "u@test.local",
        firstName: "U",
        lastName: "",
        emailVerified: true,
        roles: ["viewer"],
        permissions: [],
        tenantId: id,
        tenantType: "direct_business",
        tenantStatus: "active",
      },
      id,
      "direct_business",
      "active",
    );
    const h = buildTrpcHeaders();
    expect(h["x-tenant-id"]).toBe(id);
    expect(h["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("omits x-tenant-id for tenant-neutral headers", () => {
    authActions.setTenantId("33333333-3333-4333-8333-333333333333");
    const h = buildTrpcHeadersWithoutTenant();
    expect(h["x-tenant-id"]).toBeUndefined();
    expect(h["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});

describe("inferDevApiBaseUrlFromBrowserLocation", () => {
  it("maps local frontend port 3000 to api port 4000", () => {
    expect(
      inferDevApiBaseUrlFromBrowserLocation({
        protocol: "http:",
        hostname: "localhost",
        port: "3000",
      }),
    ).toBe("http://localhost:4000");
  });

  it("maps incremented frontend port 3001 to api port 4001", () => {
    expect(
      inferDevApiBaseUrlFromBrowserLocation({
        protocol: "http:",
        hostname: "localhost",
        port: "3001",
      }),
    ).toBe("http://localhost:4001");
  });

  it("falls back to 4000 when frontend port is unavailable", () => {
    expect(
      inferDevApiBaseUrlFromBrowserLocation({
        protocol: "https:",
        hostname: "app.local",
        port: "",
      }),
    ).toBe("https://app.local:4000");
  });
});
