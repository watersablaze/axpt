import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { buildDonginEscrowResponseEmail } from "@/domains/instruments/communications/donginEscrowResponseEmail";

export async function POST() {
  const principal = await getPrincipal();

  if (!principal) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!principal.roles.includes("ADMIN_PLATFORM")) {
    return NextResponse.json({ ok: false, error: "ADMIN_PLATFORM_REQUIRED" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    result: buildDonginEscrowResponseEmail(),
  });
}
