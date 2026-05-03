import { describe, expect, it } from "vitest";

import { REQUIRED_SHELL_EVENTS, hasRequiredShellEvents } from "./shell-analytics";

describe("hasRequiredShellEvents", () => {
  it("returns true when all required events are present", () => {
    expect(hasRequiredShellEvents([...REQUIRED_SHELL_EVENTS])).toBe(true);
  });

  it("returns false when any required event is missing", () => {
    const partial = REQUIRED_SHELL_EVENTS.filter(
      (eventName) => eventName !== "shell_retry_clicked",
    );
    expect(hasRequiredShellEvents(partial)).toBe(false);
  });
});
