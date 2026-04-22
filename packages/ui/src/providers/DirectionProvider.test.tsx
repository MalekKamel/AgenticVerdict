import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DirectionProvider } from "./DirectionProvider";

function Harness({ locale }: { locale: string }) {
  return <DirectionProvider initialLocale={locale}>{null}</DirectionProvider>;
}

describe("DirectionProvider", () => {
  it("updates document dir when initialLocale changes (SPA locale navigation)", async () => {
    const { rerender } = render(<Harness locale="ar" />);

    await waitFor(() => {
      expect(document.documentElement.getAttribute("dir")).toBe("rtl");
    });

    rerender(<Harness locale="en" />);

    await waitFor(() => {
      expect(document.documentElement.getAttribute("dir")).toBe("ltr");
    });
  });
});
