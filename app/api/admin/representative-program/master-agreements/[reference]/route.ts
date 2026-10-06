import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import {
  INSTITUTIONAL_INSTRUMENT_KIND,
  INSTRUMENT_EVIDENCE_SUBJECT,
  INSTRUMENT_EVIDENCE_TYPE,
} from "@/domains/instruments/contracts";
import { prisma } from "@/infrastructure/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonNoStore(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
    },
  });
}

function candidateEmail(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const value = (metadata as Record<string, unknown>).candidateEmail;
  return typeof value === "string" ? value.trim().toLowerCase() : null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ reference: string }> },
) {
  const principal = await getPrincipal();
  if (!principal) {
    return jsonNoStore({ ok: false, error: "UNAUTHORIZED" }, 401);
  }
  if (!isAdmin(principal)) {
    return jsonNoStore({ ok: false, error: "FORBIDDEN" }, 403);
  }

  const { reference } = await context.params;
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,100}$/.test(reference ?? "")) {
    return jsonNoStore({ ok: false, error: "INVALID_REFERENCE" }, 400);
  }

  try {
    const actor = await prisma.user.findUnique({
      where: { id: principal.userId },
      select: { isAdmin: true },
    });
    if (!actor?.isAdmin) {
      return jsonNoStore({ ok: false, error: "FORBIDDEN" }, 403);
    }

    const agreement = await prisma.institutionalInstrument.findUnique({
      where: { reference },
      select: {
        id: true,
        kind: true,
        status: true,
        evidence: {
          where: {
            evidenceType: INSTRUMENT_EVIDENCE_TYPE.ATTESTATION,
            subjectType: INSTRUMENT_EVIDENCE_SUBJECT.INSTRUMENT,
          },
          select: { metadata: true },
        },
      },
    });

    if (
      !agreement ||
      agreement.kind !==
        INSTITUTIONAL_INSTRUMENT_KIND.REPRESENTATIVE_PROGRAM_AGREEMENT
    ) {
      return jsonNoStore({ ok: false, error: "MASTER_AGREEMENT_NOT_FOUND" }, 404);
    }

    return jsonNoStore({
      ok: true,
      agreement: {
        instrumentId: agreement.id,
        reference,
        status: agreement.status,
        candidateEmail:
          agreement.evidence
            .map((item: { metadata: unknown }) => candidateEmail(item.metadata))
            .find((email: string | null) => email !== null) ?? null,
      },
    }, 200);
  } catch (error) {
    console.error("[ARP_ADMIN_AGREEMENT_LOAD_FAILED]", error);
    return jsonNoStore({ ok: false, error: "MASTER_AGREEMENT_LOAD_FAILED" }, 500);
  }
}
