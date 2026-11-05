import {
  NextResponse,
  type NextRequest,
} from "next/server";

import {
  getPrincipal,
} from "@/domains/auth/getPrincipal";

import {
  isSameOriginMutation,
} from "@/domains/auth/isSameOriginMutation";

import {
  prisma,
} from "@/infrastructure/db/prisma";

import {
  FRENCH_WARD_LOI_ACCESS_COOKIE,
} from "@/domains/institutions/french-ward/commercial/loiInvitationCredential";

import {
  resolveFrenchWardCommercialIntakeRequestAccessWithClient,
} from "@/domains/institutions/french-ward/commercial/resolveFrenchWardCommercialIntakeRequestAccessWithClient";

import {
  submitFrenchWardCommercialIntakeWithAccess,
} from "@/domains/institutions/french-ward/commercial/submitFrenchWardCommercialIntakeWithAccess";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

function denied() {
  return NextResponse.json(
    {
      ok:
        false,

      error:
        "Commercial intake access is required.",
    },
    {
      status:
        403,

      headers: {
        "Cache-Control":
          "private, no-store, max-age=0",

        "Referrer-Policy":
          "no-referrer",

        "X-Content-Type-Options":
          "nosniff",
      },
    },
  );
}

/**
 * Canonical French-Ward commercial-intake mutation boundary.
 *
 * Access may derive from:
 * - an authenticated AXPT principal holding Institutional Access; or
 * - the exact governing LOI credential stored in the scoped HttpOnly
 *   cookie established by the public invitation exchange.
 *
 * The request body never supplies actor identity, grant identity,
 * invitation identity, or access authority.
 */
export async function POST(
  request: NextRequest,
) {
  /*
   * Origin is rejected before principal, credential, or database
   * access resolution.
   */
  if (
    !isSameOriginMutation(
      request,
    )
  ) {
    return denied();
  }

  const principal =
    await getPrincipal();

  const credential =
    request.cookies.get(
      FRENCH_WARD_LOI_ACCESS_COOKIE,
    )?.value ??
    null;

  const access =
    await resolveFrenchWardCommercialIntakeRequestAccessWithClient({
      client:
        prisma,

      principal:
        principal
          ? {
              userId:
                principal.userId,

              email:
                principal.email,

              displayName:
                principal.displayName,
            }
          : null,

      credential,

      action:
        "SUBMIT_INTAKE",
    });

  if (!access.allowed) {
    return denied();
  }

  return submitFrenchWardCommercialIntakeWithAccess(
    request,
    {
      identity:
        access.identity,

      /*
       * Exact grant selection is server-owned for both paths.
       * It is mandatory in practice for governing invitation access.
       */
      grantId:
        access.grantId,
    },
  );
}
