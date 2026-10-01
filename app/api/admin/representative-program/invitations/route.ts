import { NextResponse } from "next/server";
import { z } from "zod";

import { getPrincipal } from "@/domains/auth/getPrincipal";
import { isAdmin } from "@/domains/auth/isAdmin";
import { issueRepresentativeOnboardingInvitation } from "@/domains/instruments/representative-program/onboarding/application/issueRepresentativeOnboardingInvitation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z
  .object({
    candidateDisplayName: z.string().trim().min(1).max(200),
    candidateEmail: z.string().trim().email().max(320),
    accessDurationDays: z.coerce.number().int().min(1).max(30).default(7),
  })
  .strict();

function jsonNoStore(
  body: unknown,
  init?: {
    status?: number;
  },
) {
  return NextResponse.json(body, {
    status: init?.status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export async function POST(request: Request) {
  const principal = await getPrincipal();

  if (!principal) {
    return jsonNoStore(
      {
        ok: false,
        error: "UNAUTHORIZED",
      },
      {
        status: 401,
      },
    );
  }

  if (!isAdmin(principal)) {
    return jsonNoStore(
      {
        ok: false,
        error: "FORBIDDEN",
      },
      {
        status: 403,
      },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonNoStore(
      {
        ok: false,
        error: "INVALID_JSON",
      },
      {
        status: 400,
      },
    );
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return jsonNoStore(
      {
        ok: false,
        error: "INVALID_INVITATION_REQUEST",
        issues: parsed.error.flatten().fieldErrors,
      },
      {
        status: 400,
      },
    );
  }

  const issuedAt = new Date();

  const accessExpiresAt = new Date(
    issuedAt.getTime() + parsed.data.accessDurationDays * 24 * 60 * 60 * 1000,
  );

  try {
    const result = await issueRepresentativeOnboardingInvitation({
      candidateDisplayName: parsed.data.candidateDisplayName,
      candidateEmail: parsed.data.candidateEmail,
      createdByUserId: principal.userId,
      accessExpiresAt,
      issuedAt,
    });

    const accessUrl = new URL(
      `/french-ward/representative-program/onboarding/access/${encodeURIComponent(
        result.rawAccessToken,
      )}`,
      request.url,
    ).toString();

    /**
     * Operator issuance response is intentionally narrow.
     *
     * Do not expose:
     * - accessTokenHash
     * - internalNotes
     * - creator internals
     * - qualification internals
     *
     * The raw token appears only as part of the one-time access URL.
     */
    return jsonNoStore({
      ok: true,
      invitation: {
        id: result.intake.id,
        reference: result.intake.reference,
        candidateDisplayName: result.intake.candidateDisplayName,
        candidateEmail: result.intake.candidateEmail,
        status: result.intake.status,
        accessIssuedAt: result.intake.accessIssuedAt,
        accessExpiresAt: result.intake.accessExpiresAt,
        accessUrl,
      },
    });
  } catch (error) {
    console.error("[ARP_REPRESENTATIVE_INVITATION_CREATE_FAILED]", error);

    return jsonNoStore(
      {
        ok: false,
        error: "REPRESENTATIVE_INVITATION_CREATE_FAILED",
      },
      {
        status: 500,
      },
    );
  }
}
