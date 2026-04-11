import type { ConnectorType } from "@agenticverdict/types";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getSharedAdapterInfrastructure } from "@/lib/adapter-infrastructure";

const platformSchema = z.enum(["meta", "ga4", "gsc", "gbp", "tiktok"]);

export async function GET(_request: Request, context: { params: Promise<{ platform: string }> }) {
  const { platform: raw } = await context.params;
  const parsed = platformSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "unknown_platform" }, { status: 400 });
  }
  const platform = parsed.data as ConnectorType;
  const infra = getSharedAdapterInfrastructure();
  const report = await infra.getHealth();
  const row = report.connectors.find((p) => p.connector === platform);
  if (!row) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(row);
}
