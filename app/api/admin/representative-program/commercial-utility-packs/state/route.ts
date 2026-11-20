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
  loadCommercialUtilityPackOperatorState,
} from "@/domains/instruments/representative-program/commercial-utility-pack";

import {
  prisma,
} from "@/infrastructure/db/prisma";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

const querySchema =
  z
    .object({
      participantId:
        z
          .string()
          .trim()
          .min(1)
          .max(191),

      version:
        z
          .coerce
          .number()
          .int()
          .min(1)
          .max(999)
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

export async function GET(
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

  const url =
    new URL(
      request.url,
    );

  const rawQuery =
    Object.fromEntries(
      url.searchParams.entries(),
    );

  const parsed =
    querySchema.safeParse(
      rawQuery,
    );

  if (
    !parsed.success
  ) {
    return jsonNoStore(
      {
        ok:
          false,

        error:
          "INVALID_COMMERCIAL_UTILITY_PACK_STATE_REQUEST",
      },
      400,
    );
  }

  try {
    const state =
      await loadCommercialUtilityPackOperatorState({
        client:
          prisma,

        participantId:
          parsed.data.participantId,

        version:
          parsed.data.version,
      });

    return jsonNoStore(
      {
        ok:
          true,

        commercialUtilityPack:
          state,
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
          "CUP_OPERATOR_STATE_MODULE_REGISTRY_CONTRADICTION",
        ) ||
        error.message.includes(
          "CUP_OPERATOR_STATE_PARTICIPANT_CONTRADICTION",
        ) ||
        error.message.includes(
          "CUP_OPERATOR_STATE_MODULE_MISSING",
        )
      ) {
        console.error(
          "[ARP_CUP_OPERATOR_STATE_CONTRADICTION]",
          error,
        );

        return jsonNoStore(
          {
            ok:
              false,

            error:
              "COMMERCIAL_UTILITY_PACK_STATE_CONTRADICTION",
          },
          409,
        );
      }
    }

    console.error(
      "[ARP_CUP_OPERATOR_STATE_FAILED]",
      error,
    );

    return jsonNoStore(
      {
        ok:
          false,

        error:
          "COMMERCIAL_UTILITY_PACK_STATE_FAILED",
      },
      500,
    );
  }
}
