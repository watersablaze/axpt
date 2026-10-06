import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { loadRepresentativeAppointmentOperatorState } from
  "@/domains/instruments/representative-program/application/representativeAppointmentAcceptance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: Request) {
  const principal = await getPrincipal();
  if (!principal) return json({ ok: false, error: "UNAUTHORIZED" }, 401);
  if (!isAdmin(principal)) return json({ ok: false, error: "FORBIDDEN" }, 403);

  const query = new URL(request.url).searchParams;
  const participantId = query.get("participantId")?.trim();
  if (
    !participantId ||
    participantId.length > 191 ||
    query.getAll("participantId").length !== 1 ||
    Array.from(query.keys()).some(key => key !== "participantId")
  ) return json({ ok: false, error: "INVALID_REQUEST" }, 400);

  try {
    const appointment = await loadRepresentativeAppointmentOperatorState({
      client: prisma,
      participantId,
    });
    return json({ ok: true, appointment }, 200);
  } catch {
    console.error("[ARP_APPOINTMENT_OPERATOR_STATE_FAILED]");
    return json({ ok: false, error: "APPOINTMENT_STATE_UNAVAILABLE" }, 503);
  }
}
