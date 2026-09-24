import { NextResponse } from "next/server";
import { z } from "zod";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { bindRepresentativeMasterAgreementWithClient } from "@/domains/instruments/representative-program/onboarding";
import { admitRepresentativeOnboardingWithClient } from "@/domains/instruments/representative-program/onboarding/commands/admitRepresentativeOnboarding";
import { prisma } from "@/infrastructure/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  decision: z.literal("ADMIT_AND_BIND"),
  instrumentReference: z.string().trim().min(3).max(191),
}).strict();

type AdmissionBindingClient =
  Parameters<typeof admitRepresentativeOnboardingWithClient>[0]["client"] &
  Parameters<typeof bindRepresentativeMasterAgreementWithClient>[0]["client"];

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
  request: Request,
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonNoStore({ ok: false, error: "INVALID_JSON" }, 400);
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore({
      ok: false,
      error: "INVALID_ADMISSION_REQUEST",
      issues: parsed.error.flatten().fieldErrors,
    }, 400);
  }

  try {
    const actor = await prisma.user.findUnique({
      where: { id: principal.userId },
      select: { isAdmin: true },
    });
    if (!actor?.isAdmin) {
      return jsonNoStore({ ok: false, error: "FORBIDDEN" }, 403);
    }

    const result = await prisma.$transaction(
      async (tx: AdmissionBindingClient) => {
        const admission = await admitRepresentativeOnboardingWithClient({
          client: tx,
          intakeId,
          actorUserId: principal.userId,
        });

        const binding = await bindRepresentativeMasterAgreementWithClient({
          client: tx,
          intakeId,
          instrumentReference: parsed.data.instrumentReference,
          actorUserId: principal.userId,
        });

        return { admission, binding };
      },
    );

    return jsonNoStore({
      ok: true,
      intakeId: result.admission.intake.id,
      participant: {
        id: result.admission.participant.id,
        docketReference: result.admission.participant.docketReference,
        standing: result.admission.participant.standing,
        created: result.admission.created,
      },
      agreement: {
        instrumentId: result.binding.instrumentId,
        bound: result.binding.bound,
      },
    }, 200);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("ARP_MASTER_AGREEMENT_ADMIN_REQUIRED")) {
        return jsonNoStore({ ok: false, error: "FORBIDDEN" }, 403);
      }
      if (error.message.includes("ARP_ONBOARDING_ADMISSION_INTAKE_NOT_FOUND")) {
        return jsonNoStore({ ok: false, error: "INTAKE_NOT_FOUND" }, 404);
      }
      if (error.message.includes("ARP_MASTER_AGREEMENT_INSTRUMENT_REQUIRED")) {
        return jsonNoStore({ ok: false, error: "MASTER_AGREEMENT_NOT_FOUND" }, 404);
      }
      if (
        error.message.includes("ARP_ONBOARDING_ADMISSION_") ||
        error.message.includes("ARP_ONBOARDING_STATUS_") ||
        error.message.includes("ARP_ONBOARDING_TRANSITION_CONCURRENT_CHANGE") ||
        error.message.includes("ARP_MASTER_AGREEMENT_")
      ) {
        return jsonNoStore({ ok: false, error: "ADMISSION_CONFLICT" }, 409);
      }
    }

    if (
      error !== null &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return jsonNoStore({ ok: false, error: "ADMISSION_CONFLICT" }, 409);
    }

    console.error("[ARP_ADMIN_ADMISSION_FAILED]", error);
    return jsonNoStore({ ok: false, error: "ADMISSION_FAILED" }, 500);
  }
}
