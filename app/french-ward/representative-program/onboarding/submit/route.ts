import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { REPRESENTATIVE_ONBOARDING_ACCESS_COOKIE } from "@/domains/instruments/representative-program/onboarding/accessCookie";
import { submitRepresentativeOnboardingCandidate } from "@/domains/instruments/representative-program/onboarding/application/submitRepresentativeOnboardingCandidate";
import { representativeCandidateSubmissionSchema } from "@/domains/instruments/representative-program/onboarding/http/candidateSubmissionSchema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Referrer-Policy": "no-referrer",
    },
  });
}

export async function POST(request: Request) {
  const rawAccessToken = (await cookies()).get(
    REPRESENTATIVE_ONBOARDING_ACCESS_COOKIE,
  )?.value;

  if (!rawAccessToken) {
    return response(
      {
        ok: false,
        error: "CANDIDATE_ACCESS_REQUIRED",
      },
      401,
    );
  }

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

  const parsed = representativeCandidateSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return response(
      {
        ok: false,
        error: "INVALID_CANDIDATE_SUBMISSION",
        issues: parsed.error.flatten(),
      },
      400,
    );
  }

  try {
    const result = await submitRepresentativeOnboardingCandidate({
      rawAccessToken,
      submission: parsed.data,
    });

    return response({
      ok: true,
      result: {
        reference: result.intake.reference,
        status: result.intake.status,
        submittedAt: result.intake.submittedAt,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "REPRESENTATIVE_ONBOARDING_SUBMISSION_FAILED";

    console.error("[ARP_CANDIDATE_SUBMISSION_FAILED]", error);

    const status =
      message === "[ARP_ONBOARDING_CANDIDATE_ACCESS_DENIED]"
        ? 401
        : message.includes("STATUS_TRANSITION_INVALID") ||
            message.includes("STATUS_NOOP")
          ? 409
          : 500;

    return response(
      {
        ok: false,
        error:
          status === 500
            ? "REPRESENTATIVE_ONBOARDING_SUBMISSION_FAILED"
            : message,
      },
      status,
    );
  }
}
