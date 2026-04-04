import { describe, expect, it } from "vitest";

import { parseAgentFactoryConfig } from "./agent-config";
import {
  BoundedBufferMemory,
  CompositeAgentMemory,
  createAgentMemory,
  InMemoryAgentMemory,
  NullAgentMemory,
} from "./memory";

describe("agent memory (Phase 6)", () => {
  it("NullAgentMemory discards content", () => {
    const m = new NullAgentMemory();
    m.append("user", "x");
    expect(m.snapshot()).toEqual([]);
  });

  it("BoundedBufferMemory evicts oldest turns", () => {
    const m = new BoundedBufferMemory(3);
    m.append("user", "a");
    m.append("assistant", "b");
    m.append("user", "c");
    m.append("assistant", "d");
    expect(m.snapshot().map((t) => t.content)).toEqual(["b", "c", "d"]);
  });

  it("InMemoryAgentMemory stays unbounded", () => {
    const m = new InMemoryAgentMemory();
    for (let i = 0; i < 50; i += 1) {
      m.append("user", String(i));
    }
    expect(m.snapshot()).toHaveLength(50);
  });

  it("CompositeAgentMemory rolls evicted turns into long-term summary", () => {
    const m = new CompositeAgentMemory("buffer_summary", {
      maxBufferTurns: 2,
      maxLongTermChars: 10_000,
      mergeEvictedTurnsIntoSummary: true,
      maxSemanticSnippets: 8,
      maxEntities: 8,
    });
    m.append("user", "first");
    m.append("assistant", "ok1");
    m.append("user", "second");
    m.append("assistant", "ok2");
    m.append("user", "third");
    expect(m.getLongTermSummaryForTests()).toContain("first");
    const snap = m.snapshot();
    expect(snap.some((t) => t.role === "system" && t.content.includes("prior conversation"))).toBe(
      true,
    );
  });

  it("CompositeAgentMemory in full mode captures ENTITY lines and snippets", () => {
    const m = new CompositeAgentMemory("full", {
      maxBufferTurns: 10,
      maxLongTermChars: 5000,
      mergeEvictedTurnsIntoSummary: true,
      maxSemanticSnippets: 10,
      maxEntities: 10,
    });
    m.append("assistant", "ENTITY:brand=Acme\nDone.");
    const hits = m.findSemanticSnippets("Acme", 3);
    expect(hits.some((h) => h.includes("Acme"))).toBe(true);
    const sys = m.snapshot().filter((t) => t.role === "system");
    expect(sys.some((t) => t.content.includes("brand=Acme"))).toBe(true);
  });

  it("CompositeAgentMemory clear resets all layers", () => {
    const m = new CompositeAgentMemory("full", {
      maxBufferTurns: 2,
      maxLongTermChars: 1000,
      mergeEvictedTurnsIntoSummary: true,
      maxSemanticSnippets: 4,
      maxEntities: 4,
    });
    m.append("user", "a");
    m.append("assistant", "b");
    m.append("user", "c");
    m.clear();
    expect(m.snapshot()).toEqual([]);
    expect(m.getLongTermSummaryForTests()).toBe("");
    expect(m.findSemanticSnippets("b", 2)).toEqual([]);
  });

  it("createAgentMemory maps factory memory modes", () => {
    const none = parseAgentFactoryConfig({
      memoryMode: "none",
      runtimeMode: "test",
      role: "insights",
    });
    expect(createAgentMemory(none).snapshot()).toEqual([]);

    const buf = parseAgentFactoryConfig({
      role: "insights",
      memoryMode: "buffer",
      runtimeMode: "test",
      memoryLimits: { maxBufferTurns: 1 },
    });
    const bm = createAgentMemory(buf);
    bm.append("user", "a");
    bm.append("user", "b");
    expect(bm.snapshot()).toHaveLength(1);
  });
});
