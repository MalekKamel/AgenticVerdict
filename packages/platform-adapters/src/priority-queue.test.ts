import { describe, expect, it } from "vitest";

import { RequestPriorityQueue } from "./priority-queue";

describe("RequestPriorityQueue", () => {
  it("runs higher priority tasks first", async () => {
    const q = new RequestPriorityQueue<number>();
    const order: number[] = [];
    q.enqueue({
      priority: "low",
      run: async () => {
        order.push(3);
        return 3;
      },
    });
    q.enqueue({
      priority: "critical",
      run: async () => {
        order.push(1);
        return 1;
      },
    });
    q.enqueue({
      priority: "normal",
      run: async () => {
        order.push(2);
        return 2;
      },
    });

    while (q.depth() > 0) {
      await q.drainNext();
    }
    expect(order).toEqual([1, 2, 3]);
  });

  it("returns undefined when empty", async () => {
    const q = new RequestPriorityQueue<number>();
    expect(await q.drainNext()).toBeUndefined();
  });
});
