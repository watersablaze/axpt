import { NextResponse } from "next/server";
import { z } from "zod";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { bindRepresentativeMasterAgreement } from "@/domains/instruments/representative-program/onboarding/commands/bindRepresentativeMasterAgreement";
import { prisma } from "@/infrastructure/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  intakeId: z.string().trim().min(1).max(191),
  instrumentReference: z.string().trim()
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/),
}).strict();

function jsonNoStore(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: Request) {
  const principal = await getPrincipal();
  if (!principal) {
    return jsonNoStore({ ok: false, error: "UNAUTHORIZED" }, 401);
  }
  if (!isAdmin(principal)) {
    return jsonNoStore({ ok: false, error: "FORBIDDEN" }, 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ ok: false, error: "INVALID_JSON" }, 400);
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore(
      { ok: false, error: "INVALID_MASTER_AGREEMENT_BINDING_REQUEST" },
      400,
    );
  }

  try {
    const result = await bindRepresentativeMasterAgreement({
      client: prisma,
      intakeId: parsed.data.intakeId,
      instrumentReference: parsed.data.instrumentReference,
      actorUserId: principal.userId,
    });

    return jsonNoStore({
      ok: true,
      binding: {
        intakeId: result.intakeId,
        participantId: result.participantId,
        instrumentId: result.instrumentId,
        bound: result.bound,
      },
    }, 200);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("ARP_MASTER_AGREEMENT_ADMIN_REQUIRED")) {
        return jsonNoStore({ ok: false, error: "FORBIDDEN" }, 403);
      }
      if (error.message.includes("ARP_MASTER_AGREEMENT_INTAKE_NOT_FOUND")) {
        return jsonNoStore(
          { ok: false, error: "INTAKE_NOT_FOUND" },
          404,
        );
      }
      if (error.message.includes("ARP_MASTER_AGREEMENT_INSTRUMENT_REQUIRED")) {
        return jsonNoStore(
          { ok: false, error: "MASTER_AGREEMENT_NOT_FOUND" },
          404,
        );
      }
      if (error.message.startsWith("[ARP_MASTER_AGREEMENT_")) {
        return jsonNoStore(
          { ok: false, error: "MASTER_AGREEMENT_BINDING_CONFLICT" },
          409,
        );
      }
    }

    console.error("[ARP_MASTER_AGREEMENT_BINDING_ROUTE_FAILED]", error);
    return jsonNoStore(
      { ok: false, error: "MASTER_AGREEMENT_BINDING_FAILED" },
      500,
    );
  }
}
