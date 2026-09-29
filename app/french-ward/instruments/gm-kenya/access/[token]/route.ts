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
import { getPrincipal } from "@/domains/auth/getPrincipal";

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

  const principal = await getPrincipal();

  const inspected = await resolveInstitutionalInstrumentAccessWithClient({
    client: prisma, instrumentReference: GM_REFERENCE,
    token: normalizedToken, recordAccess: false,
  });
  if (!inspected || (inspected.grant.instrumentVersionId &&
      (!principal || principal.userId !== inspected.grant.recipientUserId))) {
    return new NextResponse(null, { status: 404 });
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
