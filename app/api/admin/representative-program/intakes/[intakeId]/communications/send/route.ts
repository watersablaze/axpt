import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { prisma } from "@/infrastructure/db/prisma";

import {
  reissueRepresentativeOnboardingAccess,
} from "@/domains/instruments/representative-program/onboarding/application/reissueRepresentativeOnboardingAccess";

import {
  sendRepresentativeOnboardingInvitation,
} from "@/domains/instruments/representative-program/onboarding/communications/sendRepresentativeOnboardingInvitation";

import {
  sendRepresentativeOnboardingSubmissionReceipt,
} from "@/domains/instruments/representative-program/onboarding/communications/sendRepresentativeOnboardingSubmissionReceipt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z
  .object({
    type: z.enum([
      "INVITATION",
      "SUBMISSION_RECEIPT",
    ]),
    accessDurationDays:
      z.coerce
        .number()
        .int()
        .min(1)
        .max(30)
        .default(7),
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
          "INVALID_COMMUNICATION_SEND_REQUEST",
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

    try {
      const delivery =
        await sendRepresentativeOnboardingSubmissionReceipt({
          intakeId:
            intake.id,
          reference:
            intake.reference,
          candidateDisplayName:
            intake.candidateDisplayName,
          candidateEmail:
            intake.candidateEmail,
          submittedAt:
            intake.submittedAt,
          deliveryKey:
            randomUUID(),
        });

      return reply({
        ok: true,
        type:
          "SUBMISSION_RECEIPT",
        delivery,
      });
    } catch (error) {
      console.error(
        "[ARP_ADMIN_SUBMISSION_RECEIPT_SEND_FAILED]",
        error,
      );

      return reply(
        {
          ok: false,
          error:
            "SUBMISSION_RECEIPT_SEND_FAILED",
        },
        500,
      );
    }
  }

  const eligible =
    intake.status === "DRAFT" ||
    intake.status ===
      "RETURNED_FOR_COMPLETION";

  if (!eligible) {
    return reply(
      {
        ok: false,
        error:
          `INVITATION_SEND_STATUS_INVALID:${intake.status}`,
      },
      409,
    );
  }

  const issuedAt =
    new Date();

  const accessExpiresAt =
    new Date(
      issuedAt.getTime() +
        parsed.data.accessDurationDays *
          24 *
          60 *
          60 *
          1000,
    );

  try {
    const reissued =
      await reissueRepresentativeOnboardingAccess({
        intakeId:
          intake.id,
        accessExpiresAt,
        issuedAt,
      });

    const accessUrl =
      new URL(
        `/french-ward/representative-program/onboarding/access/${encodeURIComponent(
          reissued.rawAccessToken,
        )}`,
        request.url,
      ).toString();

    try {
      const delivery =
        await sendRepresentativeOnboardingInvitation({
          intakeId:
            intake.id,
          reference:
            intake.reference,
          candidateDisplayName:
            intake.candidateDisplayName,
          candidateEmail:
            intake.candidateEmail,
          accessUrl,
          deliveryKey:
            randomUUID(),
        });

      return reply({
        ok: true,
        type:
          "INVITATION",
        accessExpiresAt:
          reissued.intake.accessExpiresAt,
        delivery,
      });
    } catch (deliveryError) {
      console.error(
        "[ARP_ADMIN_INVITATION_DELIVERY_FAILED]",
        deliveryError,
      );

      return reply(
        {
          ok: false,
          error:
            "INVITATION_SEND_FAILED_AFTER_ACCESS_ROTATION",
          recoveryAccessUrl:
            accessUrl,
          accessExpiresAt:
            reissued.intake.accessExpiresAt,
        },
        502,
      );
    }
  } catch (error) {
    console.error(
      "[ARP_ADMIN_INVITATION_SEND_FAILED]",
      error,
    );

    return reply(
      {
        ok: false,
        error:
          "INVITATION_ACCESS_ROTATION_FAILED",
      },
      500,
    );
  }
}
