import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";

import { useRoles } from "./useRoles";
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

describe("useRoles", () => {
  it("returns empty roles when user is not authenticated", () => {
    authStore.setState((prev) => ({
      ...prev,
      user: null,
    }));

    const { result } = renderHook(() => useRoles());

    expect(result.current.roles).toEqual([]);
    expect(result.current.hasRole("admin")).toBe(false);
    expect(result.current.hasAnyRole(["admin", "editor"])).toBe(false);
    expect(result.current.hasAllRoles(["viewer"])).toBe(false);
  });

  it("returns roles from user object", () => {
    setRoles(["admin", "editor"]);

    const { result } = renderHook(() => useRoles());

    expect(result.current.roles).toEqual(["admin", "editor"]);
  });

  it("hasRole returns true when user has the role", () => {
    setRoles(["admin"]);

    const { result } = renderHook(() => useRoles());

    expect(result.current.hasRole("admin")).toBe(true);
    expect(result.current.hasRole("viewer")).toBe(false);
  });

  it("hasAnyRole returns true when user has any of the roles", () => {
    setRoles(["editor"]);

    const { result } = renderHook(() => useRoles());

    expect(result.current.hasAnyRole(["admin", "editor"])).toBe(true);
    expect(result.current.hasAnyRole(["viewer", "analyst"])).toBe(false);
  });

  it("hasAllRoles returns true when user has all roles", () => {
    setRoles(["admin", "editor"]);

    const { result } = renderHook(() => useRoles());

    expect(result.current.hasAllRoles(["admin", "editor"])).toBe(true);
    expect(result.current.hasAllRoles(["admin", "viewer"])).toBe(false);
  });

  it("returns memoized result object", () => {
    setRoles(["admin"]);

    const { result, rerender } = renderHook(() => useRoles());
    const firstResult = result.current;

    rerender();

    expect(result.current).toStrictEqual(firstResult);
  });

  it("updates roles when user changes", () => {
    setRoles(["viewer"]);

    const { result, rerender } = renderHook(() => useRoles());

    expect(result.current.roles).toEqual(["viewer"]);
    expect(result.current.hasRole("admin")).toBe(false);

    setRoles(["admin"]);
    rerender();

    expect(result.current.roles).toEqual(["admin"]);
    expect(result.current.hasRole("admin")).toBe(true);
  });
});
