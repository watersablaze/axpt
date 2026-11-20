import {
  NextResponse,
} from "next/server";

import {
  PERMISSIONS,
} from "@/domains/auth/permissions";

import {
  requirePermission,
} from "@/domains/auth/requirePermission";

import {
  getProgramCapitalReceiptVerificationHttp,
  PROGRAM_CAPITAL_RECEIPT_VERIFICATION_HTTP_STATE,
} from "@/domains/control-center/treasury/getProgramCapitalReceiptVerificationHttp";

import {
  prisma,
} from "@/infrastructure/db/prisma";

type RouteContext =
  Readonly<{
    params:
      Promise<{
        receiptId:
          string;
      }>;
  }>;

export async function GET(
  _request:
    Request,

  context:
    RouteContext,
) {
  try {
    await requirePermission(
      PERMISSIONS.TREASURY_READ,
    );
  } catch (
    error:
      unknown
  ) {
    if (
      error instanceof Error &&
      error.message ===
        "Authentication required"
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          state:
            PROGRAM_CAPITAL_RECEIPT_VERIFICATION_HTTP_STATE.UNAUTHENTICATED,

          error:
            "UNAUTHORIZED",
        },

        {
          status:
            401,
        },
      );
    }

    if (
      error instanceof Error &&
      error.message ===
        `MISSING_PERMISSION:${PERMISSIONS.TREASURY_READ}`
    ) {
      return NextResponse.json(
        {
          ok:
            false,

          state:
            PROGRAM_CAPITAL_RECEIPT_VERIFICATION_HTTP_STATE.PERMISSION_DENIED,

          error:
            "FORBIDDEN",
        },

        {
          status:
            403,
        },
      );
    }

    throw error;
  }

  const {
    receiptId,
  } =
    await context.params;

  const result =
    await getProgramCapitalReceiptVerificationHttp({
      rawReceiptId:
        receiptId,

      prisma,
    });

  return NextResponse.json(
    result.body,

    {
      status:
        result.status,
    },
  );
}
