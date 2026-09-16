import { NextResponse } from "next/server";

import { getPrincipal } from "@/domains/auth/getPrincipal";

import {
  reviewOpportunity,
} from "@/domains/control-center/opportunities/reviewOpportunity";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ReviewBody = {
  status?: string;
  note?: string | null;
};

export async function POST(
  request: Request,
  context: RouteContext,
) {
  const principal = await getPrincipal();

  if (!principal) {
    return NextResponse.json(
      {
        ok: false,
        error: "UNAUTHORIZED",
      },
      {
        status: 401,
      },
    );
  }

  const { id } = await context.params;
  const body =
    (await request.json()) as ReviewBody;

  if (typeof body.status !== "string") {
    return NextResponse.json(
      {
        ok: false,
        error: "STATUS_REQUIRED",
      },
      {
        status: 400,
      },
    );
  }

  try {
    const result = await reviewOpportunity({
      opportunityId: id,
      toStatus: body.status,
      actorEmail: principal.email,
      note: body.note,
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error(
      "[OPPORTUNITY_REVIEW_FAILED]",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "OPPORTUNITY_REVIEW_FAILED";

    const status =
      message === "OPPORTUNITY_NOT_FOUND"
        ? 404
        : message.startsWith(
              "OPPORTUNITY_REVIEW_TRANSITION_NOT_ALLOWED",
            ) ||
            message.startsWith(
              "OPPORTUNITY_REVIEW_STATUS_NOT_ALLOWED",
            ) ||
            message ===
              "PROMOTED_OPPORTUNITY_REVIEW_LOCKED"
          ? 409
          : 500;

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      {
        status,
      },
    );
  }
}
