import type { MockAdapterScenario } from "@agenticverdict/data-connectors";
import type { FastifyRequest } from "fastify";

const SCENARIOS: readonly MockAdapterScenario[] = [
  "normal",
  "high-volume",
  "zero-conversions",
  "error",
] as const;

function headerString(headers: FastifyRequest["headers"], name: string): string | undefined {
  const v = headers[name];
  if (typeof v === "string") {
    return v;
  }
  if (Array.isArray(v) && v.length > 0 && typeof v[0] === "string") {
    return v[0];
  }
  return undefined;
}

export interface ParsedMockHeaders {
  readonly enabled: boolean;
  readonly tenantId: string;
  readonly scenario: MockAdapterScenario;
  readonly seed: number;
}

export function parseMockHeaders(headers: FastifyRequest["headers"]): ParsedMockHeaders {
  const mockMode = headerString(headers, "x-mock-mode");
  const enabled =
    mockMode === "true" ||
    mockMode === "1" ||
    (typeof mockMode === "string" && mockMode.toLowerCase() === "yes");

  const tenantRaw = headerString(headers, "x-tenant-id")?.trim() ?? "";
  const scenarioRaw = headerString(headers, "x-scenario")?.trim() ?? "normal";
  const scenario: MockAdapterScenario = SCENARIOS.includes(scenarioRaw as MockAdapterScenario)
    ? (scenarioRaw as MockAdapterScenario)
    : "normal";

  const seedRaw = headerString(headers, "x-seed");
  const parsedSeed = seedRaw !== undefined ? Number.parseInt(seedRaw, 10) : 42_001;
  const seed = Number.isFinite(parsedSeed) ? parsedSeed : 42_001;

  return {
    enabled,
    tenantId: tenantRaw,
    scenario,
    seed,
  };
}
