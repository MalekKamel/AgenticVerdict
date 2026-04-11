import { isMockEnabledForConnector, connectorAdapterTypes } from "@agenticverdict/data-connectors";
import { NextResponse } from "next/server";

import { getSharedAdapterInfrastructure } from "@/lib/adapter-infrastructure";

/**
 * Aggregated adapter infrastructure health (cache, Redis, DLQ, per-platform scores).
 */
export async function GET() {
  const infra = getSharedAdapterInfrastructure();
  const body = await infra.getHealth();
  const mockConnectors = connectorAdapterTypes.filter((connector) =>
    isMockEnabledForConnector(connector),
  );
  const withMockMetadata = {
    ...body,
    mockMode: mockConnectors.length > 0,
    mockConnectors,
    connectors: body.connectors.map((row) => ({
      ...row,
      adapterType: mockConnectors.includes(row.connector) ? "mock" : "production",
    })),
  };
  const status = body.status === "ok" ? 200 : 503;
  return NextResponse.json(withMockMetadata, { status });
}
