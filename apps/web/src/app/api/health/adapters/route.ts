import { isMockEnabledForPlatform, platformAdapterTypes } from "@agenticverdict/platform-adapters";
import { NextResponse } from "next/server";

import { getSharedAdapterInfrastructure } from "@/lib/adapter-infrastructure";

/**
 * Aggregated adapter infrastructure health (cache, Redis, DLQ, per-platform scores).
 */
export async function GET() {
  const infra = getSharedAdapterInfrastructure();
  const body = await infra.getHealth();
  const mockPlatforms = platformAdapterTypes.filter((platform) =>
    isMockEnabledForPlatform(platform),
  );
  const withMockMetadata = {
    ...body,
    mockMode: mockPlatforms.length > 0,
    mockPlatforms,
    platforms: body.platforms.map((platform) => ({
      ...platform,
      adapterType: mockPlatforms.includes(platform.platform) ? "mock" : "production",
    })),
  };
  const status = body.status === "ok" ? 200 : 503;
  return NextResponse.json(withMockMetadata, { status });
}
