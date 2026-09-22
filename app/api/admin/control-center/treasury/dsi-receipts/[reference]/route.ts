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
  getDigitalSettlementRecognitionReceiptCandidateHttp,
} from "@/domains/control-center/treasury/getDigitalSettlementRecognitionReceiptCandidateHttp";

import {
  DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE,
} from "@/domains/control-center/treasury/digitalSettlementReceiptAdmissionState";

import {
  prisma,
} from "@/infrastructure/db/prisma";

type RouteContext =
  Readonly<{
    params:
      Promise<{
        reference:
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
            DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.UNAUTHENTICATED,

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
            DIGITAL_SETTLEMENT_TREASURY_ADMISSION_STATE.PERMISSION_DENIED,

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
    reference,
  } =
    await context.params;

  const result =
    await getDigitalSettlementRecognitionReceiptCandidateHttp({
      rawInstrumentReference:
        reference,

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
