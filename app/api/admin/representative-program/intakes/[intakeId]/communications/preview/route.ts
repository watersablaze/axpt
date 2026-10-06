import { NextResponse } from "next/server";
import { z } from "zod";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";

import {
  renderRepresentativeOnboardingInvitation,
} from "@/domains/instruments/representative-program/onboarding/communications/sendRepresentativeOnboardingInvitation";

import {
  renderRepresentativeOnboardingSubmissionReceipt,
} from "@/domains/instruments/representative-program/onboarding/communications/sendRepresentativeOnboardingSubmissionReceipt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z
  .object({
    type: z.enum([
      "INVITATION",
      "SUBMISSION_RECEIPT",
    ]),
  })
  .strict();

function reply(
  body: unknown,
  status = 200,
) {
  return NextResponse.json(
    body,
    {
      status,
      headers: {
        "Cache-Control":
          "private, no-store, max-age=0",
        "Referrer-Policy":
          "no-referrer",
      },
    },
  );
}

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      intakeId: string;
    }>;
  },
) {
  if (
    request.headers.get("origin") !==
    new URL(request.url).origin
  ) {
    return reply(
      {
        ok: false,
        error: "ORIGIN_REQUIRED",
      },
      403,
    );
  }

  const principal =
    await getPrincipal();

  if (
    !principal ||
    !isAdmin(principal)
  ) {
    return reply(
      {
        ok: false,
        error: "FORBIDDEN",
      },
      403,
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return reply(
      {
        ok: false,
        error: "INVALID_JSON",
      },
      400,
    );
  }

  const parsed =
    schema.safeParse(body);

  if (!parsed.success) {
    return reply(
      {
        ok: false,
        error:
          "INVALID_COMMUNICATION_PREVIEW_REQUEST",
      },
      400,
    );
  }

  const { intakeId } =
    await context.params;

  const intake =
    await prisma.representativeOnboardingIntake.findUnique({
      where: {
        id: intakeId,
      },
      select: {
        id: true,
        reference: true,
        candidateDisplayName: true,
        candidateEmail: true,
        status: true,
        submittedAt: true,
      },
    });

  if (!intake) {
    return reply(
      {
        ok: false,
        error: "INTAKE_NOT_FOUND",
      },
      404,
    );
  }

  if (
    parsed.data.type ===
    "SUBMISSION_RECEIPT"
  ) {
    if (!intake.submittedAt) {
      return reply(
        {
          ok: false,
          error:
            "SUBMISSION_RECEIPT_REQUIRES_SUBMISSION",
        },
        409,
      );
    }

    const rendered =
      renderRepresentativeOnboardingSubmissionReceipt({
        intakeId: intake.id,
        reference:
          intake.reference,
        candidateDisplayName:
          intake.candidateDisplayName,
        candidateEmail:
          intake.candidateEmail,
        submittedAt:
          intake.submittedAt,
      });

    return reply({
      ok: true,
      type:
        "SUBMISSION_RECEIPT",
      to:
        intake.candidateEmail,
      subject:
        rendered.subject,
      text:
        rendered.text,
      html:
        rendered.html,
    });
  }

  const rendered =
    renderRepresentativeOnboardingInvitation({
      intakeId:
        intake.id,
      reference:
        intake.reference,
      candidateDisplayName:
        intake.candidateDisplayName,
      candidateEmail:
        intake.candidateEmail,
      accessUrl:
        null,
    });

  return reply({
    ok: true,
    type:
      "INVITATION",
    to:
      intake.candidateEmail,
    subject:
      rendered.subject,
    text:
      rendered.text,
    html:
      rendered.html,
  });
}
