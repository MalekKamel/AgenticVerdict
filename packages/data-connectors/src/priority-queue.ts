export type RequestPriority = "critical" | "high" | "normal" | "low";

const PRIORITY_ORDER: Record<RequestPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export interface PrioritizedTask<T> {
  readonly priority: RequestPriority;
  readonly run: () => Promise<T>;
}

/**
 * Minimal priority queue for outbound platform work (Task 1.3).
 * Higher priority tasks are scheduled first when using {@link drainNext}.
 */
export class RequestPriorityQueue<T> {
  private readonly queue: PrioritizedTask<T>[] = [];

  enqueue(task: PrioritizedTask<T>): void {
    this.queue.push(task);
    this.queue.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }

  depth(): number {
    return this.queue.length;
  }

  async drainNext(): Promise<T | undefined> {
    const next = this.queue.shift();
    if (!next) {
      return undefined;
    }
    return next.run();
  }

  clear(): void {
    this.queue.length = 0;
  }
}
