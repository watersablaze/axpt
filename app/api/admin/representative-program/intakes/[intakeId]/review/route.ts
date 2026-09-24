import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { beginRepresentativeOnboardingReview } from "@/domains/instruments/representative-program/onboarding";
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

export async function POST(
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
  if (!intakeId?.trim() || intakeId.length > 191) {
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

    const result = await beginRepresentativeOnboardingReview({
      client: prisma,
      intakeId,
      actorUserId: principal.userId,
    });

    return jsonNoStore({
      ok: true,
      intake: {
        id: result.intake.id,
        status: result.intake.status,
        reviewStartedAt: result.intake.reviewStartedAt,
      },
      transitionId: result.transition.id,
    }, 200);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("ARP_ONBOARDING_INTAKE_NOT_FOUND")
    ) {
      return jsonNoStore({ ok: false, error: "INTAKE_NOT_FOUND" }, 404);
    }
    if (
      error instanceof Error &&
      (
        error.message.includes("ARP_ONBOARDING_STATUS_") ||
        error.message.includes("ARP_ONBOARDING_TRANSITION_CONCURRENT_CHANGE")
      )
    ) {
      return jsonNoStore({ ok: false, error: "REVIEW_STATE_CONFLICT" }, 409);
    }

    console.error("[ARP_ADMIN_REVIEW_START_FAILED]", error);
    return jsonNoStore({ ok: false, error: "REVIEW_START_FAILED" }, 500);
  }
}
