import { NextResponse } from "next/server";
import { z } from "zod";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prepareRepresentativeMasterAgreement } from "@/domains/instruments/representative-program/onboarding/commands/prepareRepresentativeMasterAgreement";
import { prisma } from "@/infrastructure/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  reference: z.string().trim()
    .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/),
  title: z.string().trim().min(1).max(300),
  candidateDisplayName: z.string().trim().min(1).max(200),
  candidateEmail: z.string().trim().email().max(320),
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
      { ok: false, error: "INVALID_MASTER_AGREEMENT_REQUEST" },
      400,
    );
  }

  try {
    const result = await prepareRepresentativeMasterAgreement({
      client: prisma,
      ...parsed.data,
      actorUserId: principal.userId,
    });

    return jsonNoStore({
      ok: true,
      agreement: {
        instrumentId: result.instrumentId,
        reference: result.reference,
        created: result.created,
      },
    }, 200);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("ARP_MASTER_AGREEMENT_ADMIN_REQUIRED")
    ) {
      return jsonNoStore({ ok: false, error: "FORBIDDEN" }, 403);
    }

    if (
      error instanceof Error &&
      error.message.includes("ARP_MASTER_AGREEMENT_REFERENCE_CONFLICT")
    ) {
      return jsonNoStore(
        { ok: false, error: "MASTER_AGREEMENT_REFERENCE_CONFLICT" },
        409,
      );
    }

    console.error("[ARP_MASTER_AGREEMENT_PREPARATION_FAILED]", error);
    return jsonNoStore(
      { ok: false, error: "MASTER_AGREEMENT_PREPARATION_FAILED" },
      500,
    );
  }
}
