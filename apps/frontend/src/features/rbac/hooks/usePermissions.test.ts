import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

import { PERMISSIONS } from "@AgenticVerdict/types";

import { usePermissions } from "./usePermissions";
import { authStore } from "@/features/auth/model/state/auth-store";

function setPermissions() {
  // Note: Currently permissions are not stored in the auth store
  // This test will be updated when permissions are added to the user object
  authStore.setState((prev) => ({
    ...prev,
    user: prev.user
      ? { ...prev.user }
      : {
          id: "u1",
          email: "test@test.com",
          firstName: "Test",
          lastName: "User",
          emailVerified: true,
          roles: [],
        },
  }));
}

describe("usePermissions", () => {
  it("returns empty permissions when user is not authenticated", () => {
    authStore.setState((prev) => ({
      ...prev,
      user: null,
    }));

    const { result } = renderHook(() => usePermissions());

    expect(result.current.permissions).toEqual([]);
    expect(result.current.hasPermission(PERMISSIONS.REPORTS_READ)).toBe(false);
    expect(result.current.hasAnyPermission([PERMISSIONS.REPORTS_READ])).toBe(false);
    expect(result.current.hasAllPermissions([PERMISSIONS.REPORTS_READ])).toBe(false);
  });

  it("returns memoized result object", () => {
    setPermissions([]);

    const { result, rerender } = renderHook(() => usePermissions());
    const firstResult = result.current;

    rerender();

    expect(result.current).toStrictEqual(firstResult);
  });

  it("hasPermission returns false for all checks when no permissions", () => {
    setPermissions([]);

    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasPermission(PERMISSIONS.REPORTS_READ)).toBe(false);
    expect(result.current.hasPermission(PERMISSIONS.USERS_WRITE)).toBe(false);
  });
});
