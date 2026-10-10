import { NextResponse, type NextRequest } from "next/server";

import {
  instrumentAccessCookieName,
  institutionalInstrumentAccessCookieName,
} from "@/domains/instruments/access/accessToken";
import {
  getGlobalMotherPrincipal,
  recipientCookieOptions,
  resolveGlobalMotherRecipient,
} from "@/domains/instruments/access/globalMotherRecipientAuth";
import {
  GM_PENDING_COOKIE,
  GM_REFERENCE,
  GM_ROUTE,
} from "@/domains/instruments/access/globalMotherRecipientPolicy";
import {
  runInstrumentGovernanceTransaction,
} from "@/domains/instruments/governance/runInstrumentGovernanceTransaction";
import { resolveInstrumentAccess } from "@/domains/instruments/queries/resolveInstrumentAccess";
import {
  resolveInstitutionalInstrumentAccessWithClient,
} from "@/domains/instruments/queries/resolveInstitutionalInstrumentAccessWithClient";
import { prisma } from "@/infrastructure/db/prisma";

type RouteContext = {
  params: Promise<{ publicId: string; token: string }>;
};

async function handleGlobalMotherAccess(request: NextRequest, token: string) {
  const normalizedToken = token.trim();

  if (!normalizedToken) {
    return new NextResponse(null, { status: 404 });
  }

  const principal = await getGlobalMotherPrincipal();

  const inspected = await resolveInstitutionalInstrumentAccessWithClient({
    client: prisma,
    instrumentReference: GM_REFERENCE,
    token: normalizedToken,
    recordAccess: false,
  });

  if (!inspected) {
    return new NextResponse(null, { status: 404 });
  }

  if (inspected.grant.instrumentVersionId) {
    const recipient = await resolveGlobalMotherRecipient(prisma, normalizedToken);

    if (!recipient) {
      return new NextResponse(null, { status: 404 });
    }

    if (!principal || principal.userId !== inspected.grant.recipientUserId) {
      const response = NextResponse.redirect(
        new URL(`${GM_ROUTE}/verify`, request.url),
        303,
      );

      response.headers.set("Cache-Control", "no-store");
      response.headers.set("Referrer-Policy", "no-referrer");
      response.cookies.set(GM_PENDING_COOKIE, normalizedToken, {
        ...recipientCookieOptions,
        maxAge: 20 * 60,
      });

      return response;
    }
  }

  const access = await runInstrumentGovernanceTransaction(
    prisma,
    async (tx) =>
      resolveInstitutionalInstrumentAccessWithClient({
        client: tx,
        instrumentReference: GM_REFERENCE,
        token: normalizedToken,
        recordAccess: true,
      }),
  );

  if (!access) {
    return new NextResponse(null, { status: 404 });
  }

  const response = NextResponse.redirect(new URL(GM_ROUTE, request.url), 303);

  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.cookies.set({
    name: institutionalInstrumentAccessCookieName(GM_REFERENCE),
    value: normalizedToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: GM_ROUTE,
    expires: access.grant.expiresAt ?? undefined,
  });

  return response;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { publicId, token } = await context.params;

  /*
   * Next.js currently resolves /gm-kenya/access/[token] through this
   * dynamic route before the dedicated GM route. Preserve existing
   * private Chamber links by explicitly dispatching GM access through
   * the GM institutional access policy here.
   */
  if (publicId === "gm-kenya") {
    return handleGlobalMotherAccess(request, token);
  }

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
