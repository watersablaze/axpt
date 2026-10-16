import { NextResponse } from "next/server";
import { z } from "zod";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";

import { reissueRepresentativeOnboardingAccess } from "@/domains/instruments/representative-program/onboarding/application/reissueRepresentativeOnboardingAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    intakeId: string;
  }>;
};

const requestSchema = z
  .object({
    accessDurationDays: z.coerce.number().int().min(1).max(30).default(7),
  })
  .strict();

function response(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export async function POST(request: Request, context: RouteContext) {
  const principal = await getPrincipal();

  if (!principal) {
    return response(
      {
        ok: false,
        error: "UNAUTHORIZED",
      },
      401,
    );
  }

  if (!isAdmin(principal)) {
    return response(
      {
        ok: false,
        error: "FORBIDDEN",
      },
      403,
    );
  }

  const { intakeId } = await context.params;

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return response(
      {
        ok: false,
        error: "INVALID_JSON",
      },
      400,
    );
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return response(
      {
        ok: false,
        error: "INVALID_ACCESS_REISSUE_REQUEST",
        issues: parsed.error.flatten().fieldErrors,
      },
      400,
    );
  }

  const issuedAt = new Date();

  const accessExpiresAt = new Date(
    issuedAt.getTime() + parsed.data.accessDurationDays * 24 * 60 * 60 * 1000,
  );

  try {
    const result = await reissueRepresentativeOnboardingAccess({
      intakeId,
      accessExpiresAt,
      issuedAt,
    });

    const accessUrl = new URL(
      `/french-ward/representative-program/onboarding/access/${encodeURIComponent(
        result.rawAccessToken,
      )}`,
      request.url,
    ).toString();

    return response({
      ok: true,
      access: {
        intakeId: result.intake.id,
        reference: result.intake.reference,
        status: result.intake.status,
        accessIssuedAt: result.intake.accessIssuedAt,
        accessExpiresAt: result.intake.accessExpiresAt,
        accessUrl,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "REPRESENTATIVE_ACCESS_REISSUE_FAILED";

    console.error("[ARP_REPRESENTATIVE_ACCESS_REISSUE_FAILED]", error);

    const status =
      message === "[ARP_ONBOARDING_INTAKE_NOT_FOUND]"
        ? 404
        : message.includes("ARP_ONBOARDING_ACCESS_REISSUE_STATUS_INVALID")
          ? 409
          : 500;

    return response(
      {
        ok: false,
        error:
          status === 500 ? "REPRESENTATIVE_ACCESS_REISSUE_FAILED" : message,
      },
      status,
    );
  }
}
