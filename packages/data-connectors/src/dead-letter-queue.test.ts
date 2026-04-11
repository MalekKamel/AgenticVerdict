import { describe, expect, it } from "vitest";

import { InMemoryDeadLetterQueue } from "./dead-letter-queue";

describe("InMemoryDeadLetterQueue", () => {
  it("captures permanent failures (AC-1.7.7)", () => {
    const dlq = new InMemoryDeadLetterQueue(10);
    dlq.enqueue({
      connector: "meta",
      operation: "fetchMetrics",
      errorMessage: "invalid token",
    });
    expect(dlq.size()).toBe(1);
    const [first] = dlq.list();
    expect(first?.connector).toBe("meta");
    expect(first?.operation).toBe("fetchMetrics");
  });

  it("drops oldest entries when over capacity", () => {
    const dlq = new InMemoryDeadLetterQueue(2);
    dlq.enqueue({ connector: "meta", operation: "a", errorMessage: "e1" });
    dlq.enqueue({ connector: "ga4", operation: "b", errorMessage: "e2" });
    dlq.enqueue({ connector: "gsc", operation: "c", errorMessage: "e3" });
    expect(dlq.size()).toBe(2);
    expect(dlq.list()[0]?.connector).toBe("ga4");
  });
});
