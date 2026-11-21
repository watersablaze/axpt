import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrincipal } from "@/domains/auth/getPrincipal";
import { prisma } from "@/infrastructure/db/prisma";
import { loadRepresentativeCommercialUtilityPackResourceWithClient } from
  "@/domains/instruments/representative-program/commercial-utility-pack/application/loadRepresentativeCommercialUtilityPackResourceWithClient";
import { resolveRepresentativeCommercialUtilityPackConsumptionWithClient } from
  "@/domains/instruments/representative-program/commercial-utility-pack/application/resolveRepresentativeCommercialUtilityPackConsumptionWithClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["PRESENT", "TRANSMIT"]),
}).strict();

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

function json(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ resourceReleaseId: string }> },
) {
  const principal = await getPrincipal();
  if (!principal) return json({ ok: false }, 401);

  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return json({ ok: false }, 403);
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return json({ ok: false }, 400); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return json({ ok: false }, 400);

  const { resourceReleaseId } = await context.params;
  if (!resourceReleaseId || resourceReleaseId.length > 191) {
    return json({ ok: false }, 400);
  }

  try {
    const resource = await loadRepresentativeCommercialUtilityPackResourceWithClient({
      client: prisma,
      userId: principal.userId,
      resourceReleaseId,
    });
    if (!resource || resource.kind !== "INSTITUTIONAL_PROFILE" ||
        resource.content.reference !== "FW-PROFILE-2026-001") {
      return json({ ok: false }, 404);
    }

    const now = new Date();
    const appointments = await prisma.representativeProgramAppointment.findMany({
      where: {
        participant: { userId: principal.userId },
        instrument: { status: "ACTIVE" },
        effectiveAt: { lte: now },
        endedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { id: true },
      take: 2,
    });

    if (appointments.length !== 1) {
      return json({ ok: false, error: "ACTION_UNAVAILABLE" }, 403);
    }

    const decision =
      await resolveRepresentativeCommercialUtilityPackConsumptionWithClient({
        client: prisma,
        userId: principal.userId,
        resourceReleaseId,
        appointmentId: appointments[0].id,
        action: parsed.data.action,
        // Resource class is supplied by this handler, never by the browser.
        context: { documentClass: "FRENCH_WARD_INSTITUTIONAL_PROFILE" },
      });

    if (!decision.allowed) {
      return json({ ok: false, error: "ACTION_UNAVAILABLE" }, 403);
    }

    return json({
      ok: true,
      action: parsed.data.action,
      url: parsed.data.action === "PRESENT"
        ? "/representative/resources/" + encodeURIComponent(resourceReleaseId)
        : "https://www.axpt.io/french-ward/profile",
      evaluatedAt: decision.evaluatedAt,
    }, 200);
  } catch {
    console.error("[ARP_PROFILE_USE_FAILED]");
    return json({ ok: false, error: "ACTION_UNAVAILABLE" }, 503);
  }
}
