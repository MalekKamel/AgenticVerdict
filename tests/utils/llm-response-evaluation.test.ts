import { describe, expect, it } from "vitest";

import {
  evaluateLlmResponse,
  jaccardSimilarityTokens,
  keywordOverlapScore,
  tokenizeWords,
} from "./llm-response-evaluation";

describe("keywordOverlapScore", () => {
  it("scores full match", () => {
    const r = keywordOverlapScore("Hello world report", ["hello", "report"]);
    expect(r.score).toBe(1);
    expect(r.missing).toEqual([]);
  });

  it("reports missing phrases", () => {
    const r = keywordOverlapScore("abc", ["a", "z"]);
    expect(r.score).toBe(0.5);
    expect(r.matched).toEqual(["a"]);
    expect(r.missing).toEqual(["z"]);
  });
});

describe("jaccardSimilarityTokens", () => {
  it("is 1 for identical token sets", () => {
    expect(jaccardSimilarityTokens("foo bar", "bar foo")).toBe(1);
  });

  it("is 0 for disjoint sets", () => {
    expect(jaccardSimilarityTokens("a b", "c d")).toBe(0);
  });
});

describe("tokenizeWords", () => {
  it("splits on non-word unicode", () => {
    expect(tokenizeWords("Q1 — performance")).toEqual(["q1", "performance"]);
  });
});

describe("evaluateLlmResponse", () => {
  it("passes when criteria satisfied", () => {
    const r = evaluateLlmResponse("The verdict is positive for growth.", {
      minLength: 10,
      requiredPhrases: ["verdict", "growth"],
    });
    expect(r.passed).toBe(true);
    expect(r.score).toBe(1);
    expect(r.reasons).toEqual([]);
  });

  it("fails on forbidden pattern", () => {
    const r = evaluateLlmResponse("error: leaked api_key=secret", {
      forbiddenPatterns: [/api_key\s*=/u],
    });
    expect(r.passed).toBe(false);
    expect(r.reasons.some((x) => x.includes("Forbidden"))).toBe(true);
  });

  it("evaluates reference similarity", () => {
    const r = evaluateLlmResponse("revenue increased quarter over quarter", {
      referenceText: "revenue increased quarter qoq",
      minReferenceSimilarity: 0.3,
    });
    expect(r.passed).toBe(true);
    expect(r.referenceSimilarity).toBeGreaterThan(0.3);
  });
});
