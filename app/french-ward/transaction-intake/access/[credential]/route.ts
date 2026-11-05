import {
  NextResponse,
  type NextRequest,
} from "next/server";

import {
  FRENCH_WARD_LOI_ACCESS_COOKIE,
  FRENCH_WARD_LOI_ACCESS_PATH,
} from "@/domains/institutions/french-ward/commercial/loiInvitationCredential";

import {
  resolveFrenchWardLoiCredentialWithClient,
} from "@/domains/institutions/french-ward/commercial/resolveFrenchWardLoiCredentialWithClient";

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

function unavailable() {
  return NextResponse.json(
    {
      error:
        "This French-Ward invitation is unavailable.",
    },
    {
      status:
        404,

      headers: {
        "Cache-Control":
          "private, no-store, max-age=0",

        "Referrer-Policy":
          "no-referrer",
      },
    },
  );
}

/**
 * Public bearer exchange only.
 *
 * The URL credential is not itself commercial authority.
 * It identifies one invitation whose existing Institutional
 * Access grant must independently authorize VIEW_FORM.
 *
 * Successful exchange removes the credential from the URL
 * and places it in an HttpOnly cookie scoped only to the
 * canonical French-Ward commercial-intake surface.
 */
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
    normalizedCredential.length > 256
  ) {
    return unavailable();
  }

  const access =
    await resolveFrenchWardLoiCredentialWithClient({
      client:
        prisma,

      credential:
        normalizedCredential,

      action:
        "VIEW_FORM",
    });

  if (!access.allowed) {
    return unavailable();
  }

  const destination =
    request.nextUrl.clone();

  destination.pathname =
    FRENCH_WARD_LOI_ACCESS_PATH;

  /*
   * Strip the bearer secret and any accidental query data
   * before the recipient reaches the intake presentation.
   */
  destination.search =
    "";

  const response =
    NextResponse.redirect(
      destination,
      303,
    );

  response.cookies.set(
    FRENCH_WARD_LOI_ACCESS_COOKIE,
    normalizedCredential,
    {
      httpOnly:
        true,

      secure:
        process.env.NODE_ENV ===
        "production",

      sameSite:
        "lax",

      path:
        FRENCH_WARD_LOI_ACCESS_PATH,

      expires:
        access.expiresAt,
    },
  );

  response.headers.set(
    "Cache-Control",
    "private, no-store, max-age=0",
  );

  response.headers.set(
    "Referrer-Policy",
    "no-referrer",
  );

  return response;
}
