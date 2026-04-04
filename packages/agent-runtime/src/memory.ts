import type { IMemory } from "./interfaces";

type MemoryTurn = { role: "user" | "assistant" | "system"; content: string };

export class InMemoryAgentMemory implements IMemory {
  private readonly turns: MemoryTurn[] = [];

  append(role: MemoryTurn["role"], content: string): void {
    this.turns.push({ role, content });
  }

  snapshot(): readonly MemoryTurn[] {
    return [...this.turns];
  }

  clear(): void {
    this.turns.length = 0;
  }
}
