import { describe, expect, it } from "vitest";

import { authActions } from "@/stores/auth-store";

import { buildTrpcHeaders } from "./trpc-client";

describe("trpc-client headers", () => {
  it("sends x-tenant-id when auth store has a UUID tenant", () => {
    const id = "33333333-3333-4333-8333-333333333333";
    authActions.setTenantId(id);
    const h = buildTrpcHeaders();
    expect(h["x-tenant-id"]).toBe(id);
    expect(h["x-request-id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    authActions.logout();
  });
});
