import {
  NextResponse,
} from "next/server";

import {
  isSameOriginMutation,
} from "@/domains/auth/isSameOriginMutation";

import {
  acceptFrenchWardInstitutionalInvitationWithClient,
} from "@/domains/institutions/french-ward/participants/invitations/acceptFrenchWardInstitutionalInvitationWithClient";

import {
  expiredFrenchWardInstitutionalInvitationCookieOptions,
  FRENCH_WARD_INSTITUTIONAL_INVITATION_COOKIE,
} from "@/domains/institutions/french-ward/participants/invitations/institutionalInvitationAccessCookie";

import {
  prisma,
} from "@/infrastructure/db/prisma";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

const ORIENTATION_PATH =
  "/french-ward/orientation";

function loginDestination(
  request: Request,
) {
  const next =
    encodeURIComponent(
      ORIENTATION_PATH,
    );

  return new URL(
    `/login?next=${next}`,
    request.url,
  );
}

function welcomeDestination(
  request: Request,
) {
  return new URL(
    "/french-ward/institutional/welcome",
    request.url,
  );
}

function clearInvitationCookie(
  response: NextResponse,
) {
  response.cookies.set(
    FRENCH_WARD_INSTITUTIONAL_INVITATION_COOKIE,
    "",
    expiredFrenchWardInstitutionalInvitationCookieOptions(),
  );

  return response;
}

export async function POST(
  request: Request,
) {
  /*
   * Acceptance is a recipient-held bearer mutation.
   * Cross-origin submission is never admitted.
   */
  if (
    !isSameOriginMutation(
      request,
    )
  ) {
    return new NextResponse(
      null,
      {
        status:
          403,
      },
    );
  }

  const cookieHeader =
    request.headers.get(
      "cookie",
    ) ?? "";

  const encodedName =
    `${FRENCH_WARD_INSTITUTIONAL_INVITATION_COOKIE}=`;

  const credential =
    cookieHeader
      .split(";")
      .map(
        part =>
          part.trim(),
      )
      .find(
        part =>
          part.startsWith(
            encodedName,
          ),
      )
      ?.slice(
        encodedName.length,
      ) ?? "";

  let decodedCredential =
    "";

  try {
    decodedCredential =
      decodeURIComponent(
        credential,
      ).trim();
  } catch {
    decodedCredential =
      "";
  }

  if (
    !decodedCredential
  ) {
    /*
     * No bearer remains to accept.
     * Clear any malformed residue and return to the bounded
     * institutional entry surface.
     */
    const response =
      NextResponse.redirect(
        welcomeDestination(
          request,
        ),
        303,
      );

    return clearInvitationCookie(
      response,
    );
  }

  try {
    await acceptFrenchWardInstitutionalInvitationWithClient({
      client:
        prisma,

      credential:
        decodedCredential,

      now:
        new Date(),
    });
  } catch {
    /*
     * Recipient-facing HTTP does not enumerate whether the credential
     * was invalid, revoked, expired, contradictory or otherwise unable
     * to complete acceptance.
     *
     * Durable state remains authoritative in the sealed domain command.
     */
    return new NextResponse(
      null,
      {
        status:
          409,
      },
    );
  }

  /*
   * Acceptance ends the bearer-invitation phase.
   *
   * Authentication remains separate and proceeds through the canonical
   * PIN/session entrance already established for institutional
   * participants.
   */
  const response =
    NextResponse.redirect(
      loginDestination(
        request,
      ),
      303,
    );

  return clearInvitationCookie(
    response,
  );
}
