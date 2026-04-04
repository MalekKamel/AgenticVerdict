export type AgentLifecycleState = "idle" | "running" | "stopped";

export interface AgentLifecycle {
  getState(): AgentLifecycleState;
  start(): void;
  stop(): void;
  /** Wait until in-flight work finishes (no-op stub counts as immediate). */
  drain(): Promise<void>;
}

/**
 * Minimal lifecycle gate for workers; extend in Phase 2 with real queues.
 */
export class AgentLifecycleController implements AgentLifecycle {
  private state: AgentLifecycleState = "idle";

  getState(): AgentLifecycleState {
    return this.state;
  }

  start(): void {
    if (this.state === "stopped") {
      throw new Error("Cannot start a stopped lifecycle");
    }
    this.state = "running";
  }

  stop(): void {
    this.state = "stopped";
  }

  async drain(): Promise<void> {
    if (this.state === "running") {
      this.state = "idle";
    }
  }
}
