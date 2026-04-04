import type { PlatformType } from "@agenticverdict/types";

export interface DeadLetterRecord {
  readonly id: string;
  readonly platform: PlatformType;
  readonly operation: string;
  readonly errorMessage: string;
  readonly failedAt: number;
  readonly payloadSummary?: string;
}

export interface DeadLetterQueue {
  enqueue(record: Omit<DeadLetterRecord, "id" | "failedAt"> & { failedAt?: number }): void;
  list(): readonly DeadLetterRecord[];
  size(): number;
  clear(): void;
}

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Process-local DLQ for permanently failed adapter operations (AC-1.7.7).
 * Swap for BullMQ-backed persistence in production workers when available.
 */
export class InMemoryDeadLetterQueue implements DeadLetterQueue {
  private readonly maxEntries: number;
  private readonly entries: DeadLetterRecord[] = [];

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
  }

  enqueue(record: Omit<DeadLetterRecord, "id" | "failedAt"> & { failedAt?: number }): void {
    const entry: DeadLetterRecord = {
      id: randomId(),
      failedAt: record.failedAt ?? Date.now(),
      platform: record.platform,
      operation: record.operation,
      errorMessage: record.errorMessage,
      payloadSummary: record.payloadSummary,
    };
    this.entries.push(entry);
    while (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  list(): readonly DeadLetterRecord[] {
    return [...this.entries];
  }

  size(): number {
    return this.entries.length;
  }

  clear(): void {
    this.entries.length = 0;
  }
}
