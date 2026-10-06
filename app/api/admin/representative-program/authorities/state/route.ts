import { NextResponse } from "next/server";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";
import { loadRepresentativeAuthorityRegister } from
  "@/domains/instruments/representative-program/application/loadRepresentativeAuthorityRegister";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function GET(request: Request) {
  const principal = await getPrincipal();
  if (!principal) return json({ ok: false }, 401);
  if (!isAdmin(principal)) return json({ ok: false }, 403);

  const query = new URL(request.url).searchParams;
  const appointmentId = query.get("appointmentId")?.trim();
  if (
    !appointmentId || appointmentId.length > 191 ||
    query.getAll("appointmentId").length !== 1 ||
    Array.from(query.keys()).some(key => key !== "appointmentId")
  ) return json({ ok: false }, 400);

  try {
    const appointment = await prisma.representativeProgramAppointment.findUnique({
      where: { id: appointmentId },
      select: { participant: { select: { userId: true } } },
    });
    if (!appointment?.participant.userId) return json({ ok: false }, 404);

    const register = await loadRepresentativeAuthorityRegister({
      client: prisma,
      appointmentId,
      userId: appointment.participant.userId,
    });
    if (!register) return json({ ok: false }, 404);
    return json({ ok: true, register }, 200);
  } catch {
    console.error("[ARP_AUTHORITY_REGISTER_READ_FAILED]");
    return json({ ok: false }, 503);
  }
}
