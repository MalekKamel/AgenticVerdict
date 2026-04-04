import { describe, expect, it } from "vitest";

import { defineTool, ToolRegistry } from "./tools";

describe("ToolRegistry", () => {
  it("registers and retrieves tools", () => {
    const registry = new ToolRegistry();
    registry.register(
      defineTool({
        name: "add",
        description: "adds",
        execute: async (args) => Number(args.a) + Number(args.b),
      }),
    );
    expect(registry.get("add")).toBeDefined();
  });

  it("rejects duplicate names", () => {
    const registry = new ToolRegistry();
    const t = defineTool({ name: "x", description: "x", execute: async () => 1 });
    registry.register(t);
    expect(() => registry.register(t)).toThrow(/already registered/);
  });
});
