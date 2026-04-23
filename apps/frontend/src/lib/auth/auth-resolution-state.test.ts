import { describe, expect, it } from "vitest";

import { resolveAuthResolutionState } from "./auth-resolution-state";

describe("resolveAuthResolutionState", () => {
  it("returns unknown for pending state", () => {
    expect(resolveAuthResolutionState({ session: undefined, isPending: true })).toEqual({
      kind: "unknown",
      reason: "initial",
    });
  });

  it("returns unknown for probe failure", () => {
    expect(resolveAuthResolutionState({ session: null, sessionCheckFailed: true })).toEqual({
      kind: "unknown",
      reason: "probe_failed",
    });
  });

  it("returns anonymous when no user session exists", () => {
    expect(resolveAuthResolutionState({ session: { user: null, sessionExpiresAt: null } })).toEqual(
      {
        kind: "anonymous",
      },
    );
  });

  it("returns authenticated_unverified when email is unverified", () => {
    const state = resolveAuthResolutionState({
      session: {
        user: {
          id: "u1",
          email: "user@example.com",
          firstName: "User",
          lastName: "Example",
          emailVerified: false,
          tenantId: "11111111-1111-4111-8111-111111111111",
        },
        sessionExpiresAt: "2099-01-01T00:00:00.000Z",
      },
    });
    expect(state.kind).toBe("authenticated_unverified");
  });

  it("returns authenticated_verified when email is verified", () => {
    const state = resolveAuthResolutionState({
      session: {
        user: {
          id: "u2",
          email: "user@example.com",
          firstName: "User",
          lastName: "Example",
          emailVerified: true,
          tenantId: "11111111-1111-4111-8111-111111111111",
        },
        sessionExpiresAt: "2099-01-01T00:00:00.000Z",
      },
    });
    expect(state.kind).toBe("authenticated_verified");
  });
});
