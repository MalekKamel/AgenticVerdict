export type AgentLifecycleState = "idle" | "running" | "stopped";

export interface AgentLifecycle {
  getState(): AgentLifecycleState;
  start(): void;
  /**
   * Reject new executions ({@link beginExecution} throws). In-flight work may finish.
   */
  stop(): void;
  /** Resolves when {@link endExecution} has balanced every {@link beginExecution}. */
  drain(): Promise<void>;
  beginExecution(): void;
  endExecution(): void;
}

/**
 * Worker lifecycle gate: stop/drain semantics for API and background workers.
 */
export class AgentLifecycleController implements AgentLifecycle {
  private state: AgentLifecycleState = "idle";
  private inFlight = 0;
  private drainResolvers: Array<() => void> = [];

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

  beginExecution(): void {
    if (this.state === "stopped") {
      throw new Error("Agent lifecycle is stopped; refusing new executions");
    }
    if (this.state === "idle") {
      this.state = "running";
    }
    this.inFlight += 1;
  }

  endExecution(): void {
    if (this.inFlight > 0) {
      this.inFlight -= 1;
    }
    if (this.inFlight === 0) {
      const waiters = this.drainResolvers;
      this.drainResolvers = [];
      for (const resolve of waiters) {
        resolve();
      }
    }
  }

  async drain(): Promise<void> {
    if (this.inFlight === 0) {
      return;
    }
    await new Promise<void>((resolve) => {
      this.drainResolvers.push(resolve);
    });
  }
}
