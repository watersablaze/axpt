import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Disabled diagnostic endpoint.
 * Database schema inspection must not be publicly exposed.
 *
 * BCM-3B.3E: fail closed for all environments.
 */
export async function GET() {
  return NextResponse.json(
    { ok: false },
    {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
