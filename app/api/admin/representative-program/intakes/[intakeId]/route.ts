import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(
  _request: Request,
  context: { params: Promise<{ intakeId: string }> },
) {
  const principal = await getPrincipal();
  if (!principal) {
    return jsonNoStore({ ok: false, error: "UNAUTHORIZED" }, 401);
  }
  if (!isAdmin(principal)) {
    return jsonNoStore({ ok: false, error: "FORBIDDEN" }, 403);
  }

  const { intakeId } = await context.params;
  if (!intakeId || intakeId.length > 191) {
    return jsonNoStore({ ok: false, error: "INVALID_INTAKE_ID" }, 400);
  }

  try {
    const actor = await prisma.user.findUnique({
      where: { id: principal.userId },
      select: { isAdmin: true },
    });
    if (!actor?.isAdmin) {
      return jsonNoStore({ ok: false, error: "FORBIDDEN" }, 403);
    }

    const intake = await prisma.representativeOnboardingIntake.findUnique({
      where: { id: intakeId },
      select: {
        id: true,
        reference: true,
        candidateDisplayName: true,
        candidateEmail: true,
        status: true,
        qualificationDecision: true,
        submission: true,
        internalNotes: true,
        submittedAt: true,
        reviewStartedAt: true,
        qualifiedAt: true,
        admittedAt: true,
        admittedParticipantId: true,
        masterAgreementInstrumentId: true,
      },
    });

    if (!intake) {
      return jsonNoStore({ ok: false, error: "INTAKE_NOT_FOUND" }, 404);
    }

    const communications =
      await prisma.emailLog.findMany({
        where: {
          OR: [
            {
              type: {
                startsWith:
                  `ARP_ONBOARDING_INVITATION_${intake.id}_`,
              },
            },
            {
              type: {
                startsWith:
                  `ARP_ONBOARDING_SUBMISSION_RECEIPT_${intake.id}_`,
              },
            },
          ],
        },
        select: {
          id: true,
          type: true,
          from: true,
          to: true,
          subject: true,
          messageId: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 20,
      });

    return jsonNoStore(
      {
        ok: true,
        intake: {
          ...intake,
          communications,
        },
      },
      200,
    );
  } catch (error) {
    console.error("[ARP_ADMIN_INTAKE_LOAD_FAILED]", error);
    return jsonNoStore(
      { ok: false, error: "INTAKE_LOAD_FAILED" },
      500,
    );
  }
}
