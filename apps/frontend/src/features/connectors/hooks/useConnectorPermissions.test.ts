import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

import { useConnectorPermissions } from "./useConnectorPermissions";
import { authStore } from "@/stores/auth-store";

function setRoles(roles: string[]) {
  authStore.setState((prev) => ({
    ...prev,
    user: prev.user
      ? { ...prev.user, roles }
      : {
          id: "u1",
          email: "test@test.com",
          firstName: "Test",
          lastName: "User",
          emailVerified: true,
          roles,
        },
  }));
}

describe("useConnectorPermissions", () => {
  it("grants full access for admin", () => {
    setRoles(["admin"]);
    const { result } = renderHook(() => useConnectorPermissions());
    expect(result.current.canView).toBe(true);
    expect(result.current.canSync).toBe(true);
    expect(result.current.canConfigure).toBe(true);
    expect(result.current.canAdd).toBe(true);
    expect(result.current.canRemove).toBe(true);
  });

  it("grants view+sync for analyst", () => {
    setRoles(["analyst"]);
    const { result } = renderHook(() => useConnectorPermissions());
    expect(result.current.canView).toBe(true);
    expect(result.current.canSync).toBe(true);
    expect(result.current.canConfigure).toBe(false);
    expect(result.current.canAdd).toBe(false);
    expect(result.current.canRemove).toBe(false);
  });

  it("grants view-only for viewer", () => {
    setRoles(["viewer"]);
    const { result } = renderHook(() => useConnectorPermissions());
    expect(result.current.canView).toBe(true);
    expect(result.current.canSync).toBe(false);
    expect(result.current.canConfigure).toBe(false);
    expect(result.current.canAdd).toBe(false);
    expect(result.current.canRemove).toBe(false);
  });
});
