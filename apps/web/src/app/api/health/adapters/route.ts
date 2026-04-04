import { NextResponse } from "next/server";

import { getSharedAdapterInfrastructure } from "@/lib/adapter-infrastructure";

/**
 * Aggregated adapter infrastructure health (cache, Redis, DLQ, per-platform scores).
 */
export async function GET() {
  const infra = getSharedAdapterInfrastructure();
  const body = await infra.getHealth();
  const status = body.status === "ok" ? 200 : 503;
  return NextResponse.json(body, { status });
}
