import { NextResponse } from "next/server";

import {
  institutionalInstrumentAccessCookieName,
} from "@/domains/instruments/access/accessToken";
import {
  resolveInstitutionalInstrumentAccessWithClient,
} from "@/domains/instruments/queries/resolveInstitutionalInstrumentAccessWithClient";
import {
  runInstrumentGovernanceTransaction,
} from "@/domains/instruments/governance/runInstrumentGovernanceTransaction";
import { prisma } from "@/infrastructure/db/prisma";
import { getGlobalMotherPrincipal, resolveGlobalMotherRecipient, recipientCookieOptions } from "@/domains/instruments/access/globalMotherRecipientAuth";
import { GM_PENDING_COOKIE } from "@/domains/instruments/access/globalMotherRecipientPolicy";

const GM_REFERENCE =
  "GM-KENYA-RCF-001";

const GM_ROUTE =
  "/french-ward/instruments/gm-kenya";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
) {
  const { token } =
    await context.params;

  const normalizedToken =
    token.trim();

  if (!normalizedToken) {
    return new NextResponse(
      null,
      {
        status: 404,
      },
    );
  }

  const principal = await getGlobalMotherPrincipal();

  const inspected = await resolveInstitutionalInstrumentAccessWithClient({
    client: prisma, instrumentReference: GM_REFERENCE,
    token: normalizedToken, recordAccess: false,
  });
  if (!inspected) return new NextResponse(null, { status: 404 });
  if (inspected.grant.instrumentVersionId) {
    const recipient = await resolveGlobalMotherRecipient(prisma, normalizedToken);
    if (!recipient) return new NextResponse(null, { status: 404 });
    if (!principal || principal.userId !== inspected.grant.recipientUserId) {
      const response = NextResponse.redirect(new URL(`${GM_ROUTE}/verify`, request.url), 303);
      response.headers.set("Cache-Control", "no-store");
      response.headers.set("Referrer-Policy", "no-referrer");
      response.cookies.set(GM_PENDING_COOKIE, normalizedToken, {
        ...recipientCookieOptions, maxAge: 20 * 60,
      });
      return response;
    }
  }

  const access =
    await runInstrumentGovernanceTransaction(
      prisma,
      async (tx) => {
        return resolveInstitutionalInstrumentAccessWithClient({
          client:
            tx,
          instrumentReference:
            GM_REFERENCE,
          token:
            normalizedToken,
          recordAccess:
            true,
        });
      },
    );

  if (!access) {
    return new NextResponse(
      null,
      {
        status: 404,
      },
    );
  }

  const destination =
    new URL(
      GM_ROUTE,
      request.url,
    );

  const response =
    NextResponse.redirect(
      destination,
      303,
    );

  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.cookies.set({
    name:
      institutionalInstrumentAccessCookieName(
        GM_REFERENCE,
      ),
    value:
      normalizedToken,
    httpOnly:
      true,
    secure:
      process.env.NODE_ENV ===
      "production",
    sameSite:
      "lax",
    path:
      GM_ROUTE,
    expires:
      access.grant.expiresAt ??
      undefined,
  });

  return response;
}
