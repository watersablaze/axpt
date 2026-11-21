import { NextResponse, type NextRequest } from "next/server";

import {
  REPRESENTATIVE_ONBOARDING_ACCESS_COOKIE,
  REPRESENTATIVE_ONBOARDING_PATH,
} from "@/domains/instruments/representative-program/onboarding/accessCookie";
import { loadRepresentativeOnboardingCandidate } from "@/domains/instruments/representative-program/onboarding/application/loadRepresentativeOnboardingCandidate";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: RouteContext) {
  const { token } = await context.params;

  const candidate = await loadRepresentativeOnboardingCandidate({
    rawAccessToken: token,
  });

  if (!candidate) {
    return NextResponse.json(
      {
        error: "Representative onboarding access is unavailable.",
      },
      {
        status: 404,
        headers: {
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        },
      },
    );
  }

  const destination = request.nextUrl.clone();
  destination.pathname = REPRESENTATIVE_ONBOARDING_PATH;
  destination.search = "";

  const response = NextResponse.redirect(destination, 303);

  const expiresAt =
    candidate.accessExpiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000);

  response.cookies.set(REPRESENTATIVE_ONBOARDING_ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: REPRESENTATIVE_ONBOARDING_PATH,
    expires: expiresAt,
  });

  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Referrer-Policy", "no-referrer");

  return response;
}
