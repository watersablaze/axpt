import {
  NextResponse,
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
 * Legacy authenticated adapter.
 *
 * This boundary intentionally does not consume the governing
 * invitation cookie. Public invitation submission is confined
 * to the canonical French-Ward path.
 */
export async function POST(
  request: Request,
) {
  if (
    !isSameOriginMutation(
      request,
    )
  ) {
    return denied();
  }

  const principal =
    await getPrincipal();

  if (!principal) {
    return denied();
  }

  const access =
    await resolveFrenchWardCommercialIntakeRequestAccessWithClient({
      client:
        prisma,

      principal: {
        userId:
          principal.userId,

        email:
          principal.email,

        displayName:
          principal.displayName,
      },

      credential:
        null,

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

      grantId:
        access.grantId,
    },
  );
}
