import { NextResponse } from "next/server";

/**
 * Readiness probe for the web shell (Phase 0). Extend with dependency checks when API/DB are wired.
 */
export function GET() {
  return NextResponse.json({
    status: "ready",
    service: "web",
  });
}
