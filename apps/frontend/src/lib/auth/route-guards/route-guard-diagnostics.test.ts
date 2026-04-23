import { describe, expect, it, vi } from "vitest";

import { createRouteGuardDiagnosticsLogger } from "./route-guard-diagnostics";

describe("createRouteGuardDiagnosticsLogger", () => {
  it("logs non-sensitive decision diagnostics", () => {
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const logDecision = createRouteGuardDiagnosticsLogger();

    logDecision({
      routeKind: "protected",
      authState: { kind: "unknown", reason: "recovering" },
      decision: { type: "defer", reason: "unknown_state" },
    });

    expect(debugSpy).toHaveBeenCalledWith("[auth.route_guard]", {
      routeKind: "protected",
      authStateKind: "unknown",
      decisionType: "defer",
    });

    debugSpy.mockRestore();
  });
});
