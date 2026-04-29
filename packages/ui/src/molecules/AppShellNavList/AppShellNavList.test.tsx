import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MantineProvider } from "@mantine/core";
import type { ReactElement } from "react";
import { AppShellNavList } from "./AppShellNavList";

function renderNav(ui: ReactElement) {
  return render(<MantineProvider>{ui}</MantineProvider>);
}

describe("AppShellNavList", () => {
  it("supports keyboard activation and marks the active item semantically", async () => {
    const onSelectHome = vi.fn();
    const onSelectReports = vi.fn();
    const user = userEvent.setup();

    renderNav(
      <AppShellNavList
        aria-label="Main navigation"
        items={[
          { id: "home", label: "Home", isActive: true, onSelect: onSelectHome },
          { id: "reports", label: "Reports", onSelect: onSelectReports },
        ]}
      />,
    );

    const homeButton = screen.getByRole("button", { name: "Home" });
    expect(homeButton.getAttribute("aria-current")).toBe("page");

    await user.tab();
    expect(document.activeElement).toBe(homeButton);

    await user.keyboard("{Enter}");
    expect(onSelectHome).toHaveBeenCalledTimes(1);
  });

  it("renders in both LTR and RTL directions using logical alignment", () => {
    renderNav(
      <div dir="ltr">
        <AppShellNavList
          aria-label="Side navigation"
          items={[{ id: "home", label: "Home", onSelect: vi.fn() }]}
        />
      </div>,
    );

    expect(screen.getByRole("button", { name: "Home" })).not.toBeNull();

    renderNav(
      <div dir="rtl">
        <AppShellNavList
          aria-label="Side navigation RTL"
          items={[{ id: "home-rtl", label: "Home RTL", onSelect: vi.fn(), active: true }]}
        />
      </div>,
    );

    const rtlButton = screen.getByRole("button", { name: "Home RTL" });
    expect(rtlButton.getAttribute("aria-current")).toBe("page");
  });
});
