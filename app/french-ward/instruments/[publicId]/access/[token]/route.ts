import { NextResponse, type NextRequest } from "next/server";

import { instrumentAccessCookieName } from "@/domains/instruments/access/accessToken";
import { resolveInstrumentAccess } from "@/domains/instruments/queries/resolveInstrumentAccess";

type RouteContext = {
  params: Promise<{ publicId: string; token: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { publicId, token } = await context.params;
  const access = await resolveInstrumentAccess({
    publicId,
    token,
    recordAccess: true,
  });

  if (!access) {
    return NextResponse.json(
      { error: "Settlement instruction access is unavailable." },
      { status: 404 },
    );
  }

  const destination = request.nextUrl.clone();
  destination.pathname = `/french-ward/instruments/${publicId}`;
  destination.search = "";

  const response = NextResponse.redirect(destination, 303);
  const expiresAt =
    access.expiresAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000);

  response.cookies.set(instrumentAccessCookieName(publicId), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: `/french-ward/instruments/${publicId}`,
    expires: expiresAt,
  });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");

  return response;
}
