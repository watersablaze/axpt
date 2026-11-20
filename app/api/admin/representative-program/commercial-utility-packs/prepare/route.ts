import {
  NextResponse,
} from "next/server";

import {
  z,
} from "zod";

import {
  getPrincipal,
} from "@/domains/auth/getPrincipal";

import {
  isAdmin,
} from "@/domains/auth/isAdmin";

import {
  prepareAndApplyCommercialUtilityPackComposition,
} from "@/domains/instruments/representative-program/commercial-utility-pack";

import {
  prisma,
} from "@/infrastructure/db/prisma";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

const requestSchema =
  z
    .object({
      participantId:
        z
          .string()
          .trim()
          .min(1)
          .max(191),

      sourceAuthorityInstrumentReference:
        z
          .string()
          .trim()
          .min(1)
          .max(191)
          .nullable()
          .optional(),
    })
    .strict();

function jsonNoStore(
  body:
    unknown,

  status:
    number,
) {
  return NextResponse.json(
    body,
    {
      status,

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

export async function POST(
  request:
    Request,
) {
  const principal =
    await getPrincipal();

  if (!principal) {
    return jsonNoStore(
      {
        ok:
          false,

        error:
          "UNAUTHORIZED",
      },
      401,
    );
  }

  if (
    !isAdmin(
      principal,
    )
  ) {
    return jsonNoStore(
      {
        ok:
          false,

        error:
          "FORBIDDEN",
      },
      403,
    );
  }

  let body:
    unknown;

  try {
    body =
      await request.json();
  } catch {
    return jsonNoStore(
      {
        ok:
          false,

        error:
          "INVALID_JSON",
      },
      400,
    );
  }

  const parsed =
    requestSchema.safeParse(
      body,
    );

  if (
    !parsed.success
  ) {
    return jsonNoStore(
      {
        ok:
          false,

        error:
          "INVALID_COMMERCIAL_UTILITY_PACK_PREPARATION_REQUEST",
      },
      400,
    );
  }

  try {
    const result =
      await prepareAndApplyCommercialUtilityPackComposition({
        client:
          prisma,

        participantId:
          parsed.data.participantId,

        actorUserId:
          principal.userId,

        sourceAuthorityInstrumentReference:
          parsed.data.sourceAuthorityInstrumentReference ??
          null,
      });

    /*
     * Operator response is deliberately narrower than the domain result.
     *
     * Do not leak the canonical composition plan or persistence internals.
     * The operator needs identity, preparation disposition, and current
     * readiness outcome.
     */
    return jsonNoStore(
      {
        ok:
          true,

        commercialUtilityPack: {
          id:
            result.package.id,

          reference:
            result.reference,

          created:
            result.packageCreated,

          participantId:
            result.composition.participantId,

          registeredResources:
            result.composition
              .registration
              .registered
              .length,

          unavailableSources:
            result.composition
              .registration
              .unavailableCount,

          eligibleModules:
            result.composition
              .eligibleModules,

          blockedModules:
            result.composition
              .blockedModules,

          release: {
            performed:
              false,
          },
        },
      },
      200,
    );
  } catch (error) {
    if (
      error instanceof
        Error
    ) {
      if (
        error.message.includes(
          "CUP_CREATION_ADMIN_REQUIRED",
        )
      ) {
        return jsonNoStore(
          {
            ok:
              false,

            error:
              "FORBIDDEN",
          },
          403,
        );
      }

      if (
        error.message.includes(
          "CUP_CREATION_PARTICIPANT_NOT_FOUND",
        )
      ) {
        return jsonNoStore(
          {
            ok:
              false,

            error:
              "PARTICIPANT_NOT_FOUND",
          },
          404,
        );
      }

      if (
        error.message.includes(
          "CUP_CREATION_PARTICIPANT_TERMINAL",
        )
      ) {
        return jsonNoStore(
          {
            ok:
              false,

            error:
              "PARTICIPANT_TERMINAL",
          },
          409,
        );
      }

      if (
        error.message.includes(
          "CUP_MASTER_AGREEMENT_BINDING_CONTRADICTION",
        )
      ) {
        return jsonNoStore(
          {
            ok:
              false,

            error:
              "MASTER_AGREEMENT_BINDING_CONTRADICTION",
          },
          409,
        );
      }

      if (
        error.message.includes(
          "CUP_MASTER_AGREEMENT_NOT_EXECUTED",
        )
      ) {
        return jsonNoStore(
          {
            ok:
              false,

            error:
              "MASTER_AGREEMENT_NOT_EXECUTED",
          },
          409,
        );
      }

      if (
        error.message.includes(
          "CUP_COMPOSITION_APPLICATION",
        ) ||
        error.message.includes(
          "CUP_COMPOSITION_REGISTRATION",
        ) ||
        error.message.includes(
          "CUP_READINESS",
        )
      ) {
        console.error(
          "[ARP_CUP_PREPARATION_CONFLICT]",
          error,
        );

        return jsonNoStore(
          {
            ok:
              false,

            error:
              "COMMERCIAL_UTILITY_PACK_PREPARATION_CONFLICT",
          },
          409,
        );
      }
    }

    console.error(
      "[ARP_CUP_PREPARATION_FAILED]",
      error,
    );

    return jsonNoStore(
      {
        ok:
          false,

        error:
          "COMMERCIAL_UTILITY_PACK_PREPARATION_FAILED",
      },
      500,
    );
  }
}
