import { screen } from "@testing-library/react";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MantineProvider } from "@mantine/core";
import { Icon } from "./Icon";

describe("Icon", () => {
  it("renders as an inline semantic wrapper for icon content", () => {
    render(
      <MantineProvider>
        <Icon size="sm" aria-label="Search icon">
          <svg viewBox="0 0 16 16" role="img" aria-hidden="true">
            <circle cx="8" cy="8" r="6" />
          </svg>
        </Icon>
      </MantineProvider>,
    );

    const wrapper = screen.getByLabelText("Search icon");
    expect(wrapper).not.toBeNull();
    expect(wrapper.querySelector("svg")).not.toBeNull();
  });
});
