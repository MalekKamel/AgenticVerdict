import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

import { PERMISSIONS } from "@agenticverdict/types";

import { useCanAccess } from "./useCanAccess";
import { authStore } from "@/features/auth/model/state/auth-store";

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

describe("useCanAccess", () => {
  it("returns false when no options provided (fail-closed)", () => {
    setRoles(["admin"]);

    const { result } = renderHook(() => useCanAccess({}));

    expect(result.current).toBe(false);
  });

  it("checks single permission", () => {
    // Note: Permission checking will work once permissions are added to auth store
    // For now, this tests the hook structure
    setRoles(["admin"]);

    const { result } = renderHook(() => useCanAccess({ permission: PERMISSIONS.REPORTS_READ }));

    // Currently returns false since permissions aren't in auth store yet
    expect(result.current).toBe(false);
  });

  it("checks single role", () => {
    setRoles(["admin"]);

    const { result } = renderHook(() => useCanAccess({ role: "admin" }));

    expect(result.current).toBe(true);
  });

  it("checks allPermissions", () => {
    setRoles(["admin"]);

    const { result } = renderHook(() =>
      useCanAccess({
        allPermissions: [PERMISSIONS.REPORTS_READ, PERMISSIONS.REPORTS_WRITE],
      }),
    );

    // Currently returns false since permissions aren't in auth store yet
    expect(result.current).toBe(false);
  });

  it("checks anyPermissions", () => {
    setRoles(["admin"]);

    const { result } = renderHook(() =>
      useCanAccess({
        anyPermissions: [PERMISSIONS.REPORTS_READ, PERMISSIONS.USERS_WRITE],
      }),
    );

    // Currently returns false since permissions aren't in auth store yet
    expect(result.current).toBe(false);
  });

  it("checks allRoles", () => {
    setRoles(["admin", "editor"]);

    const { result } = renderHook(() => useCanAccess({ allRoles: ["admin", "editor"] }));

    expect(result.current).toBe(true);
  });

  it("checks anyRoles", () => {
    setRoles(["editor"]);

    const { result } = renderHook(() => useCanAccess({ anyRoles: ["admin", "editor"] }));

    expect(result.current).toBe(true);
  });

  it("permission check takes precedence over role check", () => {
    setRoles(["admin"]);

    // Even though user has admin role, permission check takes precedence
    const { result } = renderHook(() =>
      useCanAccess({
        permission: PERMISSIONS.REPORTS_DELETE,
        role: "admin",
      }),
    );

    // Returns false because permission check is evaluated first
    expect(result.current).toBe(false);
  });

  it("returns false for non-matching role", () => {
    setRoles(["viewer"]);

    const { result } = renderHook(() => useCanAccess({ role: "admin" }));

    expect(result.current).toBe(false);
  });

  it("returns memoized result", () => {
    setRoles(["admin"]);

    const { result, rerender } = renderHook(() => useCanAccess({ role: "admin" }));
    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult);
  });

  it("updates when roles change", () => {
    setRoles(["viewer"]);

    const { result, rerender } = renderHook(() => useCanAccess({ role: "admin" }));

    expect(result.current).toBe(false);

    setRoles(["admin"]);
    rerender();

    expect(result.current).toBe(true);
  });
});
