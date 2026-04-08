import { describe, expect, it } from "vitest";

import { computeSentenceBleu, meanSentenceBleu } from "./bleu-score";

describe("computeSentenceBleu", () => {
  it("returns 1 for identical strings", () => {
    expect(computeSentenceBleu("hello world", "hello world")).toBeCloseTo(1, 5);
  });

  it("returns a low score for unrelated Arabic vs English", () => {
    const s = computeSentenceBleu("مرحبا بالعالم", "hello world");
    expect(s).toBeLessThan(0.2);
  });

  it("scores partial overlap between related sentences above unrelated baseline", () => {
    const related = computeSentenceBleu("the quick brown fox jumps", "the quick brown fox runs");
    const unrelated = computeSentenceBleu(
      "the quick brown fox jumps",
      "completely different words here",
    );
    expect(related).toBeGreaterThan(unrelated);
    expect(related).toBeLessThan(1);
  });
});

describe("meanSentenceBleu", () => {
  it("averages over pairs", () => {
    const m = meanSentenceBleu([
      { candidate: "a b c", reference: "a b c" },
      { candidate: "x y", reference: "x y z" },
    ]);
    expect(m).toBeGreaterThan(0);
    expect(m).toBeLessThan(1);
  });
});
