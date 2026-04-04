import { NextResponse } from "next/server";

import { getSharedAdapterInfrastructure } from "@/lib/adapter-infrastructure";

export async function GET() {
  const infra = getSharedAdapterInfrastructure();
  const infrastructure = await infra.getHealth();
  const degraded = infrastructure.status !== "ok";
  return NextResponse.json({
    status: degraded ? "degraded" : "ok",
    service: "web",
    infrastructure,
  });
}
