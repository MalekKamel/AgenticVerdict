import { describe, expect, it } from "vitest";
import { getNavbarToggleIcon } from "./navbar-utils";

describe("navbar-utils", () => {
  describe("getNavbarToggleIcon", () => {
    it("returns right arrow (») when collapsed in LTR", () => {
      expect(getNavbarToggleIcon(false, true)).toBe("»");
    });

    it("returns left arrow («) when expanded in LTR", () => {
      expect(getNavbarToggleIcon(false, false)).toBe("«");
    });

    it("returns left arrow («) when collapsed in RTL", () => {
      expect(getNavbarToggleIcon(true, true)).toBe("«");
    });

    it("returns right arrow (») when expanded in RTL", () => {
      expect(getNavbarToggleIcon(true, false)).toBe("»");
    });
  });
});
