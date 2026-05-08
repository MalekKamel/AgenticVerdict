import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  AppShellContextProvider,
  useAppShellContext,
  useAppShellHeader,
} from "./app-shell-context";

function HeaderWriter({ label }: { label: string }) {
  useAppShellHeader({
    breadcrumbs: [{ label, href: "/dashboard" }],
  });
  return null;
}

function HeaderObserver({ snapshots }: { snapshots: number[] }) {
  const { breadcrumbs } = useAppShellContext();
  snapshots.push(breadcrumbs.length);
  return <div data-testid="crumb-label">{breadcrumbs[0]?.label ?? "none"}</div>;
}

describe("useAppShellHeader", () => {
  it("does not clear breadcrumbs on equivalent rerenders", async () => {
    const snapshots: number[] = [];
    const { rerender } = render(
      <AppShellContextProvider>
        <HeaderWriter label="Dashboard" />
        <HeaderObserver snapshots={snapshots} />
      </AppShellContextProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("crumb-label").textContent).toBe("Dashboard");
    });

    rerender(
      <AppShellContextProvider>
        <HeaderWriter label="Dashboard" />
        <HeaderObserver snapshots={snapshots} />
      </AppShellContextProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("crumb-label").textContent).toBe("Dashboard");
    });

    const updatesAfterFirstPopulation = snapshots.slice(2);
    expect(updatesAfterFirstPopulation).not.toContain(0);
  });
});
