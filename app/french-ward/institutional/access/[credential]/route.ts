import {
  NextResponse,
  type NextRequest,
} from "next/server";

import {
  FRENCH_WARD_INSTITUTIONAL_INVITATION_COOKIE,
  FRENCH_WARD_INSTITUTIONAL_WELCOME_PATH,
  frenchWardInstitutionalInvitationCookieOptions,
} from "@/domains/institutions/french-ward/participants/invitations/institutionalInvitationAccessCookie";

import {
  loadFrenchWardInstitutionalInvitationStateWithClient,
} from "@/domains/institutions/french-ward/participants/invitations/loadFrenchWardInstitutionalInvitationStateWithClient";

import {
  prisma,
} from "@/infrastructure/db/prisma";

type RouteContext = {
  params: Promise<{
    credential: string;
  }>;
};

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

const privateHeaders = {
  "Cache-Control":
    "private, no-store, max-age=0",

  "Referrer-Policy":
    "no-referrer",

  "X-Robots-Tag":
    "noindex, nofollow, noarchive",
};

function unavailable() {
  return NextResponse.json(
    {
      error:
        "Institutional invitation access is unavailable.",
    },
    {
      status:
        404,

      headers:
        privateHeaders,
    },
  );
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  const {
    credential,
  } =
    await context.params;

  const normalizedCredential =
    credential.trim();

  if (
    !normalizedCredential ||
    normalizedCredential.length >
      256
  ) {
    return unavailable();
  }

  let invitation:
    Awaited<
      ReturnType<
        typeof loadFrenchWardInstitutionalInvitationStateWithClient
      >
    >;

  try {
    invitation =
      await loadFrenchWardInstitutionalInvitationStateWithClient({
        client:
          prisma,

        credential:
          normalizedCredential,

        now:
          new Date(),
      });
  } catch (error) {
    console.error(
      "[fw/institutional/access] invitation-state lookup unavailable",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Institutional invitation access is temporarily unavailable.",
      },
      {
        status:
          503,

        headers:
          privateHeaders,
      },
    );
  }

  if (!invitation) {
    return unavailable();
  }

  /*
   * Acceptance ends the invitation-bearer phase.
   *
   * An already-recognized participant must not receive a fresh
   * invitation credential cookie. Re-entry proceeds directly
   * into canonical authentication and Orientation.
   */
  if (
    invitation.state ===
    "ACCEPTED"
  ) {
    const destination =
      request.nextUrl.clone();

    destination.pathname =
      "/login";

    destination.search =
      "?next=%2Ffrench-ward%2Forientation";

    destination.hash =
      "";

    const response =
      NextResponse.redirect(
        destination,
        303,
      );

    for (
      const [
        key,
        value,
      ] of Object.entries(
        privateHeaders,
      )
    ) {
      response.headers.set(
        key,
        value,
      );
    }

    return response;
  }

  if (
    invitation.state !==
    "PENDING"
  ) {
    return unavailable();
  }

  const destination =
    request.nextUrl.clone();

  destination.pathname =
    FRENCH_WARD_INSTITUTIONAL_WELCOME_PATH;

  destination.search =
    "";

  destination.hash =
    "";

  const response =
    NextResponse.redirect(
      destination,
      303,
    );

  response.cookies.set(
    FRENCH_WARD_INSTITUTIONAL_INVITATION_COOKIE,
    normalizedCredential,
    frenchWardInstitutionalInvitationCookieOptions(
      invitation.expiresAt,
    ),
  );

  for (
    const [
      key,
      value,
    ] of Object.entries(
      privateHeaders,
    )
  ) {
    response.headers.set(
      key,
      value,
    );
  }

  return response;
}
