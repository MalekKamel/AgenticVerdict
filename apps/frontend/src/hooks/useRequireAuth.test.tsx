import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as navigation from "@/i18n/navigation";

import { useRequireAuth } from "./useRequireAuth";
import { useSessionQuery } from "./useSessionQuery";

vi.mock("./useSessionQuery", () => ({
  useSessionQuery: vi.fn(),
}));

const mockedSession = vi.mocked(useSessionQuery);
const mockedPathname = vi.mocked(navigation.usePathname);
const mockedPush = vi.fn();

vi.mocked(navigation.useRouter).mockReturnValue({
  push: mockedPush,
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
});

function Harness() {
  useRequireAuth();
  return <div data-testid="harness" />;
}

function VerifiedHarness() {
  useRequireAuth({ requireVerifiedEmail: true });
  return <div data-testid="harness" />;
}

describe("useRequireAuth", () => {
  beforeEach(() => {
    mockedPush.mockClear();
    mockedPathname.mockReturnValue("/dashboard");
  });

  it("does not redirect while the session query is pending", () => {
    mockedSession.mockReturnValue({
      data: undefined,
      isPending: true,
      isFetching: false,
      error: null,
    } as ReturnType<typeof useSessionQuery>);

    render(<Harness />);
    expect(mockedPush).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated users away from protected paths", async () => {
    mockedSession.mockReturnValue({
      data: { user: null, sessionExpiresAt: null },
      isPending: false,
      isFetching: false,
      error: null,
    } as ReturnType<typeof useSessionQuery>);

    render(<Harness />);
    await waitFor(() =>
      expect(mockedPush).toHaveBeenCalledWith("/auth/login?redirect=%2Fdashboard"),
    );
  });

  it("skips redirect on auth routes", () => {
    mockedPathname.mockReturnValue("/auth/login");
    mockedSession.mockReturnValue({
      data: { user: null, sessionExpiresAt: null },
      isPending: false,
      isFetching: false,
      error: null,
    } as ReturnType<typeof useSessionQuery>);

    render(<Harness />);
    expect(mockedPush).not.toHaveBeenCalled();
  });

  it("redirects authenticated but unverified users to verify-email when required", async () => {
    mockedSession.mockReturnValue({
      data: {
        user: {
          id: "user-1",
          email: "user@example.com",
          firstName: "Test",
          lastName: "User",
          emailVerified: false,
          tenantId: "11111111-1111-4111-8111-111111111111",
        },
        sessionExpiresAt: "2099-01-01T00:00:00.000Z",
      },
      isPending: false,
      isFetching: false,
      error: null,
    } as ReturnType<typeof useSessionQuery>);

    render(<VerifiedHarness />);
    await waitFor(() =>
      expect(mockedPush).toHaveBeenCalledWith(
        "/auth/verify-email?redirect=%2Fdashboard&email=user%40example.com&tenantId=11111111-1111-4111-8111-111111111111",
      ),
    );
  });

  it("redirects unauthenticated users even while session is refetching with a settled snapshot", async () => {
    mockedSession.mockReturnValue({
      data: { user: null, sessionExpiresAt: null },
      isPending: false,
      isFetching: true,
      error: null,
    } as ReturnType<typeof useSessionQuery>);

    render(<Harness />);
    await waitFor(() =>
      expect(mockedPush).toHaveBeenCalledWith("/auth/login?redirect=%2Fdashboard"),
    );
  });
});
